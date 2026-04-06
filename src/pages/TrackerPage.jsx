import { useState, useEffect, useRef, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { ChevronLeft, Plus, X } from 'lucide-react';
import db from '../db';
import { DEFAULT_COLUMNS } from '../columns';
import { NumberModal, DropdownModal } from '../components/Modals';
import ColumnCard from '../components/ColumnCard';
import PlayTable from '../components/PlayTable';
import StatsPanel from '../components/StatsPanel';
import { exportToXLSX, downloadBackup, restoreFromFile } from '../utils/dataUtils';

// ─── Theme constants ──────────────────────────────────────────────────────────
const BG     = '#111111';
const SURFACE = '#1e1e1e';
const EDGE   = '#3a3a3a';
const ACCENT = '#ff4713';
const TEXT   = '#ffffff';
const DIM    = '#666666';
const BARLOW = "'Barlow Condensed', sans-serif";
const BEBAS  = "'Bebas Neue', cursive";

// ─── Pre-allocation helpers ───────────────────────────────────────────────────

const INITIAL_ALLOC = 200;
const REFILL_THRESHOLD = 30; // add more when fewer than this many rows remain
const REFILL_AMOUNT = 50;

async function allocateRows(gameId, startRowIndex, count) {
  const rows = Array.from({ length: count }, (_, i) => ({
    gameId,
    rowIndex: startRowIndex + i,
    createdAt: Date.now(),
  }));
  await db.plays.bulkAdd(rows);
}

// ─── Derive active columns (default or per-game override) ────────────────────

function getColumns(game) {
  if (game?.config && Array.isArray(game.config) && game.config.length > 0) {
    return game.config;
  }
  return DEFAULT_COLUMNS;
}

// ─── SpreadsheetBar ───────────────────────────────────────────────────────────

function SpreadsheetBar({ columns, currentRow, rowNumber, onJumpClick }) {
  return (
    <div style={{ backgroundColor: SURFACE, borderBottom: `1px solid ${EDGE}`, flexShrink: 0, overflowX: 'auto' }}>
      <div style={{ display: 'flex', minWidth: 'max-content', height: 50 }}>

        {/* Play # — tappable, opens jump modal */}
        <button
          type="button"
          onClick={onJumpClick}
          style={{
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
            borderRight: `1px solid ${EDGE}`, padding: '0 14px',
            minWidth: 54, flexShrink: 0,
            backgroundColor: 'rgba(255,255,255,0.04)',
            touchAction: 'manipulation', cursor: 'pointer',
          }}
        >
          <span style={{ color: DIM, fontSize: 8, fontFamily: BARLOW, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.16em', lineHeight: 1 }}>
            PLAY
          </span>
          <span style={{ color: '#ffffff', fontFamily: BEBAS, fontSize: 24, lineHeight: 1, marginTop: 2, textDecoration: 'underline dotted', textDecorationColor: 'rgba(255,255,255,0.22)' }}>
            {rowNumber ?? '—'}
          </span>
        </button>

        {/* Column cells */}
        {columns.map(col => (
          <div
            key={col.id}
            style={{
              display: 'flex', flexDirection: 'column', justifyContent: 'center',
              borderRight: `1px solid ${EDGE}`, padding: '0 10px',
              minWidth: 58, flexShrink: 0,
            }}
          >
            <span style={{ color: DIM, fontSize: 8, fontFamily: BARLOW, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.13em', lineHeight: 1, whiteSpace: 'nowrap' }}>
              {col.name}
            </span>
            <span style={{
              color: currentRow?.[col.id] != null ? '#ffffff' : '#444444',
              fontFamily: BARLOW, fontWeight: 700, fontSize: 15, lineHeight: 1.2, marginTop: 2, whiteSpace: 'nowrap',
            }}>
              {currentRow?.[col.id] != null ? String(currentRow[col.id]) : '·'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── NavBtn ───────────────────────────────────────────────────────────────────

function NavBtn({ onClick, disabled, children, noBorder, primary }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        flex: 1, padding: '18px 0',
        fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: 20,
        letterSpacing: '0.04em', textTransform: 'uppercase',
        backgroundColor: primary ? '#ffffff' : '#2a2a2a',
        color: primary ? '#000000' : '#ffffff',
        borderRight: noBorder ? 'none' : `1px solid ${EDGE}`,
        opacity: disabled ? 0.25 : 1,
        userSelect: 'none', touchAction: 'manipulation',
        cursor: disabled ? 'default' : 'pointer',
      }}
    >
      {children}
    </button>
  );
}

// ─── Edit Mode: Add Column dialog ─────────────────────────────────────────────

function AddColumnDialog({ onAdd, onClose }) {
  const [name, setName] = useState('');
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.88)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-xs overflow-hidden"
        style={{ backgroundColor: SURFACE, borderTop: `3px solid ${ACCENT}`, border: `1px solid ${EDGE}`, borderRadius: 4 }}
      >
        <div style={{ padding: '10px 14px', borderBottom: `1px solid ${EDGE}` }}>
          <span style={{ fontFamily: BARLOW, fontWeight: 700, fontSize: 14, letterSpacing: '0.1em', color: ACCENT, textTransform: 'uppercase' }}>
            ADD COLUMN
          </span>
        </div>
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && name.trim()) { onAdd(name.trim()); onClose(); }}}
            placeholder="Column name"
            style={{
              backgroundColor: BG, border: `1px solid ${EDGE}`, color: TEXT,
              padding: '10px 12px', fontFamily: BARLOW, fontWeight: 600, fontSize: 14,
              letterSpacing: '0.04em', width: '100%', outline: 'none',
            }}
          />
          <button
            onClick={() => { if (name.trim()) { onAdd(name.trim()); onClose(); } }}
            disabled={!name.trim()}
            className="disabled:opacity-30"
            style={{
              padding: '11px', backgroundColor: ACCENT, color: '#000',
              fontFamily: BARLOW, fontWeight: 700, fontSize: 14,
              letterSpacing: '0.08em', textTransform: 'uppercase', borderRadius: 2,
              cursor: name.trim() ? 'pointer' : 'not-allowed',
            }}
          >
            ADD
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Edit Mode: Add Option dialog ─────────────────────────────────────────────

function AddOptionDialog({ colName, onAdd, onClose }) {
  const [label, setLabel] = useState('');
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.88)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-xs overflow-hidden"
        style={{ backgroundColor: SURFACE, borderTop: `3px solid ${ACCENT}`, border: `1px solid ${EDGE}`, borderRadius: 4 }}
      >
        <div style={{ padding: '10px 14px', borderBottom: `1px solid ${EDGE}` }}>
          <span style={{ fontFamily: BARLOW, fontWeight: 700, fontSize: 14, letterSpacing: '0.1em', color: ACCENT, textTransform: 'uppercase' }}>
            ADD BUTTON — {colName}
          </span>
        </div>
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            autoFocus
            value={label}
            onChange={e => setLabel(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && label.trim()) { onAdd(label.trim()); onClose(); }}}
            placeholder="Button label"
            style={{
              backgroundColor: BG, border: `1px solid ${EDGE}`, color: TEXT,
              padding: '10px 12px', fontFamily: BARLOW, fontWeight: 600, fontSize: 14,
              letterSpacing: '0.04em', width: '100%', outline: 'none',
            }}
          />
          <button
            onClick={() => { if (label.trim()) { onAdd(label.trim()); onClose(); } }}
            disabled={!label.trim()}
            className="disabled:opacity-30"
            style={{
              padding: '11px', backgroundColor: ACCENT, color: '#000',
              fontFamily: BARLOW, fontWeight: 700, fontSize: 14,
              letterSpacing: '0.08em', textTransform: 'uppercase', borderRadius: 2,
              cursor: label.trim() ? 'pointer' : 'not-allowed',
            }}
          >
            ADD
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Jump-to-play modal ───────────────────────────────────────────────────────

function JumpModal({ current, max, onJump, onClose }) {
  const [raw, setRaw] = useState(String(current));
  const inputRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.select(), 80);
    return () => clearTimeout(t);
  }, []);

  const n = parseInt(raw, 10);
  const valid = !isNaN(n) && n >= 1 && n <= max;

  function handleJump() {
    if (!valid) return;
    onJump(n - 1); // convert to 0-based rowIndex
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.88)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-xs overflow-hidden"
        style={{ backgroundColor: SURFACE, borderTop: `3px solid ${ACCENT}`, border: `1px solid ${EDGE}`, borderRadius: 4 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: `1px solid ${EDGE}` }}>
          <span style={{ fontFamily: BARLOW, fontWeight: 700, fontSize: 14, letterSpacing: '0.1em', color: ACCENT, textTransform: 'uppercase' }}>
            JUMP TO PLAY
          </span>
          <button onClick={onClose} style={{ color: DIM, padding: 4, cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input
            ref={inputRef}
            type="number"
            inputMode="numeric"
            value={raw}
            onChange={e => setRaw(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleJump()}
            min={1}
            max={max}
            style={{
              backgroundColor: BG, border: `1px solid ${EDGE}`, color: '#ffffff',
              fontFamily: BEBAS, fontSize: 56, textAlign: 'center',
              padding: '10px 16px', width: '100%', outline: 'none',
              letterSpacing: '0.05em',
            }}
          />
          <div style={{ color: '#1e3a58', fontSize: 10, fontFamily: BARLOW, fontWeight: 700, textAlign: 'center', letterSpacing: '0.12em' }}>
            1 — {max}
          </div>
          <button
            onClick={handleJump}
            disabled={!valid}
            className="disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
            style={{
              padding: '12px', backgroundColor: ACCENT, color: '#000',
              fontFamily: BARLOW, fontWeight: 700, fontSize: 15,
              letterSpacing: '0.1em', textTransform: 'uppercase', borderRadius: 2,
              cursor: valid ? 'pointer' : 'not-allowed',
            }}
          >
            JUMP
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Restore file input (hidden) ─────────────────────────────────────────────

function RestoreInput({ onRestore }) {
  const ref = useRef(null);
  return (
    <>
      <input
        ref={ref}
        type="file"
        accept=".json"
        className="hidden"
        onChange={async e => {
          const file = e.target.files?.[0];
          if (file) await onRestore(file);
          e.target.value = '';
        }}
      />
      <button
        onClick={() => ref.current?.click()}
        className="w-full text-left hover:bg-white/5 transition-colors"
        style={{
          padding: '10px 14px', fontFamily: BARLOW, fontWeight: 700, fontSize: 13,
          letterSpacing: '0.06em', color: TEXT, borderBottom: `1px solid ${EDGE}`,
          display: 'block', backgroundColor: 'transparent', textTransform: 'uppercase',
        }}
      >
        Restore Backup
      </button>
    </>
  );
}

// ─── Main TrackerPage ─────────────────────────────────────────────────────────

export default function TrackerPage({ gameId, onBack }) {
  const [rowIndex,    setRowIndex]    = useState(0);
  const [modal,       setModal]       = useState(null);
  const [editMode,    setEditMode]    = useState(false);
  const [editColumns, setEditColumns] = useState(null); // working copy during edit
  const [menuOpen,    setMenuOpen]    = useState(false);
  const [view,        setView]        = useState('tracker');
  const [addColOpen,  setAddColOpen]  = useState(false);
  const [addOptFor,   setAddOptFor]   = useState(null); // colId or null
  const [jumpOpen,    setJumpOpen]    = useState(false);
  const restoreRef = useRef(null);

  // ── DB queries ──

  const game = useLiveQuery(() => db.games.get(gameId), [gameId]);

  const plays = useLiveQuery(
    () => db.plays.where('gameId').equals(gameId).sortBy('rowIndex'),
    [gameId]
  );

  const currentRow = plays?.[rowIndex] ?? null;

  // ── Column config ──

  const columns = editMode && editColumns
    ? editColumns
    : getColumns(game);

  // ── Auto-advance when all columns are filled ──

  const prevCurrentRowRef = useRef(null);
  useEffect(() => {
    const prev = prevCurrentRowRef.current;
    prevCurrentRowRef.current = currentRow ?? null;

    if (!currentRow || !plays || editMode) return;
    // Skip if we just navigated to a different row (vs. values changed in place)
    if (!prev || prev.id !== currentRow.id) return;

    const allFilled = columns.length > 0 && columns.every(c => currentRow[c.id] != null);
    if (!allFilled) return;

    // Only fire when a value was just added (transition to complete)
    const justCompleted = columns.some(c => prev[c.id] == null && currentRow[c.id] != null);
    if (!justCompleted) return;

    const nextIndex = rowIndex + 1;
    const timer = setTimeout(async () => {
      if (nextIndex >= plays.length) {
        await allocateRows(gameId, plays.length, REFILL_AMOUNT);
      }
      setRowIndex(nextIndex);
    }, 400);

    return () => clearTimeout(timer);
  }, [currentRow, columns, rowIndex, plays, gameId, editMode]);

  // ── Auto-refill pre-allocated rows ──

  useEffect(() => {
    if (!plays) return;
    const remaining = plays.length - rowIndex;
    if (plays.length > 0 && remaining < REFILL_THRESHOLD) {
      allocateRows(gameId, plays.length, REFILL_AMOUNT);
    }
  }, [rowIndex, plays, gameId]);

  // ── Navigation ──

  function handlePrev() {
    if (rowIndex > 0) setRowIndex(r => r - 1);
  }

  function handleNext() {
    if (plays && rowIndex < plays.length - 1) setRowIndex(r => r + 1);
  }

  async function handleNew() {
    const nextIndex = rowIndex + 1;
    if (!plays || nextIndex >= plays.length) {
      await allocateRows(gameId, plays?.length ?? 0, REFILL_AMOUNT);
    }
    setRowIndex(nextIndex);
  }

  async function handleAdd25() {
    await allocateRows(gameId, plays?.length ?? 0, 25);
  }

  // ── Set / clear values ──

  async function setColValue(columnId, value) {
    if (!currentRow) return;
    await db.plays.update(currentRow.id, { [columnId]: value !== undefined ? value : null });
  }

  async function handleClearRow() {
    if (!currentRow) return;
    const patch = {};
    columns.forEach(col => { patch[col.id] = null; });
    await db.plays.update(currentRow.id, patch);
  }

  async function handleClearAll() {
    if (!window.confirm('Clear ALL play data for this game? This cannot be undone.')) return;
    const patch = {};
    columns.forEach(col => { patch[col.id] = null; });
    const allPlays = await db.plays.where('gameId').equals(gameId).toArray();
    await db.transaction('rw', db.plays, async () => {
      for (const p of allPlays) await db.plays.update(p.id, patch);
    });
    setRowIndex(0);
  }

  // ── Modal handling ──

  function openModal(cfg) { setModal(cfg); }
  function closeModal()   { setModal(null); }

  async function handleModalConfirm(value) {
    if (modal?.columnId) await setColValue(modal.columnId, value);
    closeModal();
  }

  // ── Export / Backup / Restore ──

  async function handleExport() {
    if (!plays || !game) return;
    const gameName = `${game.homeTeam}_vs_${game.awayTeam}`;
    exportToXLSX(plays, columns, gameName);
    setMenuOpen(false);
  }

  async function handleBackup() {
    if (!game) return;
    const gameName = `${game.homeTeam}_vs_${game.awayTeam}`;
    await downloadBackup(gameId, gameName);
    setMenuOpen(false);
  }

  async function handleRestore(file) {
    try {
      await restoreFromFile(file);
      alert('Backup restored. Return to the Games list to open the restored game.');
    } catch (err) {
      alert(`Restore failed: ${err.message}`);
    }
    setMenuOpen(false);
  }

  // ── Edit Mode ──

  function enterEditMode() {
    setEditColumns(JSON.parse(JSON.stringify(columns)));
    setEditMode(true);
    setMenuOpen(false);
  }

  async function saveEditMode() {
    if (!editColumns) return;
    await db.games.update(gameId, { config: editColumns });
    setEditMode(false);
    setEditColumns(null);
  }

  function cancelEditMode() {
    setEditMode(false);
    setEditColumns(null);
  }

  function editRenameCol(colId, newName) {
    setEditColumns(prev => prev.map(c => c.id === colId ? { ...c, name: newName } : c));
  }

  function editDeleteCol(colId) {
    setEditColumns(prev => prev.filter(c => c.id !== colId));
  }

  function editMoveCol(colId, dir) {
    setEditColumns(prev => {
      const idx = prev.findIndex(c => c.id === colId);
      if (idx < 0) return prev;
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
      return next;
    });
  }

  function editDeleteOption(colId, optIdx) {
    setEditColumns(prev => prev.map(c =>
      c.id !== colId ? c : {
        ...c,
        options: c.options.filter((_, i) => i !== optIdx),
      }
    ));
  }

  function editAddOption(colId, label) {
    setEditColumns(prev => prev.map(c =>
      c.id !== colId ? c : {
        ...c,
        options: [...c.options, { label, value: label }],
      }
    ));
  }

  function editAddColumn(name) {
    const id = `col_${Date.now()}`;
    setEditColumns(prev => [...prev, {
      id,
      name,
      type: 'buttons',
      options: [],
    }]);
  }

  // ── Render guards ──

  if (!game) {
    return (
      <div className="h-svh flex items-center justify-center" style={{ backgroundColor: BG }}>
        <span style={{ color: EDGE, fontFamily: BARLOW, fontWeight: 700, fontSize: 13, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
          LOADING...
        </span>
      </div>
    );
  }

  const playCount    = plays?.length ?? 0;
  const isPrevDis    = rowIndex <= 0;
  const isNextDis    = rowIndex >= playCount - 1;
  const gameName     = `${game.homeTeam} vs ${game.awayTeam}`;
  const filledRows   = plays?.filter(p => columns.some(c => p[c.id] != null)).length ?? 0;

  return (
    <div className="h-svh flex flex-col overflow-hidden" style={{ backgroundColor: BG }}>

      {/* ── Header ── */}
      <header style={{
        backgroundColor: SURFACE,
        borderBottom: `1px solid ${EDGE}`,
        borderTop: `3px solid ${ACCENT}`,
        display: 'flex', alignItems: 'center',
        padding: '5px 10px', gap: 8, flexShrink: 0,
      }}>

        {/* Back / Cancel */}
        <button
          onClick={editMode ? cancelEditMode : onBack}
          style={{
            display: 'flex', alignItems: 'center', gap: 3,
            fontFamily: BARLOW, fontWeight: 700, fontSize: 13,
            letterSpacing: '0.06em', textTransform: 'uppercase',
            color: DIM, padding: '4px 4px', flexShrink: 0, cursor: 'pointer',
          }}
        >
          <ChevronLeft size={14} color={DIM} />
          {editMode ? 'CANCEL' : 'BACK'}
        </button>

        {/* Center */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, minWidth: 0, overflow: 'hidden' }}>
          {editMode ? (
            <span style={{ color: '#ffe600', fontFamily: BARLOW, fontWeight: 700, fontSize: 13, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              ✎ EDIT MODE
            </span>
          ) : (
            <>
              {/* Game name */}
              <span style={{
                color: TEXT, fontFamily: "'Nunito', sans-serif", fontWeight: 900, fontSize: 15,
                letterSpacing: '0.04em', textTransform: 'uppercase',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {gameName}
              </span>
            </>
          )}
        </div>

        {/* Right controls */}
        {editMode ? (
          <button
            onClick={saveEditMode}
            style={{
              padding: '5px 13px', backgroundColor: ACCENT, color: '#000',
              fontFamily: BARLOW, fontWeight: 700, fontSize: 13,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              borderRadius: 2, flexShrink: 0, cursor: 'pointer',
            }}
          >
            SAVE
          </button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>

            {/* ··· menu */}
            <div className="relative">
              <button
                onClick={() => setMenuOpen(o => !o)}
                style={{
                  padding: '5px 10px', border: `1px solid ${EDGE}`, borderRadius: 3,
                  backgroundColor: SURFACE, color: DIM,
                  fontFamily: BARLOW, fontWeight: 700, fontSize: 15,
                  letterSpacing: '0.1em', cursor: 'pointer',
                }}
              >
                ···
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                  <div style={{
                    position: 'absolute', right: 0, top: '100%', marginTop: 4,
                    backgroundColor: SURFACE, border: `1px solid ${EDGE}`,
                    borderRadius: 4, zIndex: 50, minWidth: 164, overflow: 'hidden',
                  }}>
                    {[
                      ['EDIT MODE',   enterEditMode],
                      ['EXPORT XLSX', handleExport],
                      ['BACKUP DATA', handleBackup],
                    ].map(([label, action]) => (
                      <button
                        key={label}
                        onClick={action}
                        className="w-full text-left hover:bg-white/5 transition-colors"
                        style={{
                          padding: '10px 14px', fontFamily: BARLOW, fontWeight: 700,
                          fontSize: 13, letterSpacing: '0.06em', color: TEXT,
                          borderBottom: `1px solid ${EDGE}`, display: 'block',
                          backgroundColor: 'transparent', textTransform: 'uppercase',
                          cursor: 'pointer',
                        }}
                      >
                        {label}
                      </button>
                    ))}
                    <RestoreInput onRestore={handleRestore} />
                    <div style={{ borderTop: `1px solid ${EDGE}` }} />
                    {['HISTORY', 'STATS'].map(v => (
                      <button
                        key={v}
                        onClick={() => { setView(v.toLowerCase()); setMenuOpen(false); }}
                        className="w-full text-left hover:bg-white/5 transition-colors"
                        style={{
                          padding: '10px 14px', fontFamily: BARLOW, fontWeight: 700,
                          fontSize: 13, letterSpacing: '0.06em', color: TEXT,
                          borderBottom: `1px solid ${EDGE}`, display: 'block',
                          backgroundColor: 'transparent', textTransform: 'uppercase',
                          cursor: 'pointer',
                        }}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* ✕ ROW (amber) */}
            <button
              onClick={handleClearRow}
              disabled={!currentRow || columns.every(c => currentRow[c.id] == null)}
              className="disabled:opacity-25"
              style={{
                padding: '5px 10px', border: `1px solid ${EDGE}`, borderRadius: 3,
                backgroundColor: SURFACE, color: '#f59e0b',
                fontFamily: BARLOW, fontWeight: 700, fontSize: 12,
                letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer',
              }}
            >
              ✕ ROW
            </button>

            {/* ✕ ALL (red) */}
            <button
              onClick={handleClearAll}
              disabled={filledRows === 0}
              className="disabled:opacity-25"
              style={{
                padding: '5px 10px', border: `1px solid ${EDGE}`, borderRadius: 3,
                backgroundColor: SURFACE, color: '#ef4444',
                fontFamily: BARLOW, fontWeight: 700, fontSize: 12,
                letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer',
              }}
            >
              ✕ ALL
            </button>
          </div>
        )}
      </header>

      {/* ── View selector (History / Stats sub-header) ── */}
      {view !== 'tracker' && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px',
          borderBottom: `1px solid ${EDGE}`, flexShrink: 0, backgroundColor: SURFACE,
        }}>
          <button
            onClick={() => setView('tracker')}
            style={{
              display: 'flex', alignItems: 'center', gap: 4, color: DIM,
              fontFamily: BARLOW, fontWeight: 700, fontSize: 13, letterSpacing: '0.06em',
              textTransform: 'uppercase', cursor: 'pointer',
            }}
          >
            <ChevronLeft size={14} color={DIM} />
            TRACKER
          </button>
          <span style={{ color: '#1e3a58', fontFamily: BARLOW, fontWeight: 700, fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            {view === 'history' ? `HISTORY · ${filledRows} PLAYS` : 'STATS'}
          </span>
        </div>
      )}

      {view !== 'tracker' ? (
        <div className="flex-1 overflow-y-auto">
          {view === 'history'
            ? <PlayTable plays={plays} columns={columns} />
            : <StatsPanel plays={plays} columns={columns} />
          }
        </div>
      ) : (
        <>
          {/* ── Spreadsheet bar ── */}
          <SpreadsheetBar
            columns={columns}
            currentRow={currentRow}
            rowNumber={rowIndex + 1}
            onJumpClick={() => setJumpOpen(true)}
          />

          {/* ── Column card grid ── */}
          <div style={{
            flex: 1,
            padding: 10,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gridAutoRows: '1fr',
            gap: 10,
            backgroundColor: BG,
            overflowY: 'auto',
          }}>
            {columns.map(col => (
              <ColumnCard
                key={col.id}
                col={col}
                value={currentRow?.[col.id] ?? null}
                onDirectSelect={setColValue}
                onOpenModal={openModal}
                editMode={editMode}
                onRenameCol={editRenameCol}
                onDeleteCol={editDeleteCol}
                onMoveCol={(dir) => editMoveCol(col.id, dir)}
                onDeleteOption={editDeleteOption}
                onAddOption={(colId) => setAddOptFor(colId)}
              />
            ))}

            {/* Add Column button (edit mode only) */}
            {editMode && (
              <button
                onClick={() => setAddColOpen(true)}
                className="min-h-[120px] flex flex-col items-center justify-center gap-2 transition-colors"
                style={{ borderRadius: 6, border: `1px dashed ${EDGE}`, color: EDGE, backgroundColor: 'transparent' }}
              >
                <Plus size={20} />
                <span style={{ fontFamily: BARLOW, fontWeight: 700, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Add Column
                </span>
              </button>
            )}
          </div>

          {/* ── Nav bar ── */}
          {!editMode && (
            <nav style={{ display: 'flex', borderTop: `1px solid ${EDGE}`, flexShrink: 0 }}>
              <NavBtn onClick={handlePrev} disabled={isPrevDis}>← PREV</NavBtn>
              <NavBtn onClick={handleNew} primary>＋ NEW</NavBtn>
              <NavBtn onClick={handleNext} disabled={isNextDis} noBorder>NEXT →</NavBtn>
            </nav>
          )}
        </>
      )}

      {/* ── Modals ── */}

      {modal?.type === 'number' && (
        <NumberModal
          title={modal.title ?? modal.columnId}
          min={modal.min}
          max={modal.max}
          currentValue={currentRow?.[modal.columnId] ?? null}
          onConfirm={handleModalConfirm}
          onClose={closeModal}
        />
      )}

      {modal?.type === 'dropdown' && (
        <DropdownModal
          title={modal.title ?? modal.columnId}
          options={modal.options}
          currentValue={currentRow?.[modal.columnId] ?? null}
          onSelect={handleModalConfirm}
          onClose={closeModal}
          centerOn={modal.centerOn}
        />
      )}

      {jumpOpen && (
        <JumpModal
          current={rowIndex + 1}
          max={plays?.length ?? rowIndex + 1}
          onJump={setRowIndex}
          onClose={() => setJumpOpen(false)}
        />
      )}

      {addColOpen && (
        <AddColumnDialog
          onAdd={editAddColumn}
          onClose={() => setAddColOpen(false)}
        />
      )}

      {addOptFor && (
        <AddOptionDialog
          colName={columns.find(c => c.id === addOptFor)?.name ?? ''}
          onAdd={label => editAddOption(addOptFor, label)}
          onClose={() => setAddOptFor(null)}
        />
      )}
    </div>
  );
}
