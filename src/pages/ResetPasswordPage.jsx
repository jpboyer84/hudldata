import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LogoIcon } from '../icons/Icons';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const { updatePassword, setPasswordRecovery } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e?.preventDefault();
    if (!password) { setError('Enter a new password'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (password !== confirm) { setError('Passwords do not match'); return; }

    setError('');
    setLoading(true);

    const { error: err } = await updatePassword(password);
    if (err) {
      setError(err.message);
    } else {
      setPasswordRecovery(false);
      navigate('/login');
    }
    setLoading(false);
  }

  if (done) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', height: '100dvh', padding: 24
      }}>
        <div style={{ width: '100%', maxWidth: 400, textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Password updated</div>
          <div style={{ fontSize: 13, color: 'var(--color-muted)', lineHeight: 1.6, marginBottom: 24 }}>
            Your password has been changed successfully.
          </div>
          <span
            onClick={() => navigate('/')}
            style={{ color: 'var(--color-accent)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            Go to app →
          </span>
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
          <div className="landing-logo-sub" style={{ marginTop: 6 }}>SET NEW PASSWORD</div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label className="fl">NEW PASSWORD</label>
          <input
            type="password"
            className="fi"
            placeholder="New password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label className="fl">CONFIRM PASSWORD</label>
          <input
            type="password"
            className="fi"
            placeholder="Confirm password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
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
          {loading ? 'UPDATING…' : 'UPDATE PASSWORD'}
        </button>
      </div>
    </div>
  );
}
