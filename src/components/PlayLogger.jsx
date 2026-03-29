import { useState } from 'react';
import db from '../db';

// ─── Data ────────────────────────────────────────────────────────────────────

const PLAY_TYPES = [
  { value: 'run',     label: 'RUN' },
  { value: 'pass',    label: 'PASS' },
  { value: 'special', label: 'SPECIAL' },
];

const FORMATIONS = {
  run:     ['SHOTGUN', 'I-FORM', 'SINGLEBACK', 'PISTOL', 'WILDCAT', 'JUMBO'],
  pass:    ['SHOTGUN', 'EMPTY', 'SINGLEBACK', 'PISTOL', 'I-FORM', 'TRIPS'],
  special: ['PUNT', 'FG', 'KICKOFF', 'PAT'],
};

const DIRECTIONS = [
  { value: 'left',   label: 'LEFT' },
  { value: 'middle', label: 'MID' },
  { value: 'right',  label: 'RIGHT' },
];

const OUTCOMES = {
  run: [
    { value: 'td',         label: 'TD' },
    { value: 'first-down', label: '1ST DN' },
    { value: 'gain',       label: 'GAIN' },
    { value: 'no-gain',    label: 'NO GAIN' },
    { value: 'loss',       label: 'LOSS' },
    { value: 'fumble',     label: 'FUMBLE' },
    { value: 'penalty',    label: 'PENALTY' },
  ],
  pass: [
    { value: 'td',           label: 'TD' },
    { value: 'first-down',   label: '1ST DN' },
    { value: 'gain',         label: 'GAIN' },
    { value: 'incomplete',   label: 'INC' },
    { value: 'interception', label: 'INT' },
    { value: 'sack',         label: 'SACK' },
    { value: 'fumble',       label: 'FUMBLE' },
    { value: 'penalty',      label: 'PENALTY' },
  ],
  special: [
    { value: 'good',       label: 'GOOD' },
    { value: 'miss',       label: 'MISS' },
    { value: 'blocked',    label: 'BLOCKED' },
    { value: 'touchback',  label: 'TOUCHBACK' },
    { value: 'return-td',  label: 'RETURN TD' },
    { value: 'penalty',    label: 'PENALTY' },
  ],
};

const DOWN_LABELS = ['1ST', '2ND', '3RD', '4TH'];

const DEFAULT_FORM = {
  quarter:    1,
  down:       1,
  distance:   10,
  playType:   'run',
  formation:  'SHOTGUN',
  direction:  'middle',
  yardsGained: '',
  outcome:    'gain',
};

// ─── Auto-advance logic ───────────────────────────────────────────────────────

const RESET_OUTCOMES = new Set([
  'td', 'fumble', 'interception', 'first-down',
  'good', 'miss', 'blocked', 'touchback', 'return-td',
]);

