import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { fetchColumns, createColumn, updateColumn } from '../lib/supaData';
import { defaultColumns } from '../columns';

// Extract button labels from a built-in column's btns array
function extractButtons(col) {
  if (!col) return [];
  // Built-in columns: btns is [{l, v}, ...] — use the label (l)
  if (Array.isArray(col.btns)) return col.btns.map(b => b.l || b.v || '');
  // Dropdown values
  if (Array.isArray(col.dd)) return col.dd;
  // Custom columns: known_values is [string, ...]
  if (Array.isArray(col.known_values)) return col.known_values;
  return [];
}

export default function ColumnBuilderPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isBuiltIn = searchParams.get('builtin') === '1';
  const navigate = useNavigate();
  const { coach } = useAuth();
  const showToast = useToast();

  const [name, setName] = useState('');
  const [buttons, setButtons] = useState([]);
  const [saving, setSaving] = useState(false);
  const [overrideId, setOverrideId] = useState(null); // Supabase row ID if override exists

  useEffect(() => {
    if (!id) return;

    if (isBuiltIn) {
      // Load from built-in defaults
      const builtIn = defaultColumns().find(c => c.id === id);
      if (builtIn) {
        setName(builtIn.name);
        setButtons(extractButtons(builtIn));
      }
      // Also check if there's already a custom override in Supabase
      if (coach?.team_id) {
        fetchColumns(coach.team_id).then(cols => {
          const existing = cols.find(c => c.data_key === id || c.name === builtIn?.name);
          if (existing) {
            // Load the override's values instead
            setName(existing.name);
            setButtons(existing.known_values || extractButtons(builtIn));
            setOverrideId(existing.id);
          }
        }).catch(console.error);
      }
    } else if (coach?.team_id) {
      // Load custom column from Supabase
      fetchColumns(coach.team_id).then(cols => {
        const col = cols.find(c => c.id === id);
        if (col) {
          setName(col.name);
          setButtons(col.known_values || []);
        }
      }).catch(console.error);
    }
  }, [id, coach?.team_id, isBuiltIn]);

  function addButton() {
    setButtons(prev => [...prev, '']);
  }

  function updateButton(idx, val) {
    setButtons(prev => {
      const next = [...prev];
      next[idx] = val;
      return next;
    });
  }

  function removeButton(idx) {
    setButtons(prev => prev.filter((_, i) => i !== idx));
  }

  async function handleSave() {
    if (!name.trim()) { showToast('Enter a column name'); return; }
    if (!coach?.team_id) return;

    const cleanButtons = buttons.map(b => b.trim()).filter(Boolean);
    setSaving(true);
    try {
      if (isBuiltIn) {
        if (overrideId) {
          // Update existing override in Supabase
          await updateColumn(overrideId, {
            name: name.trim(),
            known_values: cleanButtons,
          });
        } else {
          // Create a new custom override for the built-in column
          await createColumn({
            team_id: coach.team_id,
            name: name.trim(),
            data_key: id,
            known_values: cleanButtons,
            sort_order: 0,
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
        await createColumn({
          team_id: coach.team_id,
          name: name.trim(),
          data_key: name.trim().toLowerCase().replace(/[^a-z0-9]/g, '_'),
          known_values: cleanButtons,
          sort_order: 0,
        });
        showToast('Column created');
      }
      navigate('/columns');
    } catch (err) {
      showToast('Save failed: ' + err.message);
    }
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
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 16, WebkitOverflowScrolling: 'touch' }}>
        <div className="fg">
          <label className="fl">Column Name</label>
          <input
            className="fi"
            placeholder="e.g. FORMATION, COVERAGE…"
            value={name}
            onChange={e => setName(e.target.value)}
            disabled={isBuiltIn}
          />
          {isBuiltIn && (
            <div style={{ fontSize: 10, color: 'var(--color-muted)', marginTop: 4 }}>
              Built-in column — name cannot be changed, but you can add, remove, or edit buttons.
            </div>
          )}
        </div>

        <div className="sec-label" style={{ marginTop: 16 }}>Buttons ({buttons.length})</div>
        {buttons.map((btn, idx) => (
          <div key={idx} className="btn-row">
            <input
              className="btn-input"
              value={btn}
              onChange={e => updateButton(idx, e.target.value)}
              placeholder={`Button ${idx + 1}`}
            />
            <button className="btn-rm" onClick={() => removeButton(idx)}>✕</button>
          </div>
        ))}

        <button className="add-btn-row" onClick={addButton}>＋ ADD BUTTON</button>
        <button className="btn-full" onClick={handleSave} disabled={saving}>
          {id ? 'UPDATE COLUMN' : 'SAVE COLUMN'}
        </button>
      </div>
    </div>
  );
}
