import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { DEFAULT_COLUMNS } from '../columns';

const TOOLTIP_STYLE = {
  backgroundColor: '#1e1e1e',
  border: '1px solid #3a3a3a',
  color: '#fff',
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: 11,
  borderRadius: 0,
};
const CURSOR_STYLE = { fill: 'rgba(255,255,255,0.04)' };
const tickStyle = fill => ({ fill, fontSize: 10, fontFamily: "'IBM Plex Mono', monospace" });

function StatCard({ label, value, sub }) {
  return (
    <div className="border border-edge p-3.5 flex flex-col gap-1" style={{ backgroundColor: '#1e1e1e' }}>
      <div className="text-white/30 text-[10px] uppercase tracking-widest font-mono leading-none">{label}</div>
      <div className="text-white font-nunito font-black text-3xl leading-none mt-1">{value}</div>
      {sub && <div className="text-white/25 text-[10px] font-mono mt-0.5">{sub}</div>}
    </div>
  );
}

export default function StatsPanel({ plays, columns }) {
  const cols = columns ?? DEFAULT_COLUMNS;

  const stats = useMemo(() => {
    if (!plays || plays.length === 0) return null;
    const colIds = cols.map(c => c.id);
    const filled = plays.filter(p => colIds.some(id => p[id] != null));
    if (filled.length === 0) return null;

    const total = filled.length;

    // Value distribution per column (top 8 values each)
    const perCol = cols.slice(0, 6).map(col => {
      const counts = {};
      filled.forEach(p => {
        const v = p[col.id];
        if (v != null) counts[v] = (counts[v] ?? 0) + 1;
      });
      const data = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([name, count]) => ({ name, count }));
      return { col, data };
    }).filter(x => x.data.length > 0);

    return { total, perCol };
  }, [plays, cols]);

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-40 text-white/20 text-xs font-mono tracking-wider">
        LOG PLAYS TO SEE STATS
      </div>
    );
  }

  return (
    <div className="p-4 flex flex-col gap-7 pb-8">
      <div>
        <div className="text-white/30 text-[10px] uppercase tracking-widest font-mono mb-3">Summary</div>
        <div className="grid grid-cols-2 gap-2">
          <StatCard label="Total Plays" value={stats.total} />
        </div>
      </div>

      {stats.perCol.map(({ col, data }) => (
        <div key={col.id}>
          <div className="text-white/30 text-[10px] uppercase tracking-widest font-mono mb-3">
            {col.name}
          </div>
          <ResponsiveContainer width="100%" height={Math.max(100, data.length * 28)}>
            <BarChart data={data} layout="vertical" barCategoryGap="20%">
              <CartesianGrid horizontal={false} stroke="#3a3a3a" />
              <XAxis type="number" tick={tickStyle('#ffffff35')} axisLine={false} tickLine={false} />
              <YAxis
                type="category"
                dataKey="name"
                tick={tickStyle('#ffffff80')}
                axisLine={false}
                tickLine={false}
                width={70}
              />
              <Tooltip contentStyle={TOOLTIP_STYLE} cursor={CURSOR_STYLE} />
              <Bar dataKey="count" fill="#ffffff" radius={[0,2,2,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ))}
    </div>
  );
}
