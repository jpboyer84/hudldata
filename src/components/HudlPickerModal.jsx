import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { HUDL_API } from '../lib/constants';

const TYPE_FILTERS = ['ALL', 'Game', 'SCOUT', 'JV', 'OTHER', 'TRACKED'];

function parseTitle(title) {
  // Extract year, home/away from titles like "'25 Wk 10: HCHS @ Lowell (Game)"
  const yearMatch = title.match(/^'(\d{2})/);
  const year = yearMatch ? `20${yearMatch[1]}` : null;
  const isAway = title.includes(' @ ') || title.includes(' at ');
  const isHome = title.includes(' vs ');
  // Extract type from parenthetical
  const typeMatch = title.match(/\((Game|Scout|JV|Other)\)/i);
  const type = typeMatch ? typeMatch[1] : null;
  return { year, isAway, isHome, type };
}

export default function HudlPickerModal({ open, onClose, onLoad, trackedGames }) {
  const { coach } = useAuth();
  const [items, setItems] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [yearFilter, setYearFilter] = useState(null);
  const [locFilter, setLocFilter] = useState(null); // HOME | AWAY | null
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fetched = useRef(false);

  // Get available years from items
  const years = [...new Set(items.map(i => parseTitle(i.title).year).filter(Boolean))].sort().reverse();

  useEffect(() => {
    if (!open) { fetched.current = false; setSelected(new Set()); return; }
    if (fetched.current) return;
    fetched.current = true;
    loadLibrary();
  }, [open]);

  useEffect(() => {
    let f = items;

    // Type filter
    if (typeFilter === 'TRACKED') {
      const trackedIds = new Set((trackedGames || []).map(g => g.hudl_cutup_id).filter(Boolean));
      f = f.filter(i => trackedIds.has(i.internalId) || trackedIds.has(i.id));
    } else if (typeFilter !== 'ALL') {
      f = f.filter(i => {
        const parsed = parseTitle(i.title);
        if (parsed.type) return parsed.type.toLowerCase() === typeFilter.toLowerCase();
        // Fallback: check title
        return i.title.toLowerCase().includes(typeFilter.toLowerCase());
      });
    }

    // Year filter
    if (yearFilter) {
      f = f.filter(i => parseTitle(i.title).year === yearFilter);
    }

    // Location filter
    if (locFilter === 'HOME') {
      f = f.filter(i => parseTitle(i.title).isHome);
    } else if (locFilter === 'AWAY') {
      f = f.filter(i => parseTitle(i.title).isAway);
    }

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      f = f.filter(i => i.title?.toLowerCase().includes(q));
    }

    setFiltered(f);
  }, [items, search, typeFilter, yearFilter, locFilter, trackedGames]);

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
      setItems(data.items || []);
      // Auto-select all
      setSelected(new Set((data.items || []).map(i => i.id)));
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
      const visibleIds = new Set(filtered.map(i => i.id));
      setSelected(prev => {
        const next = new Set(prev);
        visibleIds.forEach(id => next.delete(id));
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

  if (!open) return null;

  return (
    <div className="overlay open" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
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
        <div style={{ padding: '8px 14px 0', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
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

        {/* Year + location filters */}
        <div style={{ padding: '6px 14px 8px', display: 'flex', flexWrap: 'wrap', gap: 6, borderBottom: '1px solid var(--color-border)' }}>
          {years.map(y => (
            <div
              key={y}
              className={`sf-btn${yearFilter === y ? ' on' : ''}`}
              onClick={() => setYearFilter(yearFilter === y ? null : y)}
            >
              {y}
            </div>
          ))}
          <div
            className={`sf-btn${locFilter === 'HOME' ? ' on' : ''}`}
            onClick={() => setLocFilter(locFilter === 'HOME' ? null : 'HOME')}
          >
            HOME
          </div>
          <div
            className={`sf-btn${locFilter === 'AWAY' ? ' on' : ''}`}
            onClick={() => setLocFilter(locFilter === 'AWAY' ? null : 'AWAY')}
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
              const isSel = selected.has(item.id);
              return (
                <div
                  key={item.id}
                  onClick={() => toggleItem(item.id)}
                  style={{
                    padding: '13px 16px', borderBottom: '1px solid var(--color-border)',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12,
                  }}
                >
                  <div style={{
                    width: 24, height: 24, borderRadius: 6, flexShrink: 0,
                    border: `2px solid ${isSel ? 'var(--color-accent)' : 'var(--color-border)'}`,
                    background: isSel ? 'var(--color-accent)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, color: '#fff', fontWeight: 700,
                  }}>
                    {isSel && '✓'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 14, fontWeight: 500, color: 'var(--color-text)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {item.title}
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--color-muted)', flexShrink: 0 }}>
                    {item.clip_count ?? ''}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom bar */}
        <div style={{
          padding: '12px 16px', borderTop: '1px solid var(--color-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              onClick={toggleAll}
              style={{
                width: 28, height: 28, borderRadius: '50%', border: '1px solid var(--color-border)',
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
