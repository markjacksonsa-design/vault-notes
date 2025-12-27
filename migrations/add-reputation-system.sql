-- Migration: Add Reputation and Trust System
-- Run this in your Cloudflare D1 database

-- Add reputation_points column to users table (default 0)
ALTER TABLE users ADD COLUMN reputation_points INTEGER DEFAULT 0;

-- Add tier column to users table (default 'Candidate')
ALTER TABLE users ADD COLUMN tier TEXT DEFAULT 'Candidate';

-- Add is_vouched column to sales table (default false)
ALTER TABLE sales ADD COLUMN is_vouched INTEGER DEFAULT 0;

-- Update existing users to have default values
UPDATE users SET reputation_points = 0 WHERE reputation_points IS NULL;
UPDATE users SET tier = 'Candidate' WHERE tier IS NULL;

-- Update existing sales to have default value
UPDATE sales SET is_vouched = 0 WHERE is_vouched IS NULL;

