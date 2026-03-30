import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, Clipboard, LayoutTemplate, Trash2, Pencil, BookMarked } from 'lucide-react';
import db from '../db';
import { DEFAULT_COLUMNS } from '../columns';
import NewGameModal from '../components/NewGameModal';
import NewTemplateModal from '../components/NewTemplateModal';

const PILL_LIMIT = 4;

function describeLibraryCol(col) {
  if (col.type === 'buttons') {
    const count = col.options?.length ?? 0;
    return `${count} button${count !== 1 ? 's' : ''}`;
  }
  if (col.type === 'modal-list') return 'list picker';
  if (col.type === 'modal-number') return 'number picker';
  return col.type;
}

export default function LandingPage({ onOpenGame, onEditTemplate, onEditLibraryCol }) {
  const [showGameModal,     setShowGameModal]     = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  const games = useLiveQuery(
    () => db.games.orderBy('createdAt').reverse().toArray(),
    []
  );

  const templates = useLiveQuery(
    () => db.templates.orderBy('createdAt').toArray(),
    []
  );

  const libraryColumns = useLiveQuery(
    () => db.columnLibrary.orderBy('createdAt').toArray(),
    []
  );

  const playCounts = useLiveQuery(async () => {
    if (!games) return {};
    const result = {};
    await Promise.all(
      games.map(async g => {
        const cols = g.config ?? DEFAULT_COLUMNS;
        const colIds = cols.map(c => c.id);
        const allRows = await db.plays.where('gameId').equals(g.id).toArray();
        result[g.id] = allRows.filter(r => colIds.some(id => r[id] != null)).length;
      })
    );
    return result;
  }, [games]);

  function handleGameCreated(id) {
    setShowGameModal(false);
    onOpenGame(id);
  }

  async function deleteTemplate(id) {
    await db.templates.delete(id);
  }

  async function deleteLibraryCol(id) {
    await db.columnLibrary.delete(id);
  }

  return (
    <div className="min-h-svh bg-bg flex flex-col">
      {/* ── Header ── */}
      <header className="border-b border-edge px-6 py-5 flex items-center justify-between flex-shrink-0">
        <div>
          <div className="text-white font-nunito font-black text-2xl tracking-widest leading-none">
            HUDL DATA
          </div>
          <div className="text-white/25 text-[10px] font-mono tracking-widest mt-1.5">
            PLAY TRACKER
          </div>
        </div>
        <button
          onClick={() => setShowGameModal(true)}
          className="flex items-center gap-2 border px-4 py-2.5 text-white font-nunito font-black text-xs tracking-wider hover:bg-white hover:text-black transition-colors"
          style={{ backgroundColor: '#1e1e1e', borderColor: '#3a3a3a' }}
        >
          <Plus size={13} />
          NEW GAME
        </button>
      </header>

      <main className="flex-1 px-6 py-6 flex flex-col gap-10">

        {/* ── GAMES section ── */}
        <section>
          <div className="text-white/25 text-[10px] font-mono uppercase tracking-widest mb-4">
            GAMES{games ? ` · ${games.length}` : ''}
          </div>

          {!games ? (
            <div className="text-white/20 text-xs font-mono">LOADING...</div>

          ) : games.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Clipboard size={32} className="text-white/10" />
              <div className="text-white/25 text-sm text-center font-mono leading-relaxed">
                No games yet.<br />Create your first game to start tracking.
              </div>
              <button
                onClick={() => setShowGameModal(true)}
                className="flex items-center gap-2 bg-white text-black px-6 py-3 font-nunito font-black text-sm tracking-wider hover:bg-white/90 transition-colors"
              >
                <Plus size={14} />
                NEW GAME
              </button>
            </div>

          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 max-w-5xl">
              {games.map(game => {
                const rowCount   = playCounts?.[game.id] ?? null;
                const activeCols = game.config ?? DEFAULT_COLUMNS;
                const colCount   = activeCols.length;
                const pills      = activeCols.slice(0, PILL_LIMIT);
                const overflow   = colCount - PILL_LIMIT;

                return (
                  <button
                    key={game.id}
                    onClick={() => onOpenGame(game.id)}
                    className="text-left rounded-lg overflow-hidden group transition-all hover:ring-1 hover:ring-white/20"
                    style={{ border: '1px solid #3a3a3a' }}
                  >
                    <div className="px-4 pt-4 pb-3" style={{ backgroundColor: '#1e1e1e' }}>
                      <div className="font-nunito font-black text-white text-base leading-tight truncate">
                        {game.homeTeam}
                        <span className="text-white/30 font-mono font-normal text-xs mx-1.5">vs</span>
                        {game.awayTeam}
                      </div>
                      <div className="text-white/30 text-[10px] font-mono mt-1.5">
                        {new Date(game.date + 'T00:00:00').toLocaleDateString('en-US', {
                          weekday: 'short',
                          month:   'short',
                          day:     'numeric',
                          year:    'numeric',
                        })}
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-white/40 text-[10px] font-mono">
                          {colCount} cols
                        </span>
                        <span className="text-white/15 text-[10px] font-mono">·</span>
                        <span className="text-white/40 text-[10px] font-mono">
                          {rowCount != null ? rowCount : '—'} rows
                        </span>
                      </div>
                    </div>
                    <div
                      className="px-4 py-3 flex flex-wrap gap-1.5"
                      style={{ backgroundColor: '#111111' }}
                    >
                      {pills.map(col => (
                        <span
                          key={col.id}
                          className="font-mono text-[9px] uppercase tracking-wider text-white/35 border border-edge px-2 py-0.5 rounded-sm"
                        >
                          {col.name}
                        </span>
                      ))}
                      {overflow > 0 && (
                        <span className="font-mono text-[9px] uppercase tracking-wider text-white/20 px-1 py-0.5">
                          +{overflow}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* ── TEMPLATES section ── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <span className="text-white/25 text-[10px] font-mono uppercase tracking-widest">
              TEMPLATES{templates ? ` · ${templates.length}` : ''}
            </span>
            <button
              onClick={() => setShowTemplateModal(true)}
              className="flex items-center gap-1.5 text-white/40 hover:text-white text-[10px] font-mono uppercase tracking-widest transition-colors"
            >
              <Plus size={10} />
              NEW
            </button>
          </div>

          {!templates ? (
            <div className="text-white/20 text-xs font-mono">LOADING...</div>

          ) : templates.length === 0 ? (
            <div className="text-white/20 text-xs font-mono py-2">No templates saved.</div>

          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 max-w-5xl">
              {templates.map(t => (
                <div
                  key={t.id}
                  className="flex items-center justify-between px-4 py-3 rounded-lg"
                  style={{ border: '1px solid #3a3a3a', backgroundColor: '#1e1e1e' }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <LayoutTemplate size={14} className="text-white/30 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="font-nunito font-black text-white text-sm tracking-wide truncate">
                        {t.name}
                      </div>
                      <div className="text-white/30 text-[10px] font-mono mt-0.5">
                        {t.columns.length} columns
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0 ml-3">
                    <button
                      onClick={() => onEditTemplate(t.id)}
                      className="text-white/20 hover:text-white transition-colors p-1"
                    >
                      <Pencil size={14} />
                    </button>
                    {!t.isDefault && (
                      <button
                        onClick={() => deleteTemplate(t.id)}
                        className="text-white/20 hover:text-red-400 transition-colors p-1 -mr-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── COLUMN LIBRARY section ── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <span className="text-white/25 text-[10px] font-mono uppercase tracking-widest">
              COLUMN LIBRARY{libraryColumns ? ` · ${libraryColumns.length}` : ''}
            </span>
          </div>

          {!libraryColumns ? (
            <div className="text-white/20 text-xs font-mono">LOADING...</div>

          ) : libraryColumns.length === 0 ? (
            <div className="text-white/20 text-xs font-mono py-2">
              No saved columns. Use "Save to Library" in the template editor.
            </div>

          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 max-w-5xl">
              {libraryColumns.map(entry => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between px-4 py-3 rounded-lg"
                  style={{ border: '1px solid #3a3a3a', backgroundColor: '#1e1e1e' }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <BookMarked size={14} className="text-white/30 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="font-nunito font-black text-white text-sm tracking-wide truncate">
                        {entry.name}
                      </div>
                      <div className="text-white/30 text-[10px] font-mono mt-0.5">
                        {describeLibraryCol(entry.column)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0 ml-3">
                    <button
                      onClick={() => onEditLibraryCol(entry.id)}
                      className="text-white/20 hover:text-white transition-colors p-1"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => deleteLibraryCol(entry.id)}
                      className="text-white/20 hover:text-red-400 transition-colors p-1 -mr-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </main>

      {showGameModal && (
        <NewGameModal onClose={() => setShowGameModal(false)} onCreated={handleGameCreated} />
      )}
      {showTemplateModal && (
        <NewTemplateModal onClose={() => setShowTemplateModal(false)} onCreated={() => setShowTemplateModal(false)} />
      )}
    </div>
  );
}
