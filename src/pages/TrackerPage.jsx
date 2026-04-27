import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { fetchGame, updateGame, fetchTemplates, fetchColumns } from '../lib/supaData';
import { DEFAULT_COLUMNS, defaultColumns, resolveTemplateColumns, getColumnById } from '../columns';
import ColumnCard from '../components/ColumnCard';
import ConfirmModal from '../components/ConfirmModal';
import { DropdownModal, PlayNavModal, EditGameModal } from '../components/Modals';
import { exportGameXLSX } from '../utils/xlsxExport';
import { sendToHudl, fetchHudlColumnSets } from '../lib/hudlData';
import VoiceMode from '../components/VoiceMode';

const INITIAL_PLAYS = 200;
const emptyPlays = n => Array.from({ length: n }, () => ({}));

export default function TrackerPage() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { coach } = useAuth();
  const showToast = useToast();

  const [game, setGame] = useState(null);
  const [plays, setPlays] = useState([]);
  const [columns, setColumns] = useState(DEFAULT_COLUMNS);
  const [playIdx, setPlayIdx] = useState(0);
  const [layoutCols, setLayoutCols] = useState(1);
  const [layoutOpen, setLayoutOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);
  const [hudlSyncActive, setHudlSyncActive] = useState(false);

  // ─── HUDL EXTENSION SYNC ───
  useEffect(() => {
    function handleSyncMessage(event) {
      if (event.source !== window) return;
      if (!event.data || event.data.source !== 'assistant-coach-sync') return;

      if (event.data.type === 'extension-ready') {
        setHudlSyncActive(true);
      }
      if (event.data.type === 'clip-changed') {
        // Hudl advanced to a new clip → advance our tracker to match
        const idx = event.data.clipIndex;
        if (idx >= 0 && idx < plays.length && idx !== playIdx) {
          setPlayIdx(idx);
          showToast(`Synced to clip ${idx + 1}`);
        }
      }
    }
    window.addEventListener('message', handleSyncMessage);
    return () => window.removeEventListener('message', handleSyncMessage);
  }, [plays.length, playIdx]);
  const [modal, setModal] = useState(null);
  const [jumpOpen, setJumpOpen] = useState(false);
  const [editGameOpen, setEditGameOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState(null);
  // In-game modals
  const [colPickerOpen, setColPickerOpen] = useState(false);
  const [tmplSwitcherOpen, setTmplSwitcherOpen] = useState(false);
  const [saveAsOpen, setSaveAsOpen] = useState(false);
  const [saveAsName, setSaveAsName] = useState('');
  // Hudl push
  const [hudlPushOpen, setHudlPushOpen] = useState(false);
  // Column button editor (#9)
  const [btnEditorCol, setBtnEditorCol] = useState(null);
  const [btnEditorInput, setBtnEditorInput] = useState('');
  // Spreadsheet view
  const [sheetViewOpen, setSheetViewOpen] = useState(false);
  // Templates for switcher
  const [allTemplates, setAllTemplates] = useState([]);

  const saveTimer = useRef(null);
  const autoTimer = useRef(null);
  const clearAllBackup = useRef(null);
  const playsRef = useRef(plays);
  const columnsRef = useRef(columns);
  playsRef.current = plays;
  columnsRef.current = columns;

  // ─── LOAD GAME ───
  useEffect(() => {
    if (!gameId) return;
    fetchGame(gameId).then(g => {
      setGame(g);
      const p = Array.isArray(g.plays) && g.plays.length > 0 ? g.plays : emptyPlays(INITIAL_PLAYS);
      setPlays(p);
      if (g.columns_config && Array.isArray(g.columns_config) && g.columns_config.length > 0) {
        setColumns(g.columns_config);
      } else if (location.state?.colIds) {
        // Hudl template: resolve col_ids from navigation state
        const allCols = defaultColumns();
        const resolved = location.state.colIds.map(id => allCols.find(c => c.id === id)).filter(Boolean);
        if (resolved.length > 0) setColumns(resolved);
      }
      // Restore play position from game record
      if (g.play_position != null && g.play_position < p.length) setPlayIdx(g.play_position);
    }).catch(err => showToast('Failed to load game'));

    if (coach?.team_id) {
      fetchTemplates(coach.team_id).then(supaTemplates => {
        // Also fetch Hudl column sets if connected
        if (coach.hudl_cookie) {
          fetchHudlColumnSets(coach).then(hudlTmpls => {
            setAllTemplates([...supaTemplates, ...hudlTmpls]);
          }).catch(() => setAllTemplates(supaTemplates));
        } else {
          setAllTemplates(supaTemplates);
        }
      }).catch(() => {});
    }
  }, [gameId, coach?.team_id]);

  // ─── AUTO-SAVE ───
  const persist = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      if (!gameId) return;
      updateGame(gameId, { plays: playsRef.current }).catch(() => {});
    }, 800);
  }, [gameId]);

  useEffect(() => () => { if (saveTimer.current) clearTimeout(saveTimer.current); }, []);

  const currentPlay = plays[playIdx] || {};

  // ─── SET VALUE ───
  function setVal(colId, value) {
    setPlays(prev => {
      const next = [...prev];
      if (!next[playIdx]) next[playIdx] = {};
      next[playIdx] = { ...next[playIdx], [colId]: value || undefined };
      if (!value) delete next[playIdx][colId];
      return next;
    });
    persist();
    // Check auto-advance (#1)
    setTimeout(() => checkAutoAdvance(), 50);
  }

  // ─── AUTO-ADVANCE (#1) ───
  function checkAutoAdvance() {
    if (autoTimer.current) clearTimeout(autoTimer.current);
    const play = playsRef.current[playIdx] || {};
    const allDone = columnsRef.current.every(c => {
      const key = c.dataKey || c.id;
      return play[key] && play[key] !== '';
    });
    if (allDone) {
      autoTimer.current = setTimeout(() => {
        nextPlay();
      }, 400);
    }
  }

  // ─── COUNTS ───
  const filledCount = plays.filter(p => p && Object.keys(p).filter(k => !k.startsWith('_')).length > 0).length;
  const filledSet = new Set(plays.map((p, i) => (p && Object.keys(p).filter(k => !k.startsWith('_')).length > 0) ? i : -1).filter(i => i >= 0));

  // ─── NAVIGATION ───
  function nextPlay() {
    if (!plays[playIdx]) return;
    const cur = plays[playIdx] || {};
    const nextData = plays[playIdx + 1] || {};

    // Always carry forward: ODK, QTR (coach only changes these when they actually change)
    if (!nextData.odk && cur.odk) nextData.odk = cur.odk;
    if (!nextData.qtr && cur.qtr) nextData.qtr = cur.qtr;

    // Auto-fill next play's DN and DIST based on current gain/loss
    if (cur.odk !== 'K' && cur.odk !== 'S') {
      const curDn = parseInt(cur.dn);
      const curDist = parseFloat(cur.dist2);
      const curGL = parseFloat(cur.gainloss);

      if (!isNaN(curDn) && !isNaN(curDist) && !isNaN(curGL) && !nextData.dn && !nextData.dist2) {
        if (curGL >= curDist) {
          nextData.dn = '1';
          nextData.dist2 = '10';
        } else if (curDn < 4) {
          nextData.dn = String(curDn + 1);
          nextData.dist2 = String(Math.round(curDist - curGL));
        }
      }
    }

    // Apply carry-forward data
    if (Object.keys(nextData).length > 0) {
      setPlays(prev => {
        const arr = [...prev];
        if (!arr[playIdx + 1]) arr[playIdx + 1] = {};
        arr[playIdx + 1] = { ...arr[playIdx + 1], ...nextData };
        return arr;
      });
      persist();
    }

    let next = playIdx + 1;
    if (next >= plays.length) {
      setPlays(prev => [...prev, ...emptyPlays(50)]);
      next = plays.length;
    }
    setPlayIdx(next);
    // Sync to Hudl extension if connected
    if (hudlSyncActive) {
      window.postMessage({ source: 'assistant-coach-sync', action: 'next-clip' }, '*');
    }
  }

  function prevPlay() {
    if (playIdx > 0) {
      setPlayIdx(playIdx - 1);
      if (hudlSyncActive) {
        window.postMessage({ source: 'assistant-coach-sync', action: 'prev-clip' }, '*');
      }
    }
  }

  function addRows() {
    setPlays(prev => [...prev, ...emptyPlays(25)]);
    showToast('25 rows added');
  }

  // ─── COLUMN BUTTON EDITOR (#9) ───
  function openBtnEditor(colId) {
    const col = columns.find(c => c.id === colId);
    if (col) { setBtnEditorCol({ ...col }); setBtnEditorInput(''); }
  }

  function addBtnToCol() {
    const label = btnEditorInput.trim();
    if (!label || !btnEditorCol) return;
    setBtnEditorInput('');
    const col = { ...btnEditorCol };
    if (col.type === 'btn_dds') {
      if (!col.btns.some(b => b.l.toLowerCase() === label.toLowerCase())) {
        col.btns = [...col.btns, { l: label, opts: [label] }];
      }
    } else if (col.btns) {
      if (!col.btns.some(b => b.l.toLowerCase() === label.toUpperCase().toLowerCase())) {
        col.btns = [...col.btns, { l: label.toUpperCase(), v: label }];
      }
    } else if (col.dd) {
      if (!col.dd.some(d => d.toLowerCase() === label.toLowerCase())) {
        col.dd = [...col.dd, label];
      }
    }
    setBtnEditorCol(col);
    setColumns(prev => prev.map(c => c.id === col.id ? col : c));
  }

  function removeBtnFromCol(idx) {
    if (!btnEditorCol) return;
    const col = { ...btnEditorCol };
    if (col.btns) {
      col.btns = col.btns.filter((_, i) => i !== idx);
    } else if (col.dd) {
      col.dd = col.dd.filter((_, i) => i !== idx);
    }
    setBtnEditorCol(col);
    setColumns(prev => prev.map(c => c.id === col.id ? col : c));
  }

  // ─── LEAVE TRACKER (#4) ───
  function leaveTracker() {
    if (game?.id) {
      updateGame(game.id, { play_position: playIdx }).catch(() => {});
    }
    navigate('/');
  }

  // ─── CLEAR ───
  function clearRow() {
    setPlays(prev => { const n = [...prev]; n[playIdx] = {}; return n; });
    persist();
    showToast(`Play #${playIdx + 1} cleared`);
  }

  // Clear all with undo (#5)
  function clearAll() {
    setConfirmModal({
      title: 'Clear all plays?',
      message: 'This will erase all play data for this game.',
      danger: true,
      onConfirm: () => {
        clearAllBackup.current = { plays: JSON.parse(JSON.stringify(plays)), playIdx };
        setPlays(emptyPlays(INITIAL_PLAYS));
        setPlayIdx(0);
        persist();
        setConfirmModal(null);
        showUndoToast();
      },
    });
  }

  function showUndoToast() {
    showToast('All plays cleared — tap here to UNDO', 8000, () => {
      if (!clearAllBackup.current) return;
      setPlays(clearAllBackup.current.plays);
      setPlayIdx(clearAllBackup.current.playIdx);
      clearAllBackup.current = null;
      persist();
      showToast('Undo successful');
    });
  }

  // ─── EDIT GAME INFO ───
  async function handleEditGameSave(updates) {
    try {
      const updated = await updateGame(gameId, updates);
      setGame(prev => ({ ...prev, ...updated }));
      setEditGameOpen(false);
      showToast('Game info updated');
    } catch (err) { showToast('Failed to update: ' + err.message); }
  }

  // ─── EXPORT ───
  function handleExport() {
    setMenuOpen(false);
    try {
      exportGameXLSX(game, plays, columns);
      showToast('Exported to XLSX');
    } catch (err) { showToast('Export failed: ' + err.message); }
  }

  // ─── SEND TO HUDL (#18) ───
  function openHudlPush() {
    setMenuOpen(false);
    if (!coach?.hudl_cookie) { showToast('Connect to Hudl first (Settings)'); return; }
    if (!game?.hudl_cutup_id) { showToast('This game was not loaded from Hudl'); return; }
    setHudlPushOpen(true);
  }

  // ─── SWITCH TEMPLATE (#6) ───
  function handleSwitchTemplate(tmpl) {
    const allCols = defaultColumns();
    const newCols = (tmpl.col_ids || tmpl.colIds || []).map(id => allCols.find(c => c.id === id)).filter(Boolean);
    if (newCols.length === 0) { showToast('Template has no columns'); return; }
    setColumns(newCols);
    setTmplSwitcherOpen(false);
    showToast(`Switched to "${tmpl.name}"`);
  }

  // ─── SAVE AS TEMPLATE (#7) ───
  async function handleSaveAsTemplate() {
    if (!saveAsName.trim() || !coach?.team_id) return;
    try {
      const { createTemplate } = await import('../lib/supaData');
      const colIds = columns.map(c => c.id);
      await createTemplate({
        team_id: coach.team_id,
        name: saveAsName.trim(),
        col_ids: colIds,
        sort_order: 0,
      });
      // Also sync to Hudl as a column set
      const { syncTemplateToHudl } = await import('../lib/hudlData');
      const hudlResult = await syncTemplateToHudl(saveAsName.trim(), colIds, coach);
      setSaveAsOpen(false);
      setSaveAsName('');
      showToast(hudlResult ? 'Template saved + synced to Hudl' : 'Template saved');
    } catch (err) { showToast('Save failed: ' + err.message); }
  }

  // ─── ADD/REMOVE COLUMN IN-GAME (#8) ───
  function addTrackerCol(colId) {
    const allCols = defaultColumns();
    const col = allCols.find(c => c.id === colId);
    if (col) {
      setColumns(prev => [...prev, col]);
      showToast(`Added ${col.name}`);
    }
  }

  function removeTrackerCol(colId) {
    setColumns(prev => prev.filter(c => c.id !== colId));
  }

  // ─── TITLE ───
  const gameTitle = game
    ? (game.home && game.away ? `${game.home} vs ${game.away}` : game.home || game.away || game.hudl_source || 'Game')
    : 'Loading…';

  if (!game) {
    return (
      <div className="view">
        <div className="hdr">
          <button className="hdr-btn" onClick={() => navigate(-1)}>← Back</button>
          <div className="hdr-title">Loading…</div>
          <div style={{ width: 60 }} />
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-muted)' }}>Loading game…</div>
      </div>
    );
  }

  const allCols = defaultColumns();
  const activeIds = new Set(columns.map(c => c.id));
  const availableCols = allCols.filter(c => !activeIds.has(c.id));

  // Hudl push data
  const playsWithClipIds = plays.filter(p => p._clipId && Object.keys(p).some(k => k !== '_clipId' && p[k]));

  // ─── VOICE MODE HANDLERS ───
  function handleVoiceValues(parsed) {
    for (const [colId, value] of Object.entries(parsed)) {
      if (colId.startsWith('_')) continue;
      setVal(colId, value);
    }
  }

  function handleVoiceCommand(cmd) {
    switch (cmd) {
      case 'next': nextPlay(); break;
      case 'prev': prevPlay(); break;
      case 'clear': clearRow(); break;
      case 'stop': setVoiceActive(false); break;
      default: break;
    }
  }

  return (
    <div className="view" style={{ position: 'relative' }}>
      {/* Header */}
      <div className="hdr">
        <button className="hdr-btn" onClick={leaveTracker}>← Back</button>
        <div className="hdr-title" onClick={() => setEditGameOpen(true)} style={{ cursor: 'pointer' }}>{gameTitle}</div>
        <div style={{ display: 'flex', gap: 5 }}>
          {game.hudl_cutup_id && (
            <button className="hdr-btn" style={{ color: '#27ae60' }} onClick={openHudlPush}>▲ Send</button>
          )}
          {hudlSyncActive && (
            <div style={{ fontSize: 9, fontWeight: 700, color: '#22c55e', background: 'rgba(34,197,94,0.12)', padding: '4px 8px', borderRadius: 6, letterSpacing: '0.03em' }}>SYNCED</div>
          )}
          <div style={{ position: 'relative' }}>
            <button className="hdr-btn" onClick={() => setLayoutOpen(!layoutOpen)}>Layout ▾</button>
            {layoutOpen && (
              <div className="dd" style={{ right: 0, top: '100%', minWidth: 120 }}>
                <div className="dd-item" onClick={() => { setLayoutCols(1); setLayoutOpen(false); }} style={{ fontWeight: layoutCols === 1 ? 700 : 400, color: layoutCols === 1 ? 'var(--color-accent)' : 'var(--color-text)' }}>1 Column</div>
                <div className="dd-item" onClick={() => { setLayoutCols(2); setLayoutOpen(false); }} style={{ fontWeight: layoutCols === 2 ? 700 : 400, color: layoutCols === 2 ? 'var(--color-accent)' : 'var(--color-text)' }}>2 Columns</div>
              </div>
            )}
          </div>
          <button className="hdr-btn" onClick={() => setMenuOpen(!menuOpen)}>Menu</button>
        </div>
      </div>

      {/* Center-screen menu overlay */}
      {menuOpen && (
        <div className="overlay open" onClick={e => { if (e.target === e.currentTarget) setMenuOpen(false); }}>
          <div className="modal" style={{ maxWidth: 320 }}>
            <div className="modal-hdr">
              <div className="modal-title">MENU</div>
              <div className="modal-x" onClick={() => setMenuOpen(false)}>✕</div>
            </div>
            <div style={{ overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <div className="tracker-menu-item" onClick={() => { setMenuOpen(false); setSheetViewOpen(true); }}>📊 Open Spreadsheet</div>
              <div className="tracker-menu-item" onClick={() => {
                setMenuOpen(false);
                // Pass this game's plays directly to Stats page
                const activePlays = plays.filter(p => Object.keys(p).length > 0 && p.ignore !== 'SKIP');
                const title = game ? `${game.home || ''} vs ${game.away || ''}`.trim() || 'Current Game' : 'Current Game';
                navigate('/stats', { state: { directPlays: activePlays, directLabel: title } });
              }} style={{ color: 'var(--color-blue)' }}>📈 Stats & Analysis</div>
              <div className="tracker-menu-item" onClick={() => { setMenuOpen(false); setColPickerOpen(true); }}>➕ Add / remove columns</div>
              <div className="tracker-menu-item" onClick={() => { setMenuOpen(false); setSaveAsOpen(true); setSaveAsName(''); }}>💾 Save as template</div>
              <div className="tracker-menu-item" onClick={() => { setMenuOpen(false); setTmplSwitcherOpen(true); }}>📋 Switch template</div>
              <div className="tracker-menu-item" onClick={handleExport}>📥 Export XLSX</div>
              <div className="tracker-menu-item" onClick={() => { setMenuOpen(false); clearRow(); }} style={{ color: 'var(--color-yellow)' }}>✕ Clear row</div>
              <div className="tracker-menu-item" onClick={() => { setMenuOpen(false); clearAll(); }} style={{ color: 'var(--color-red)' }}>🗑 Clear all</div>
            </div>
          </div>
        </div>
      )}

      {/* Sheet bar */}
      <div className="sheet-bar">
        <div className="s-cell play-cell" onClick={() => setJumpOpen(true)}>
          <span className="s-cell-lbl">Play</span>
          <span className="s-cell-val">{playIdx + 1}</span>
        </div>
        {columns.map(col => (
          <div key={col.id} className="s-cell" onClick={() => setJumpOpen(true)}>
            <span className="s-cell-lbl">{col.name}</span>
            <span className="s-cell-val" style={{ color: currentPlay[col.dataKey || col.id] ? 'var(--color-muted2)' : '#333' }}>
              {currentPlay[col.dataKey || col.id] || '·'}
            </span>
          </div>
        ))}
      </div>

      {/* Tracker body */}
      <div className="tracker-body">
        <div className="col-grid" style={{ gridTemplateColumns: layoutCols === 1 ? '1fr' : '1fr 1fr' }}>
          {columns.map(col => (
            <ColumnCard key={col.id} col={col} value={currentPlay[col.dataKey || col.id] ?? null} onSetValue={setVal} onOpenModal={setModal} onEditButtons={openBtnEditor} />
          ))}
        </div>
      </div>

      {/* Nav bar */}
      {/* Voice mode bar */}
      <VoiceMode
        active={voiceActive}
        onToggle={() => setVoiceActive(!voiceActive)}
        onValues={handleVoiceValues}
        onCommand={handleVoiceCommand}
      />

      <div className="nav-bar">
        <button className="nav-btn nav-prev" onClick={prevPlay} disabled={playIdx === 0}>← Prev</button>
        <button
          className="nav-btn"
          onClick={() => setVoiceActive(!voiceActive)}
          style={{
            fontSize: 16, padding: '8px 12px', flexShrink: 0,
            background: voiceActive ? '#ef4444' : 'var(--color-surface2)',
            color: voiceActive ? '#fff' : 'var(--color-text)',
            border: `1px solid ${voiceActive ? '#ef4444' : 'var(--color-border)'}`,
            borderRadius: 8,
          }}
        >
          {voiceActive ? '⏹' : '🎤'}
        </button>
        <button className="nav-btn nav-mid" onClick={addRows} style={{ fontSize: 11 }}>+ Rows</button>
        <button className="nav-btn nav-new" onClick={nextPlay}>Next play →</button>
      </div>

      {/* ═══ MODALS ═══ */}

      {/* Dropdown modal */}
      {modal?.type === 'dropdown' && (
        <DropdownModal title={modal.title} options={modal.options} currentValue={currentPlay[modal.columnId] ?? null}
          onSelect={val => setVal(modal.columnId, val)} onClose={() => setModal(null)} centerOn={modal.centerOn} />
      )}

      {/* Jump to play */}
      {jumpOpen && (
        <PlayNavModal current={playIdx} max={Math.min(plays.length, Math.max(filledCount + 10, 20))}
          filledSet={filledSet} onJump={setPlayIdx} onClose={() => setJumpOpen(false)} />
      )}

      {/* Edit game info */}
      <EditGameModal open={editGameOpen} game={game} onSave={handleEditGameSave} onClose={() => setEditGameOpen(false)} />

      {/* Confirm */}
      <ConfirmModal open={!!confirmModal} title={confirmModal?.title} message={confirmModal?.message}
        danger={confirmModal?.danger} onConfirm={confirmModal?.onConfirm} onCancel={() => setConfirmModal(null)} />

      {/* Column picker (#8) */}
      {colPickerOpen && (
        <div className="overlay open" onClick={e => { if (e.target === e.currentTarget) setColPickerOpen(false); }}>
          <div className="modal" style={{ maxHeight: '80dvh' }}>
            <div className="modal-hdr">
              <div className="modal-title">COLUMNS</div>
              <div className="modal-x" onClick={() => setColPickerOpen(false)}>✕</div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 14, WebkitOverflowScrolling: 'touch' }}>
              <div className="sec-label">Active ({columns.length})</div>
              {columns.map(c => (
                <div key={c.id} className="col-pick sel" style={{ marginBottom: 6 }}>
                  <div style={{ flex: 1 }}><div className="col-pick-name">{c.name}</div></div>
                  <button onClick={() => removeTrackerCol(c.id)} style={{ background: 'none', border: '1px solid var(--color-red)', color: 'var(--color-red)', borderRadius: 6, padding: '4px 8px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>✕</button>
                </div>
              ))}
              <div className="sec-label" style={{ marginTop: 10 }}>Available ({availableCols.length})</div>
              {availableCols.map(c => (
                <div key={c.id} className="col-pick" onClick={() => addTrackerCol(c.id)} style={{ marginBottom: 6 }}>
                  <div style={{ flex: 1 }}><div className="col-pick-name">{c.name}</div></div>
                  <span style={{ color: 'var(--color-green)', fontWeight: 700, fontSize: 16 }}>+</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Column button editor (#9) */}
      {btnEditorCol && (
        <div className="overlay open" onClick={e => { if (e.target === e.currentTarget) setBtnEditorCol(null); }}>
          <div className="modal" style={{ maxHeight: '75dvh' }}>
            <div className="modal-hdr">
              <div className="modal-title">{btnEditorCol.name}</div>
              <div className="modal-x" onClick={() => setBtnEditorCol(null)}>✕</div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
              {(btnEditorCol.btns || []).map((b, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', borderBottom: '1px solid var(--color-border)' }}>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{b.l || b}</span>
                  <button onClick={() => removeBtnFromCol(i)} style={{ background: 'none', border: '1px solid var(--color-red)', color: 'var(--color-red)', borderRadius: 6, padding: '4px 10px', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>✕</button>
                </div>
              ))}
              {btnEditorCol.dd && !btnEditorCol.btns && btnEditorCol.dd.map((d, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', borderBottom: '1px solid var(--color-border)' }}>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{d}</span>
                  <button onClick={() => removeBtnFromCol(i)} style={{ background: 'none', border: '1px solid var(--color-red)', color: 'var(--color-red)', borderRadius: 6, padding: '4px 10px', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>✕</button>
                </div>
              ))}
              {(!btnEditorCol.btns || btnEditorCol.btns.length === 0) && (!btnEditorCol.dd || btnEditorCol.dd.length === 0) && (
                <div style={{ padding: 16, fontSize: 12, color: 'var(--color-muted)', textAlign: 'center' }}>No buttons</div>
              )}
            </div>
            <div style={{ padding: '10px 14px', borderTop: '1px solid var(--color-border)', display: 'flex', gap: 8, flexShrink: 0 }}>
              <input className="fi" value={btnEditorInput} onChange={e => setBtnEditorInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addBtnToCol()}
                placeholder="New button label…" style={{ flex: 1, fontSize: 13, padding: '10px 12px' }} autoFocus />
              <button className="btn btn-primary" onClick={addBtnToCol} style={{ padding: '10px 16px', fontSize: 13, flexShrink: 0 }}>Add</button>
            </div>
          </div>
        </div>
      )}

      {/* Template switcher (#6) */}
      {tmplSwitcherOpen && (
        <div className="overlay open" onClick={e => { if (e.target === e.currentTarget) setTmplSwitcherOpen(false); }}>
          <div className="modal" style={{ maxHeight: '60dvh' }}>
            <div className="modal-hdr">
              <div className="modal-title">SWITCH TEMPLATE</div>
              <div className="modal-x" onClick={() => setTmplSwitcherOpen(false)}>✕</div>
            </div>
            <div className="list-scroll">
              {allTemplates.map(t => (
                <div key={t.id} className="dd-item" onClick={() => handleSwitchTemplate(t)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{t.name}</span>
                  {t.isHudl && <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--color-accent)', background: 'rgba(232,89,12,0.12)', padding: '2px 6px', borderRadius: 4 }}>HUDL</span>}
                </div>
              ))}
              {allTemplates.length === 0 && <div style={{ padding: 20, textAlign: 'center', color: 'var(--color-muted)', fontSize: 13 }}>No templates saved yet</div>}
            </div>
          </div>
        </div>
      )}

      {/* Save as template (#7) */}
      {saveAsOpen && (
        <div className="overlay open" onClick={e => { if (e.target === e.currentTarget) setSaveAsOpen(false); }}>
          <div className="modal" style={{ maxWidth: 340 }}>
            <div className="modal-hdr">
              <div className="modal-title">SAVE AS TEMPLATE</div>
              <div className="modal-x" onClick={() => setSaveAsOpen(false)}>✕</div>
            </div>
            <div className="modal-body">
              <div className="fg">
                <label className="fl">Template name</label>
                <input className="fi" value={saveAsName} onChange={e => setSaveAsName(e.target.value)}
                  placeholder="e.g. ODK Defense" onKeyDown={e => e.key === 'Enter' && handleSaveAsTemplate()} autoFocus />
              </div>
              <div style={{ fontSize: 11, color: 'var(--color-muted)' }}>
                Saves the current {columns.length} columns as a reusable template.
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn btn-secondary" onClick={() => setSaveAsOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSaveAsTemplate}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Hudl push with field selection (#18) */}
      {/* Spreadsheet view */}
      {sheetViewOpen && (
        <div className="overlay open" onClick={e => { if (e.target === e.currentTarget) setSheetViewOpen(false); }}>
          <div style={{
            background: 'var(--color-bg)', borderRadius: 16, width: '96%', maxWidth: 900,
            height: '90dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
            border: '1px solid var(--color-border)',
          }}>
            <div className="modal-hdr">
              <div className="modal-title">SPREADSHEET</div>
              <div className="modal-x" onClick={() => setSheetViewOpen(false)}>✕</div>
            </div>
            <div style={{ flex: 1, overflow: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table style={{ borderCollapse: 'collapse', fontSize: 12, fontFamily: 'var(--font-ui)', minWidth: '100%' }}>
                <thead>
                  <tr style={{ position: 'sticky', top: 0, zIndex: 2, background: 'var(--color-surface)' }}>
                    <th style={{ padding: '10px 8px', borderBottom: '2px solid var(--color-border)', color: 'var(--color-accent)', fontWeight: 700, fontSize: 11, whiteSpace: 'nowrap', textAlign: 'center', minWidth: 36 }}>#</th>
                    {columns.map(col => (
                      <th key={col.id} style={{ padding: '10px 8px', borderBottom: '2px solid var(--color-border)', fontWeight: 700, fontSize: 11, whiteSpace: 'nowrap', textAlign: 'center', minWidth: 50, color: 'var(--color-muted2)' }}>{col.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {plays.slice(0, Math.max(filledCount + 5, 20)).map((play, i) => {
                    const filled = play && Object.keys(play).filter(k => !k.startsWith('_')).length > 0;
                    const isCurrent = i === playIdx;
                    return (
                      <tr key={i} onClick={() => { setPlayIdx(i); setSheetViewOpen(false); }}
                        style={{
                          cursor: 'pointer', background: isCurrent ? 'rgba(232,89,12,0.1)' : filled ? 'var(--color-surface)' : 'transparent',
                          borderBottom: '1px solid var(--color-border)',
                        }}>
                        <td style={{ padding: '8px 6px', textAlign: 'center', fontWeight: 700, color: isCurrent ? 'var(--color-accent)' : 'var(--color-muted)', fontSize: 11 }}>{i + 1}</td>
                        {columns.map(col => {
                          const key = col.dataKey || col.id;
                          const val = play?.[key] || '';
                          return (
                            <td key={col.id} style={{ padding: '6px 4px', textAlign: 'center', fontSize: 12, minWidth: 40 }}>
                              <input
                                type="text"
                                value={val}
                                onChange={e => {
                                  const newVal = e.target.value;
                                  setPlays(prev => {
                                    const next = [...prev];
                                    if (!next[i]) next[i] = {};
                                    next[i] = { ...next[i], [key]: newVal || undefined };
                                    if (!newVal) delete next[i][key];
                                    return next;
                                  });
                                  persist();
                                }}
                                style={{
                                  width: '100%', minWidth: 40, padding: '4px 3px', fontSize: 12, fontFamily: 'var(--font-ui)',
                                  background: 'transparent', border: '1px solid transparent', borderRadius: 4, textAlign: 'center',
                                  color: 'var(--color-text)', outline: 'none',
                                }}
                                onFocus={e => { e.target.style.borderColor = 'var(--color-accent)'; e.target.style.background = 'var(--color-surface)'; }}
                                onBlur={e => { e.target.style.borderColor = 'transparent'; e.target.style.background = 'transparent'; }}
                                onClick={e => e.stopPropagation()}
                              />
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {hudlPushOpen && (
        <HudlPushModal
          plays={plays}
          cutupId={game?.hudl_cutup_id}
          coach={coach}
          onClose={() => setHudlPushOpen(false)}
          onSuccess={msg => { setHudlPushOpen(false); showToast(msg); }}
          onError={msg => showToast(msg)}
        />
      )}
    </div>
  );
}

// ═══ HUDL PUSH MODAL (#18) — field selection, counts, overwrite warning ═══
function HudlPushModal({ plays, cutupId, coach, onClose, onSuccess, onError }) {
  const [pushing, setPushing] = useState(false);
  const [checkedKeys, setCheckedKeys] = useState(new Set());

  // Column map matching HTML HUDL_COL_MAP exactly
  const HUDL_COL_MAP = {
    odk:      { hudlName: 'ODK',       hudlId: 2626912 },
    qtr:      { hudlName: 'QTR',       hudlId: 2626932 },
    dn:       { hudlName: 'DN',        hudlId: 2626907 },
    yardln:   { hudlName: 'YARD LN',   hudlId: 2626913 },
    hash:     { hudlName: 'HASH',      hudlId: 2626914 },
    playtype: { hudlName: 'PLAY TYPE', hudlId: 2626909 },
    result:   { hudlName: 'RESULT',    hudlId: 2626910 },
    gainloss: { hudlName: 'GN/LS',     hudlId: 2626911 },
    series:   { hudlName: 'SERIES',    hudlId: 2626915 },
    offform:  { hudlName: 'OFF FORM',  hudlId: 2626917 },
    offplay:  { hudlName: 'OFF PLAY',  hudlId: 2626918 },
  };

  const playsWithData = plays.filter(p => p._clipId && Object.keys(p).some(k => k !== '_clipId' && p[k]));

  // Count which columns have data
  const activeCounts = {};
  const sampleValues = {};
  for (const p of playsWithData) {
    for (const key of Object.keys(HUDL_COL_MAP)) {
      const val = p[key];
      if (val && String(val).trim()) {
        activeCounts[key] = (activeCounts[key] || 0) + 1;
        if (!sampleValues[key]) sampleValues[key] = String(val);
      }
    }
  }
  const mappable = Object.entries(activeCounts).sort((a, b) => b[1] - a[1]);

  // Init all checked
  useEffect(() => { setCheckedKeys(new Set(mappable.map(([k]) => k))); }, []);

  function toggleKey(key) {
    setCheckedKeys(prev => {
      const n = new Set(prev);
      if (n.has(key)) n.delete(key); else n.add(key);
      return n;
    });
  }

  async function handlePush() {
    if (checkedKeys.size === 0) { onError('Select at least one column'); return; }
    setPushing(true);

    const columnMap = {};
    const selectedKeys = [...checkedKeys];
    for (const key of selectedKeys) {
      const m = HUDL_COL_MAP[key];
      if (m) columnMap[m.hudlName] = m.hudlId;
    }

    const pushPlays = playsWithData.map(p => {
      const row = { clipId: p._clipId };
      for (const key of selectedKeys) {
        const m = HUDL_COL_MAP[key];
        if (m) row[m.hudlName] = (p[key] && String(p[key]).trim()) ? String(p[key]) : null;
      }
      return row;
    });

    try {
      const { HUDL_API } = await import('../lib/constants');
      const headers = { 'Content-Type': 'application/json' };
      if (coach?.hudl_cookie) headers['X-Hudl-Cookie'] = coach.hudl_cookie;
      if (coach?.hudl_team_id) headers['X-Hudl-Team'] = coach.hudl_team_id;

      const resp = await fetch(`${HUDL_API}/api/hudl/write-bulk`, {
        method: 'POST', headers,
        body: JSON.stringify({ cutupId, columnMap, plays: pushPlays }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Push failed');
      onSuccess(`Pushed ${pushPlays.length} plays × ${selectedKeys.length} columns to Hudl`);
    } catch (err) {
      onError('Hudl push failed: ' + err.message);
    }
    setPushing(false);
  }

  return (
    <div className="overlay open" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxHeight: '80dvh' }}>
        <div className="modal-hdr">
          <div className="modal-title">SEND TO HUDL</div>
          <div className="modal-x" onClick={onClose}>✕</div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 14, WebkitOverflowScrolling: 'touch' }}>
          {playsWithData.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--color-muted)', fontSize: 13 }}>
              No plays with Hudl clip IDs found.<br /><br />This game needs to be loaded from Hudl to enable push.
            </div>
          ) : (
            <>
              <div style={{ fontSize: 12, color: 'var(--color-accent)', fontWeight: 600, marginBottom: 10 }}>
                {playsWithData.length} plays with clip IDs
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 6 }}>COLUMNS TO PUSH:</div>
              {mappable.length === 0 ? (
                <div style={{ fontSize: 12, color: 'var(--color-muted)', padding: '8px 0' }}>No data to push — all columns are empty.</div>
              ) : (
                mappable.map(([key, count]) => {
                  const m = HUDL_COL_MAP[key];
                  return (
                    <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, padding: '6px 8px', background: 'var(--color-surface2)', border: '1px solid var(--color-border)', borderRadius: 6, cursor: 'pointer', marginBottom: 4 }}>
                      <input type="checkbox" checked={checkedKeys.has(key)} onChange={() => toggleKey(key)} style={{ margin: 0 }} />
                      <span style={{ flex: 1, fontWeight: 600 }}>{m?.hudlName || key}</span>
                      <span style={{ color: 'var(--color-muted)', fontSize: 10 }}>
                        {count} plays · e.g. "{(sampleValues[key] || '').substring(0, 20)}"
                      </span>
                    </label>
                  );
                })
              )}
              <div style={{ fontSize: 11, color: '#e67e22', background: 'rgba(230,126,34,0.08)', border: '1px solid rgba(230,126,34,0.2)', borderRadius: 6, padding: '8px 10px', marginTop: 10, lineHeight: 1.5 }}>
                ⚠️ This will <strong>overwrite</strong> the selected columns in Hudl for all {playsWithData.length} plays. Existing values will be replaced.
              </div>
            </>
          )}
        </div>
        {playsWithData.length > 0 && mappable.length > 0 && (
          <div className="modal-foot">
            <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={handlePush} disabled={pushing || checkedKeys.size === 0}>
              {pushing ? 'PUSHING…' : 'PUSH →'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
