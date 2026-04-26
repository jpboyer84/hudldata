import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { fetchTemplates } from '../lib/supaData';

const GAME_TYPES = ['Game', 'JV', 'Scout', 'Other'];

export default function NewGameModal({ open, onClose, onStart, onNavigate }) {
  const { coach } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [templateId, setTemplateId] = useState('');
  const [gameType, setGameType] = useState('Game');
  const [home, setHome] = useState('');
  const [away, setAway] = useState('');
  const [week, setWeek] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    if (open && coach?.team_id) {
      fetchTemplates(coach.team_id).then(t => {
        setTemplates(t);
        if (t.length > 0 && !templateId) setTemplateId(t[0].id);
      }).catch(console.error);
    }
  }, [open, coach?.team_id]);

  function handleStart() {
    if (!templateId) return;
    onStart({
      template_id: templateId,
      game_type: gameType,
      home: home.trim(),
      away: away.trim(),
      week: week.trim(),
      date: date.trim(),
    });
    // Reset
    setGameType('Game');
    setHome('');
    setAway('');
    setWeek('');
    setDate('');
  }

  if (!open) return null;

  return (
    <div className="overlay open" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-hdr">
          <div className="modal-title">NEW GAME</div>
          <div className="modal-x" onClick={onClose}>✕</div>
        </div>
        <div className="modal-body">
          {/* Quick nav row */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            {[
              { label: 'Archive', path: '/archive' },
              { label: 'Import', path: '/import' },
              { label: 'Load Hudl', path: 'hudl' },
            ].map(item => (
              <div
                key={item.path}
                onClick={() => { onClose(); if (onNavigate) onNavigate(item.path); }}
                style={{
                  flex: 1, textAlign: 'center', padding: '10px 8px', fontSize: 12,
                  fontWeight: 600, color: 'var(--color-muted)', cursor: 'pointer',
                  background: 'var(--color-surface2)', borderRadius: 8,
                  border: '1px solid var(--color-border)',
                }}
              >
                {item.label}
              </div>
            ))}
          </div>

          {/* Template */}
          <div className="fg">
            <label className="fl">Template</label>
            <select
              className="fi"
              value={templateId}
              onChange={e => setTemplateId(e.target.value)}
              style={{ cursor: 'pointer', WebkitAppearance: 'none' }}
            >
              {templates.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
              {templates.length === 0 && <option value="">No templates</option>}
            </select>
          </div>

          {/* Type */}
          <div className="fg">
            <label className="fl">Type</label>
            <div style={{ display: 'flex', gap: 6 }}>
              {GAME_TYPES.map(t => (
                <div
                  key={t}
                  className={`sf-btn${gameType === t ? ' on' : ''}`}
                  onClick={() => setGameType(t)}
                  style={{ flex: 1, textAlign: 'center', padding: 10 }}
                >
                  {t}
                </div>
              ))}
            </div>
          </div>

          {/* Teams */}
          <div className="fg">
            <label className="fl">
              Home Team <span style={{ color: 'var(--color-muted)', fontSize: 9 }}>(optional — edit anytime)</span>
            </label>
            <input className="fi" placeholder="Home team" value={home} onChange={e => setHome(e.target.value)} />
          </div>
          <div className="fg">
            <label className="fl">
              Away Team <span style={{ color: 'var(--color-muted)', fontSize: 9 }}>(optional — edit anytime)</span>
            </label>
            <input className="fi" placeholder="Away team" value={away} onChange={e => setAway(e.target.value)} />
          </div>

          {/* Week + Date */}
          <div style={{ display: 'flex', gap: 10 }}>
            <div className="fg" style={{ flex: '0 0 110px' }}>
              <label className="fl">
                Week <span style={{ color: 'var(--color-muted)', fontSize: 9 }}>(optional)</span>
              </label>
              <input className="fi" placeholder="e.g. 5" type="number" min="1" max="20" value={week} onChange={e => setWeek(e.target.value)} />
            </div>
            <div className="fg" style={{ flex: 1 }}>
              <label className="fl">
                Date <span style={{ color: 'var(--color-muted)', fontSize: 9 }}>(optional)</span>
              </label>
              <input className="fi" placeholder="e.g. 10/4/2025" value={date} onChange={e => setDate(e.target.value)} />
            </div>
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn btn-secondary" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
          <button className="btn btn-primary" onClick={handleStart} style={{ flex: 1 }}>START GAME</button>
        </div>
      </div>
    </div>
  );
}
