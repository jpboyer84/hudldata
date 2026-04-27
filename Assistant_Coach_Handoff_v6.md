# Assistant Coach — Handoff Document v6.0
**Last updated: April 27, 2026**

---

## What's Live

**App URL:** `hudldata.vercel.app` (React app, Vercel auto-deploy from GitHub)
**Backend URL:** `hudl-mcp-production.up.railway.app` (Node.js/Express, Railway auto-deploy)

### Repos
- **Frontend:** `jpboyer84/hudldata` — React/Vite app
- **Backend:** `jpboyer84/hudl-mcp` — Railway server (`index.js`, currently v7.3.0)
- **GitHub Token:** Classic token with repo scope — stored in Claude project memory. Claude pushes directly via GitHub API.

### Infrastructure
- **Supabase** project `whprzpxsallowwwrmaja` (us-west-2) — auth, database, RLS
- **Vercel** — auto-deploys frontend on push to `jpboyer84/hudldata`
- **Railway** — auto-deploys backend on push to `jpboyer84/hudl-mcp`
- **Anthropic API** — Tier 2 ($40 deposit), key stored as `CLAUDE_API_KEY` Railway env var. Prompt caching enabled.
- **Google Drive** — OAuth Client ID `84897695205-bmhd3g2etbd4i2nulei934df12tss6qd.apps.googleusercontent.com`
- **Hudl** — Team ID `107097`, credentials stored as Railway env vars (`HUDL_EMAIL`, `HUDL_PASSWORD`, `HUDL_TEAM_ID`)

---

## Frontend Architecture

### Tech Stack
React 18, Vite, Supabase JS, Tailwind-inspired custom CSS, Recharts (stats charts), SheetJS (XLSX export)

### File Structure
```
src/
├── App.jsx              — Router, all routes defined here
├── main.jsx             — Entry point
├── index.css            — Global styles (dark theme, mobile-first)
├── columns.js           — 40+ built-in column definitions (232 lines)
├── pages/
│   ├── TrackerPage.jsx      — Play tracker (793 lines) — the core feature
│   ├── TrackersHubPage.jsx  — Tag Game Film hub (games list, + New, Hudl load)
│   ├── StatsPage.jsx        — Stats & analysis (616 lines) — Spotlight, Stats, Ask AI, Saved
│   ├── LandingPage.jsx      — Home screen with nav cards
│   ├── PlaybookPage.jsx     — 10-section playbook editor
│   ├── SettingsPage.jsx     — Settings, backup/restore (device + Google Drive), Hudl connect
│   ├── HelpPage.jsx         — FAQ (collapsible sections) + Ask AI assistant
│   ├── ArchivePage.jsx      — All games archive
│   ├── ColumnsPage.jsx      — Column library (built-in + custom, all editable)
│   ├── ColumnBuilderPage.jsx— Column editor (buttons, supports built-in overrides)
│   ├── TemplatesPage.jsx    — Template library
│   ├── TemplateBuilderPage.jsx — Template editor
│   ├── XlsxImportPage.jsx   — XLSX import with column mapping
│   ├── TeamSetupPage.jsx    — Team creation/join flow
│   ├── LoginPage.jsx        — Supabase auth
│   ├── SignupPage.jsx       — Registration
│   ├── ForgotPasswordPage.jsx
│   └── ResetPasswordPage.jsx
├── components/
│   ├── HudlCutupPicker.jsx  — Multi-select cutup picker with filters, ALL/NONE buttons
│   ├── HudlLibraryModal.jsx — Browse Hudl library
│   ├── HudlLoginModal.jsx   — Hudl credential entry
│   ├── NewGameModal.jsx     — New game form (parses Hudl titles for auto-fill)
│   ├── ConfirmModal.jsx     — Reusable confirm dialog
│   ├── Modals.jsx           — Dropdown, PlayNav, EditGame modals
│   ├── Header.jsx           — Shared header component
│   ├── ColumnCard.jsx       — Column display card
│   └── OAuthButtons.jsx     — Google/Apple auth buttons
├── lib/
│   ├── playbook.js          — AI prompts, playbook CRUD, 10 sections (194 lines)
│   ├── hudlData.js          — Hudl clip fetching, roster resolution, column sets (220 lines)
│   ├── hudlCache.js         — localStorage clip cache (24hr TTL)
│   ├── supaData.js          — All Supabase CRUD (games, templates, columns, playbook)
│   ├── supabase.js          — Supabase client init
│   └── constants.js         — API URLs
├── utils/
│   ├── statsCalc.js         — Stat calculations, summary builder, CSV builder (489 lines)
│   └── xlsxExport.js        — XLSX export logic
└── hooks/
    ├── useAuth.jsx          — Auth context (login, signup, coach state, Hudl connect)
    └── useToast.jsx         — Toast notification hook
```

