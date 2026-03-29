import { Trash2 } from 'lucide-react';
import db from '../db';
import { DEFAULT_COLUMNS } from '../columns';

export default function PlayTable({ plays, columns }) {
  const cols = columns ?? DEFAULT_COLUMNS;
  const colIds = cols.map(c => c.id);

  // Only show rows that have at least one filled value
  const filled = (plays ?? [])
    .filter(p => colIds.some(id => p[id] != null))
    .slice()
    .reverse();

  async function handleDelete(id) {
    // Clear the row (keep it pre-allocated)
    const patch = {};
    colIds.forEach(cid => { patch[cid] = null; });
    await db.plays.update(id, patch);
  }

  if (filled.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-white/20 text-xs font-mono tracking-wider">
        NO PLAYS LOGGED YET
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs font-mono border-collapse" style={{ minWidth: `${120 + cols.length * 80}px` }}>
        <thead className="sticky top-0 z-10" style={{ backgroundColor: '#111111' }}>
          <tr className="border-b border-edge">
            <th className="text-left pl-3 pr-2 py-2.5 text-white/30 font-nunito font-black text-[10px] tracking-wider">#</th>
            {cols.map(col => (
              <th
                key={col.id}
                className="text-left px-2 py-2.5 text-white/30 font-nunito font-black text-[10px] tracking-wider whitespace-nowrap"
              >
                {col.name}
              </th>
            ))}
            <th className="w-8 pr-3" />
          </tr>
        </thead>
        <tbody>
          {filled.map((play, i) => (
            <tr
              key={play.id}
              className="border-b border-edge/40 hover:bg-white/[0.025] transition-colors"
            >
              <td className="pl-3 pr-2 py-2.5 text-white/25">{filled.length - i}</td>
              {cols.map(col => (
                <td key={col.id} className="px-2 py-2.5 text-white/60 whitespace-nowrap">
                  {play[col.id] != null
                    ? String(play[col.id])
                    : <span className="text-white/15">—</span>
                  }
                </td>
              ))}
              <td className="pr-3 py-2.5">
                <button
                  onClick={() => handleDelete(play.id)}
                  className="text-white/15 hover:text-red-400 transition-colors p-1 -m-1"
                  title="Clear row"
                >
                  <Trash2 size={11} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
