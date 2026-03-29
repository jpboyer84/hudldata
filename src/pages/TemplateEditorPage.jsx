import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { ChevronLeft, Plus, Pencil } from 'lucide-react';
import db from '../db';
import ColumnCard from '../components/ColumnCard';

// ─── Add Column dialog ────────────────────────────────────────────────────────

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
            onKeyDown={e => { if (e.key === 'Enter' && name.trim()) { onAdd(name.trim()); onClose(); } }}
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

// ─── Add Option dialog ────────────────────────────────────────────────────────

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
            onKeyDown={e => { if (e.key === 'Enter' && label.trim()) { onAdd(label.trim()); onClose(); } }}
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

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function TemplateEditorPage({ templateId, onBack }) {
  const template = useLiveQuery(() => db.templates.get(templateId), [templateId]);

  const [columns,      setColumns]      = useState(null);
  const [templateName, setTemplateName] = useState('');
  const [editingName,  setEditingName]  = useState(false);
  const [addColOpen,   setAddColOpen]   = useState(false);
  const [addOptFor,    setAddOptFor]    = useState(null);
  const [saving,       setSaving]       = useState(false);

  // Initialise working copy once the template loads
  useEffect(() => {
    if (template && columns === null) {
      setColumns(JSON.parse(JSON.stringify(template.columns)));
      setTemplateName(template.name);
    }
  }, [template, columns]);

  async function handleSave() {
    if (!columns || !templateName.trim()) return;
    setSaving(true);
    try {
      await db.templates.update(templateId, {
        name: templateName.trim().toUpperCase(),
        columns,
      });
      onBack();
    } finally {
      setSaving(false);
    }
  }

  // ── Column operations ──

  function renameCol(colId, newName) {
    setColumns(prev => prev.map(c => c.id === colId ? { ...c, name: newName } : c));
  }

  function deleteCol(colId) {
    setColumns(prev => prev.filter(c => c.id !== colId));
  }

  function moveCol(colId, dir) {
    setColumns(prev => {
      const idx = prev.findIndex(c => c.id === colId);
      if (idx < 0) return prev;
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
      return next;
    });
  }

  function deleteOption(colId, optIdx) {
    setColumns(prev => prev.map(c =>
      c.id !== colId ? c : { ...c, options: c.options.filter((_, i) => i !== optIdx) }
    ));
  }

  function addOption(colId, label) {
    setColumns(prev => prev.map(c =>
      c.id !== colId ? c : { ...c, options: [...c.options, { label, value: label }] }
    ));
  }

  function addColumn(name) {
    const id = `col_${Date.now()}`;
    setColumns(prev => [...prev, { id, name, type: 'buttons', options: [] }]);
  }

  // ── Render guards ──

  if (!template || columns === null) {
    return (
      <div className="h-svh bg-bg flex items-center justify-center text-white/20 text-xs font-mono">
        LOADING...
      </div>
    );
  }

  return (
    <div className="h-svh bg-bg flex flex-col overflow-hidden">

      {/* ── Header ── */}
      <header
        className="flex items-center gap-2 px-3 py-2.5 border-b border-edge flex-shrink-0"
        style={{ backgroundColor: '#111111' }}
      >
        <button
          onClick={onBack}
          className="flex items-center gap-1 font-mono text-xs tracking-wide text-white/40 hover:text-white transition-colors shrink-0 py-1 pr-1"
        >
          <ChevronLeft size={15} />
          BACK
        </button>

        {/* Template name — tap to rename */}
        <div className="flex-1 min-w-0 px-1 flex justify-center">
          {editingName ? (
            <input
              autoFocus
              value={templateName}
              onChange={e => setTemplateName(e.target.value)}
              onBlur={() => setEditingName(false)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') setEditingName(false); }}
              className="w-full max-w-[200px] bg-transparent border-b border-white/40 text-white font-nunito font-black text-sm uppercase tracking-wide outline-none py-0.5 text-center"
            />
          ) : (
            <button
              onClick={() => setEditingName(true)}
              className="flex items-center gap-1.5 font-nunito font-black text-white text-sm tracking-wide truncate hover:text-white/70 transition-colors"
            >
              <span className="truncate">{templateName}</span>
              <Pencil size={10} className="text-white/30 flex-shrink-0" />
            </button>
          )}
        </div>

        <button
          onClick={handleSave}
          disabled={saving || !templateName.trim()}
          className="px-3 py-1.5 bg-white text-black font-nunito font-black text-xs tracking-wider shrink-0 disabled:opacity-40 hover:bg-white/90 transition-colors"
        >
          {saving ? 'SAVING...' : 'SAVE'}
        </button>
      </header>

      {/* ── Column grid (always in edit mode) ── */}
      <div className="flex-1 overflow-y-auto p-3">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {columns.map(col => (
            <ColumnCard
              key={col.id}
              col={col}
              value={null}
              onDirectSelect={() => {}}
              onOpenModal={() => {}}
              editMode
              onRenameCol={renameCol}
              onDeleteCol={deleteCol}
              onMoveCol={dir => moveCol(col.id, dir)}
              onDeleteOption={deleteOption}
              onAddOption={colId => setAddOptFor(colId)}
            />
          ))}

          {/* Add Column tile */}
          <button
            onClick={() => setAddColOpen(true)}
            className="rounded-lg min-h-[120px] border border-dashed flex flex-col items-center justify-center gap-2 text-white/25 hover:text-white/50 transition-colors"
            style={{ borderColor: '#555555' }}
          >
            <Plus size={20} />
            <span className="font-nunito font-black text-xs uppercase tracking-wider">Add Column</span>
          </button>
        </div>
      </div>

      {addColOpen && (
        <AddColumnDialog onAdd={addColumn} onClose={() => setAddColOpen(false)} />
      )}
      {addOptFor && (
        <AddOptionDialog
          colName={columns.find(c => c.id === addOptFor)?.name ?? ''}
          onAdd={label => addOption(addOptFor, label)}
          onClose={() => setAddOptFor(null)}
        />
      )}
    </div>
  );
}
