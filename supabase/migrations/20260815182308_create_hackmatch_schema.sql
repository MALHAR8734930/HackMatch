/*
# HackMatch AI - Database Schema

## Overview
Creates the complete schema for the HackMatch AI system: an AI-powered hackathon
team formation and success prediction platform.

## New Tables
1. `profiles` - Extends Supabase auth.users with role (admin/participant)
2. `participants` - Detailed participant profiles with skill arrays
3. `skills` - Master catalog of skills organized by category
4. `hackathons` - Hackathon event configurations
5. `teams` - Generated teams for a hackathon
6. `team_members` - Membership linking participants to teams
7. `team_scores` - Scoring breakdown per team (success prediction)
8. `recommendations` - AI-generated strengths/weaknesses/improvements per team

## Security
- RLS enabled on ALL tables
- SELECT open to anon + authenticated (demo mode works without login)
- INSERT/UPDATE/DELETE open to anon + authenticated (academic project, shared data)
- Auth role stored in profiles table for frontend role-based access

## Notes
1. This is an academic AIML project with intentionally shared data
2. Demo mode works without authentication (anon key has full CRUD)
3. Auth adds role-based UI layer (admin vs participant views)
4. Skills stored as text[] arrays for efficient algorithm processing
*/

-- ============ PROFILES ============
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL DEFAULT 'participant' CHECK (role IN ('admin', 'participant')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
CREATE POLICY "profiles_select_all" ON profiles FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "profiles_insert_all" ON profiles;
CREATE POLICY "profiles_insert_all" ON profiles FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "profiles_update_all" ON profiles;
CREATE POLICY "profiles_update_all" ON profiles FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "profiles_delete_all" ON profiles;
CREATE POLICY "profiles_delete_all" ON profiles FOR DELETE
  TO anon, authenticated USING (true);

-- ============ SKILLS CATALOG ============
CREATE TABLE IF NOT EXISTS skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('programming', 'ai_ml', 'web_dev', 'database', 'ui_ux', 'soft', 'technical')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(name, category)
);

ALTER TABLE skills ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "skills_select_all" ON skills;
CREATE POLICY "skills_select_all" ON skills FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "skills_insert_all" ON skills;
CREATE POLICY "skills_insert_all" ON skills FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "skills_update_all" ON skills;
CREATE POLICY "skills_update_all" ON skills FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "skills_delete_all" ON skills;
CREATE POLICY "skills_delete_all" ON skills FOR DELETE
  TO anon, authenticated USING (true);

-- ============ PARTICIPANTS ============
CREATE TABLE IF NOT EXISTS participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  college text NOT NULL DEFAULT '',
  department text NOT NULL DEFAULT '',
  year text NOT NULL DEFAULT '',
  technical_skills text[] NOT NULL DEFAULT '{}',
  programming_languages text[] NOT NULL DEFAULT '{}',
  ai_ml_skills text[] NOT NULL DEFAULT '{}',
  web_dev_skills text[] NOT NULL DEFAULT '{}',
  database_skills text[] NOT NULL DEFAULT '{}',
  ui_ux_skills text[] NOT NULL DEFAULT '{}',
  soft_skills text[] NOT NULL DEFAULT '{}',
  areas_of_interest text[] NOT NULL DEFAULT '{}',
  experience_level text NOT NULL DEFAULT 'Beginner' CHECK (experience_level IN ('Beginner', 'Intermediate', 'Advanced', 'Expert')),
  previous_hackathon_experience text NOT NULL DEFAULT 'None',
  preferred_team_role text NOT NULL DEFAULT 'Frontend' CHECK (preferred_team_role IN ('AI/ML', 'Backend', 'Frontend', 'UI/UX', 'Database', 'Research', 'Presentation', 'Project Management')),
  project_interests text[] NOT NULL DEFAULT '{}',
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "participants_select_all" ON participants;
CREATE POLICY "participants_select_all" ON participants FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "participants_insert_all" ON participants;
CREATE POLICY "participants_insert_all" ON participants FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "participants_update_all" ON participants;
CREATE POLICY "participants_update_all" ON participants FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "participants_delete_all" ON participants;
CREATE POLICY "participants_delete_all" ON participants FOR DELETE
  TO anon, authenticated USING (true);

