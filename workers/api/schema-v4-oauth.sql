-- DigiArtifact Workers Portal - Google OAuth Migration
-- Run this to add Google OAuth support to existing database

-- Add Google OAuth columns to users table
ALTER TABLE users ADD COLUMN google_id TEXT UNIQUE;
ALTER TABLE users ADD COLUMN google_picture TEXT;

-- Make pin_hash optional (for transition period)
-- SQLite doesn't support ALTER COLUMN, so we'll handle this in application logic
-- Existing users keep their pin_hash, new Google users won't have one

-- Create index for Google ID lookups
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);

-- Note: To fully remove PIN support later, you would:
-- 1. Export data
-- 2. Recreate table without pin_hash
-- 3. Import data
-- For now, we keep pin_hash for backwards compatibility during transition
