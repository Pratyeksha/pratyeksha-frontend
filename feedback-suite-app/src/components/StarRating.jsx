import React from 'react';
import { Star } from 'lucide-react';

export default function StarRating({ value, onChange, label, compact = false }) {
  return (
    <div className={`rating-row ${compact ? 'rating-row--compact' : ''}`}>
      <span className="rating-label">{label}</span>
      <div className="stars" role="radiogroup" aria-label={`${label} rating`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={`star-button ${value >= star ? 'is-active' : ''}`}
            onClick={() => onChange(star)}
            aria-label={`${star} out of 5`}
            aria-pressed={value === star}
          >
            <Star size={compact ? 16 : 22} strokeWidth={1.7} fill={value >= star ? 'currentColor' : 'none'} />
          </button>
        ))}
      </div>
    </div>
  );
}