function getNextState(form) {
  const yards  = parseInt(form.yardsGained) || 0;
  const { outcome, down, distance, quarter } = form;

  if (RESET_OUTCOMES.has(outcome)) {
    return { ...DEFAULT_FORM, quarter };
  }
  if (outcome === 'incomplete' || outcome === 'penalty') {
    return { ...form, yardsGained: '' };
  }
  if (outcome === 'sack') {
    const newDist = distance + Math.abs(yards);
    if (down >= 4) return { ...DEFAULT_FORM, quarter };
    return { ...form, down: down + 1, distance: newDist, yardsGained: '' };
  }

  const newDist = distance - yards;
  if (newDist <= 0) return { ...form, down: 1, distance: 10, yardsGained: '' };
  if (down >= 4)    return { ...DEFAULT_FORM, quarter };
  return { ...form, down: down + 1, distance: newDist, yardsGained: '' };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Btn({ selected, onClick, children, wide }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'px-3 py-2.5 border font-nunito font-black text-xs tracking-wide',
        'transition-colors select-none touch-manipulation active:scale-95',
        wide ? 'flex-1' : '',
        selected
          ? 'bg-white text-black border-white'
          : 'bg-surface text-white border-edge hover:border-white/40 hover:bg-white/5',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

function Section({ label, children }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="text-white/35 text-[10px] uppercase tracking-widest font-mono leading-none">
        {label}
      </div>
      {children}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PlayLogger({ gameId, playCount }) {
  const [form, setForm]   = useState(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [flash, setFlash]   = useState(false);

  function set(key, value) {
    setForm(prev => {
      const next = { ...prev, [key]: value };
      if (key === 'playType') {
        next.formation = FORMATIONS[value][0];
        next.outcome   = OUTCOMES[value][0].value;
      }
      return next;
    });
  }

  async function logPlay() {
    if (saving) return;
    setSaving(true);
    try {
      await db.plays.add({
        gameId,
        quarter:     form.quarter,
        down:        form.down,
        distance:    form.distance,
        playType:    form.playType,
        formation:   form.formation,
        direction:   form.playType === 'run' ? form.direction : null,
        yardsGained: form.playType !== 'special' ? (parseInt(form.yardsGained) || 0) : null,
        outcome:     form.outcome,
        createdAt:   Date.now(),
      });
      setFlash(true);
      setTimeout(() => setFlash(false), 250);
      setForm(getNextState(form));
    } finally {
      setSaving(false);
    }
  }

  const currentOutcomes  = OUTCOMES[form.playType];
  const currentFormations = FORMATIONS[form.playType];

  return (
    <div className="flex flex-col gap-5 p-4 h-full">
      {/* Play counter */}
      <div className="text-white/20 text-[10px] uppercase tracking-widest font-mono -mb-1">
        PLAY #{playCount + 1}
      </div>

      {/* Quarter */}
      <Section label="Quarter">
        <div className="flex gap-1">
          {[1, 2, 3, 4, 'OT'].map(q => (
            <Btn key={q} selected={form.quarter === q} onClick={() => set('quarter', q)} wide>
              {q === 'OT' ? 'OT' : `Q${q}`}
            </Btn>
          ))}
        </div>
      </Section>

      {/* Down */}
      <Section label="Down">
        <div className="flex gap-1">
          {[1, 2, 3, 4].map((d, i) => (
            <Btn key={d} selected={form.down === d} onClick={() => set('down', d)} wide>
              {DOWN_LABELS[i]}
            </Btn>
          ))}
        </div>
      </Section>

      {/* Distance */}
      <Section label="Yds to Go">
        <input
          type="number"
          inputMode="numeric"
          value={form.distance}
          onChange={e => set('distance', Math.max(1, parseInt(e.target.value) || 1))}
          className="bg-bg border border-edge text-white px-3 py-2.5 font-mono text-sm w-28 focus:outline-none focus:border-white/50 transition-colors"
          min={1}
          max={99}
        />
      </Section>

      {/* Play Type */}
      <Section label="Play Type">
        <div className="flex gap-1">
          {PLAY_TYPES.map(pt => (
            <Btn key={pt.value} selected={form.playType === pt.value} onClick={() => set('playType', pt.value)} wide>
              {pt.label}
            </Btn>
          ))}
        </div>
      </Section>

      {/* Formation / Special Type */}
      <Section label={form.playType === 'special' ? 'Type' : 'Formation'}>
        <div className="flex flex-wrap gap-1">
          {currentFormations.map(f => (
            <Btn key={f} selected={form.formation === f} onClick={() => set('formation', f)}>
              {f}
            </Btn>
          ))}
        </div>
      </Section>

      {/* Direction — run only */}
      {form.playType === 'run' && (
        <Section label="Direction">
          <div className="flex gap-1">
            {DIRECTIONS.map(d => (
              <Btn key={d.value} selected={form.direction === d.value} onClick={() => set('direction', d.value)} wide>
                {d.label}
              </Btn>
            ))}
          </div>
        </Section>
      )}

      {/* Yards Gained — not for special teams */}
      {form.playType !== 'special' && (
        <Section label="Yards Gained">
          <input
            type="number"
            inputMode="numeric"
            value={form.yardsGained}
            onChange={e => set('yardsGained', e.target.value)}
            placeholder="0"
            className="bg-bg border border-edge text-white px-3 py-2.5 font-mono text-sm w-28 focus:outline-none focus:border-white/50 transition-colors"
          />
        </Section>
      )}

      {/* Outcome */}
      <Section label="Result">
        <div className="flex flex-wrap gap-1">
          {currentOutcomes.map(o => (
            <Btn key={o.value} selected={form.outcome === o.value} onClick={() => set('outcome', o.value)}>
              {o.label}
            </Btn>
          ))}
        </div>
      </Section>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Log Play */}
      <button
        type="button"
        onClick={logPlay}
        disabled={saving}
        className={[
          'py-4 font-nunito font-black text-sm uppercase tracking-widest transition-all',
          'disabled:opacity-30 disabled:cursor-not-allowed',
          flash
            ? 'bg-white/70 text-black'
            : 'bg-white text-black hover:bg-white/90 active:scale-[0.98]',
        ].join(' ')}
      >
        {saving ? 'SAVING...' : 'LOG PLAY'}
      </button>
    </div>
  );
}
