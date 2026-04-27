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
  const [teamInfoFields, setTeamInfoFields] = useState({
    schoolFull: '', schoolAbbr: '', mascot: '', location: '',
    headCoach: '', rivals: '', conferenceOpponents: '',
  });

  const TEAM_INFO_LABELS = [
    { key: 'schoolFull', label: 'School Name (Full)', placeholder: 'e.g. Hanover Central High School' },
    { key: 'schoolAbbr', label: 'School Name (Abbreviation)', placeholder: 'e.g. HCHS' },
    { key: 'mascot', label: 'Mascot', placeholder: 'e.g. Wildcats' },
    { key: 'location', label: 'Location', placeholder: 'e.g. Cedar Lake, Indiana' },
    { key: 'headCoach', label: 'Head Coach', placeholder: 'e.g. Coach Boyer' },
    { key: 'rivals', label: 'Rivals', placeholder: 'e.g. Hobart, Andrean, Lowell' },
    { key: 'conferenceOpponents', label: 'Conference Opponents', placeholder: 'e.g. Munster, Highland, KVHS' },
  ];

  function parseTeamInfo(text) {
    const fields = { schoolFull: '', schoolAbbr: '', mascot: '', location: '', headCoach: '', rivals: '', conferenceOpponents: '' };
    if (!text) return fields;
    const lines = text.split('\n');
    for (const line of lines) {
      const [key, ...rest] = line.split(' - ');
      const val = rest.join(' - ').trim();
      const k = key.trim().toLowerCase();
      if (k.includes('full')) fields.schoolFull = val;
      else if (k.includes('abbrevi')) fields.schoolAbbr = val;
      else if (k.includes('mascot')) fields.mascot = val;
      else if (k.includes('location') || k.includes('city')) fields.location = val;
      else if (k.includes('head coach') || k.includes('coach')) fields.headCoach = val;
      else if (k.includes('rival')) fields.rivals = val;
      else if (k.includes('conference')) fields.conferenceOpponents = val;
      else if (k.includes('team name')) fields.schoolAbbr = val;
      else if (k.includes('school')) fields.schoolFull = val;
    }
    return fields;
  }

  function serializeTeamInfo(fields) {
    const lines = [];
    if (fields.schoolFull) lines.push(`School Name (Full) - ${fields.schoolFull}`);
    if (fields.schoolAbbr) lines.push(`School Name (Abbreviation) - ${fields.schoolAbbr}`);
    if (fields.mascot) lines.push(`Mascot - ${fields.mascot}`);
    if (fields.location) lines.push(`Location - ${fields.location}`);
    if (fields.headCoach) lines.push(`Head Coach - ${fields.headCoach}`);
    if (fields.rivals) lines.push(`Rivals - ${fields.rivals}`);
    if (fields.conferenceOpponents) lines.push(`Conference Opponents - ${fields.conferenceOpponents}`);
    return lines.join('\n');
  }

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
    if (key === 'team_info') {
      setTeamInfoFields(parseTeamInfo(val));
    }
  }

  async function saveEditor() {
    if (!editSection || !coach?.team_id) return;
    const valueToSave = editSection === 'team_info' ? serializeTeamInfo(teamInfoFields) : editValue;
    try {
      await savePlaybookSection(coach.team_id, editSection, valueToSave, coach.id);
      setPb(prev => ({ ...prev, [editSection]: valueToSave }));
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
            <div style={{ flex: 1, padding: '8px 14px', overflow: 'auto', WebkitOverflowScrolling: 'touch' }}>
              {editSection === 'team_info' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {TEAM_INFO_LABELS.map(f => (
                    <div key={f.key} className="fg">
                      <label className="fl">{f.label} <span style={{ fontWeight: 400, color: 'var(--color-muted)' }}>(optional)</span></label>
                      <input
                        className="fi"
                        placeholder={f.placeholder}
                        value={teamInfoFields[f.key]}
                        onChange={e => setTeamInfoFields(prev => ({ ...prev, [f.key]: e.target.value }))}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <textarea
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  style={{
                    width: '100%', height: '100%', background: 'var(--color-bg)',
                    border: '1px solid var(--color-border)', borderRadius: 10,
                    padding: 12, color: 'var(--color-text)', fontFamily: 'var(--font-ui)',
                    fontSize: 13, lineHeight: 1.6, resize: 'none', outline: 'none',
                  }}
                  placeholder="Key - Value, one per line…"
                />
              )}
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

