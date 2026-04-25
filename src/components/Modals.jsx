import { useEffect, useRef } from 'react';

export function DropdownModal({ title, options, currentValue, onSelect, onClose, centerOn }) {
  const listRef = useRef(null);

  useEffect(() => {
    if (!listRef.current || !options) return;
    // Scroll to current value or centerOn value
    const target = currentValue || centerOn;
    if (target) {
      const idx = options.indexOf(String(target));
      if (idx >= 0) {
        const items = listRef.current.children;
        if (items[idx]) {
          items[idx].scrollIntoView({ block: 'center' });
        }
      }
    }
  }, [options, currentValue, centerOn]);

  if (!options) return null;

  return (
    <div className="overlay open" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxHeight: '70dvh' }}>
        <div className="modal-hdr">
          <div className="modal-title">{title}</div>
          <div className="modal-x" onClick={onClose}>✕</div>
        </div>
        <div className="list-scroll" ref={listRef}>
          {options.map((opt, i) => {
            const sel = String(currentValue) === String(opt);
            return (
              <div
                key={i}
                className={`dd-item${sel ? ' sel' : ''}`}
                onClick={() => { onSelect(opt); onClose(); }}
              >
                {opt}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function PlayNavModal({ current, max, filledSet, onJump, onClose }) {
  const plays = Array.from({ length: max }, (_, i) => i);

  return (
    <div className="overlay open" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxHeight: '70dvh' }}>
        <div className="modal-hdr">
          <div className="modal-title">Jump to play</div>
          <div className="modal-x" onClick={onClose}>✕</div>
        </div>
        <div className="modal-body">
          <div className="play-nav-grid">
            {plays.map(idx => {
              const isCur = idx === current;
              const isFilled = filledSet?.has(idx);
              return (
                <div
                  key={idx}
                  className={`pn-item${isCur ? ' cur' : isFilled ? ' filled' : ' empty'}`}
                  onClick={() => { onJump(idx); onClose(); }}
                >
                  {idx + 1}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export function EditGameModal({ open, game, onSave, onClose }) {
  if (!open || !game) return null;

  function handleSubmit(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    onSave({
      home: fd.get('home') || '',
      away: fd.get('away') || '',
      week: fd.get('week') || '',
      date: fd.get('date') || '',
    });
  }

  return (
    <div className="overlay open" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-hdr">
          <div className="modal-title">EDIT GAME INFO</div>
          <div className="modal-x" onClick={onClose}>✕</div>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit} id="edit-game-form">
            <div className="fg">
              <label className="fl">Home Team</label>
              <input className="fi" name="home" defaultValue={game.home || ''} placeholder="Home team" />
            </div>
            <div className="fg">
              <label className="fl">Away Team</label>
              <input className="fi" name="away" defaultValue={game.away || ''} placeholder="Away team" />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <div className="fg" style={{ flex: '0 0 110px' }}>
                <label className="fl">Week</label>
                <input className="fi" name="week" defaultValue={game.week || ''} placeholder="e.g. 5" type="number" min="1" max="20" />
              </div>
              <div className="fg" style={{ flex: 1 }}>
                <label className="fl">Date</label>
                <input className="fi" name="date" defaultValue={game.date || ''} placeholder="e.g. 10/4/2025" />
              </div>
            </div>
          </form>
        </div>
        <div className="modal-foot">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" type="submit" form="edit-game-form">Save</button>
        </div>
      </div>
    </div>
  );
}
