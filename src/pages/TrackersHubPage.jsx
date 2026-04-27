import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { fetchGames, createGame, fetchTemplates, createTemplate } from '../lib/supaData';
import { DEFAULT_COLUMNS } from '../columns';
import { fetchHudlClips, hudlClipsToPlays } from '../lib/hudlData';
import NewGameModal from '../components/NewGameModal';
import HudlCutupPicker from '../components/HudlCutupPicker';

export default function TrackersHubPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { coach } = useAuth();
  const showToast = useToast();
  const [games, setGames] = useState([]);
  const [newGameOpen, setNewGameOpen] = useState(false);
  const [hudlOpen, setHudlOpen] = useState(false);
  const [loadingCutup, setLoadingCutup] = useState(false);
  const [pendingHudlCutup, setPendingHudlCutup] = useState(null);
  const [templates, setTemplates] = useState([]);

  const shouldAutoNew = searchParams.get('new') === '1';

  useEffect(() => {
    if (shouldAutoNew) {
      searchParams.delete('new');
      setSearchParams(searchParams, { replace: true });
      if (!coach?.team_id) {
        showToast('Sign in and set up your team first');
        navigate('/login');
        return;
      }
    }
    if (coach?.team_id) {
      fetchGames(coach.team_id).then(setGames).catch(console.error);
      fetchTemplates(coach.team_id).then(t => {
        setTemplates(t);
        if (shouldAutoNew) {
          if (t.length === 0) {
            createTemplate({
              team_id: coach.team_id,
              name: 'ODK',
              col_ids: DEFAULT_COLUMNS.map(c => c.id),
              sort_order: 0,
            }).then(tmpl => {
              setTemplates([tmpl]);
              setNewGameOpen(true);
            }).catch(console.error);
          } else {
            setNewGameOpen(true);
          }
        }
      }).catch(console.error);
    }
  }, [coach?.team_id]);

  async function handleStartGame(opts) {
    if (!coach?.team_id) {
      showToast('Set up your team first');
      navigate('/team-setup');
      return;
    }

    try {
      // Hudl template IDs start with hudl_cs_ — can't store in FK column
      const isHudlTemplate = opts.template_id && String(opts.template_id).startsWith('hudl_cs_');
      const game = await createGame({
        team_id: coach.team_id,
        created_by: coach.id,
        home: opts.home || null,
        away: opts.away || null,
        week: opts.week || null,
        date: opts.date || null,
        game_type: opts.game_type || 'Game',
        hudl_source: opts._title || null,
        template_id: isHudlTemplate ? null : (opts.template_id || null),
        plays: Array.from({ length: 200 }, () => ({})),
      });

      setNewGameOpen(false);
      // If Hudl template, pass col_ids via navigation state so TrackerPage uses them
      if (isHudlTemplate) {
        const hudlTmpl = templates.find(t => t.id === opts.template_id);
        navigate(`/tracker/${game.id}`, { state: { colIds: hudlTmpl?.col_ids } });
      } else {
        navigate(`/tracker/${game.id}`);
      }
    } catch (err) {
      showToast('Failed to create game: ' + err.message);
    }
  }

  // Step 1: Cutup selected from picker → show game setup form
  function handleCutupSelected(selectedItems) {
    if (!selectedItems.length) return;
    setHudlOpen(false);
    setPendingHudlCutup(selectedItems[0]);
    setNewGameOpen(true); // Opens NewGameModal with hudlSource
  }

  // Step 2: START GAME clicked → load clips and create game
  async function handleHudlGameStart(opts) {
    if (!coach?.team_id || !pendingHudlCutup) return;
    setNewGameOpen(false);
    setLoadingCutup(true);
    const item = pendingHudlCutup;
    showToast(`Loading ${item.title}…`);
    try {
      const clips = await fetchHudlClips(item.id, coach, item.title);
      const plays = hudlClipsToPlays(clips);
      while (plays.length < 200) plays.push({});

      const game = await createGame({
        team_id: coach.team_id,
        created_by: coach.id,
        home: opts.home || null,
        away: opts.away || null,
        week: opts.week || null,
        date: opts.date || null,
        game_type: opts.game_type || 'Game',
        hudl_cutup_id: item.internalId || item.id,
        hudl_source: opts._title || opts.hudl_source || item.title,
        plays,
      });

      setPendingHudlCutup(null);
      navigate(`/tracker/${game.id}`);
    } catch (err) {
      showToast('Failed to load cutup: ' + err.message);
    }
    setLoadingCutup(false);
  }

  // No auth required — but need team for Supabase storage
  function handleNewGame() {
    if (!coach?.team_id) {
      showToast('Sign in and set up your team first');
      navigate('/login');
      return;
    }
    // If no templates exist, create a default ODK template first
    if (templates.length === 0) {
      createDefaultTemplate().then(() => setNewGameOpen(true));
    } else {
      setNewGameOpen(true);
    }
  }

  async function createDefaultTemplate() {
    if (!coach?.team_id) return;
    try {
      const tmpl = await createTemplate({
        team_id: coach.team_id,
        name: 'ODK',
        col_ids: DEFAULT_COLUMNS.map(c => c.id),
        sort_order: 0,
      });
      setTemplates([tmpl]);
    } catch (err) {
      console.error('Create default template:', err);
    }
  }

  function formatGameTitle(g) {
    if (g.home && g.away) return `${g.home} vs ${g.away}`;
    if (g.home) return g.home;
    if (g.away) return g.away;
    return 'Untitled Game';
  }

  function formatMeta(g) {
    const parts = [];
    if (g.week) parts.push(`Week ${g.week}`);
    if (g.date) parts.push(g.date);
    const playCount = Array.isArray(g.plays) ? g.plays.filter(p => p && Object.keys(p).length > 0).length : 0;
    parts.push(`${playCount} plays`);
    return parts.join(' · ');
  }

  const recentGames = games.slice(0, 5);

  return (
    <div className="view">
      <div className="hdr">
        <button className="hdr-btn" onClick={() => navigate('/')}>← Back</button>
        <div className="hdr-title">Tag Game Film</div>
        <div style={{ display: 'flex', gap: 5 }}>
          <button className="hdr-btn" onClick={() => navigate('/archive')}>Archive</button>
          <button
            className="hdr-btn"
            style={{ background: 'var(--color-accent)', color: '#fff', borderColor: 'var(--color-accent)' }}
            onClick={handleNewGame}
          >
            + New
          </button>
        </div>
      </div>

      <div className="abody">
        {/* Load from Hudl card — show if connected */}
        {coach?.hudl_cookie && (
          <div
            className="arch-card"
            onClick={() => setHudlOpen(true)}
            style={{ borderColor: 'rgba(232,89,12,0.3)', background: 'rgba(232,89,12,0.04)' }}
          >
            <div style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: 'rgba(232,89,12,0.12)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontSize: 16, fontWeight: 700, color: 'var(--color-accent)',
            }}>H</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="arch-title" style={{ color: 'var(--color-accent)' }}>Load from Hudl</div>
              <div className="arch-meta">Browse cutups &amp; playlists</div>
            </div>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
              <path d="M6 4L10 8L6 12" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
        )}

        {loadingCutup && (
          <div style={{ padding: 20, textAlign: 'center', color: 'var(--color-muted)', fontSize: 13 }}>
            Loading cutup from Hudl…
          </div>
        )}

        {recentGames.length === 0 && !loadingCutup ? (
          <div className="empty-msg">
            No games yet.<br />
            Tap <strong>+ New</strong> to start tracking plays.
          </div>
        ) : (
          <>
            <div className="sec-label">Recent Games</div>
            {recentGames.map(g => (
              <div
                key={g.id}
                className="arch-card"
                onClick={() => navigate(`/tracker/${g.id}`)}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="arch-title">{formatGameTitle(g)}</div>
                  <div className="arch-meta">{formatMeta(g)}</div>
                </div>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                  <path d="M6 4L10 8L6 12" stroke="#444" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
            ))}
            {games.length > 5 && (
              <div
                style={{
                  textAlign: 'center', padding: '12px', fontSize: 13, fontWeight: 600,
                  color: 'var(--color-accent)', cursor: 'pointer',
                }}
                onClick={() => navigate('/archive')}
              >
                View all {games.length} games →
              </div>
            )}
          </>
        )}
      </div>

      <NewGameModal
        open={newGameOpen}
        onClose={() => { setNewGameOpen(false); setPendingHudlCutup(null); }}
        onStart={pendingHudlCutup ? handleHudlGameStart : handleStartGame}
        onNavigate={(path) => {
          if (path === 'hudl') setHudlOpen(true);
          else navigate(path);
        }}
        hudlSource={pendingHudlCutup?.title || null}
      />
      {hudlOpen && (
        <HudlCutupPicker
          onLoad={handleCutupSelected}
          onClose={() => setHudlOpen(false)}
        />
      )}
    </div>
  );
}

