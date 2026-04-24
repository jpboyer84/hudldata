import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { HUDL_API } from '../lib/constants';

export default function HudlLoginModal({ open, onClose }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { updateHudlConnection } = useAuth();
  const showToast = useToast();

  if (!open) return null;

  async function handleSubmit() {
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const resp = await fetch(`${HUDL_API}/api/hudl/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Login failed');

      // Save to Supabase coach record
      await updateHudlConnection({
        cookie: data.cookie,
        teamId: data.teamId,
        teamName: data.teamName,
      });

      showToast(`Connected to Hudl — ${data.teamName || 'Team'}`);
      setEmail('');
      setPassword('');
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div className="overlay" onClick={handleOverlayClick}>
      <div className="modal" style={{ maxWidth: 400 }}>
        <div className="modal-hdr">
          <div className="modal-title">CONNECT TO HUDL</div>
          <div className="modal-x" onClick={onClose}>✕</div>
        </div>
        <div className="modal-body" style={{ padding: 18 }}>
          <div style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 14, lineHeight: 1.5 }}>
            Enter your Hudl credentials to connect your account. Your login is used to create a session — credentials are never stored.
          </div>

          <div style={{ marginBottom: 10 }}>
            <label className="fl">EMAIL</label>
            <input
              type="email"
              className="fi-sm"
              placeholder="coach@school.edu"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label className="fl">PASSWORD</label>
            <input
              type="password"
              className="fi-sm"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={loading}
            style={{ width: '100%', padding: 12, fontSize: 13 }}
          >
            {loading ? 'CONNECTING…' : 'CONNECT'}
          </button>

          <div style={{ fontSize: 10, color: 'var(--color-muted)', marginTop: 10, textAlign: 'center', lineHeight: 1.4 }}>
            Your credentials are sent securely to create a session cookie. They are not saved or stored anywhere.
          </div>
        </div>
      </div>
    </div>
  );
}
