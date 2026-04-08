interface StarRatingProps {
  rating: number;
  size?: number;
}

export default function StarRating({ rating, size = 16 }: StarRatingProps) {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.3;

  for (let i = 0; i < 5; i++) {
    if (i < fullStars) {
      stars.push(
        <svg key={i} width={size} height={size} viewBox="0 0 20 20" fill="var(--teal)">
          <path d="M10 1l2.39 4.84L17.8 6.7l-3.9 3.8.92 5.38L10 13.4l-4.82 2.54.92-5.38-3.9-3.8 5.41-.87L10 1z" />
        </svg>
      );
    } else if (i === fullStars && hasHalf) {
      stars.push(
        <svg key={i} width={size} height={size} viewBox="0 0 20 20">
          <defs>
            <linearGradient id={`half-${i}`}>
              <stop offset="50%" stopColor="var(--teal)" />
              <stop offset="50%" stopColor="var(--surface-2)" />
            </linearGradient>
          </defs>
          <path d="M10 1l2.39 4.84L17.8 6.7l-3.9 3.8.92 5.38L10 13.4l-4.82 2.54.92-5.38-3.9-3.8 5.41-.87L10 1z" fill={`url(#half-${i})`} />
        </svg>
      );
    } else {
      stars.push(
        <svg key={i} width={size} height={size} viewBox="0 0 20 20" fill="var(--surface-2)">
          <path d="M10 1l2.39 4.84L17.8 6.7l-3.9 3.8.92 5.38L10 13.4l-4.82 2.54.92-5.38-3.9-3.8 5.41-.87L10 1z" />
        </svg>
      );
    }
  }

  return <span className="star-rating">{stars}</span>;
}
