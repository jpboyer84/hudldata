import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { PLAYBOOK_DEFAULTS, PB_SECTIONS, fetchPlaybook, savePlaybookSection } from '../lib/playbook';

export default function PlaybookPage() {
  const navigate = useNavigate();
  const { coach } = useAuth();
  const showToast = useToast();
  const [pb, setPb] = useState(null);
  const [editSection, setEditSection] = useState(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    if (coach?.team_id) {
      fetchPlaybook(coach.team_id).then(data => {
        setPb(data || {});
      }).catch(err => {
        console.error('Playbook fetch error:', err);
        setPb({});
      });
    }
  }, [coach?.team_id]);

  function openEditor(key) {
    const val = pb?.[key] || PLAYBOOK_DEFAULTS[key] || '';
    setEditSection(key);
    setEditValue(val);
  }

  async function saveEditor() {
    if (!editSection || !coach?.team_id) return;
    try {
      await savePlaybookSection(coach.team_id, editSection, editValue, coach.id);
      setPb(prev => ({ ...prev, [editSection]: editValue }));
      setEditSection(null);
      showToast('Saved! AI will use this on your next question.');
    } catch (err) {
      showToast('Save failed: ' + err.message);
    }
  }

  function resetEditor() {
    if (!editSection) return;
    setEditValue(PLAYBOOK_DEFAULTS[editSection] || '');
    showToast('Reset — tap SAVE to apply.');
  }

  const sectionKeys = Object.keys(PB_SECTIONS);

  return (
    <div className="view">
      <div className="hdr">
        <button className="hdr-btn" onClick={() => navigate('/')}>← Back</button>
        <div className="hdr-title">Playbook</div>
        <div style={{ width: 60 }} />
      </div>

      {/* Editor modal */}
      {editSection && (
        <div className="overlay open" onClick={e => { if (e.target === e.currentTarget) setEditSection(null); }}>
          <div className="modal" style={{ maxHeight: '85dvh', height: '85dvh' }}>
            <div className="modal-hdr">
              <div className="modal-title">{PB_SECTIONS[editSection]?.title}</div>
              <div className="modal-x" onClick={() => setEditSection(null)}>✕</div>
            </div>
            <div style={{ padding: '10px 14px 6px', fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.5 }}>
              {PB_SECTIONS[editSection]?.hint}
            </div>
            <div style={{ flex: 1, padding: '8px 14px', overflow: 'hidden' }}>
              <textarea
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                style={{
                  width: '100%', height: '100%', background: 'var(--color-bg)',
                  border: '1px solid var(--color-border)', borderRadius: 10,
                  padding: 12, color: 'var(--color-text)', fontFamily: 'var(--font-ui)',
                  fontSize: 13, lineHeight: 1.6, resize: 'none', outline: 'none',
                }}
                placeholder="Key = Value, one per line…"
              />
            </div>
            <div className="modal-foot">
              <button className="btn btn-secondary" onClick={resetEditor} style={{ flex: 0 }}>
                ↺ Reset
              </button>
              <button className="btn btn-secondary" onClick={() => setEditSection(null)} style={{ flex: 1 }}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={saveEditor} style={{ flex: 1 }}>
                SAVE
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="abody" style={{ padding: 16 }}>
        <div style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 14, lineHeight: 1.5 }}>
          Tell the AI about your program. Everything here is shared with your staff and injected into every AI prompt — Spotlight, Ask AI, and Methodology explanations.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Row pairs matching HTML layout */}
          <div className="settings-row">
            <div className="settings-btn" onClick={() => openEditor('team_info')}>
              <span className="settings-btn-icon">🏫</span>TEAM INFO
              <span className="settings-btn-label">Name, school, rivals, conference</span>
            </div>
            <div className="settings-btn" onClick={() => openEditor('general')}>
              <span className="settings-btn-icon">📝</span>GENERAL
              <span className="settings-btn-label">Anything else for the AI</span>
            </div>
          </div>
          <div className="settings-row">
            <div className="settings-btn" onClick={() => openEditor('run_plays')}>
              <span className="settings-btn-icon">🏃</span>RUN PLAYS & PASS PRO
              <span className="settings-btn-label">Names & concepts</span>
            </div>
            <div className="settings-btn" onClick={() => openEditor('pass_plays')}>
              <span className="settings-btn-icon">🎯</span>PASS PLAYS
              <span className="settings-btn-label">Names & concepts</span>
            </div>
          </div>
          <div className="settings-row">
            <div className="settings-btn" onClick={() => openEditor('formations')}>
              <span className="settings-btn-icon">🗂</span>FORMATIONS
              <span className="settings-btn-label">Personnel & groupings</span>
            </div>
            <div className="settings-btn" onClick={() => openEditor('tags')}>
              <span className="settings-btn-icon">🏷</span>TAGS & MOTION
              <span className="settings-btn-label">Play modifiers</span>
            </div>
          </div>
          <div className="settings-row">
            <div className="settings-btn" onClick={() => openEditor('defense')}>
              <span className="settings-btn-icon">🛡</span>DEFENSIVE TERMS
              <span className="settings-btn-label">Fronts, coverages, blitzes</span>
            </div>
            <div className="settings-btn" onClick={() => openEditor('stat_rules')}>
              <span className="settings-btn-icon">📐</span>STAT RULES
              <span className="settings-btn-label">How stats are calculated</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
