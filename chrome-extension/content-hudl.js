// ─── HUDL CONTENT SCRIPT ─────────────────────────────────────
// Runs on hudl.com pages. Two jobs:
// 1. Detect when the active clip changes → notify the app
// 2. Receive keystroke commands from the app → simulate keypresses

(function () {
  'use strict';

  // Don't run on non-video pages
  if (!window.location.pathname.includes('/library') && !window.location.pathname.includes('/video')) {
    return;
  }

  console.log('[AC Sync] Hudl content script loaded');

  // Connect to background
  const port = chrome.runtime.connect({ name: 'hudl-sync-hudl' });

  // ─── DETECT ACTIVE CLIP ─────────────────────────────────────
  // Based on the open-source Hudl HUD extension's getActiveRow() approach.
  // Hudl marks the playing clip with various CSS classes/attributes.

  const ACTIVE_SELECTORS = [
    '#clips tr.playing',
    'tr.playing',
    '#clips tr.selected',
    '#clips tr.active',
    '.nowPlaying',
    '[aria-selected="true"]',
    '[data-selected="true"]',
    '.clip-row.is-active',
    '.clip-row.is-playing',
  ];

  let lastActiveIndex = -1;
  let observerStarted = false;

  function getActiveRow() {
    for (const selector of ACTIVE_SELECTORS) {
      const el = document.querySelector(selector);
      if (el) return el;
    }
    return null;
  }

  function getClipIndex(row) {
    if (!row) return -1;
    // Try data attributes
    const idx = row.dataset?.index ?? row.dataset?.clipIndex ?? row.dataset?.rowIndex;
    if (idx != null) return parseInt(idx);
    // Try counting siblings
    const parent = row.parentElement;
    if (parent) {
      const rows = Array.from(parent.children).filter(
        (el) => el.tagName === 'TR' || el.classList.contains('clip-row')
      );
      return rows.indexOf(row);
    }
    return -1;
  }

  function getClipTitle(row) {
    if (!row) return '';
    // Try to find play number or title text
    const playNum = row.querySelector('.play-number, .clip-number, td:first-child');
    return playNum?.textContent?.trim() || '';
  }

  function checkForClipChange() {
    const active = getActiveRow();
    if (!active) return;

    const idx = getClipIndex(active);
    if (idx !== lastActiveIndex && idx >= 0) {
      lastActiveIndex = idx;
      const title = getClipTitle(active);
      console.log(`[AC Sync] Clip changed → index ${idx}`, title);
      port.postMessage({
        type: 'clip-changed',
        clipIndex: idx,
        clipTitle: title,
      });
    }
  }

  function startObserver() {
    if (observerStarted) return;

    // Watch for DOM changes that indicate clip navigation
    const observer = new MutationObserver(() => {
      checkForClipChange();
    });

    // Observe the clips container, or the whole body if not found yet
    const target =
      document.querySelector('#clips') ||
      document.querySelector('.clip-list') ||
      document.querySelector('.playlist-clips') ||
      document.body;

    observer.observe(target, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'aria-selected', 'data-selected'],
    });

    observerStarted = true;
    console.log('[AC Sync] MutationObserver started on', target.tagName || 'body');

    // Initial check
    checkForClipChange();
  }

  // Also listen for keyboard events to detect manual navigation
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      // Small delay to let Hudl update the DOM
      setTimeout(checkForClipChange, 150);
    }
  });

  // ─── RECEIVE COMMANDS FROM APP ──────────────────────────────
  // Simulate keyboard events on the Hudl page

  port.onMessage.addListener((msg) => {
    if (msg.type === 'send-key') {
      simulateKey(msg.key);
    }
  });

  function simulateKey(key) {
    console.log(`[AC Sync] Simulating key: ${key}`);
    const target = document.activeElement || document.body;

    const opts = {
      key: key,
      code: key === 'ArrowRight' ? 'ArrowRight' :
            key === 'ArrowLeft' ? 'ArrowLeft' :
            key === ' ' ? 'Space' : key,
      keyCode: key === 'ArrowRight' ? 39 :
               key === 'ArrowLeft' ? 37 :
               key === ' ' ? 32 : 0,
      which: key === 'ArrowRight' ? 39 :
             key === 'ArrowLeft' ? 37 :
             key === ' ' ? 32 : 0,
      bubbles: true,
      cancelable: true,
    };

    target.dispatchEvent(new KeyboardEvent('keydown', opts));
    target.dispatchEvent(new KeyboardEvent('keyup', opts));

    // Check for clip change after keystroke
    setTimeout(checkForClipChange, 200);
  }

  // ─── INIT ───────────────────────────────────────────────────
  // Wait for Hudl's clip list to load, then start observing
  function waitForClips() {
    const clipContainer =
      document.querySelector('#clips') ||
      document.querySelector('.clip-list') ||
      document.querySelector('.playlist-clips');

    if (clipContainer) {
      startObserver();
    } else {
      // Retry — Hudl loads clips asynchronously
      setTimeout(waitForClips, 1000);
    }
  }

  // Start after a short delay to let Hudl initialize
  setTimeout(waitForClips, 2000);
})();
