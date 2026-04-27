import { supabase } from './supabase';

// ─── GAMES ───────────────────────────────────────────────────

export async function fetchGames(teamId) {
  const { data, error } = await supabase
    .from('games')
    .select('*')
    .eq('team_id', teamId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function fetchGame(gameId) {
  const { data, error } = await supabase
    .from('games')
    .select('*')
    .eq('id', gameId)
    .single();
  if (error) throw error;
  return data;
}

export async function createGame(game) {
  const { data, error } = await supabase
    .from('games')
    .insert(game)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateGame(gameId, updates) {
  const { data, error } = await supabase
    .from('games')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', gameId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteGame(gameId) {
  const { error } = await supabase
    .from('games')
    .delete()
    .eq('id', gameId);
  if (error) throw error;
}

// ─── TEMPLATES ───────────────────────────────────────────────

export async function fetchTemplates(teamId) {
  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .eq('team_id', teamId)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function createTemplate(tmpl) {
  const { data, error } = await supabase
    .from('templates')
    .insert(tmpl)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateTemplate(id, updates) {
  const { data, error } = await supabase
    .from('templates')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteTemplate(id) {
  const { error } = await supabase
    .from('templates')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ─── COLUMNS ─────────────────────────────────────────────────

export async function fetchColumns(teamId) {
  const { data, error } = await supabase
    .from('columns')
    .select('*')
    .eq('team_id', teamId)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function createColumn(col) {
  const { data, error } = await supabase
    .from('columns')
    .insert(col)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateColumn(id, updates) {
  const { data, error } = await supabase
    .from('columns')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteColumn(id) {
  const { error } = await supabase
    .from('columns')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ─── SAVED INSIGHTS (cross-device) ───

export async function fetchSavedInsights(coachId) {
  const { data, error } = await supabase
    .from('saved_insights')
    .select('*')
    .eq('coach_id', coachId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createSavedInsight({ coach_id, team_id, question, answer, data_label }) {
  const { data, error } = await supabase
    .from('saved_insights')
    .insert({ coach_id, team_id, question, answer, data_label })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteSavedInsight(id) {
  const { error } = await supabase
    .from('saved_insights')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ─── SPOTLIGHT FEEDBACK (cross-device) ───

export async function fetchSpotlightFeedback(coachId) {
  const { data, error } = await supabase
    .from('spotlight_feedback')
    .select('*')
    .eq('coach_id', coachId);
  if (error) throw error;
  // Convert to the format the app expects: { liked: [...], disliked: [...] }
  const liked = (data || []).filter(f => f.liked).map(f => f.headline || f.stat || f.tag);
  const disliked = (data || []).filter(f => !f.liked).map(f => f.headline || f.stat || f.tag);
  return { liked, disliked };
}

export async function upsertSpotlightFeedback({ coach_id, team_id, headline, stat, tag, liked }) {
  const { error } = await supabase
    .from('spotlight_feedback')
    .upsert({ coach_id, team_id, headline, stat, tag, liked },
      { onConflict: 'coach_id,headline' });
  if (error) {
    // If upsert fails (no unique constraint), just insert
    await supabase.from('spotlight_feedback')
      .insert({ coach_id, team_id, headline, stat, tag, liked });
  }
}

