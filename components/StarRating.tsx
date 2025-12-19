'use client';

import { useState, useTransition } from 'react';
import { saveRating } from '@/app/actions';

interface StarRatingProps {
  userEmail: string;
}

export default function StarRating({ userEmail }: StarRatingProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isPending, startTransition] = useTransition();
  const [isSuccess, setIsSuccess] = useState(false);

  const handleStarClick = (value: number) => {
    setRating(value);
    setIsSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      alert('Please select a rating');
      return;
    }

    startTransition(async () => {
      const result = await saveRating({
        userEmail,
        ratingValue: rating,
        comment: comment.trim() || undefined,
      });

      if (result.success) {
        setIsSuccess(true);
        setComment('');
        // Reset rating after 2 seconds
        setTimeout(() => {
          setRating(0);
          setIsSuccess(false);
        }, 2000);
      } else {
        alert(result.message || 'Failed to save rating');
      }
    });
  };

  if (isSuccess) {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-8 text-center">
        <div className="text-5xl mb-4">✓</div>
        <h3 className="text-xl font-bold text-green-800 dark:text-green-200 mb-2">
          Thank you for your feedback!
        </h3>
        <p className="text-green-600 dark:text-green-300">
          Your rating has been saved successfully.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Rate your experience (1-5 stars)
        </label>
        <div className="flex gap-2 justify-center">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => handleStarClick(value)}
              onMouseEnter={() => setHoveredRating(value)}
              onMouseLeave={() => setHoveredRating(0)}
              className="text-4xl transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              aria-label={`Rate ${value} stars`}
            >
              <span
                className={
                  value <= (hoveredRating || rating)
                    ? 'text-yellow-400'
                    : 'text-gray-300 dark:text-gray-600'
                }
              >
                ★
              </span>
            </button>
          ))}
        </div>
        {rating > 0 && (
          <p className="text-center mt-2 text-sm text-gray-600 dark:text-gray-400">
            You selected {rating} {rating === 1 ? 'star' : 'stars'}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="comment"
          className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
        >
          Optional Comment
        </label>
        <textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          placeholder="Share your thoughts..."
          className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={isPending || rating === 0}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200 shadow-lg hover:shadow-xl"
      >
        {isPending ? 'Saving...' : 'Submit Rating'}
      </button>
    </form>
  );
}

