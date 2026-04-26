// ─── HELPERS ─────────────────────────────────────────────────
const pct = (n, total) => total > 0 ? Math.round((n / total) * 100) : 0;
const avg = arr => arr.length > 0 ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1) : '—';
const num = v => { const n = parseFloat(v); return isNaN(n) ? null : n; };

// Field accessors — support both camelCase (old) and lowercase (new/Hudl) keys
const getOdk = p => p.odk;
const getQtr = p => p.qtr;
const getDn = p => p.dn || p.down;
const getDist = p => p.dist2 || p.dist;
const getHash = p => p.hash;
const getYardLn = p => p.yardln || p.yardLn;
const getPlayType = p => p.playtype || p.playType;
const getResult = p => p.result;
const getGL = p => num(p.gainloss ?? p.gainLoss);
const getForm = p => {
  const f = p.offform || p.offForm;
  return f ? (f.includes('|') ? f.split('|')[1] : f) : null;
};

const isRun = p => { const t = getPlayType(p); return t ? t.toLowerCase().includes('run') : false; };
const isPass = p => { const t = getPlayType(p); return t ? t.toLowerCase().includes('pass') : false; };

const tally = (arr, fn) => {
  const m = {};
  arr.forEach(p => { const v = fn(p); if (v != null && v !== '') m[v] = (m[v] || 0) + 1; });
  return m;
};

