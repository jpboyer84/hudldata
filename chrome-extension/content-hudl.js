// ─── HUDL CONTENT SCRIPT ─────────────────────────────────────
// DOM observation + keystroke simulation ONLY.
// All Railway communication goes through the background worker.

(function () {
  'use strict';
  console.log('[AC Sync] Hudl content script loaded on:', window.location.pathname);

  // Extract team ID from URL for room code
  const teamMatch = window.location.pathname.match(/\/(\d{5,})/) ||
                    window.location.href.match(/team[_\/=](\d+)/i);
  const room = teamMatch ? teamMatch[1] : 'default';
  console.log('[AC Sync] Room:', room);

  // Connect to background worker
  const port = chrome.runtime.connect({ name: 'hudl-sync-hudl' });

  // Tell background our room code so it can connect to Railway
  port.postMessage({ type: 'set-room', room });
  console.log('[AC Sync] Sent room to background:', room);

  // ─── CLIP CHANGE DETECTION ──────────────────────────────────
  const SELECTORS = [
    '#clips tr.playing', 'tr.playing', '#clips tr.selected', '#clips tr.active',
    '.nowPlaying', '[aria-selected="true"]', '[data-selected="true"]',
    '.clip-row.is-active', '.clip-row.is-playing',
  ];
  let lastIdx = -1;

  function getActiveRow() {
    for (const s of SELECTORS) {
      const el = document.querySelector(s);
      if (el) return el;
    }
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
      console.log('[AC Sync] Clip changed → index', idx);
      // Tell background → it relays locally + to Railway
      port.postMessage({ type: 'clip-changed', clipIndex: idx });
    }
  }

  // ─── KEYSTROKE SIMULATION ───────────────────────────────────
  function simulateKey(key) {
    console.log('[AC Sync] Simulating key:', key);
    const target = document.activeElement || document.body;
    const code = key === 'ArrowRight' ? 'ArrowRight' : key === 'ArrowLeft' ? 'ArrowLeft' : 'Space';
    const kc = key === 'ArrowRight' ? 39 : key === 'ArrowLeft' ? 37 : 32;
    target.dispatchEvent(new KeyboardEvent('keydown', { key, code, keyCode: kc, which: kc, bubbles: true }));
    target.dispatchEvent(new KeyboardEvent('keyup', { key, code, keyCode: kc, which: kc, bubbles: true }));
    setTimeout(checkClipChange, 200);
  }

  // Receive commands from background (local app tab or remote via Railway)
  port.onMessage.addListener((msg) => {
    if (msg.type === 'send-key') {
      simulateKey(msg.key);
    }
  });

  // Detect manual keyboard navigation in Hudl
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      setTimeout(checkClipChange, 150);
    }
  });

  // ─── START OBSERVER ─────────────────────────────────────────
  let started = false;
  function startObserver() {
    if (started) return;
    const target = document.querySelector('#clips') || document.querySelector('.clip-list') || document.body;
    new MutationObserver(() => checkClipChange()).observe(target, {
      childList: true, subtree: true, attributes: true,
      attributeFilter: ['class', 'aria-selected', 'data-selected'],
    });
    started = true;
    console.log('[AC Sync] Observer started on', target.tagName);
    checkClipChange();
  }

  function waitForClips() {
    if (document.querySelector('#clips') || document.querySelector('.clip-list')) {
      startObserver();
    } else {
      setTimeout(waitForClips, 1000);
    }
  }
  setTimeout(waitForClips, 2000);
})();
