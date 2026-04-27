# Future Features

## 1. Chrome Extension — Hudl ↔ Tracker Sync
One-click Chrome Web Store install. Extension watches the Hudl video page for clip changes using a MutationObserver on the active row (proven pattern from the open-source Hudl HUD extension). When a coach advances a clip in Hudl, it signals Assistant Coach via Railway relay (SSE), and the tracker auto-advances to match. Works bidirectionally — hitting Next on the tracker can also send a right-arrow keypress to the Hudl tab to advance the video. Requires Hudl to be open in Chrome on a computer (no native app support due to Apple sandboxing). Published to the Chrome Web Store for one-click install.

**Key references:**
- Hudl HUD extension (open source): `github.com/tippold/hudl-hud` — `getActiveRow()` function and `MutationObserver` pattern for detecting active clip
- Hudl DOM selectors: `#clips tr.playing`, `tr.selected`, `.nowPlaying`, `aria-selected`
- Hudl keyboard shortcuts: right arrow = next clip, left arrow = prev clip, space = play/pause
- Railway relay endpoints needed: `/api/remote/send` and `/api/remote/listen` (SSE)
- noHuddleRemote (Rose-Hulman): Chrome Extension + phone app combo that controls Hudl playback over WiFi — same concept, different direction

## 2. Voice Mode for Tracker
Use the browser's built-in Web Speech API (works in Chrome and Safari/iOS) to dictate play data hands-free. Coach enters voice mode, speaks play info like "1st and 10, own 20, right hash, run right, gain of 5" and the tracker parses it into the correct columns. "Next play" advances the tracker. Parsing pipeline: speech → text → pattern matching against column definitions and button values. Football vocabulary is small and predictable (downs, distances, hash, play types, results, formations), making recognition reliable. Best suited for film review in quiet environments; sideline noise would be a challenge.

---

## Recently Implemented (removed from backlog)

- **Roster / Player ID Mapping** — Discovered Hudl's roster endpoint at `/api/v2/teams/{teamId}/seasons/{seasonId}/roster`. Railway now auto-fetches the roster, and the app resolves raw participant IDs (e.g. `121936871`) to `#14 Wyatt Tewell` in passer/rusher/receiver fields before data reaches the AI. Zero manual entry, fully automatic.
- **Hudl Column Sets Auto-Sync** — Hudl column sets now auto-load as templates in the tracker (with HUDL badge). Fetched via `/api/hudl/column-sets` on Railway.
- **Varsity Only Filter** — Checkbox in Stats picker (default ON). Excludes plays where OPP PASSER = 99 or VARSITY = N/No. Replaces the old "PASSER 99 JV Exclusion" concept with a more robust filter.
- **Per-Coach Spotlight Feedback Sync** — Moved from localStorage to Supabase `spotlight_feedback` table. Feedback syncs across devices per coach.
- **Dynamic Hudl Columns** — `normalizeClip` passes through ALL breakdownData keys. `/api/hudl/columns` returns structured column list dynamically. New Hudl columns appear automatically without code changes.
- **Cross-device sync** — Saved insights, spotlight feedback, and play position all stored in Supabase instead of localStorage.
