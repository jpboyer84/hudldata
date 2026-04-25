import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { fetchColumns, deleteColumn } from '../lib/supaData';
import ConfirmModal from '../components/ConfirmModal';

export default function ColumnsPage() {
  const navigate = useNavigate();
  const { coach } = useAuth();
  const showToast = useToast();
  const [columns, setColumns] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    if (coach?.team_id) {
      fetchColumns(coach.team_id).then(setColumns).catch(console.error);
    }
  }, [coach?.team_id]);

  function handleDelete(col) {
    setConfirmDelete({
      title: 'Delete column',
      message: `Delete "${col.name}"? Templates using this column will keep working but it will be removed from the library.`,
      onConfirm: async () => {
        try {
          await deleteColumn(col.id);
          setColumns(prev => prev.filter(c => c.id !== col.id));
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
        {columns.length === 0 ? (
          <div className="empty-msg">
            No custom columns yet.<br />
            Built-in columns (ODK, QTR, DN…) are always available.<br />
            Tap + New to create a custom column.
          </div>
        ) : (
          columns.map(col => (
            <div key={col.id} className="arch-card" style={{ gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="arch-title">{col.name}</div>
                <div className="arch-meta">
                  {Array.isArray(col.known_values) ? `${col.known_values.length} buttons` : '0 buttons'}
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
          ))
        )}
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
