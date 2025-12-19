'use client';

import { useState, useTransition } from 'react';
import { saveRating } from './actions';

interface SaveRatingParams {
  userEmail: string;
  ratingValue: number;
  comment?: string;
}

export default function Home() {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [email, setEmail] = useState('');
  const [isPending, startTransition] = useTransition();
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleStarClick = (value: number) => {
    setRating(value);
    setIsSuccess(false);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    startTransition(async () => {
      try {
        const result = await saveRating({
          userEmail: email,
          ratingValue: rating,
          comment: comment.trim() || undefined,
        });

        if (result.success) {
          setIsSuccess(true);
          setComment('');
          setEmail('');
          // Reset rating after 3 seconds
          setTimeout(() => {
            setRating(0);
            setIsSuccess(false);
          }, 3000);
        } else {
          setError(result.message || 'Failed to save rating');
        }
      } catch (err) {
        setError('An error occurred. Please try again.');
        console.error(err);
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Vault.Notes
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300">
            Premium Study Notes Marketplace 🇿🇦
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 md:p-12">
          {isSuccess ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-6">✓</div>
              <h2 className="text-2xl font-bold text-green-600 dark:text-green-400 mb-4">
                Thank you for your feedback!
              </h2>
              <p className="text-slate-600 dark:text-slate-300">
                Your rating has been saved successfully.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Email Input */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2"
                >
                  Your Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Star Rating */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
                  Rate your experience (1-5 stars)
                </label>
                <div className="flex gap-3 justify-center">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => handleStarClick(value)}
                      onMouseEnter={() => setHoveredRating(value)}
                      onMouseLeave={() => setHoveredRating(0)}
                      className="text-5xl transition-all duration-200 hover:scale-125 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg p-2"
                      aria-label={`Rate ${value} stars`}
                    >
                      <span
                        className={
                          value <= (hoveredRating || rating)
                            ? 'text-yellow-400 drop-shadow-lg'
                            : 'text-slate-300 dark:text-slate-600'
                        }
                      >
                        ★
                      </span>
                    </button>
                  ))}
                </div>
                {rating > 0 && (
                  <p className="text-center mt-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                    You selected {rating} {rating === 1 ? 'star' : 'stars'}
                  </p>
                )}
              </div>

              {/* Comment Input */}
              <div>
                <label
                  htmlFor="comment"
                  className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2"
                >
                  Optional Comment
                </label>
                <textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  placeholder="Share your thoughts..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                  <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isPending || rating === 0}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-slate-400 disabled:to-slate-500 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:transform-none"
              >
                {isPending ? 'Saving...' : 'Submit Rating'}
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-slate-500 dark:text-slate-400 text-sm">
          <p>© 2025 Vault.Notes. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}

