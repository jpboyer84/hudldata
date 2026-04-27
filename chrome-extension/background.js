// ─── BACKGROUND SERVICE WORKER ───────────────────────────────
// Relays messages between the Hudl content script and the App content script.
// No server needed — everything happens locally via Chrome messaging.

let hudlPort = null;   // Connection from content-hudl.js
let appPort = null;     // Connection from content-app.js
let lastClipIndex = -1; // Track to avoid duplicate events

// Handle connections from content scripts
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === 'hudl-sync-hudl') {
    hudlPort = port;
    console.log('[AC Sync] Hudl tab connected');
    notifyStatus();

    port.onMessage.addListener((msg) => {
      if (msg.type === 'clip-changed') {
        // Hudl clip changed → tell the app
        if (msg.clipIndex !== lastClipIndex) {
          lastClipIndex = msg.clipIndex;
          if (appPort) {
            appPort.postMessage({
              type: 'hudl-clip-changed',
              clipIndex: msg.clipIndex,
              clipTitle: msg.clipTitle || '',
            });
          }
        }
      }
    });

    port.onDisconnect.addListener(() => {
      hudlPort = null;
      console.log('[AC Sync] Hudl tab disconnected');
      notifyStatus();
    });
  }

  if (port.name === 'hudl-sync-app') {
    appPort = port;
    console.log('[AC Sync] App tab connected');
    notifyStatus();

    port.onMessage.addListener((msg) => {
      if (msg.type === 'command') {
        // App sent a command → relay to Hudl
        if (hudlPort) {
          hudlPort.postMessage({
            type: 'send-key',
            key: msg.key, // 'ArrowRight', 'ArrowLeft', 'Space'
          });
        }
      }
    });

    port.onDisconnect.addListener(() => {
      appPort = null;
      console.log('[AC Sync] App tab disconnected');
      notifyStatus();
    });
  }
});

// Respond to popup status queries
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'get-status') {
    sendResponse({
      hudlConnected: !!hudlPort,
      appConnected: !!appPort,
    });
  }
});

function notifyStatus() {
  // Update badge
  const connected = hudlPort && appPort;
  chrome.action.setBadgeText({ text: connected ? '✓' : '' });
  chrome.action.setBadgeBackgroundColor({ color: connected ? '#22c55e' : '#ef4444' });
}
