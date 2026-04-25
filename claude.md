# Assistant Coach — React App

## Tech Stack
- React + Vite + Tailwind CSS
- Supabase (auth, database, RLS)
- SheetJS (xlsx) for Excel export
- Deployed on Vercel at hudldata.vercel.app

## Supabase
- Project: whprzpxsallowwwrmaja.supabase.co
- RLS enabled on all tables
- Team creation uses `create_team_and_coach` RPC function (SECURITY DEFINER)
- Team join uses `join_team_with_code` RPC function

## Design Tokens (from index.css :root)
- Background: #0c0c0e
- Surface: #161618 / Surface2: #1e1e20
- Border: #222224 / Col-border: #2a2a2c
- Text: #ffffff / Muted: #aaa / Muted2: #ccc
- Accent: #e8590c (orange)
- Selected: white bg, black text
- Font: Inter (Google Fonts)

## Key Architecture
- Auth: Supabase Auth via useAuth hook
- Data: Supabase tables (teams, coaches, games, templates, columns)
- All CRUD via src/lib/supaData.js helper functions
- Column definitions in src/columns.js (DEFAULT_COLUMNS)
- XLSX export via src/utils/xlsxExport.js

## Phase Status
- Phase 1 ✓ — Auth, landing page, settings, Hudl connect
- Phase 2 ✓ — Tracker grid, templates, columns, archive, new game, XLSX export
- Phase 3 — Stats & AI, cutup picker, spotlight, ask AI
- Phase 4 — PWA, import/export, help, Stripe

## Routes
- / — LandingPage
- /trackers — TrackersHubPage (new game + recent games)
- /tracker/:gameId — TrackerPage (play-by-play grid)
- /archive — ArchivePage (all games, select/export)
- /templates — TemplatesPage (list, edit, delete)
- /templates/new — TemplateBuilderPage
- /templates/edit/:id — TemplateBuilderPage (edit mode)
- /columns — ColumnsPage (list custom columns)
- /columns/new — ColumnBuilderPage
- /columns/edit/:id — ColumnBuilderPage (edit mode)
- /settings — SettingsPage
- /login, /signup, /forgot-password, /team-setup — Auth flow

## Backend
- Railway: hudl-mcp-production.up.railway.app (unchanged from HTML version)
- Endpoints: /api/library, /api/clips/:id, /api/hudl/auth, /api/hudl/write, /api/claude
