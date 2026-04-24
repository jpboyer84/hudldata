import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { LogoIcon } from '../icons/Icons';

export default function TeamSetupPage() {
  const [mode, setMode] = useState('choose'); // choose | create | join
  const [teamName, setTeamName] = useState('');
  const [school, setSchool] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { createTeamAndProfile, joinTeam, user } = useAuth();

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
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

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

          <div className="lcard" onClick={() => setMode('create')} style={{ marginBottom: 12 }}>
            <div className="lcard-icon" style={{ background: 'rgba(232,89,12,0.12)' }}>
              <svg viewBox="0 0 20 20" fill="none" style={{ width: 22, height: 22 }}>
                <path d="M10 4V16M4 10H16" stroke="#e8590c" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="lcard-title">Create a team</div>
              <div className="lcard-sub">Start a new coaching staff</div>
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

  // mode === 'join'
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
          <input className="fi" placeholder="Paste invite code here" value={inviteCode} onChange={e => setInviteCode(e.target.value)} />
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
