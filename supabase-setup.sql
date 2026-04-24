-- ══════════════════════════════════════════════════════════════
-- ASSISTANT COACH — Supabase Schema Setup
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- ══════════════════════════════════════════════════════════════

-- ── TEAMS ──
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  school TEXT,
  city TEXT,
  state TEXT,
  hudl_team_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── COACHES (extends auth.users) ──
CREATE TABLE IF NOT EXISTS coaches (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  team_id UUID REFERENCES teams(id),
  role TEXT DEFAULT 'coach',
  hudl_cookie TEXT,
  hudl_team_id TEXT,
  hudl_team_name TEXT,
  hudl_connected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── PLAYBOOKS (one per team) ──
CREATE TABLE IF NOT EXISTS playbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) UNIQUE,
  team_info TEXT,
  general TEXT,
  run_plays TEXT,
  pass_plays TEXT,
  formations TEXT,
  tags TEXT,
  defense TEXT,
  stat_rules TEXT,
  updated_by UUID REFERENCES coaches(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── TEMPLATES ──
CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id),
  name TEXT NOT NULL,
  col_ids TEXT[] NOT NULL,
  hudl_column_set_id INTEGER,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── CUSTOM COLUMNS ──
CREATE TABLE IF NOT EXISTS columns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id),
  data_key TEXT NOT NULL,
  name TEXT NOT NULL,
  known_values TEXT[],
  hudl_column_id INTEGER,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── GAMES ──
CREATE TABLE IF NOT EXISTS games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id),
  created_by UUID REFERENCES coaches(id),
  home TEXT,
  away TEXT,
  week TEXT,
  date TEXT,
  game_type TEXT DEFAULT 'Game',
  template_id UUID REFERENCES templates(id),
  hudl_source TEXT,
  hudl_cutup_id TEXT,
  plays JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── SAVED AI INSIGHTS ──
CREATE TABLE IF NOT EXISTS saved_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID REFERENCES coaches(id),
  team_id UUID REFERENCES teams(id),
  question TEXT,
  answer TEXT,
  data_label TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── SPOTLIGHT FEEDBACK ──
CREATE TABLE IF NOT EXISTS spotlight_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID REFERENCES coaches(id),
  team_id UUID REFERENCES teams(id),
  headline TEXT,
  stat TEXT,
  tag TEXT,
  liked BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ══════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ══════════════════════════════════════════════════════════════

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE playbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE spotlight_feedback ENABLE ROW LEVEL SECURITY;

-- Helper: get current user's team_id
CREATE OR REPLACE FUNCTION get_my_team_id()
RETURNS UUID AS $$
  SELECT team_id FROM coaches WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ── TEAMS: coaches can read their own team, anyone can insert (for team creation) ──
CREATE POLICY "Coaches can view own team"
  ON teams FOR SELECT
  USING (id = get_my_team_id());

CREATE POLICY "Authenticated users can create teams"
  ON teams FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ── COACHES: can read teammates, insert/update own record ──
CREATE POLICY "Coaches can view teammates"
  ON coaches FOR SELECT
  USING (team_id = get_my_team_id() OR id = auth.uid());

CREATE POLICY "Users can insert own coach record"
  ON coaches FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update own coach record"
  ON coaches FOR UPDATE
  USING (id = auth.uid());

-- ── PLAYBOOKS: team-scoped ──
CREATE POLICY "Team members can view playbook"
  ON playbooks FOR SELECT
  USING (team_id = get_my_team_id());

CREATE POLICY "Team members can insert playbook"
  ON playbooks FOR INSERT
  WITH CHECK (team_id = get_my_team_id());

CREATE POLICY "Team members can update playbook"
  ON playbooks FOR UPDATE
  USING (team_id = get_my_team_id());

-- ── TEMPLATES: team-scoped ──
CREATE POLICY "Team members can view templates"
  ON templates FOR SELECT
  USING (team_id = get_my_team_id());

CREATE POLICY "Team members can insert templates"
  ON templates FOR INSERT
  WITH CHECK (team_id = get_my_team_id());

CREATE POLICY "Team members can update templates"
  ON templates FOR UPDATE
  USING (team_id = get_my_team_id());

CREATE POLICY "Team members can delete templates"
  ON templates FOR DELETE
  USING (team_id = get_my_team_id());

-- ── COLUMNS: team-scoped ──
CREATE POLICY "Team members can view columns"
  ON columns FOR SELECT
  USING (team_id = get_my_team_id());

CREATE POLICY "Team members can insert columns"
  ON columns FOR INSERT
  WITH CHECK (team_id = get_my_team_id());

CREATE POLICY "Team members can update columns"
  ON columns FOR UPDATE
  USING (team_id = get_my_team_id());

CREATE POLICY "Team members can delete columns"
  ON columns FOR DELETE
  USING (team_id = get_my_team_id());

-- ── GAMES: team-scoped ──
CREATE POLICY "Team members can view games"
  ON games FOR SELECT
  USING (team_id = get_my_team_id());

CREATE POLICY "Team members can insert games"
  ON games FOR INSERT
  WITH CHECK (team_id = get_my_team_id());

CREATE POLICY "Team members can update games"
  ON games FOR UPDATE
  USING (team_id = get_my_team_id());

CREATE POLICY "Team members can delete games"
  ON games FOR DELETE
  USING (team_id = get_my_team_id());

-- ── SAVED INSIGHTS: team-scoped ──
CREATE POLICY "Team members can view insights"
  ON saved_insights FOR SELECT
  USING (team_id = get_my_team_id());

CREATE POLICY "Coaches can insert insights"
  ON saved_insights FOR INSERT
  WITH CHECK (coach_id = auth.uid());

CREATE POLICY "Coaches can delete own insights"
  ON saved_insights FOR DELETE
  USING (coach_id = auth.uid());

-- ── SPOTLIGHT FEEDBACK: team-scoped ──
CREATE POLICY "Team members can view feedback"
  ON spotlight_feedback FOR SELECT
  USING (team_id = get_my_team_id());

CREATE POLICY "Coaches can insert feedback"
  ON spotlight_feedback FOR INSERT
  WITH CHECK (coach_id = auth.uid());


-- ══════════════════════════════════════════════════════════════
-- INDEXES
-- ══════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_coaches_team_id ON coaches(team_id);
CREATE INDEX IF NOT EXISTS idx_games_team_id ON games(team_id);
CREATE INDEX IF NOT EXISTS idx_templates_team_id ON templates(team_id);
CREATE INDEX IF NOT EXISTS idx_columns_team_id ON columns(team_id);
CREATE INDEX IF NOT EXISTS idx_saved_insights_team_id ON saved_insights(team_id);
CREATE INDEX IF NOT EXISTS idx_spotlight_feedback_team_id ON spotlight_feedback(team_id);
