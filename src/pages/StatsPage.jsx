import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { calcStats, buildSummaryObj, buildSlimCsv } from '../utils/statsCalc';
import { fetchHudlClips, hudlClipsToPlays } from '../lib/hudlData';
import { fetchPlaybook, buildPlaybookContext, buildAskAISystemPrompt } from '../lib/playbook';
import { HUDL_API } from '../lib/constants';
import HudlCutupPicker from '../components/HudlCutupPicker';

const MAIN_TABS = ['SPOTLIGHT', 'STATS', 'ASK AI', 'SAVED'];
const STAT_SUBS = ['OVERVIEW', 'OFFENSE', 'DEFENSE', 'FIELD', 'BY QTR'];

// ═══════════════════════════════════════
// STAT COMPONENTS (reused)
// ═══════════════════════════════════════
function BarRow({ label, value, total, color }) {
  const p = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 600, marginBottom: 3 }}>
        <span>{label}</span>
        <span style={{ color: 'var(--color-muted)' }}>{value} / {total} ({p}%)</span>
      </div>
      <div style={{ height: 8, background: 'var(--color-surface2)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: `${p}%`, height: '100%', background: color || 'var(--color-accent)', borderRadius: 4, transition: 'width 0.3s' }} />
      </div>
    </div>
  );
}
function StatBig({ value, label }) {
  return (<div style={{ flex: 1, textAlign: 'center' }}><div style={{ fontSize: 24, fontWeight: 700, lineHeight: 1 }}>{value}</div><div style={{ fontSize: 10, color: 'var(--color-muted)', marginTop: 4, letterSpacing: '0.05em' }}>{label}</div></div>);
}
function StatCard({ title, subtitle, children }) {
  const [open, setOpen] = useState(true);
  return (<div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12, marginBottom: 10, overflow: 'hidden' }}><div onClick={() => setOpen(!open)} style={{ padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}><div><div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em' }}>{title}</div>{subtitle && <div style={{ fontSize: 10, color: 'var(--color-muted)', marginTop: 2 }}>{subtitle}</div>}</div><div style={{ fontSize: 14, color: 'var(--color-muted)', transform: open ? 'rotate(180deg)' : 'none', transition: '0.2s' }}>▾</div></div>{open && <div style={{ padding: '0 14px 14px' }}>{children}</div>}</div>);
}

