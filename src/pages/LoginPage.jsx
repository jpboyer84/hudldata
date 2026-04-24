import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LogoIcon } from '../icons/Icons';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }
    setError('');
    setLoading(true);

    const { error: err } = await signIn(email, password);
    if (err) setError(err.message);
    setLoading(false);
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

        <div style={{ marginBottom: 8 }}>
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