### Key File Details

**`columns.js`** — 40+ built-in columns with button definitions. Each column: `{id, name, type, btns[{l,v}]}`. Types: `buttons`, `btns_dd` (buttons + dropdown), `numpad`, `calc`. QTR buttons are Q1/Q2/Q3/Q4. Columns are editable — edits saved to Supabase as overrides.

**`playbook.js`** — 10 playbook sections: Team Info, Run Plays, Pass Protection, Pass Plays, Formations, Tags & Motion, Defensive Terms, Terminology, Stat Rules, General Notes. All use `-` delimiter (not `=`) for mobile typing. Terminology section pre-populated with 20 football abbreviations (TFL, LOS, QBR, etc.). `buildAskAISystemPrompt()` constructs the full AI prompt with playbook context, football stat definitions, and play data.

**`statsCalc.js`** — `calcStats(plays)` computes overview/offense/defense/field/quarter breakdowns. `buildSummaryObj(plays)` creates the JSON summary for AI. `buildSlimCsv(plays)` creates the CSV with all columns including passer/rusher/receiver. TFL detection: any play with negative yardage, excluding fumbles and penalties. Two TFL metrics: `offense.tflAgainst` (opponent tackled us) and `defense.tflsForced` (we tackled opponent).

**`hudlData.js`** — `fetchHudlClips()` loads clips via Railway. `resolvePlayerIds(clips, roster)` replaces Hudl participant IDs with `#14 Wyatt Tewell` labels. `fetchRoster(seasonId)` gets the roster mapping. `fetchHudlColumnSets()` loads Hudl column sets as templates. `hudlClipsToPlays()` converts Hudl clip format to app play format.

---

## Tracker Features (TrackerPage.jsx)

- **Auto-advance** — Next Play advances to next row, carries forward QTR and ODK
- **DN/DIST auto-fill** — Based on previous play's result and gain/loss
- **Play position memory** — Remembers which play you're on
- **Undo / Clear All** — With confirmation modal
- **Spreadsheet view** — Toggle between card view and table view
- **Column picker** — Show/hide columns per session
- **Template switch/save** — Switch between templates (Supabase + Hudl column sets with HUDL badge)
- **Button editor** — Add custom buttons to any column inline
- **Hudl write-back** — Send tracked data back to Hudl via `/api/hudl/write-bulk`
- **XLSX export** — Download plays as spreadsheet
- **Bottom nav** — Prev, + Rows, Next play (Q1 indicator removed)

---

## Stats & Analysis (StatsPage.jsx)

### Four Main Tabs
1. **SPOTLIGHT** — AI auto-generates insight cards on data load. ❓ methodology modal, 👍/👎 feedback, "Generate more" button. Feedback stored in localStorage.
2. **STATS** — Five sub-tabs (Overview, Offense, Defense, Field, By Qtr) with visual bar charts. Sub-tabs styled as filled toggle buttons (green OFF, blue DEF). Down breakdown includes run%/pass%/avg table. Hash section includes run/pass tendency table.
3. **ASK** — Chat interface to ask questions about play data. Stateless (no history accumulation). Voice input via Web Speech API (🎤 button). Button says "Ask →". Prompt caching enabled (`cache_control: ephemeral`).
4. **SAVED** — Pinned AI answers (📌 button on each response).

### Filter / Cutup Picker
- Header shows selected playlist names (or "FILTER ▼" when empty)
- Refresh button (↺) next to filter
- Picker remembers both selected IDs AND filter state (type, year, home/away) on reopen
- ALL / NONE buttons in footer for bulk selection
- Search, type filters (Game/Scout/JV/Other/Tracked), year filters, home/away filters

