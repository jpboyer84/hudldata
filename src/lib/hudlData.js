import { HUDL_API } from './constants';
import { getCachedClips, setCachedClips } from './hudlCache';

// Map from Hudl normalized clip fields → our column IDs (matches HTML)
const HUDL_TO_COL = {
  odk: 'odk',
  quarter: 'qtr',
  down: 'dn',
  distance: 'dist2',    // exact numeric distance
  yard_line: 'yardln',
  hash: 'hash',
  play_type: 'playtype',
  result: 'result',
  gain_loss: 'gainloss',
  off_form: 'offform',
  off_play: 'offplay',
  play_dir: 'playdir',
  eff: 'eff',
  passer: 'passer',
  rusher: 'rusher',
  receiver: 'receiver',
  series: 'series',
  personnel: 'personnel',
  backfield: 'backfield',
  coverage: 'coverage',
  def_front: 'deffront',
  blocking: 'blocking',
  motion: 'motion',
  blitz: 'blitz',
};

// Map from our column IDs → Hudl column names (for write-back)
const COL_TO_HUDL_NAME = {
  odk: 'ODK',
  qtr: 'QTR',
  dn: 'DN',
  dist2: 'DIST',
  yardln: 'YARD LN',
  hash: 'HASH',
  playtype: 'PLAY TYPE',
  result: 'RESULT',
  gainloss: 'GN/LS',
  series: 'SERIES',
  offform: 'OFF FORM',
  offplay: 'OFF PLAY',
};

// Known Hudl column IDs (from HAR capture)
const HUDL_COLUMN_IDS = {
  'ODK': 2626912,
  'QTR': 2626932,
  'DN': 2626907,
  'YARD LN': 2626913,
  'HASH': 2626914,
  'PLAY TYPE': 2626909,
  'RESULT': 2626910,
  'GN/LS': 2626911,
  'SERIES': 2626915,
  'OFF FORM': 2626917,
  'OFF PLAY': 2626918,
};

// Convert Hudl clip array → our play array
export function hudlClipsToPlays(clips) {
  return clips.map(clip => {
    const play = {};
    for (const [hudlKey, colId] of Object.entries(HUDL_TO_COL)) {
      const val = clip[hudlKey];
      if (val != null && val !== '' && val !== 'null') {
        play[colId] = String(val);
      }
    }
    play._clipId = String(clip.id);
    return play;
  });
}

// Convert our plays → Hudl write-bulk format
export function playsToHudlBulk(plays, cutupId) {
  const columnMap = {};
  const hudlPlays = [];

  for (const play of plays) {
    if (!play._clipId) continue;
    const clipId = play._clipId;
    const fields = {};

    for (const [colId, hudlName] of Object.entries(COL_TO_HUDL_NAME)) {
      if (play[colId] != null && play[colId] !== '') {
        fields[hudlName] = String(play[colId]);
        if (HUDL_COLUMN_IDS[hudlName]) {
          columnMap[hudlName] = HUDL_COLUMN_IDS[hudlName];
        }
      }
    }

    if (Object.keys(fields).length > 0) {
      hudlPlays.push({ clipId, ...fields });
    }
  }

  return { cutupId, columnMap, plays: hudlPlays };
}

// Fetch clips from a Hudl cutup (with localStorage cache)
export async function fetchHudlClips(cutupId, coach, label) {
  // Check cache first (#19)
  const cached = getCachedClips(cutupId);
  if (cached) return cached;

  const headers = { 'Content-Type': 'application/json' };
  if (coach?.hudl_cookie) headers['X-Hudl-Cookie'] = coach.hudl_cookie;
  if (coach?.hudl_team_id) headers['X-Hudl-Team'] = coach.hudl_team_id;

  const resp = await fetch(`${HUDL_API}/api/clips/${cutupId}?count=1000`, { headers });
  const data = await resp.json();
  if (!resp.ok) throw new Error(data.error || 'Failed to load clips');
  const clips = data.clips || [];

  // Cache for next time
  setCachedClips(cutupId, clips, label || cutupId);

  return clips;
}

