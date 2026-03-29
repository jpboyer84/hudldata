import Dexie from 'dexie';

// Use a new DB name so the schema starts clean with rowIndex support
const db = new Dexie('HudlData3');

db.version(1).stores({
  games: '++id, createdAt',
  // rowIndex is indexed so we can sort plays within a game by row order
  plays: '++id, gameId, [gameId+rowIndex]',
});

export default db;
