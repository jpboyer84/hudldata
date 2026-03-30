# Hudl Data — Play Tracker App

## What this app is
A football play tracking PWA for coaches. Used on iPad and Android tablets during live games. Coaches track play-by-play data by tapping buttons on screen.

## Tech Stack
- React + Vite
- Dexie.js for IndexedDB storage
- Recharts for charts
- Tailwind CSS for styling
- Lucide React for icons
- SheetJS (xlsx) for Excel export
- Deployed on Vercel at hudldata.vercel.app

## Design System
- Background: #111111
- Surfaces: #1e1e1e
- Borders: #3a3a3a
- Text: white
- Unselected buttons: #1e1e1e background, #3a3a3a border, white text
- Selected buttons: #ffffff background, #000000 text, font-weight 900
- Column card borders: #555555
- Font: IBM Plex Mono for UI chrome, Nunito 900 weight for button labels and column headers
- Both fonts loaded from Google Fonts

## App Structure
Two main sections on the landing page:
1. GAMES — list of saved games (home team vs away team, date, row count, column pills)
2. TEMPLATES — list of saved column configurations

### New Game Flow
- User enters Home Team, Away Team, Date
- User selects a Template
- Game is created using a copy of that template's column config
- Each game stores its own independent copy of columns

### Tracker Page
- Spreadsheet bar at top showing column names (muted grey) and current row values
- Play # cell has subtle white tint background
- Three equal nav buttons: ← PREV, ＋ NEW, → NEXT (all same style)
- 2-column grid of column cards below
- Header: ← BACK, game name (Home vs Away), ··· menu, ✕ ROW (yellow), ✕ ALL (red)
- ··· menu contains: Edit Mode, Export XLSX, Backup

## Default Template: "ODK"
10 columns in this exact order:
1. ODK — buttons: O, D, K, S
2. QTR — buttons: 1, 2, 3, 4
3. DN — buttons: 1, 2, 3, 4
4. Dist — buttons: 5, 10, + (+ opens custom 1-99 modal)
5. YARD LN — single button, opens -49 to 50 modal
6. Hash — buttons: L, M, R
7. Play Type — buttons: Run, Pass, STK (STK opens alphabetized dropdown modal)
   Options: 2 Pt., 2 Pt. Defend, Extra Pt., Extra Pt. Block, Fake FG, Fake Punt, FG, FG Block, KO, KO Rec, Onside Kick, Onside Kick Rec, Pass, Punt, Punt Rec, Run
8. Result — buttons: Rush, Incomp (records "Incomplete"), Complete, + dropdown button
   Options: 1st DN, Batted Down, Block, Blocked Def TD, Complete, Complete Fumble, Complete TD, COP, Def TD, Downed, Dropped, Fair Catch, Fumble, Fumble Def TD, Good, Incomplete, Interception, Interception Def TD, Interception Fumble, No Good, No Good Def TD, Offsetting Penalties, Out of Bounds, Penalty, Penalty Safety, Recovered, Return, Rush, Rush Safety, Rush TD, Sack, Sack Fumble, Sack Fumble Def TD, Sack Safety, Safety, Scramble, Scramble TD, TD, Timeout, Tipped, Touchback
9. Gain/Loss — single button, opens -99 to 99 modal
10. Off Form — buttonDropdowns type, each button opens its own dropdown:
    - Red/Blue: Red, Red Near, Red Far, Blue, Blue Near, Blue Far
    - Trio/Leo: Leo, Trio, Leo Squeeze, Trio Squeeze
    - Deuce/Dbl: Deuce, Double, Deuce Squeeze, Double Squeeze, Deuce Stack, Double Stack
    - Ora/Yel: Orange, Yellow, Orange Stack, Yellow Stack
    - Grn/Gld: Green, Gold
    - Brwn/Blck: Black, Brown, Black Near, Black Far, Brown Near, Brown Far, Brown Near Left, Brown Far Left, Black Near Left, Black Far Left, Brown Near Right, Brown Far Right, Black Near Right, Black Far Right
    - Other: Lunch, Bunch, Empty, Full, Empty Wing, Full Wing, Hogs Left, Hogs Right, Queen Left, Queen Right, Krakken Left, Krakken Right
    - Special: Victory, Punt, FG, Kneel
    - Scout: Scout

All dropdown lists display options sorted alphabetically.

## Column Types
- Normal buttons: tap to select, tap again to deselect, one selected at a time
- Dropdown: regular buttons + one special button that opens scrollable modal list
- buttonDropdowns: each button opens its own sub-dropdown modal
- YARD LN: single button opens -49 to 50 number picker
- Gain/Loss: single button opens -99 to 99 number input

## Row Management
- 200 rows pre-allocated
- Adds 50 more when running low
- ✕ ROW clears current row only
- ✕ ALL clears all rows with confirmation dialog
- PREV/NEXT navigate between rows
- NEW advances to next empty row

## Key Rules
- Never break existing data stored in IndexedDB
- All dropdown lists must be sorted alphabetically
- Changes to a template never affect games already created with it
- Each game stores its own independent column config copy
- LABEL_MAP: display "Incomp" but record value is "Incomplete"
- The app must work offline as a PWA
- Always maintain the dark charcoal theme — never use light backgrounds