### AI Pipeline
1. **Data loading** — Clips fetched from Railway → roster auto-fetched using `seasonId` from first clip → player IDs resolved to `#14 Name` → plays converted and stats calculated
2. **Ask AI prompt** — System prompt includes: playbook context, football stat definitions (including TFL perspective), pre-computed summary JSON, slim CSV with all columns including passer/rusher/receiver. Sent with `cache_control: ephemeral` so the ~19K token prompt is cached for 5 minutes.
3. **Model** — Claude Sonnet 4.6 via Railway proxy (`/api/claude`) with `anthropic-beta: prompt-caching-2024-07-31` header
4. **Rate limit handling** — Auto-retry once after 5 seconds on rate limit. Tier 2 + caching makes limits essentially irrelevant.

---

## Playbook (PlaybookPage.jsx)

10 sections stored in Supabase `playbooks` table (one row per team, one column per section):

| # | Section | Emoji | DB Column |
|---|---------|-------|-----------|
| 1 | Team Info | 🏫 | team_info |
| 2 | Run Plays | 🏃 | run_plays |
| 3 | Pass Protection | 🛡️ | pass_pro |
| 4 | Pass Plays | 🎯 | pass_plays |
| 5 | Formations | 🗂 | formations |
| 6 | Tags & Motion | 🏷 | tags |
| 7 | Defensive Terms | 🛡 | defense |
| 8 | Terminology | 📖 | terminology |
| 9 | Stat Rules | 📐 | stat_rules |
| 10 | General Notes | 📝 | general |

All content is injected into every AI prompt (Spotlight, Ask AI, Help AI). Uses `-` delimiter for mobile-friendly entry.

---

## Settings & Help

### Settings (SettingsPage.jsx)
- Team info display (name, school, city/state, invite code)
- Hudl connect/disconnect
- Hudl cache stats and clear
- Backup: Save to Device (JSON) + Save to Google Drive
- Restore: From Device (JSON) + From Google Drive (Picker API)
- Account / Sign out

### Help (HelpPage.jsx)
- FAQ tab with collapsible sections (▾ toggle) and expandable Q&A items
- FAQ content updated: describes Saved tab (📌) and Playbook as live features
- Ask a Question tab with AI assistant (button says "Ask →")

---

## Hudl Integration

### Per-Coach Auth
- POST `/api/hudl/auth` — accepts `{email, password}`, tries HTTP login first, falls back to Puppeteer
- Returns session cookie + team info
- Cookie stored in coach's Supabase record (`hudl_cookie`), sent via `X-Hudl-Cookie` header
- Connect button on Landing page, disconnect in Settings

### Data Flow
1. **Library** — GET `/api/library` → GraphQL `Web_PerformanceCore_GetLibraryItems_r1`
2. **Clips** — GET `/api/clips/:cutupId` → REST `/api/v2/teams/{teamId}/playlists/{id}/clips/`
3. **Roster** — GET `/api/hudl/roster/:seasonId` → REST `/api/v2/teams/{teamId}/seasons/{seasonId}/roster` — returns player map `participantId → {jersey, name, label, positions}`. Cached 24hr.
4. **Column Sets** — GET `/api/hudl/column-sets` → Hudl `GetAvailableColumnSets` + `LoadColumnSet` — returns templates with column mappings. Cached in memory.
5. **Write-back** — POST `/api/hudl/write-bulk` → Hudl `SetColumnValue` — sends play data back to Hudl
6. **normalizeClip** — Extracts: id, seasonId, odk, quarter, down, distance, yard_line, hash, play_type, result, gain_loss, off_form, off_play, play_dir, eff, team, opp_team, passer, rusher, receiver, series

### Key Hudl Column IDs
ODK=2626912, QTR=2626932, DN=2626907, DIST=2626908, YARD LN=2626913, HASH=2626914, PLAY TYPE=2626909, RESULT=2626910, GN/LS=2626911, SERIES=2626915, OFF FORM=2626917, OFF PLAY=2626918

### Hudl ID Resolution
- Clip data returns `participantId` strings (e.g. `121936871`) for PASSER, RUSHER, RECEIVER
- `seasonId` is extracted from each clip and used to fetch roster from `/api/v2/teams/{teamId}/seasons/{seasonId}/roster`
- `resolvePlayerIds()` replaces IDs with `#14 Wyatt Tewell` labels before data reaches the AI or stats

---

## Railway Server (index.js — v7.3.0, 1537 lines)

