import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { fetchTemplates } from '../lib/supaData';

const GAME_TYPES = ['Game', 'JV', 'Scout', 'Other'];

export default function NewGameModal({ open, onClose, onStart, onNavigate, hudlSource }) {
  const { coach } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [templateId, setTemplateId] = useState('');
  const [gameType, setGameType] = useState('Game');
  const [team, setTeam] = useState('');
  const [opponent, setOpponent] = useState('');
  const [isHome, setIsHome] = useState(true);
  const [week, setWeek] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    if (open && coach?.team_id) {
      fetchTemplates(coach.team_id).then(t => {
        setTemplates(t);
        if (t.length > 0 && !templateId) setTemplateId(t[0].id);
      }).catch(console.error);
      // Default team name from profile
      if (!team && coach?.teams?.name) setTeam(coach.teams.name);
      // Try to parse Hudl source title for week/opponent
      if (hudlSource) {
        const wkMatch = hudlSource.match(/[Ww][Kk]\s*0*(\d+)/);
        if (wkMatch) setWeek(wkMatch[1]);
        // Try to extract opponent from "HCHS vs Opponent" or "HCHS @ Opponent"
        const vsMatch = hudlSource.match(/vs\.?\s+(.+?)(?:\s+['(]|$)/i);
        const atMatch = hudlSource.match(/@\s+(.+?)(?:\s+['(]|$)/i);
        if (vsMatch) { setOpponent(vsMatch[1].trim()); setIsHome(true); }
        else if (atMatch) { setOpponent(atMatch[1].trim()); setIsHome(false); }
        // Type from parenthetical
        const typeMatch = hudlSource.match(/\((Game|Scout|JV|Other)\)/i);
        if (typeMatch) setGameType(typeMatch[1].charAt(0).toUpperCase() + typeMatch[1].slice(1).toLowerCase());
      }
    }
  }, [open, coach?.team_id, hudlSource]);

  function buildTitle() {
    const parts = [];
    if (week) parts.push(`Wk ${week}:`);
    if (team) parts.push(team);
    if (opponent) parts.push(`${isHome ? 'vs' : '@'} ${opponent}`);
    if (gameType) parts.push(`(${gameType})`);
    return parts.join(' ') || 'New Game';
  }

  function handleStart() {
    if (!templateId) return;
    const title = buildTitle();
    onStart({
      template_id: templateId,
      game_type: gameType,
      home: isHome ? team : opponent,
      away: isHome ? opponent : team,
      week: week || null,
      date: date || null,
      hudl_source: hudlSource || title,
      _title: title,
    });
  }

  if (!open) return null;

  return (
    <div className="overlay open" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxHeight: '88dvh' }}>
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
            <label className="fl">TEMPLATE</label>
            <select className="fi" value={templateId} onChange={e => setTemplateId(e.target.value)}>
              {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          {/* Type */}
          <div className="fg">
            <label className="fl">TYPE</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {GAME_TYPES.map(t => (
                <div
                  key={t}
                  className={`sf-btn${gameType === t ? ' on' : ''}`}
                  onClick={() => setGameType(t)}
                  style={{ flex: 1, textAlign: 'center', padding: '10px 0' }}
                >
                  {t}
                </div>
              ))}
            </div>
          </div>

          {/* Team */}
          <div className="fg">
            <label className="fl">TEAM</label>
            <input className="fi" placeholder="Your team" value={team} onChange={e => setTeam(e.target.value)} />
          </div>

          {/* Opponent */}
          <div className="fg">
            <label className="fl">OPPONENT</label>
            <input className="fi" placeholder="Opponent" value={opponent} onChange={e => setOpponent(e.target.value)} />
          </div>

          {/* Home / Away toggle */}
          <div className="fg">
            <div style={{ display: 'flex', gap: 8 }}>
              <div
                className={`sf-btn${isHome ? ' on' : ''}`}
                onClick={() => setIsHome(true)}
                style={{ flex: 1, textAlign: 'center', padding: '10px 0' }}
              >
                HOME
              </div>
              <div
                className={`sf-btn${!isHome ? ' on' : ''}`}
                onClick={() => setIsHome(false)}
                style={{ flex: 1, textAlign: 'center', padding: '10px 0' }}
              >
                AWAY
              </div>
            </div>
          </div>

          {/* Week & Date */}
          <div style={{ display: 'flex', gap: 10 }}>
            <div className="fg" style={{ flex: 1 }}>
              <label className="fl">WEEK <span style={{ fontWeight: 400 }}>(OPTIONAL)</span></label>
              <input className="fi" placeholder="e.g. 5" value={week} onChange={e => setWeek(e.target.value)} />
            </div>
            <div className="fg" style={{ flex: 1.5 }}>
              <label className="fl">DATE <span style={{ fontWeight: 400 }}>(OPTIONAL)</span></label>
              <input className="fi" placeholder="e.g. 10/4/2025" value={date} onChange={e => setDate(e.target.value)} />
            </div>
          </div>

          {/* Preview */}
          {(team || opponent) && (
            <div style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 4, textAlign: 'center', fontStyle: 'italic' }}>
              {buildTitle()}
            </div>
          )}
        </div>

        <div className="modal-foot">
          <button className="btn btn-secondary" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
          <button className="btn btn-primary" onClick={handleStart} style={{ flex: 1 }}>START GAME</button>
        </div>
      </div>
    </div>
  );
}
