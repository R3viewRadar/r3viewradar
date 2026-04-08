import { useEffect, useState } from 'react';

interface ScoreRingProps {
  rating: number;
  size?: number;
}

export default function ScoreRing({ rating, size = 140 }: ScoreRingProps) {
  const [animated, setAnimated] = useState(0);
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (animated / 5) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(rating), 100);
    return () => clearTimeout(timer);
  }, [rating]);

  const getColor = () => {
    if (rating >= 4) return 'var(--green)';
    if (rating >= 3) return 'var(--yellow)';
    return 'var(--red)';
  };

  return (
    <div className="score-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--surface-2)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getColor()}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
      </svg>
      <div className="score-ring-value">
        <span className="score-ring-number">{rating.toFixed(1)}</span>
        <span className="score-ring-label">out of 5</span>
      </div>
    </div>
  );
}
