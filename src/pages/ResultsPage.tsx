import { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import type { SearchResult } from '../types';
import ScoreRing from '../components/ScoreRing';
import SentimentBar from '../components/SentimentBar';
import PlatformCard from '../components/PlatformCard';
import ReviewCard from '../components/ReviewCard';
import LoadingState from '../components/LoadingState';

export default function ResultsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [data, setData] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activePlatform, setActivePlatform] = useState<string | null>(null);
  const [starFilter, setStarFilter] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'highest' | 'lowest'>('newest');

  const query = searchParams.get('q') || '';
  const type = (searchParams.get('type') || 'business') as 'business' | 'product';
  const category = searchParams.get('category') || '';
  const location = searchParams.get('location') || '';

  useEffect(() => {
    if (!query) {
      navigate('/');
      return;
    }

    setLoading(true);
    setError(null);

    const params = new URLSearchParams({ query, type });
    if (category) params.set('category', category);
    if (location) {
      // Check if it's lat,lng format
      const coords = location.split(',');
      if (coords.length === 2 && !isNaN(Number(coords[0]))) {
        params.set('lat', coords[0]);
        params.set('lng', coords[1]);
      } else {
        params.set('location', location);
      }
    }

    fetch(`/api/search?${params.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error('Search failed');
        return res.json();
      })
      .then((result) => {
        setData(result);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError('Something went wrong. Please try again.');
        setLoading(false);
      });
  }, [query, type, category, location, navigate]);

  const filteredReviews = useMemo(() => {
    if (!data) return [];
    let reviews = [...data.reviews];

    if (activePlatform) {
      reviews = reviews.filter((r) => r.platform === activePlatform);
    }
    if (starFilter !== null) {
      reviews = reviews.filter((r) => Math.floor(r.rating) === starFilter);
    }

    switch (sortBy) {
      case 'highest':
        reviews.sort((a, b) => b.rating - a.rating);
        break;
      case 'lowest':
        reviews.sort((a, b) => a.rating - b.rating);
        break;
      default:
        reviews.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    return reviews;
  }, [data, activePlatform, starFilter, sortBy]);

  if (loading) return <LoadingState />;

  if (error) {
    return (
      <div className="error-state">
        <h2>Oops</h2>
        <p>{error}</p>
        <button className="search-btn" onClick={() => navigate('/')}>
          Back to Search
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="results-page">
      <div className="results-breadcrumb">
        <button className="back-btn" onClick={() => navigate('/')}>← New Search</button>
        <span className="breadcrumb-text">
          {type.toUpperCase()} · {category ? category.toUpperCase() : 'ALL CATEGORIES'}
          {data.location && ` · 📍 ${data.location}`}
        </span>
      </div>

      <h1 className="results-query">"{data.query}"</h1>

      <div className="results-dashboard">
        <div className="dashboard-overview">
          <ScoreRing rating={data.overallRating} />
          <div className="overview-stats">
            <div className="stat">
              <span className="stat-value">{data.totalReviews.toLocaleString()}</span>
              <span className="stat-label">Total Reviews</span>
            </div>
            <div className="stat">
              <span className="stat-value">{data.platforms.length}</span>
              <span className="stat-label">Platforms</span>
            </div>
            {data.bestPlatform && (
              <div className="stat best-platform-stat">
                <span className="stat-value">{data.bestPlatform.icon} {data.bestPlatform.platform}</span>
                <span className="stat-label">Best Rated ({data.bestPlatform.rating.toFixed(1)})</span>
              </div>
            )}
          </div>
          <SentimentBar sentiment={data.sentiment} />
        </div>

        <div className="platforms-sidebar">
          <h3 className="sidebar-title">Platforms</h3>
          <button
            className={`platform-filter-btn ${!activePlatform ? 'active' : ''}`}
            onClick={() => setActivePlatform(null)}
          >
            All Platforms
          </button>
          {data.platforms.map((p) => (
            <PlatformCard
              key={p.platform}
              platform={p}
              isActive={activePlatform === p.platform}
              isBest={data.bestPlatform?.platform === p.platform}
              onClick={() => setActivePlatform(activePlatform === p.platform ? null : p.platform)}
            />
          ))}
        </div>
      </div>

      <div className="reviews-section">
        <div className="reviews-controls">
          <div className="star-filters">
            <button
              className={`star-filter-btn ${starFilter === null ? 'active' : ''}`}
              onClick={() => setStarFilter(null)}
            >
              All Stars
            </button>
            {[5, 4, 3, 2, 1].map((s) => (
              <button
                key={s}
                className={`star-filter-btn ${starFilter === s ? 'active' : ''}`}
                onClick={() => setStarFilter(starFilter === s ? null : s)}
              >
                {s}★
              </button>
            ))}
          </div>
          <select
            className="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
          >
            <option value="newest">Newest</option>
            <option value="highest">Highest Rated</option>
            <option value="lowest">Lowest Rated</option>
          </select>
        </div>

        <div className="reviews-list">
          {filteredReviews.length === 0 ? (
            <p className="no-reviews">No reviews match your filters.</p>
          ) : (
            filteredReviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
