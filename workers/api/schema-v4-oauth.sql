-- DigiArtifact Workers Portal - Google OAuth Migration
-- Run this to add Google OAuth support to existing database

-- Add Google OAuth columns to users table (without UNIQUE constraint initially)
ALTER TABLE users ADD COLUMN google_id TEXT;
ALTER TABLE users ADD COLUMN google_picture TEXT;

-- Create index for Google ID lookups (unique index serves same purpose)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id) WHERE google_id IS NOT NULL;

-- Note: To fully remove PIN support later, you would:
-- 1. Export data
-- 2. Recreate table without pin_hash
-- 3. Import data
-- For now, we keep pin_hash for backwards compatibility during transition
