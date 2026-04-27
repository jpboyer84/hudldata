import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { fetchColumns, createColumn, updateColumn } from '../lib/supaData';
import { defaultColumns } from '../columns';
import { syncTemplateToHudl } from '../lib/hudlData';

const COLUMN_TYPES = [
  { value: 'buttons', label: 'Buttons' },
  { value: 'btns_dd', label: 'Buttons + Dropdown' },
  { value: 'btn_dds', label: 'Multi-Dropdown' },
  { value: 'numpad', label: 'Number Pad' },
];

function extractButtons(col) {
  if (!col) return [];
  if (Array.isArray(col.btns)) return col.btns.map(b => b.l || b.v || '');
  if (Array.isArray(col.dd)) return col.dd;
  if (Array.isArray(col.known_values)) return col.known_values;
  return [];
}

function getColType(col) {
  if (!col) return 'buttons';
  return col.type || 'buttons';
}

export default function ColumnBuilderPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isBuiltIn = searchParams.get('builtin') === '1';
  const navigate = useNavigate();
  const { coach } = useAuth();
  const showToast = useToast();

  const [name, setName] = useState('');
  const [colType, setColType] = useState('buttons');
  const [buttons, setButtons] = useState([]);
  const [saving, setSaving] = useState(false);
  const [overrideId, setOverrideId] = useState(null);

  useEffect(() => {
    if (!id) return;

    if (isBuiltIn) {
      const builtIn = defaultColumns().find(c => c.id === id);
      if (builtIn) {
        setName(builtIn.name);
        setColType(getColType(builtIn));
        setButtons(extractButtons(builtIn));
      }
      if (coach?.team_id) {
        fetchColumns(coach.team_id).then(cols => {
          const existing = cols.find(c => c.data_key === id || c.name === builtIn?.name);
          if (existing) {
            setName(existing.name);
            setButtons(existing.known_values || extractButtons(builtIn));
            setOverrideId(existing.id);
          }
        }).catch(console.error);
      }
    } else if (coach?.team_id) {
      fetchColumns(coach.team_id).then(cols => {
        const col = cols.find(c => c.id === id);
        if (col) {
          setName(col.name);
          setButtons(col.known_values || []);
        }
      }).catch(console.error);
    }
  }, [id, coach?.team_id, isBuiltIn]);

  function addButton() { setButtons(prev => [...prev, '']); }
  function updateButton(idx, val) { setButtons(prev => { const next = [...prev]; next[idx] = val; return next; }); }
  function removeButton(idx) { setButtons(prev => prev.filter((_, i) => i !== idx)); }

  async function handleSave() {
    if (!name.trim()) { showToast('Enter a column name'); return; }
    if (!coach?.team_id) return;

    const cleanButtons = buttons.map(b => b.trim()).filter(Boolean);
    setSaving(true);
    try {
      if (isBuiltIn) {
        if (overrideId) {
          await updateColumn(overrideId, { name: name.trim(), known_values: cleanButtons });
        } else {
          await createColumn({
            team_id: coach.team_id, name: name.trim(), data_key: id,
            known_values: cleanButtons, sort_order: 0,
          });
        }
        showToast('Column updated');
      } else if (id) {
        await updateColumn(id, {
          name: name.trim(),
          data_key: name.trim().toLowerCase().replace(/[^a-z0-9]/g, '_'),
          known_values: cleanButtons,
        });
        showToast('Column updated');
      } else {
        // New custom column
        const dataKey = name.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
        await createColumn({
          team_id: coach.team_id, name: name.trim(), data_key: dataKey,
          known_values: cleanButtons, sort_order: 0,
        });
        // Auto-sync to Hudl as a column
        if (coach.hudl_cookie) {
          await syncTemplateToHudl(name.trim(), [dataKey], coach).catch(() => {});
        }
        showToast('Column created');
      }
      navigate('/columns');
    } catch (err) { showToast('Save failed: ' + err.message); }
    setSaving(false);
  }

  return (
    <div className="view">
      <div className="hdr">
        <button className="hdr-btn" onClick={() => navigate('/columns')}>← Back</button>
        <div className="hdr-title">{id ? 'Edit column' : 'New column'}</div>
        <button
          className="hdr-btn"
          style={{ background: 'var(--color-accent)', color: '#fff', borderColor: 'var(--color-accent)' }}
          onClick={handleSave} disabled={saving}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 16, WebkitOverflowScrolling: 'touch' }}>
        <div className="fg">
          <label className="fl">Column Name</label>
          <input
            className="fi" placeholder="e.g. FORMATION, COVERAGE…"
            value={name} onChange={e => setName(e.target.value)}
            disabled={isBuiltIn}
          />
          {isBuiltIn && (
            <div style={{ fontSize: 10, color: 'var(--color-muted)', marginTop: 4 }}>
              Name cannot be changed for this column, but you can edit its buttons and type.
            </div>
          )}
        </div>

        <div className="fg" style={{ marginTop: 12 }}>
          <label className="fl">Column Type</label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {COLUMN_TYPES.map(t => (
              <div
                key={t.value}
                onClick={() => setColType(t.value)}
                style={{
                  padding: '8px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                  cursor: 'pointer', border: '1px solid',
                  color: colType === t.value ? 'var(--color-accent)' : 'var(--color-muted)',
                  background: colType === t.value ? 'rgba(232,89,12,0.12)' : 'var(--color-surface2)',
                  borderColor: colType === t.value ? 'var(--color-accent)' : 'var(--color-border)',
                }}
              >
                {t.label}
              </div>
            ))}
          </div>
        </div>

        {colType !== 'numpad' && (
          <>
            <div className="sec-label" style={{ marginTop: 16 }}>
              {colType === 'btns_dd' ? 'Buttons & Dropdown Options' : colType === 'btn_dds' ? 'Button Groups' : 'Buttons'} ({buttons.length})
            </div>
            {buttons.map((btn, idx) => (
              <div key={idx} className="btn-row">
                <input
                  className="btn-input" value={btn}
                  onChange={e => updateButton(idx, e.target.value)}
                  placeholder={`${colType === 'btn_dds' ? 'Group' : 'Button'} ${idx + 1}`}
                />
                <button className="btn-rm" onClick={() => removeButton(idx)}>✕</button>
              </div>
            ))}
            <button className="add-btn-row" onClick={addButton}>
              ＋ ADD {colType === 'btn_dds' ? 'GROUP' : 'BUTTON'}
            </button>
          </>
        )}

        {colType === 'numpad' && (
          <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--color-muted)', fontSize: 13 }}>
            Number pad columns don't have buttons — they show a numeric input.
          </div>
        )}

        <button className="btn-full" onClick={handleSave} disabled={saving}>
          {id ? 'UPDATE COLUMN' : 'SAVE COLUMN'}
        </button>
      </div>
    </div>
  );
}