// ═══ STAT SUB-TABS ═══
function OverviewTab({ s }) {
  const o = s.overview;
  return (<>
    <StatCard title="PLAY COUNT" subtitle={`${o.totalPlays} total plays`}><div style={{ display: 'flex', gap: 8 }}><StatBig value={o.offense} label="OFFENSE" /><StatBig value={o.defense} label="DEFENSE" /><StatBig value={o.special} label="SPECIAL" /></div></StatCard>
    {o.offense > 0 && (<>
      <StatCard title="OFFENSIVE EFFICIENCY" subtitle={`${o.offense} offense plays`}><div style={{ display: 'flex', gap: 8, marginBottom: 14 }}><StatBig value={o.avgYdsPlay} label="AVG YDS/PLAY" /><StatBig value={o.avgYdsRun} label="AVG YDS/RUN" /><StatBig value={o.avgYdsPass} label="AVG YDS/PASS" /></div><BarRow label="3+ YARDS" value={o.gain3} total={o.offense} color="#22c55e" /><BarRow label="5+ YARDS" value={o.gain5} total={o.offense} color="#3b82f6" /><BarRow label="10+ YARDS" value={o.gain10} total={o.offense} color="var(--color-accent)" /><BarRow label="NEGATIVE" value={o.negPlays} total={o.offense} color="#ef4444" /></StatCard>
      <StatCard title="RUN / PASS SPLIT" subtitle={`${o.offense} offense plays`}><BarRow label="RUN" value={o.runs} total={o.offense} color="var(--color-accent)" /><BarRow label="PASS" value={o.passes} total={o.offense} color="#3b82f6" /><div style={{ display: 'flex', gap: 8, marginTop: 12 }}><StatBig value={o.avgYdsRun} label="RUN AVG" /><StatBig value={o.avgYdsPass} label="PASS AVG" /></div></StatCard>
    </>)}
  </>);
}
function OffenseTab({ s }) {
  const { offense, overview } = s;
  return (<>
    {/* First Downs (#11) */}
    {offense.firstDowns > 0 && <StatCard title="FIRST DOWNS" subtitle={`${offense.firstDowns} first downs earned`}><div style={{ display: 'flex', gap: 8 }}><StatBig value={offense.firstDowns} label="1ST DOWNS" /><StatBig value={overview.offense > 0 ? Math.round(offense.firstDowns/overview.offense*100)+'%' : '—'} label="1ST DN RATE" /></div></StatCard>}
    {offense.thirdDown > 0 && <StatCard title="3RD DOWN CONVERSIONS" subtitle={`${offense.thirdDown} attempts`}><div style={{ display: 'flex', gap: 8, marginBottom: 10 }}><StatBig value={offense.thirdConv} label="CONVERTED" /><StatBig value={`${offense.thirdPct}%`} label="CONV RATE" /></div><BarRow label="CONVERTED" value={offense.thirdConv} total={offense.thirdDown} color="#22c55e" /></StatCard>}
    {/* Drives (#12) */}
    {offense.drives && offense.drives.count > 0 && <StatCard title="DRIVES" subtitle={`${offense.drives.count} drives`}><div style={{ display: 'flex', gap: 8, marginBottom: 10 }}><StatBig value={offense.drives.count} label="DRIVES" /><StatBig value={offense.drives.avgLen} label="AVG LEN" /><StatBig value={offense.drives.avgYds} label="AVG YDS" /></div><div style={{ display: 'flex', gap: 8 }}><StatBig value={`${offense.drives.scorePct}%`} label="SCORE %" /><StatBig value={offense.drives.turnovers} label="TURNOVERS" /></div></StatCard>}
    {offense.dnBreakdown.length > 0 && <StatCard title="DOWN BREAKDOWN" subtitle="Plays per down">{offense.dnBreakdown.map(d => (<div key={d.down} style={{ marginBottom: 10 }}><div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>{['1ST','2ND','3RD','4TH'][parseInt(d.down)-1]} DOWN — {d.total} plays · Avg {d.avgYds} yds</div><BarRow label="RUN" value={d.runs} total={d.total} color="var(--color-accent)" /><BarRow label="PASS" value={d.passes} total={d.total} color="#3b82f6" /></div>))}</StatCard>}
    {/* Play Type Breakdown (#13) */}
    {offense.playTypes && offense.playTypes.length > 0 && <StatCard title="PLAY TYPE BREAKDOWN" subtitle={`${overview.offense} offense plays`}>{offense.playTypes.map(([t, c]) => <BarRow key={t} label={t} value={c} total={overview.offense} color="var(--color-accent)" />)}</StatCard>}
    {/* Top Results (#14) */}
    {offense.topResults && offense.topResults.length > 0 && <StatCard title="TOP RESULTS" subtitle="Most common outcomes">{offense.topResults.map(([r, c]) => <BarRow key={r} label={r} value={c} total={overview.offense} color="#3b82f6" />)}</StatCard>}
    {offense.formations.length > 0 && <StatCard title="FORMATIONS" subtitle={`${offense.formations.length} formations used`}>{offense.formations.slice(0, 8).map(f => (<div key={f.name} style={{ marginBottom: 8 }}><div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 600, marginBottom: 2 }}><span>{f.name}</span><span style={{ color: 'var(--color-muted)' }}>{f.count} plays · {f.avgYds} yds</span></div><BarRow label="" value={f.count} total={overview.offense} color="var(--color-accent)" /></div>))}</StatCard>}
  </>);
}
function DefenseTab({ s }) {
  const d = s.defense;
  if (d.totalPlays === 0) return <div className="empty-msg">No defensive plays found.</div>;
  return (<>
    <StatCard title="DEFENSE OVERVIEW" subtitle={`${d.totalPlays} defensive plays`}><div style={{ display: 'flex', gap: 8 }}><StatBig value={d.avgYdsAllowed} label="AVG ALLOWED" /><StatBig value={d.totalYdsAllowed} label="TOTAL YDS" /></div></StatCard>
    <StatCard title="OPPONENT TENDENCIES"><BarRow label="OPP RUN" value={d.oppRuns} total={d.totalPlays} color="var(--color-accent)" /><BarRow label="OPP PASS" value={d.oppPasses} total={d.totalPlays} color="#3b82f6" /></StatCard>
    <StatCard title="IMPACT PLAYS"><div style={{ display: 'flex', gap: 8 }}><StatBig value={d.sacks} label="SACKS" /><StatBig value={d.tfls || 0} label="TFLs" /><StatBig value={d.interceptions} label="INTs" /><StatBig value={`${d.stopRate}%`} label="STOP %" /></div></StatCard>
    {d.topResults && d.topResults.length > 0 && <StatCard title="DEF TOP RESULTS">{d.topResults.map(([r, c]) => <BarRow key={r} label={r} value={c} total={d.totalPlays} color="#3b82f6" />)}</StatCard>}
  </>);
}
function FieldTab({ s }) {
  const f = s.field;
  return (<>
    <StatCard title="HASH MARK TENDENCIES">{f.hashBreakdown.map(h => (<div key={h.hash} style={{ marginBottom: 6 }}><BarRow label={h.hash === 'L' ? 'LEFT' : h.hash === 'M' ? 'MIDDLE' : 'RIGHT'} value={h.count} total={s.overview.offense} color={h.hash === 'L' ? '#ef4444' : h.hash === 'M' ? '#f59e0b' : '#22c55e'} /><div style={{ fontSize: 10, color: 'var(--color-muted)', marginTop: -4, marginBottom: 4 }}>Avg {h.avgYds} yds/play</div></div>))}</StatCard>
    {/* Field Position (#15) */}
    {f.fieldPosition && <StatCard title="FIELD POSITION" subtitle={`${f.fieldPosition.total} plays with yard line data`}>
      <BarRow label="OWN TERRITORY" value={f.fieldPosition.ownTerr} total={f.fieldPosition.total} color="#ef4444" />
      <BarRow label="OPP TERRITORY" value={f.fieldPosition.oppTerr} total={f.fieldPosition.total} color="#3b82f6" />
      <BarRow label="RED ZONE" value={f.fieldPosition.redZone} total={f.fieldPosition.total} color="#22c55e" />
      <BarRow label="BACKED UP (own 20)" value={f.fieldPosition.backedUp} total={f.fieldPosition.total} color="#f59e0b" />
    </StatCard>}
    <StatCard title="RED ZONE" subtitle="Plays inside the 20"><div style={{ display: 'flex', gap: 8 }}><StatBig value={f.redZonePlays} label="RZ PLAYS" /><StatBig value={f.redZoneTD} label="RZ TDs" /><StatBig value={`${f.redZonePct}%`} label="RZ TD %" /></div></StatCard>
  </>);
}
function ByQtrTab({ s }) {
  if (s.quarters.length === 0) return <div className="empty-msg">No quarter data found.</div>;
  return (<>{s.quarters.map(q => (<StatCard key={q.quarter} title={`Q${q.quarter}`} subtitle={`${q.totalPlays} plays`}><div style={{ display: 'flex', gap: 8, marginBottom: 10 }}><StatBig value={q.offPlays} label="OFF" /><StatBig value={q.defPlays} label="DEF" /><StatBig value={q.avgYds} label="AVG YDS" /><StatBig value={q.totalYards} label="TOTAL" /></div>{q.offPlays > 0 && <><BarRow label="RUN" value={q.runs} total={q.offPlays} color="var(--color-accent)" /><BarRow label="PASS" value={q.passes} total={q.offPlays} color="#3b82f6" /></>}</StatCard>))}</>);
}

