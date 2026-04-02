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
    <div
      className="border-b border-edge flex-shrink-0 overflow-x-auto"
      style={{ backgroundColor: '#111111' }}
    >
      <div className="flex min-w-max h-[52px]">
        {/* Play # — tappable, opens jump modal */}
        <button
          type="button"
          onClick={onJumpClick}
          className="flex flex-col justify-center border-r border-edge px-3 min-w-[48px] flex-shrink-0 transition-colors active:bg-white/15 touch-manipulation"
          style={{ backgroundColor: 'rgba(255,255,255,0.07)' }}
        >
          <span className="text-white/30 text-[9px] font-mono uppercase tracking-widest leading-none">#</span>
          <span className="text-white font-nunito font-black text-sm leading-tight mt-0.5 underline decoration-dotted underline-offset-2 decoration-white/30">
            {rowNumber ?? '—'}
          </span>
        </button>
        {/* Column cells */}
        {columns.map(col => (
          <div
            key={col.id}
            className="flex flex-col justify-center border-r border-edge last:border-r-0 px-2.5 min-w-[52px] flex-shrink-0"
          >
            <span className="text-white/25 text-[9px] font-mono uppercase tracking-widest leading-none whitespace-nowrap">
              {col.name}
            </span>
            <span className="text-white font-nunito font-black text-sm leading-tight mt-0.5 whitespace-nowrap">
              {currentRow?.[col.id] != null
                ? String(currentRow[col.id])
                : ''
              }
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── NavBtn ───────────────────────────────────────────────────────────────────

function NavBtn({ onClick, disabled, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex-1 py-1 font-nunito font-black text-base tracking-widest border-r border-edge last:border-r-0 select-none touch-manipulation disabled:opacity-25"
      style={{ backgroundColor: '#ffe600', color: '#000000' }}
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
      style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-xs rounded-lg overflow-hidden" style={{ backgroundColor: '#1e1e1e', border: '1px solid #555555' }}>
        <div className="px-4 py-3 border-b border-edge">
          <span className="font-nunito font-black text-white text-sm uppercase tracking-wider">ADD COLUMN</span>
        </div>
        <div className="p-4 flex flex-col gap-3">
          <input
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && name.trim()) { onAdd(name.trim()); onClose(); }}}
            placeholder="Column name"
            className="bg-bg border border-edge text-white px-3 py-2.5 font-mono text-sm w-full focus:outline-none focus:border-white/50"
          />
          <button
            onClick={() => { if (name.trim()) { onAdd(name.trim()); onClose(); } }}
            disabled={!name.trim()}
            className="py-3 bg-white text-black font-nunito font-black text-sm uppercase tracking-wider disabled:opacity-30"
          >
            ADD
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Edit Mode: Add / Rename Option dialog ────────────────────────────────────

function AddOptionDialog({ colName, onAdd, onClose }) {
  const [label, setLabel] = useState('');
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-xs rounded-lg overflow-hidden" style={{ backgroundColor: '#1e1e1e', border: '1px solid #555555' }}>
        <div className="px-4 py-3 border-b border-edge">
          <span className="font-nunito font-black text-white text-sm uppercase tracking-wider">
            ADD BUTTON — {colName}
          </span>
        </div>
        <div className="p-4 flex flex-col gap-3">
          <input
            autoFocus
            value={label}
            onChange={e => setLabel(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && label.trim()) { onAdd(label.trim()); onClose(); }}}
            placeholder="Button label"
            className="bg-bg border border-edge text-white px-3 py-2.5 font-mono text-sm w-full focus:outline-none focus:border-white/50"
          />
          <button
            onClick={() => { if (label.trim()) { onAdd(label.trim()); onClose(); } }}
            disabled={!label.trim()}
            className="py-3 bg-white text-black font-nunito font-black text-sm uppercase tracking-wider disabled:opacity-30"
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
      style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-xs rounded-lg overflow-hidden"
        style={{ backgroundColor: '#1e1e1e', border: '1px solid #555555' }}
      >
        <div
          className="flex items-center justify-between px-4 py-3 flex-shrink-0"
          style={{ borderBottom: '1px solid #3a3a3a' }}
        >
          <span className="font-nunito font-black text-white text-sm uppercase tracking-wider">
            JUMP TO PLAY
          </span>
          <button onClick={onClose} className="text-white/40 hover:text-white p-1 -mr-1">
            <X size={16} />
          </button>
        </div>
        <div className="p-4 flex flex-col gap-3">
          <input
            ref={inputRef}
            type="number"
            inputMode="numeric"
            value={raw}
            onChange={e => setRaw(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleJump()}
            min={1}
            max={max}
            className="bg-bg border border-edge text-white font-mono text-3xl text-center px-4 py-5 focus:outline-none focus:border-white/50 transition-colors w-full"
          />
          <div className="text-white/25 text-[10px] font-mono text-center">1 – {max}</div>
          <button
            onClick={handleJump}
            disabled={!valid}
            className="py-3.5 bg-white text-black font-nunito font-black text-sm uppercase tracking-wider disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/90 transition-colors"
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
        className="w-full px-4 py-2.5 text-left font-nunito font-black text-xs tracking-wider text-white hover:bg-white/10 transition-colors border-b border-edge last:border-b-0"
      >
        RESTORE BACKUP
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
      <div className="h-svh bg-bg flex items-center justify-center text-white/20 text-xs font-mono">
        LOADING...
      </div>
    );
  }

  const playCount    = plays?.length ?? 0;
  const isPrevDis    = rowIndex <= 0;
  const isNextDis    = rowIndex >= playCount - 1;
  const gameName     = `${game.homeTeam} vs ${game.awayTeam}`;
  const filledRows   = plays?.filter(p => columns.some(c => p[c.id] != null)).length ?? 0;

  return (
    <div className="h-svh bg-bg flex flex-col overflow-hidden">

      {/* ── Header ── */}
      <header className="flex items-center gap-2 px-3 py-1.5 border-b border-edge flex-shrink-0" style={{ backgroundColor: '#111111' }}>
        <button
          onClick={editMode ? cancelEditMode : onBack}
          className="flex items-center gap-1 font-mono text-xs tracking-wide text-white/40 hover:text-white transition-colors shrink-0 py-1 pr-1"
        >
          <ChevronLeft size={15} />
          {editMode ? 'CANCEL' : 'BACK'}
        </button>

        <div className="flex-1 min-w-0 text-center font-nunito font-black text-white text-sm truncate px-1">
          {editMode
            ? <span className="text-yellow-400 tracking-wider text-xs">✎ EDIT MODE</span>
            : gameName
          }
        </div>

        {editMode ? (
          <button
            onClick={saveEditMode}
            className="px-3 py-1.5 bg-white text-black font-nunito font-black text-xs tracking-wider shrink-0"
          >
            SAVE
          </button>
        ) : (
          <div className="flex items-center gap-1.5 shrink-0">
            {/* ··· menu */}
            <div className="relative">
              <button
                onClick={() => setMenuOpen(o => !o)}
                className="px-2.5 py-1.5 border font-mono text-white/50 hover:text-white transition-colors text-sm leading-none"
                style={{ backgroundColor: '#1e1e1e', borderColor: '#3a3a3a' }}
              >
                ···
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                  <div
                    className="absolute right-0 top-full mt-1 border z-50 min-w-[160px] overflow-hidden rounded-sm"
                    style={{ backgroundColor: '#1e1e1e', borderColor: '#3a3a3a' }}
                  >
                    {[
                      ['EDIT MODE',    enterEditMode],
                      ['EXPORT XLSX',  handleExport],
                      ['BACKUP DATA',  handleBackup],
                    ].map(([label, action]) => (
                      <button
                        key={label}
                        onClick={action}
                        className="w-full px-4 py-2.5 text-left font-nunito font-black text-xs tracking-wider text-white hover:bg-white/10 transition-colors border-b border-edge last:border-b-0"
                      >
                        {label}
                      </button>
                    ))}
                    <RestoreInput onRestore={handleRestore} />
                    <div className="border-t border-edge" />
                    {['HISTORY', 'STATS'].map(v => (
                      <button
                        key={v}
                        onClick={() => { setView(v.toLowerCase()); setMenuOpen(false); }}
                        className="w-full px-4 py-2.5 text-left font-nunito font-black text-xs tracking-wider text-white hover:bg-white/10 transition-colors border-b border-edge last:border-b-0"
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* ✕ ROW (yellow) — clears current row */}
            <button
              onClick={handleClearRow}
              disabled={!currentRow || columns.every(c => currentRow[c.id] == null)}
              className="px-2.5 py-1.5 border font-nunito font-black text-[11px] tracking-wider transition-colors disabled:opacity-25"
              style={{ backgroundColor: '#1e1e1e', borderColor: '#3a3a3a', color: '#f59e0b' }}
            >
              ✕ ROW
            </button>

            {/* ✕ ALL (red) — clears all rows */}
            <button
              onClick={handleClearAll}
              disabled={filledRows === 0}
              className="px-2.5 py-1.5 border font-nunito font-black text-[11px] tracking-wider transition-colors disabled:opacity-25"
              style={{ backgroundColor: '#1e1e1e', borderColor: '#3a3a3a', color: '#ef4444' }}
            >
              ✕ ALL
            </button>
          </div>
        )}
      </header>

      {/* ── View selector ── */}
      {view !== 'tracker' && (
        <div
          className="flex items-center gap-3 px-3 py-2 border-b border-edge flex-shrink-0"
          style={{ backgroundColor: '#111111' }}
        >
          <button
            onClick={() => setView('tracker')}
            className="flex items-center gap-1 text-white/40 hover:text-white transition-colors font-mono text-xs tracking-wide"
          >
            <ChevronLeft size={14} />
            TRACKER
          </button>
          <span className="text-white/30 font-nunito font-black text-xs tracking-wider">
            {view === 'history'
              ? `HISTORY · ${filledRows} PLAYS`
              : 'STATS'}
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
          <div className="flex-1 overflow-y-auto p-3">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
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
                  className="rounded-lg min-h-[120px] border border-dashed flex flex-col items-center justify-center gap-2 text-white/25 hover:text-white/50 transition-colors"
                  style={{ borderColor: '#555555' }}
                >
                  <Plus size={20} />
                  <span className="font-nunito font-black text-xs uppercase tracking-wider">Add Column</span>
                </button>
              )}
            </div>
          </div>

          {/* ── Nav bar ── */}
          {!editMode && (
            <nav className="flex border-t border-edge flex-shrink-0">
              <NavBtn onClick={handlePrev} disabled={isPrevDis}>← PREV</NavBtn>
              <NavBtn onClick={handleAdd25}>+25</NavBtn>
              <NavBtn onClick={handleNext} disabled={isNextDis}>NEXT →</NavBtn>
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
