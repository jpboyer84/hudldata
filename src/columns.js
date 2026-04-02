// Default "ODK" tracker column configuration.
// - id:   IndexedDB field name (never changes, even if user renames the column)
// - name: display label (editable in Edit Mode)
// - type: 'buttons' | 'modal-number' | 'modal-list'
// - options (for 'buttons'): array of { label, value?, action?, ...actionProps }
//   - no action  → direct value button (toggles on/off)
//   - action:'modal-number'     → opens NumberModal; min/max required
//   - action:'modal-dropdown'   → opens DropdownModal; dropdownOptions required
//   - action:'modal-suboptions' → opens DropdownModal with subOptions; subOptions required
// - type 'modal-number': entire card is one button that opens the number modal
// - type 'modal-list':   entire card is one button that opens a DropdownModal list; listOptions required

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
      { label: 'DN1', value: 'DN1' },
      { label: 'DN2', value: 'DN2' },
      { label: 'DN3', value: 'DN3' },
      { label: 'DN4', value: 'DN4' },
    ],
  },
  {
    id: 'dist',
    name: 'Dist',
    type: 'buttons',
    options: [
      { label: '1-3',  value: '1-3' },
      { label: '4-6',  value: '4-6' },
      { label: '7-9',  value: '7-9' },
      { label: '10+',  value: '10+' },
      {
        label: '+',
        action: 'modal-dropdown',
        dropdownOptions: Array.from({ length: 25 }, (_, i) => String(i + 1)),
      },
    ],
  },
  {
    id: 'yardLn',
    name: 'YARD LN',
    type: 'modal-list',
    listOptions: YARD_LINE_OPTIONS,
  },
  {
    id: 'hash',
    name: 'Hash',
    type: 'buttons',
    options: [
      { label: 'L', value: 'L' },
      { label: 'M', value: 'M' },
      { label: 'R', value: 'R' },
    ],
  },
  {
    id: 'playType',
    name: 'Play Type',
    type: 'buttons',
    options: [
      { label: 'Run',  value: 'Run' },
      { label: 'Pass', value: 'Pass' },
      {
        label: 'STK',
        action: 'modal-dropdown',
        dropdownOptions: STK_OPTIONS,
      },
    ],
  },
  {
    id: 'result',
    name: 'Result',
    type: 'buttons',
    options: [
      { label: 'Rush',     value: 'Rush' },
      { label: 'Incomp',   value: 'Incomplete' }, // LABEL_MAP: displays "Incomp", stores "Incomplete"
      { label: 'Complete', value: 'Complete' },
      {
        label: '▼',
        action: 'modal-dropdown',
        dropdownOptions: RESULT_DROPDOWN,
      },
    ],
  },
  {
    id: 'gainLoss',
    name: 'Gain/Loss',
    type: 'modal-list',
    listOptions: Array.from({ length: 199 }, (_, i) => String(i - 99)),
  },
  {
    id: 'offForm',
    name: 'Off Form',
    type: 'buttons',
    options: [
      {
        label: 'Red/Blue',
        action: 'modal-suboptions',
        subOptions: ['Blue', 'Blue Far', 'Blue Near', 'Red', 'Red Far', 'Red Near'],
      },
      {
        label: 'Trio/Leo',
        action: 'modal-suboptions',
        subOptions: ['Leo', 'Leo Squeeze', 'Trio', 'Trio Squeeze'],
      },
      {
        label: 'Deuce/Dbl',
        action: 'modal-suboptions',
        subOptions: ['Deuce', 'Deuce Squeeze', 'Deuce Stack', 'Double', 'Double Squeeze', 'Double Stack'],
      },
      {
        label: 'Ora/Yel',
        action: 'modal-suboptions',
        subOptions: ['Orange', 'Orange Stack', 'Yellow', 'Yellow Stack'],
      },
      {
        label: 'Grn/Gld',
        action: 'modal-suboptions',
        subOptions: ['Gold', 'Green'],
      },
      {
        label: 'Brwn/Blck',
        action: 'modal-suboptions',
        subOptions: [
          'Black', 'Black Far', 'Black Far Left', 'Black Far Right',
          'Black Near', 'Black Near Left', 'Black Near Right',
          'Brown', 'Brown Far', 'Brown Far Left', 'Brown Far Right',
          'Brown Near', 'Brown Near Left', 'Brown Near Right',
        ],
      },
      {
        label: 'Other',
        action: 'modal-suboptions',
        subOptions: [
          'Bunch', 'Empty', 'Empty Wing', 'Full', 'Full Wing',
          'Hogs Left', 'Hogs Right', 'Krakken Left', 'Krakken Right',
          'Lunch', 'Queen Left', 'Queen Right',
        ],
      },
      {
        label: 'Special',
        action: 'modal-suboptions',
        subOptions: ['FG', 'Kneel', 'Punt', 'Victory'],
      },
      {
        label: 'Scout',
        value: 'Scout', // direct — no modal
      },
    ],
  },
];
