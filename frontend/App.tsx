import React, { useEffect, useState, useCallback } from 'react';
import GlobeViz from './components/GlobeViz';
import InfoPanel from './components/InfoPanel';
import { fetchLatestSummary, reverseGeocode } from './services/api';
import { SummaryData, LocationData } from './types';
import { SparklesCore } from './components/ui/sparkles';

function App() {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);
  const [newVibeLocation, setNewVibeLocation] = useState<LocationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationPermission, setLocationPermission] = useState<'pending' | 'granted' | 'denied'>('pending');
  const [manualCity, setManualCity] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [showManualSearch, setShowManualSearch] = useState(false);

  useEffect(() => {
    fetchLatestSummary().then(setSummary);

    const savedLocation = localStorage.getItem('userLocation');
    if (savedLocation) {
      const loc = JSON.parse(savedLocation);
      setSelectedLocation(loc);
      setShowLocationModal(false);
    } else {
      setShowLocationModal(true);
    }
  }, []);

  const saveLocationToStorage = (loc: LocationData) => {
    localStorage.setItem('userLocation', JSON.stringify(loc));
  };

  const handleAllowLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          const details = await reverseGeocode(latitude, longitude);
          const loc = {
            latitude,
            longitude,
            city: details.city || "",
            principalSubdivision: details.principalSubdivision || "",
            countryName: details.countryName || "UNKNOWN",
            continent: details.continent || ""
          };
          setSelectedLocation(loc);
          saveLocationToStorage(loc);
          setLocationPermission('granted');
          setShowLocationModal(false);
        },
        () => {
          setLocationPermission('denied');
          setShowManualInput(true);
        }
      );
    }
  };

  const handleDenyLocation = () => {
    setLocationPermission('denied');
    setShowManualInput(true);
  };

  const handleManualLocationSubmit = async () => {
    if (!manualCity.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(manualCity)}&count=1&language=en&format=json`);
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        const loc = {
          latitude: result.latitude,
          longitude: result.longitude,
          city: result.name || manualCity,
          principalSubdivision: result.admin1 || "",
          countryName: result.country || "UNKNOWN",
          continent: ""
        };
        setSelectedLocation(loc);
        saveLocationToStorage(loc);
        setShowLocationModal(false);
        setShowManualSearch(false);
        setManualCity('');
      }
    } catch (e) {
      console.error('Geocoding failed:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLocationSelect = useCallback(async (loc: LocationData) => {
    setIsLoading(true);
    try {
      const details = await reverseGeocode(loc.latitude, loc.longitude);
      const updatedLoc = {
        ...loc,
        city: details.city || "",
        principalSubdivision: details.principalSubdivision || "",
        countryName: details.countryName || loc.countryName || "UNKNOWN",
        continent: details.continent || loc.continent || "GLOBAL"
      };
      setSelectedLocation(updatedLoc);
      saveLocationToStorage(updatedLoc);
    } catch (e) {
      setSelectedLocation(loc);
      saveLocationToStorage(loc);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleVibeSubmitted = useCallback((loc: LocationData) => {
    setNewVibeLocation({ ...loc });
  }, []);

  const openManualSearch = () => {
    setShowManualSearch(true);
    setManualCity('');
  };

  return (
    <div className="flex flex-col md:flex-row w-screen h-screen bg-transparent overflow-hidden selection:bg-white selection:text-black">
      {showLocationModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-xl">
          <div className="absolute inset-0">
            <SparklesCore
              id="modal-sparkles"
              background="transparent"
              minSize={0.4}
              maxSize={1}
              particleDensity={50}
              className="w-full h-full"
              particleColor="#FFFFFF"
            />
          </div>
          
          <div className="relative w-full max-w-md mx-4 p-8 bg-black/70 border border-white/10 rounded-lg backdrop-blur-3xl">
            <div className="text-center space-y-6">
              <div className="text-2xl font-black text-white uppercase tracking-widest">
                Location Access
              </div>
              
              {locationPermission === 'pending' && (
                <div className="space-y-4">
                  <p className="text-white/70 text-sm">
                    We need your location to show you the world vibe around you
                  </p>
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={handleAllowLocation}
                      className="w-full px-6 py-3 bg-sky-900/80 hover:bg-sky-800 text-white font-bold uppercase tracking-wider border border-white/10 rounded cursor-pointer transition-all"
                    >
                      Allow Location
                    </button>
                    <button
                      onClick={handleDenyLocation}
                      className="w-full px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-bold uppercase tracking-wider border border-white/10 rounded cursor-pointer transition-all"
                    >
                      Enter Manually
                    </button>
                  </div>
                </div>
              )}

              {showManualInput && (
                <div className="space-y-4">
                  <p className="text-white/70 text-sm">
                    {locationPermission === 'denied' ? 'Location access denied. ' : ''}
                    Enter your city name
                  </p>
                  <input
                    type="text"
                    value={manualCity}
                    onChange={(e) => setManualCity(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleManualLocationSubmit()}
                    placeholder="City name"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded text-white placeholder-white/30 focus:outline-none focus:border-white/30"
                  />
                  <button
                    onClick={handleManualLocationSubmit}
                    disabled={!manualCity.trim()}
                    className="w-full px-6 py-3 bg-sky-900/80 hover:bg-sky-800 disabled:bg-white/5 disabled:cursor-not-allowed text-white font-bold uppercase tracking-wider border border-white/10 rounded cursor-pointer transition-all"
                  >
                    Continue
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showManualSearch && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-xl">
          <div className="absolute inset-0">
            <SparklesCore
              id="search-sparkles"
              background="transparent"
              minSize={0.4}
              maxSize={1}
              particleDensity={50}
              className="w-full h-full"
              particleColor="#FFFFFF"
            />
          </div>
          
          <div className="relative w-full max-w-md mx-4 p-8 bg-black/70 border border-white/10 rounded-lg backdrop-blur-3xl">
            <div className="text-center space-y-6">
              <div className="text-2xl font-black text-white uppercase tracking-widest">
                Search Location
              </div>
              
              <div className="space-y-4">
                <p className="text-white/70 text-sm">
                  Enter city name to change your location
                </p>
                <input
                  type="text"
                  value={manualCity}
                  onChange={(e) => setManualCity(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleManualLocationSubmit()}
                  placeholder="City name"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded text-white placeholder-white/30 focus:outline-none focus:border-white/30"
                  autoFocus
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowManualSearch(false);
                      setManualCity('');
                    }}
                    className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-bold uppercase tracking-wider border border-white/10 rounded cursor-pointer transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleManualLocationSubmit}
                    disabled={!manualCity.trim()}
                    className="flex-1 px-6 py-3 bg-sky-900/80 hover:bg-sky-800 disabled:bg-white/5 disabled:cursor-not-allowed text-white font-bold uppercase tracking-wider border border-white/10 rounded cursor-pointer transition-all"
                  >
                    Search
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="relative flex-1 h-[50vh] md:h-full order-1 overflow-hidden">
        <SparklesCore
          id="tsparticlesfullpage"
          background="transparent"
          minSize={0.6}
          maxSize={1.4}
          particleDensity={100}
          className="w-full h-full absolute"
          particleColor="#FFFFFF"
        />
        <GlobeViz
          onLocationSelect={handleLocationSelect}
          newVibeLocation={newVibeLocation}
          selectedLocation={selectedLocation}
        />

        <div className="absolute bottom-4 left-4 md:bottom-8 md:left-8 pointer-events-none z-20 max-w-[70%]">
          <div className="p-3 md:p-5 border-l border-white/20 backdrop-blur-sm bg-black/20 rounded-r-lg">
            <div className="space-y-1">
              <div className="text-[12px] md:text-[20px] text-white font-bold tracking-wider truncate">
                {selectedLocation?.countryName || "---"}
              </div>
              <div className="text-[10px] md:text-[20px] text-gray-500 truncate">
                {selectedLocation?.principalSubdivision ? `${selectedLocation.principalSubdivision}, ` : ""}
                {selectedLocation?.city || "NO ZONE"}
              </div>
            </div>
            <div className="text-[10px] md:text-[20px] text-white/30 font-mono mt-1 md:mt-0">
              {selectedLocation?.latitude.toFixed(4) || "0.0000"} / {selectedLocation?.longitude.toFixed(4) || "0.0000"}
            </div>
          </div>
        </div>

        <div className="absolute top-4 left-4 md:top-8 md:left-8 pointer-events-auto z-20 flex items-center gap-3">
          <div className="text-[12px] md:text-[20px] font-black text-white uppercase bg-sky-900/80 backdrop-blur-md px-3 py-1 md:p-2 rounded-sm border border-white/10 tracking-widest">
            Your Planet
          </div>
          <button
            onClick={openManualSearch}
            className="text-[10px] md:text-[14px] font-bold text-white uppercase bg-white/5 hover:bg-white/10 backdrop-blur-md px-2 py-1 md:px-3 md:py-2 rounded-sm border border-white/10 tracking-wider cursor-pointer transition-all"
            title="Search Location"
          >
            📍 Search
          </button>
        </div>
      </main>

      <aside className="w-full md:w-[480px] h-[50vh] md:h-full order-2 z-20 bg-black/70 backdrop-blur-3xl border-t md:border-t-0 md:border-l border-white/10 flex flex-col shadow-[-30px_0_60px_rgba(0,0,0,0.8)] overflow-hidden">
        <InfoPanel
          summary={summary}
          selectedLocation={selectedLocation}
          onVibeSubmitted={handleVibeSubmitted}
        />
      </aside>

      {isLoading && (
        <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center">
          <div className="w-20 h-20 border border-white/10 rounded-full animate-ping"></div>
          <div className="absolute text-[8px] text-white uppercase tracking-[1em] font-black animate-pulse">SYNC</div>
        </div>
      )}
    </div>
  );
}

export default App;