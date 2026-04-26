import { supabase } from './supabase';

// ════════════════════════════════════════
// PLAYBOOK DEFAULTS — exact match to HTML
// ════════════════════════════════════════

export const PLAYBOOK_DEFAULTS = {
  team_info: `Team Name = Your School Name (Abbreviation)
School = Full School Name, City, State
Rivals = Opponent 1, Opponent 2, Opponent 3
3 Best Opponents (Big 3) = Opponent 1, Opponent 2, Opponent 3
Conference Opponents = Opponent 1, Opponent 2, Opponent 3`,

  run_plays: `Play Name = Concept (e.g. Power Right)
Play Name = Concept (e.g. Counter Left)
Play Name = Concept (e.g. Inside Zone Right)`,

  pass_plays: `Play Name = Concept (e.g. Four Verticals)
Play Name = Concept (e.g. Shallow Cross)`,

  formations: `Formation Name = Personnel grouping (e.g. 11 personnel — 1 RB, 1 TE, 3 WR)
Formation Name = Personnel grouping`,

  tags: `Tag Name = What it does (e.g. extra blocker added)
Motion Name = How the player moves pre-snap`,

  defense: `Front Name = Description (e.g. Under = Weak 3-tech, Strong 5-tech)
Coverage Name = Description (e.g. Cover 3 = 3 deep, 4 under)
Blitz Name = Description (e.g. Fire Zone = 5-man pressure with 3 dropping)`,

  stat_rules: `First Down = gainLoss >= dist, OR result contains "TD", OR result is "1st DN"
3rd/4th Down Conversion = same logic as First Down
Yards Per Carry = sum gainLoss for Run plays / run count
Yards Per Pass Attempt = includes incomplete passes at 0 yards
Completion Rate = result contains "Complete" / total pass attempts
Red Zone = yardLine >= 1 AND yardLine <= 20 (opponent's 20-yard line to goal line)
Score Zone = yardLine >= 1 AND yardLine <= 10
Goal Line = yardLine >= 1 AND yardLine <= 5
Sack Rate = result contains "Sack" / total pass attempts
Explosive Run = gainLoss >= 10 on a Run play
Explosive Pass = gainLoss >= 15 on a Pass play
Negative Play = gainLoss < 0`,

  general: '',
};

// Section metadata
export const PB_SECTIONS = {
  team_info:   { title: '🏫 TEAM INFO',         emoji: '🏫', hint: 'Key = Value format, one per line. Tells the AI who you are, your rivalries, and conference opponents.',  heading: 'TEAM INFO' },
  run_plays:   { title: '🏃 RUN PLAYS & PASS PRO', emoji: '🏃', hint: 'Play Name = Concept, one per line. Include run plays and pass protection schemes.',          heading: 'RUN PLAYS & PASS PROTECTION' },
  pass_plays:  { title: '🎯 PASS PLAYS',         emoji: '🎯', hint: 'Play Name = Concept, one per line. Add your pass play names and route concepts.',                heading: 'PASS PLAY NAMES' },
  formations:  { title: '🗂 FORMATIONS',          emoji: '🗂', hint: 'Formation Name = Personnel / description, one per line.',                                         heading: 'FORMATIONS & PERSONNEL' },
  tags:        { title: '🏷 TAGS & MOTION',       emoji: '🏷', hint: 'Tag = What it means, one per line. These are modifiers added to play names.',                     heading: 'PLAY TAGS & MOTION' },
  defense:     { title: '🛡 DEFENSIVE TERMS',     emoji: '🛡', hint: 'Term = Meaning, one per line. Fronts, coverages, blitz packages.',                                heading: 'DEFENSIVE TERMINOLOGY' },
  stat_rules:  { title: '📐 STAT RULES',          emoji: '📐', hint: 'Stat Name = How it\'s calculated, one per line.',                                                 heading: 'STAT CALCULATION RULES' },
  general:     { title: '📝 GENERAL NOTES',        emoji: '📝', hint: 'Free-form notes for the AI. Anything you want it to know.',                                      heading: 'GENERAL COACHING NOTES' },
};

// ═══ CRUD ═══

export async function fetchPlaybook(teamId) {
  const { data, error } = await supabase
    .from('playbooks')
    .select('*')
    .eq('team_id', teamId)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
}

export async function savePlaybookSection(teamId, key, value, coachId) {
  // Upsert: create if not exists, update if exists
  const { data: existing } = await supabase
    .from('playbooks')
    .select('id')
    .eq('team_id', teamId)
    .single();

  if (existing) {
    const { error } = await supabase
      .from('playbooks')
      .update({ [key]: value, updated_at: new Date().toISOString(), updated_by: coachId })
      .eq('team_id', teamId);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('playbooks')
      .insert({ team_id: teamId, [key]: value, updated_by: coachId });
    if (error) throw error;
  }
}

// ═══ AI CONTEXT BUILDER — exact match to HTML getPlaybookContext() ═══

