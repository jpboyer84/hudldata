// ColumnCard — handles all column types: buttons, btns_dd, btn_dds, numpad
// Matches HTML renderColumn + renderColInner exactly

export default function ColumnCard({ col, value, onSetValue, onOpenModal, onEditButtons }) {
  const v = value ?? '';
  const colKey = col.dataKey || col.id;

  function handleBtnClick(btnValue) {
    onSetValue(colKey, v === btnValue ? '' : btnValue);
  }

  function gridCls(n) {
    if (n <= 2) return 'bg-2';
    if (n === 3) return 'bg-3';
    if (n === 5) return 'bg-5';
    return 'bg-4';
  }

  // ── TYPE: buttons ──
  function renderButtons() {
    const btns = col.btns || [];
    if (btns.length === 0) return <div style={{ padding: 8, color: 'var(--color-muted)', fontSize: 12, textAlign: 'center' }}>No buttons</div>;
    const gc = gridCls(btns.length);
    return (
      <div className={`btn-grid ${gc}`}>
        {btns.map((btn, i) => {
          const sel = v === btn.v;
          return (
            <div
              key={i}
              className={`t-btn${sel ? ' sel' : ''}${btns.length > 4 ? ' sm' : ''}`}
              onClick={() => handleBtnClick(btn.v)}
            >
              {btn.l}
            </div>
          );
        })}
      </div>
    );
  }

  // ── TYPE: btns_dd (buttons + dropdown trigger) ──
  function renderBtnsDd() {
    const btns = col.btns || [];
    const btnVals = new Set(btns.map(b => b.v));
    const ddSelected = v && !btnVals.has(v) && (col.dd || []).includes(v);
    const allItems = [...btns.map(b => b), { isDd: true }];
    const gc = gridCls(allItems.length);
    return (
      <div className={`btn-grid ${gc}`}>
        {btns.map((btn, i) => {
          const sel = v === btn.v;
          return (
            <div
              key={i}
              className={`t-btn${sel ? ' sel' : ''}${allItems.length > 4 ? ' sm' : ''}`}
              onClick={() => handleBtnClick(btn.v)}
            >
              {btn.l}
            </div>
          );
        })}
        <div
          className={`t-btn${ddSelected ? ' sel' : ''}${allItems.length > 4 ? ' sm' : ''}`}
          onClick={() => onOpenModal({
            type: 'dropdown',
            columnId: colKey,
            title: col.name,
            options: col.dd || [],
            centerOn: v,
          })}
          style={ddSelected ? {} : { color: 'var(--color-accent)' }}
        >
          {ddSelected ? v : (col.ddLbl || '▼')}
        </div>
      </div>
    );
  }

  // ── TYPE: btn_dds (each button opens its own sub-dropdown) ──
  function renderBtnDds() {
    const btns = col.btns || [];
    const gc = gridCls(btns.length);
    return (
      <div className={`btn-grid ${gc}`}>
        {btns.map((btn, i) => {
          // Check if current value is one of this button's options
          const sel = btn.opts && btn.opts.includes(v);
          return (
            <div
              key={i}
              className={`t-btn${sel ? ' sel' : ''}${btns.length > 4 ? ' sm' : ''}`}
              onClick={() => onOpenModal({
                type: 'dropdown',
                columnId: colKey,
                title: `${col.name} — ${btn.l}`,
                options: btn.opts || [],
              })}
            >
              {sel ? v : btn.l}
            </div>
          );
        })}
      </div>
    );
  }

  // ── TYPE: numpad ──
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
          onChange={e => onSetValue(colKey, e.target.value)}
        />
      </div>
    );
  }

  function renderInner() {
    switch (col.type) {
      case 'buttons':  return renderButtons();
      case 'btns_dd':  return renderBtnsDd();
      case 'btn_dds':  return renderBtnDds();
      case 'numpad':   return renderNumpad();
      case 'calc':     return <div className="btn-grid bg-1"><div className="t-btn" style={{ cursor: 'default', color: 'var(--color-muted)' }}>{v || '—'}</div></div>;
      default:         return renderButtons();
    }
  }

  return (
    <div className="col-card">
      <div className="col-card-hdr">
        <div className="col-card-name">{col.name}</div>
        {onEditButtons && (col.btns || col.dd) && (
          <div onClick={(e) => { e.stopPropagation(); onEditButtons(col.id); }}
            style={{ fontSize: 12, color: 'var(--color-muted)', cursor: 'pointer', padding: '2px 6px', WebkitTapHighlightColor: 'transparent' }}>⚙</div>
        )}
      </div>
      <div className="col-card-body" style={{ padding: 8 }}>
        {renderInner()}
      </div>
    </div>
  );
}

