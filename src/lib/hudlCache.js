// ═══ HUDL CLIP CACHE — matches HTML getCachedClips/setCachedClips/evictOldestCache ═══
const CACHE_PREFIX = 'hd_clips_';
const META_KEY = 'hd_clip_cache_meta';
const MAX_CACHED = 30;

export function getCacheMeta() {
  try { return JSON.parse(localStorage.getItem(META_KEY) || '{}'); }
  catch { return {}; }
}

function setCacheMeta(meta) {
  localStorage.setItem(META_KEY, JSON.stringify(meta));
}

export function getCachedClips(cutupId) {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + cutupId);
    if (!raw) return null;
    const data = JSON.parse(raw);
    // Update access time
    const meta = getCacheMeta();
    if (meta[cutupId]) {
      meta[cutupId].accessedAt = Date.now();
      setCacheMeta(meta);
    }
    return data;
  } catch { return null; }
}

export function setCachedClips(cutupId, clips, label) {
  try {
    // Evict if over limit
    const meta = getCacheMeta();
    const count = Object.keys(meta).length;
    if (count >= MAX_CACHED) {
      evictOldestCache(count - MAX_CACHED + 1);
    }
    localStorage.setItem(CACHE_PREFIX + cutupId, JSON.stringify(clips));
    const updatedMeta = getCacheMeta();
    updatedMeta[cutupId] = {
      label: label || cutupId,
      clipCount: clips.length,
      cachedAt: Date.now(),
      accessedAt: Date.now(),
      size: JSON.stringify(clips).length,
    };
    setCacheMeta(updatedMeta);
  } catch (e) {
    // localStorage full — evict and retry once
    try {
      evictOldestCache(5);
      localStorage.setItem(CACHE_PREFIX + cutupId, JSON.stringify(clips));
    } catch {}
  }
}

function evictOldestCache(count) {
  const meta = getCacheMeta();
  const sorted = Object.entries(meta).sort((a, b) => a[1].cachedAt - b[1].cachedAt);
  const toRemove = sorted.slice(0, Math.max(count, 1));
  for (const [id] of toRemove) {
    localStorage.removeItem(CACHE_PREFIX + id);
    delete meta[id];
  }
  setCacheMeta(meta);
}

export function clearHudlCache() {
  const meta = getCacheMeta();
  for (const id of Object.keys(meta)) {
    localStorage.removeItem(CACHE_PREFIX + id);
  }
  localStorage.removeItem(META_KEY);
}

export function getCacheStats() {
  const meta = getCacheMeta();
  const entries = Object.values(meta);
  return {
    count: entries.length,
    totalSize: entries.reduce((sum, e) => sum + (e.size || 0), 0),
    totalClips: entries.reduce((sum, e) => sum + (e.clipCount || 0), 0),
  };
}
