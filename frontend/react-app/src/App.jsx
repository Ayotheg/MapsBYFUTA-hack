import { useState } from 'react';
import BaseMap from './components/BaseMap';
import ExplorePanel from './components/explore/ExplorePanel';
import Navbar from './components/Navbar';
import SearchBar from './components/search/SearchBar';
import { useExploreData } from './hooks/useExploreData';
import './App.css';

function App() {
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

    setExploreMobileExpanded(false);
    setActiveTab(nextTab);
  }

  function handleSelectPlace(place) {
    setSelectedPlace(place);
    if (window.innerWidth < 768) {
      setActiveTab(null);
      setExploreMobileExpanded(false);
    }
  }

  return (
    <div className="map-workspace">
      <BaseMap selectedPlace={selectedPlace} />

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

      <SearchBar
        places={places}
        panelOpen={activeTab === 'explore'}
        onSelectPlace={handleSelectPlace}
        onNavigateClick={() => setActiveTab('navigate')}
      />
    </div>
  );
}

export default App;
