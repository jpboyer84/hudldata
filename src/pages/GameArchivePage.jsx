import { useLiveQuery } from 'dexie-react-hooks';
import { ChevronLeft, Clipboard } from 'lucide-react';
import db from '../db';
import { DEFAULT_COLUMNS } from '../columns';

export default function GameArchivePage({ onBack, onOpenGame }) {
  const games = useLiveQuery(
    () => db.games.orderBy('createdAt').reverse().toArray(),
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
          GAME ARCHIVE
        </span>
      </header>

      <main className="flex-1 px-4 py-6">
        {!games ? (
          <div className="text-white/20 text-xs font-mono">LOADING...</div>

        ) : games.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <Clipboard size={32} className="text-white/10" />
            <div className="text-white/25 text-sm text-center font-mono leading-relaxed">
              No games yet.<br />Start a new game from the home screen.
            </div>
          </div>

        ) : (
          <div className="flex flex-col gap-3 max-w-2xl mx-auto">
            {games.map(game => {
              const playCount = playCounts?.[game.id] ?? null;
              const activeCols = game.config ?? DEFAULT_COLUMNS;

              return (
                <button
                  key={game.id}
                  onClick={() => onOpenGame(game.id)}
                  className="text-left rounded-lg overflow-hidden transition-all hover:ring-1 hover:ring-white/20 active:scale-[0.99]"
                  style={{ border: '1px solid #3a3a3a' }}
                >
                  <div className="px-4 pt-4 pb-3" style={{ backgroundColor: '#1e1e1e' }}>
                    <div className="font-nunito font-black text-white text-lg leading-tight">
                      {game.homeTeam}
                      <span className="text-white/30 font-mono font-normal text-sm mx-2">vs</span>
                      {game.awayTeam}
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-white/40 text-xs font-mono">
                        {game.date ? new Date(game.date + 'T00:00:00').toLocaleDateString('en-US', {
                          weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
                        }) : '—'}
                      </span>
                      <span className="text-white/20 text-xs font-mono">·</span>
                      <span className="text-white/40 text-xs font-mono">
                        {playCount != null ? playCount : '—'} plays
                      </span>
                      <span className="text-white/20 text-xs font-mono">·</span>
                      <span className="text-white/40 text-xs font-mono">
                        {activeCols.length} cols
                      </span>
                    </div>
                  </div>
                  <div className="px-4 py-2.5 flex items-center justify-end" style={{ backgroundColor: '#111111', borderTop: '1px solid #2a2a2a' }}>
                    <span className="font-nunito font-black text-white/50 text-xs tracking-wider">
                      OPEN →
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
