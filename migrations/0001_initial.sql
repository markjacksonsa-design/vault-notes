-- Create ratings table
CREATE TABLE IF NOT EXISTS ratings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_email TEXT NOT NULL,
  rating_value INTEGER NOT NULL CHECK (rating_value >= 1 AND rating_value <= 5),
  comment TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create index on user_email for faster lookups
CREATE INDEX IF NOT EXISTS idx_ratings_user_email ON ratings(user_email);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_ratings_created_at ON ratings(created_at);

