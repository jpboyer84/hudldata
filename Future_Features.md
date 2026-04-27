# Future Features

## 1. Chrome Extension — Hudl ↔ Tracker Sync — IMPLEMENTED
~~One-click Chrome Web Store install~~ — **Now built.** See `chrome-extension/` folder in repo. Ready for Chrome Web Store submission.

## 2. Voice Mode for Tracker — IMPLEMENTED
~~Use the browser's built-in Web Speech API~~ — **Now live.** See VoiceMode.jsx.

---

## Recently Implemented (removed from backlog)

- **Roster / Player ID Mapping** — Discovered Hudl's roster endpoint at `/api/v2/teams/{teamId}/seasons/{seasonId}/roster`. Railway now auto-fetches the roster, and the app resolves raw participant IDs (e.g. `121936871`) to `#14 Wyatt Tewell` in passer/rusher/receiver fields before data reaches the AI. Zero manual entry, fully automatic.
- **Hudl Column Sets Auto-Sync** — Hudl column sets now auto-load as templates in the tracker (with HUDL badge). Fetched via `/api/hudl/column-sets` on Railway.
- **Varsity Only Filter** — Checkbox in Stats picker (default ON). Excludes plays where OPP PASSER = 99 or VARSITY = N/No. Replaces the old "PASSER 99 JV Exclusion" concept with a more robust filter.
- **Per-Coach Spotlight Feedback Sync** — Moved from localStorage to Supabase `spotlight_feedback` table. Feedback syncs across devices per coach.
- **Dynamic Hudl Columns** — `normalizeClip` passes through ALL breakdownData keys. `/api/hudl/columns` returns structured column list dynamically. New Hudl columns appear automatically without code changes.
- **Cross-device sync** — Saved insights, spotlight feedback, and play position all stored in Supabase instead of localStorage.
- **Voice Mode for Tracker** — Web Speech API-based voice input. Tap 🎤 in the bottom nav to enter voice mode. Continuous listening with auto-restart. Parses football speech: "1st and 10 own 20 right hash run gain of 5" → fills DN, DIST, YARDLN, HASH, PLAYTYPE, GAINLOSS. Commands: "next play", "previous", "clear", "stop". See `VoiceMode.jsx`.
- **Chrome Extension — Hudl ↔ Tracker Sync** — Bidirectional sync between Hudl video and Assistant Coach tracker. Advance a clip in Hudl → tracker follows. Hit Next on the tracker → Hudl advances. Uses MutationObserver on Hudl's DOM (based on Hudl HUD open source). No server relay needed — all local via Chrome messaging. Extension files in `chrome-extension/` folder. Ready for Chrome Web Store submission ($5 developer account).
