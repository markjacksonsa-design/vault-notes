-- Sales table schema for NoteVault SA
-- Run this in your Cloudflare D1 database to create the sales table

CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    noteId TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    amount REAL NOT NULL,
    reference TEXT UNIQUE NOT NULL,
    created_at TEXT NOT NULL
);

-- Create index on reference for faster duplicate checks
CREATE INDEX IF NOT EXISTS idx_sales_reference ON sales(reference);

-- Create index on noteId for sales analytics
CREATE INDEX IF NOT EXISTS idx_sales_noteId ON sales(noteId);

-- Create index on created_at for time-based queries
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);