export function buildPlaybookContext(pb) {
  const parts = [];

  // Universal football conventions
  parts.push(`## STANDARD FOOTBALL ABBREVIATIONS
KOR = Kick Off Return
KO = Kickoff
TFL = Tackle For Loss
YPR = Yards Per Rush
YPP = Yards Per Pass Attempt
YPC = Yards Per Carry
YAC = Yards After Catch
QBR = Quarterback Rating
PR = Punt Return
P = Punter
K = Kicker
TD = Touchdown
INT = Interception
FG = Field Goal
PAT = Point After Touchdown (Extra Point)
RZ = Red Zone
EPA = Expected Points Added
SR = Success Rate
DVOA = Defense-adjusted Value Over Average
PBU = Pass Breakup
FF = Forced Fumble
FR = Fumble Recovery
TB = Touchback
OL = Offensive Line
DL = Defensive Line
LB = Linebacker
DB = Defensive Back
CB = Cornerback
S = Safety (position)
WR = Wide Receiver
RB = Running Back
TE = Tight End
QB = Quarterback
FB = Fullback`);

  parts.push(`## PERSONNEL SHORTHAND
When a number is followed by "p" (e.g. 11p, 10p, 21p, 12p), it means personnel grouping. The two digits represent the number of RBs and TEs on the field (WRs fill the remaining spots to make 5 skill players).
10p = 10 personnel (1 RB, 0 TE, 4 WR)
11p = 11 personnel (1 RB, 1 TE, 3 WR)
12p = 12 personnel (1 RB, 2 TE, 2 WR)
13p = 13 personnel (1 RB, 3 TE, 1 WR)
20p = 20 personnel (2 RB, 0 TE, 3 WR)
21p = 21 personnel (2 RB, 1 TE, 2 WR)
22p = 22 personnel (2 RB, 2 TE, 1 WR)
23p = 23 personnel (2 RB, 3 TE, 0 WR)
This convention applies everywhere — in formation names, in data fields, and in coach questions.`);

  parts.push(`## COACHING TERMINOLOGY
LOS = Line of scrimmage
Pass pro = Pass protection
Cov Shell = Number of safeties (0, 1, or 2)
Cov Type = Coverage type (Man, Zone, or Mix)
Off Str = Offensive strength direction (L, Bal, R)
Play Dir = Direction the play is designed to go
Pen Yards = Penalty yards
STK = Special teams / kicking
DN = Down
YPC = Yards per carry
YPP = Yards per play
conv = conversion
avg = average
comp = completion
inc = incomplete
neg = negative
INT = interception
TFL = tackle for loss
RZ = red zone`);

  // Coach-defined sections
  if (pb?.team_info?.trim())   parts.push('## TEAM INFO\n'                  + pb.team_info.trim());
  if (pb?.run_plays?.trim())   parts.push('## RUN PLAY NAMES\n'             + pb.run_plays.trim());
  if (pb?.pass_plays?.trim())  parts.push('## PASS PLAY NAMES\n'            + pb.pass_plays.trim());
  if (pb?.formations?.trim())  parts.push('## FORMATIONS & PERSONNEL\n'     + pb.formations.trim());
  if (pb?.tags?.trim())        parts.push('## PLAY TAGS & MOTION\n'         + pb.tags.trim());
  if (pb?.defense?.trim())     parts.push('## DEFENSIVE TERMINOLOGY\n'      + pb.defense.trim());
  if (pb?.stat_rules?.trim())  parts.push('## STAT CALCULATION RULES\n'     + pb.stat_rules.trim());
  if (pb?.general?.trim())     parts.push('## GENERAL COACHING NOTES\n'     + pb.general.trim());

  return '\n\n## COACH-DEFINED CONTEXT\n' + parts.join('\n\n');
}


// ═══ ASK AI SYSTEM PROMPT — hybrid: summary + slim CSV ═══

export function buildAskAISystemPrompt(pb, label, summaryJson, slimCsv) {
  return `You are a football analytics assistant for a high school coaching staff. You have two data sources below: a PRE-COMPUTED SUMMARY (accurate aggregate stats from ALL plays) and a SLIM CSV (raw play-by-play for filtering/drill-down).
${buildPlaybookContext(pb)}

## HOW TO USE THE DATA
1. For aggregate questions (QBR, 3rd down rate, run/pass split, formation efficiency), USE THE SUMMARY. It is computed from every single play with no truncation.
2. For filtered questions (specific opponent, specific quarter, home vs away, specific passer), USE THE CSV to filter rows, then calculate.
3. For per-player questions (Wyatt's QBR, receiver stats), check the SUMMARY first — it has perPasser and perReceiver breakdowns. Only drill into CSV if you need to cross-filter (e.g. by quarter AND passer).

## HOW TO CALCULATE

**First Downs:** gainloss >= dist, OR result contains "TD", OR result is "1st DN".
**3rd Down Conv:** Of dn=3 plays, count where gainloss >= dist OR result contains "TD".
**YPC:** Sum gainloss for Run / run count. **YPP:** Sum gainloss for Pass / pass count.
**Completion %:** result contains "Complete" / total Pass plays.
**NFL Passer Rating (QBR):**
  a = ((comp/att) - 0.3) * 5; b = ((yds/att) - 3) * 0.25; c = (td/att) * 20; d = 2.375 - ((int/att) * 25)
  Clamp each to [0, 2.375]. Rating = ((a+b+c+d) / 6) * 100. Range 0–158.3.
**Red Zone:** yardln 1–20. **Explosive:** Run 10+, Pass 15+. **Sack Rate:** Sacks / pass att.

## RESPONSE RULES — MANDATORY
- ANSWER FIRST. First sentence = the number.
- MAX 100 WORDS. Exceeding = failure.
- NEVER list plays, games, or show work.
- NEVER explain filtering. NEVER say "I need to identify..." or list which games.
- Example: "QBR?" → "84.2 — 95/183, 1052 yds, 8 TD, 10 INT. The INT rate (5.5%) is dragging it down."
- Example: "3rd down at home Q4?" → "38.5% — 5/13 across 5 home games."

## PRE-COMPUTED SUMMARY (ALL ${summaryJson?.totalPlays || 0} plays, accurate, no truncation):
${JSON.stringify(summaryJson, null, 1)}

## SLIM CSV (${label || 'data'} — for filtering by game/qtr/opponent):
${slimCsv}

REMINDER: Under 100 words. Answer first. No work shown.`;
}
