import * as XLSX from 'xlsx';
import db from '../db';

// ─── XLSX Export ──────────────────────────────────────────────────────────────

export function exportToXLSX(plays, columns, gameName) {
  const colIds = columns.map(c => c.id);
  const headers = ['#', ...columns.map(c => c.name)];

  // Only export rows that have at least one value filled
  const filled = plays.filter(p => colIds.some(id => p[id] != null));

  const rows = filled.map((p, i) => [
    i + 1,
    ...colIds.map(id => p[id] ?? ''),
  ]);

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

  // Auto column widths
  const colWidths = headers.map((h, i) => {
    const maxLen = Math.max(
      h.length,
      ...rows.map(r => String(r[i] ?? '').length)
    );
    return { wch: Math.min(maxLen + 2, 30) };
  });
  ws['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Plays');

  const safeGameName = gameName.replace(/[^a-z0-9]/gi, '_');
  XLSX.writeFile(wb, `${safeGameName}_plays.xlsx`);
}

// ─── Backup (download JSON) ───────────────────────────────────────────────────

export async function downloadBackup(gameId, gameName) {
  const game  = await db.games.get(gameId);
  const plays = await db.plays.where('gameId').equals(gameId).sortBy('rowIndex');

  const payload = JSON.stringify({ version: 1, game, plays }, null, 2);
  const blob    = new Blob([payload], { type: 'application/json' });
  const url     = URL.createObjectURL(blob);
  const a       = document.createElement('a');
  a.href        = url;
  const safeName = gameName.replace(/[^a-z0-9]/gi, '_');
  a.download    = `hudldata_${safeName}_${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Restore (upload JSON, merges into DB) ────────────────────────────────────

export async function restoreFromFile(file) {
  const text = await file.text();
  let payload;
  try { payload = JSON.parse(text); } catch { throw new Error('Invalid JSON file.'); }

  if (!payload.game || !Array.isArray(payload.plays)) {
    throw new Error('Unrecognised backup format.');
  }

  const { game, plays } = payload;

  // Add game (without preserving old id)
  const { id: _oldGameId, ...gameData } = game;
  const newGameId = await db.games.add({ ...gameData, createdAt: Date.now() });

  // Add plays remapped to new game id
  const newPlays = plays.map(({ id: _oldPlayId, gameId: _old, ...rest }) => ({
    ...rest,
    gameId: newGameId,
  }));
  await db.plays.bulkAdd(newPlays);

  return newGameId;
}
