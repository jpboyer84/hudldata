import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { fetchGame, updateGame } from '../lib/supaData';
import { DEFAULT_COLUMNS, resolveTemplateColumns, defaultTemplate } from '../columns';
import ColumnCard from '../components/ColumnCard';
import ConfirmModal from '../components/ConfirmModal';
import { DropdownModal, PlayNavModal, EditGameModal } from '../components/Modals';
import { exportGameXLSX } from '../utils/xlsxExport';
import { sendToHudl } from '../lib/hudlData';
import { HUDL_API } from '../lib/constants';

const INITIAL_PLAYS = 200;

function emptyPlays(n) {
  return Array.from({ length: n }, () => ({}));
}

export default function TrackerPage() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { coach } = useAuth();
  const showToast = useToast();

  const [game, setGame] = useState(null);
  const [plays, setPlays] = useState([]);
  const [columns, setColumns] = useState(DEFAULT_COLUMNS);
  const [playIdx, setPlayIdx] = useState(0);
  const [layoutCols, setLayoutCols] = useState(1);
  const [menuOpen, setMenuOpen] = useState(false);
  const [modal, setModal] = useState(null);
  const [jumpOpen, setJumpOpen] = useState(false);
  const [editGameOpen, setEditGameOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState(null);

  const saveTimer = useRef(null);
  const playsRef = useRef(plays);
  playsRef.current = plays;

  // Load game from Supabase
  useEffect(() => {
    if (!gameId) return;
    fetchGame(gameId).then(g => {
      setGame(g);
      const p = Array.isArray(g.plays) && g.plays.length > 0 ? g.plays : emptyPlays(INITIAL_PLAYS);
      setPlays(p);
      // Use stored columns from game or defaults
      if (g.columns_config && Array.isArray(g.columns_config) && g.columns_config.length > 0) {
        setColumns(g.columns_config);
      }
    }).catch(err => {
      console.error('Load game error:', err);
      showToast('Failed to load game');
    });
  }, [gameId]);

  // Auto-save with debounce
  const persist = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      if (!gameId) return;
      updateGame(gameId, { plays: playsRef.current }).catch(err => {
        console.error('Save error:', err);
      });
    }, 800);
  }, [gameId]);

  // Clean up timer
  useEffect(() => {
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, []);

  const currentPlay = plays[playIdx] || {};

  function setVal(colId, value) {
    setPlays(prev => {
      const next = [...prev];
      if (!next[playIdx]) next[playIdx] = {};
      next[playIdx] = { ...next[playIdx], [colId]: value || undefined };
      // Remove undefined/empty keys
      if (!value) delete next[playIdx][colId];
      return next;
    });
    persist();
  }

  // Count filled rows
  const filledCount = plays.filter(p => p && Object.keys(p).length > 0).length;
  const filledSet = new Set(plays.map((p, i) => (p && Object.keys(p).length > 0) ? i : -1).filter(i => i >= 0));

  // Nav
  function nextPlay() {
    // Find next empty row after current
    let next = playIdx + 1;
    while (next < plays.length && plays[next] && Object.keys(plays[next]).length > 0) next++;
    if (next >= plays.length) {
      // Add more rows
      setPlays(prev => [...prev, ...emptyPlays(50)]);
      next = plays.length;
    }
    setPlayIdx(next);
  }

  function prevPlay() {
    if (playIdx > 0) setPlayIdx(playIdx - 1);
  }

  function addRows() {
    setPlays(prev => [...prev, ...emptyPlays(50)]);
    showToast('Added 50 rows');
  }

  // Clear
  function clearRow() {
    setConfirmModal({
      title: 'Clear row',
      message: `Clear all data for play ${playIdx + 1}?`,
      onConfirm: () => {
        setPlays(prev => {
          const next = [...prev];
          next[playIdx] = {};
          return next;
        });
        persist();
        setConfirmModal(null);
      },
    });
  }

  function clearAll() {
    setConfirmModal({
      title: 'Clear all plays',
      message: `Clear all ${filledCount} plays? This cannot be undone.`,
      danger: true,
      onConfirm: () => {
        setPlays(emptyPlays(INITIAL_PLAYS));
        setPlayIdx(0);
        persist();
        setConfirmModal(null);
      },
    });
  }

  // Edit game info
  async function handleEditGameSave(updates) {
    try {
      const updated = await updateGame(gameId, updates);
      setGame(prev => ({ ...prev, ...updated }));
      setEditGameOpen(false);
      showToast('Game info updated');
    } catch (err) {
      showToast('Failed to update: ' + err.message);
    }
  }

  // Export
  function handleExport() {
    setMenuOpen(false);
    try {
      exportGameXLSX(game, plays, columns);
      showToast('Exported to XLSX');
    } catch (err) {
      showToast('Export failed: ' + err.message);
    }
  }

  // Send to Hudl
  async function handleSendToHudl() {
    setMenuOpen(false);
    if (!coach?.hudl_cookie) {
      showToast('Connect to Hudl first (Settings)');
      return;
    }
    if (!game?.hudl_cutup_id) {
      showToast('This game was not loaded from Hudl');
      return;
    }

    const filledPlays = plays.filter(p => p && Object.keys(p).length > 0 && p._clipId);
    if (filledPlays.length === 0) {
      showToast('No Hudl-linked plays to send');
      return;
    }

    showToast(`Sending ${filledPlays.length} plays to Hudl…`);
    try {
      const result = await sendToHudl(plays, game.hudl_cutup_id, coach);
      showToast(`Sent to Hudl — ${result.successCount || filledPlays.length} plays updated`);
    } catch (err) {
      showToast('Hudl write failed: ' + err.message);
    }
  }

  // Title
  const gameTitle = game
    ? (game.home && game.away ? `${game.home} vs ${game.away}`
      : game.home || game.away || game.hudl_source || 'Game')
    : 'Loading…';

  if (!game) {
    return (
      <div className="view">
        <div className="hdr">
          <button className="hdr-btn" onClick={() => navigate(-1)}>← Back</button>
          <div className="hdr-title">Loading…</div>
          <div style={{ width: 60 }} />
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-muted)' }}>
          Loading game…
        </div>
      </div>
    );
  }

  return (
    <div className="view" style={{ position: 'relative' }}>
      {/* Header */}
      <div className="hdr">
        <button className="hdr-btn" onClick={() => navigate('/')}>← Back</button>
        <div
          className="hdr-title"
          onClick={() => setEditGameOpen(true)}
          style={{ cursor: 'pointer' }}
        >
          {gameTitle}
        </div>
        <div style={{ display: 'flex', gap: 5 }}>
          {game.hudl_cutup_id && (
            <button className="hdr-btn" style={{ color: '#27ae60' }} onClick={handleSendToHudl}>▲ Send</button>
          )}
          <button className="hdr-btn" onClick={() => setLayoutCols(layoutCols === 1 ? 2 : 1)}>
            ▤ {layoutCols === 1 ? '1COL' : '2COL'}
          </button>
          <button
            className="hdr-btn"
            onClick={() => setMenuOpen(!menuOpen)}
            style={{ fontSize: 18, padding: '4px 10px', lineHeight: 1 }}
          >
            ⋯
          </button>
        </div>
      </div>

      {/* Dropdown menu */}
      {menuOpen && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 149 }}
            onClick={() => setMenuOpen(false)}
          />
          <div style={{
            position: 'absolute', top: 52, right: 12, zIndex: 150,
            background: 'var(--color-surface)', border: '1px solid var(--color-border)',
            borderRadius: 12, minWidth: 180, overflow: 'hidden',
            boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
          }}>
            <div className="tracker-menu-item" onClick={() => { navigate('/stats'); setMenuOpen(false); }} style={{ color: 'var(--color-blue)' }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 13V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M6 13V3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M9 13V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M12 13V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              Stats
            </div>
            <div className="tracker-menu-item" onClick={() => { setMenuOpen(false); /* TODO: col picker */ }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              Add column
            </div>
            <div className="tracker-menu-item" onClick={() => { setMenuOpen(false); showToast('Save as template — coming soon'); }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="3" y="3" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M3 6H13" stroke="currentColor" strokeWidth="1.5" opacity="0.5"/></svg>
              Save as template
            </div>
            <div className="tracker-menu-item" onClick={() => { setMenuOpen(false); showToast('Switch template — coming soon'); }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="3" y="3" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M3 6H13M8 6V13" stroke="currentColor" strokeWidth="1.5" opacity="0.5"/></svg>
              Switch template
            </div>
            <div className="tracker-menu-item" onClick={handleExport}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3V10M5 7L8 10L11 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 12H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              Export XLSX
            </div>
            <div style={{ height: 1, background: 'var(--color-border)', margin: '2px 0' }} />
            <div className="tracker-menu-item" onClick={() => { setMenuOpen(false); clearRow(); }} style={{ color: 'var(--color-yellow)' }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              Clear row
            </div>
            <div className="tracker-menu-item" onClick={() => { setMenuOpen(false); clearAll(); }} style={{ color: 'var(--color-red)' }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 5H13M5 5V12H11V5M7 7V10M9 7V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Clear all
            </div>
          </div>
        </>
      )}

      {/* Sheet bar */}
      <div className="sheet-bar">
        {/* Play # cell */}
        <div
          className="s-cell play-cell"
          onClick={() => setJumpOpen(true)}
        >
          <span className="s-cell-lbl">Play</span>
          <span className="s-cell-val">{playIdx + 1}</span>
        </div>
        {/* Column value cells */}
        {columns.map(col => (
          <div key={col.id} className="s-cell" onClick={() => setJumpOpen(true)}>
            <span className="s-cell-lbl">{col.name}</span>
            <span className="s-cell-val" style={{ color: currentPlay[col.dataKey || col.id] ? 'var(--color-muted2)' : '#333' }}>
              {currentPlay[col.dataKey || col.id] || '·'}
            </span>
          </div>
        ))}
      </div>

      {/* Tracker body — column card grid */}
      <div className="tracker-body">
        <div className="col-grid" style={{ gridTemplateColumns: layoutCols === 1 ? '1fr' : '1fr 1fr' }}>
          {columns.map(col => (
            <ColumnCard
              key={col.id}
              col={col}
              value={currentPlay[col.dataKey || col.id] ?? null}
              onSetValue={setVal}
              onOpenModal={setModal}
            />
          ))}
        </div>
      </div>

      {/* Nav bar */}
      <div className="nav-bar">
        <button className="nav-btn nav-prev" onClick={prevPlay} disabled={playIdx === 0}>← Prev</button>
        <button className="nav-btn nav-mid" onClick={addRows}>+ Rows</button>
        <button className="nav-btn nav-new" onClick={nextPlay}>Next play →</button>
      </div>

      {/* Modals */}
      {modal?.type === 'dropdown' && (
        <DropdownModal
          title={modal.title}
          options={modal.options}
          currentValue={currentPlay[modal.columnId] ?? null}
          onSelect={val => { setVal(modal.columnId, val); }}
          onClose={() => setModal(null)}
          centerOn={modal.centerOn}
        />
      )}

      {jumpOpen && (
        <PlayNavModal
          current={playIdx}
          max={Math.min(plays.length, Math.max(filledCount + 10, 20))}
          filledSet={filledSet}
          onJump={setPlayIdx}
          onClose={() => setJumpOpen(false)}
        />
      )}

      <EditGameModal
        open={editGameOpen}
        game={game}
        onSave={handleEditGameSave}
        onClose={() => setEditGameOpen(false)}
      />

      <ConfirmModal
        open={!!confirmModal}
        title={confirmModal?.title}
        message={confirmModal?.message}
        danger={confirmModal?.danger}
        onConfirm={confirmModal?.onConfirm}
        onCancel={() => setConfirmModal(null)}
      />
    </div>
  );
}
