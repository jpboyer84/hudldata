import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { LogoIcon } from '../icons/Icons';
import { HUDL_API } from '../lib/constants';
import OAuthButtons from '../components/OAuthButtons';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [connectHudl, setConnectHudl] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, updateHudlConnection } = useAuth();
  const showToast = useToast();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e?.preventDefault();
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }
    setError('');
    setLoading(true);

    const { error: err } = await signIn(email, password);
    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }

    // If connect Hudl is checked, try logging into Hudl with same credentials
    if (connectHudl) {
      try {
        const resp = await fetch(`${HUDL_API}/api/hudl/auth`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await resp.json();
        if (resp.ok && data.cookie) {
          await updateHudlConnection({
            cookie: data.cookie,
            teamId: data.teamId,
            teamName: data.teamName,
          });
          showToast(`Connected to Hudl — ${data.teamName || 'Team'}`);
        }
      } catch (hudlErr) {
        // Hudl connect failed silently — they're still signed in to the app
      }
    }

    setLoading(false);
    navigate('/');
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '100dvh', padding: 24
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div className="landing-logo-icon">
            <LogoIcon />
          </div>
          <div className="landing-logo-title">ASSISTANT COACH</div>
          <div className="landing-logo-sub" style={{ marginTop: 6 }}>SIGN IN TO YOUR ACCOUNT</div>
        </div>

        {/* Form */}
        <div style={{ marginBottom: 14 }}>
          <label className="fl">EMAIL</label>
          <input
            type="email"
            className="fi"
            placeholder="coach@school.edu"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit(e)}
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label className="fl">PASSWORD</label>
          <input
            type="password"
            className="fi"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit(e)}
          />
        </div>

        {/* Checkboxes */}
        <div style={{ marginBottom: 6 }}>
          <label style={{
            display: 'flex', alignItems: 'center', gap: 8,
            fontSize: 12, color: 'var(--color-muted2)', cursor: 'pointer', userSelect: 'none'
          }}>
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={e => setRememberMe(e.target.checked)}
              style={{ accentColor: 'var(--color-accent)', width: 16, height: 16 }}
            />
            Keep me signed in
          </label>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{
            display: 'flex', alignItems: 'center', gap: 8,
            fontSize: 12, color: 'var(--color-muted2)', cursor: 'pointer', userSelect: 'none'
          }}>
            <input
              type="checkbox"
              checked={connectHudl}
              onChange={e => setConnectHudl(e.target.checked)}
              style={{ accentColor: 'var(--color-accent)', width: 16, height: 16 }}
            />
            Also connect my Hudl account (same login)
          </label>
        </div>

        <div style={{ textAlign: 'right', marginBottom: 14 }}>
          <Link to="/forgot-password" style={{
            color: 'var(--color-accent)', fontSize: 12, fontWeight: 500, textDecoration: 'none'
          }}>
            Forgot password?
          </Link>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <button
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={loading}
          style={{ width: '100%', padding: 14, fontSize: 14 }}
        >
          {loading ? 'SIGNING IN…' : 'SIGN IN'}
        </button>

        {/* Divider */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, margin: '18px 0',
        }}>
          <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
          <span style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 500 }}>OR</span>
          <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
        </div>

        <OAuthButtons />

        <div style={{
          textAlign: 'center', marginTop: 20,
          fontSize: 13, color: 'var(--color-muted)'
        }}>
          Don't have an account?{' '}
          <Link to="/signup" style={{ color: 'var(--color-accent)', fontWeight: 600, textDecoration: 'none' }}>
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
