import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { fetchGames } from '../lib/supaData';
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

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const ms = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(ms / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (days > 0) return `${days}d ago`;
  if (hrs > 0) return `${hrs}h ago`;
  if (mins > 0) return `${mins}m ago`;
  return 'just now';
}

export default function LandingPage() {
  const navigate = useNavigate();
  const { user, coach } = useAuth();
  const showToast = useToast();
  const [hudlModalOpen, setHudlModalOpen] = useState(false);
  const [lastGame, setLastGame] = useState(null);

  useEffect(() => {
    if (coach?.team_id) {
      fetchGames(coach.team_id).then(games => {
        if (games && games.length > 0) {
          // Sort by created_at descending to find most recent
          const sorted = [...games].sort((a, b) =>
            new Date(b.created_at) - new Date(a.created_at)
          );
          setLastGame(sorted[0]);
        }
      }).catch(console.error);
    }
  }, [coach?.team_id]);

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

        {/* Top status bar */}
        <div style={{
          display: 'flex', justifyContent: 'flex-end', alignItems: 'center',
          padding: '12px 20px 0', gap: 10, flexShrink: 0,
        }}>
          <div
            onClick={() => {
              if (!isLoggedIn) { requireAuth('/settings'); return; }
              if (hudlConnected) navigate('/settings');
              else setHudlModalOpen(true);
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '5px 10px', borderRadius: 20,
              background: hudlConnected ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${hudlConnected ? 'rgba(34,197,94,0.3)' : 'var(--color-border)'}`,
              cursor: 'pointer', fontSize: 11, fontWeight: 600,
              color: hudlConnected ? '#22c55e' : 'var(--color-muted)',
            }}
          >
            <div style={{
              width: 6, height: 6, borderRadius: 3,
              background: hudlConnected ? '#22c55e' : '#666',
            }} />
            {hudlConnected ? 'Hudl Connected' : 'Hudl'}
          </div>
        </div>

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

            {/* Tag Game Film — open to everyone */}
            <div className="lcard" onClick={() => navigate('/trackers')}>
              <div className="lcard-icon">
                <TagGameIcon />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="lcard-title">Tag Game Film</div>
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
              {/* Help */}
              <div className="lcard-sm" onClick={() => navigate('/help')}>
                <div style={{ marginBottom: 8 }}>
                  <HelpIcon />
                </div>
                <div className="lcard-sm-label">Help</div>
              </div>

              {/* Settings */}
              <div className="lcard-sm" onClick={() => navigate('/settings')}>
                <SettingsHelpIcon />
                <div className="lcard-sm-label">Settings</div>
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
            onClick={() => {
              if (lastGame) navigate(`/tracker/${lastGame.id}`);
              else navigate('/trackers');
            }}
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
                {lastGame
                  ? `${lastGame.home || ''} vs ${lastGame.away || ''}${lastGame.week ? ` · Week ${lastGame.week}` : ''}`
                  : 'No games yet'
                }
              </div>
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>
              {lastGame ? timeAgo(lastGame.created_at) : ''}
            </div>
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

