import { useState } from 'react';
import { ArrowLeft, ArrowRight, Trash2, Plus, Pencil } from 'lucide-react';

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

function OptionButton({ col, opt, currentValue, onDirectSelect, onOpenModal, editMode, onDeleteOption, broadcast }) {
  const active = isOptionActive(col, opt, currentValue);

  function handleClick() {
    if (opt.action === 'modal-number') {
      onOpenModal({ type: 'number', columnId: col.id, min: opt.min, max: opt.max, title: `${col.name} — ${opt.label}` });
    } else if (opt.action === 'modal-dropdown') {
      onOpenModal({ type: 'dropdown', columnId: col.id, options: opt.dropdownOptions, title: opt.label, centerOn: opt.centerOn });
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

  const broadcastStyle = active ? {
    backgroundColor: '#00d4ff',
    border: '2px solid #00d4ff',
    color: '#000000',
    boxShadow: '0 0 14px rgba(0,212,255,0.4)',
    fontFamily: "'Barlow Condensed', sans-serif",
    fontWeight: 900,
    fontSize: 17,
  } : {
    backgroundColor: '#060c18',
    border: '1px solid #152338',
    color: '#4a6a85',
    fontFamily: "'Barlow Condensed', sans-serif",
    fontWeight: 700,
    fontSize: 17,
  };

  const classicStyle = {
    backgroundColor: active ? '#ffffff' : '#1e1e1e',
    border:          active ? '2px solid #ffffff' : '1px solid #444444',
    color:           active ? '#000000' : '#ffffff',
    fontFamily:      "'Nunito', sans-serif",
    fontWeight:      900,
    fontSize:        14,
    lineHeight:      1.2,
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleClick}
        className="w-full uppercase select-none touch-manipulation rounded-lg flex items-center justify-center overflow-hidden"
        style={{ ...(broadcast ? broadcastStyle : classicStyle), minHeight: 55, aspectRatio: '1', maxHeight: 70 }}
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
  // theme
  broadcast = false,
}) {
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(col.name);

  function commitRename() {
    setEditingName(false);
    const trimmed = nameInput.trim();
    if (trimmed && trimmed !== col.name) onRenameCol?.(col.id, trimmed);
    else setNameInput(col.name);
  }

  const cardBorderStyle = broadcast ? {
    borderTop:    '1px solid #1a2e48',
    borderRight:  '1px solid #1a2e48',
    borderBottom: '1px solid #1a2e48',
    borderLeft:   '3px solid #ff4713',
  } : { border: '1px solid #555555' };

  const bodyBg = broadcast ? '#060c18' : '#111111';

  // Shared header props
  const headerProps = {
    col, value, editMode, broadcast, editingName, nameInput, setNameInput,
    onEditStart:     () => { setEditingName(true); setNameInput(col.name); },
    onCommitRename:  commitRename,
    onDeleteCol:     () => onDeleteCol?.(col.id),
    onMoveCol,
  };

  // ── modal-list card ──
  if (col.type === 'modal-list') {
    const hasValue = value != null;
    const singleStyle = broadcast ? {
      backgroundColor: hasValue ? '#00d4ff' : '#060c18',
      border:          hasValue ? '2px solid #00d4ff' : '2px solid #152338',
      color:           hasValue ? '#000000' : '#4a6a85',
      boxShadow:       hasValue ? '0 0 16px rgba(0,212,255,0.35)' : 'none',
      fontFamily:      "'Barlow Condensed', sans-serif",
      fontWeight:      hasValue ? 900 : 700,
      fontSize:        20,
    } : {
      backgroundColor: hasValue ? '#ffffff' : '#1e1e1e',
      border:          hasValue ? '2px solid #ffffff' : '2px solid #666666',
      color:           hasValue ? '#000000' : '#ffffff',
      fontFamily:      "'Nunito', sans-serif",
      fontWeight:      900,
      fontSize:        20,
    };

    return (
      <div className="rounded-lg overflow-hidden flex flex-col" style={cardBorderStyle}>
        <CardHeader {...headerProps} />
        <div className="p-2" style={{ backgroundColor: bodyBg }}>
          <button
            type="button"
            onClick={() => onOpenModal({ type: 'dropdown', columnId: col.id, options: col.listOptions, title: col.name, centerOn: col.centerOn })}
            className="w-full uppercase select-none touch-manipulation rounded-sm"
            style={{ ...singleStyle, minHeight: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {hasValue ? String(value) : col.name}
          </button>
        </div>
      </div>
    );
  }

  // ── modal-number card ──
  if (col.type === 'modal-number') {
    const hasValue = value != null;
    const singleStyle = broadcast ? {
      backgroundColor: hasValue ? '#00d4ff' : '#060c18',
      border:          hasValue ? '2px solid #00d4ff' : '2px solid #152338',
      color:           hasValue ? '#000000' : '#4a6a85',
      boxShadow:       hasValue ? '0 0 16px rgba(0,212,255,0.35)' : 'none',
      fontFamily:      "'Barlow Condensed', sans-serif",
      fontWeight:      hasValue ? 900 : 700,
      fontSize:        20,
    } : {
      backgroundColor: hasValue ? '#ffffff' : '#1e1e1e',
      border:          hasValue ? '2px solid #ffffff' : '2px solid #666666',
      color:           hasValue ? '#000000' : '#ffffff',
      fontFamily:      "'Nunito', sans-serif",
      fontWeight:      900,
      fontSize:        20,
    };

    return (
      <div className="rounded-lg overflow-hidden flex flex-col" style={cardBorderStyle}>
        <CardHeader {...headerProps} />
        <div className="p-2" style={{ backgroundColor: bodyBg }}>
          <button
            type="button"
            onClick={() => onOpenModal({ type: 'number', columnId: col.id, min: col.min, max: col.max, title: col.name })}
            className="w-full uppercase select-none touch-manipulation rounded-sm"
            style={{ ...singleStyle, minHeight: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {hasValue ? String(value) : col.name}
          </button>
        </div>
      </div>
    );
  }

  // ── buttons card ──
  // Cap columns: ≥7 buttons → 3 per row; 5–6 → 4 per row; ≤4 → exact count
  const btnCount = col.options.length + (editMode ? 1 : 0);
  const gridCols = btnCount >= 7 ? 3 : btnCount >= 5 ? 4 : btnCount;

  return (
    <div className="rounded-lg overflow-hidden flex flex-col" style={cardBorderStyle}>
      <CardHeader {...headerProps} />
      <div
        className="p-2 gap-2"
        style={{
          backgroundColor: bodyBg,
          display: 'grid',
          gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
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
            broadcast={broadcast}
          />
        ))}
        {editMode && (
          <button
            onClick={() => onAddOption?.(col.id)}
            className="w-full border border-dashed font-nunito font-black text-xs text-white/25 hover:text-white/60 transition-colors"
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

function CardHeader({ col, value, editMode, broadcast, editingName, nameInput, setNameInput, onEditStart, onCommitRename, onDeleteCol, onMoveCol }) {
  return (
    <div
      style={{
        backgroundColor: broadcast ? '#0a1828' : '#1e1e1e',
        padding:         broadcast ? '5px 10px' : '7px 10px',
        display:         'flex',
        alignItems:      'center',
        gap:             8,
        flexShrink:      0,
        borderBottom:    broadcast ? '1px solid #0f2038' : '1px solid #2a2a2a',
      }}
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
        <span
          style={broadcast ? {
            color:          '#ff4713',
            fontFamily:     "'Barlow Condensed', sans-serif",
            fontWeight:     700,
            fontSize:       11,
            textTransform:  'uppercase',
            letterSpacing:  '0.13em',
            lineHeight:     1,
            flex:           1,
          } : {
            color:          '#ffffff',
            fontFamily:     "'Nunito', sans-serif",
            fontWeight:     900,
            fontSize:       15,
            textTransform:  'uppercase',
            letterSpacing:  '0.05em',
            lineHeight:     1,
            flex:           1,
          }}
        >
          {col.name}
        </span>
      )}

      {/* Dropdown arrow — classic non-edit mode only */}
      {!editMode && !broadcast && (
        <span style={{ color: '#666666', fontSize: 10, flexShrink: 0 }}>▼</span>
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
