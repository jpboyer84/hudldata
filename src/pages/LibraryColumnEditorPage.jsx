import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { ChevronLeft } from 'lucide-react';
import db from '../db';
import ColumnCard from '../components/ColumnCard';

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

export default function LibraryColumnEditorPage({ libraryColId, onBack }) {
  const entry = useLiveQuery(() => db.columnLibrary.get(libraryColId), [libraryColId]);

  const [col,        setCol]        = useState(null);
  const [addOptOpen, setAddOptOpen] = useState(false);
  const [saving,     setSaving]     = useState(false);

  useEffect(() => {
    if (entry && col === null) {
      setCol(JSON.parse(JSON.stringify(entry.column)));
    }
  }, [entry, col]);

  async function handleSave() {
    if (!col) return;
    setSaving(true);
    try {
      await db.columnLibrary.update(libraryColId, { name: col.name, column: col });
      onBack();
    } finally {
      setSaving(false);
    }
  }

  function renameCol(_, newName) {
    setCol(prev => ({ ...prev, name: newName }));
  }

  function deleteOption(_, optIdx) {
    setCol(prev => ({ ...prev, options: (prev.options ?? []).filter((_, i) => i !== optIdx) }));
  }

  function addOption(label) {
    setCol(prev => ({ ...prev, options: [...(prev.options ?? []), { label, value: label }] }));
  }

  if (!entry || col === null) {
    return (
      <div className="h-svh bg-bg flex items-center justify-center text-white/20 text-xs font-mono">
        LOADING...
      </div>
    );
  }

  return (
    <div className="h-svh bg-bg flex flex-col overflow-hidden">
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
        <div className="flex-1 text-center font-nunito font-black text-white text-sm truncate px-1">
          LIBRARY: {col.name}
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-3 py-1.5 bg-white text-black font-nunito font-black text-xs tracking-wider shrink-0 disabled:opacity-40 hover:bg-white/90 transition-colors"
        >
          {saving ? 'SAVING...' : 'SAVE'}
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-3">
        <div className="text-white/25 text-[10px] font-mono mb-4 leading-relaxed">
          Changes here only affect the library — not templates already using this column.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, gridAutoRows: '120px' }}>
          <ColumnCard
            col={col}
            value={null}
            onDirectSelect={() => {}}
            onOpenModal={() => {}}
            editMode
            onRenameCol={renameCol}
            onDeleteCol={() => {}}
            onMoveCol={() => {}}
            onDeleteOption={(_, optIdx) => deleteOption(null, optIdx)}
            onAddOption={() => setAddOptOpen(true)}
          />
        </div>
      </div>

      {addOptOpen && (
        <AddOptionDialog
          colName={col.name}
          onAdd={addOption}
          onClose={() => setAddOptOpen(false)}
        />
      )}
    </div>
  );
}