### Endpoints
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/library` | Hudl library items (GraphQL) |
| GET | `/api/clips/:id` | Clips for a cutup (REST) |
| GET | `/api/hudl/roster/:seasonId` | Team roster for a season |
| GET | `/api/hudl/columns` | Available Hudl columns |
| GET | `/api/hudl/column-sets` | Hudl column sets (templates) |
| GET | `/api/hudl/column-sets/:id` | Single column set detail |
| POST | `/api/hudl/column-sets` | Save/update a column set |
| GET | `/api/hudl/breakdown/:cutupId` | Raw breakdown data |
| POST | `/api/hudl/write` | Write single column value |
| POST | `/api/hudl/write-bulk` | Write multiple plays/columns |
| POST | `/api/hudl/auth` | Per-coach Hudl login |
| POST | `/api/claude` | Claude API proxy with prompt caching header |

### Environment Variables
`HUDL_EMAIL`, `HUDL_PASSWORD`, `HUDL_TEAM_ID`, `CLAUDE_API_KEY`

---

## Supabase Schema

### Tables

**teams** — id (uuid PK), name, school, city, state, hudl_team_id, invite_code, created_at

**coaches** — id (uuid PK, = auth.uid), email, display_name, team_id (FK→teams), role, hudl_cookie, hudl_team_id, hudl_team_name, hudl_connected_at, created_at

**games** — id (uuid PK), team_id (FK→teams), created_by (FK→coaches), home, away, week, date, game_type, template_id, hudl_source, hudl_cutup_id, plays (jsonb), created_at, updated_at

**templates** — id (uuid PK), team_id, name, col_ids (text[]), hudl_column_set_id, sort_order, created_at

**columns** — id (uuid PK), team_id, data_key, name, known_values (text[]), hudl_column_id, sort_order, created_at

**playbooks** — id (uuid PK), team_id, team_info, run_plays, pass_pro, pass_plays, formations, tags, defense, terminology, stat_rules, general, updated_by, updated_at

**saved_insights** — id (uuid PK), coach_id, team_id, question, answer, data_label, created_at

**spotlight_feedback** — id (uuid PK), coach_id, team_id, headline, stat, tag, liked (bool), created_at

All tables have RLS enabled, scoped to `team_id` matching the coach's team.

---

## Key Patterns & Learnings

- **Prompt caching** — System prompt sent with `cache_control: { type: 'ephemeral' }` as a structured block. Railway proxy includes `anthropic-beta: prompt-caching-2024-07-31` header. Cached tokens don't count toward rate limits.
- **TFL perspective** — `offense.tflAgainst` = opponent tackled US for a loss. `defense.tflsForced` = WE tackled the opponent. Excludes fumbles and penalties.
- **Player ID resolution** — Automatic via Hudl roster endpoint. `seasonId` comes from clip data, roster cached 24hr on both Railway and frontend.
- **Hudl column sets** — Auto-loaded as templates with `isHudl: true` flag and HUDL badge in template switcher.
- **Ask AI is stateless** — Each question is independent (no chat history sent). Full data + summary sent each time. Caching makes this efficient.
- **Columns are all editable** — Built-in columns show in the Columns page with EDIT buttons. Edits create Supabase overrides (original built-in stays intact).
- **HudlCutupPicker** — Remembers both selected IDs and active filters (type, year, home/away) between opens. Has ALL/NONE buttons.
- **GitHub pushes** — Claude pushes directly via GitHub API using the classic token. No need for `/api/deploy`.
- **Safari/iPad** — Native `confirm()` replaced with custom modals throughout. Touch-friendly UI.
- **Google Drive** — Uses GSI (Google Sign-In) token client + Google Picker API for file selection. No server-side auth needed.

---

## Future Features (see Future_Features.md)

1. Chrome Extension — Hudl ↔ Tracker bidirectional sync
2. PASSER 99 JV Exclusion Filter
3. Voice Mode for Tracker (Web Speech API)
4. Per-Coach Spotlight Feedback Sync (Supabase)

### Recently Implemented
- Roster / Player ID auto-mapping via Hudl's `/api/v2/teams/{teamId}/seasons/{seasonId}/roster`
- Hudl Column Sets auto-sync as templates
- Prompt caching for Ask AI (eliminates rate limits)
- TFL fix (negative yardage, excludes fumbles/penalties, bidirectional perspective)
- Playbook Terminology section + Pass Protection section
- All columns editable (including built-ins)
- Google Drive backup/restore
- FAQ content updated, collapsible sections
- Stats page matched to HTML version (sub-tab styling, voice input, down/hash tables)
