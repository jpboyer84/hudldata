import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import {
  LogoIcon, TagGameIcon, StatsIcon, PlaybookIcon,
  HudlConnectIcon, HudlConnectedIcon, HelpIcon,
  SettingsGearIcon, ChevronRight, GreenDot,
} from '../icons/Icons';
import HudlLoginModal from '../components/HudlLoginModal';

function UserIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ marginBottom: 8 }}>
      <circle cx="10" cy="7" r="3" stroke="#555" strokeWidth="1.5"/>
      <path d="M4 17C4 14 6.5 12 10 12C13.5 12 16 14 16 17" stroke="#555" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function SettingsHelpIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ marginBottom: 8 }}>
      <circle cx="10" cy="10" r="3" stroke="#555" strokeWidth="1.5"/>
      <path d="M10 3V5M10 15V17M17 10H15M5 10H3" stroke="#555" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const { user, coach } = useAuth();
  const showToast = useToast();
  const [hudlModalOpen, setHudlModalOpen] = useState(false);

  const isLoggedIn = !!user;
  const hudlConnected = !!coach?.hudl_cookie;
  const teamName = coach?.teams?.name || '';
  const schoolName = coach?.teams?.school || '';

  function requireAuth(path) {
    if (!isLoggedIn) {
      showToast('Sign in to access this feature');
      navigate('/login');
      return;
    }
    navigate(path);
  }

  return (
    <div className="view">
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>

          {/* Logo */}
          <div style={{ padding: '60px 24px 0', textAlign: 'center' }}>
            <div className="landing-logo-icon">
              <LogoIcon />
            </div>
            <div className="landing-logo-title">ASSISTANT COACH</div>
            <div className="landing-logo-sub">
              {schoolName
                ? `${schoolName.toUpperCase()} ${teamName.toUpperCase()}`
                : isLoggedIn && teamName
                  ? teamName.toUpperCase()
                  : 'FOOTBALL COACHING TOOL'
              }
            </div>
          </div>

          {/* Main cards */}
          <div style={{
            flex: 1, padding: '32px 20px 20px',
            display: 'flex', flexDirection: 'column', gap: 12,
            maxWidth: 500, margin: '0 auto', width: '100%'
          }}>

            {/* Tag a game — open to everyone */}
            <div className="lcard" onClick={() => navigate('/trackers')}>
              <div className="lcard-icon">
                <TagGameIcon />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="lcard-title">Tag a game</div>
                <div className="lcard-sub">Tag, archive & manage</div>
              </div>
              <ChevronRight />
            </div>

            {/* Stats & analysis — requires auth */}
            <div className="lcard" onClick={() => requireAuth('/stats')}>
              <div className="lcard-icon">
                <StatsIcon />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="lcard-title">Stats & analysis</div>
                <div className="lcard-sub">AI-powered breakdowns</div>
              </div>
              <ChevronRight />
            </div>

            {/* Playbook — requires auth */}
            <div className="lcard" onClick={() => requireAuth('/playbook')}>
              <div className="lcard-icon">
                <PlaybookIcon />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="lcard-title">Playbook</div>
                <div className="lcard-sub">Teach the AI your system</div>
              </div>
              <ChevronRight />
            </div>

            {/* Small cards row */}
            <div style={{ display: 'flex', gap: 10, marginTop: 2 }}>
              {/* Hudl — requires auth */}
              <div className="lcard-sm" onClick={() => {
                if (!isLoggedIn) { requireAuth('/settings'); return; }
                setHudlModalOpen(true);
              }}>
                <div style={{ marginBottom: 8 }}>
                  {hudlConnected ? <HudlConnectedIcon /> : <HudlConnectIcon />}
                </div>
                <div className="lcard-sm-label">
                  {hudlConnected ? 'Hudl ✓' : 'Connect to Hudl'}
                </div>
              </div>

              {/* Settings & Help */}
              <div className="lcard-sm" onClick={() => navigate('/settings')}>
                <SettingsHelpIcon />
                <div className="lcard-sm-label">Settings & Help</div>
              </div>

              {/* Sign in / Account */}
              <div className="lcard-sm" onClick={() => {
                if (isLoggedIn) navigate('/settings');
                else navigate('/login');
              }}>
                <UserIcon />
                <div className="lcard-sm-label">
                  {isLoggedIn ? (coach?.display_name || 'Account') : 'Sign up / Sign in'}
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Status bar - last game tracked */}
        <div style={{
          padding: '16px 20px 24px',
          borderTop: '1px solid #1a1a1c',
          flexShrink: 0,
          maxWidth: 500, margin: '0 auto', width: '100%'
        }}>
          <div
            style={{
              background: '#161618',
              border: '1px solid #222224',
              borderRadius: 12,
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            <GreenDot />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, color: 'var(--color-muted)', marginBottom: 2 }}>
                Last game tracked
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#ccc' }}>
                No games yet
              </div>
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-muted)' }}></div>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
              <path d="M6 4L10 8L6 12" stroke="#666" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
        </div>

      </div>

      <HudlLoginModal open={hudlModalOpen} onClose={() => setHudlModalOpen(false)} />
    </div>
  );
}
