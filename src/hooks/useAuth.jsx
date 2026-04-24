import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [coach, setCoach] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchCoach(session.user.id);
      else setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) fetchCoach(session.user.id);
        else {
          setCoach(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function fetchCoach(userId) {
    try {
      const { data, error } = await supabase
        .from('coaches')
        .select('*, teams(*)')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching coach:', error);
      }
      setCoach(data || null);
    } catch (err) {
      console.error('fetchCoach error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function signUp(email, password, displayName) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });
    return { data, error };
  }

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  }

  async function signOut() {
    await supabase.auth.signOut();
    setCoach(null);
  }

  async function resetPassword(email) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email);
    return { data, error };
  }

  // Create team + coach profile after signup
  async function createTeamAndProfile({ teamName, school, city, state, displayName }) {
    if (!user) throw new Error('Not authenticated');

    // Create team
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .insert({ name: teamName, school, city, state })
      .select()
      .single();

    if (teamError) throw teamError;

    // Create coach profile linked to team
    const { data: coachData, error: coachError } = await supabase
      .from('coaches')
      .insert({
        id: user.id,
        email: user.email,
        display_name: displayName || user.email,
        team_id: team.id,
        role: 'head_coach',
      })
      .select('*, teams(*)')
      .single();

    if (coachError) throw coachError;

    setCoach(coachData);
    return coachData;
  }

  // Join existing team with invite code
  async function joinTeam({ teamId, displayName }) {
    if (!user) throw new Error('Not authenticated');

    const { data: coachData, error } = await supabase
      .from('coaches')
      .insert({
        id: user.id,
        email: user.email,
        display_name: displayName || user.email,
        team_id: teamId,
        role: 'coach',
      })
      .select('*, teams(*)')
      .single();

    if (error) throw error;
    setCoach(coachData);
    return coachData;
  }

  // Update Hudl connection info on coach record
  async function updateHudlConnection({ cookie, teamId, teamName }) {
    if (!coach) return;
    const { error } = await supabase
      .from('coaches')
      .update({
        hudl_cookie: cookie,
        hudl_team_id: teamId,
        hudl_team_name: teamName,
        hudl_connected_at: new Date().toISOString(),
      })
      .eq('id', coach.id);

    if (!error) {
      setCoach(prev => ({
        ...prev,
        hudl_cookie: cookie,
        hudl_team_id: teamId,
        hudl_team_name: teamName,
        hudl_connected_at: new Date().toISOString(),
      }));
    }
    return { error };
  }

  async function disconnectHudl() {
    if (!coach) return;
    const { error } = await supabase
      .from('coaches')
      .update({
        hudl_cookie: null,
        hudl_team_id: null,
        hudl_team_name: null,
        hudl_connected_at: null,
      })
      .eq('id', coach.id);

    if (!error) {
      setCoach(prev => ({
        ...prev,
        hudl_cookie: null,
        hudl_team_id: null,
        hudl_team_name: null,
        hudl_connected_at: null,
      }));
    }
    return { error };
  }

  const value = {
    session,
    user,
    coach,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    createTeamAndProfile,
    joinTeam,
    updateHudlConnection,
    disconnectHudl,
    refreshCoach: () => user && fetchCoach(user.id),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
