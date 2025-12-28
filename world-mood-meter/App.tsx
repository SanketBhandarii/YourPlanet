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

  useEffect(() => {
    fetchLatestSummary().then(setSummary);
    
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
        },
        () => console.warn("Location access denied")
      );
    }
  }, []);

  const handleLocationSelect = useCallback(async (loc: LocationData) => {
    setIsLoading(true);
    try {
      const details = await reverseGeocode(loc.latitude, loc.longitude);
      setSelectedLocation({
        ...loc,
        city: details.city || "",
        principalSubdivision: details.principalSubdivision || "",
        countryName: details.countryName || loc.countryName || "UNKNOWN",
        continent: details.continent || loc.continent || "GLOBAL"
      });
    } catch (e) {
      setSelectedLocation(loc);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleVibeSubmitted = useCallback((loc: LocationData) => {
    setNewVibeLocation({ ...loc });
  }, []);

  return (
    <div className="flex flex-col md:flex-row w-screen h-screen bg-transparent overflow-hidden selection:bg-white selection:text-black">
      
      <main className="relative flex-1 h-[40vh] md:h-full order-1 overflow-hidden">
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
        
        <div className="absolute bottom-8 left-8 hidden md:block pointer-events-none z-20">
          <div className="p-5 border-l border-white/20 backdrop-blur-sm bg-black/20 rounded-r-lg">
            <div className="space-y-1">
              <div className="text-[20px] text-white font-bold tracking-wider">
                {selectedLocation?.countryName || "---"}
              </div>
              <div className="text-[20px] text-gray-500 ">
                {selectedLocation?.principalSubdivision ? `${selectedLocation.principalSubdivision}, ` : ""}
                {selectedLocation?.city || "NO ZONE"}
              </div>
            </div>
            <div className="text-[20px] text-white/30 font-mono">
              {selectedLocation?.latitude.toFixed(4) || "0.0000"} / {selectedLocation?.longitude.toFixed(4) || "0.0000"}
            </div>
          </div>
        </div>

        <div className="absolute top-8 left-8 pointer-events-none z-20">
          <div className="text-[20px] font-black text-white uppercase bg-sky-900 p-2 rounded-sm">
             Your Planet
          </div>
        </div>
      </main>

      <aside className="w-full md:w-[480px] h-[60vh] md:h-full order-2 z-20 bg-black/70 backdrop-blur-3xl border-t md:border-t-0 md:border-l border-white/10 flex flex-col shadow-[-30px_0_60px_rgba(0,0,0,0.8)] overflow-hidden">
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