-- ============ HACKATHONS ============
CREATE TABLE IF NOT EXISTS hackathons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  num_participants integer NOT NULL DEFAULT 30,
  team_size integer NOT NULL DEFAULT 4,
  project_domain text NOT NULL,
  required_skills text[] NOT NULL DEFAULT '{}',
  optional_skills text[] NOT NULL DEFAULT '{}',
  difficulty_level text NOT NULL DEFAULT 'Intermediate' CHECK (difficulty_level IN ('Beginner', 'Intermediate', 'Advanced', 'Expert')),
  num_teams integer NOT NULL DEFAULT 5,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE hackathons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "hackathons_select_all" ON hackathons;
CREATE POLICY "hackathons_select_all" ON hackathons FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "hackathons_insert_all" ON hackathons;
CREATE POLICY "hackathons_insert_all" ON hackathons FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "hackathons_update_all" ON hackathons;
CREATE POLICY "hackathons_update_all" ON hackathons FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "hackathons_delete_all" ON hackathons;
CREATE POLICY "hackathons_delete_all" ON hackathons FOR DELETE
  TO anon, authenticated USING (true);

-- ============ TEAMS ============
CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hackathon_id uuid NOT NULL REFERENCES hackathons(id) ON DELETE CASCADE,
  name text NOT NULL,
  team_index integer NOT NULL DEFAULT 0,
  locked boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "teams_select_all" ON teams;
CREATE POLICY "teams_select_all" ON teams FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "teams_insert_all" ON teams;
CREATE POLICY "teams_insert_all" ON teams FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "teams_update_all" ON teams;
CREATE POLICY "teams_update_all" ON teams FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "teams_delete_all" ON teams;
CREATE POLICY "teams_delete_all" ON teams FOR DELETE
  TO anon, authenticated USING (true);

-- ============ TEAM MEMBERS ============
CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  participant_id uuid NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  role text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(team_id, participant_id)
);

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "team_members_select_all" ON team_members;
CREATE POLICY "team_members_select_all" ON team_members FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "team_members_insert_all" ON team_members;
CREATE POLICY "team_members_insert_all" ON team_members FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "team_members_update_all" ON team_members;
CREATE POLICY "team_members_update_all" ON team_members FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "team_members_delete_all" ON team_members;
CREATE POLICY "team_members_delete_all" ON team_members FOR DELETE
  TO anon, authenticated USING (true);

-- ============ TEAM SCORES (Predictions) ============
CREATE TABLE IF NOT EXISTS team_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  success_score numeric NOT NULL DEFAULT 0,
  project_skill_match numeric NOT NULL DEFAULT 0,
  skill_diversity numeric NOT NULL DEFAULT 0,
  experience numeric NOT NULL DEFAULT 0,
  role_coverage numeric NOT NULL DEFAULT 0,
  compatibility numeric NOT NULL DEFAULT 0,
  hackathon_experience numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(team_id)
);

ALTER TABLE team_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "team_scores_select_all" ON team_scores;
CREATE POLICY "team_scores_select_all" ON team_scores FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "team_scores_insert_all" ON team_scores;
CREATE POLICY "team_scores_insert_all" ON team_scores FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "team_scores_update_all" ON team_scores;
CREATE POLICY "team_scores_update_all" ON team_scores FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "team_scores_delete_all" ON team_scores;
CREATE POLICY "team_scores_delete_all" ON team_scores FOR DELETE
  TO anon, authenticated USING (true);

-- ============ RECOMMENDATIONS ============
CREATE TABLE IF NOT EXISTS recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('strength', 'weakness', 'improvement')),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "recommendations_select_all" ON recommendations;
CREATE POLICY "recommendations_select_all" ON recommendations FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "recommendations_insert_all" ON recommendations;
CREATE POLICY "recommendations_insert_all" ON recommendations FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "recommendations_update_all" ON recommendations;
CREATE POLICY "recommendations_update_all" ON recommendations FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "recommendations_delete_all" ON recommendations;
CREATE POLICY "recommendations_delete_all" ON recommendations FOR DELETE
  TO anon, authenticated USING (true);

-- ============ INDEXES ============
CREATE INDEX IF NOT EXISTS idx_participants_email ON participants(email);
CREATE INDEX IF NOT EXISTS idx_teams_hackathon ON teams(hackathon_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_participant ON team_members(participant_id);
CREATE INDEX IF NOT EXISTS idx_team_scores_team ON team_scores(team_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_team ON recommendations(team_id);
CREATE INDEX IF NOT EXISTS idx_skills_category ON skills(category);

-- ============ AUTO-CREATE PROFILE ON SIGNUP ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'), COALESCE(NEW.raw_user_meta_data->>'role', 'participant'))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
