-- ══════════════════════════════════════════════════════════════
-- RLS FIX: Team creation was blocked because get_my_team_id()
-- returns NULL when no coach row exists yet (chicken-and-egg).
-- This function handles both inserts atomically with SECURITY DEFINER.
--
-- RUN THIS IN: Supabase Dashboard → SQL Editor → New query
-- ══════════════════════════════════════════════════════════════

-- 1. Create atomic team+coach function
CREATE OR REPLACE FUNCTION create_team_and_coach(
  p_team_name TEXT,
  p_school TEXT DEFAULT NULL,
  p_city TEXT DEFAULT NULL,
  p_state TEXT DEFAULT NULL,
  p_display_name TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_team_id UUID;
  v_result JSON;
BEGIN
  -- Insert team
  INSERT INTO teams (name, school, city, state)
  VALUES (p_team_name, p_school, p_city, p_state)
  RETURNING id INTO v_team_id;

  -- Insert coach profile linked to team
  INSERT INTO coaches (id, email, display_name, team_id, role)
  VALUES (
    auth.uid(),
    (SELECT email FROM auth.users WHERE id = auth.uid()),
    COALESCE(p_display_name, (SELECT email FROM auth.users WHERE id = auth.uid())),
    v_team_id,
    'head_coach'
  );

  -- Return full coach + team JSON
  SELECT json_build_object(
    'id', c.id,
    'email', c.email,
    'display_name', c.display_name,
    'team_id', c.team_id,
    'role', c.role,
    'hudl_cookie', c.hudl_cookie,
    'hudl_team_id', c.hudl_team_id,
    'hudl_team_name', c.hudl_team_name,
    'hudl_connected_at', c.hudl_connected_at,
    'created_at', c.created_at,
    'teams', json_build_object(
      'id', t.id,
      'name', t.name,
      'school', t.school,
      'city', t.city,
      'state', t.state,
      'hudl_team_id', t.hudl_team_id,
      'created_at', t.created_at
    )
  ) INTO v_result
  FROM coaches c
  JOIN teams t ON c.team_id = t.id
  WHERE c.id = auth.uid();

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Also create a join_team function for the same reason
CREATE OR REPLACE FUNCTION join_team_with_code(
  p_team_id UUID,
  p_display_name TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  -- Verify team exists
  IF NOT EXISTS (SELECT 1 FROM teams WHERE id = p_team_id) THEN
    RAISE EXCEPTION 'Team not found';
  END IF;

  -- Insert coach profile
  INSERT INTO coaches (id, email, display_name, team_id, role)
  VALUES (
    auth.uid(),
    (SELECT email FROM auth.users WHERE id = auth.uid()),
    COALESCE(p_display_name, (SELECT email FROM auth.users WHERE id = auth.uid())),
    p_team_id,
    'coach'
  );

  -- Return full coach + team JSON
  SELECT json_build_object(
    'id', c.id,
    'email', c.email,
    'display_name', c.display_name,
    'team_id', c.team_id,
    'role', c.role,
    'hudl_cookie', c.hudl_cookie,
    'hudl_team_id', c.hudl_team_id,
    'hudl_team_name', c.hudl_team_name,
    'hudl_connected_at', c.hudl_connected_at,
    'created_at', c.created_at,
    'teams', json_build_object(
      'id', t.id,
      'name', t.name,
      'school', t.school,
      'city', t.city,
      'state', t.state,
      'hudl_team_id', t.hudl_team_id,
      'created_at', t.created_at
    )
  ) INTO v_result
  FROM coaches c
  JOIN teams t ON c.team_id = t.id
  WHERE c.id = auth.uid();

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
