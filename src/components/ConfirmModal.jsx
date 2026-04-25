export default function ConfirmModal({ open, title, message, confirmLabel, cancelLabel, onConfirm, onCancel, danger }) {
  if (!open) return null;
  return (
    <div className="overlay open" onClick={e => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="modal" style={{ maxWidth: 360 }}>
        <div className="modal-hdr">
          <div className="modal-title">{title || 'Confirm'}</div>
          <div className="modal-x" onClick={onCancel}>✕</div>
        </div>
        <div className="modal-body">
          <p style={{ fontSize: 14, color: 'var(--color-muted2)', lineHeight: 1.6 }}>
            {message}
          </p>
        </div>
        <div className="modal-foot">
          <button className="btn btn-secondary" onClick={onCancel} style={{ flex: 1 }}>
            {cancelLabel || 'Cancel'}
          </button>
          <button
            className="btn"
            onClick={onConfirm}
            style={{
              flex: 1,
              background: danger ? 'var(--color-red)' : 'var(--color-accent)',
              color: '#fff',
            }}
          >
            {confirmLabel || 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
