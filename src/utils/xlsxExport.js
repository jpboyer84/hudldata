import * as XLSX from 'xlsx';
import { DEFAULT_COLUMNS } from '../columns';

function getFilledPlays(plays) {
  if (!Array.isArray(plays)) return [];
  return plays.filter(p => p && Object.keys(p).length > 0);
}

function buildHeaders(columns) {
  return ['#', ...columns.map(c => c.name)];
}

function buildRow(play, idx, columns) {
  return [idx + 1, ...columns.map(c => play[c.id] || play[c.name?.toLowerCase()] || '')];
}

export function exportGameXLSX(game, plays, columns) {
  const filled = getFilledPlays(plays);
  if (filled.length === 0) throw new Error('No plays to export');

  const cols = columns || DEFAULT_COLUMNS;
  const headers = buildHeaders(cols);
  const data = [headers, ...filled.map((p, i) => buildRow(p, i, cols))];

  const ws = XLSX.utils.aoa_to_sheet(data);

  // Auto-width columns
  ws['!cols'] = headers.map((h, i) => ({
    wch: Math.max(h.length, ...data.slice(1).map(r => String(r[i] || '').length)) + 2,
  }));

  const wb = XLSX.utils.book_new();
  const sheetName = game?.home && game?.away
    ? `${game.home} vs ${game.away}`.substring(0, 31)
    : 'Game';
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  const fileName = game?.home && game?.away
    ? `${game.home}_vs_${game.away}${game.week ? `_Wk${game.week}` : ''}.xlsx`
    : `game_export_${new Date().toISOString().split('T')[0]}.xlsx`;

  XLSX.writeFile(wb, fileName);
}

export function exportMultiGameXLSX(games) {
  if (!games || games.length === 0) throw new Error('No games to export');

  const wb = XLSX.utils.book_new();
  const cols = DEFAULT_COLUMNS;

  games.forEach((game, gi) => {
    const filled = getFilledPlays(game.plays);
    if (filled.length === 0) return;

    const headers = buildHeaders(cols);
    const data = [headers, ...filled.map((p, i) => buildRow(p, i, cols))];
    const ws = XLSX.utils.aoa_to_sheet(data);

    ws['!cols'] = headers.map((h, i) => ({
      wch: Math.max(h.length, ...data.slice(1).map(r => String(r[i] || '').length)) + 2,
    }));

    let sheetName = game.home && game.away
      ? `${game.home} vs ${game.away}`
      : `Game ${gi + 1}`;
    sheetName = sheetName.substring(0, 31);

    // Ensure unique sheet name
    let suffix = 1;
    let finalName = sheetName;
    while (wb.SheetNames.includes(finalName)) {
      finalName = `${sheetName.substring(0, 28)}_${suffix++}`;
    }

    XLSX.utils.book_append_sheet(wb, ws, finalName);
  });

  if (wb.SheetNames.length === 0) throw new Error('No plays in selected games');

  const fileName = `games_export_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
