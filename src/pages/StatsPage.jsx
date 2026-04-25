import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { fetchGames } from '../lib/supaData';
import { calcStats } from '../utils/statsCalc';
import { HUDL_API } from '../lib/constants';

const TABS = ['STATS', 'ASK AI'];
const SUB_TABS = ['OVERVIEW', 'OFFENSE', 'DEFENSE', 'FIELD', 'BY QTR'];

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
  return (
    <div style={{ flex: 1, textAlign: 'center' }}>
      <div style={{ fontSize: 24, fontWeight: 700, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 10, color: 'var(--color-muted)', marginTop: 4, letterSpacing: '0.05em' }}>{label}</div>
    </div>
  );
}

function StatCard({ title, subtitle, children }) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{
      background: 'var(--color-surface)', border: '1px solid var(--color-border)',
      borderRadius: 12, marginBottom: 10, overflow: 'hidden',
    }}>
      <div
        onClick={() => setOpen(!open)}
        style={{
          padding: '12px 14px', display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', cursor: 'pointer',
        }}
      >
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.06em' }}>{title}</div>
          {subtitle && <div style={{ fontSize: 10, color: 'var(--color-muted)', marginTop: 2 }}>{subtitle}</div>}
        </div>
        <div style={{ fontSize: 14, color: 'var(--color-muted)', transform: open ? 'rotate(180deg)' : 'none', transition: '0.2s' }}>▾</div>
      </div>
      {open && <div style={{ padding: '0 14px 14px' }}>{children}</div>}
    </div>
  );
}

// ─── OVERVIEW TAB ──────────────────────────────────────────
function OverviewTab({ s }) {
  const o = s.overview;
  return (
    <>
      <StatCard title="PLAY COUNT" subtitle={`${o.totalPlays} total plays`}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <StatBig value={o.offense} label="OFFENSE" />
          <StatBig value={o.defense} label="DEFENSE" />
          <StatBig value={o.special} label="SPECIAL" />
        </div>
      </StatCard>
      {o.offense > 0 && (
        <>
          <StatCard title="OFFENSIVE EFFICIENCY" subtitle={`${o.offense} offense plays`}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <StatBig value={o.avgYdsPlay} label="AVG YDS/PLAY" />
              <StatBig value={o.avgYdsRun} label="AVG YDS/RUN" />
              <StatBig value={o.avgYdsPass} label="AVG YDS/PASS" />
            </div>
            <BarRow label="3+ YARDS" value={o.gain3} total={o.offense} color="#22c55e" />
            <BarRow label="5+ YARDS" value={o.gain5} total={o.offense} color="#3b82f6" />
            <BarRow label="10+ YARDS" value={o.gain10} total={o.offense} color="var(--color-accent)" />
            <BarRow label="NEGATIVE" value={o.negPlays} total={o.offense} color="#ef4444" />
          </StatCard>
          <StatCard title="RUN / PASS SPLIT" subtitle={`${o.offense} offense plays`}>
            <BarRow label="RUN" value={o.runs} total={o.offense} color="var(--color-accent)" />
            <BarRow label="PASS" value={o.passes} total={o.offense} color="#3b82f6" />
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <StatBig value={o.avgYdsRun} label="RUN AVG YDS" />
              <StatBig value={o.avgYdsPass} label="PASS AVG YDS" />
            </div>
          </StatCard>
        </>
      )}
    </>
  );
}

// ─── OFFENSE TAB ───────────────────────────────────────────
function OffenseTab({ s }) {
  const { offense, overview } = s;
  return (
    <>
      {offense.thirdDown > 0 && (
        <StatCard title="3RD DOWN CONVERSIONS" subtitle={`${offense.thirdDown} attempts`}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <StatBig value={offense.thirdConv} label="CONVERTED" />
            <StatBig value={`${offense.thirdPct}%`} label="CONV RATE" />
          </div>
          <BarRow label="CONVERTED" value={offense.thirdConv} total={offense.thirdDown} color="#22c55e" />
        </StatCard>
      )}
      {offense.dnBreakdown.length > 0 && (
        <StatCard title="DOWN BREAKDOWN" subtitle="Plays per down">
          {offense.dnBreakdown.map(d => (
            <div key={d.down} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                {['1ST', '2ND', '3RD', '4TH'][parseInt(d.down) - 1]} DOWN — {d.total} plays · Avg {d.avgYds} yds
              </div>
              <BarRow label="RUN" value={d.runs} total={d.total} color="var(--color-accent)" />
              <BarRow label="PASS" value={d.passes} total={d.total} color="#3b82f6" />
            </div>
          ))}
        </StatCard>
      )}
      {offense.formations.length > 0 && (
        <StatCard title="FORMATIONS" subtitle={`${offense.formations.length} formations used`}>
          {offense.formations.slice(0, 8).map(f => (
            <div key={f.name} style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 600, marginBottom: 2 }}>
                <span>{f.name}</span>
                <span style={{ color: 'var(--color-muted)' }}>{f.count} plays · Avg {f.avgYds} yds</span>
              </div>
              <BarRow label="" value={f.count} total={overview.offense} color="var(--color-accent)" />
            </div>
          ))}
        </StatCard>
      )}
    </>
  );
}

