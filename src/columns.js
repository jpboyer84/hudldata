// Default "ODK" tracker column configuration.
// - id:   IndexedDB field name (never changes, even if user renames the column)
// - name: display label (editable in Edit Mode)
// - type: 'buttons' | 'modal-list'
// - options (for 'buttons'): array of { label, value?, action?, ...actionProps }
//   - no action  → direct value button (toggles on/off)
//   - action:'modal-dropdown'   → opens DropdownModal; dropdownOptions required
//   - action:'modal-suboptions' → opens DropdownModal with subOptions; subOptions required
// - type 'modal-list': entire card is one button that opens a DropdownModal list; listOptions required
//   - centerOn: optional string value to center the list on when no selection exists

// Gain/Loss and custom distance: -99 to 99
export const GAIN_LOSS_OPTIONS = Array.from({ length: 199 }, (_, i) => String(i - 99));

// Yard line: -1 … -49 (own side), 50 (midfield), 49 … 1 (opponent side)
export const YARD_LINE_OPTIONS = [
  ...Array.from({ length: 49 }, (_, i) => `-${i + 1}`),
  '50',
  ...Array.from({ length: 49 }, (_, i) => `${49 - i}`),
];

const STK_OPTIONS = [
  '2 Pt.', '2 Pt. Defend', 'Extra Pt.', 'Extra Pt. Block',
  'Fake FG', 'Fake Punt', 'FG', 'FG Block',
  'KO', 'KO Rec', 'Onside Kick', 'Onside Kick Rec',
  'Pass', 'Punt', 'Punt Rec', 'Run',
].sort((a, b) => a.localeCompare(b));

const RESULT_DROPDOWN = [
  '1st DN', 'Batted Down', 'Block', 'Blocked Def TD', 'Complete',
  'Complete Fumble', 'Complete TD', 'COP', 'Def TD', 'Downed',
  'Dropped', 'Fair Catch', 'Fumble', 'Fumble Def TD', 'Good',
  'Incomplete', 'Interception', 'Interception Def TD', 'Interception Fumble',
  'No Good', 'No Good Def TD', 'Offsetting Penalties', 'Out of Bounds',
  'Penalty', 'Penalty Safety', 'Recovered', 'Return', 'Rush',
  'Rush Safety', 'Rush TD', 'Sack', 'Sack Fumble', 'Sack Fumble Def TD',
  'Sack Safety', 'Safety', 'Scramble', 'Scramble TD', 'TD',
  'Timeout', 'Tipped', 'Touchback',
].sort((a, b) => a.localeCompare(b));

// Exposed so TrackerPage can check membership without importing STK_OPTIONS
export const STK_SET = new Set(STK_OPTIONS);

// Direct quick-button values for Result (used by isOptionActive logic)
export const RESULT_DIRECT = ['Rush', 'Incomplete', 'Complete'];

// OFF FORM generic button definitions
const OFF_FORM_BUTTONS = [
  { label: 'Form 1', subs: Array.from({ length: 6  }, (_, i) => `Variation ${i + 1}`).sort() },
  { label: 'Form 2', subs: Array.from({ length: 4  }, (_, i) => `Variation ${i + 1}`).sort() },
  { label: 'Form 3', subs: Array.from({ length: 6  }, (_, i) => `Variation ${i + 1}`).sort() },
  { label: 'Form 4', subs: Array.from({ length: 4  }, (_, i) => `Variation ${i + 1}`).sort() },
  { label: 'Form 5', subs: Array.from({ length: 2  }, (_, i) => `Variation ${i + 1}`).sort() },
  { label: 'Form 6', subs: Array.from({ length: 14 }, (_, i) => `Variation ${i + 1}`).sort() },
  { label: 'Form 7', subs: Array.from({ length: 8  }, (_, i) => `Variation ${i + 1}`).sort() },
  { label: 'Special', subs: Array.from({ length: 4 }, (_, i) => `Variation ${i + 1}`).sort() },
  { label: 'Scout',  subs: ['Scout'] },
];

export const DEFAULT_COLUMNS = [
  {
    id: 'odk',
    name: 'ODK',
    type: 'buttons',
    options: [
      { label: 'O', value: 'O' },
      { label: 'D', value: 'D' },
      { label: 'K', value: 'K' },
      { label: 'S', value: 'S' },
    ],
  },
  {
    id: 'qtr',
    name: 'QTR',
    type: 'buttons',
    options: [
      { label: '1Q', value: '1Q' },
      { label: '2Q', value: '2Q' },
      { label: '3Q', value: '3Q' },
      { label: '4Q', value: '4Q' },
    ],
  },
  {
    id: 'dn',
    name: 'DN',
    type: 'buttons',
    options: [
      { label: '1', value: '1' },
      { label: '2', value: '2' },
      { label: '3', value: '3' },
      { label: '4', value: '4' },
    ],
  },
  {
    id: 'dist',
    name: 'DIST',
    type: 'buttons',
    options: [
      { label: '1-3', value: '1-3' },
      { label: '4-6', value: '4-6' },
      { label: '7-9', value: '7-9' },
      { label: '10+', value: '10+' },
      {
        label: '+',
        action: 'modal-dropdown',
        dropdownOptions: GAIN_LOSS_OPTIONS,
        centerOn: '0',
      },
    ],
  },
  {
    id: 'yardLn',
    name: 'YARD LN',
    type: 'numpad',
  },
  {
    id: 'hash',
    name: 'HASH',
    type: 'buttons',
    options: [
      { label: 'L', value: 'L' },
      { label: 'M', value: 'M' },
      { label: 'R', value: 'R' },
    ],
  },
  {
    id: 'playType',
    name: 'PLAY TYPE',
    type: 'buttons',
    options: [
      { label: 'RUN',  value: 'Run' },
      { label: 'PASS', value: 'Pass' },
      {
        label: 'STK',
        action: 'modal-dropdown',
        dropdownOptions: STK_OPTIONS,
      },
    ],
  },
  {
    id: 'result',
    name: 'RESULT',
    type: 'buttons',
    options: [
      { label: 'RUSH',     value: 'Rush' },
      { label: 'INCOMP',   value: 'Incomplete' }, // LABEL_MAP: displays "INCOMP", stores "Incomplete"
      { label: 'COMPLETE', value: 'Complete' },
      {
        label: '▼',
        action: 'modal-dropdown',
        dropdownOptions: RESULT_DROPDOWN,
      },
    ],
  },
  {
    id: 'gainLoss',
    name: 'GN/LS',
    type: 'numpad',
  },
  {
    id: 'offForm',
    name: 'OFF FORM',
    type: 'buttons',
    options: OFF_FORM_BUTTONS.map(({ label, subs }) => ({
      label,
      action: 'modal-suboptions',
      subOptions: subs,
    })),
  },
];
