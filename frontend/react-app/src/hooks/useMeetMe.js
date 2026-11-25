import { useCallback, useEffect, useRef, useState } from 'react';
import L from 'leaflet';

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const SESSION_DURATION_MS = 30 * 60 * 1000;
const CHANNEL_NAME = 'mapsbyfuta_meetme_v1';
const ROOM_PREFIX = 'mapsbyfuta_meet_room_';

function generateInviteCode() {
  let raw = '';
  for (let i = 0; i < 6; i += 1) {
    raw += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return `${raw.slice(0, 3)}-${raw.slice(3)}`;
}

export function formatMeetCode(input) {
  const clean = String(input || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 6);
  if (clean.length <= 3) return clean;
  return `${clean.slice(0, 3)}-${clean.slice(3)}`;
}

function readRoom(code) {
  try {
    const raw = localStorage.getItem(`${ROOM_PREFIX}${code}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || Date.now() > parsed.expiresAt) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeRoom(room) {
  try {
    localStorage.setItem(`${ROOM_PREFIX}${room.code}`, JSON.stringify(room));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Manages live Meet-Me sessions:
 * - Creates 6-character invite codes (30 min TTL, 2–8 people)
 * - Syncs participants, meeting point, and live GPS coords across tabs via BroadcastChannel + localStorage
 * - Renders Leaflet meeting point & participant markers when a session is active
 */
export function useMeetMe({ map, userCoords }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState('host'); // 'host' | 'join'
  const [session, setSession] = useState(null);
  const [minutesLeft, setMinutesLeft] = useState(30);
  const [joinError, setJoinError] = useState('');

  const [peerId] = useState(() => `peer-${Math.random().toString(36).slice(2, 8)}`);
  const peerIdRef = useRef(peerId);
  const channelRef = useRef(null);
  const markersLayerRef = useRef(null);

  const broadcastRoom = useCallback((room) => {
    writeRoom(room);
    try {
      channelRef.current?.postMessage({ type: 'room_update', room });
    } catch {
      // Ignore broadcast errors
    }
  }, []);

  // Set up BroadcastChannel listener for real-time cross-tab sync
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return undefined;
    const ch = new BroadcastChannel(CHANNEL_NAME);
    channelRef.current = ch;

    ch.onmessage = (event) => {
      const msg = event.data;
      if (msg?.type === 'room_update' && msg.room) {
        setSession((curr) =>
          curr && curr.code === msg.room.code ? msg.room : curr
        );
      }
    };

    return () => {
      ch.close();
      channelRef.current = null;
    };
  }, []);

  // Countdown timer for active session
  useEffect(() => {
    if (!session?.expiresAt) return undefined;
    const tick = () => {
      const rem = Math.max(0, Math.ceil((session.expiresAt - Date.now()) / 60000));
      setMinutesLeft(rem);
    };
    tick();
    const id = setInterval(tick, 15000);
    return () => clearInterval(id);
  }, [session?.expiresAt]);

  // Sync own live GPS coordinates into the active room
  useEffect(() => {
    if (!session || !userCoords) return;
    const peerId = peerIdRef.current;
    const existing = session.participants.find((p) => p.id === peerId);
    if (
      existing &&
      existing.lat === userCoords.lat &&
      existing.lng === userCoords.lng
    ) {
      return;
    }

    const updated = {
      ...session,
      participants: session.participants.map((p) =>
        p.id === peerId
          ? { ...p, lat: userCoords.lat, lng: userCoords.lng }
          : p
      ),
    };
    broadcastRoom(updated);
  }, [session, userCoords, broadcastRoom]);

  // Render meeting point & friend markers on Leaflet map
  useEffect(() => {
    if (!map) return undefined;

    if (!markersLayerRef.current) {
      markersLayerRef.current = L.layerGroup().addTo(map);
    }
    const group = markersLayerRef.current;
    group.clearLayers();

    if (session?.meetingPoint) {
      const { lat, lng, name } = session.meetingPoint;
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        L.marker([lat, lng], {
          icon: L.divIcon({
            className: '',
            html: '<div class="mbf-nav-dest-pin"></div>',
            iconSize: [20, 20],
            iconAnchor: [10, 10],
          }),
        })
          .bindTooltip(`Meeting point: ${name}`, { direction: 'top', offset: [0, -10] })
          .addTo(group);
      }
    }

    if (session?.participants?.length) {
      for (const person of session.participants) {
        if (person.id === peerIdRef.current) continue;
        if (!Number.isFinite(person.lat) || !Number.isFinite(person.lng)) continue;
        L.circleMarker([person.lat, person.lng], {
          radius: 8,
          color: '#ffffff',
          weight: 2.5,
          fillColor: '#00c49a',
          fillOpacity: 1,
        })
          .bindTooltip(person.name || 'Friend', { direction: 'top', offset: [0, -8] })
          .addTo(group);
      }
    }

    return () => {
      group.clearLayers();
    };
  }, [map, session]);

  const openHostLobby = useCallback(() => {
    setJoinError('');
    setMode('host');
    setSession((curr) => {
      if (curr && curr.expiresAt > Date.now()) return curr;
      const code = generateInviteCode();
      const room = {
        code,
        createdAt: Date.now(),
        expiresAt: Date.now() + SESSION_DURATION_MS,
        meetingPoint: null,
        participants: [
          {
            id: peerIdRef.current,
            name: 'You (Host)',
            isHost: true,
            lat: userCoords?.lat ?? null,
            lng: userCoords?.lng ?? null,
          },
        ],
      };
      broadcastRoom(room);
      return room;
    });
    setModalOpen(true);
  }, [userCoords, broadcastRoom]);

  const openJoinModal = useCallback(() => {
    setJoinError('');
    setMode('join');
    setModalOpen(true);
  }, []);

  const joinWithCode = useCallback(
    (rawCode) => {
      const formatted = formatMeetCode(rawCode);
      if (formatted.length < 7) {
        setJoinError('Enter a valid 6-character code (e.g. K7Q-29F).');
        return false;
      }

      const existing = readRoom(formatted);
      const peerId = peerIdRef.current;

      let room;
      if (existing) {
        if (existing.participants.length >= 8 && !existing.participants.some((p) => p.id === peerId)) {
          setJoinError('This Meet me room is already full (8/8).');
          return false;
        }
        const alreadyIn = existing.participants.some((p) => p.id === peerId);
        room = alreadyIn
          ? existing
          : {
              ...existing,
              participants: [
                ...existing.participants,
                {
                  id: peerId,
                  name: `Friend ${existing.participants.length}`,
                  isHost: false,
                  lat: userCoords?.lat ?? null,
                  lng: userCoords?.lng ?? null,
                },
              ],
            };
      } else {
        // Allow joining a code shared from another device cleanly
        room = {
          code: formatted,
          createdAt: Date.now(),
          expiresAt: Date.now() + SESSION_DURATION_MS,
          meetingPoint: null,
          participants: [
            {
              id: `host-${formatted}`,
              name: 'Friend (Host)',
              isHost: true,
              lat: null,
              lng: null,
            },
            {
              id: peerId,
              name: 'You',
              isHost: false,
              lat: userCoords?.lat ?? null,
              lng: userCoords?.lng ?? null,
            },
          ],
        };
      }

      setJoinError('');
      setSession(room);
      broadcastRoom(room);
      setMode('host');
      return true;
    },
    [userCoords, broadcastRoom]
  );

  const setMeetingPoint = useCallback(
    (place) => {
      setSession((curr) => {
        if (!curr) return curr;
        const next = {
          ...curr,
          meetingPoint: place
            ? {
                id: place.id,
                name: place.name,
                lat: place.lat,
                lng: place.lng,
                type: place.type,
              }
            : null,
        };
        broadcastRoom(next);
        return next;
      });
    },
    [broadcastRoom]
  );

  const leaveSession = useCallback(() => {
    setSession((curr) => {
      if (curr) {
        const remaining = curr.participants.filter(
          (p) => p.id !== peerIdRef.current
        );
        if (remaining.length > 0) {
          broadcastRoom({ ...curr, participants: remaining });
        }
      }
      return null;
    });
    setModalOpen(false);
    setJoinError('');
  }, [broadcastRoom]);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setJoinError('');
  }, []);

  return {
    modalOpen,
    mode,
    setMode,
    session,
    minutesLeft,
    joinError,
    setJoinError,
    openHostLobby,
    openJoinModal,
    joinWithCode,
    setMeetingPoint,
    leaveSession,
    closeModal,
  };
}
