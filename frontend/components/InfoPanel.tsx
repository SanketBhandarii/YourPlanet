import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SummaryData, LocationData } from '../types';
import CountdownTimer from './CountdownTimer';
import { submitThought } from '../services/api';

interface InfoPanelProps {
  summary: SummaryData | null;
  selectedLocation: LocationData | null;
  onVibeSubmitted: (loc: LocationData) => void;
}

const InfoPanel: React.FC<InfoPanelProps> = ({ summary, selectedLocation, onVibeSubmitted }) => {
  const [thought, setThought] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [lastMood, setLastMood] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const submitted = localStorage.getItem('hasSubmittedToday');
    const lastSubmitDate = localStorage.getItem('lastSubmitDate');
    const today = new Date().toISOString().slice(0, 10);

    if (submitted === 'true' && lastSubmitDate === today) {
      setHasSubmitted(true);
    } else if (lastSubmitDate !== today) {
      localStorage.removeItem('hasSubmittedToday');
      localStorage.removeItem('lastSubmitDate');
      setHasSubmitted(false);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLocation) {
      setError("⚠ SELECT COORDINATES");
      return;
    }
    if (!thought.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await submitThought(thought, selectedLocation);
      setLastMood(result.mood);
      onVibeSubmitted(selectedLocation);

      const today = new Date().toISOString().slice(0, 10);
      localStorage.setItem('hasSubmittedToday', 'true');
      localStorage.setItem('lastSubmitDate', today);
      setHasSubmitted(true);

      const aurora = document.getElementById('aurora');
      aurora?.classList.add('signal-active');
      setTimeout(() => aurora?.classList.remove('signal-active'), 2100);

      setThought("");
    } catch (err: any) {
      if (err.message.includes("already shared")) {
        setError("⚠ ALREADY TRANSMITTED TODAY");
        setHasSubmitted(true);
        const today = new Date().toISOString().slice(0, 10);
        localStorage.setItem('hasSubmittedToday', 'true');
        localStorage.setItem('lastSubmitDate', today);
      } else {
        setError(err.message || "⚠ TRANSMISSION ERROR");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full text-white p-4 sm:p-6 md:p-8 select-none overflow-y-auto custom-scrollbar bg-black/50 backdrop-blur-2xl">
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8 space-y-3"
      >
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter leading-none">
          YOUR<br />
          <span className="text-gray-700">PLANET</span>
        </h1>
        <p className="text-sm sm:text-base text-gray-500 font-medium tracking-wider max-w-md leading-relaxed uppercase">
          See what 7 billion people are feeling
        </p>
      </motion.header>

      <div className="space-y-6">
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-6 space-y-5"
        >
          <div className="flex justify-between items-center border-b border-white/10 pb-3">
            <h2 className="text-xs sm:text-sm uppercase font-bold text-gray-400 tracking-widest">Next Daily Report In</h2>
            <CountdownTimer />
          </div>

          <AnimatePresence mode="wait">
            {hasSubmitted ? (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-6 space-y-4"
              >
                <div className="w-16 h-16 mx-auto border-2 border-white rounded-full flex items-center justify-center relative">
                  <div className="absolute inset-0 border-2 border-white/20 rounded-full animate-ping"></div>
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-gray-500 tracking-[0.3em] uppercase font-bold">Success</div>
                  <div className="text-lg text-white font-bold tracking-wider">MOOD SHARED</div>
                </div>
                {lastMood && (
                  <div className="pt-2">
                    <div className="text-xs text-gray-600 uppercase tracking-widest mb-1">You felt</div>
                    <div className="text-2xl font-black text-white uppercase tracking-tight">{lastMood}</div>
                  </div>
                )}
                <p className="text-xs text-gray-500 pt-2">Come back tomorrow to share again!</p>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onSubmit={handleSubmit}
                className="space-y-5"
              >
                <div className="relative group">
                  <input
                    value={thought}
                    onChange={(e) => e.target.value.length <= 25 && setThought(e.target.value)}
                    placeholder={selectedLocation ? "How are you feeling right now?" : "Click the globe to select location..."}
                    disabled={!selectedLocation || isSubmitting}
                    className="w-full bg-transparent border-b-2 border-white/20 focus:border-white px-0 py-4 text-base sm:text-lg font-medium focus:outline-none transition-all placeholder-gray-600 text-white disabled:opacity-30 disabled:cursor-not-allowed group-hover:border-white/40"
                  />
                  <div className="absolute right-0 bottom-2 text-xs font-mono text-gray-600 font-bold">
                    {thought.length}/25
                  </div>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-center"
                  >
                    <p className="text-xs text-red-300 font-bold tracking-wide uppercase">{error}</p>
                  </motion.div>
                )}

                <div className="flex items-center justify-between gap-4 pt-2">
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-xs text-gray-600 uppercase tracking-widest font-bold mb-1">Your Location</span>
                    <span className="text-sm font-bold text-white truncate uppercase tracking-wide">
                      {selectedLocation?.countryName ?
                        `${selectedLocation.countryName}${selectedLocation.city ? ` — ${selectedLocation.city}` : ''}` :
                        "TAP GLOBE TO SELECT"}
                    </span>
                  </div>
                  <button
                    disabled={!selectedLocation || !thought || isSubmitting}
                    className="h-10 px-6 bg-white text-black text-xs font-black uppercase tracking-[0.15em] rounded-full hover:bg-gray-200 hover:scale-105 active:scale-95 transition-all disabled:opacity-20 disabled:cursor-not-allowed disabled:transform-none shadow-[0_0_20px_rgba(255,255,255,0.1)] cursor-pointer"
                  >
                    {isSubmitting ? "SHARING..." : "SHARE MOOD"}
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.section>

        <section className="space-y-5 pb-8">
          <div className="flex items-center gap-4 py-2">
            <h3 className="text-base font-black text-gray-500 uppercase tracking-wide">Yesterday's World Mood</h3>
            <div className="flex-1 h-px bg-white/10"></div>
          </div>

          <p className="text-xs text-gray-500 italic">
            * This report is generated daily at 00:30 UTC based on yesterday's global data.
          </p>

          {summary ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-5"
            >
              <div className="bg-white/5 border border-white/10 p-5 rounded-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                  <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm4.59-12.42L10 14.17l-2.59-2.58L6 13l4 4 8-8z" /></svg>
                </div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Global Summary</h4>
                <p className="text-sm sm:text-base text-gray-300 leading-relaxed font-light relative z-10">
                  "{summary.summary}"
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <StatCard label="Happiest Country" value={summary.happiestCountry} />
                <StatCard label="Least Happy Country" value={summary.saddestCountry} muted />
                <StatCard label="Happiest Continent" value={summary.happiestContinent} />
                <StatCard label="Least Happy Continent" value={summary.saddestContinent} muted />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-2xl border border-white/10 p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="text-xs text-gray-500 uppercase tracking-widest font-bold">Happiest Cities</span>
                  </div>
                  <div className="space-y-3 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                    {Object.entries(summary.happiestCityPerCountry || {}).map(([country, city]) => (
                      <div key={country} className="flex justify-between items-center text-xs">
                        <span className="text-gray-400 font-bold uppercase truncate max-w-[40%]">{country}</span>
                        <div className="flex-1 border-b border-white/5 mx-2"></div>
                        <span className="text-white font-bold uppercase truncate max-w-[50%]">{city}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white/5 rounded-2xl border border-white/10 p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="text-xs text-gray-500 uppercase tracking-widest font-bold">Most Stressed Cities</span>
                  </div>
                  <div className="space-y-3 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                    {Object.entries(summary.saddestCityPerCountry || {}).map(([country, city]) => (
                      <div key={country} className="flex justify-between items-center text-xs">
                        <span className="text-gray-400 font-bold uppercase truncate max-w-[40%]">{country}</span>
                        <div className="flex-1 border-b border-white/5 mx-2"></div>
                        <span className="text-white font-bold uppercase truncate max-w-[50%]">{city}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white/5 rounded-2xl border border-white/10 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-xs text-gray-500 uppercase tracking-widest font-bold">Mood by Continent</span>
                </div>
                <div className="space-y-5 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                  {Object.entries(summary.continentSummaries).map(([k, v]) => (
                    <div key={k} className="group">
                      <span className="text-xs font-black text-white/60 group-hover:text-white uppercase block mb-1.5 tracking-wider transition-colors">{k}</span>
                      <p className="text-sm text-gray-400 leading-relaxed font-light">{v}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="h-32 flex flex-col items-center justify-center bg-white/5 border border-dashed border-white/10 rounded-2xl gap-2">
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              <span className="text-xs text-gray-500 uppercase tracking-[0.2em] font-bold">Loading Report...</span>
            </div>
          )}
        </section>
      </div>

      <footer className="mt-auto pt-8 pb-4 text-center">
        <div className="inline-flex items-center gap-3 text-xs text-gray-600 tracking-[0.3em] uppercase font-bold hover:text-white transition-colors cursor-default">
          <span>YourPlanet</span>
          <div className="w-1 h-1 bg-gray-700 rounded-full"></div>
          <span>Live 2025</span>
        </div>
      </footer>
    </div>
  );
};

const StatCard = ({ label, value, muted }: { label: string, value: string, muted?: boolean }) => (
  <div className={`p-4 sm:p-5 rounded-xl border transition-all duration-300 ${muted ? 'bg-white/[0.02] border-white/5 hover:bg-white/5' : 'bg-white/5 border-white/10 hover:border-white/20'}`}>
    <span className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-2 block">{label}</span>
    <span className={`text-sm sm:text-base font-black uppercase truncate block ${muted ? 'text-gray-600' : 'text-white tracking-wide'}`}>
      {value || "N/A"}
    </span>
  </div>
);

export default InfoPanel;