import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { HUDL_API } from '../lib/constants';

const TYPE_FILTERS = ['ALL', 'Game', 'Scout', 'JV', 'Other', 'Tracked'];
const YEAR_FILTERS = ['2024', '2025', '2026'];

// Matches HTML parseSeason / parseWeekSort exactly
function parseWeekSort(title) {
  const m = (title || '').match(/[Ww][Kk]\s*0*(\d+)/);
  return m ? parseInt(m[1], 10) : -1;
}
function parseSeason(title) {
  const m = (title || '').match(/'(\d{2})/);
  return m ? parseInt(m[1], 10) : 0;
}

// Matches HTML getCutupCategory exactly — only tagged cutups are shown
function getCutupCategory(title) {
  const t = (title || '').trim().toLowerCase();
  if (t.endsWith('(practice)')) return 'practice';
  if (t.endsWith('(game)'))     return 'game';
  if (t.endsWith('(scout)'))    return 'scout';
  if (t.endsWith('(jv)'))       return 'jv';
  if (t.endsWith('(other)'))    return 'other';
  return 'untagged';
}

export default function HudlCutupPicker({ onLoad, onClose }) {
  const { coach } = useAuth();
  const [items, setItems] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [yearFilter, setYearFilter] = useState(null);
  const [homeAway, setHomeAway] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { loadLibrary(); }, []);

  useEffect(() => {
    let f = items;

    // Type filter
    if (typeFilter === 'Tracked') {
      // Tracked filter: requires local game storage integration (future feature)
      f = [];
    } else if (typeFilter !== 'ALL') {
      const cat = typeFilter.toLowerCase();
      f = f.filter(i => i._category === cat);
    }

    // Year filter
    if (yearFilter) {
      const yShort = "'" + yearFilter.slice(2);
      f = f.filter(i => {
        const title = i.title || '';
        return title.includes(yearFilter) || title.includes(yShort);
      });
    }

    // Home/Away filter
    if (homeAway === 'HOME') {
      f = f.filter(i => {
        const t = (i.title || '').toLowerCase();
        return t.includes(' vs ') && !t.includes('@');
      });
    } else if (homeAway === 'AWAY') {
      f = f.filter(i => (i.title || '').toLowerCase().includes('@'));
    }

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      f = f.filter(i => (i.title || '').toLowerCase().includes(q));
    }

    // Sort: season descending, then week descending, then alphabetical (matches HTML exactly)
    f.sort((a, b) => {
      const sA = parseSeason(a.title), sB = parseSeason(b.title);
      if (sA !== sB) return sB - sA;
      const wA = parseWeekSort(a.title), wB = parseWeekSort(b.title);
      if (wA === -1 && wB === -1) return (a.title || '').localeCompare(b.title || '');
      if (wA === -1) return 1;
      if (wB === -1) return -1;
      if (wA !== wB) return wB - wA;
      return (a.title || '').localeCompare(b.title || '');
    });

    setFiltered(f);
  }, [items, search, typeFilter, yearFilter, homeAway]);

  async function loadLibrary() {
    setLoading(true);
    setError('');
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (coach?.hudl_cookie) headers['X-Hudl-Cookie'] = coach.hudl_cookie;
      if (coach?.hudl_team_id) headers['X-Hudl-Team'] = coach.hudl_team_id;

      const resp = await fetch(`${HUDL_API}/api/library?count=500`, { headers });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Failed to load library');
      // Only keep tagged cutups — exclude untagged and practice (matches HTML exactly)
      const tagged = (data.items || []).filter(i => {
        const cat = getCutupCategory(i.title);
        return cat !== 'untagged' && cat !== 'practice';
      }).map(i => ({ ...i, _category: getCutupCategory(i.title) }));
      setItems(tagged);
      // Auto-select all tagged items
      setSelected(new Set(tagged.map(i => i.id)));
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  function toggleItem(id) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === filtered.length) {
      // Deselect all visible
      setSelected(prev => {
        const next = new Set(prev);
        filtered.forEach(i => next.delete(i.id));
        return next;
      });
    } else {
      // Select all visible
      setSelected(prev => {
        const next = new Set(prev);
        filtered.forEach(i => next.add(i.id));
        return next;
      });
    }
  }

  function handleLoad() {
    const selectedItems = items.filter(i => selected.has(i.id));
    if (selectedItems.length === 0) return;
    onLoad(selectedItems);
  }

  return (
    <div className="overlay open" onClick={e => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div className="modal" style={{ maxHeight: '90dvh', height: '90dvh' }}>
        <div className="modal-hdr">
          <div className="modal-title">SELECT DATA</div>
          <div className="modal-x" onClick={onClose}>✕</div>
        </div>

        {/* Search */}
        <div style={{ padding: '10px 14px 0' }}>
          <input
            className="fi"
            placeholder="Search cutups & games..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ fontSize: 13, padding: '10px 12px' }}
          />
        </div>

        {/* Type filters */}
        <div style={{ padding: '8px 14px 0', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {TYPE_FILTERS.map(t => (
            <div
              key={t}
              className={`sf-btn${typeFilter === t ? ' on' : ''}`}
              onClick={() => setTypeFilter(typeFilter === t ? 'ALL' : t)}
            >
              {t}
            </div>
          ))}
        </div>

        {/* Year + Home/Away filters */}
        <div style={{ padding: '6px 14px 8px', display: 'flex', gap: 6, flexWrap: 'wrap', borderBottom: '1px solid var(--color-border)' }}>
          {YEAR_FILTERS.map(y => (
            <div
              key={y}
              className={`sf-btn${yearFilter === y ? ' on' : ''}`}
              onClick={() => setYearFilter(yearFilter === y ? null : y)}
            >
              {y}
            </div>
          ))}
          <div
            className={`sf-btn${homeAway === 'HOME' ? ' on' : ''}`}
            onClick={() => setHomeAway(homeAway === 'HOME' ? null : 'HOME')}
          >
            HOME
          </div>
          <div
            className={`sf-btn${homeAway === 'AWAY' ? ' on' : ''}`}
            onClick={() => setHomeAway(homeAway === 'AWAY' ? null : 'AWAY')}
          >
            AWAY
          </div>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-muted)', fontSize: 13 }}>
              Loading Hudl library…
            </div>
          ) : error ? (
            <div style={{ padding: 24, textAlign: 'center' }}>
              <div style={{ color: 'var(--color-red)', fontSize: 12, marginBottom: 12 }}>{error}</div>
              <button className="btn btn-secondary" onClick={loadLibrary} style={{ fontSize: 12 }}>Retry</button>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-muted)', fontSize: 13 }}>
              No matches
            </div>
          ) : (
            filtered.map(item => {
              const sel = selected.has(item.id);
              return (
                <div
                  key={item.id}
                  onClick={() => toggleItem(item.id)}
                  style={{
                    padding: '13px 16px', borderBottom: '1px solid var(--color-border)',
                    display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
                  }}
                >
                  <div style={{
                    width: 24, height: 24, borderRadius: 6, flexShrink: 0,
                    border: `2px solid ${sel ? 'var(--color-accent)' : 'var(--color-border)'}`,
                    background: sel ? 'var(--color-accent)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, color: '#fff', fontWeight: 700,
                  }}>
                    {sel && '✓'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 14, fontWeight: 500, color: 'var(--color-text)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {item.title}
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--color-muted)', flexShrink: 0, fontWeight: 500 }}>
                    {item.clip_count ?? ''}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 16px', borderTop: '1px solid var(--color-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              onClick={toggleAll}
              style={{
                width: 28, height: 28, borderRadius: 14, border: '1.5px solid var(--color-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', fontSize: 12, color: 'var(--color-muted)',
              }}
            >
              ↺
            </div>
            <span style={{ fontSize: 13, color: 'var(--color-muted)' }}>
              {selected.size} selected
            </span>
          </div>
          <button
            className="btn btn-primary"
            onClick={handleLoad}
            disabled={selected.size === 0}
            style={{ padding: '10px 24px', fontSize: 14, fontWeight: 700 }}
          >
            LOAD →
          </button>
        </div>
      </div>
    </div>
  );
}
