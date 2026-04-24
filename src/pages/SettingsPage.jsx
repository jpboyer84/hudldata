import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import Header from '../components/Header';
import HudlLoginModal from '../components/HudlLoginModal';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { coach, signOut, disconnectHudl } = useAuth();
  const showToast = useToast();
  const [hudlModalOpen, setHudlModalOpen] = useState(false);

  const hudlConnected = !!coach?.hudl_cookie;

  async function handleDisconnectHudl() {
    await disconnectHudl();
    showToast('Disconnected from Hudl');
  }

  async function handleSignOut() {
    await signOut();
    navigate('/login');
  }

  return (
    <div className="view">
      <Header title="Settings" onBack={() => navigate('/')} />

      <div className="settings-body">
        {/* Save Full Backup */}
        <div className="settings-group">
          <div className="settings-group-title">💾 Save Full Backup</div>
          <div className="settings-group-sub">
            Save all your games, templates, and columns to a safe location. Useful for backing up or moving to another device.
          </div>
          <div className="settings-row">
            <div className="settings-btn" onClick={() => showToast('Coming in Phase 4')}>
              <span className="settings-btn-icon">📁</span>
              SAVE TO DEVICE
              <span className="settings-btn-label">Download JSON file</span>
            </div>
            <div className="settings-btn" onClick={() => showToast('Coming in Phase 4')}>
              <span className="settings-btn-icon">☁️</span>
              SAVE TO DRIVE
              <span className="settings-btn-label">Google Drive</span>
            </div>
          </div>
        </div>

        {/* Restore Full Backup */}
        <div className="settings-group">
          <div className="settings-group-title">📥 Restore Full Backup</div>
          <div className="settings-group-sub">
            Load a previously saved backup to restore all your data (games, templates, columns).
          </div>
          <div className="settings-row">
            <div className="settings-btn" onClick={() => showToast('Coming in Phase 4')}>
              <span className="settings-btn-icon">📁</span>
              FROM DEVICE
              <span className="settings-btn-label">Choose JSON file</span>
            </div>
            <div className="settings-btn" onClick={() => showToast('Coming in Phase 4')}>
              <span className="settings-btn-icon">☁️</span>
              FROM DRIVE
              <span className="settings-btn-label">Google Drive</span>
            </div>
          </div>
        </div>

        {/* Templates & columns */}
        <div className="settings-group">
          <div className="settings-group-title">Templates & columns</div>
          <div className="settings-group-sub">
            Manage your tracker templates and custom columns.
          </div>
          <div className="settings-row">
            <div className="settings-btn" onClick={() => navigate('/templates')}>
              <span className="settings-btn-icon">📐</span>
              Templates
            </div>
            <div className="settings-btn" onClick={() => navigate('/columns')}>
              <span className="settings-btn-icon">📋</span>
              Columns
            </div>
          </div>
        </div>

        {/* Hudl connection */}
        <div className="settings-group">
          <div className="settings-group-title">Hudl connection</div>
          <div className="settings-group-sub">
            {hudlConnected
              ? `Connected as ${coach?.hudl_team_name || 'your team'}`
              : 'Not connected — using default server session.'
            }
          </div>
          {!hudlConnected ? (
            <div className="settings-row">
              <div className="settings-btn" onClick={() => setHudlModalOpen(true)}>
                <span className="settings-btn-icon">🔗</span>
                Connect to Hudl
                <span className="settings-btn-label">Login with your account</span>
              </div>
            </div>
          ) : (
            <div className="settings-row">
              <div
                className="settings-btn"
                onClick={handleDisconnectHudl}
                style={{ borderColor: '#e74c3c' }}
              >
                <span className="settings-btn-icon">✕</span>
                Disconnect
                <span className="settings-btn-label">Remove saved session</span>
              </div>
            </div>
          )}
        </div>

        {/* Hudl cache */}
        <div className="settings-group">
          <div className="settings-group-title">Hudl cache</div>
          <div className="settings-group-sub">
            Cutup lists are cached for 24 hours. Clear if new cutups aren't showing up.
          </div>
          <div className="settings-row">
            <div className="settings-btn" onClick={() => showToast('Cache cleared')}>
              <span className="settings-btn-icon">↺</span>
              Clear cache
            </div>
          </div>
        </div>

        {/* Account */}
        <div className="settings-group">
          <div className="settings-group-title">Account</div>
          <div className="settings-group-sub">
            Signed in as {coach?.email || 'unknown'}
            {coach?.teams?.name && ` • ${coach.teams.name}`}
          </div>
          <div className="settings-row">
            <div
              className="settings-btn"
              onClick={handleSignOut}
              style={{ borderColor: '#e74c3c', color: '#e74c3c' }}
            >
              <span className="settings-btn-icon">🚪</span>
              Sign out
            </div>
          </div>
          {coach?.team_id && (
            <div style={{
              fontSize: 10, color: 'var(--color-muted)', marginTop: 10,
              textAlign: 'center', wordBreak: 'break-all'
            }}>
              Team invite code: {coach.team_id}
            </div>
          )}
        </div>
      </div>

      <HudlLoginModal open={hudlModalOpen} onClose={() => setHudlModalOpen(false)} />
    </div>
  );
}
