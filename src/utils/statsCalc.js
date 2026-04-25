// ─── HELPERS ─────────────────────────────────────────────────
const pct = (n, total) => total > 0 ? Math.round((n / total) * 100) : 0;
const avg = arr => arr.length > 0 ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1) : '—';
const num = v => { const n = parseFloat(v); return isNaN(n) ? null : n; };
const tally = (arr, fn) => {
  const m = {};
  arr.forEach(p => { const v = fn(p); if (v != null && v !== '') m[v] = (m[v] || 0) + 1; });
  return m;
};

const isRun = p => !!(p.playType?.toLowerCase().includes('run'));
const isPass = p => !!(p.playType?.toLowerCase().includes('pass'));
const getGL = p => num(p.gainLoss);

// ─── MAIN CALC ───────────────────────────────────────────────
export function calcStats(plays) {
  if (!plays || plays.length === 0) return null;

  // Filter to filled plays only
  const all = plays.filter(p => p && Object.keys(p).filter(k => !k.startsWith('_')).length > 0);
  if (all.length === 0) return null;

  const off = all.filter(p => p.odk === 'O');
  const def = all.filter(p => p.odk === 'D');
  const st = all.filter(p => p.odk === 'K' || p.odk === 'S');
  const runs = off.filter(isRun);
  const passes = off.filter(isPass);
  const offGL = off.map(getGL).filter(v => v !== null);
  const runGL = runs.map(getGL).filter(v => v !== null);
  const passGL = passes.map(getGL).filter(v => v !== null);

  // ── OVERVIEW ──
  const overview = {
    totalPlays: all.length,
    offense: off.length,
    defense: def.length,
    special: st.length,
    avgYdsPlay: avg(offGL),
    avgYdsRun: avg(runGL),
    avgYdsPass: avg(passGL),
    runs: runs.length,
    passes: passes.length,
    runPct: pct(runs.length, off.length),
    passPct: pct(passes.length, off.length),
    gain3: offGL.filter(v => v >= 3).length,
    gain5: offGL.filter(v => v >= 5).length,
    gain10: offGL.filter(v => v >= 10).length,
    negPlays: offGL.filter(v => v < 0).length,
    totalYards: offGL.reduce((a, b) => a + b, 0),
  };

  // ── OFFENSE ──
  const dnCounts = tally(off, p => p.dn);
  const third = off.filter(p => p.dn === '3' || p.dn === 3);
  const thirdConv = third.filter(p => {
    const r = (p.result || '').toLowerCase();
    if (r.includes('td')) return true;
    const gl = getGL(p);
    const dist = num(p.dist);
    if (gl !== null && dist !== null && gl >= dist) return true;
    return r.includes('first') || r.includes('1st');
  });

  // Formation breakdown
  const formCounts = tally(off, p => p.offForm);
  const formYards = {};
  off.forEach(p => {
    if (p.offForm) {
      if (!formYards[p.offForm]) formYards[p.offForm] = [];
      const gl = getGL(p);
      if (gl !== null) formYards[p.offForm].push(gl);
    }
  });

  const formations = Object.keys(formCounts).map(f => ({
    name: f,
    count: formCounts[f],
    pct: pct(formCounts[f], off.length),
    avgYds: avg(formYards[f] || []),
  })).sort((a, b) => b.count - a.count);

  const offense = {
    dnCounts,
    thirdDown: third.length,
    thirdConv: thirdConv.length,
    thirdPct: pct(thirdConv.length, third.length),
    formations,
    dnBreakdown: ['1', '2', '3', '4'].map(d => {
      const dnPlays = off.filter(p => String(p.dn) === d);
      const dnRuns = dnPlays.filter(isRun);
      const dnPasses = dnPlays.filter(isPass);
      const dnGL = dnPlays.map(getGL).filter(v => v !== null);
      return {
        down: d,
        total: dnPlays.length,
        runs: dnRuns.length,
        passes: dnPasses.length,
        avgYds: avg(dnGL),
        runPct: pct(dnRuns.length, dnPlays.length),
      };
    }).filter(d => d.total > 0),
  };

  // ── DEFENSE ──
  const defGL = def.map(getGL).filter(v => v !== null);
  const defRuns = def.filter(isRun);
  const defPasses = def.filter(isPass);
  const sacks = def.filter(p => (p.result || '').toLowerCase().includes('sack'));
  const ints = def.filter(p => (p.result || '').toLowerCase().includes('interception'));
  const stops = def.filter(p => {
    const gl = getGL(p);
    return gl !== null && gl <= 0;
  });

  const defense = {
    totalPlays: def.length,
    avgYdsAllowed: avg(defGL),
    totalYdsAllowed: defGL.reduce((a, b) => a + b, 0),
    oppRuns: defRuns.length,
    oppPasses: defPasses.length,
    oppRunPct: pct(defRuns.length, def.length),
    sacks: sacks.length,
    interceptions: ints.length,
    stops: stops.length,
    stopRate: pct(stops.length, def.length),
  };

  // ── FIELD ──
  const hashCounts = tally(off, p => p.hash);
  const hashYards = {};
  off.forEach(p => {
    if (p.hash) {
      if (!hashYards[p.hash]) hashYards[p.hash] = [];
      const gl = getGL(p);
      if (gl !== null) hashYards[p.hash].push(gl);
    }
  });

  const redZone = off.filter(p => {
    const yl = num(p.yardLn);
    return yl !== null && yl >= 0 && yl <= 20;
  });
  const rzTD = redZone.filter(p => (p.result || '').toLowerCase().includes('td'));

  const field = {
    hashBreakdown: ['L', 'M', 'R'].map(h => ({
      hash: h,
      count: hashCounts[h] || 0,
      pct: pct(hashCounts[h] || 0, off.length),
      avgYds: avg(hashYards[h] || []),
    })),
    redZonePlays: redZone.length,
    redZoneTD: rzTD.length,
    redZonePct: pct(rzTD.length, redZone.length),
  };

  // ── BY QUARTER ──
  const quarters = ['1', '2', '3', '4'].map(q => {
    // Match both "1" and "1Q" formats
    const qPlays = all.filter(p => String(p.qtr) === q || String(p.qtr) === `${q}Q`);
    const qOff = qPlays.filter(p => p.odk === 'O');
    const qDef = qPlays.filter(p => p.odk === 'D');
    const qRuns = qOff.filter(isRun);
    const qPasses = qOff.filter(isPass);
    const qGL = qOff.map(getGL).filter(v => v !== null);
    return {
      quarter: q,
      totalPlays: qPlays.length,
      offPlays: qOff.length,
      defPlays: qDef.length,
      runs: qRuns.length,
      passes: qPasses.length,
      avgYds: avg(qGL),
      totalYards: qGL.reduce((a, b) => a + b, 0),
    };
  }).filter(q => q.totalPlays > 0);

  return { overview, offense, defense, field, quarters, all, off, def };
}
