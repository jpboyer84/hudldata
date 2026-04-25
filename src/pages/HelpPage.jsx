import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const FAQ = [
  {
    q: 'How do I track a game?',
    a: 'Tap "Tag a game" from the home screen, then tap "+ New" to start a fresh game or "Load from Hudl" to pull in an existing cutup. Use the column buttons to tag each play, then tap "Next play →" to advance.',
  },
  {
    q: 'How do I load data from Hudl?',
    a: 'First connect to Hudl in Settings. Then tap "Tag a game" → "Load from Hudl". Browse your cutups, tap one to load it. All play data from Hudl maps to your columns automatically.',
  },
  {
    q: 'How do I send data back to Hudl?',
    a: 'When viewing a game that was loaded from Hudl, tap the green "▲ Send" button in the header or find "Send to Hudl" in the ⋯ menu. This writes your tagged data back to the Hudl cutup.',
  },
  {
    q: 'How do I use the AI assistant?',
    a: 'Go to Stats → ASK AI tab. Make sure you have a game selected with play data. Type your question the way you\'d ask an assistant coach — "What\'s our 3rd down conversion rate?", "Which formation gains the most yards?", or "How did we do in the red zone?"',
  },
  {
    q: 'What do the stats tabs show?',
    a: 'OVERVIEW — total plays, yards per play, run vs pass split.\n\nOFFENSE — down & distance breakdowns, formation efficiency, 3rd down conversions.\n\nDEFENSE — yards allowed, opponent tendencies, sacks, INTs, stop rate.\n\nFIELD — hash mark tendencies, red zone efficiency.\n\nBY QTR — quarter-by-quarter performance.',
  },
  {
    q: 'How do I export my data?',
    a: 'From the tracker, tap ⋯ → Export XLSX. From the Archive, use Select mode to pick multiple games and export them all at once. You can also do a full JSON backup from Settings.',
  },
  {
    q: 'How do I invite other coaches?',
    a: 'Go to Settings → Your Team section. Share the 6-character invite code with your staff. They sign up, choose "Join a team", and enter the code.',
  },
  {
    q: 'How do templates work?',
    a: 'Templates define which columns appear in the tracker. Go to Settings → Templates to create or edit them. When starting a new game, pick your template. The default "ODK" template includes all standard columns.',
  },
];

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      background: 'var(--color-surface)', border: '1px solid var(--color-border)',
      borderRadius: 12, marginBottom: 8, overflow: 'hidden',
    }}>
      <div
        onClick={() => setOpen(!open)}
        style={{
          padding: '14px 16px', cursor: 'pointer', display: 'flex',
          justifyContent: 'space-between', alignItems: 'center',
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 600 }}>{q}</div>
        <div style={{ fontSize: 14, color: 'var(--color-muted)', transform: open ? 'rotate(180deg)' : 'none', transition: '0.2s' }}>▾</div>
      </div>
      {open && (
        <div style={{
          padding: '0 16px 14px', fontSize: 13, color: 'var(--color-muted2)',
          lineHeight: 1.7, whiteSpace: 'pre-line',
        }}>
          {a}
        </div>
      )}
    </div>
  );
}

export default function HelpPage() {
  const navigate = useNavigate();
  return (
    <div className="view">
      <div className="hdr">
        <button className="hdr-btn" onClick={() => navigate('/')}>← Back</button>
        <div className="hdr-title">Help</div>
        <div style={{ width: 60 }} />
      </div>
      <div className="abody">
        <div className="sec-label">Frequently Asked Questions</div>
        {FAQ.map((f, i) => <FAQItem key={i} q={f.q} a={f.a} />)}
        <div style={{
          textAlign: 'center', padding: '20px', fontSize: 11, color: 'var(--color-muted)',
          lineHeight: 1.8,
        }}>
          Built for coaches, by a coach.<br />
          Questions? Reach out anytime.
        </div>
      </div>
    </div>
  );
}