// Send plays back to Hudl
export async function sendToHudl(plays, cutupId, coach) {
  const bulk = playsToHudlBulk(plays, cutupId);
  if (bulk.plays.length === 0) throw new Error('No plays with Hudl clip IDs to send');

  const headers = { 'Content-Type': 'application/json' };
  if (coach?.hudl_cookie) headers['X-Hudl-Cookie'] = coach.hudl_cookie;
  if (coach?.hudl_team_id) headers['X-Hudl-Team'] = coach.hudl_team_id;

  const resp = await fetch(`${HUDL_API}/api/hudl/write-bulk`, {
    method: 'POST',
    headers,
    body: JSON.stringify(bulk),
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error(data.error || 'Failed to write to Hudl');
  return data;
}

// ─── ROSTER: Fetch and cache player roster for a season ───
let rosterCache = {}; // { seasonId: { players, ts } }

export async function fetchRoster(seasonId, coach) {
  if (!seasonId) return null;

  // Check local cache (24hr)
  const cached = rosterCache[seasonId];
  if (cached && Date.now() - cached.ts < 24 * 60 * 60 * 1000) return cached.data;

  const headers = { 'Content-Type': 'application/json' };
  if (coach?.hudl_cookie) headers['X-Hudl-Cookie'] = coach.hudl_cookie;
  if (coach?.hudl_team_id) headers['X-Hudl-Team'] = coach.hudl_team_id;

  try {
    const resp = await fetch(`${HUDL_API}/api/hudl/roster/${seasonId}`, { headers });
    if (!resp.ok) return null;
    const data = await resp.json();
    rosterCache[seasonId] = { data, ts: Date.now() };
    return data;
  } catch {
    return null;
  }
}

// Replace raw participant IDs with "#14 Wyatt Tewell" labels in clip data
export function resolvePlayerIds(clips, roster) {
  if (!roster?.players || !clips?.length) return clips;
  const players = roster.players;
  return clips.map(clip => {
    const resolved = { ...clip };
    for (const field of ['passer', 'rusher', 'receiver']) {
      const id = clip[field];
      if (id && players[id]) {
        resolved[field] = players[id].label;
      }
    }
    return resolved;
  });
}

// ─── SYNC TEMPLATE TO HUDL: Save/update a column set in Hudl ───
export async function syncTemplateToHudl(name, colIds, coach) {
  if (!coach?.hudl_cookie) return null; // Not connected to Hudl

  const headers = { 'Content-Type': 'application/json' };
  if (coach.hudl_cookie) headers['X-Hudl-Cookie'] = coach.hudl_cookie;
  if (coach.hudl_team_id) headers['X-Hudl-Team'] = coach.hudl_team_id;

  try {
    const resp = await fetch(`${HUDL_API}/api/hudl/column-sets`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ name, appKeys: colIds }),
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    // Clear cached Hudl templates so they refresh next time
    hudlTemplatesCache = null;
    return data;
  } catch {
    return null;
  }
}
let hudlTemplatesCache = null;

export async function fetchHudlColumnSets(coach) {
  if (hudlTemplatesCache) return hudlTemplatesCache;

  const headers = { 'Content-Type': 'application/json' };
  if (coach?.hudl_cookie) headers['X-Hudl-Cookie'] = coach.hudl_cookie;
  if (coach?.hudl_team_id) headers['X-Hudl-Team'] = coach.hudl_team_id;

  try {
    const resp = await fetch(`${HUDL_API}/api/hudl/column-sets`, { headers });
    if (!resp.ok) return [];
    const data = await resp.json();
    const sets = data.columnSets || [];

    const templates = sets
      .map(s => {
        const colIds = (s.columns || []).map(c => c.appKey).filter(Boolean);
        if (colIds.length === 0) return null;
        return {
          id: `hudl_cs_${s.id}`,
          name: s.name,
          col_ids: colIds,
          isHudl: true,
        };
      })
      .filter(Boolean);

    hudlTemplatesCache = templates;
    return templates;
  } catch {
    return [];
  }
}