// ─── MAIN CALC ───────────────────────────────────────────────
export function calcStats(plays) {
  if (!plays || plays.length === 0) return null;

  const all = plays.filter(p => p && Object.keys(p).filter(k => !k.startsWith('_')).length > 0);
  if (all.length === 0) return null;

  const off = all.filter(p => getOdk(p) === 'O');
  const def = all.filter(p => getOdk(p) === 'D');
  const st = all.filter(p => getOdk(p) === 'K' || getOdk(p) === 'S');
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
  const third = off.filter(p => String(getDn(p)) === '3');
  const thirdConv = third.filter(p => {
    const r = (getResult(p) || '').toLowerCase();
    if (r.includes('td')) return true;
    const gl = getGL(p);
    const dist = num(getDist(p));
    if (gl !== null && dist !== null && gl >= dist) return true;
    return r.includes('first') || r.includes('1st') || r.includes('conv');
  });

  const formCounts = tally(off, getForm);
  const formYards = {};
  off.forEach(p => {
    const f = getForm(p);
    if (f) {
      if (!formYards[f]) formYards[f] = [];
      const gl = getGL(p);
      if (gl !== null) formYards[f].push(gl);
    }
  });

  const formations = Object.keys(formCounts).map(f => ({
    name: f, count: formCounts[f],
    pct: pct(formCounts[f], off.length),
    avgYds: avg(formYards[f] || []),
  })).sort((a, b) => b.count - a.count);

  const offense = {
    thirdDown: third.length,
    thirdConv: thirdConv.length,
    thirdPct: pct(thirdConv.length, third.length),
    formations,
    dnBreakdown: ['1', '2', '3', '4'].map(d => {
      const dnPlays = off.filter(p => String(getDn(p)) === d);
      const dnRuns = dnPlays.filter(isRun);
      const dnPasses = dnPlays.filter(isPass);
      const dnGL = dnPlays.map(getGL).filter(v => v !== null);
      return {
        down: d, total: dnPlays.length, runs: dnRuns.length, passes: dnPasses.length,
        avgYds: avg(dnGL), runPct: pct(dnRuns.length, dnPlays.length),
      };
    }).filter(d => d.total > 0),
    // First downs (#11)
    firstDowns: off.filter(p => {
      const r = (getResult(p) || '').toLowerCase();
      if (r.includes('td') || r.includes('1st') || r.includes('first')) return true;
      const gl = getGL(p); const dist = num(getDist(p));
      return gl !== null && dist !== null && gl >= dist;
    }).length,
    // Play type breakdown (#13)
    playTypes: (() => {
      const t = tally(off, getPlayType);
      return Object.entries(t).sort((a, b) => b[1] - a[1]);
    })(),
    // Top results (#14)
    topResults: (() => {
      const t = tally(off, getResult);
      return Object.entries(t).sort((a, b) => b[1] - a[1]).slice(0, 10);
    })(),
    // Drives (#12)
    drives: (() => {
      const driveMap = {};
      let driveNum = 1;
      off.forEach((p, i) => {
        if (i === 0 || String(getDn(p)) === '1') {
          const prevDn = i > 0 ? getDn(off[i - 1]) : null;
          const prevResult = i > 0 ? (getResult(off[i - 1]) || '').toLowerCase() : '';
          if (i > 0 && (prevResult.includes('td') || prevResult.includes('punt') || prevResult.includes('fg') || prevResult.includes('int') || prevResult.includes('fumble') || prevResult.includes('safety') || String(getDn(off[i-1])) === '4')) {
            driveNum++;
          }
        }
        if (!driveMap[driveNum]) driveMap[driveNum] = [];
        driveMap[driveNum].push(p);
      });
      const driveList = Object.values(driveMap);
      const driveLens = driveList.map(d => d.length);
      const driveGains = driveList.map(d => d.map(getGL).filter(v => v !== null).reduce((a, b) => a + b, 0));
      const scoring = driveList.filter(d => d.some(p => { const r = (getResult(p) || '').toLowerCase(); return r.includes('td') || r.includes('fg') || r.includes('score'); }));
      const turnovers = driveList.filter(d => d.some(p => { const r = (getResult(p) || '').toLowerCase(); return r.includes('int') || r.includes('fumble'); }));
      return {
        count: driveList.length,
        avgLen: avg(driveLens),
        avgYds: avg(driveGains),
        scorePct: pct(scoring.length, driveList.length),
        turnovers: turnovers.length,
      };
    })(),
  };

  // ── DEFENSE ──
  const defGL = def.map(getGL).filter(v => v !== null);
  const sacks = def.filter(p => (getResult(p) || '').toLowerCase().includes('sack'));
  const ints = def.filter(p => { const r = (getResult(p) || '').toLowerCase(); return r.includes('int') || r.includes('interception'); });
  const tfls = def.filter(p => { const r = (getResult(p) || '').toLowerCase(); const gl = getGL(p); return (r.includes('tfl') || r.includes('for loss') || (gl !== null && gl < 0)); });
  const stops = def.filter(p => { const gl = getGL(p); return gl !== null && gl <= 0; });
  const defResults = (() => { const t = tally(def, getResult); return Object.entries(t).sort((a, b) => b[1] - a[1]).slice(0, 8); })();

  const defense = {
    totalPlays: def.length,
    avgYdsAllowed: avg(defGL),
    totalYdsAllowed: defGL.reduce((a, b) => a + b, 0),
    oppRuns: def.filter(isRun).length,
    oppPasses: def.filter(isPass).length,
    oppRunPct: pct(def.filter(isRun).length, def.length),
    sacks: sacks.length,
    interceptions: ints.length,
    tfls: tfls.length,
    stops: stops.length,
    stopRate: pct(stops.length, def.length),
    topResults: defResults,
  };

  // ── FIELD ──
  const hashCounts = tally(off, getHash);
  const hashYards = {};
  off.forEach(p => {
    const h = getHash(p);
    if (h) {
      if (!hashYards[h]) hashYards[h] = [];
      const gl = getGL(p);
      if (gl !== null) hashYards[h].push(gl);
    }
  });

  const redZone = off.filter(p => {
    const yl = num(getYardLn(p));
    return yl !== null && yl >= 1 && yl <= 20;
  });
  const rzTD = redZone.filter(p => (getResult(p) || '').toLowerCase().includes('td'));

  const field = {
    hashBreakdown: ['L', 'M', 'R'].map(h => ({
      hash: h, count: hashCounts[h] || 0,
      pct: pct(hashCounts[h] || 0, off.length),
      avgYds: avg(hashYards[h] || []),
    })),
    redZonePlays: redZone.length,
    redZoneTD: rzTD.length,
    redZonePct: pct(rzTD.length, redZone.length),
    // Field position breakdown (#15)
    fieldPosition: (() => {
      const offYL = off.filter(p => num(getYardLn(p)) !== null);
      if (offYL.length === 0) return null;
      const ownTerr = offYL.filter(p => num(getYardLn(p)) <= 0).length;
      const oppTerr = offYL.filter(p => { const y = num(getYardLn(p)); return y > 0 && y <= 49; }).length;
      const backedUp = offYL.filter(p => { const y = num(getYardLn(p)); return y >= -20 && y <= 0; }).length;
      return { total: offYL.length, ownTerr, oppTerr, redZone: redZone.length, backedUp };
    })(),
  };

  // ── BY QUARTER ──
  const quarters = ['1', '2', '3', '4'].map(q => {
    const qPlays = all.filter(p => String(getQtr(p)) === q);
    const qOff = qPlays.filter(p => getOdk(p) === 'O');
    const qDef = qPlays.filter(p => getOdk(p) === 'D');
    const qGL = qOff.map(getGL).filter(v => v !== null);
    return {
      quarter: q, totalPlays: qPlays.length,
      offPlays: qOff.length, defPlays: qDef.length,
      runs: qOff.filter(isRun).length, passes: qOff.filter(isPass).length,
      avgYds: avg(qGL), totalYards: qGL.reduce((a, b) => a + b, 0),
    };
  }).filter(q => q.totalPlays > 0);

  return { overview, offense, defense, field, quarters, all, off, def };
}

// ─── BUILD CSV for AI prompt (matches HTML buildDataSummary) ───
export function buildPlaysCsv(plays) {
  const active = (plays || []).filter(p => p && Object.keys(p).filter(k => !k.startsWith('_')).length > 0);
  const rows = active.map(p =>
    [getOdk(p), getQtr(p), getDn(p), getDist(p), getYardLn(p), getHash(p), getPlayType(p), getResult(p), getGL(p) ?? '', getForm(p) || ''].join(',')
  );
  return 'odk,qtr,dn,dist,ydln,hash,type,result,gl,form\n' + rows.join('\n');
}
