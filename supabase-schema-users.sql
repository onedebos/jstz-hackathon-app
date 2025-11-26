-- Add users table for name-based authentication
-- Run this SQL in your Supabase SQL editor

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update existing tables to reference users instead of localStorage UUID
-- Note: This will require migrating existing data if you have any

-- Add user_id foreign key to ideas (migrate from author_id)
ALTER TABLE ideas 
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Add user_id foreign key to idea_votes (migrate from voter_id)
ALTER TABLE idea_votes 
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- Add user_id foreign key to teams (migrate from leader_id)
ALTER TABLE teams 
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Add user_id foreign key to team_members (migrate from user_id text)
-- Note: Keep old user_id column for now, add new one
ALTER TABLE team_members 
  ADD COLUMN IF NOT EXISTS user_id_uuid UUID REFERENCES users(id) ON DELETE CASCADE;

-- Update unique constraint for team_members to use user_id_uuid
-- Drop old constraint if it exists (may have different names)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'team_members_team_id_user_id_key') THEN
    ALTER TABLE team_members DROP CONSTRAINT team_members_team_id_user_id_key;
  END IF;
END $$;

-- Add new unique constraint
ALTER TABLE team_members 
  ADD CONSTRAINT IF NOT EXISTS team_members_team_id_user_id_uuid_key UNIQUE(team_id, user_id_uuid);

-- Add user_id foreign key to showcase_votes (migrate from voter_id)
ALTER TABLE showcase_votes 
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- Create index on name for fast lookups
CREATE INDEX IF NOT EXISTS idx_users_name ON users(name);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy to allow all operations on users
-- Note: WITH CHECK (true) is required for INSERT operations to work with RLS enabled
CREATE POLICY "Allow all on users" ON users FOR ALL USING (true) WITH CHECK (true);

