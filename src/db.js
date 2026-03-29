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

// Seed the default ODK template if none exist
db.on('ready', async () => {
  const count = await db.templates.count();
  if (count === 0) {
    await db.templates.add({
      name: 'ODK',
      columns: DEFAULT_COLUMNS,
      createdAt: Date.now(),
      isDefault: true,
    });
  }
});

export default db;
