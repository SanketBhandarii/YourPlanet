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
       
       <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-black tracking-tighter leading-none">
  PLANET<br/>
  <span className="text-gray-700">MOOD CHECK</span>
</h1>
        <p className="text-[12px] sm:text-[17px] text-gray-600 font-medium tracking-wider max-w-md leading-relaxed">
          Daily Global Earth Report at 00:30 UTC 
        </p>
      </motion.header>

      <div className="space-y-6">
        <motion.section 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white/[0.03] backdrop-blur-xl border border-gray-900 rounded-2xl p-4 sm:p-6 space-y-5"
        >
          <div className="flex justify-between items-center border-b border-white/10 pb-3">
            <h2 className="text-[15px] sm:text-[20px] uppercase font-semibold text-gray-500">SIGNAL</h2>
            <CountdownTimer />
          </div>

          <AnimatePresence mode="wait">
            {hasSubmitted ? (
              <motion.div 
                key="done"
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8 space-y-4"
              >
                <div className="w-14 h-14 mx-auto border-2 border-white rounded-full flex items-center justify-center relative">
                  <div className="absolute inset-0 border-2 border-white/10 rounded-full animate-ping"></div>
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                <div className="text-[9px] text-gray-500 tracking-[0.25em] uppercase font-bold">RECEIVED</div>
                <div className="text-white text-lg sm:text-xl font-medium max-w-xs mx-auto leading-relaxed px-4">
                  You have given mood for today!! 
                </div>
                {lastMood && (
                  <div className="pt-3">
                    <div className="text-[20px] text-gray-600 uppercase tracking-widest mb-1">MOOD</div>
                    <div className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">{lastMood}</div>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.form 
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onSubmit={handleSubmit} 
                className="space-y-4"
              >
                <div className="relative">
                  <input
                    value={thought}
                    onChange={(e) => e.target.value.length <= 25 && setThought(e.target.value)}
                    placeholder={selectedLocation ? "YOUR VIBE..." : "SELECT ZONE..."}
                    disabled={!selectedLocation || isSubmitting}
                    className="w-full bg-transparent border-b-2 border-white/30 focus:border-white px-0 py-4 text-base sm:text-lg md:text-xl font-medium focus:outline-none transition-colors placeholder-gray-800 text-white disabled:opacity-20"
                  />
                  <div className="absolute right-0 bottom-1 text-[8px] font-mono text-gray-700">
                    {thought.length}/25
                  </div>
                </div>
                
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-center"
                  >
                    <p className="text-[9px] sm:text-[10px] text-red-400 font-bold tracking-wide">{error}</p>
                  </motion.div>
                )}

                <div className="flex items-end justify-between gap-3 pt-1">
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-[7px] sm:text-[8px] text-gray-700 uppercase tracking-wider font-bold mb-1">ZONE</span>
                    <span className="text-[9px] sm:text-[10px] font-bold text-white truncate uppercase">
                      {selectedLocation?.countryName ? 
                        `${selectedLocation.countryName}${selectedLocation.city ? ` / ${selectedLocation.city}` : ''}` : 
                        "NO ZONE"}
                    </span>
                  </div>
                  <button
                    disabled={!selectedLocation || !thought || isSubmitting}
                    className="h-10 sm:h-12 px-6 sm:px-8 bg-white text-black text-[9px] sm:text-[10px] font-black uppercase tracking-[0.12em] rounded-full hover:bg-gray-200 transition-colors disabled:opacity-5 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {isSubmitting ? "..." : "SEND"}
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.section>

        <section className="space-y-5 pb-6">
          <div className="flex items-center gap-3">
            <h3 className="text-[9px] sm:text-[10px] font-black text-gray-700 uppercase tracking-[0.25em]">GLOBAL</h3>
            <div className="flex-1 h-px bg-white/10"></div>
          </div>

          {summary ? (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="space-y-4"
            >
              <div className="bg-white/[0.02] border border-white/10 p-5 sm:p-6 rounded-2xl">
                <p className="text-xs sm:text-[13px] text-gray-400 leading-relaxed italic font-light">
                  "{summary.summary}"
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <StatCard label="HIGH" value={summary.happiestCountry} />
                <StatCard label="LOW" value={summary.saddestCountry} muted />
              </div>

              <div className="bg-white/[0.015] rounded-2xl border border-white/10 p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <span className="text-[7px] sm:text-[8px] text-gray-700 uppercase tracking-[0.2em] font-bold">REGIONS</span>
                </div>
                <div className="space-y-4 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
                  {Object.entries(summary.continentSummaries).map(([k, v]) => (
                    <div key={k}>
                      <span className="text-[9px] sm:text-[10px] font-black text-white uppercase block mb-1.5 tracking-wide">{k}</span>
                      <p className="text-[10px] sm:text-[11px] text-gray-500 leading-relaxed">{v}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="h-28 flex items-center justify-center bg-white/[0.01] border border-dashed border-white/10 rounded-2xl">
              <span className="text-[8px] sm:text-[9px] text-gray-800 uppercase tracking-[0.35em] animate-pulse font-bold">LOADING...</span>
            </div>
          )}
        </section>
      </div>
      
      <footer className="mt-auto pt-10 text-center">
        <div className="inline-flex items-center gap-2 text-[7px] sm:text-[8px] text-gray-900 tracking-[0.4em] uppercase font-bold">
          <span>YOURPLANET</span>
          <div className="w-0.5 h-0.5 bg-gray-900 rounded-full"></div>
          <span>v1.0</span>
        </div>
      </footer>
    </div>
  );
};

const StatCard = ({ label, value, muted }: { label: string, value: string, muted?: boolean }) => (
  <div className="bg-white/[0.02] border border-white/10 p-4 sm:p-5 rounded-xl hover:border-white/20 transition-colors">
    <span className="text-[7px] sm:text-[8px] text-gray-700 uppercase tracking-wider font-bold mb-2 block">{label}</span>
    <span className={`text-[10px] sm:text-[11px] font-black uppercase truncate block ${muted ? 'text-gray-700' : 'text-white'}`}>
      {value || "N/A"}
    </span>
  </div>
);

export default InfoPanel;