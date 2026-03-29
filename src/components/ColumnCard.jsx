import { useState } from 'react';
import { ArrowLeft, ArrowRight, Trash2, Plus, Pencil, Check } from 'lucide-react';

// ─── Determine if an option button should appear selected ────────────────────

export function isOptionActive(col, opt, currentValue) {
  if (currentValue == null) return false;

  if (!opt.action) {
    // Direct button — match stored value
    return opt.value === currentValue;
  }

  if (opt.action === 'modal-suboptions') {
    return (opt.subOptions ?? []).includes(currentValue);
  }

  if (opt.action === 'modal-dropdown') {
    // Highlighted when the value is NOT one of the direct (non-action) buttons
    const direct = (col.options ?? [])
      .filter(o => !o.action && o.value != null)
      .map(o => o.value);
    return !direct.includes(currentValue);
  }

  if (opt.action === 'modal-number') {
    // Highlighted when the value is NOT one of the fixed buttons
    const fixed = (col.options ?? [])
      .filter(o => !o.action && o.value != null)
      .map(o => o.value);
    return !fixed.includes(currentValue);
  }

  return false;
}

// ─── Single option button ────────────────────────────────────────────────────

function OptionButton({ col, opt, currentValue, onDirectSelect, onOpenModal, editMode, onDeleteOption }) {
  const active = isOptionActive(col, opt, currentValue);

  function handleClick() {
    if (opt.action === 'modal-number') {
      onOpenModal({ type: 'number', columnId: col.id, min: opt.min, max: opt.max, title: `${col.name} — ${opt.label}` });
    } else if (opt.action === 'modal-dropdown') {
      onOpenModal({ type: 'dropdown', columnId: col.id, options: opt.dropdownOptions, title: opt.label });
    } else if (opt.action === 'modal-suboptions') {
      onOpenModal({ type: 'dropdown', columnId: col.id, options: opt.subOptions, title: opt.label });
    } else {
      // Direct toggle
      onDirectSelect(col.id, active ? null : opt.value);
    }
  }

  // For active modal-type buttons, show the current value on the button
  const btnLabel = (() => {
    if (!opt.action && active) return opt.label;
    if ((opt.action === 'modal-dropdown' || opt.action === 'modal-suboptions') && active && currentValue) {
      return currentValue;
    }
    if (opt.action === 'modal-number' && active && currentValue != null) {
      return currentValue;
    }
    return opt.label;
  })();

  return (
    <div className="relative h-full">
      <button
        type="button"
        onClick={handleClick}
        className="w-full h-full min-h-[48px] border font-nunito text-xs uppercase tracking-wide transition-colors select-none touch-manipulation rounded-sm"
        style={{
          backgroundColor: active ? '#ffffff' : '#1e1e1e',
          borderColor:     active ? '#ffffff' : '#3a3a3a',
          color:           active ? '#000000' : '#ffffff',
          fontWeight:      active ? 900       : 800,
          boxShadow:       '0 2px 6px rgba(0,0,0,0.4)',
        }}
      >
        {btnLabel}
      </button>
      {editMode && (
        <button
          onClick={e => { e.stopPropagation(); onDeleteOption(); }}
          className="absolute top-0.5 right-0.5 w-4 h-4 flex items-center justify-center rounded-sm text-white z-10"
          style={{ backgroundColor: '#ef4444', fontSize: 9 }}
        >
          ×
        </button>
      )}
    </div>
  );
}

// ─── ColumnCard ───────────────────────────────────────────────────────────────

