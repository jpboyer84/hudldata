// ─── APP CONTENT SCRIPT ──────────────────────────────────────
// Runs on hudldata.vercel.app. Bridges the React app and the extension.
// 1. Listens for window.postMessage from the React app (Next/Prev/Play)
// 2. Forwards commands to background → Hudl tab
// 3. Receives clip changes from Hudl → posts back to React app

(function () {
  'use strict';

  console.log('[AC Sync] App content script loaded');

  const port = chrome.runtime.connect({ name: 'hudl-sync-app' });

  // ─── APP → HUDL ────────────────────────────────────────────
  // React app sends postMessage with hudl-sync commands
  window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    if (!event.data || event.data.source !== 'assistant-coach-sync') return;

    const { action } = event.data;
    console.log(`[AC Sync] App command: ${action}`);

    switch (action) {
      case 'next-clip':
        port.postMessage({ type: 'command', key: 'ArrowRight' });
        break;
      case 'prev-clip':
        port.postMessage({ type: 'command', key: 'ArrowLeft' });
        break;
      case 'play-pause':
        port.postMessage({ type: 'command', key: ' ' });
        break;
    }
  });

  // ─── HUDL → APP ────────────────────────────────────────────
  // Clip changed in Hudl → tell the React app
  port.onMessage.addListener((msg) => {
    if (msg.type === 'hudl-clip-changed') {
      console.log(`[AC Sync] Hudl clip changed → index ${msg.clipIndex}`);
      window.postMessage({
        source: 'assistant-coach-sync',
        type: 'clip-changed',
        clipIndex: msg.clipIndex,
        clipTitle: msg.clipTitle || '',
      }, '*');
    }
  });

  // ─── ANNOUNCE EXTENSION PRESENCE ───────────────────────────
  // Let the React app know the extension is installed
  window.postMessage({
    source: 'assistant-coach-sync',
    type: 'extension-ready',
  }, '*');

  // Re-announce periodically (React app may mount after extension loads)
  setInterval(() => {
    window.postMessage({
      source: 'assistant-coach-sync',
      type: 'extension-ready',
    }, '*');
  }, 5000);
})();
