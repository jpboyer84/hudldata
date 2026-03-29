import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

// ─── Base modal wrapper ───────────────────────────────────────────────────────

export function Modal({ title, onClose, children, wide = false }) {
  // Close on Escape
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className={`w-full rounded-lg overflow-hidden flex flex-col ${wide ? 'max-w-lg' : 'max-w-xs'}`}
        style={{ backgroundColor: '#1e1e1e', border: '1px solid #555555', maxHeight: '80vh' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 flex-shrink-0"
          style={{ borderBottom: '1px solid #3a3a3a' }}
        >
          <span className="font-nunito font-black text-white text-sm uppercase tracking-wider">
            {title}
          </span>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors p-1 -mr-1"
          >
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Number input modal ───────────────────────────────────────────────────────

export function NumberModal({ title, min, max, currentValue, onConfirm, onClose }) {
  const [raw, setRaw] = useState(currentValue != null ? String(currentValue) : '');
  const inputRef = useRef(null);

  useEffect(() => {
    // Short delay so the modal animation doesn't fight focus
    const t = setTimeout(() => inputRef.current?.select(), 80);
    return () => clearTimeout(t);
  }, []);

  const n = parseInt(raw, 10);
  const valid = !isNaN(n) && n >= min && n <= max;

  function handleConfirm() {
    if (!valid) return;
    onConfirm(String(n));
    onClose();
  }

  return (
    <Modal title={title} onClose={onClose}>
      <div className="p-4 flex flex-col gap-3">
        <input
          ref={inputRef}
          type="number"
          inputMode="numeric"
          value={raw}
          onChange={e => setRaw(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleConfirm()}
          min={min}
          max={max}
          className="bg-bg border border-edge text-white font-mono text-3xl text-center px-4 py-5 focus:outline-none focus:border-white/50 transition-colors w-full"
        />
        <div className="text-white/25 text-[10px] font-mono text-center">
          {min} to {max}
        </div>
        {currentValue != null && (
          <button
            onClick={() => { onConfirm(null); onClose(); }}
            className="py-2 border border-edge text-white/40 font-nunito font-black text-xs tracking-wider hover:text-white hover:border-white/40 transition-colors"
            style={{ backgroundColor: '#111111' }}
          >
            CLEAR
          </button>
        )}
        <button
          onClick={handleConfirm}
          disabled={!valid}
          className="py-3.5 bg-white text-black font-nunito font-black text-sm uppercase tracking-wider disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/90 transition-colors"
        >
          CONFIRM
        </button>
      </div>
    </Modal>
  );
}

// ─── Scrollable dropdown / sub-options modal ──────────────────────────────────

export function DropdownModal({ title, options, currentValue, onSelect, onClose }) {
  const activeRef = useRef(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'center' });
  }, []);

  return (
    <Modal title={title} onClose={onClose} wide>
      <div className="overflow-y-auto flex-1">
        {/* Clear button */}
        {currentValue != null && (
          <button
            onClick={() => { onSelect(null); onClose(); }}
            className="w-full px-4 py-2.5 text-left font-mono text-xs tracking-wider text-white/30 hover:text-white hover:bg-white/5 transition-colors"
            style={{ borderBottom: '1px solid #3a3a3a' }}
          >
            — CLEAR —
          </button>
        )}
        {options.map(opt => {
          const active = opt === currentValue;
          return (
            <button
              key={opt}
              ref={active ? activeRef : null}
              onClick={() => { onSelect(opt); onClose(); }}
              className="w-full px-4 py-3 text-left font-mono text-sm transition-colors"
              style={{
                borderBottom: '1px solid #3a3a3a',
                backgroundColor: active ? '#ffffff' : 'transparent',
                color: active ? '#000000' : '#ffffff',
                fontWeight: active ? 700 : 400,
              }}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </Modal>
  );
}
