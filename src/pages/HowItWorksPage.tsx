import { useState, useEffect } from 'react';

interface PlatformStatus {
  platform: string;
  icon: string;
  configured: boolean;
  status: string;
}

export default function HowItWorksPage() {
  const [platforms, setPlatforms] = useState<PlatformStatus[]>([]);

  useEffect(() => {
    fetch('/api/status')
      .then((r) => r.json())
      .then((d) => setPlatforms(d.platforms || []))
      .catch(() => {});
  }, []);

  const steps = [
    {
      num: '01',
      title: 'Search',
      desc: 'Enter a business name, product, or category. Add a location for local results.',
      icon: '🔎',
    },
    {
      num: '02',
      title: 'Aggregate',
      desc: 'R3viewRadar scans Google, Yelp, Amazon, Reddit, TripAdvisor, and Trustpilot simultaneously.',
      icon: '📡',
    },
    {
      num: '03',
      title: 'Analyze',
      desc: 'Reviews are compiled, scored, and broken down by sentiment — positive, neutral, negative.',
      icon: '📊',
    },
    {
      num: '04',
      title: 'Decide',
      desc: 'Compare platform ratings side-by-side. Filter by stars, sort by date, and read the reviews that matter.',
      icon: '✅',
    },
  ];

  return (
    <div className="how-page">
      <h1 className="how-title">How It Works</h1>
      <p className="how-subtitle">
        R3viewRadar is a universal review aggregator. One search gives you
        ratings and reviews from every major platform — so you never have to
        check each one manually.
      </p>

      <div className="steps-grid">
        {steps.map((step) => (
          <div key={step.num} className="step-card">
            <span className="step-icon">{step.icon}</span>
            <span className="step-num">{step.num}</span>
            <h3 className="step-title">{step.title}</h3>
            <p className="step-desc">{step.desc}</p>
          </div>
        ))}
      </div>

      <div className="coverage-section">
        <h2 className="coverage-heading">Platform Coverage</h2>
        <div className="coverage-table">
          <div className="coverage-header">
            <span>Platform</span>
            <span>Type</span>
            <span>Status</span>
          </div>
          {[
            { icon: '🔍', name: 'Google Places', type: 'Business & Product', env: 'GOOGLE_PLACES_API_KEY' },
            { icon: '⭐', name: 'Yelp Fusion', type: 'Business', env: 'YELP_API_KEY' },
            { icon: '💬', name: 'Reddit', type: 'Business & Product', env: 'REDDIT_CLIENT_ID' },
            { icon: '📦', name: 'Amazon (via SerpAPI)', type: 'Product', env: 'SERPAPI_KEY' },
            { icon: '🌍', name: 'TripAdvisor (via SerpAPI)', type: 'Business', env: 'SERPAPI_KEY' },
            { icon: '✅', name: 'Trustpilot (via SerpAPI)', type: 'Product', env: 'SERPAPI_KEY' },
          ].map((p) => {
            const live = platforms.find((s) => s.platform === p.name.split(' ')[0]);
            const isLive = live?.configured || false;
            return (
              <div key={p.name} className="coverage-row">
                <span className="coverage-cell">
                  <span className="coverage-icon">{p.icon}</span> {p.name}
                </span>
                <span className="coverage-cell type-cell">{p.type}</span>
                <span className={`coverage-cell status-cell ${isLive ? 'live' : 'simulated'}`}>
                  {isLive ? '● Live' : '○ Simulated'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="api-note">
        <h3>No API keys yet?</h3>
        <p>
          R3viewRadar works out of the box with realistic simulated data.
          When you add your API keys as environment variables, each platform
          automatically switches to live data.
        </p>
      </div>
    </div>
  );
}
