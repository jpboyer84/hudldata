import { useState } from 'react';
import { X } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import db from '../db';
import { DEFAULT_COLUMNS } from '../columns';

export default function NewGameModal({ onClose, onCreated }) {
  const [homeTeam, setHomeTeam] = useState('');
  const [awayTeam, setAwayTeam] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [saving, setSaving] = useState(false);

  const templates = useLiveQuery(() => db.templates.orderBy('createdAt').toArray(), []);

  const effectiveTemplateId = selectedTemplateId ?? templates?.[0]?.id ?? null;
  const selectedTemplate = templates?.find(t => t.id === effectiveTemplateId);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!homeTeam.trim() || !awayTeam.trim()) return;
    setSaving(true);
    try {
      const columns = selectedTemplate?.columns ?? DEFAULT_COLUMNS;
      const id = await db.games.add({
        homeTeam: homeTeam.trim().toUpperCase(),
        awayTeam: awayTeam.trim().toUpperCase(),
        date,
        config: columns,
        createdAt: Date.now(),
      });
      const rows = Array.from({ length: 200 }, (_, i) => ({
        gameId: id, rowIndex: i, createdAt: Date.now(),
      }));
      await db.plays.bulkAdd(rows);
      onCreated(id);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-surface border border-edge w-full max-w-sm max-h-[90svh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-edge sticky top-0 bg-surface z-10">
          <span className="font-nunito font-black text-white text-base tracking-wider">NEW GAME</span>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors p-1 -mr-1"
          >
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-white/40 text-[10px] uppercase tracking-widest font-mono">Home Team</span>
            <input
              type="text"
              value={homeTeam}
              onChange={e => setHomeTeam(e.target.value)}
              placeholder="EAGLES"
              className="bg-bg border border-edge text-white px-3 py-2.5 font-mono text-sm uppercase placeholder:text-white/20 focus:outline-none focus:border-white/50 transition-colors"
              autoFocus
              autoComplete="off"
              autoCapitalize="characters"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-white/40 text-[10px] uppercase tracking-widest font-mono">Away Team</span>
            <input
              type="text"
              value={awayTeam}
              onChange={e => setAwayTeam(e.target.value)}
              placeholder="HAWKS"
              className="bg-bg border border-edge text-white px-3 py-2.5 font-mono text-sm uppercase placeholder:text-white/20 focus:outline-none focus:border-white/50 transition-colors"
              autoComplete="off"
              autoCapitalize="characters"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-white/40 text-[10px] uppercase tracking-widest font-mono">Date</span>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="bg-bg border border-edge text-white px-3 py-2.5 font-mono text-sm focus:outline-none focus:border-white/50 transition-colors"
            />
          </label>

          {/* Template selector */}
          <div className="flex flex-col gap-2">
            <span className="text-white/40 text-[10px] uppercase tracking-widest font-mono">Template</span>
            {!templates ? (
              <div className="text-white/20 text-xs font-mono py-1">LOADING...</div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {templates.map(t => {
                  const isSelected = t.id === effectiveTemplateId;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedTemplateId(t.id)}
                      className={`flex items-center justify-between px-3 py-2.5 border text-left transition-colors ${
                        isSelected
                          ? 'border-white bg-white/10'
                          : 'border-edge bg-bg hover:border-white/30'
                      }`}
                    >
                      <span className={`font-mono text-sm font-bold ${isSelected ? 'text-white' : 'text-white/50'}`}>
                        {t.name}
                      </span>
                      <span className="text-white/25 text-[10px] font-mono">
                        {t.columns.length} cols
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={saving || !homeTeam.trim() || !awayTeam.trim()}
            className="mt-1 py-3.5 bg-white text-black font-nunito font-black text-sm uppercase tracking-wider disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/90 transition-colors"
          >
            {saving ? 'CREATING...' : 'CREATE GAME'}
          </button>
        </form>
      </div>
    </div>
  );
}