// ─── DEFENSE TAB ───────────────────────────────────────────
function DefenseTab({ s }) {
  const d = s.defense;
  if (d.totalPlays === 0) return <div className="empty-msg">No defensive plays found.</div>;
  return (
    <>
      <StatCard title="DEFENSE OVERVIEW" subtitle={`${d.totalPlays} defensive plays`}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <StatBig value={d.avgYdsAllowed} label="AVG YDS ALLOWED" />
          <StatBig value={d.totalYdsAllowed} label="TOTAL YDS" />
        </div>
      </StatCard>
      <StatCard title="OPPONENT TENDENCIES">
        <BarRow label="OPP RUN" value={d.oppRuns} total={d.totalPlays} color="var(--color-accent)" />
        <BarRow label="OPP PASS" value={d.oppPasses} total={d.totalPlays} color="#3b82f6" />
      </StatCard>
      <StatCard title="IMPACT PLAYS">
        <div style={{ display: 'flex', gap: 8 }}>
          <StatBig value={d.sacks} label="SACKS" />
          <StatBig value={d.interceptions} label="INTs" />
          <StatBig value={`${d.stopRate}%`} label="STOP RATE" />
        </div>
      </StatCard>
    </>
  );
}

// ─── FIELD TAB ─────────────────────────────────────────────
function FieldTab({ s }) {
  const f = s.field;
  return (
    <>
      <StatCard title="HASH MARK TENDENCIES">
        {f.hashBreakdown.map(h => (
          <div key={h.hash} style={{ marginBottom: 6 }}>
            <BarRow
              label={h.hash === 'L' ? 'LEFT' : h.hash === 'M' ? 'MIDDLE' : 'RIGHT'}
              value={h.count}
              total={s.overview.offense}
              color={h.hash === 'L' ? '#ef4444' : h.hash === 'M' ? '#f59e0b' : '#22c55e'}
            />
            <div style={{ fontSize: 10, color: 'var(--color-muted)', marginTop: -4, marginBottom: 4 }}>
              Avg {h.avgYds} yds/play
            </div>
          </div>
        ))}
      </StatCard>
      <StatCard title="RED ZONE" subtitle="Plays inside the 20">
        <div style={{ display: 'flex', gap: 8 }}>
          <StatBig value={f.redZonePlays} label="RZ PLAYS" />
          <StatBig value={f.redZoneTD} label="RZ TDs" />
          <StatBig value={`${f.redZonePct}%`} label="RZ TD RATE" />
        </div>
      </StatCard>
    </>
  );
}

// ─── BY QTR TAB ────────────────────────────────────────────
function ByQtrTab({ s }) {
  if (s.quarters.length === 0) return <div className="empty-msg">No quarter data found.</div>;
  return (
    <>
      {s.quarters.map(q => (
        <StatCard key={q.quarter} title={`Q${q.quarter}`} subtitle={`${q.totalPlays} plays`}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <StatBig value={q.offPlays} label="OFF" />
            <StatBig value={q.defPlays} label="DEF" />
            <StatBig value={q.avgYds} label="AVG YDS" />
            <StatBig value={q.totalYards} label="TOTAL YDS" />
          </div>
          {q.offPlays > 0 && (
            <>
              <BarRow label="RUN" value={q.runs} total={q.offPlays} color="var(--color-accent)" />
              <BarRow label="PASS" value={q.passes} total={q.offPlays} color="#3b82f6" />
            </>
          )}
        </StatCard>
      ))}
    </>
  );
}

// ─── ASK AI TAB ────────────────────────────────────────────
function AskAITab({ plays }) {
  const { coach } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages]);

  async function handleSend() {
    if (!input.trim() || loading) return;
    const q = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: q }]);
    setLoading(true);

    try {
      // Build play summary for context
      const filled = plays.filter(p => p && Object.keys(p).filter(k => !k.startsWith('_')).length > 0);
      const playJson = JSON.stringify(filled.slice(0, 200)); // Limit for token safety

      const resp = await fetch(`${HUDL_API}/api/claude`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: `You are an expert football analytics assistant. The coach has ${filled.length} plays of data. Answer questions about tendencies, efficiency, and strategy. Be concise — use numbers and percentages. Here is the play data (JSON array, keys: odk, qtr, dn, dist, yardLn, hash, playType, result, gainLoss, offForm):\n${playJson}`,
          messages: [
            ...messages.map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text })),
            { role: 'user', content: q },
          ],
        }),
      });

      const data = await resp.json();
      const answer = data.content?.map(c => c.text || '').join('\n') || 'No response';
      setMessages(prev => [...prev, { role: 'assistant', text: answer }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Error: ' + err.message }]);
    }
    setLoading(false);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: 14, WebkitOverflowScrolling: 'touch' }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-muted)', fontSize: 12, lineHeight: 2 }}>
            Ask about your play data:<br />
            "What's our 3rd down conversion rate?"<br />
            "Which formation gains the most yards?"<br />
            "How did we do in the red zone?"
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} style={{
            marginBottom: 10, padding: '10px 14px', borderRadius: 12, maxWidth: '85%',
            ...(m.role === 'user'
              ? { background: 'var(--color-accent)', color: '#fff', marginLeft: 'auto' }
              : { background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }),
            fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap',
          }}>
            {m.text}
          </div>
        ))}
        {loading && (
          <div style={{ padding: '10px 14px', color: 'var(--color-muted)', fontSize: 12 }}>
            Thinking…
          </div>
        )}
      </div>
      <div style={{
        padding: '10px 14px 16px', borderTop: '1px solid var(--color-border)',
        display: 'flex', gap: 8, flexShrink: 0,
      }}>
        <input
          className="fi"
          placeholder="Ask about your plays…"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          style={{ flex: 1, fontSize: 13, padding: '10px 12px' }}
        />
        <button
          className="btn btn-primary"
          onClick={handleSend}
          disabled={loading || !input.trim()}
          style={{ padding: '10px 16px', fontSize: 13, flexShrink: 0 }}
        >
          Send
        </button>
      </div>
    </div>
  );
}

