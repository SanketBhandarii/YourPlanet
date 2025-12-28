import React, { useEffect, useRef, useState, useCallback } from 'react';
import Globe, { GlobeMethods } from 'react-globe.gl';
import { LocationData } from '../types';

interface GlobeVizProps {
  onLocationSelect: (loc: LocationData) => void;
  newVibeLocation: LocationData | null;
  selectedLocation: LocationData | null;
}

const GlobeViz: React.FC<GlobeVizProps> = ({ onLocationSelect, newVibeLocation, selectedLocation }) => {
  const globeEl = useRef<GlobeMethods | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);
  const [countries, setCountries] = useState({ features: [] });
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Perfect Resize Handling
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };
    const resizeObserver = new ResizeObserver(handleResize);
    if (containerRef.current) resizeObserver.observe(containerRef.current);
    handleResize();
    return () => resizeObserver.disconnect();
  }, []);

  // Fetch High-Res Borders
  useEffect(() => {
    fetch('https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson')
      .then(res => res.json())
      .then(setCountries);
  }, []);

  // Globe Setup
  useEffect(() => {
    if (globeEl.current) {
      const controls = globeEl.current.controls();
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.5;
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.minDistance = 180;
      controls.maxDistance = 800;
    }
  }, []);

  // Cinematic Drill-Down Logic
  useEffect(() => {
    if (selectedLocation && globeEl.current) {
      const targetAltitude = selectedLocation.city ? 0.4 : 1.1;
      globeEl.current.pointOfView({
        lat: selectedLocation.latitude,
        lng: selectedLocation.longitude,
        altitude: targetAltitude
      }, 1800);

      const controls = globeEl.current.controls();
      controls.autoRotate = false;
      const timeout = setTimeout(() => {
        controls.autoRotate = true;
      }, 12000);
      return () => clearTimeout(timeout);
    }
  }, [selectedLocation]);

  const [activeNodes, setActiveNodes] = useState<any[]>([]);

  // Simulate "Any User" Activity (Ghost Nodes)
  useEffect(() => {
    const interval = setInterval(() => {
      const newNode = {
        latitude: (Math.random() - 0.5) * 140,
        longitude: (Math.random() - 0.5) * 360,
        id: Math.random(),
        isGhost: true
      };
      setActiveNodes(prev => [...prev.slice(-3), newNode]);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleInteraction = useCallback(() => {
    if (globeEl.current) {
      globeEl.current.controls().autoRotate = false;
    }
  }, []);

  // Merge selected location with ghost pulses
  const allMarkers = selectedLocation
    ? [{ ...selectedLocation, isMain: true }, ...activeNodes]
    : activeNodes;

  return (
    <div ref={containerRef} className="w-full h-full cursor-pointer relative">
      {/* Precision UI Scan Lines */}
      <div className="absolute inset-0 pointer-events-none z-10 opacity-30">
        <div className="w-full h-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_0%,transparent_100%)]"></div>
        <div className="absolute top-1/2 left-0 w-full h-[1px] bg-white/5"></div>
        <div className="absolute top-0 left-1/2 w-[1px] h-full bg-white/5"></div>
      </div>

      {dimensions.width > 0 && (
        <Globe
          ref={globeEl}
          width={dimensions.width}
          height={dimensions.height}
          backgroundColor="rgba(0,0,0,0)"
          // High-fidelity night texture
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
          bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"

          // Borders and Interactive Polygons
          polygonsData={countries.features}
          polygonCapColor={() => 'rgba(0, 0, 0, 0.2)'} // More transparent to show night lights
          polygonSideColor={() => 'rgba(255, 255, 255, 0.02)'}
          polygonStrokeColor={() => 'rgba(255, 255, 255, 0.4)'} // Brighter borders
          polygonLabel={({ properties: d }: any) => `
            <div style="background: rgba(0,0,0,0.95); color: white; padding: 8px 16px; border: 1px solid rgba(255,255,255,0.3); border-radius: 8px; font-weight: 800; font-family: 'Inter', sans-serif; font-size: 10px; text-transform: uppercase; letter-spacing: 2px; box-shadow: 0 0 20px rgba(255,255,255,0.1);">
              ${d.ADMIN}
            </div>
          `}

          onPolygonClick={(polygon: any, event: any, { lat, lng }: any) => {
            handleInteraction();
            onLocationSelect({
              latitude: lat,
              longitude: lng,
              city: "",
              principalSubdivision: "",
              countryName: polygon.properties.ADMIN,
              continent: polygon.properties.CONTINENT
            });
          }}
          onGlobeClick={({ lat, lng }) => {
            handleInteraction();
            onLocationSelect({ latitude: lat, longitude: lng, city: "", principalSubdivision: "", countryName: "", continent: "" });
          }}

          // No Atmosphere / Shadow
          showAtmosphere={false}

          // Coordinate Mapping for HTML Elements
          htmlLat="latitude"
          htmlLng="longitude"

          // Enhanced Live Beacon & Ghost Pulses
          htmlElementsData={allMarkers}
          htmlElement={(d: any) => {
            const el = document.createElement('div');

            if (d.isMain) {
              el.innerHTML = `
                <div class="relative flex items-center justify-center">
                  <!-- Aggressive Live Pulse -->
                  <div class="absolute w-24 h-24 border-2 border-white/40 rounded-full animate-[ping_1.5s_cubic-bezier(0,0,0.2,1)_infinite] opacity-50"></div>
                  <div class="absolute w-14 h-14 border border-white/20 rounded-full animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite] opacity-30"></div>
                  
                  <!-- Precision Crosshair -->
                  <div class="absolute w-[1px] h-32 bg-gradient-to-b from-transparent via-white/50 to-transparent animate-pulse opacity-40"></div>
                  <div class="absolute h-[1px] w-32 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-pulse opacity-40"></div>
                  
                  <!-- Pulsing Core -->
                  <div class="w-3.5 h-3.5 bg-white rounded-full 
                    shadow-[0_0_20px_rgba(255,255,255,1),0_0_40px_rgba(255,255,255,0.6)]
                    animate-[pulse_0.8s_ease-in-out_infinite] border border-black/20">
                  </div>
                  
                  <!-- Live Indicator -->
                  <div class="absolute top-5 px-2 py-0.5 border border-white/30 rounded-sm bg-black text-[16px] font-black text-white uppercase tracking-widest whitespace-nowrap">
                    <span class="inline-block w-1.5 h-1.5 bg-sky-400 rounded-full animate-pulse mr-1.5"></span>
                    ACTIVE ZONE
                  </div>
                </div>
              `;
            } else {
              // Subtle Global Pulse
              el.innerHTML = `
                <div class="relative flex items-center justify-center">
                  <div class="absolute w-8 h-8 border border-white/20 rounded-full animate-ping opacity-20"></div>
                  <div class="w-1.5 h-1.5 bg-white/40 rounded-full"></div>
                </div>
              `;
            }
            return el;
          }}
        />
      )}
    </div>
  );
};

export default GlobeViz;