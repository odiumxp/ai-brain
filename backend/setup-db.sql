-- AI Brain Database Setup Script
-- This script creates the database and sets up all tables

-- First, we'll connect and create the database
-- Run this with: psql -U postgres -f setup-db.sql

-- Create database (skip if already exists)
SELECT 'CREATE DATABASE aibrain'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'aibrain')\gexec

-- Connect to aibrain database
\c aibrain

-- Now run the full schema
\i src/db/schema.sql

-- Verify setup
SELECT 'Database setup complete!' as status;
SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = 'public';
SELECT extname as extension FROM pg_extension WHERE extname = 'vector';
