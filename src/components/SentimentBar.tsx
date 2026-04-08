import { useEffect, useState } from 'react';
import type { SentimentBreakdown } from '../types';

interface SentimentBarProps {
  sentiment: SentimentBreakdown;
}

export default function SentimentBar({ sentiment }: SentimentBarProps) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 200);
    return () => clearTimeout(timer);
  }, []);

  const items = [
    { label: 'Positive', value: sentiment.positive, color: 'var(--green)' },
    { label: 'Neutral', value: sentiment.neutral, color: 'var(--yellow)' },
    { label: 'Negative', value: sentiment.negative, color: 'var(--red)' },
  ];

  return (
    <div className="sentiment-bar">
      <h3 className="sentiment-title">Sentiment Breakdown</h3>
      {items.map((item) => (
        <div key={item.label} className="sentiment-row">
          <div className="sentiment-label">
            <span>{item.label}</span>
            <span className="sentiment-pct">{item.value}%</span>
          </div>
          <div className="sentiment-track">
            <div
              className="sentiment-fill"
              style={{
                width: animated ? `${item.value}%` : '0%',
                backgroundColor: item.color,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
