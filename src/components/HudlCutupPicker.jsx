import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { HUDL_API } from '../lib/constants';

const TYPE_FILTERS = ['ALL', 'Game', 'Scout', 'JV', 'Other'];
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

export default function HudlCutupPicker({ onLoad, onClose, initialSelected, initialFilters, singleSelect }) {
  const { coach } = useAuth();
  const [items, setItems] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState(initialFilters?.search || '');
  const [typeFilter, setTypeFilter] = useState(initialFilters?.typeFilter || new Set());
  const [yearFilter, setYearFilter] = useState(initialFilters?.yearFilter || new Set());
  const [homeAway, setHomeAway] = useState(initialFilters?.homeAway || null);
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { loadLibrary(); }, []);

  function toggleType(t) {
    if (t === 'ALL') { setTypeFilter(new Set()); return; }
    setTypeFilter(prev => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t); else next.add(t);
      return next;
    });
  }

  function toggleYear(y) {
    setYearFilter(prev => {
      const next = new Set(prev);
      if (next.has(y)) next.delete(y); else next.add(y);
      return next;
    });
  }

  useEffect(() => {
    let f = items;

    // Type filter (multi-select)
    if (typeFilter.size > 0) {
      const cats = new Set([...typeFilter].map(t => t.toLowerCase()));
      f = f.filter(i => cats.has(i._category));
    }

    // Year filter (multi-select)
    if (yearFilter.size > 0) {
      f = f.filter(i => {
        const title = i.title || '';
        for (const y of yearFilter) {
          const yShort = "'" + y.slice(2);
          if (title.includes(y) || title.includes(yShort)) return true;
        }
        return false;
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
      // If we have previously loaded IDs, use those; otherwise select none (first open)
      if (initialSelected && initialSelected.size > 0) {
        setSelected(new Set(initialSelected));
      } else {
        setSelected(new Set());
      }
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  function toggleItem(id) {
    if (singleSelect) {
      setSelected(prev => prev.has(id) ? new Set() : new Set([id]));
    } else {
      setSelected(prev => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    }
  }

  function selectAllVisible() {
    setSelected(prev => {
      const next = new Set(prev);
      filtered.forEach(i => next.add(i.id));
      return next;
    });
  }

  function selectNoneVisible() {
    setSelected(prev => {
      const next = new Set(prev);
      filtered.forEach(i => next.delete(i.id));
      return next;
    });
  }

  function handleLoad() {
    // Only load items that are both selected AND in current filtered view (matches HTML)
    const visibleSelected = filtered.filter(i => selected.has(i.id));
    if (visibleSelected.length === 0) return;
    // Pass filter state back so it can be restored on reopen
    onLoad(visibleSelected, {
      search,
      typeFilter: new Set(typeFilter),
      yearFilter: new Set(yearFilter),
      homeAway,
    });
  }

  // Count of selected items visible in current filter
  const visibleSelectedCount = filtered.filter(i => selected.has(i.id)).length;

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

        {/* Type filters (multi-select) */}
        <div style={{ padding: '8px 14px 0', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <div
            className={`sf-btn${typeFilter.size === 0 ? ' on' : ''}`}
            onClick={() => toggleType('ALL')}
          >ALL</div>
          {TYPE_FILTERS.filter(t => t !== 'ALL').map(t => (
            <div
              key={t}
              className={`sf-btn${typeFilter.has(t) ? ' on' : ''}`}
              onClick={() => toggleType(t)}
            >
              {t}
            </div>
          ))}
        </div>

        {/* Year + Home/Away filters (years are multi-select) */}
        <div style={{ padding: '6px 14px 8px', display: 'flex', gap: 6, flexWrap: 'wrap', borderBottom: '1px solid var(--color-border)' }}>
          {YEAR_FILTERS.map(y => (
            <div
              key={y}
              className={`sf-btn${yearFilter.has(y) ? ' on' : ''}`}
              onClick={() => toggleYear(y)}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {!singleSelect && (
              <>
                <div
                  onClick={selectAllVisible}
                  style={{
                    padding: '5px 10px', borderRadius: 6, border: '1px solid var(--color-border)',
                    background: 'var(--color-surface2)', cursor: 'pointer',
                    fontSize: 10, fontWeight: 700, color: 'var(--color-accent)',
                    letterSpacing: '0.03em',
                  }}
                >ALL</div>
                <div
                  onClick={selectNoneVisible}
                  style={{
                    padding: '5px 10px', borderRadius: 6, border: '1px solid var(--color-border)',
                    background: 'var(--color-surface2)', cursor: 'pointer',
                    fontSize: 10, fontWeight: 700, color: 'var(--color-muted)',
                    letterSpacing: '0.03em',
                  }}
                >NONE</div>
              </>
            )}
            <span style={{ fontSize: 13, color: 'var(--color-muted)' }}>
              {visibleSelectedCount} selected
            </span>
          </div>
          <button
            className="btn btn-primary"
            onClick={handleLoad}
            disabled={visibleSelectedCount === 0}
            style={{ padding: '10px 24px', fontSize: 14, fontWeight: 700 }}
          >
            LOAD →
          </button>
        </div>
      </div>
    </div>
  );
}

