import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LogoIcon } from '../icons/Icons';
import OAuthButtons from '../components/OAuthButtons';

export default function SignupPage() {
  const [step, setStep] = useState('account'); // account | team
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [teamName, setTeamName] = useState('');
  const [school, setSchool] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmSent, setConfirmSent] = useState(false);
  const { signUp } = useAuth();

  async function handleCreateAccount(e) {
    e?.preventDefault();
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setError('');
    setLoading(true);

    const { data, error: err } = await signUp(email, password, displayName);
    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }

    // If email confirmation is required, Supabase returns user but no session
    if (data?.user && !data?.session) {
      setConfirmSent(true);
    }
    // If auto-confirmed, the auth listener will pick it up and redirect
    setLoading(false);
  }

  if (confirmSent) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', height: '100dvh', padding: 24
      }}>
        <div style={{ width: '100%', maxWidth: 400, textAlign: 'center' }}>
          <div className="landing-logo-icon" style={{ marginBottom: 16 }}>
            <LogoIcon />
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Check your email</div>
          <div style={{ fontSize: 13, color: 'var(--color-muted)', lineHeight: 1.6, marginBottom: 24 }}>
            We sent a confirmation link to <strong style={{ color: 'var(--color-text)' }}>{email}</strong>.
            Click the link to activate your account.
          </div>
          <Link to="/login" style={{ color: 'var(--color-accent)', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
            Back to sign in
          </Link>
        </div>
      </div>
    );
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
          <div className="landing-logo-sub" style={{ marginTop: 6 }}>CREATE YOUR ACCOUNT</div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label className="fl">YOUR NAME</label>
          <input
            type="text"
            className="fi"
            placeholder="Coach Smith"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label className="fl">EMAIL</label>
          <input
            type="email"
            className="fi"
            placeholder="coach@school.edu"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label className="fl">PASSWORD</label>
          <input
            type="password"
            className="fi"
            placeholder="At least 6 characters"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreateAccount(e)}
          />
        </div>

        {error && <div className="auth-error">{error}</div>}

        <button
          className="btn btn-primary"
          onClick={handleCreateAccount}
          disabled={loading}
          style={{ width: '100%', padding: 14, fontSize: 14 }}
        >
          {loading ? 'CREATING…' : 'CREATE ACCOUNT'}
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
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--color-accent)', fontWeight: 600, textDecoration: 'none' }}>
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
