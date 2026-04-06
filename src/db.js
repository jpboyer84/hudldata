import Dexie from 'dexie';
import { DEFAULT_COLUMNS } from './columns';

const db = new Dexie('HudlData3');

db.version(1).stores({
  games: '++id, createdAt',
  plays: '++id, gameId, [gameId+rowIndex]',
});

db.version(2).stores({
  games: '++id, createdAt',
  plays: '++id, gameId, [gameId+rowIndex]',
  templates: '++id, createdAt',
});

// Version 3: refresh the seeded ODK template to pick up column changes.
// Existing games are unaffected (they store their own column config copy).
db.version(3).stores({
  games: '++id, createdAt',
  plays: '++id, gameId, [gameId+rowIndex]',
  templates: '++id, createdAt',
}).upgrade(async tx => {
  const all = await tx.table('templates').toArray();
  const odk = all.find(t => t.isDefault);
  if (odk) {
    await tx.table('templates').update(odk.id, { columns: DEFAULT_COLUMNS });
  }
});

// Version 4: add columnLibrary table
db.version(4).stores({
  games: '++id, createdAt',
  plays: '++id, gameId, [gameId+rowIndex]',
  templates: '++id, createdAt',
  columnLibrary: '++id, createdAt',
});

// Version 5: remove yardLn, gainLoss, offForm from all templates and games
const REMOVED_COL_IDS = new Set(['yardLn', 'gainLoss', 'offForm']);
db.version(5).stores({
  games: '++id, createdAt',
  plays: '++id, gameId, [gameId+rowIndex]',
  templates: '++id, createdAt',
  columnLibrary: '++id, createdAt',
}).upgrade(async tx => {
  const templates = await tx.table('templates').toArray();
  for (const t of templates) {
    if (Array.isArray(t.columns)) {
      await tx.table('templates').update(t.id, {
        columns: t.columns.filter(c => !REMOVED_COL_IDS.has(c.id)),
      });
    }
  }
  const games = await tx.table('games').toArray();
  for (const g of games) {
    if (Array.isArray(g.config)) {
      await tx.table('games').update(g.id, {
        config: g.config.filter(c => !REMOVED_COL_IDS.has(c.id)),
      });
    }
  }
});

// Version 6: refresh default ODK template with updated DEFAULT_COLUMNS (adds back
// yardLn, gainLoss, offForm which were removed in v5, plus updated DN/HASH/DIST)
db.version(6).stores({
  games: '++id, createdAt',
  plays: '++id, gameId, [gameId+rowIndex]',
  templates: '++id, createdAt',
  columnLibrary: '++id, createdAt',
}).upgrade(async tx => {
  const all = await tx.table('templates').toArray();
  const odk = all.find(t => t.isDefault);
  if (odk) {
    await tx.table('templates').update(odk.id, { columns: DEFAULT_COLUMNS });
  }
});

// Seed on first open
db.on('ready', async () => {
  // Seed ODK template
  const tcount = await db.templates.count();
  if (tcount === 0) {
    await db.templates.add({
      name: 'ODK',
      columns: DEFAULT_COLUMNS,
      createdAt: Date.now(),
      isDefault: true,
    });
  }
  // Seed column library with all ODK columns
  const lcount = await db.columnLibrary.count();
  if (lcount === 0) {
    const now = Date.now();
    await db.columnLibrary.bulkAdd(
      DEFAULT_COLUMNS.map((col, i) => ({
        name: col.name,
        column: col,
        createdAt: now + i,
      }))
    );
  }
});

export default db;
