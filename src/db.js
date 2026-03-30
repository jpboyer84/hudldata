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
