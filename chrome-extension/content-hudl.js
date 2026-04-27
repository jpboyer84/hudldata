// ─── HUDL CONTENT SCRIPT ─────────────────────────────────────
// Runs on hudl.com. Detects clip changes, relays via Railway for cross-device sync.

(function () {
  'use strict';
  console.log('[AC Sync] Hudl content script loaded on:', window.location.pathname);
  const RELAY = 'https://hudl-mcp-production.up.railway.app';

  // Extract team ID from URL — try multiple patterns
  const teamMatch = window.location.pathname.match(/\/(\d{5,})/) || // any 5+ digit number
                    window.location.href.match(/team[_\/=](\d+)/i);
  const room = teamMatch ? teamMatch[1] : 'default';
  console.log('[AC Sync] Room:', room, '(from URL:', window.location.pathname, ')');

  // Same-browser messaging
  let port = null;
  try { port = chrome.runtime.connect({ name: 'hudl-sync-hudl' }); } catch {}

  // ─── CLIP CHANGE DETECTION ──────────────────────────────────
  const SELECTORS = [
    '#clips tr.playing', 'tr.playing', '#clips tr.selected', '#clips tr.active',
    '.nowPlaying', '[aria-selected="true"]', '[data-selected="true"]',
    '.clip-row.is-active', '.clip-row.is-playing',
  ];
  let lastIdx = -1;

  function getActiveRow() {
    for (const s of SELECTORS) { const el = document.querySelector(s); if (el) return el; }
    return null;
  }

  function getClipIndex(row) {
    if (!row) return -1;
    const idx = row.dataset?.index ?? row.dataset?.clipIndex ?? row.dataset?.rowIndex;
    if (idx != null) return parseInt(idx);
    const parent = row.parentElement;
    if (parent) {
      const rows = [...parent.children].filter(el => el.tagName === 'TR' || el.classList.contains('clip-row'));
      return rows.indexOf(row);
    }
    return -1;
  }

  function checkClipChange() {
    const row = getActiveRow();
    if (!row) return;
    const idx = getClipIndex(row);
    if (idx !== lastIdx && idx >= 0) {
      lastIdx = idx;
      // Local
      try { port?.postMessage({ type: 'clip-changed', clipIndex: idx }); } catch {}
      // Cross-device via Railway
      fetch(`${RELAY}/api/sync/push`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room, type: 'clip-changed', data: { clipIndex: idx } }),
      }).catch(() => {});
    }
  }

  // ─── KEYSTROKE SIMULATION ───────────────────────────────────
  function simulateKey(key) {
    const target = document.activeElement || document.body;
    const code = key === 'ArrowRight' ? 'ArrowRight' : key === 'ArrowLeft' ? 'ArrowLeft' : 'Space';
    const kc = key === 'ArrowRight' ? 39 : key === 'ArrowLeft' ? 37 : 32;
    target.dispatchEvent(new KeyboardEvent('keydown', { key, code, keyCode: kc, which: kc, bubbles: true }));
    target.dispatchEvent(new KeyboardEvent('keyup', { key, code, keyCode: kc, which: kc, bubbles: true }));
    setTimeout(checkClipChange, 200);
  }

  // Local commands
  try { port?.onMessage.addListener(msg => { if (msg.type === 'send-key') simulateKey(msg.key); }); } catch {}

  // Cross-device commands from Railway SSE
  function connectSSE() {
    const es = new EventSource(`${RELAY}/api/sync/listen/${room}`);
    es.onmessage = (e) => {
      try {
        const d = JSON.parse(e.data);
        if (d.type === 'command') simulateKey(d.key);
      } catch {}
    };
    es.onerror = () => { es.close(); setTimeout(connectSSE, 5000); };
  }
  connectSSE();

  // ─── OBSERVER ───────────────────────────────────────────────
  let started = false;
  function startObserver() {
    if (started) return;
    const target = document.querySelector('#clips') || document.querySelector('.clip-list') || document.body;
    new MutationObserver(() => checkClipChange()).observe(target, {
      childList: true, subtree: true, attributes: true,
      attributeFilter: ['class', 'aria-selected', 'data-selected'],
    });
    started = true;
    checkClipChange();
  }

  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') setTimeout(checkClipChange, 150);
  });

  function waitForClips() {
    if (document.querySelector('#clips') || document.querySelector('.clip-list')) startObserver();
    else setTimeout(waitForClips, 1000);
  }
  setTimeout(waitForClips, 2000);
})();