// ─── MAIN STATS PAGE ───────────────────────────────────────
export default function StatsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { coach } = useAuth();
  const showToast = useToast();

  const [games, setGames] = useState([]);
  const [selectedGameId, setSelectedGameId] = useState(null);
  const [plays, setPlays] = useState([]);
  const [stats, setStats] = useState(null);
  const [tab, setTab] = useState('STATS');
  const [subTab, setSubTab] = useState('OVERVIEW');

  // Load games
  useEffect(() => {
    if (coach?.team_id) {
      fetchGames(coach.team_id).then(g => {
        setGames(g);
        // Auto-select from URL param or most recent
        const fromUrl = searchParams.get('game');
        if (fromUrl && g.find(gm => gm.id === fromUrl)) {
          selectGame(fromUrl, g);
        } else if (g.length > 0) {
          selectGame(g[0].id, g);
        }
      }).catch(console.error);
    }
  }, [coach?.team_id]);

  function selectGame(id, gamesArr) {
    const list = gamesArr || games;
    const g = list.find(gm => gm.id === id);
    if (!g) return;
    setSelectedGameId(id);
    const p = Array.isArray(g.plays) ? g.plays : [];
    setPlays(p);
    setStats(calcStats(p));
  }

  function gameLabel(g) {
    if (g.home && g.away) return `${g.home} vs ${g.away}`;
    return g.home || g.away || g.hudl_source || 'Game';
  }

  return (
    <div className="view">
      <div className="hdr">
        <button className="hdr-btn" onClick={() => navigate(-1)}>← Back</button>
        <div className="hdr-title">Stats</div>
        <div style={{ width: 60 }} />
      </div>

      {/* Game picker */}
      <div style={{
        padding: '8px 14px', borderBottom: '1px solid var(--color-border)',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <select
          className="fi"
          value={selectedGameId || ''}
          onChange={e => selectGame(e.target.value)}
          style={{ flex: 1, fontSize: 12, padding: '8px 10px', cursor: 'pointer' }}
        >
          {games.length === 0 && <option value="">No games</option>}
          {games.map(g => (
            <option key={g.id} value={g.id}>{gameLabel(g)}</option>
          ))}
        </select>
      </div>

      {/* Main tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', flexShrink: 0 }}>
        {TABS.map(t => (
          <div
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1, textAlign: 'center', padding: '10px 0', fontSize: 11, fontWeight: 700,
              letterSpacing: '0.08em', cursor: 'pointer',
              color: tab === t ? 'var(--color-accent)' : 'var(--color-muted)',
              borderBottom: tab === t ? '2px solid var(--color-accent)' : '2px solid transparent',
            }}
          >
            {t}
          </div>
        ))}
      </div>

      {/* Stats sub-tabs */}
      {tab === 'STATS' && (
        <div style={{
          display: 'flex', overflowX: 'auto', WebkitOverflowScrolling: 'touch',
          borderBottom: '1px solid var(--color-border)', flexShrink: 0,
        }}>
          {SUB_TABS.map(st => (
            <div
              key={st}
              onClick={() => setSubTab(st)}
              style={{
                padding: '8px 14px', fontSize: 10, fontWeight: 600, whiteSpace: 'nowrap',
                letterSpacing: '0.06em', cursor: 'pointer',
                color: subTab === st ? 'var(--color-accent)' : 'var(--color-muted)',
                borderBottom: subTab === st ? '2px solid var(--color-accent)' : '2px solid transparent',
              }}
            >
              {st}
            </div>
          ))}
        </div>
      )}

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {tab === 'ASK AI' ? (
          <AskAITab plays={plays} />
        ) : !stats ? (
          <div className="empty-msg">
            {games.length === 0 ? 'No games yet. Tag a game first.' : 'Select a game to view stats.'}
          </div>
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
    </div>
  );
}
