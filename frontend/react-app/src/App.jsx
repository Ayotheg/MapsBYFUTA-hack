import { useState } from 'react';
import BaseMap from './components/BaseMap';
import ExplorePanel from './components/explore/ExplorePanel';
import WaypointMarkers from './components/map/WaypointMarkers';
import Navbar from './components/Navbar';
import SearchBar from './components/search/SearchBar';
import PlaceCard from './components/waypoints/PlaceCard';
import { useExploreData } from './hooks/useExploreData';
import './App.css';

function App() {
  const [mapInstance, setMapInstance] = useState(null);
  const [activeTab, setActiveTab] = useState('explore');
  const [exploreMobileExpanded, setExploreMobileExpanded] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);

  const {
    places,
    featuredPlaces,
    popularPlaces,
    channels,
    events,
    people,
    loading,
    error,
  } = useExploreData();

  function handleTabChange(nextTab) {
    if (nextTab === 'explore' && activeTab === 'explore') {
      if (window.innerWidth < 768 && !exploreMobileExpanded) {
        setExploreMobileExpanded(true);
        return;
      }
      setExploreMobileExpanded(false);
      setActiveTab(null);
      return;
    }

    if (nextTab) {
      setSelectedPlace(null);
    }
    setExploreMobileExpanded(false);
    setActiveTab(nextTab);
  }

  function handleSelectPlace(place) {
    setSelectedPlace(place);
    if (place) {
      setActiveTab(null);
      setExploreMobileExpanded(false);
    }
  }

  const desktopPanelOpen = activeTab === 'explore' || Boolean(selectedPlace);

  return (
    <div className="map-workspace">
      <BaseMap
        selectedPlace={selectedPlace}
        onMapReady={setMapInstance}
        onMapClick={() => setSelectedPlace(null)}
      />

      <WaypointMarkers
        map={mapInstance}
        places={places}
        selectedPlaceId={selectedPlace?.id ?? null}
        onSelectPlace={handleSelectPlace}
      />

      <Navbar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onNavigateAction={() => setActiveTab('navigate')}
      />

      <ExplorePanel
        open={activeTab === 'explore'}
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
      />

      {selectedPlace && (
        <PlaceCard
          key={selectedPlace.id}
          place={selectedPlace}
          onClose={() => setSelectedPlace(null)}
          onNavigate={() => setActiveTab('navigate')}
        />
      )}

      <SearchBar
        places={places}
        panelOpen={desktopPanelOpen}
        onSelectPlace={handleSelectPlace}
        onNavigateClick={() => setActiveTab('navigate')}
      />
    </div>
  );
}

export default App;
