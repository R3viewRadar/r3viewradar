import type { PlatformSummary } from '../types';
import StarRating from './StarRating';

interface PlatformCardProps {
  platform: PlatformSummary;
  isActive: boolean;
  isBest: boolean;
  onClick: () => void;
}

export default function PlatformCard({ platform, isActive, isBest, onClick }: PlatformCardProps) {
  return (
    <button
      className={`platform-card ${isActive ? 'active' : ''} ${isBest ? 'best' : ''}`}
      onClick={onClick}
    >
      {isBest && <span className="best-badge">Best Rated</span>}
      <div className="platform-card-header">
        <span className="platform-icon">{platform.icon}</span>
        <span className="platform-name">{platform.platform}</span>
      </div>
      <div className="platform-card-rating">
        <StarRating rating={platform.rating} size={14} />
        <span className="platform-rating-num">{platform.rating.toFixed(1)}</span>
      </div>
      <span className="platform-review-count">{platform.reviewCount.toLocaleString()} reviews</span>
      <a
        href={platform.url}
        target="_blank"
        rel="noopener noreferrer"
        className="platform-link"
        onClick={(e) => e.stopPropagation()}
      >
        View on {platform.platform} ↗
      </a>
    </button>
  );
}
