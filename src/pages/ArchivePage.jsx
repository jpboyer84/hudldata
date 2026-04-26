import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { fetchGames, deleteGame } from '../lib/supaData';
import ConfirmModal from '../components/ConfirmModal';
import { exportMultiGameXLSX } from '../utils/xlsxExport';

export default function ArchivePage() {
  const navigate = useNavigate();
  const { coach } = useAuth();
  const showToast = useToast();
  const [games, setGames] = useState([]);
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    if (coach?.team_id) {
      fetchGames(coach.team_id).then(setGames).catch(err => {
        console.error('Fetch games error:', err);
      });
    }
  }, [coach?.team_id]);

  function toggleSelect(id) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleExportSelected() {
    const selectedGames = games.filter(g => selected.has(g.id));
    if (selectedGames.length === 0) { showToast('Select games first'); return; }
    try {
      exportMultiGameXLSX(selectedGames);
      showToast(`Exported ${selectedGames.length} game${selectedGames.length > 1 ? 's' : ''}`);
    } catch (err) {
      showToast('Export failed: ' + err.message);
    }
  }

  function handleDelete(game) {
    setConfirmDelete({
      title: 'Delete game',
      message: `Delete "${game.home && game.away ? `${game.home} vs ${game.away}` : 'this game'}"? This cannot be undone.`,
      onConfirm: async () => {
        try {
          await deleteGame(game.id);
          setGames(prev => prev.filter(g => g.id !== game.id));
          showToast('Game deleted');
        } catch (err) {
          showToast('Delete failed: ' + err.message);
        }
        setConfirmDelete(null);
      },
    });
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
    if (g.game_type && g.game_type !== 'Game') parts.push(g.game_type);
    const playCount = Array.isArray(g.plays) ? g.plays.filter(p => p && Object.keys(p).length > 0).length : 0;
    parts.push(`${playCount} plays`);
    return parts.join(' · ');
  }

  return (
    <div className="view">
      <div className="hdr">
        <button className="hdr-btn" onClick={() => navigate('/')}>← Back</button>
        <div className="hdr-title">Archive</div>
        <div style={{ display: 'flex', gap: 5 }}>
          <button
            className="hdr-btn"
            onClick={() => { setSelectMode(!selectMode); setSelected(new Set()); }}
          >
            {selectMode ? 'Done' : 'Select'}
          </button>
          {selectMode && selected.size > 0 && (
            <button className="hdr-btn" style={{ background: 'var(--color-accent)', color: '#fff', borderColor: 'var(--color-accent)' }} onClick={handleExportSelected}>
              ⬇ EXPORT
            </button>
          )}
        </div>
      </div>

      <div className="abody">
        {games.length === 0 ? (
          <div className="empty-msg">
            No games yet.<br />
            Tap "Tag Game Film" to start tracking.
          </div>
        ) : (
          games.map(g => (
            <div
              key={g.id}
              className="arch-card"
              style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 10 }}
              onClick={() => {
                if (selectMode) toggleSelect(g.id);
                else navigate(`/tracker/${g.id}`);
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: 12 }}>
                {selectMode && (
                  <div style={{
                    width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                    border: `2px solid ${selected.has(g.id) ? 'var(--color-accent)' : 'var(--color-border)'}`,
                    background: selected.has(g.id) ? 'var(--color-accent)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, color: '#fff',
                  }}>
                    {selected.has(g.id) && '✓'}
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="arch-title">{formatGameTitle(g)}</div>
                  <div className="arch-meta">{formatMeta(g)}</div>
                </div>
                {!selectMode && (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      className="hdr-btn"
                      style={{ fontSize: 10, padding: '5px 8px', color: 'var(--color-red)', borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)' }}
                      onClick={e => { e.stopPropagation(); handleDelete(g); }}
                    >
                      Delete
                    </button>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, alignSelf: 'center' }}>
                      <path d="M6 4L10 8L6 12" stroke="#444" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <ConfirmModal
        open={!!confirmDelete}
        title={confirmDelete?.title}
        message={confirmDelete?.message}
        danger
        onConfirm={confirmDelete?.onConfirm}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
