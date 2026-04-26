# Future Features

## 1. Chrome Extension — Hudl ↔ Tracker Sync
One-click Chrome Web Store install. Extension watches the Hudl video page for clip changes using a MutationObserver on the active row (proven pattern from the open-source Hudl HUD extension). When a coach advances a clip in Hudl, it signals Assistant Coach via Railway relay (SSE), and the tracker auto-advances to match. Works bidirectionally — hitting Next on the tracker can also send a right-arrow keypress to the Hudl tab to advance the video. Requires Hudl to be open in Chrome on a computer (no native app support due to Apple sandboxing). Published to the Chrome Web Store for one-click install.

**Key references:**
- Hudl HUD extension (open source): `github.com/tippold/hudl-hud` — `getActiveRow()` function and `MutationObserver` pattern for detecting active clip
- Hudl DOM selectors: `#clips tr.playing`, `tr.selected`, `.nowPlaying`, `aria-selected`
- Hudl keyboard shortcuts: right arrow = next clip, left arrow = prev clip, space = play/pause
- Railway relay endpoints needed: `/api/remote/send` and `/api/remote/listen` (SSE)
- noHuddleRemote (Rose-Hulman): Chrome Extension + phone app combo that controls Hudl playback over WiFi — same concept, different direction

## 2. PASSER 99 JV Exclusion Filter
When a play's PASSER column = 99, that signals JV took over. All plays from that point forward in that cutup should be excluded from Stats & Analysis (Spotlight, Ask AI, and visual charts). Affects three functions: `renderStatsFromData`, `buildDataSummary`, and `runSpotlightAnalysis`. All three already filter `p.ignore === 'SKIP'` — this adds a second filter pass that scans per-cutup and marks passer-99-onward plays as excluded. Could be a hard filter or a toggle in the Stats filter drawer.

## 3. Voice Mode for Tracker
Use the browser's built-in Web Speech API (works in Chrome and Safari/iOS) to dictate play data hands-free. Coach enters voice mode, speaks play info like "1st and 10, own 20, right hash, run right, gain of 5" and the tracker parses it into the correct columns. "Next play" advances the tracker. Parsing pipeline: speech → text → pattern matching against column definitions and button values. Football vocabulary is small and predictable (downs, distances, hash, play types, results, formations), making recognition reliable. Best suited for film review in quiet environments; sideline noise would be a challenge.

## 4. Per-Coach Spotlight Feedback Sync
Move Spotlight thumbs up/down feedback from `localStorage` (`hd_spotlight_feedback`) to Supabase so it syncs across devices per coach. Currently feedback is per-browser/per-device and doesn't follow the coach to other devices or survive a cache clear. Create a `spotlight_feedback` table in Supabase with `user_id`, `insight_key`, and `liked` (boolean) columns, protected by RLS so each coach only sees their own preferences. On login, pull that coach's feedback history; on thumbs up/down, upsert to Supabase instead of localStorage. The AI prompt that receives feedback data stays the same — it just reads from a different source. Each coach on staff develops their own preferences independently.
