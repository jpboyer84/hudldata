import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { createGame } from '../lib/supaData';
import { defaultColumns } from '../columns';
import * as XLSX from 'xlsx';

export default function XlsxImportPage() {
  const navigate = useNavigate();
  const { coach } = useAuth();
  const showToast = useToast();
  const fileRef = useRef(null);

  const [step, setStep] = useState('pick'); // pick | map | dest
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);
  const [mapping, setMapping] = useState([]); // [{header, mappedTo}]
  const [fileName, setFileName] = useState('');

  const allCols = defaultColumns();

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target.result, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
        if (data.length < 2) { showToast('No data found in spreadsheet'); return; }

        const hdrs = data[0].map(h => String(h).trim());
        const dataRows = data.slice(1).filter(r => r.some(c => c !== '' && c != null));

        setHeaders(hdrs);
        setRows(dataRows);

        // Auto-map: match header names to column names (case-insensitive)
        const autoMap = hdrs.map(h => {
          const upper = h.toUpperCase();
          // Skip "PLAY" or "#" column
          if (upper === 'PLAY' || upper === '#' || upper === 'PLAY #') return { header: h, mappedTo: '__skip' };
          const match = allCols.find(c => c.name.toUpperCase() === upper);
          return { header: h, mappedTo: match ? match.id : '' };
        });
        setMapping(autoMap);

        // Check for unrecognized columns
        const unrecognized = autoMap.filter(m => !m.mappedTo && m.mappedTo !== '__skip');
        if (unrecognized.length > 0) {
          setStep('map');
        } else {
          setStep('map'); // Always show mapping for review
        }
      } catch (err) {
        showToast('Failed to read file: ' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  }

  function updateMapping(idx, colId) {
    setMapping(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], mappedTo: colId };
      return next;
    });
  }

  function confirmMapping() {
    setStep('dest');
  }

  function buildPlays() {
    return rows.map(row => {
      const play = {};
      mapping.forEach((m, idx) => {
        if (m.mappedTo && m.mappedTo !== '__skip' && row[idx] != null && String(row[idx]).trim()) {
          const col = allCols.find(c => c.id === m.mappedTo);
          const key = col ? (col.dataKey || col.id) : m.mappedTo;
          play[key] = String(row[idx]).trim();
        }
      });
      return play;
    }).filter(p => Object.keys(p).length > 0);
  }

  async function importAsNew() {
    if (!coach?.team_id) { showToast('Set up your team first'); return; }
    const plays = buildPlays();
    if (plays.length === 0) { showToast('No valid plays to import'); return; }

    // Pad to 200
    while (plays.length < 200) plays.push({});

    try {
      const game = await createGame({
        team_id: coach.team_id,
        created_by: coach.id,
        home: fileName.replace(/\.[^.]+$/, ''),
        away: '',
        game_type: 'Game',
        plays,
      });
      showToast(`Imported ${plays.filter(p => Object.keys(p).length > 0).length} plays`);
      navigate(`/tracker/${game.id}`);
    } catch (err) {
      showToast('Import failed: ' + err.message);
    }
  }

  const mappedCount = mapping.filter(m => m.mappedTo && m.mappedTo !== '__skip').length;
  const unmappedCount = mapping.filter(m => !m.mappedTo).length;
  const playCount = rows.filter(r => r.some(c => c !== '' && c != null)).length;

  return (
    <div className="view">
      <div className="hdr">
        <button className="hdr-btn" onClick={() => navigate('/trackers')}>← Back</button>
        <div className="hdr-title">Import spreadsheet</div>
        <div style={{ width: 60 }} />
      </div>

      {step === 'pick' && (
        <div className="abody" style={{ gap: 16 }}>
          <div style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.5, textAlign: 'center', padding: '20px 0' }}>
            Import an XLSX or XLS spreadsheet into the tracker.<br />
            Column headers will be mapped to your tracking columns.
          </div>
          <div className="settings-row">
            <div className="settings-btn" onClick={() => fileRef.current?.click()}>
              <span className="settings-btn-icon">💾</span>
              FROM DEVICE
              <span className="settings-btn-label">Choose .xlsx or .xls file</span>
            </div>
          </div>
          <input ref={fileRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={handleFile} />
        </div>
      )}

      {step === 'map' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: 16, WebkitOverflowScrolling: 'touch' }}>
          <div style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 12, lineHeight: 1.5 }}>
            <strong>{fileName}</strong> — {playCount} rows, {headers.length} columns
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 8 }}>MAP SPREADSHEET COLUMNS:</div>

          {mapping.map((m, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, padding: '8px 10px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8 }}>
              <div style={{ flex: 1, fontSize: 13, fontWeight: 600, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {m.header}
              </div>
              <div style={{ fontSize: 14, color: 'var(--color-muted)' }}>→</div>
              <select
                value={m.mappedTo}
                onChange={e => updateMapping(idx, e.target.value)}
                style={{
                  flex: 1, padding: '6px 8px', fontSize: 12, borderRadius: 6,
                  background: 'var(--color-bg)', color: 'var(--color-text)',
                  border: `1px solid ${m.mappedTo ? 'var(--color-accent)' : m.mappedTo === '' ? 'var(--color-red)' : 'var(--color-border)'}`,
                  cursor: 'pointer',
                }}
              >
                <option value="">— Skip —</option>
                <option value="__skip">Skip (Play #)</option>
                {allCols.sort((a, b) => a.name.localeCompare(b.name)).map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          ))}

          <div style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 10 }}>
            {mappedCount} mapped · {unmappedCount} unmapped
          </div>

          <button className="btn btn-primary" onClick={confirmMapping} style={{ width: '100%', marginTop: 14, padding: 14 }}>
            CONTINUE →
          </button>
        </div>
      )}

      {step === 'dest' && (
        <div className="abody" style={{ gap: 16, padding: 20 }}>
          <div style={{ fontSize: 13, color: 'var(--color-muted)', lineHeight: 1.6, textAlign: 'center' }}>
            <strong>{playCount} plays</strong> from <strong>{fileName}</strong><br />
            mapped to {mappedCount} columns
          </div>

          <div className="settings-row" style={{ flexDirection: 'column' }}>
            <div className="settings-btn" onClick={importAsNew}>
              <span className="settings-btn-icon">➕</span>
              CREATE NEW GAME
              <span className="settings-btn-label">Import as a new game in the tracker</span>
            </div>
          </div>

          <button className="btn btn-secondary" onClick={() => setStep('map')} style={{ width: '100%', marginTop: 8 }}>
            ← Back to mapping
          </button>
        </div>
      )}
    </div>
  );
}
