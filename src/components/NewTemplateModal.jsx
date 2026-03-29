import { useState } from 'react';
import { X } from 'lucide-react';
import db from '../db';
import { DEFAULT_COLUMNS } from '../columns';

export default function NewTemplateModal({ onClose, onCreated }) {
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await db.templates.add({
        name: name.trim().toUpperCase(),
        columns: DEFAULT_COLUMNS,
        createdAt: Date.now(),
        isDefault: false,
      });
      onCreated();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-surface border border-edge w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-edge">
          <span className="font-nunito font-black text-white text-base tracking-wider">NEW TEMPLATE</span>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors p-1 -mr-1"
          >
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-white/40 text-[10px] uppercase tracking-widest font-mono">Template Name</span>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="MY TEMPLATE"
              className="bg-bg border border-edge text-white px-3 py-2.5 font-mono text-sm uppercase placeholder:text-white/20 focus:outline-none focus:border-white/50 transition-colors"
              autoFocus
              autoComplete="off"
              autoCapitalize="characters"
            />
          </label>
          <p className="text-white/25 text-[10px] font-mono leading-relaxed">
            Starts with all 10 ODK columns. Column layout can be customized per-game.
          </p>
          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="mt-1 py-3.5 bg-white text-black font-nunito font-black text-sm uppercase tracking-wider disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/90 transition-colors"
          >
            {saving ? 'SAVING...' : 'SAVE TEMPLATE'}
          </button>
        </form>
      </div>
    </div>
  );
}
