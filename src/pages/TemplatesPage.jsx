import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { fetchTemplates, deleteTemplate } from '../lib/supaData';
import ConfirmModal from '../components/ConfirmModal';

export default function TemplatesPage() {
  const navigate = useNavigate();
  const { coach } = useAuth();
  const showToast = useToast();
  const [templates, setTemplates] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    if (coach?.team_id) {
      fetchTemplates(coach.team_id).then(setTemplates).catch(console.error);
    }
  }, [coach?.team_id]);

  function handleDelete(tmpl) {
    setConfirmDelete({
      title: 'Delete template',
      message: `Delete "${tmpl.name}"? Games using this template will keep their columns.`,
      onConfirm: async () => {
        try {
          await deleteTemplate(tmpl.id);
          setTemplates(prev => prev.filter(t => t.id !== tmpl.id));
          showToast('Template deleted');
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
        <button className="hdr-btn" onClick={() => navigate('/settings')}>← Back</button>
        <div className="hdr-title">Templates</div>
        <div style={{ display: 'flex', gap: 5 }}>
          <button className="hdr-btn" onClick={() => navigate('/columns')}>Columns</button>
          <button
            className="hdr-btn"
            style={{ background: 'var(--color-accent)', color: '#fff', borderColor: 'var(--color-accent)' }}
            onClick={() => navigate('/templates/new')}
          >
            + New
          </button>
        </div>
      </div>

      <div className="abody">
        {templates.length === 0 ? (
          <div className="empty-msg">
            No templates yet.<br />
            Tap + New to create one.
          </div>
        ) : (
          templates.map(t => (
            <div key={t.id} className="arch-card" style={{ gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="arch-title">{t.name}</div>
                <div className="arch-meta">
                  {Array.isArray(t.col_ids) ? `${t.col_ids.length} columns` : '0 columns'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  className="hdr-btn"
                  style={{ background: 'var(--color-accent)', color: '#fff', borderColor: 'var(--color-accent)', fontSize: 10, padding: '5px 10px' }}
                  onClick={() => navigate(`/templates/edit/${t.id}`)}
                >
                  EDIT
                </button>
                <button
                  className="hdr-btn"
                  style={{ fontSize: 10, padding: '5px 8px', color: 'var(--color-red)', borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)' }}
                  onClick={() => handleDelete(t)}
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
