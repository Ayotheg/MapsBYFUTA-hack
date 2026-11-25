import { useMemo, useState } from 'react';
import BaseMap from './components/BaseMap';
import { EventCard } from './components/events';
import ExplorePanel from './components/explore/ExplorePanel';
import WaypointMarkers from './components/map/WaypointMarkers';
import ZoomHintOverlay from './components/map/ZoomHintOverlay';
import { MeetMeModal } from './components/meet';
import Navbar from './components/Navbar';
import {
  ArrivalModal,
  NavDestPanel,
  NavHud,
} from './components/navigation';
import { PromotePanel } from './components/promote';
import SearchBar from './components/search/SearchBar';
import SignalPanel from './components/signal/SignalPanel';
import { SuggestPanel } from './components/suggest';
import PlaceCard from './components/waypoints/PlaceCard';
import { useExploreData } from './hooks/useExploreData';
import { useGpsTracking } from './hooks/useGpsTracking';
import { useMeetMe } from './hooks/useMeetMe';
import { useNavigation } from './hooks/useNavigation';
import { useSuggestedPlaces } from './hooks/useSuggestedPlaces';
import './App.css';

function App() {
  const [mapInstance, setMapInstance] = useState(null);
  const [activeTab, setActiveTab] = useState('explore');
  const [exploreMobileExpanded, setExploreMobileExpanded] = useState(false);
  const [signalMobileExpanded, setSignalMobileExpanded] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [promoteOpen, setPromoteOpen] = useState(false);
  const [promoteKind, setPromoteKind] = useState('place');
  const [pickingOnMap, setPickingOnMap] = useState(false);
  const [pickedCoords, setPickedCoords] = useState(null);

  const {
    places: apiPlaces,
    featuredPlaces,
    popularPlaces,
    channels,
    events,
    people,
    loading,
    error,
  } = useExploreData();

  const {
    suggestedPlaces,
    addSuggestedPlace,
    removeSuggestedPlace,
  } = useSuggestedPlaces();

  // Suggested waypoints enter the map, search, and navigation automatically
  const places = useMemo(
    () => [...suggestedPlaces, ...apiPlaces],
    [suggestedPlaces, apiPlaces]
  );

  const gps = useGpsTracking({
    map: mapInstance,
    places,
  });

  const nav = useNavigation({
    map: mapInstance,
    places,
    gps,
  });

  const meet = useMeetMe({
    map: mapInstance,
    userCoords: gps.lastCoords,
  });

  function closeSuggest() {
    setSuggestOpen(false);
    setPickingOnMap(false);
    setPickedCoords(null);
  }

  function handleOpenSuggest() {
    if (nav.navActive) return;
    setPromoteOpen(false);
    setSelectedPlace(null);
    setSelectedEvent(null);
    setExploreMobileExpanded(false);
    setSignalMobileExpanded(false);
    setActiveTab(null);
    nav.closeNavPicker();
    setPickingOnMap(false);
    setSuggestOpen(true);
  }

  function handleOpenPromote(kind = 'place') {
    if (nav.navActive) return;
    closeSuggest();
    setSelectedPlace(null);
    setSelectedEvent(null);
    setExploreMobileExpanded(false);
    setSignalMobileExpanded(false);
    setActiveTab(null);
    nav.closeNavPicker();
    setPromoteKind(kind);
    setPromoteOpen(true);
  }

  function handleTabChange(nextTab) {
    closeSuggest();
    setPromoteOpen(false);
    setSelectedEvent(null);

    if (nextTab === 'explore' && activeTab === 'explore') {
      if (window.innerWidth < 768 && !exploreMobileExpanded) {
        setExploreMobileExpanded(true);
        return;
      }
      setExploreMobileExpanded(false);
      setActiveTab(null);
      return;
    }

    if (nextTab === 'signal' && activeTab === 'signal') {
      if (window.innerWidth < 768 && !signalMobileExpanded) {
        setSignalMobileExpanded(true);
        return;
      }
      setSignalMobileExpanded(false);
      setActiveTab(null);
      return;
    }

    if (nextTab && nextTab !== 'navigate') {
      setSelectedPlace(null);
      nav.closeNavPicker();
    }
    setExploreMobileExpanded(false);
    setSignalMobileExpanded(false);
    setActiveTab(nextTab);
  }

  function handleNavigateAction(action) {
    if (action === 'navigate') {
      closeSuggest();
      meet.closeModal();
      setSelectedPlace(null);
      setSelectedEvent(null);
      setExploreMobileExpanded(false);
      setSignalMobileExpanded(false);
      setActiveTab('navigate');
      nav.openNavPicker();
      return;
    }

    if (action === 'meet') {
      closeSuggest();
      nav.closeNavPicker();
      setSelectedPlace(null);
      setSelectedEvent(null);
      setExploreMobileExpanded(false);
      setSignalMobileExpanded(false);
      setActiveTab(null);
      meet.openHostLobby();
    }
  }

  function handleSelectPlace(place) {
    if (pickingOnMap) return;
    closeSuggest();
    setSelectedEvent(null);
    setSelectedPlace(place);
    if (place) {
      setActiveTab(null);
      setExploreMobileExpanded(false);
      setSignalMobileExpanded(false);
      if (!nav.navActive) {
        nav.closeNavPicker();
      }
    }
  }

  function handleSelectEvent(event) {
    if (!event) return;
    closeSuggest();
    setSelectedPlace(null);
    setActiveTab(null);
    setExploreMobileExpanded(false);
    setSignalMobileExpanded(false);
    setSelectedEvent(event);
  }

  function handleNavigateToEventVenue(event) {
    setSelectedEvent(null);
    const venueLower = (event?.venue || '').toLowerCase().trim();
    const matchedPlace =
      venueLower &&
      places.find((p) => {
        const name = (p.name || '').toLowerCase();
        return (
          Number.isFinite(p.lat) &&
          Number.isFinite(p.lng) &&
          (name.includes(venueLower) || venueLower.includes(name))
        );
      });
    setActiveTab('navigate');
    nav.openNavPicker(matchedPlace || null);
  }

  function handleNavigateToPlace(place) {
    closeSuggest();
    setSelectedEvent(null);
    setSelectedPlace(null);
    setExploreMobileExpanded(false);
    setSignalMobileExpanded(false);
    setActiveTab('navigate');
    nav.openNavPicker(place);
  }

  function handleMapClick(latlng) {
    if (pickingOnMap && latlng) {
      setPickedCoords({ lat: latlng.lat, lng: latlng.lng });
      setPickingOnMap(false);
      return;
    }
    setSelectedPlace(null);
    setSelectedEvent(null);
  }

  const showDestPanel = nav.destPanelOpen && !nav.navActive;
  const showSuggestPanel = suggestOpen && !nav.navActive;
  const showPromotePanel = promoteOpen && !nav.navActive;
  const desktopPanelOpen =
    !nav.navActive &&
    (activeTab === 'explore' ||
      activeTab === 'signal' ||
      showDestPanel ||
      showPromotePanel ||
      (showSuggestPanel && !pickingOnMap) ||
      Boolean(selectedPlace) ||
      Boolean(selectedEvent));

  return (
    <div className="map-workspace">
      <BaseMap
        selectedPlace={selectedPlace}
        pickingLocation={pickingOnMap}
        pickedCoords={showSuggestPanel ? pickedCoords : null}
        onMapReady={setMapInstance}
        onMapClick={handleMapClick}
      />

      <WaypointMarkers
        map={mapInstance}
        places={places}
        selectedPlaceId={selectedPlace?.id ?? null}
        onSelectPlace={handleSelectPlace}
      />

      <ZoomHintOverlay
        map={mapInstance}
        hidden={nav.navActive || meet.modalOpen || showSuggestPanel || pickingOnMap}
      />

      <Navbar
        activeTab={nav.navActive || showDestPanel ? 'navigate' : activeTab}
        navActive={nav.navActive}
        navDot={Boolean(meet.session)}
        onTabChange={handleTabChange}
        onNavigateAction={handleNavigateAction}
        onSuggestClick={handleOpenSuggest}
      />

      <ExplorePanel
        open={!nav.navActive && !showSuggestPanel && !showPromotePanel && activeTab === 'explore'}
        mobileExpanded={exploreMobileExpanded}
        onExpandMobile={() => setExploreMobileExpanded(true)}
        onClose={() => {
          setExploreMobileExpanded(false);
          setActiveTab(null);
        }}
        featuredPlaces={featuredPlaces}
        popularPlaces={popularPlaces}
        allPlaces={places}
        channels={channels}
        events={events}
        people={people}
        loading={loading}
        error={error}
        onSelectPlace={handleSelectPlace}
        onSelectEvent={handleSelectEvent}
        onSuggestClick={handleOpenSuggest}
        onPromotePlace={() => handleOpenPromote('place')}
        onPromoteEvent={() => handleOpenPromote('event')}
      />

      <PromotePanel
        open={showPromotePanel}
        initialKind={promoteKind}
        onClose={() => setPromoteOpen(false)}
      />

      <SignalPanel
        open={!nav.navActive && !showSuggestPanel && activeTab === 'signal'}
        activeBars={gps.activeBars}
        tier={gps.tier}
        badgeText={gps.badgeText}
        accuracyText={gps.accuracyText}
        speedText={gps.speedText}
        headingText={gps.headingText}
        warningText={gps.warningText}
        buttonLabel={gps.buttonLabel}
        isTracking={gps.isTracking}
        isFollowing={gps.isFollowing}
        canFollow={gps.canFollow}
        mobileExpanded={signalMobileExpanded}
        onMobileExpandedChange={setSignalMobileExpanded}
        onLocateClick={gps.toggleLocate}
        onToggleFollow={gps.toggleFollow}
        onClose={() => {
          setSignalMobileExpanded(false);
          setActiveTab(null);
        }}
      />

      <SuggestPanel
        open={showSuggestPanel}
        pickingOnMap={pickingOnMap}
        pickedCoords={pickedCoords}
        userCoords={gps.lastCoords}
        submissions={suggestedPlaces}
        onStartPickOnMap={() => setPickingOnMap(true)}
        onCancelPickOnMap={() => setPickingOnMap(false)}
        onClearPickedCoords={() => setPickedCoords(null)}
        onSubmitPlace={addSuggestedPlace}
        onSelectSubmission={(place) => {
          closeSuggest();
          setSelectedPlace(place);
        }}
        onDeleteSubmission={(id) => {
          removeSuggestedPlace(id);
          if (selectedPlace?.id === id) setSelectedPlace(null);
        }}
        onClose={closeSuggest}
      />

      <NavDestPanel
        key={nav.destination?.id || 'pick'}
        open={showDestPanel}
        places={places}
        popularPlaces={popularPlaces}
        selectedDestination={nav.destination}
        onSelectDestination={nav.setDestination}
        travelMode={nav.travelMode}
        onTravelModeChange={nav.setTravelMode}
        userCoords={gps.lastCoords}
        loading={nav.loadingRoute}
        error={nav.routeError}
        onStart={nav.startNavigation}
        onClose={() => {
          nav.closeNavPicker();
          setActiveTab(null);
        }}
      />

      {nav.navActive && (
        <NavHud
          status={nav.hudState.status}
          turnIcon={nav.hudState.turnIcon}
          instruction={nav.hudState.instruction}
          stepDistance={nav.hudState.stepDistance}
          nextInstruction={nav.hudState.nextInstruction}
          distanceRemaining={nav.hudState.distanceRemaining}
          destinationName={nav.destination?.name || 'Destination'}
          voiceEnabled={nav.voiceEnabled}
          hideDistance={Boolean(selectedPlace)}
          routeUp={nav.routeUp}
          mapBearing={nav.mapBearing}
          nearbyItems={nav.nearbyItems}
          onToggleVoice={nav.toggleVoice}
          onEnd={() => {
            nav.endNavigation();
            setActiveTab(null);
          }}
          onToggleRouteUp={nav.toggleRouteUp}
          onSelectNearby={(place) => setSelectedPlace(place)}
        />
      )}

      <MeetMeModal
        open={meet.modalOpen && !nav.navActive}
        mode={meet.mode}
        session={meet.session}
        minutesLeft={meet.minutesLeft}
        joinError={meet.joinError}
        places={places}
        popularPlaces={popularPlaces}
        onModeChange={meet.setMode}
        onJoinCode={meet.joinWithCode}
        onClearJoinError={() => meet.setJoinError('')}
        onSetMeetingPoint={meet.setMeetingPoint}
        onNavigateToMeetingPoint={(meetingPoint) => {
          meet.closeModal();
          setActiveTab('navigate');
          nav.openNavPicker(meetingPoint);
        }}
        onOpenModal={meet.openHostLobby}
        onClose={meet.closeModal}
        onLeave={meet.leaveSession}
      />

      <ArrivalModal
        open={Boolean(nav.arrivedDest)}
        destinationName={nav.arrivedDest?.name || 'Destination Reached'}
        onDone={() => {
          nav.dismissArrival();
          setActiveTab(null);
        }}
      />

      {selectedEvent && !nav.navActive && (
        <EventCard
          key={selectedEvent.id}
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onNavigateToVenue={handleNavigateToEventVenue}
        />
      )}

      {selectedPlace && (
        <PlaceCard
          key={selectedPlace.id}
          place={selectedPlace}
          onClose={() => setSelectedPlace(null)}
          onNavigate={handleNavigateToPlace}
        />
      )}

      {!nav.navActive && !pickingOnMap && (
        <SearchBar
          places={places}
          panelOpen={desktopPanelOpen}
          onSelectPlace={handleSelectPlace}
          onNavigateClick={() => handleNavigateAction('navigate')}
        />
      )}
    </div>
  );
}

export default App;
