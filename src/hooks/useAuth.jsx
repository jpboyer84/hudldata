import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [coach, setCoach] = useState(null);
  const [loading, setLoading] = useState(true);
  const [passwordRecovery, setPasswordRecovery] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchCoach(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (event === 'PASSWORD_RECOVERY') {
          setPasswordRecovery(true);
        }
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
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/reset-password',
    });
    return { data, error };
  }

  async function createTeamAndProfile({ teamName, school, city, state, displayName }) {
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase.rpc('create_team_and_coach', {
      p_team_name: teamName,
      p_school: school || null,
      p_city: city || null,
      p_state: state || null,
      p_display_name: displayName || user.email,
    });

    if (error) throw error;
    setCoach(data);
    return data;
  }

  async function joinTeam({ teamId, displayName }) {
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase.rpc('join_team_with_code', {
      p_team_id: teamId,
      p_display_name: displayName || user.email,
    });

    if (error) throw error;
    setCoach(data);
    return data;
  }

  async function updateHudlConnection({ cookie, teamId, teamName }) {
    const id = coach?.id || user?.id;
    if (!id) return;
    const { error } = await supabase
      .from('coaches')
      .update({
        hudl_cookie: cookie,
        hudl_team_id: teamId,
        hudl_team_name: teamName,
        hudl_connected_at: new Date().toISOString(),
      })
      .eq('id', id);

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

  async function updatePassword(newPassword) {
    const { data, error } = await supabase.auth.updateUser({ password: newPassword });
    return { data, error };
  }

  const value = {
    session,
    user,
    coach,
    loading,
    passwordRecovery,
    setPasswordRecovery,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
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
