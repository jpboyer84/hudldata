import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { ChevronLeft, Check } from 'lucide-react';
import db from '../db';

export default function NewTemplatePage({ onBack, onCreated }) {
  const [name,     setName]     = useState('');
  const [selected, setSelected] = useState(new Set());
  const [saving,   setSaving]   = useState(false);

  const libraryColumns = useLiveQuery(
    () => db.columnLibrary.orderBy('createdAt').toArray(),
    []
  );

  function toggleColumn(id) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // Maintain insertion order for the selected columns
  const orderedSelected = (libraryColumns ?? []).filter(e => selected.has(e.id));

  async function handleCreate() {
    if (!name.trim() || orderedSelected.length === 0) return;
    setSaving(true);
    try {
      const columns = orderedSelected.map(entry => ({
        ...JSON.parse(JSON.stringify(entry.column)),
        id: `col_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      }));
      await db.templates.add({
        name: name.trim().toUpperCase(),
        columns,
        createdAt: Date.now(),
        isDefault: false,
      });
      onCreated();
    } finally {
      setSaving(false);
    }
  }

  const canCreate = name.trim().length > 0 && selected.size > 0;

  return (
    <div className="min-h-svh bg-bg flex flex-col">
      {/* Header */}
      <header className="border-b border-edge px-4 py-4 flex items-center gap-3 flex-shrink-0" style={{ backgroundColor: '#1e1e1e' }}>
        <button
          onClick={onBack}
          className="flex items-center gap-1 font-mono text-xs tracking-wide text-white/40 hover:text-white transition-colors py-1 pr-1"
        >
          <ChevronLeft size={15} />
          BACK
        </button>
        <span className="font-nunito font-black text-white text-base tracking-widest">
          NEW TEMPLATE
        </span>
      </header>

      <main className="flex-1 px-4 py-6 flex flex-col gap-6 max-w-xl mx-auto w-full">
        {/* Template name */}
        <div className="flex flex-col gap-2">
          <label className="text-white/40 text-[10px] uppercase tracking-widest font-mono">
            Template Name
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="MY TEMPLATE"
            autoFocus
            autoCapitalize="characters"
            autoComplete="off"
            className="bg-bg border border-edge text-white px-3 py-3 font-nunito font-black text-sm uppercase placeholder:text-white/20 focus:outline-none focus:border-white/50 transition-colors rounded"
          />
        </div>

        {/* Column picker */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-white/40 text-[10px] uppercase tracking-widest font-mono">
              Select Columns
            </span>
            {selected.size > 0 && (
              <span className="text-white/40 text-[10px] font-mono">
                {selected.size} selected
              </span>
            )}
          </div>

          {!libraryColumns ? (
            <div className="text-white/20 text-xs font-mono py-2">LOADING...</div>
          ) : libraryColumns.length === 0 ? (
            <div className="text-white/20 text-xs font-mono py-2">
              No columns in library. Add columns first via NEW COLUMN.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {libraryColumns.map(entry => {
                const isSelected = selected.has(entry.id);
                return (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => toggleColumn(entry.id)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors"
                    style={{
                      border: `1px solid ${isSelected ? '#ffffff' : '#3a3a3a'}`,
                      backgroundColor: isSelected ? 'rgba(255,255,255,0.07)' : '#1e1e1e',
                    }}
                  >
                    {/* Checkbox */}
                    <div
                      className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
                      style={{
                        border: `2px solid ${isSelected ? '#ffffff' : '#555555'}`,
                        backgroundColor: isSelected ? '#ffffff' : 'transparent',
                      }}
                    >
                      {isSelected && <Check size={12} color="#000000" strokeWidth={3} />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="font-nunito font-black text-white text-sm tracking-wide">
                        {entry.name}
                      </div>
                      <div className="text-white/30 text-[10px] font-mono mt-0.5">
                        {entry.column.type === 'buttons'
                          ? `${entry.column.options?.length ?? 0} buttons`
                          : entry.column.type === 'modal-list'
                          ? 'list picker'
                          : entry.column.type}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Create button */}
        <button
          onClick={handleCreate}
          disabled={saving || !canCreate}
          className="py-4 bg-white text-black font-nunito font-black text-sm uppercase tracking-wider disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/90 transition-colors rounded"
        >
          {saving ? 'CREATING...' : `CREATE TEMPLATE${selected.size > 0 ? ` (${selected.size} COLS)` : ''}`}
        </button>
      </main>
    </div>
  );
}
