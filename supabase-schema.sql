-- Jstz Hackathon Platform Schema
-- Run this SQL in your Supabase SQL editor

-- Ideas table
CREATE TABLE IF NOT EXISTS ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  author_id TEXT NOT NULL, -- localStorage UUID
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_locked BOOLEAN DEFAULT FALSE,
  vote_count INTEGER DEFAULT 0
);

-- Idea votes table
CREATE TABLE IF NOT EXISTS idea_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID REFERENCES ideas(id) ON DELETE CASCADE,
  voter_id TEXT NOT NULL, -- localStorage UUID
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(idea_id, voter_id)
);

-- Teams table
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  leader_id TEXT NOT NULL, -- localStorage UUID
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  max_members INTEGER DEFAULT 5
);

-- Team members table
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL, -- localStorage UUID
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  repo_url TEXT,
  demo_url TEXT,
  video_url TEXT,
  track TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  showcase_vote_count INTEGER DEFAULT 0,
  judges_score DECIMAL(10,2),
  is_winner BOOLEAN DEFAULT FALSE,
  winner_category TEXT
);

-- Showcase votes (Hacker's Choice)
CREATE TABLE IF NOT EXISTS showcase_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  voter_id TEXT NOT NULL, -- localStorage UUID
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, voter_id)
);

-- Admin phases table
CREATE TABLE IF NOT EXISTS admin_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_name TEXT UNIQUE NOT NULL,
  is_open BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default phases
INSERT INTO admin_phases (phase_name, is_open) VALUES
  ('ideas_open', FALSE),
  ('ideas_voting', FALSE),
  ('teams_open', FALSE),
  ('submissions_open', FALSE),
  ('showcase_voting', FALSE),
  ('winners_revealed', FALSE)
ON CONFLICT (phase_name) DO NOTHING;

-- Function to update vote count for ideas
CREATE OR REPLACE FUNCTION update_idea_vote_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE ideas SET vote_count = vote_count + 1 WHERE id = NEW.idea_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE ideas SET vote_count = vote_count - 1 WHERE id = OLD.idea_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for idea votes
DROP TRIGGER IF EXISTS idea_vote_count_trigger ON idea_votes;
CREATE TRIGGER idea_vote_count_trigger
  AFTER INSERT OR DELETE ON idea_votes
  FOR EACH ROW EXECUTE FUNCTION update_idea_vote_count();

-- Function to update showcase vote count
CREATE OR REPLACE FUNCTION update_showcase_vote_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE projects SET showcase_vote_count = showcase_vote_count + 1 WHERE id = NEW.project_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE projects SET showcase_vote_count = showcase_vote_count - 1 WHERE id = OLD.project_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for showcase votes
DROP TRIGGER IF EXISTS showcase_vote_count_trigger ON showcase_votes;
CREATE TRIGGER showcase_vote_count_trigger
  AFTER INSERT OR DELETE ON showcase_votes
  FOR EACH ROW EXECUTE FUNCTION update_showcase_vote_count();

-- Enable Row Level Security (optional, but recommended)
ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE idea_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE showcase_votes ENABLE ROW LEVEL SECURITY;

-- Policies to allow all operations (since we're using localStorage UUIDs)
CREATE POLICY "Allow all on ideas" ON ideas FOR ALL USING (true);
CREATE POLICY "Allow all on idea_votes" ON idea_votes FOR ALL USING (true);
CREATE POLICY "Allow all on teams" ON teams FOR ALL USING (true);
CREATE POLICY "Allow all on team_members" ON team_members FOR ALL USING (true);
CREATE POLICY "Allow all on projects" ON projects FOR ALL USING (true);
CREATE POLICY "Allow all on showcase_votes" ON showcase_votes FOR ALL USING (true);

