import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { fetchColumns, deleteColumn } from '../lib/supaData';
import { defaultColumns } from '../columns';
import ConfirmModal from '../components/ConfirmModal';

function getButtonCount(col) {
  // Built-in columns use btns array with {l,v} objects
  if (Array.isArray(col.btns)) return col.btns.length;
  // Custom columns use known_values (simple string array)
  if (Array.isArray(col.known_values)) return col.known_values.length;
  // Dropdown-only columns
  if (Array.isArray(col.dd)) return col.dd.length;
  return 0;
}

function getTypeLabel(col) {
  const t = col.type || 'buttons';
  const labels = {
    buttons: 'Buttons',
    btns_dd: 'Buttons + Dropdown',
    btn_dds: 'Multi-Dropdown',
    numpad: 'Number Pad',
    calc: 'Calculated',
  };
  return labels[t] || t;
}

export default function ColumnsPage() {
  const navigate = useNavigate();
  const { coach } = useAuth();
  const showToast = useToast();
  const [customColumns, setCustomColumns] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    if (coach?.team_id) {
      fetchColumns(coach.team_id).then(setCustomColumns).catch(console.error);
    }
  }, [coach?.team_id]);

  const builtInCols = defaultColumns();
  // Merge: custom columns override built-in if same ID
  const customIds = new Set(customColumns.map(c => c.id));

  function handleDelete(col) {
    setConfirmDelete({
      title: 'Delete column',
      message: `Delete "${col.name}"? Templates using this column will keep working but it will be removed from the library.`,
      onConfirm: async () => {
        try {
          await deleteColumn(col.id);
          setCustomColumns(prev => prev.filter(c => c.id !== col.id));
          showToast('Column deleted');
        } catch (err) {
          showToast('Delete failed: ' + err.message);
        }
        setConfirmDelete(null);
      },
    });
  }

  return (
    <div className="view">
      <div className="hdr">
        <button className="hdr-btn" onClick={() => navigate('/templates')}>← Back</button>
        <div className="hdr-title">Columns</div>
        <button
          className="hdr-btn"
          style={{ background: 'var(--color-accent)', color: '#fff', borderColor: 'var(--color-accent)' }}
          onClick={() => navigate('/columns/new')}
        >
          + New
        </button>
      </div>

      <div className="abody">
        {/* Custom columns first */}
        {customColumns.length > 0 && (
          <>
            <div style={{
              fontSize: 11, fontWeight: 700, color: 'var(--color-accent)',
              padding: '12px 0 6px', letterSpacing: '0.05em',
            }}>
              CUSTOM COLUMNS
            </div>
            {customColumns.sort((a, b) => a.name.localeCompare(b.name)).map(col => (
              <div key={col.id} className="arch-card" style={{ gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="arch-title">{col.name}</div>
                  <div className="arch-meta">
                    {getButtonCount(col)} buttons
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    className="hdr-btn"
                    style={{ background: 'var(--color-accent)', color: '#fff', borderColor: 'var(--color-accent)', fontSize: 10, padding: '5px 10px' }}
                    onClick={() => navigate(`/columns/edit/${col.id}`)}
                  >
                    EDIT
                  </button>
                  <button
                    className="hdr-btn"
                    style={{ fontSize: 10, padding: '5px 8px', color: 'var(--color-red)', borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)' }}
                    onClick={() => handleDelete(col)}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </>
        )}

        {/* Built-in columns */}
        <div style={{
          fontSize: 11, fontWeight: 700, color: 'var(--color-muted)',
          padding: '12px 0 6px', letterSpacing: '0.05em',
          borderTop: customColumns.length > 0 ? '1px solid var(--color-border)' : 'none',
          marginTop: customColumns.length > 0 ? 8 : 0,
        }}>
          ALL COLUMNS ({builtInCols.length})
        </div>
        {builtInCols
          .filter(c => !customIds.has(c.id))
          .sort((a, b) => a.name.localeCompare(b.name))
          .map(col => (
            <div key={col.id} className="arch-card" style={{ gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="arch-title">{col.name}</div>
                <div className="arch-meta">
                  {getTypeLabel(col)} · {getButtonCount(col)} {col.type === 'numpad' ? 'keys' : 'buttons'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <button
                  className="hdr-btn"
                  style={{ background: 'var(--color-accent)', color: '#fff', borderColor: 'var(--color-accent)', fontSize: 10, padding: '5px 10px' }}
                  onClick={() => navigate(`/columns/edit/${col.id}?builtin=1`)}
                >
                  EDIT
                </button>
              </div>
            </div>
          ))}
      </div>

      <ConfirmModal
        open={!!confirmDelete}
        title={confirmDelete?.title}
        message={confirmDelete?.message}
        danger
        onConfirm={confirmDelete?.onConfirm}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
