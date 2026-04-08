import type { Review } from '../types';
import StarRating from './StarRating';

interface ReviewCardProps {
  review: Review;
}

export default function ReviewCard({ review }: ReviewCardProps) {
  const dateStr = new Date(review.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="review-card">
      <div className="review-card-header">
        <div className="review-author-row">
          <span className="review-author">{review.author}</span>
          {review.verified && <span className="verified-badge">✓ Verified</span>}
        </div>
        <span className="review-platform-tag">
          {review.platformIcon} {review.platform}
        </span>
      </div>
      <div className="review-card-meta">
        <StarRating rating={review.rating} size={14} />
        <span className="review-date">{dateStr}</span>
      </div>
      <p className="review-text">{review.text}</p>
      {review.helpful !== undefined && review.helpful > 0 && (
        <span className="review-helpful">👍 {review.helpful} found this helpful</span>
      )}
    </div>
  );
}
