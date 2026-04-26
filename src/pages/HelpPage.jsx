import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { HUDL_API } from '../lib/constants';

const FAQ_SECTIONS = [
  {
    title: 'Getting started',
    items: [
      { q: 'What is Assistant Coach?', a: 'Assistant Coach is a football coaching tool built for iPad and mobile. It lets you track plays live during games, pull film data from Hudl, analyze stats with AI, and share everything with your staff — all from one app.' },
      { q: 'What can I actually do with this app?', a: 'Track plays live with tap-to-tag buttons, load Hudl cutups and tag them, send tagged data back to Hudl, view stats breakdowns (run/pass splits, 3rd down rate, formation efficiency, red zone, by quarter), ask the AI questions about your play data, export to Excel, and share with your coaching staff via invite codes.' },
      { q: 'Is this for game days or film study?', a: 'Both. On game day, use "Tag a game" to track plays live from the press box or sideline. During the week, load a Hudl cutup to tag film, then use Stats and Ask AI to break down tendencies and prepare your game plan.' },
      { q: 'How can this help my coaching staff?', a: 'Every coach on your staff can join your team with a 6-character invite code. They all share the same games, templates, and columns. The head coach sets up the system, assistants use it to track their position groups, and everyone benefits from the shared data and AI analysis.' },
    ],
  },
  {
    title: '🏈 TRACKING PLAYS',
    isSection: true,
    items: [
      { q: 'How do I start tracking a game?', a: 'Tap "Tag a game" from the home screen → "+ New" to start a blank game, or "Load from Hudl" to pull in an existing cutup. Pick your template (which columns to show), fill in the game info, and hit START GAME.' },
      { q: 'How do I record a play?', a: 'Tap the buttons on each column card to tag the current play. For example: tap "O" for offense, "1Q" for first quarter, "2" for second down, then "Run" for play type. When you\'re done, tap "Next play →" to advance to the next row.' },
      { q: 'I made a mistake — how do I fix it?', a: 'Just tap a different button on the same column to change the value — the old one deselects automatically. To go back to a previous play, tap "← Prev" or tap the play number in the sheet bar to jump to any play. To clear an entire row, use ⋯ → Clear row.' },
      { q: 'How do I jump to a specific play?', a: 'Tap the play number (the orange cell) in the sheet bar at the top. A grid pops up showing all plays — filled ones are white, empty ones are gray. Tap any number to jump there instantly.' },
      { q: 'Do I need to save my game?', a: 'No — your data auto-saves to the cloud as you go. Every tap is saved within about a second. You can close the app, switch tabs, even lose your connection temporarily — when you come back, your data is there.' },
      { q: 'How do I export a game to Excel?', a: 'From the tracker, tap ⋯ → Export XLSX. The file downloads immediately with all your play data. You can also export multiple games at once from the Archive — tap Select, check the games you want, then tap EXPORT.' },
    ],
  },
  {
    title: 'Templates & COLUMNS',
    isSection: true,
    items: [
      { q: 'What are columns and templates?', a: 'Columns are the individual data fields you track (ODK, QTR, DN, DIST, etc.). Templates are saved groups of columns — like a preset. The "ODK" template includes all the standard columns. You can create custom templates with just the columns you need for different situations (scout games, JV, special teams).' },
      { q: 'How do I create a new template?', a: 'Settings & Help → Templates → + New. Name your template, then check the columns you want included. Drag to reorder them. Hit Save. When you start a new game, you\'ll pick this template.' },
      { q: 'How do I create a custom column?', a: 'Settings & Help → Columns → + New. Name your column (e.g. "COVERAGE" or "MOTION"), then add buttons for the values you want to track. Hit Save. The column will appear in the "Available Columns" list when building templates.' },
      { q: 'How do I reorder columns or switch templates during a game?', a: 'Use the ⋯ menu in the tracker → "Switch template" to change your column layout mid-game. Your play data is preserved — only the visible columns change.' },
    ],
  },
  {
    title: 'Stats & analysis',
    isSection: true,
    items: [
      { q: 'How do I see stats for my games?', a: 'Tap "Stats & analysis" from the home screen. Pick a game from the dropdown. You\'ll see breakdowns across five tabs: Overview, Offense, Defense, Field, and By Quarter.' },
      { q: 'What is the Spotlight tab?', a: 'Spotlight auto-generates AI insight cards when you load data — things like "You run 72% of the time on 1st down" or "3rd down conversion rate drops to 18% in Q4". It\'s designed to surface tendencies you might not notice in the raw numbers.' },
      { q: 'How do I ask the AI a question about my plays?', a: 'Go to Stats → ASK AI tab. Type your question the same way you\'d ask an assistant coach — "What\'s our 3rd down conversion rate?", "Which formation gains the most yards?", or "How did we do in the red zone?". The AI sees all your play data and gives you a direct answer.' },
      { q: 'What are the different Stats sub-tabs?', a: 'OVERVIEW — total plays, yards per play, run vs pass split.\nOFFENSE — down & distance breakdowns, formation efficiency, 3rd down conversions, play type tendencies.\nDEFENSE — yards allowed, opponent run/pass tendencies, sacks, INTs, stop rate.\nFIELD — hash mark tendencies, red zone efficiency, field position data.\nBY QTR — quarter-by-quarter performance for both offense and defense.' },
      { q: 'Can I save an AI response for later?', a: 'Yes — tap the 📌 button underneath any AI answer. It gets stored in the SAVED tab so you can reference it later — during halftime adjustments, post-game meetings, or weekly prep.' },
    ],
  },
  {
    title: '⚙️ SETUP & SETTINGS',
    isSection: true,
    items: [
      { q: 'How do I teach the AI my play names?', a: 'Go to Playbook from the home screen. Tap any section — Run Plays, Pass Plays, Formations, Tags & Motion, Defensive Terms, or Stat Rules — and type your terminology. For example, under Run Plays: "Bolt = Counter Left". Now when you ask the AI about "Bolt," it knows exactly what play you\'re talking about. Everything you enter is shared with your staff and injected into every AI prompt.' },
      { q: 'How do I set up my team info?', a: 'When you first sign up, you\'ll be taken to the team setup screen. Connect with Hudl to auto-create your team, or set it up manually with your team name, school, city, and state.' },
      { q: 'How do I back up my data?', a: 'Settings & Help → Save Full Backup → SAVE TO DEVICE. This downloads a JSON file with all your games, templates, and columns. Keep it somewhere safe.' },
      { q: 'How do I move data to a new phone or tablet?', a: 'Export a backup from your old device (Settings → Save Full Backup). On your new device, sign in with the same account — your data is already in the cloud. If you need to restore from a backup, use Settings → Restore Full Backup.' },
      { q: 'My cutup list seems outdated — what do I do?', a: 'Hudl cutup lists are cached. Go to Settings & Help → Clear cache to force a fresh pull from Hudl next time you open the library.' },
    ],
  },
];

