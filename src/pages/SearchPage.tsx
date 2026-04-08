import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CategoryPills from '../components/CategoryPills';

const businessCategories = ['All', 'Restaurant', 'Hotel', 'Coffee Shop', 'Gym', 'Salon', 'Auto Shop', 'Dentist'];
const productCategories = ['All', 'Electronics', 'Home & Kitchen', 'Books', 'Fashion', 'Beauty', 'Sports', 'Toys'];

const trendingSearches = [
  { label: 'Best pizza near me', type: 'business' as const },
  { label: 'iPhone 16 Pro', type: 'product' as const },
  { label: 'Top rated dentist', type: 'business' as const },
  { label: 'Sony WH-1000XM5', type: 'product' as const },
  { label: 'Best coffee shop', type: 'business' as const },
  { label: 'Dyson V15', type: 'product' as const },
];

export default function SearchPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [type, setType] = useState<'business' | 'product'>('business');
  const [category, setCategory] = useState('All');
  const [location, setLocation] = useState('');
  const [gettingLocation, setGettingLocation] = useState(false);

  const categories = type === 'business' ? businessCategories : productCategories;

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) return;

    const params = new URLSearchParams({
      q: query.trim(),
      type,
      category: category === 'All' ? '' : category,
    });
    if (location) params.set('location', location);

    navigate(`/results?${params.toString()}`);
  };

  const handleTrending = (label: string, searchType: 'business' | 'product') => {
    setQuery(label);
    setType(searchType);
    const params = new URLSearchParams({ q: label, type: searchType });
    navigate(`/results?${params.toString()}`);
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) return;
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation(`${pos.coords.latitude.toFixed(4)},${pos.coords.longitude.toFixed(4)}`);
        setGettingLocation(false);
      },
      () => {
        setGettingLocation(false);
        alert('Unable to get your location. Please enter a zip code or city instead.');
      },
      { timeout: 10000 }
    );
  };

  return (
    <div className="search-page">
      <div className="search-hero">
        <h1 className="search-title">
          Every review.<br />One search.
        </h1>
        <p className="search-subtitle">
          Aggregate reviews from Google, Yelp, Amazon, Reddit, TripAdvisor, Trustpilot and more.
        </p>
      </div>

      <form className="search-form" onSubmit={handleSearch}>
        <div className="type-toggle">
          <button
            type="button"
            className={`toggle-btn ${type === 'business' ? 'active' : ''}`}
            onClick={() => { setType('business'); setCategory('All'); }}
          >
            Businesses & Places
          </button>
          <button
            type="button"
            className={`toggle-btn ${type === 'product' ? 'active' : ''}`}
            onClick={() => { setType('product'); setCategory('All'); }}
          >
            Products
          </button>
        </div>

        <div className="search-input-row">
          <input
            type="text"
            className="search-input"
            placeholder={type === 'business' ? 'Search businesses, restaurants, hotels...' : 'Search products, electronics, books...'}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <button type="submit" className="search-btn" disabled={!query.trim()}>
            Search
          </button>
        </div>

        {type === 'business' && (
          <div className="location-row">
            <input
              type="text"
              className="location-input"
              placeholder="Zip code or city (optional)"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
            <button
              type="button"
              className="location-btn"
              onClick={handleUseMyLocation}
              disabled={gettingLocation}
            >
              {gettingLocation ? 'Locating...' : '📍 Use my location'}
            </button>
          </div>
        )}

        <CategoryPills categories={categories} selected={category} onSelect={setCategory} />
      </form>

      <div className="trending-section">
        <h3 className="trending-title">Trending Searches</h3>
        <div className="trending-list">
          {trendingSearches.map((item) => (
            <button
              key={item.label}
              className="trending-chip"
              onClick={() => handleTrending(item.label, item.type)}
            >
              {item.type === 'business' ? '📍' : '📦'} {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="platform-coverage">
        <h3 className="coverage-title">Platforms We Cover</h3>
        <div className="coverage-grid">
          {[
            { icon: '🔍', name: 'Google' },
            { icon: '⭐', name: 'Yelp' },
            { icon: '📦', name: 'Amazon' },
            { icon: '💬', name: 'Reddit' },
            { icon: '🌍', name: 'TripAdvisor' },
            { icon: '✅', name: 'Trustpilot' },
          ].map((p) => (
            <div key={p.name} className="coverage-item">
              <span className="coverage-icon">{p.icon}</span>
              <span className="coverage-name">{p.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
