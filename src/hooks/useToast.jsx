import { createContext, useContext, useState, useCallback, useRef } from 'react';

const ToastContext = createContext({});

export function ToastProvider({ children }) {
  const [message, setMessage] = useState('');
  const [visible, setVisible] = useState(false);
  const [undoFn, setUndoFn] = useState(null);
  const timerRef = useRef(null);

  const showToast = useCallback((msg, duration, onUndo) => {
    setMessage(msg);
    setVisible(true);
    setUndoFn(() => onUndo || null);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => { setVisible(false); setUndoFn(null); }, duration || 2500);
  }, []);

  function handleUndo() {
    if (undoFn) { undoFn(); setVisible(false); setUndoFn(null); }
  }

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div className={`toast ${visible ? 'show' : ''}`} onClick={undoFn ? handleUndo : undefined} style={undoFn ? { cursor: 'pointer' } : undefined}>
        {message}
        {undoFn && <span style={{ marginLeft: 10, color: 'var(--color-accent)', fontWeight: 700, textDecoration: 'underline' }}>UNDO</span>}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