function FAQItem({ q, a, isOpen, onToggle }) {
  return (
    <div style={{ borderBottom: '1px solid var(--color-border)' }}>
      <div
        onClick={onToggle}
        style={{
          padding: '16px 0', cursor: 'pointer', display: 'flex',
          justifyContent: 'space-between', alignItems: 'center',
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text)', paddingRight: 12 }}>{q}</div>
        <div style={{ fontSize: 14, color: 'var(--color-muted)', flexShrink: 0, transform: isOpen ? 'rotate(180deg)' : 'none', transition: '0.2s' }}>▾</div>
      </div>
      {isOpen && (
        <div style={{
          paddingBottom: 16, fontSize: 13, color: 'var(--color-muted2)',
          lineHeight: 1.7, whiteSpace: 'pre-line',
        }}>
          {a}
        </div>
      )}
    </div>
  );
}

function AskTab() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'Hi Coach! I know everything about how Assistant Coach works. Ask me anything —\n"How do I export to Excel?", "What does the Spotlight tab do?", or "How do I create a custom column?"',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages]);

  async function handleSend() {
    if (!input.trim() || loading) return;
    const q = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: q }]);
    setLoading(true);

    try {
      const resp = await fetch(`${HUDL_API}/api/claude`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 800,
          system: `You are a friendly help assistant for Assistant Coach — a football play-tracking and analytics app built for coaching staffs, designed for phones and tablets. Your job is to answer questions about how to USE the app. Be concise, direct, and practical. Use bold for button names and screen names.

## APP OVERVIEW
Assistant Coach has four main sections accessible from the home screen:
- **Game Trackers** — create, track, and archive games play-by-play
- **Stats & Analysis** — AI-powered analysis of play data with charts and chat
- **Settings** — AI context editors, backup/restore, Hudl cache
- **Help** — this FAQ and AI assistant

## GAME TRACKERS
- **New Game Tracker** — choose a template, enter team names (optional), tap START GAME
- **Tracker screen** — each row = one play; tap buttons to record values; use + Rows / ← Prev to move between plays
- **Next play** — auto-fills next play's DN and DIST based on current gain/loss, then advances
- **▤ 1COL / 2COL** button — toggles single or two-column layout
- **Play navigator** — tap the play number chip in the sheet bar to jump to any play number
- **⋯ menu** — Stats, Add/remove columns, Save as template, Switch template, Export XLSX, Clear row, Clear all
- **⚙ gear icon** on column cards — edit buttons for that column on the fly
- **Tap game title** in header — opens Edit Game Info modal (teams, week, date)
- Auto-advance: when all columns are filled, auto-advances to next play after 400ms

## ARCHIVE
- Lists all saved games; tap any game to open it
- **Select** button — enables multi-select; then **EXPORT** to export multiple games to one spreadsheet
- Delete games with confirmation

## TEMPLATES & COLUMNS
- **+ New** — opens template builder; give a name, pick columns, drag to reorder, save
- **Columns** button — manage all available columns (40+ built-in)
- **+ New column** — column builder; name it, add buttons (each button = one value coaches can tap)

## IMPORT GAME DATA
- **From Device** — select a .xlsx file; columns auto-map by name; mapping dialog for unrecognized columns
- Imports as a new game in the tracker

## STATS & ANALYSIS
- Opens with **SELECT DATA** filter — search, type filters (All/Game/Scout/JV/Other), year filters, HOME/AWAY
- Multi-select cutups with checkboxes; tap **LOAD →** to analyze
- **Filter** button in header — re-opens the filter to change selection

### Tabs:
- **SPOTLIGHT** — auto-fires AI on load; shows 4–10 insight cards (2–5 offense, 2–5 defense)
  - Each card: tag, stat, bold headline (priority-colored), why line
  - **❓** button — AI explains how the stat was calculated (Methodology)
  - 👍 / 👎 — rate insight usefulness; AI learns from feedback
  - **GENERATE MORE** — finds additional insights beyond what's already shown
- **STATS** — 5 sub-tabs: OVERVIEW, OFFENSE, DEFENSE, FIELD, BY QTR; each has bar charts and stat cards
- **ASK AI** — conversational chat; 📌 pin saves answers to SAVED tab
- **SAVED** — library of saved AI responses

## PLAYBOOK
- 8 editable sections that teach the AI your program's terminology:
  - Team Info, Run Plays & Pass Pro, Pass Plays, Formations, Tags & Motion, Defensive Terms, Stat Rules, General Notes
- Each section has a text editor with Reset to Default
- Format: Name = Description, one per line
- Everything here is injected into every AI prompt (Spotlight, Ask AI, Methodology)

## SETTINGS
- **Help & FAQ** — this help page
- **Your Team** — team name, school, invite code for staff
- **Backup** — save all data as JSON to device; restore from device
- **Templates & Columns** — manage tracker layouts
- **Hudl connection** — connect/disconnect your Hudl account
- **Hudl cache** — shows cached cutup count; **Clear cache** if new Hudl cutups aren't appearing
- **Sign out** — with confirmation

## RESPONSE RULES
- Answer questions about the app only
- Be concise — 1–3 sentences for simple questions, short bullets for multi-step tasks
- Bold all button names, screen names, and navigation paths
- If the answer involves a sequence of taps, use a numbered list
- Never make up features that don't exist — if unsure, say so`,
          messages: [
            ...messages.filter(m => m.role !== 'assistant' || messages.indexOf(m) > 0).map(m => ({
              role: m.role, content: m.text,
            })),
            { role: 'user', content: q },
          ],
        }),
      });

      const data = await resp.json();
      const answer = data.content?.map(c => c.text || '').join('\n') || 'Sorry, I couldn\'t get a response. Try again.';
      setMessages(prev => [...prev, { role: 'assistant', text: answer }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Connection error — check your internet and try again.' }]);
    }
    setLoading(false);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', WebkitOverflowScrolling: 'touch' }}>
        {messages.map((m, i) => (
          <div key={i} style={{
            marginBottom: 12, padding: '12px 16px', borderRadius: 14, maxWidth: '88%',
            ...(m.role === 'user'
              ? { background: 'var(--color-accent)', color: '#fff', marginLeft: 'auto' }
              : { background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }),
            fontSize: 14, lineHeight: 1.65, whiteSpace: 'pre-wrap',
          }}>
            {m.text}
          </div>
        ))}
        {loading && (
          <div style={{ padding: '10px 14px', color: 'var(--color-muted)', fontSize: 13 }}>Thinking…</div>
        )}
      </div>
      <div style={{
        padding: '10px 14px 16px', borderTop: '1px solid var(--color-border)',
        display: 'flex', gap: 8, flexShrink: 0,
      }}>
        <input
          className="fi"
          placeholder="Ask about the app…"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          style={{ flex: 1, fontSize: 14, padding: '11px 14px' }}
        />
        <button
          className="btn btn-primary"
          onClick={handleSend}
          disabled={loading || !input.trim()}
          style={{ padding: '10px 18px', fontSize: 14, flexShrink: 0 }}
        >
          Ask →
        </button>
      </div>
    </div>
  );
}

