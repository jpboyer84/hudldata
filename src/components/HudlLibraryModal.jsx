import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { HUDL_API } from '../lib/constants';

const TYPE_FILTERS = ['All', 'Cutup', 'Playlist'];

function getCutupCategory(title) {
  const t = (title || '').trim().toLowerCase();
  if (t.endsWith('(practice)')) return 'practice';
  if (t.endsWith('(game)'))     return 'game';
  if (t.endsWith('(scout)'))    return 'scout';
  if (t.endsWith('(jv)'))       return 'jv';
  if (t.endsWith('(other)'))    return 'other';
  return 'untagged';
}

export default function HudlLibraryModal({ open, onClose, onSelect }) {
  const { coach } = useAuth();
  const [items, setItems] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fetched = useRef(false);

  useEffect(() => {
    if (!open) { fetched.current = false; return; }
    if (fetched.current) return;
    fetched.current = true;
    loadLibrary();
  }, [open]);

  useEffect(() => {
    let f = items;
    if (typeFilter !== 'All') {
      const t = typeFilter === 'Cutup' ? 'CutupItem' : 'PlaylistItem';
      f = f.filter(i => i.type === t);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      f = f.filter(i => i.title?.toLowerCase().includes(q));
    }
    setFiltered(f);
  }, [items, search, typeFilter]);

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
      // Only show tagged cutups (exclude untagged and practice)
      const tagged = (data.items || []).filter(i => {
        const cat = getCutupCategory(i.title);
        return cat !== 'untagged' && cat !== 'practice';
      });
      setItems(tagged);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  if (!open) return null;

  return (
    <div className="overlay open" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxHeight: '85dvh', height: '85dvh' }}>
        <div className="modal-hdr">
          <div className="modal-title">HUDL LIBRARY</div>
          <div className="modal-x" onClick={onClose}>✕</div>
        </div>

        {/* Search + filter */}
        <div style={{ padding: '10px 14px 6px', borderBottom: '1px solid var(--color-border)' }}>
          <input
            className="fi"
            placeholder="Search cutups…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ marginBottom: 8, fontSize: 13, padding: '9px 12px' }}
          />
          <div style={{ display: 'flex', gap: 6, paddingBottom: 6 }}>
            {TYPE_FILTERS.map(t => (
              <div
                key={t}
                className={`sf-btn${typeFilter === t ? ' on' : ''}`}
                onClick={() => setTypeFilter(t)}
                style={{ flex: 1, textAlign: 'center', padding: '7px 0' }}
              >
                {t}
              </div>
            ))}
          </div>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-muted)', fontSize: 13 }}>
              Loading library…
            </div>
          ) : error ? (
            <div style={{ padding: 24, textAlign: 'center' }}>
              <div style={{ color: 'var(--color-red)', fontSize: 12, marginBottom: 12 }}>{error}</div>
              <button className="btn btn-secondary" onClick={loadLibrary} style={{ fontSize: 12 }}>Retry</button>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-muted)', fontSize: 13 }}>
              {items.length === 0 ? 'No cutups found' : 'No matches'}
            </div>
          ) : (
            filtered.map(item => (
              <div
                key={item.id}
                onClick={() => onSelect(item)}
                style={{
                  padding: '14px 16px', borderBottom: '1px solid var(--color-border)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12,
                }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                  background: item.type === 'CutupItem' ? 'rgba(232,89,12,0.12)' : 'rgba(59,130,246,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700,
                  color: item.type === 'CutupItem' ? 'var(--color-accent)' : 'var(--color-blue)',
                }}>
                  {item.type === 'CutupItem' ? 'C' : 'P'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 14, fontWeight: 600, color: 'var(--color-text)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 2 }}>
                    {item.clip_count != null ? `${item.clip_count} clips` : ''}
                    {item.created_at ? ` · ${new Date(item.created_at).toLocaleDateString()}` : ''}
                  </div>
                </div>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                  <path d="M6 4L10 8L6 12" stroke="#444" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
