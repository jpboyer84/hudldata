import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { fetchColumns, createColumn, updateColumn } from '../lib/supaData';

export default function ColumnBuilderPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { coach } = useAuth();
  const showToast = useToast();

  const [name, setName] = useState('');
  const [buttons, setButtons] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id && coach?.team_id) {
      fetchColumns(coach.team_id).then(cols => {
        const col = cols.find(c => c.id === id);
        if (col) {
          setName(col.name);
          setButtons(col.known_values || []);
        }
      }).catch(console.error);
    }
  }, [id, coach?.team_id]);

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
      if (id) {
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
          />
        </div>

        <div className="sec-label">Buttons</div>
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