// ═══════════════════════════════════════
// SPOTLIGHT TAB
// ═══════════════════════════════════════
function SpotlightTab({ plays, playbook, label }) {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [methodology, setMethodology] = useState(null);
  const [methLoading, setMethLoading] = useState(false);
  const [feedback, setFeedback] = useState(() => {
    try { return JSON.parse(localStorage.getItem('hd_spotlight_feedback') || '{"liked":[],"disliked":[]}'); }
    catch { return { liked: [], disliked: [] }; }
  });
  const hasRun = useRef(false);

  useEffect(() => {
    if (plays.length > 0 && !hasRun.current) {
      hasRun.current = true;
      runAnalysis(false);
    }
  }, [plays]);

  function saveFeedback(fb) {
    setFeedback(fb);
    localStorage.setItem('hd_spotlight_feedback', JSON.stringify(fb));
  }

  function rate(ins, liked) {
    const fb = { ...feedback };
    fb.liked = fb.liked.filter(x => x.headline !== ins.headline);
    fb.disliked = fb.disliked.filter(x => x.headline !== ins.headline);
    if (liked) fb.liked.push({ headline: ins.headline, stat: ins.stat, tag: ins.tag, ts: Date.now() });
    else fb.disliked.push({ headline: ins.headline, stat: ins.stat, tag: ins.tag, ts: Date.now() });
    if (fb.liked.length > 20) fb.liked = fb.liked.slice(-20);
    if (fb.disliked.length > 20) fb.disliked = fb.disliked.slice(-20);
    saveFeedback(fb);
  }

  async function runAnalysis(append) {
    setLoading(true);
    const active = plays.filter(p => p && Object.keys(p).filter(k => !k.startsWith('_')).length > 0);
    if (active.length === 0) { setLoading(false); return; }

    const pbContext = buildPlaybookContext(playbook);
    let feedbackCtx = '';
    if (feedback.liked.length > 0) feedbackCtx += '\n\nThe coach has rated these types of insights as USEFUL (generate more like these):\n' + feedback.liked.slice(-10).map(x => `- [${x.tag}] "${x.headline}" (${x.stat})`).join('\n');
    if (feedback.disliked.length > 0) feedbackCtx += '\n\nThe coach has rated these types of insights as NOT USEFUL (avoid similar ones):\n' + feedback.disliked.slice(-10).map(x => `- [${x.tag}] "${x.headline}" (${x.stat})`).join('\n');

    // System prompt — exact match to HTML
    const systemPrompt = `You are an elite football analytics assistant for a high school coach. Analyze play data and surface the most important, actionable findings for BOTH offense and defense.
${pbContext}

Return ONLY a valid JSON array (no markdown, no preamble). Include 2-5 OFF insights (tag "O") and 2-5 DEF insights (tag "D"). Only include genuinely useful findings. Quality over quantity. Each object must have:
- "stat": The key data point. Max 6 words. Use coaching shorthand: Q1/Q2/Q3/Q4 (never spell out quarter), 1st DN/2nd DN/3rd DN/4th DN, OFF/DEF, conv, avg, R Hash/L Hash/M, neg, comp, inc, STK, INT. Examples: "23% 3rd DN conv", "72% run on 1st DN", "81% of runs gain 3+", "DEF 40% of passes gain 5+"
- "headline": Coaching recommendation. Max 8 words. Same shorthand.
- "why": Ultra-brief context. Max 6 words.
- "tag": "O" or "D"
- "priority": "high" if exploitable/alarming, "medium" if notable, "low" if interesting

CRITICAL RULES:
- Analyze BOTH "offense" and "defense" sections. Do not skip defense.
- DEF analysis: yards allowed, opp run/pass tendencies, 3rd DN stop rate, sacks, TFLs, INTs, down-by-down.
- Check "playsWithYardage" and "missingYardage". If fewer than 10 plays with yardage, do NOT make avg claims.
- Be specific with numbers. Use shorthand everywhere.
- Do NOT repeat prior insights (listed below if follow-up).
- STAT PRIORITY: Prefer EFFICIENCY RATES over averages. Averages (YPC, YPP) are easily skewed by one big play. Instead use "% of runs gaining 3+ yds", "% of runs gaining <3 yds" (stuff rate — how often the run game gets stopped), "% of passes gaining 5+ yds", "% of pass plays gaining 0 yds" (combines incompletions, sacks, and throwaways into one stat — better than completion % alone), "% of plays gaining 10+ yds" (explosive rate), "% of plays going negative". These are more honest and actionable. Only use YPC/YPP if there's no better way to express the finding.${feedbackCtx}`;

    // Build pre-computed summary object (token-efficient, matches HTML)
    const summaryObj = buildSummaryObj(plays);
    const existingNote = append && insights.length > 0 ? '\n\nYou have ALREADY provided these insights — do NOT repeat them, find NEW patterns:\n' + insights.map(i => `- ${i.headline} (${i.stat})`).join('\n') : '';

    try {
      const resp = await fetch(`${HUDL_API}/api/claude`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1600,
          system: systemPrompt,
          messages: [{ role: 'user', content: `Analyze this football play data and return insights as JSON:\n${JSON.stringify(summaryObj, null, 2)}${existingNote}` }],
        }),
      });
      const data = await resp.json();
      const raw = data.content?.[0]?.text || '[]';
      const cleaned = raw.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      if (append) setInsights(prev => [...prev, ...parsed]);
      else setInsights(parsed);
    } catch (err) {
      console.error('Spotlight error:', err);
    }
    setLoading(false);
  }

  const offInsights = insights.filter(i => i.tag === 'O');
  const defInsights = insights.filter(i => i.tag === 'D');
  async function explainMethodology(ins) {
    setMethodology({ insight: ins, explanation: null });
    setMethLoading(true);
    try {
      const csv = buildSlimCsv(plays, label);
      const resp = await fetch(`${HUDL_API}/api/claude`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 600,
          system: `You are a football analytics assistant. Explain in 2-3 sentences exactly how the following insight was calculated from the play data. Be specific about which plays were counted and which were excluded. Use coaching language.`,
          messages: [{ role: 'user', content: `Insight: "${ins.stat}" — "${ins.headline}" (${ins.why})\n\nThe coach wants to understand how this was calculated. Here is the play data:\n${csv.substring(0, 3000)}` }],
        }),
      });
      const data = await resp.json();
      setMethodology({ insight: ins, explanation: data.content?.[0]?.text || 'Could not generate explanation.' });
    } catch { setMethodology({ insight: ins, explanation: 'Error loading explanation.' }); }
    setMethLoading(false);
  }

  const priorityOrder = { high: 0, medium: 1, low: 2 };
  const sorted = arr => [...arr].sort((a, b) => (priorityOrder[a.priority] || 1) - (priorityOrder[b.priority] || 1));

  function renderCard(ins, sideColor) {
    const tagLabel = ins.tag === 'O' ? 'OFFENSE' : ins.tag === 'D' ? 'DEFENSE' : 'GENERAL';
    return (
      <div key={ins.headline} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderLeft: `3px solid ${sideColor}`, borderRadius: 10, padding: '12px 14px', marginBottom: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <span style={{ fontSize: 11, color: sideColor, fontWeight: 600 }}>{tagLabel}</span>
          <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
            <button onClick={() => explainMethodology(ins)} style={{ background: 'none', border: 'none', fontSize: 16, cursor: 'pointer', padding: '2px 4px', opacity: 0.4 }} title="How was this calculated?">❓</button>
            <button onClick={() => rate(ins, true)} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', padding: '2px 4px', opacity: 0.4 }}>👍</button>
            <button onClick={() => rate(ins, false)} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', padding: '2px 4px', opacity: 0.4 }}>👎</button>
          </div>
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, color: sideColor, marginTop: 4 }}>{ins.stat}</div>
        <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4, color: ins.priority === 'high' ? '#ef4444' : ins.priority === 'medium' ? '#f59e0b' : 'var(--color-text)' }}>{ins.headline}</div>
        <div style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 2 }}>{ins.why}</div>
      </div>
    );
  }

  return (
    <div style={{ padding: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontWeight: 700, fontSize: 14 }}>AI Spotlight</span>
        <button className="hdr-btn" onClick={() => runAnalysis(false)} style={{ fontSize: 10, padding: '4px 10px' }}>↺ REFRESH</button>
      </div>
      {loading && insights.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--color-muted)', fontSize: 13 }}>AI is analyzing your play data…</div>
      )}
      {offInsights.length > 0 && (
        <><div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-accent)', marginBottom: 6, letterSpacing: '0.06em' }}>OFFENSE</div>
        {sorted(offInsights).map(ins => renderCard(ins, 'var(--color-green)'))}</>
      )}
      {defInsights.length > 0 && (
        <><div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-blue)', marginBottom: 6, marginTop: 14, letterSpacing: '0.06em' }}>DEFENSE</div>
        {sorted(defInsights).map(ins => renderCard(ins, 'var(--color-blue)'))}</>
      )}
      {!loading && insights.length > 0 && (
        <button className="btn btn-secondary" onClick={() => runAnalysis(true)} style={{ width: '100%', marginTop: 10, fontSize: 12 }}>
          {loading ? 'Finding more…' : 'GENERATE MORE'}
        </button>
      )}
      {/* Methodology modal (#16) */}
      {methodology && (
        <div className="overlay open" onClick={e => { if (e.target === e.currentTarget) setMethodology(null); }} style={{ position: 'fixed' }}>
          <div className="modal" style={{ maxWidth: 380 }}>
            <div className="modal-hdr">
              <div className="modal-title">METHODOLOGY</div>
              <div className="modal-x" onClick={() => setMethodology(null)}>✕</div>
            </div>
            <div className="modal-body" style={{ fontSize: 13, lineHeight: 1.6 }}>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{methodology.insight?.stat}</div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: 'var(--color-muted2)' }}>{methodology.insight?.headline}</div>
              {methLoading ? (
                <div style={{ color: 'var(--color-muted)', fontSize: 12 }}>Generating explanation…</div>
              ) : (
                <div style={{ whiteSpace: 'pre-wrap' }}>{methodology.explanation}</div>
              )}
            </div>
            <div className="modal-foot">
              <button className="btn btn-secondary" onClick={() => setMethodology(null)} style={{ flex: 1 }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════
// ASK AI TAB
// ═══════════════════════════════════════
function AskAITab({ plays, playbook, label, savedList, onSave }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);
  useEffect(() => { scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight); }, [messages]);

  async function handleSend() {
    if (!input.trim() || loading) return;
    const q = input.trim(); setInput('');
    setMessages(prev => [...prev, { role: 'user', text: q }]);
    setLoading(true);
    try {
      // Hybrid approach: pre-computed summary (accurate, all plays) + slim CSV (for drill-down)
      const summaryObj = buildSummaryObj(plays, label);
      const slimCsv = buildSlimCsv(plays, label);
      const systemPrompt = buildAskAISystemPrompt(playbook, label, summaryObj, slimCsv);
      const history = messages.map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text }));
      history.push({ role: 'user', content: q });

      const resp = await fetch(`${HUDL_API}/api/claude`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 500, system: systemPrompt, messages: history }),
      });
      const data = await resp.json();
      // Handle API errors — retry once on rate limit
      if (data.error) {
        const errMsg = typeof data.error === 'string' ? data.error : data.error.message || JSON.stringify(data.error);
        if (errMsg.includes('rate limit')) {
          setMessages(prev => [...prev, { role: 'assistant', text: 'Rate limited — retrying in 5 seconds…' }]);
          await new Promise(r => setTimeout(r, 5000));
          setMessages(prev => prev.filter(m => m.text !== 'Rate limited — retrying in 5 seconds…'));
          const resp2 = await fetch(`${HUDL_API}/api/claude`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 500, system: systemPrompt, messages: history }),
          });
          const data2 = await resp2.json();
          if (data2.error) {
            const errMsg2 = typeof data2.error === 'string' ? data2.error : data2.error.message || '';
            setMessages(prev => [...prev, { role: 'assistant', text: 'Still rate limited. Wait a moment and try again.' }]);
          } else {
            const reply = data2.content?.map(c => c.text || '').filter(Boolean).join('\n') || 'No response.';
            setMessages(prev => [...prev, { role: 'assistant', text: reply }]);
          }
        } else {
          setMessages(prev => [...prev, { role: 'assistant', text: 'API error: ' + errMsg }]);
        }
      } else {
        const reply = data.content?.map(c => c.text || '').filter(Boolean).join('\n') || 'No response received from AI.';
        setMessages(prev => [...prev, { role: 'assistant', text: reply }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Error: ' + err.message }]);
    }
    setLoading(false);
  }

  function pinMessage(msg) {
    onSave({ text: msg.text, question: messages[messages.indexOf(msg) - 1]?.text || '', ts: Date.now() });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: 14, WebkitOverflowScrolling: 'touch' }}>
        {messages.length === 0 && <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-muted)', fontSize: 12, lineHeight: 2 }}>Ask about your play data:<br/>"What's our 3rd down conversion rate?"<br/>"Which formation gains the most yards?"<br/>"How did we do in the red zone?"</div>}
        {messages.map((m, i) => (
          <div key={i} style={{ marginBottom: 10, display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              padding: '10px 14px', borderRadius: 12, maxWidth: '85%',
              ...(m.role === 'user' ? { background: 'var(--color-accent)', color: '#fff' } : { background: 'var(--color-surface)', border: '1px solid var(--color-border)' }),
              fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap',
            }}>{m.text}</div>
            {m.role === 'assistant' && (
              <button onClick={() => pinMessage(m)} style={{ background: 'none', border: 'none', fontSize: 14, cursor: 'pointer', padding: '2px 6px', opacity: 0.4, marginTop: 2 }} title="Save">📌</button>
            )}
          </div>
        ))}
        {loading && <div style={{ padding: '10px 14px', color: 'var(--color-muted)', fontSize: 12 }}>Thinking…</div>}
      </div>
      <div style={{ padding: '10px 14px 16px', borderTop: '1px solid var(--color-border)', display: 'flex', gap: 8, flexShrink: 0 }}>
        <input className="fi" placeholder="Ask about your plays…" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} style={{ flex: 1, fontSize: 13, padding: '10px 12px' }} />
        <button className="btn btn-primary" onClick={handleSend} disabled={loading || !input.trim()} style={{ padding: '10px 16px', fontSize: 13, flexShrink: 0 }}>Send</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// SAVED TAB
