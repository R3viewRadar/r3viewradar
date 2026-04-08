import { useState, useEffect } from 'react';

const platforms = ['Google', 'Yelp', 'Amazon', 'Reddit', 'TripAdvisor', 'Trustpilot'];

export default function LoadingState() {
  const [currentPlatform, setCurrentPlatform] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPlatform((prev) => (prev + 1) % platforms.length);
    }, 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="loading-state">
      <div className="loading-radar">
        <div className="radar-sweep" />
        <div className="radar-ring ring-1" />
        <div className="radar-ring ring-2" />
        <div className="radar-ring ring-3" />
        <div className="radar-dot" />
      </div>
      <p className="loading-text">Scanning reviews across platforms...</p>
      <p className="loading-platform">{platforms[currentPlatform]}</p>
    </div>
  );
}
