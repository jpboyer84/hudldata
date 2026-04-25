import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { LogoIcon, HudlConnectIcon } from '../icons/Icons';
import { HUDL_API } from '../lib/constants';

export default function TeamSetupPage() {
  const [mode, setMode] = useState('choose'); // choose | hudl | create | join
  const [hudlEmail, setHudlEmail] = useState('');
  const [hudlPassword, setHudlPassword] = useState('');
  const [teamName, setTeamName] = useState('');
  const [school, setSchool] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { createTeamAndProfile, joinTeam, updateHudlConnection, user } = useAuth();
  const showToast = useToast();
  const navigate = useNavigate();

  async function handleHudlConnect() {
    if (!hudlEmail || !hudlPassword) { setError('Enter your Hudl email and password'); return; }
    setError('');
    setLoading(true);
    try {
      // 1. Login to Hudl
      const resp = await fetch(`${HUDL_API}/api/hudl/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: hudlEmail, password: hudlPassword }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Hudl login failed');

      // 2. Create team + coach profile using Hudl team info
      const displayName = user?.user_metadata?.display_name || user?.email;
      await createTeamAndProfile({
        teamName: data.teamName || 'My Team',
        school: '',
        city: '',
        state: '',
        displayName,
      });

      // 3. Save Hudl connection to the new coach record
      await updateHudlConnection({
        cookie: data.cookie,
        teamId: data.teamId,
        teamName: data.teamName,
      });

      showToast(`Connected — ${data.teamName || 'Team'}`);
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  async function handleCreate() {
    if (!teamName.trim()) { setError('Team name is required'); return; }
    setError('');
    setLoading(true);
    try {
      await createTeamAndProfile({
        teamName: teamName.trim(),
        school: school.trim(),
        city: city.trim(),
        state: state.trim(),
        displayName: user?.user_metadata?.display_name || user?.email,
      });
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  async function handleJoin() {
    if (!inviteCode.trim()) { setError('Invite code is required'); return; }
    setError('');
    setLoading(true);
    try {
      await joinTeam({
        teamId: inviteCode.trim(),
        displayName: user?.user_metadata?.display_name || user?.email,
      });
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  // ─── CHOOSE MODE ───
  if (mode === 'choose') {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', height: '100dvh', padding: 24
      }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div className="landing-logo-icon"><LogoIcon /></div>
            <div className="landing-logo-title">ASSISTANT COACH</div>
            <div className="landing-logo-sub" style={{ marginTop: 6 }}>SET UP YOUR TEAM</div>
          </div>

          {/* Primary: Connect with Hudl */}
          <div className="lcard" onClick={() => setMode('hudl')} style={{ marginBottom: 12, borderColor: 'rgba(232,89,12,0.4)' }}>
            <div className="lcard-icon" style={{ background: 'rgba(232,89,12,0.12)' }}>
              <HudlConnectIcon />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="lcard-title">Connect with Hudl</div>
              <div className="lcard-sub">Auto-setup from your Hudl account</div>
            </div>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 4L10 8L6 12" stroke="#444" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>

          <div className="lcard" onClick={() => setMode('create')} style={{ marginBottom: 12 }}>
            <div className="lcard-icon" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <svg viewBox="0 0 20 20" fill="none" style={{ width: 22, height: 22 }}>
                <path d="M10 4V16M4 10H16" stroke="#555" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="lcard-title">Create manually</div>
              <div className="lcard-sub">Set up without Hudl</div>
            </div>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 4L10 8L6 12" stroke="#444" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>

          <div className="lcard" onClick={() => setMode('join')}>
            <div className="lcard-icon" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <svg viewBox="0 0 20 20" fill="none" style={{ width: 22, height: 22 }}>
                <path d="M7 10H13M13 10L10 7M13 10L10 13" stroke="#555" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="10" cy="10" r="7" stroke="#555" strokeWidth="1.5"/>
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="lcard-title">Join a team</div>
              <div className="lcard-sub">Enter an invite code</div>
            </div>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 4L10 8L6 12" stroke="#444" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
        </div>
      </div>
    );
  }

  // ─── HUDL CONNECT ───
  if (mode === 'hudl') {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', height: '100dvh', padding: 24
      }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div className="landing-logo-title" style={{ fontSize: 18 }}>Connect with Hudl</div>
            <div className="landing-logo-sub" style={{ marginTop: 4 }}>YOUR TEAM WILL BE SET UP AUTOMATICALLY</div>
          </div>

          <div style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 16, lineHeight: 1.5, textAlign: 'center' }}>
            Enter your Hudl credentials to create a session. Your password is never stored.
          </div>

          <div style={{ marginBottom: 14 }}>
            <label className="fl">HUDL EMAIL</label>
            <input className="fi" type="email" placeholder="coach@school.edu" value={hudlEmail} onChange={e => setHudlEmail(e.target.value)} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label className="fl">HUDL PASSWORD</label>
            <input className="fi" type="password" placeholder="••••••••" value={hudlPassword} onChange={e => setHudlPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleHudlConnect()} />
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button
            className="btn btn-primary"
            onClick={handleHudlConnect}
            disabled={loading}
            style={{ width: '100%', padding: 14, fontSize: 14 }}
          >
            {loading ? 'CONNECTING…' : 'CONNECT & SET UP'}
          </button>

          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <span
              onClick={() => { setMode('choose'); setError(''); }}
              style={{ color: 'var(--color-accent)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              ← Back
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ─── CREATE MANUALLY ───
  if (mode === 'create') {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', height: '100dvh', padding: 24
      }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div className="landing-logo-title" style={{ fontSize: 18 }}>Create your team</div>
            <div className="landing-logo-sub" style={{ marginTop: 4 }}>YOUR STAFF WILL JOIN WITH AN INVITE CODE</div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label className="fl">TEAM NAME *</label>
            <input className="fi" placeholder="Wildcats" value={teamName} onChange={e => setTeamName(e.target.value)} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label className="fl">SCHOOL</label>
            <input className="fi" placeholder="Hanover Central High School" value={school} onChange={e => setSchool(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            <div style={{ flex: 1 }}>
              <label className="fl">CITY</label>
              <input className="fi" placeholder="Cedar Lake" value={city} onChange={e => setCity(e.target.value)} />
            </div>
            <div style={{ width: 80 }}>
              <label className="fl">STATE</label>
              <input className="fi" placeholder="IN" value={state} onChange={e => setState(e.target.value)} />
            </div>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button
            className="btn btn-primary"
            onClick={handleCreate}
            disabled={loading}
            style={{ width: '100%', padding: 14, fontSize: 14 }}
          >
            {loading ? 'CREATING…' : 'CREATE TEAM'}
          </button>

          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <span
              onClick={() => { setMode('choose'); setError(''); }}
              style={{ color: 'var(--color-accent)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              ← Back
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ─── JOIN TEAM ───
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '100dvh', padding: 24
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div className="landing-logo-title" style={{ fontSize: 18 }}>Join a team</div>
          <div className="landing-logo-sub" style={{ marginTop: 4 }}>ASK YOUR HEAD COACH FOR THE INVITE CODE</div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label className="fl">TEAM INVITE CODE</label>
          <input className="fi" placeholder="e.g. 6RK9BU" value={inviteCode} onChange={e => setInviteCode(e.target.value.toUpperCase())} maxLength={6} style={{ fontFamily: 'monospace', fontSize: 20, fontWeight: 700, letterSpacing: '0.15em', textAlign: 'center' }} />
        </div>

        {error && <div className="auth-error">{error}</div>}

        <button
          className="btn btn-primary"
          onClick={handleJoin}
          disabled={loading}
          style={{ width: '100%', padding: 14, fontSize: 14 }}
        >
          {loading ? 'JOINING…' : 'JOIN TEAM'}
        </button>

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <span
            onClick={() => { setMode('choose'); setError(''); }}
            style={{ color: 'var(--color-accent)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            ← Back
          </span>
        </div>
      </div>
    </div>
  );
}
