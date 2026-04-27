# Assistant Coach — Voice Mode & Chrome Extension Handoff
**Session: April 27, 2026**

---

## VOICE MODE (VoiceMode.jsx)

### Status: Working, needs field testing

### Architecture
- Component: `src/components/VoiceMode.jsx`
- Integration: `src/pages/TrackerPage.jsx` — 🎤 button in bottom nav bar
- API: Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`)
- Mode: Single-utterance (`continuous: false`) with 1.5s restart delay

### How It Works
1. Coach taps 🎤 in bottom nav → `voiceActive` state toggles on
2. VoiceMode component starts `SpeechRecognition` in single-utterance mode
3. Coach speaks → browser returns final transcript
4. `parseFootballSpeech(text)` parses into column values
5. `onValues(parsed)` calls `setVal(colId, value)` for each parsed field
6. Recognition ends → waits 1.5 seconds → auto-restarts (prevents feedback loop)
7. Coach says "stop" or taps ⏹ → voice mode turns off

### Speech Parser (parseFootballSpeech)
Handles these patterns:
- Down/distance: "1st and 10", "2nd down and 7", "third and goal"
- Quarter: "quarter 2", "Q3", "2nd quarter", "quarter two"
- Yard line: "at own 20", "own 35", "at the 45 yard line"
- Hash: "left hash", "right hash", "middle"
- Play type: "run", "pass", "rush", "carry"
- Direction: "run left", "pass right"
- Result: "complete", "incomplete", "sack", "scramble", "fumble", "interception", "touchdown"
- Gain/Loss: "gain of 5", "3 yard gain", "loss of 2", "no gain"
- ODK: "offense", "defense", "kicking"
- Commands: "next play", "previous", "clear", "stop"

### Bug Fixed This Session
**Feedback loop / beeping**: The mic was picking up the browser's start/stop sounds, creating an infinite loop. Fixed by:
1. Changed `continuous: true` → `continuous: false` (single utterance)
2. Changed `interimResults: true` → `interimResults: false`
3. Added 1.5s delay between restart attempts
4. Added `stoppedRef` to prevent restart after "stop" command

### Known Limitations
- Works best in quiet environments (not sideline)
- Safari on iOS may require user to tap mic each time (varies by iOS version)
- Number words only go up to fifty (could add more)
- Doesn't parse formation names or play names (only built-in column values)

### Potential Improvements
- Parse formation names from playbook data
- Parse play names from playbook data
- Add "undo" command to revert last values
- Show confidence score from speech recognition
- Add a "training" mode where coach can test phrases without filling data

---

## CHROME EXTENSION (chrome-extension/ folder)

### Status: Partially working — needs debugging

**What works:**
- Extension installs and loads on Hudl pages ✓
- Content script detects room code from Hudl URL ✓
- Background worker receives room code ✓
- TrackerPage connects to Railway SSE and shows "SYNCED" badge ✓
- TrackerPage POSTs commands to Railway on Next/Prev ✓

**What needs debugging:**
- Background worker's fetch-based SSE stream reader may not be receiving events
- Keystroke simulation on Hudl hasn't been confirmed working
- MutationObserver clip detection hasn't been confirmed (DOM selectors may not match current Hudl UI)

### Architecture

```
PHONE (tracker)                    RAILWAY                     COMPUTER (Hudl + extension)
─────────────────                  ──────────                  ─────────────────────────────
TrackerPage.jsx                    index.js                    background.js
  ↕ SSE connection ──────────────→ /api/sync/listen/:room ←── fetch stream reader
  ↕ POST on Next/Prev ──────────→ /api/sync/push ───────────→ relays to all listeners
                                                                ↓
                                                              content-hudl.js
                                                                → simulateKey('ArrowRight')
                                                                → MutationObserver detects change
                                                                → port.postMessage to background
                                                                → background pushes to Railway
                                                                → TrackerPage receives via SSE
