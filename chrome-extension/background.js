// ─── BACKGROUND SERVICE WORKER ───────────────────────────────
// Handles cross-device sync via Railway polling + local tab relay.
// Uses polling instead of SSE because Manifest V3 service workers
// get killed after 30s of inactivity (SSE won't survive).

const RELAY = 'https://hudl-mcp-production.up.railway.app';

let hudlPort = null;
let appPort = null;
let currentRoom = null;
let pollTimer = null;
let lastEventId = 0;

// ─── LOCAL TAB MESSAGING ──────────────────────────────────────

chrome.runtime.onConnect.addListener((port) => {
  if (port.name === 'hudl-sync-hudl') {
    hudlPort = port;
    console.log('[AC Sync BG] Hudl tab connected');

    port.onMessage.addListener((msg) => {
      if (msg.type === 'set-room') {
        currentRoom = msg.room;
        console.log('[AC Sync BG] Room set:', currentRoom);
        startPolling();
      }
      if (msg.type === 'clip-changed') {
        // Hudl clip changed → tell app tab (local) + Railway (cross-device)
        if (appPort) {
          appPort.postMessage({ type: 'hudl-clip-changed', clipIndex: msg.clipIndex });
        }
        if (currentRoom) {
          pushToRelay('clip-changed', { clipIndex: msg.clipIndex });
        }
      }
    });

    port.onDisconnect.addListener(() => {
      hudlPort = null;
      console.log('[AC Sync BG] Hudl tab disconnected');
      updateBadge();
    });
    updateBadge();
  }

  if (port.name === 'hudl-sync-app') {
    appPort = port;
    console.log('[AC Sync BG] App tab connected');

    port.onMessage.addListener((msg) => {
      if (msg.type === 'command') {
        // App wants to control Hudl
        if (hudlPort) {
          hudlPort.postMessage({ type: 'send-key', key: msg.key });
        }
        if (currentRoom) {
          pushToRelay('command', { key: msg.key });
        }
      }
    });

    port.onDisconnect.addListener(() => {
      appPort = null;
      console.log('[AC Sync BG] App tab disconnected');
      updateBadge();
    });
    updateBadge();
  }
});

// ─── CROSS-DEVICE RELAY VIA POLLING ───────────────────────────

async function pushToRelay(type, data) {
  if (!currentRoom) return;
  try {
    await fetch(`${RELAY}/api/sync/push`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ room: currentRoom, type, data }),
    });
  } catch (err) {
    console.log('[AC Sync BG] Push failed:', err.message);
  }
}

function startPolling() {
  if (pollTimer) clearInterval(pollTimer);
  if (!currentRoom) return;

  console.log('[AC Sync BG] Starting poll for room:', currentRoom);

  // Connect to SSE via a fetch-based approach
  // Background workers can't hold EventSource, so we use long-poll simulation
  pollRoom();
}

async function pollRoom() {
  if (!currentRoom) return;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 35000); // 35s timeout

    const resp = await fetch(`${RELAY}/api/sync/listen/${currentRoom}`, {
      signal: controller.signal,
      headers: { 'Accept': 'text/event-stream' },
    });
    clearTimeout(timeout);

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            handleRelayEvent(data);
          } catch {}
        }
      }
    }
  } catch (err) {
    if (err.name !== 'AbortError') {
      console.log('[AC Sync BG] Poll error:', err.message);
    }
  }

  // Reconnect after a brief pause
  if (currentRoom) {
    setTimeout(pollRoom, 2000);
  }
}

function handleRelayEvent(data) {
  if (data.type === 'connected') {
    console.log('[AC Sync BG] Railway connected');
    updateBadge();
    return;
  }
  if (data.type === 'command' && hudlPort) {
    // Remote tracker sent a command → forward to Hudl tab
    console.log('[AC Sync BG] Remote command:', data.key);
    hudlPort.postMessage({ type: 'send-key', key: data.key });
  }
  if (data.type === 'clip-changed' && appPort) {
    // Remote Hudl clip changed → forward to app tab
    console.log('[AC Sync BG] Remote clip change:', data.clipIndex);
    appPort.postMessage({ type: 'hudl-clip-changed', clipIndex: data.clipIndex });
  }
}

// ─── STATUS ───────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'get-status') {
    sendResponse({
      hudlConnected: !!hudlPort,
      appConnected: !!appPort,
      room: currentRoom,
    });
  }
});

function updateBadge() {
  const connected = hudlPort || currentRoom;
  chrome.action.setBadgeText({ text: connected ? '✓' : '' });
  chrome.action.setBadgeBackgroundColor({ color: '#22c55e' });
}