export default function ColumnCard({
  col,
  value,
  onDirectSelect,
  onOpenModal,
  // edit mode props
  editMode = false,
  onRenameCol,
  onDeleteCol,
  onMoveCol,    // direction: -1 | 1
  onDeleteOption,
  onAddOption,
}) {
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(col.name);

  function commitRename() {
    setEditingName(false);
    const trimmed = nameInput.trim();
    if (trimmed && trimmed !== col.name) onRenameCol?.(col.id, trimmed);
    else setNameInput(col.name);
  }

  // ── modal-list card (single full-width button → scrollable list) ──
  if (col.type === 'modal-list') {
    const hasValue = value != null;
    return (
      <div className="rounded-lg overflow-hidden flex flex-col" style={{ border: '1px solid #555555' }}>
        {editMode && (
          <CardHeader
            col={col}
            value={value}
            editMode={editMode}
            editingName={editingName}
            nameInput={nameInput}
            setNameInput={setNameInput}
            onEditStart={() => { setEditingName(true); setNameInput(col.name); }}
            onCommitRename={commitRename}
            onDeleteCol={() => onDeleteCol?.(col.id)}
            onMoveCol={onMoveCol}
          />
        )}
        <div className="p-2 flex-1" style={{ backgroundColor: '#111111' }}>
          <button
            type="button"
            onClick={() => onOpenModal({ type: 'dropdown', columnId: col.id, options: col.listOptions, title: col.name })}
            className="w-full h-full min-h-[72px] border font-nunito font-black text-sm uppercase tracking-wide transition-colors rounded-sm"
            style={{
              backgroundColor: hasValue ? '#ffffff' : '#1e1e1e',
              borderColor:     hasValue ? '#ffffff' : '#3a3a3a',
              color:           hasValue ? '#000000' : '#ffffff',
              boxShadow:       '0 2px 6px rgba(0,0,0,0.4)',
            }}
          >
            {hasValue ? String(value) : col.name}
          </button>
        </div>
      </div>
    );
  }

  // ── modal-number card (single full-width button) ──
  if (col.type === 'modal-number') {
    const hasValue = value != null;
    return (
      <div className="rounded-lg overflow-hidden flex flex-col" style={{ border: '1px solid #555555' }}>
        {editMode && (
          <CardHeader
            col={col}
            value={value}
            editMode={editMode}
            editingName={editingName}
            nameInput={nameInput}
            setNameInput={setNameInput}
            onEditStart={() => { setEditingName(true); setNameInput(col.name); }}
            onCommitRename={commitRename}
            onDeleteCol={() => onDeleteCol?.(col.id)}
            onMoveCol={onMoveCol}
          />
        )}
        <div className="p-2 flex-1" style={{ backgroundColor: '#111111' }}>
          <button
            type="button"
            onClick={() => onOpenModal({ type: 'number', columnId: col.id, min: col.min, max: col.max, title: col.name })}
            className="w-full h-full min-h-[72px] border font-nunito font-black text-sm uppercase tracking-wide transition-colors rounded-sm"
            style={{
              backgroundColor: hasValue ? '#ffffff' : '#1e1e1e',
              borderColor:     hasValue ? '#ffffff' : '#3a3a3a',
              color:           hasValue ? '#000000' : '#ffffff',
              boxShadow:       '0 2px 6px rgba(0,0,0,0.4)',
            }}
          >
            {hasValue ? String(value) : col.name}
          </button>
        </div>
      </div>
    );
  }

  // ── buttons card ──
  return (
    <div className="rounded-lg overflow-hidden flex flex-col" style={{ border: '1px solid #555555' }}>
      {editMode && (
        <CardHeader
          col={col}
          value={value}
          editMode={editMode}
          editingName={editingName}
          nameInput={nameInput}
          setNameInput={setNameInput}
          onEditStart={() => { setEditingName(true); setNameInput(col.name); }}
          onCommitRename={commitRename}
          onDeleteCol={() => onDeleteCol?.(col.id)}
          onMoveCol={onMoveCol}
        />
      )}
      <div
        className="p-2 gap-2 flex-1"
        style={{
          backgroundColor: '#111111',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))',
          gridAutoRows: '1fr',
        }}
      >
        {col.options.map((opt, idx) => (
          <OptionButton
            key={idx}
            col={col}
            opt={opt}
            currentValue={value}
            onDirectSelect={onDirectSelect}
            onOpenModal={onOpenModal}
            editMode={editMode}
            onDeleteOption={() => onDeleteOption?.(col.id, idx)}
          />
        ))}
        {editMode && (
          <button
            onClick={() => onAddOption?.(col.id)}
            className="h-full min-h-[72px] border border-dashed font-nunito font-black text-xs text-white/25 hover:text-white/60 transition-colors"
            style={{ borderColor: '#3a3a3a', backgroundColor: 'transparent' }}
          >
            <Plus size={14} className="mx-auto" />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Card header (shared) ────────────────────────────────────────────────────

function CardHeader({ col, value, editMode, editingName, nameInput, setNameInput, onEditStart, onCommitRename, onDeleteCol, onMoveCol }) {
  return (
    <div
      className="px-3 py-2.5 flex items-center gap-2 flex-shrink-0"
      style={{ backgroundColor: '#1e1e1e' }}
    >
      {editMode && editingName ? (
        <input
          autoFocus
          value={nameInput}
          onChange={e => setNameInput(e.target.value)}
          onBlur={onCommitRename}
          onKeyDown={e => { if (e.key === 'Enter') onCommitRename(); if (e.key === 'Escape') { setNameInput(col.name); } }}
          className="flex-1 bg-transparent border-b border-white/40 text-white font-nunito font-black text-xs uppercase outline-none py-0.5"
        />
      ) : (
        <span className="font-nunito font-black text-white uppercase tracking-wider leading-none flex-1" style={{ fontSize: 15 }}>
          {col.name}
        </span>
      )}

      {/* Value badge — only when not in edit mode */}
      {!editMode && value != null && (
        <span className="text-white/35 font-mono text-[10px] leading-none ml-auto truncate max-w-[80px]">
          {value}
        </span>
      )}

      {/* Edit controls */}
      {editMode && !editingName && (
        <div className="flex items-center gap-1 ml-auto">
          <EditIconBtn onClick={() => onMoveCol?.(-1)} title="Move left">
            <ArrowLeft size={10} />
          </EditIconBtn>
          <EditIconBtn onClick={() => onMoveCol?.(1)} title="Move right">
            <ArrowRight size={10} />
          </EditIconBtn>
          <EditIconBtn onClick={onEditStart} title="Rename">
            <Pencil size={10} />
          </EditIconBtn>
          <EditIconBtn onClick={onDeleteCol} title="Delete column" danger>
            <Trash2 size={10} />
          </EditIconBtn>
        </div>
      )}
    </div>
  );
}

function EditIconBtn({ onClick, children, danger, title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`w-5 h-5 flex items-center justify-center rounded transition-colors ${
        danger
          ? 'text-red-400/60 hover:text-red-400 hover:bg-red-400/10'
          : 'text-white/40 hover:text-white hover:bg-white/10'
      }`}
    >
      {children}
    </button>
  );
}
