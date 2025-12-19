'use client';

import { useState, useTransition } from 'react';
import { saveRating } from './actions';

export const runtime = 'edge';

// Mock data for Recent Notes - In production, this would come from your database
const recentNotes = [
  {
    id: 1,
    title: 'Grade 12 Calculus Masterclass',
    subject: 'Mathematics',
    curriculum: 'CAPS',
    price: 'R 150.00',
    rating: 4.8,
    teacher: 'Mr. Govender',
    date: '2 days ago',
  },
  {
    id: 2,
    title: 'Mechanics & Motion Summary',
    subject: 'Physics',
    curriculum: 'IEB',
    price: 'R 85.00',
    rating: 5.0,
    teacher: 'Mrs. Smith',
    date: '5 days ago',
  },
  {
    id: 3,
    title: 'Poetry Analysis Guide',
    subject: 'English',
    curriculum: 'CAPS',
    price: 'R 120.00',
    rating: 4.6,
    teacher: 'Dr. Naidoo',
    date: '1 week ago',
  },
];

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8 md:py-12 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-6xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-pulse">
            Vault.Notes
          </h1>
          <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 font-medium">
            Premium Study Notes Marketplace 🇿🇦
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
            Your trusted source for CAPS & IEB study materials
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Star Rating Section */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 md:p-10 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 flex items-center justify-center text-2xl">
                  ⭐
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                    Rate Your Experience
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Help us improve Vault.Notes
                  </p>
                </div>
              </div>

              {isSuccess ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6">
                    <span className="text-4xl text-green-600 dark:text-green-400">✓</span>
                  </div>
                  <h3 className="text-2xl font-bold text-green-600 dark:text-green-400 mb-3">
                    Thank you for your feedback!
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300">
                    Your rating has been saved successfully.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
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
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                  </div>

                  {/* Star Rating */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
                      Rate your experience (1-5 stars)
                    </label>
                    <div className="flex gap-4 justify-center">
                      {[1, 2, 3, 4, 5].map((value) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => handleStarClick(value)}
                          onMouseEnter={() => setHoveredRating(value)}
                          onMouseLeave={() => setHoveredRating(0)}
                          className="text-5xl md:text-6xl transition-all duration-200 hover:scale-125 active:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg p-2"
                          aria-label={`Rate ${value} stars`}
                        >
                          <span
                            className={
                              value <= (hoveredRating || rating)
                                ? 'text-yellow-400 drop-shadow-lg filter brightness-110'
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
                      placeholder="Share your thoughts about Vault.Notes..."
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-all"
                    />
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-4">
                      <p className="text-red-600 dark:text-red-400 text-sm font-medium">{error}</p>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isPending || rating === 0}
                    className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 disabled:from-slate-400 disabled:via-slate-500 disabled:to-slate-500 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:transform-none text-lg"
                  >
                    {isPending ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="animate-spin">⏳</span>
                        Saving...
                      </span>
                    ) : (
                      'Submit Rating'
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Recent Notes Section */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-700 sticky top-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-xl">
                  📚
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Recent Notes
                </h2>
              </div>

              <div className="space-y-4">
                {recentNotes.map((note) => (
                  <div
                    key={note.id}
                    className="p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 transition-all cursor-pointer group bg-slate-50 dark:bg-slate-700/50"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xs font-bold px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                        {note.curriculum}
                      </span>
                      <span className="text-sm font-bold text-green-600 dark:text-green-400">
                        {note.price}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                      {note.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                      {note.subject} • {note.teacher}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-400 text-sm">⭐</span>
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {note.rating.toFixed(1)}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {note.date}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <button className="w-full mt-6 py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]">
                View All Notes →
              </button>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">500+</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Study Notes</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">2,500+</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Happy Students</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
            <div className="text-3xl font-bold text-pink-600 dark:text-pink-400 mb-2">4.8</div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Average Rating</div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-8 border-t border-slate-200 dark:border-slate-700">
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            © 2025 Vault.Notes. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
