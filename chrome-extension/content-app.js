// ─── APP CONTENT SCRIPT ──────────────────────────────────────
// Runs on hudldata.vercel.app. Same-browser bridge only.
// Cross-device sync is handled directly by TrackerPage ↔ Railway SSE.

(function () {
  'use strict';
  console.log('[AC Sync] App content script loaded');

  const port = chrome.runtime.connect({ name: 'hudl-sync-app' });

  // App → Hudl (same browser)
  window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    if (!event.data || event.data.source !== 'assistant-coach-sync') return;
    const { action } = event.data;
    if (action === 'next-clip') port.postMessage({ type: 'command', key: 'ArrowRight' });
    else if (action === 'prev-clip') port.postMessage({ type: 'command', key: 'ArrowLeft' });
    else if (action === 'play-pause') port.postMessage({ type: 'command', key: ' ' });
  });

  // Hudl → App (same browser)
  port.onMessage.addListener((msg) => {
    if (msg.type === 'hudl-clip-changed') {
      window.postMessage({ source: 'assistant-coach-sync', type: 'clip-changed', clipIndex: msg.clipIndex }, '*');
    }
  });

  // Announce presence
  window.postMessage({ source: 'assistant-coach-sync', type: 'extension-ready' }, '*');
  setInterval(() => {
    window.postMessage({ source: 'assistant-coach-sync', type: 'extension-ready' }, '*');
  }, 5000);
})();