// ═══════════════════════════════════════
function SavedTab({ saved, onDelete }) {
  if (saved.length === 0) return <div className="empty-msg">No saved responses yet.<br/>Tap 📌 on any AI response to save it here.</div>;
  return (
    <div style={{ padding: 14 }}>
      {saved.map((s, i) => (
        <div key={s.ts || i} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '12px 14px', marginBottom: 10 }}>
          {s.question && <div style={{ fontSize: 11, color: 'var(--color-accent)', fontWeight: 600, marginBottom: 4 }}>{s.question}</div>}
          <div style={{ fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{s.text}</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
            <span style={{ fontSize: 10, color: 'var(--color-muted)' }}>{new Date(s.ts).toLocaleDateString()}</span>
            <button onClick={() => onDelete(i)} style={{ background: 'none', border: 'none', color: 'var(--color-red)', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════
// MAIN STATS PAGE
// ═══════════════════════════════════════
export default function StatsPage() {
  const navigate = useNavigate();
  const { coach } = useAuth();
  const showToast = useToast();

  const [pickerOpen, setPickerOpen] = useState(true);
  const [plays, setPlays] = useState([]);
  const [stats, setStats] = useState(null);
  const [playbook, setPlaybook] = useState(null);
  const [mainTab, setMainTab] = useState('SPOTLIGHT');
  const [subTab, setSubTab] = useState('OVERVIEW');
  const [loadingClips, setLoadingClips] = useState(false);
  const [label, setLabel] = useState('');
  const [saved, setSaved] = useState(() => {
    try { return JSON.parse(localStorage.getItem('hd_saved_ai') || '[]'); } catch { return []; }
  });

  // Load playbook
  useEffect(() => {
    if (coach?.team_id) {
      fetchPlaybook(coach.team_id).then(setPlaybook).catch(console.error);
    }
  }, [coach?.team_id]);

  function handleSaveAI(entry) {
    const next = [...saved, entry];
    setSaved(next);
    localStorage.setItem('hd_saved_ai', JSON.stringify(next));
    showToast('Saved!');
  }

  function handleDeleteSaved(idx) {
    const next = saved.filter((_, i) => i !== idx);
    setSaved(next);
    localStorage.setItem('hd_saved_ai', JSON.stringify(next));
  }

  async function handlePickerLoad(selectedItems) {
    setPickerOpen(false); setLoadingClips(true);
    setLabel(selectedItems.length === 1 ? selectedItems[0].title : `${selectedItems.length} cutups`);
    showToast(`Loading ${selectedItems.length} cutup${selectedItems.length > 1 ? 's' : ''}…`);
    try {
      let allPlays = [];
      for (const item of selectedItems) {
        const clips = await fetchHudlClips(item.id, coach, item.title);
        const mapped = hudlClipsToPlays(clips).map(p => ({ ...p, _gameTitle: item.title }));
        allPlays = allPlays.concat(mapped);
      }
      setPlays(allPlays); setStats(calcStats(allPlays));
      showToast(`Loaded ${allPlays.length} plays`);
    } catch (err) { showToast('Load failed: ' + err.message); }
    setLoadingClips(false);
  }

  return (
    <div className="view">
      <div className="hdr">
        <button className="hdr-btn" onClick={() => navigate('/')}>← Back</button>
        <div className="hdr-title">Stats</div>
        <button className="hdr-btn" onClick={() => setPickerOpen(true)} style={{ color: 'var(--color-accent)' }}>Filter</button>
      </div>

      {/* Main tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', flexShrink: 0 }}>
        {MAIN_TABS.map(t => (
          <div key={t} onClick={() => setMainTab(t)} style={{
            flex: 1, textAlign: 'center', padding: '10px 0', fontSize: 11, fontWeight: 700,
            letterSpacing: '0.06em', cursor: 'pointer',
            color: mainTab === t ? 'var(--color-accent)' : 'var(--color-muted)',
            borderBottom: mainTab === t ? '2px solid var(--color-accent)' : '2px solid transparent',
          }}>{t}</div>
        ))}
      </div>

      {/* Stats sub-tabs */}
      {mainTab === 'STATS' && (
        <div style={{ display: 'flex', overflowX: 'auto', WebkitOverflowScrolling: 'touch', borderBottom: '1px solid var(--color-border)', flexShrink: 0 }}>
          {STAT_SUBS.map(st => (
            <div key={st} onClick={() => setSubTab(st)} style={{ padding: '8px 14px', fontSize: 10, fontWeight: 600, whiteSpace: 'nowrap', letterSpacing: '0.06em', cursor: 'pointer', color: subTab === st ? 'var(--color-accent)' : 'var(--color-muted)', borderBottom: subTab === st ? '2px solid var(--color-accent)' : '2px solid transparent' }}>{st}</div>
          ))}
        </div>
      )}

      {/* Data label */}
      {label && !pickerOpen && (
        <div style={{ padding: '8px 16px', fontSize: 11, color: 'var(--color-muted)', borderBottom: '1px solid var(--color-border)' }}>
          {label} · {plays.filter(p => p && Object.keys(p).filter(k => !k.startsWith('_')).length > 0).length} plays
        </div>
      )}

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {loadingClips ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-muted)', fontSize: 13 }}>Loading play data…</div>
        ) : mainTab === 'SPOTLIGHT' ? (
          plays.length > 0 ? <SpotlightTab plays={plays} playbook={playbook} label={label} /> : <div className="empty-msg">Tap <strong>Filter</strong> to select cutups and load data.</div>
        ) : mainTab === 'ASK AI' ? (
          <AskAITab plays={plays} playbook={playbook} label={label} savedList={saved} onSave={handleSaveAI} />
        ) : mainTab === 'SAVED' ? (
          <SavedTab saved={saved} onDelete={handleDeleteSaved} />
        ) : !stats ? (
          <div className="empty-msg">Tap <strong>Filter</strong> to select cutups and load data.</div>
        ) : (
          <div style={{ padding: 14 }}>
            {subTab === 'OVERVIEW' && <OverviewTab s={stats} />}
            {subTab === 'OFFENSE' && <OffenseTab s={stats} />}
            {subTab === 'DEFENSE' && <DefenseTab s={stats} />}
            {subTab === 'FIELD' && <FieldTab s={stats} />}
            {subTab === 'BY QTR' && <ByQtrTab s={stats} />}
          </div>
        )}
      </div>

      {pickerOpen && <HudlCutupPicker onLoad={handlePickerLoad} onClose={() => setPickerOpen(false)} />}
    </div>
  );
}
