import { useState } from 'react';
import { ChevronLeft, Plus, Trash2 } from 'lucide-react';
import db from '../db';

export default function NewColumnPage({ onBack }) {
  const [colName,    setColName]    = useState('');
  const [colType,    setColType]    = useState('buttons'); // 'buttons' | 'list'
  const [buttons,    setButtons]    = useState([]);
  const [listItems,  setListItems]  = useState([]);
  const [newLabel,   setNewLabel]   = useState('');
  const [newItem,    setNewItem]    = useState('');
  const [saving,     setSaving]     = useState(false);

  function addButton() {
    const label = newLabel.trim();
    if (!label) return;
    setButtons(prev => [...prev, label]);
    setNewLabel('');
  }

  function removeButton(idx) {
    setButtons(prev => prev.filter((_, i) => i !== idx));
  }

  function addListItem() {
    const item = newItem.trim();
    if (!item) return;
    setListItems(prev => [...prev, item]);
    setNewItem('');
  }

  function removeListItem(idx) {
    setListItems(prev => prev.filter((_, i) => i !== idx));
  }

  const canSave = colName.trim().length > 0 && (
    (colType === 'buttons' && buttons.length > 0) ||
    (colType === 'list' && listItems.length > 0)
  );

  async function handleSave() {
    if (!canSave) return;
    setSaving(true);
    try {
      const id = `col_${Date.now()}`;
      let column;
      if (colType === 'buttons') {
        column = {
          id,
          name: colName.trim().toUpperCase(),
          type: 'buttons',
          options: buttons.map(label => ({ label, value: label })),
        };
      } else {
        column = {
          id,
          name: colName.trim().toUpperCase(),
          type: 'modal-list',
          listOptions: listItems,
        };
      }
      await db.columnLibrary.add({
        name: column.name,
        column,
        createdAt: Date.now(),
      });
      onBack();
    } finally {
      setSaving(false);
    }
  }

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
          NEW COLUMN
        </span>
      </header>

      <main className="flex-1 px-4 py-6 flex flex-col gap-6 max-w-xl mx-auto w-full">

        {/* Column name */}
        <div className="flex flex-col gap-2">
          <label className="text-white/40 text-[10px] uppercase tracking-widest font-mono">
            Column Name
          </label>
          <input
            type="text"
            value={colName}
            onChange={e => setColName(e.target.value)}
            placeholder="MY COLUMN"
            autoFocus
            autoCapitalize="characters"
            autoComplete="off"
            className="bg-bg border border-edge text-white px-3 py-3 font-nunito font-black text-sm uppercase placeholder:text-white/20 focus:outline-none focus:border-white/50 transition-colors rounded"
          />
        </div>

        {/* Column type selector */}
        <div className="flex flex-col gap-2">
          <label className="text-white/40 text-[10px] uppercase tracking-widest font-mono">
            Column Type
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { key: 'buttons', label: 'Buttons', desc: 'Tap buttons to select a value' },
              { key: 'list',    label: 'List Picker', desc: 'Single button opens scrollable list' },
            ].map(({ key, label, desc }) => (
              <button
                key={key}
                type="button"
                onClick={() => setColType(key)}
                className="px-3 py-3 rounded-lg text-left transition-colors"
                style={{
                  border: `2px solid ${colType === key ? '#ffffff' : '#3a3a3a'}`,
                  backgroundColor: colType === key ? 'rgba(255,255,255,0.07)' : '#1e1e1e',
                }}
              >
                <div className="font-nunito font-black text-white text-sm">{label}</div>
                <div className="text-white/30 text-[10px] font-mono mt-0.5 leading-relaxed">{desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Buttons builder */}
        {colType === 'buttons' && (
          <div className="flex flex-col gap-2">
            <label className="text-white/40 text-[10px] uppercase tracking-widest font-mono">
              Buttons{buttons.length > 0 ? ` (${buttons.length})` : ''}
            </label>

            {/* Existing buttons */}
            {buttons.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-1">
                {buttons.map((label, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded"
                    style={{ backgroundColor: '#1e1e1e', border: '1px solid #555555' }}
                  >
                    <span className="font-nunito font-black text-white text-sm uppercase">{label}</span>
                    <button
                      onClick={() => removeButton(idx)}
                      className="text-white/30 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add button input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newLabel}
                onChange={e => setNewLabel(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addButton()}
                placeholder="Button label"
                autoCapitalize="characters"
                className="flex-1 bg-bg border border-edge text-white px-3 py-2.5 font-mono text-sm uppercase placeholder:text-white/20 focus:outline-none focus:border-white/50 transition-colors rounded"
              />
              <button
                onClick={addButton}
                disabled={!newLabel.trim()}
                className="flex items-center gap-1.5 px-4 py-2.5 font-nunito font-black text-sm text-white disabled:opacity-30 transition-colors rounded"
                style={{ backgroundColor: '#1e1e1e', border: '1px solid #555555' }}
              >
                <Plus size={14} />
                ADD
              </button>
            </div>
          </div>
        )}

        {/* List items builder */}
        {colType === 'list' && (
          <div className="flex flex-col gap-2">
            <label className="text-white/40 text-[10px] uppercase tracking-widest font-mono">
              List Items{listItems.length > 0 ? ` (${listItems.length})` : ''}
            </label>

            {/* Existing items */}
            {listItems.length > 0 && (
              <div className="flex flex-col gap-1 mb-1 max-h-48 overflow-y-auto">
                {listItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between px-3 py-2 rounded"
                    style={{ backgroundColor: '#1e1e1e', border: '1px solid #3a3a3a' }}
                  >
                    <span className="font-mono text-white text-sm">{item}</span>
                    <button
                      onClick={() => removeListItem(idx)}
                      className="text-white/30 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add item input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newItem}
                onChange={e => setNewItem(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addListItem()}
                placeholder="List item"
                className="flex-1 bg-bg border border-edge text-white px-3 py-2.5 font-mono text-sm placeholder:text-white/20 focus:outline-none focus:border-white/50 transition-colors rounded"
              />
              <button
                onClick={addListItem}
                disabled={!newItem.trim()}
                className="flex items-center gap-1.5 px-4 py-2.5 font-nunito font-black text-sm text-white disabled:opacity-30 transition-colors rounded"
                style={{ backgroundColor: '#1e1e1e', border: '1px solid #555555' }}
              >
                <Plus size={14} />
                ADD
              </button>
            </div>
          </div>
        )}

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saving || !canSave}
          className="py-4 bg-white text-black font-nunito font-black text-sm uppercase tracking-wider disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/90 transition-colors rounded"
        >
          {saving ? 'SAVING...' : 'SAVE TO LIBRARY'}
        </button>
      </main>
    </div>
  );
}
