import React from "react";
import "./StarRating.css";

export default function StarRating({
  rating = 0,
  maxStars = 5,
  size = "medium",
  interactive = false,
  onRatingChange = null,
  showValue = false
}) {
  const handleClick = (index) => {
    if (interactive && onRatingChange) {
      onRatingChange(index + 1);
    }
  };

  const handleKeyDown = (e, index) => {
    if (interactive && onRatingChange && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      onRatingChange(index + 1);
    }
  };

  return (
    <div className={`star-rating star-rating-${size} ${interactive ? 'interactive' : ''}`}>
      <div className="stars">
        {[...Array(maxStars)].map((_, index) => {
          const fillPercentage = Math.min(Math.max(rating - index, 0), 1) * 100;

          return (
            <span
              key={index}
              className={`star ${interactive ? 'clickable' : ''}`}
              onClick={() => handleClick(index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              tabIndex={interactive ? 0 : -1}
              role={interactive ? "button" : "presentation"}
              aria-label={interactive ? `Rate ${index + 1} stars` : undefined}
            >
              <span className="star-empty">&#9734;</span>
              <span
                className="star-filled"
                style={{ width: `${fillPercentage}%` }}
              >
                &#9733;
              </span>
            </span>
          );
        })}
      </div>
      {showValue && rating > 0 && (
        <span className="rating-value">{rating.toFixed(1)}</span>
      )}
    </div>
  );
}
