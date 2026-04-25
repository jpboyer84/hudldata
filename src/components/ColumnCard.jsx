import { useState } from 'react';

// Grid class based on button count (matches HTML gridCls)
function gridCls(n) {
  if (n <= 2) return 'bg-2';
  if (n === 3) return 'bg-3';
  if (n === 5) return 'bg-5';
  return 'bg-4';
}

export default function ColumnCard({ col, value, onSetValue, onOpenModal }) {
  const v = value ?? '';

  function handleBtnClick(btnValue) {
    // Toggle: if already selected, deselect
    onSetValue(col.id, v === btnValue ? '' : btnValue);
  }

  function renderButtons() {
    if (!col.options || col.options.length === 0) {
      return <div style={{ padding: 8, color: 'var(--color-muted)', fontSize: 12, textAlign: 'center' }}>No buttons</div>;
    }

    const gc = gridCls(col.options.length);
    return (
      <div className={`btn-grid ${gc}`}>
        {col.options.map((opt, i) => {
          // Direct value button
          if (!opt.action) {
            const sel = v === (opt.value || opt.label);
            return (
              <div
                key={i}
                className={`t-btn${sel ? ' sel' : ''}${col.options.length > 4 ? ' sm' : ''}`}
                onClick={() => handleBtnClick(opt.value || opt.label)}
              >
                {opt.label}
              </div>
            );
          }

          // Modal-dropdown button
          if (opt.action === 'modal-dropdown') {
            return (
              <div
                key={i}
                className={`t-btn${col.options.length > 4 ? ' sm' : ''}`}
                onClick={() => onOpenModal({
                  type: 'dropdown',
                  columnId: col.id,
                  title: col.name,
                  options: opt.dropdownOptions,
                  centerOn: opt.centerOn,
                })}
              >
                {opt.label}
              </div>
            );
          }

          // Modal-suboptions button (like OFF FORM formations)
          if (opt.action === 'modal-suboptions') {
            const sel = opt.subOptions && opt.subOptions.includes(v);
            return (
              <div
                key={i}
                className={`t-btn${sel ? ' sel' : ''}${col.options.length > 4 ? ' sm' : ''}`}
                onClick={() => onOpenModal({
                  type: 'dropdown',
                  columnId: col.id,
                  title: `${col.name} — ${opt.label}`,
                  options: opt.subOptions,
                })}
              >
                {sel ? v : opt.label}
              </div>
            );
          }

          return null;
        })}
      </div>
    );
  }

  function renderModalList() {
    const hasVal = !!v;
    const display = hasVal ? v : col.name;
    return (
      <div className="btn-grid bg-1">
        <div
          className={`t-btn list-open${hasVal ? ' has-val sel' : ''}`}
          onClick={() => onOpenModal({
            type: 'dropdown',
            columnId: col.id,
            title: col.name,
            options: col.listOptions,
            centerOn: col.centerOn,
          })}
        >
          {display}
        </div>
      </div>
    );
  }

  function renderNumpad() {
    const hasVal = v !== '' && v !== undefined && v !== null;
    return (
      <div className="btn-grid bg-1">
        <input
          type="number"
          inputMode="numeric"
          pattern="[0-9-]*"
          className={`numpad-input${hasVal ? ' has-val' : ''}`}
          value={hasVal ? v : ''}
          placeholder={col.name}
          onFocus={e => e.target.select()}
          onChange={e => onSetValue(col.id, e.target.value)}
          onBlur={e => onSetValue(col.id, e.target.value)}
        />
      </div>
    );
  }

  function renderInner() {
    switch (col.type) {
      case 'modal-list': return renderModalList();
      case 'numpad': return renderNumpad();
      case 'buttons':
      default: return renderButtons();
    }
  }

  return (
    <div className="col-card">
      <div className="col-card-hdr">
        <div className="col-card-name">{col.name}</div>
      </div>
      <div className="col-card-body" style={{ padding: 8 }}>
        {renderInner()}
      </div>
    </div>
  );
}
