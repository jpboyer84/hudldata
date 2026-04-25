// ════════════════════════════════════════════════════════════
// COMPLETE COLUMN LIBRARY — matches HTML assistant-coach.html exactly
// ════════════════════════════════════════════════════════════
//
// Types:
//   'buttons'   — grid of toggle buttons (btns array)
//   'btns_dd'   — buttons + a dropdown trigger button (btns + ddLbl + dd)
//   'btn_dds'   — each button opens its own sub-dropdown (btns with opts arrays)
//   'numpad'    — numeric input field
//   'calc'      — calculated field (not editable, derived from other columns)

// Helpers
const numList = (lo, hi) => Array.from({ length: hi - lo + 1 }, (_, i) => String(lo + i));
const yardLineList = () => [...numList(-49, -1), '50', ...numList(1, 49).reverse()];

// STK / special teams play types
const STK_OPTIONS = [
  '2 Pt.','2 Pt. Defend','Extra Pt.','Extra Pt. Block','Fake FG','Fake Punt',
  'FG','FG Block','KO','KO Rec','Onside Kick','Onside Kick Rec','Pass',
  'Punt','Punt Rec','Run'
];

// Full result dropdown
const RESULT_DD = [
  '1st DN','Batted Down','Block','Blocked Def TD','Complete','Complete Fumble',
  'Complete TD','COP','Def TD','Downed','Dropped','Fair Catch','Fumble',
  'Fumble Def TD','Good','Incomplete','Interception','Interception Def TD',
  'Interception Fumble','No Good','No Good Def TD','Offsetting Penalties',
  'Out of Bounds','Penalty','Penalty Safety','Recovered','Return','Rush',
  'Rush Safety','Rush TD','Sack','Sack Fumble','Sack Fumble Def TD',
  'Sack Safety','Safety','Scramble','Scramble TD','TD','Timeout','Tipped','Touchback'
];

// Backfield dropdown
const BACKFIELD_DD = [
  'Ace','Empty','Full House','Gun','Gun Left','Gun Right','Gun Strong','Gun Weak',
  'I-Form','I-Near','I-Strong','I-Weak','Pro','Pro Ace','Pro Strong','Pro Weak',
  'Pistol','Pistol Left','Pistol Right','Strong','Weak','Wing-T','Single Wing',
  'Flexbone','Split Back','Wildcat'
];

// Blitz dropdown
const BLITZ_DD = [
  'House','Boundary','Field','Free Safety','Strong Safety','Mike','Will','Sam',
  'ILBs','OLBs','Corner','Zone','Show Bail','No blitz'
];

// Coverage dropdown
const COVERAGE_DD = [
  '0','1','2','3','4','2 invert','4 Press','Man Free','Press Man','2 Man',
  'Quarters','Bingo','Box'
];