```

### Files

**`chrome-extension/manifest.json`**
- Manifest V3
- Permissions: `activeTab`, `tabs`
- Host permissions: `hudl.com`, `hudldata.vercel.app`, `hudl-mcp-production.up.railway.app`
- Content scripts run on `hudl.com/*` and `hudldata.vercel.app/*`

**`chrome-extension/background.js`** — Service worker
- Receives room code from content-hudl.js
- Opens fetch-based SSE stream reader to Railway `/api/sync/listen/:room`
- Relays events between content scripts and Railway
- Pushes clip changes to Railway when Hudl clip changes
- Receives remote commands from Railway and forwards to content-hudl.js
- Handles same-browser tab-to-tab relay (local messaging)
- Uses fetch stream reader instead of EventSource (MV3 service workers get killed, EventSource won't survive)

**`chrome-extension/content-hudl.js`** — Hudl page script
- DOM only — NO direct Railway communication
- Detects active clip via MutationObserver on selectors: `#clips tr.playing`, `tr.playing`, `tr.selected`, etc.
- Simulates keystrokes (ArrowRight/ArrowLeft/Space) via KeyboardEvent dispatch
- Sends room code to background on load
- Sends clip changes to background
- Receives keystroke commands from background

**`chrome-extension/content-app.js`** — App page script
- Bridges React app ↔ extension via `window.postMessage`
- Listens for `{ source: 'assistant-coach-sync', action: 'next-clip' }` from React
- Forwards to background worker
- Receives clip changes from background → posts back to React
- Announces `extension-ready` to React app

**`chrome-extension/popup.html` + `popup.js`** — Status popup
- Shows Hudl tab connection status (green/red dot)
- Shows App tab connection status
- Displays room code (auto-detected from Hudl URL)

### Railway Sync Endpoints (index.js)

```
GET  /api/sync/listen/:room   — SSE stream, auto-reconnects, 30s keepalive
POST /api/sync/push           — Push event to all listeners in room
                                Body: { room, type, data }
GET  /api/sync/status/:room   — Returns { room, listeners: N }
```

Room code = Hudl team ID (e.g. `107097`). Auto-detected from:
- Extension: parsed from Hudl URL pathname
- Tracker: `coach.hudl_team_id || coach.team_id`

CORS: Sync endpoints allow `*` origin. General endpoints allow `hudldata.vercel.app` + `www.hudl.com`.

### TrackerPage Integration (TrackerPage.jsx)

```javascript
// Cross-device: connects to Railway SSE on mount
useEffect(() => {
  const room = coach?.hudl_team_id || coach?.team_id;
  const es = new EventSource(`${HUDL_API}/api/sync/listen/${room}`);
  es.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'clip-changed') setPlayIdx(data.clipIndex);
  };
}, [coach]);

// Next/Prev push to Railway
fetch(`${HUDL_API}/api/sync/push`, {
  method: 'POST',
  body: JSON.stringify({ room, type: 'command', data: { key: 'ArrowRight' } }),
});
```

Shows "SYNCED" badge in header when connected.

### Debugging Next Steps

1. **Verify background SSE connection**: Click "Inspect views: service worker" on the extension card in `chrome://extensions`. Check console for `[AC Sync BG] Room set: 107097` and `[AC Sync BG] Starting poll for room: 107097` and `[AC Sync BG] Railway connected`.

2. **Verify Railway receives push**: From the phone tracker, hit Next. Then check `https://hudl-mcp-production.up.railway.app/api/sync/status/107097` — it should show `{ listeners: N }` where N > 0.

3. **Verify keystroke simulation**: If the background receives the command, check the Hudl tab console for `[AC Sync] Simulating key: ArrowRight`. If this appears but Hudl doesn't advance, the issue is that Hudl's video player doesn't respond to synthetic KeyboardEvents (some sites block them). Alternative: use `document.querySelector('.video-next-btn')?.click()` to click Hudl's actual Next button instead of simulating keystrokes.

4. **Verify clip detection**: Navigate clips manually in Hudl. Check console for `[AC Sync] Clip changed → index N`. If this never appears, the DOM selectors don't match current Hudl UI. Inspect the Hudl page to find what CSS class marks the active/playing clip row.

### Known Issues
- MV3 service workers get terminated after ~30s of inactivity. The fetch stream reader approach should keep it alive, but if it doesn't, may need `chrome.alarms` as a keepalive fallback.
- Hudl may use React/virtual DOM that doesn't trigger MutationObserver reliably. May need to poll for active clip instead.
- Synthetic KeyboardEvent may not work on Hudl if they use React's synthetic event system. May need to dispatch on a specific DOM element or click actual UI buttons.
