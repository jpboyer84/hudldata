import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LogoIcon } from '../icons/Icons';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useAuth();

  async function handleSubmit(e) {
    e?.preventDefault();
    if (!email) { setError('Enter your email'); return; }
    setError('');
    setLoading(true);

    const { error: err } = await resetPassword(email);
    if (err) setError(err.message);
    else setSent(true);
    setLoading(false);
  }

  if (sent) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', height: '100dvh', padding: 24
      }}>
        <div style={{ width: '100%', maxWidth: 400, textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Check your email</div>
          <div style={{ fontSize: 13, color: 'var(--color-muted)', lineHeight: 1.6, marginBottom: 24 }}>
            If an account exists for <strong style={{ color: 'var(--color-text)' }}>{email}</strong>,
            you'll receive a password reset link.
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
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div className="landing-logo-icon">
            <LogoIcon />
          </div>
          <div className="landing-logo-title">ASSISTANT COACH</div>
          <div className="landing-logo-sub" style={{ marginTop: 6 }}>RESET YOUR PASSWORD</div>
        </div>

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

        {error && <div className="auth-error">{error}</div>}

        <button
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={loading}
          style={{ width: '100%', padding: 14, fontSize: 14 }}
        >
          {loading ? 'SENDING…' : 'SEND RESET LINK'}
        </button>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <Link to="/login" style={{ color: 'var(--color-accent)', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
