import React, { useState, useEffect } from 'react';

const CountdownTimer: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const nextReport = new Date(now);
      
      nextReport.setUTCHours(0, 30, 0, 0);
      
      if (now.getTime() > nextReport.getTime()) {
        nextReport.setUTCDate(nextReport.getUTCDate() + 1);
      }

      const diff = nextReport.getTime() - now.getTime();
      
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
    };

    const timer = setInterval(calculateTimeLeft, 1000);
    calculateTimeLeft();

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="text-[15px] sm:text-[20px] font-mono text-white/60 bg-white/5 px-2.5 sm:px-3 py-1.5 rounded border border-white/15 flex items-center gap-1.5 sm:gap-2">
      <span className="relative flex h-1 w-1">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-30"></span>
        <span className="relative inline-flex rounded-full h-1 w-1 bg-white"></span>
      </span>
      <span className="tracking-wider whitespace-nowrap">{timeLeft}</span>
    </div>
  );
};

export default CountdownTimer;