// ── ALL BUILT-IN COLUMNS ──
export function defaultColumns() {
  return [
    {
      id:'odk', name:'ODK', type:'buttons',
      btns:[{l:'O',v:'O'},{l:'D',v:'D'},{l:'K',v:'K'},{l:'S',v:'S'}]
    },
    {
      id:'qtr', name:'QTR', type:'buttons',
      btns:[{l:'1Q',v:'1'},{l:'2Q',v:'2'},{l:'3Q',v:'3'},{l:'4Q',v:'4'}]
    },
    {
      id:'dn', name:'DN', type:'buttons',
      btns:[{l:'0',v:'0'},{l:'1',v:'1'},{l:'2',v:'2'},{l:'3',v:'3'},{l:'4',v:'4'}]
    },
    {
      id:'hash', name:'HASH', type:'buttons',
      btns:[{l:'L',v:'L'},{l:'M',v:'M'},{l:'R',v:'R'}]
    },
    {
      id:'yardln', name:'YARD LN', type:'numpad'
    },
    {
      id:'dist', name:'DIST', type:'buttons', dataKey:'dist',
      btns:[{l:'1-3',v:'1-3'},{l:'4-6',v:'4-6'},{l:'7-9',v:'7-9'},{l:'10+',v:'10+'}]
    },
    {
      id:'dist2', name:'DIST', type:'numpad', dataKey:'dist2'
    },
    {
      id:'playtype', name:'PLAY TYPE', type:'btns_dd',
      btns:[{l:'RUN',v:'Run'},{l:'PASS',v:'Pass'}],
      ddLbl:'STK', dd: STK_OPTIONS
    },
    {
      id:'result', name:'RESULT', type:'btns_dd',
      btns:[{l:'RUSH',v:'Rush'},{l:'INCOMP',v:'Incomplete'},{l:'COMPLETE',v:'Complete'}],
      ddLbl:'▼', dd: RESULT_DD
    },
    {
      id:'gainloss', name:'GN/LS', type:'numpad'
    },
    {
      id:'series', name:'SERIES', type:'numpad'
    },
    {
      id:'offform', name:'OFF FORM', type:'btn_dds',
      btns:[
        {l:'Form 1', opts:['Variation 1','Variation 2','Variation 3','Variation 4','Variation 5','Variation 6']},
        {l:'Form 2', opts:['Variation 1','Variation 2','Variation 3','Variation 4']},
        {l:'Form 3', opts:['Variation 1','Variation 2','Variation 3','Variation 4','Variation 5','Variation 6']},
        {l:'Form 4', opts:['Variation 1','Variation 2','Variation 3','Variation 4']},
        {l:'Form 5', opts:['Variation 1','Variation 2']},
        {l:'Form 6', opts:['Variation 1','Variation 2','Variation 3','Variation 4','Variation 5','Variation 6','Variation 7','Variation 8','Variation 9','Variation 10','Variation 11','Variation 12','Variation 13','Variation 14']},
        {l:'Form 7', opts:['Variation 1','Variation 2','Variation 3','Variation 4','Variation 5','Variation 6','Variation 7','Variation 8']},
        {l:'Special', opts:['Variation 1','Variation 2','Variation 3','Variation 4']},
        {l:'Scout', opts:['Scout']},
      ]
    },
    {
      id:'backfield', name:'BACKFIELD', type:'btns_dd',
      btns:[{l:'GUN',v:'Gun'},{l:'I-FORM',v:'I-Form'},{l:'PRO',v:'Pro'},{l:'PISTOL',v:'Pistol'}],
      ddLbl:'MORE', dd: BACKFIELD_DD
    },
    {
      id:'blitz', name:'BLITZ', type:'btns_dd',
      btns:[{l:'ZONE',v:'Zone'},{l:'HOUSE',v:'House'},{l:'NONE',v:'No blitz'}],
      ddLbl:'MORE', dd: BLITZ_DD
    },
    {
      id:'coverage', name:'COVERAGE', type:'btns_dd',
      btns:[{l:'0',v:'0'},{l:'1',v:'1'},{l:'2',v:'2'},{l:'3',v:'3'},{l:'4',v:'4'}],
      ddLbl:'MORE', dd: COVERAGE_DD
    },
    {
      id:'deffront', name:'DEF FRONT', type:'buttons',
      btns:[{l:'OVER',v:'Over'},{l:'UNDER',v:'Under'},{l:'BEAR',v:'Bear'},{l:'3-4',v:'3-4'},{l:'4-3',v:'4-3'},{l:'3-3',v:'3-3 Stack'},{l:'4-2',v:'4-2'}]
    },
    {
      id:'eff', name:'EFF', type:'buttons',
      btns:[{l:'Y',v:'Y'},{l:'N',v:'N'}]
    },
    {
      id:'gap', name:'GAP', type:'buttons',
      btns:[{l:'A',v:'A'},{l:'B',v:'B'},{l:'C',v:'C'},{l:'D',v:'D'},{l:'E',v:'E-Alley'}]
    },
    {
      id:'ignore', name:'SKIP', type:'buttons',
      btns:[{l:'✕',v:'SKIP'}]
    },
    { id:'kickland', name:'KICK LAND', type:'numpad' },
    { id:'kickyds',  name:'KICK YDS',  type:'numpad' },
    { id:'retspot',  name:'RET SPOT',  type:'numpad' },
    { id:'retyds',   name:'RET YARDS', type:'numpad' },
    { id:'tackler1', name:'TACKLER 1', type:'numpad' },
    { id:'tackler2', name:'TACKLER 2', type:'numpad' },
    { id:'rusher',   name:'RUSHER',    type:'numpad' },
    {
      id:'slant', name:'SLANT', type:'buttons',
      btns:[{l:'L',v:'Left'},{l:'R',v:'Right'},{l:'TWIST',v:'Twist'}]
    },
    {
      id:'covshell', name:'COV SHELL', type:'buttons',
      btns:[{l:'0',v:'0'},{l:'1',v:'1'},{l:'2',v:'2'}]
    },
    {
      id:'covtype', name:'COV TYPE', type:'buttons',
      btns:[{l:'MAN',v:'Man'},{l:'ZONE',v:'Zone'},{l:'MIX',v:'Mix'}]
    },
    { id:'returner',    name:'RETURNER',     type:'numpad' },
    { id:'recoveredby', name:'RECOVERED BY', type:'numpad' },
    { id:'receiver',    name:'RECEIVER',     type:'numpad' },
    {
      id:'playdir', name:'PLAY DIR', type:'buttons',
      btns:[{l:'L',v:'L'},{l:'R',v:'R'}]
    },
    {
      id:'personnel', name:'PERSONNEL', type:'buttons',
      btns:[{l:'00',v:'00'},{l:'10',v:'10'},{l:'11',v:'11'},{l:'12',v:'12'},{l:'13',v:'13'},{l:'20',v:'20'},{l:'21',v:'21'},{l:'22',v:'22'},{l:'EMPTY',v:'EMPTY'},{l:'3 TE',v:'3 TE'}]
    },
    {
      id:'penalty', name:'PENALTY', type:'buttons',
      btns:[{l:'DEF',v:'Def'},{l:'OFF',v:'Off'},{l:'BOTH',v:'Both'}]
    },
    { id:'penyds',  name:'PEN YARDS', type:'numpad' },
    { id:'passer',  name:'PASSER',    type:'numpad' },
    {
      id:'passzone', name:'PASS ZONE', type:'buttons',
      btns:[{l:'1',v:'1'},{l:'2',v:'2'},{l:'3',v:'3'},{l:'4',v:'4'},{l:'5',v:'5'},{l:'6',v:'6'},{l:'7',v:'7'},{l:'8',v:'8'},{l:'9',v:'9'}]
    },
    {
      id:'offstr', name:'OFF STR', type:'buttons',
      btns:[{l:'L',v:'L'},{l:'BAL',v:'Bal'},{l:'R',v:'R'}]
    },
    {
      id:'offplay', name:'OFF PLAY', type:'btns_dd',
      btns:[], ddLbl:'SELECT', dd:[]
    },
    {
      id:'motiondir', name:'MOTION DIR', type:'buttons',
      btns:[{l:'L',v:'L'},{l:'R',v:'R'}]
    },
    {
      id:'motion', name:'MOTION', type:'btns_dd',
      btns:[], ddLbl:'SELECT', dd:[]
    },
    { id:'kicker',    name:'KICKER',     type:'numpad' },
    { id:'keyplayer', name:'KEY PLAYER', type:'numpad' },
    {
      id:'blocking', name:'BLOCKING', type:'btns_dd',
      btns:[], ddLbl:'SELECT', dd:[]
    }
  ];
}

// Default template — matches HTML defaultTemplate()
export function defaultTemplate() {
  return {
    id: 'odk-default',
    name: 'ODK',
    colIds: ['odk','qtr','dn','dist2','yardln','hash','playtype','result','gainloss','offform']
  };
}

// Get column by ID from the full library
export function getColumnById(id, allCols) {
  return (allCols || defaultColumns()).find(c => c.id === id);
}

// Resolve a template's colIds into actual column objects
export function resolveTemplateColumns(template, allCols) {
  const lib = allCols || defaultColumns();
  const colIds = template?.colIds || defaultTemplate().colIds;
  return colIds.map(id => lib.find(c => c.id === id)).filter(Boolean);
}

// Legacy compat: DEFAULT_COLUMNS for code that imports it
export const DEFAULT_COLUMNS = resolveTemplateColumns(defaultTemplate());
