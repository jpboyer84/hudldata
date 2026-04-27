import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { fetchColumns, fetchTemplates, createTemplate, updateTemplate } from '../lib/supaData';
import { syncTemplateToHudl } from '../lib/hudlData';
import { DEFAULT_COLUMNS } from '../columns';

export default function TemplateBuilderPage() {
  const { id } = useParams(); // edit mode if id exists
  const navigate = useNavigate();
  const { coach } = useAuth();
  const showToast = useToast();

  const [name, setName] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [allColumns, setAllColumns] = useState([]);
  const [saving, setSaving] = useState(false);
  const dragItem = useRef(null);
  const dragOver = useRef(null);

  useEffect(() => {
    if (!coach?.team_id) return;

    // Load custom columns from Supabase + built-in defaults
    fetchColumns(coach.team_id).then(customCols => {
      // Merge: built-in DEFAULT_COLUMNS + custom columns from Supabase
      const builtIn = DEFAULT_COLUMNS.map(c => ({ id: c.id, name: c.name, source: 'built-in', column: c }));
      const custom = customCols.map(c => ({ id: c.id, name: c.name, source: 'custom', column: c }));
      setAllColumns([...builtIn, ...custom]);
    }).catch(console.error);

    // If editing, load existing template
    if (id) {
      fetchTemplates(coach.team_id).then(templates => {
        const tmpl = templates.find(t => t.id === id);
        if (tmpl) {
          setName(tmpl.name);
          setSelectedIds(tmpl.col_ids || []);
        }
      }).catch(console.error);
    }
  }, [coach?.team_id, id]);

  function toggleColumn(colId) {
    setSelectedIds(prev => {
      if (prev.includes(colId)) return prev.filter(id => id !== colId);
      return [...prev, colId];
    });
  }

  // Drag and drop for reordering selected columns
  function handleDragStart(idx) { dragItem.current = idx; }
  function handleDragEnter(idx) { dragOver.current = idx; }
  function handleDragEnd() {
    if (dragItem.current === null || dragOver.current === null) return;
    const items = [...selectedIds];
    const dragged = items.splice(dragItem.current, 1)[0];
    items.splice(dragOver.current, 0, dragged);
    setSelectedIds(items);
    dragItem.current = null;
    dragOver.current = null;
  }

  // Touch drag
  function handleTouchStart(idx, e) {
    dragItem.current = idx;
  }
  function handleTouchMove(e) {
    const touch = e.touches[0];
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    const dragIdx = el?.closest('[data-drag-idx]')?.dataset?.dragIdx;
    if (dragIdx != null) dragOver.current = parseInt(dragIdx);
  }
  function handleTouchEnd() {
    handleDragEnd();
  }

  async function handleSave() {
    if (!name.trim()) { showToast('Enter a template name'); return; }
    if (selectedIds.length === 0) { showToast('Select at least one column'); return; }
    if (!coach?.team_id) return;

    setSaving(true);
    try {
      if (id) {
        await updateTemplate(id, { name: name.trim(), col_ids: selectedIds });
        const hudlResult = await syncTemplateToHudl(name.trim(), selectedIds, coach);
        showToast(hudlResult ? 'Template updated + synced to Hudl' : 'Template updated');
      } else {
        await createTemplate({
          team_id: coach.team_id,
          name: name.trim(),
          col_ids: selectedIds,
          sort_order: 0,
        });
        const hudlResult = await syncTemplateToHudl(name.trim(), selectedIds, coach);
        showToast(hudlResult ? 'Template created + synced to Hudl' : 'Template created');
      }
      navigate('/templates');
    } catch (err) {
      showToast('Save failed: ' + err.message);
    }
    setSaving(false);
  }

  const selectedCols = selectedIds.map(sid => allColumns.find(c => c.id === sid)).filter(Boolean);
  const availableCols = allColumns.filter(c => !selectedIds.includes(c.id));

  return (
    <div className="view">
      <div className="hdr">
        <button className="hdr-btn" onClick={() => navigate('/templates')}>← Back</button>
        <div className="hdr-title">{id ? 'Edit template' : 'New template'}</div>
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
        <div className="fg" style={{ paddingBottom: 4 }}>
          <label className="fl">Template Name</label>
          <input
            className="fi"
            placeholder="e.g. ODK, Game Day…"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>

        {/* Selected columns (reorderable) */}
        <div className="sec-label">
          Selected Columns <span style={{ color: 'var(--color-text)' }}>{selectedIds.length > 0 ? `(${selectedIds.length})` : ''}</span>
        </div>
        {selectedCols.map((col, idx) => (
          <div
            key={col.id}
            data-drag-idx={idx}
            className="col-pick sel"
            draggable
            onDragStart={() => handleDragStart(idx)}
            onDragEnter={() => handleDragEnter(idx)}
            onDragEnd={handleDragEnd}
            onDragOver={e => e.preventDefault()}
            onTouchStart={(e) => handleTouchStart(idx, e)}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="col-pick-check">✓</div>
            <div style={{ flex: 1 }}>
              <div className="col-pick-name">{col.name}</div>
              {col.source === 'custom' && <div className="col-pick-sub">Custom</div>}
            </div>
            <div
              className="drag-handle"
              onClick={e => e.stopPropagation()}
            >
              ⠿
            </div>
          </div>
        ))}

        {/* Available columns */}
        <div className="sec-label" style={{ marginTop: 12 }}>Available Columns</div>
        {availableCols.map(col => (
          <div
            key={col.id}
            className="col-pick"
            onClick={() => toggleColumn(col.id)}
          >
            <div className="col-pick-check" />
            <div style={{ flex: 1 }}>
              <div className="col-pick-name">{col.name}</div>
              {col.source === 'custom' && <div className="col-pick-sub">Custom</div>}
            </div>
          </div>
        ))}

        <button className="btn-full" onClick={handleSave} disabled={saving}>
          {id ? 'UPDATE TEMPLATE' : 'CREATE TEMPLATE'}
        </button>
      </div>
    </div>
  );
}