export default function HelpPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('faq');
  const [openItem, setOpenItem] = useState(null);
  const [openSections, setOpenSections] = useState(() => FAQ_SECTIONS.map((_, i) => i)); // all open by default

  function toggleSection(idx) {
    setOpenSections(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]);
  }

  return (
    <div className="view">
      <div className="hdr">
        <button className="hdr-btn" onClick={() => navigate('/settings')}>← Back</button>
        <div className="hdr-title">Help</div>
        <div style={{ width: 60 }} />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', flexShrink: 0 }}>
        {[
          { id: 'faq', label: 'FAQ' },
          { id: 'ask', label: 'Ask a question' },
        ].map(t => (
          <div
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: 1, textAlign: 'center', padding: '12px 0', fontSize: 14, fontWeight: 600,
              cursor: 'pointer',
              color: tab === t.id ? 'var(--color-accent)' : 'var(--color-muted)',
              borderBottom: tab === t.id ? '2px solid var(--color-accent)' : '2px solid transparent',
            }}
          >
            {t.label}
          </div>
        ))}
      </div>

      {/* Content */}
      {tab === 'faq' ? (
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 18px', WebkitOverflowScrolling: 'touch' }}>
          {FAQ_SECTIONS.map((section, si) => (
            <div key={si}>
              <div
                onClick={() => toggleSection(si)}
                style={{
                  padding: '18px 0 6px', fontSize: 14, fontWeight: 600,
                  color: 'var(--color-text)',
                  letterSpacing: section.isSection ? '0.02em' : 0,
                  cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}
              >
                <span>{section.title}</span>
                <span style={{ fontSize: 14, color: 'var(--color-muted)', transform: openSections.includes(si) ? 'rotate(180deg)' : 'none', transition: '0.2s' }}>▾</span>
              </div>
              {openSections.includes(si) && section.items.map((item, ii) => {
                const key = `${si}-${ii}`;
                return (
                  <FAQItem
                    key={key}
                    q={item.q}
                    a={item.a}
                    isOpen={openItem === key}
                    onToggle={() => setOpenItem(openItem === key ? null : key)}
                  />
                );
              })}
            </div>
          ))}
          <div style={{ height: 40 }} />
        </div>
      ) : (
        <AskTab />
      )}
    </div>
  );
}

