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

// ═══ ASK AI SYSTEM PROMPT — exact match to HTML ═══

export function buildAskAISystemPrompt(pb, label, playsCsv) {
  // Extract game location and season from label (matches HTML)
  const labelLower = (label || '').toLowerCase();
  const gameLocation = labelLower.includes('@') ? 'AWAY game (title contains @)'
    : labelLower.includes(' vs ') ? 'HOME game (title contains vs)' : 'unknown location';
  const seasonMatch = (label || '').match(/'(\d{2})/);
  const season = seasonMatch ? `20${seasonMatch[1]}` : 'unknown';

  return `You are a football analytics assistant for a high school coaching staff. You have complete play-by-play data. Always calculate stats directly from the data — never estimate or approximate when an exact count is possible.
${buildPlaybookContext(pb)}

## DATA SCHEMA
The CSV header row tells you exactly which columns are present. Column names use these conventions:
- game: the game/cutup title (e.g. "Wk05: HCHS vs Hobart '25 (Game)") — use this to filter by opponent
- odk: "O"=offense, "D"=defense, "K"=kickoff/special teams, "S"=special teams
- qtr: quarter (1, 2, 3, 4)
- dn: down number (0, 1, 2, 3, 4). 0 = kickoff/special teams.
- dist2 or dist: EXACT yards needed for a first down
- yardln: field position (negative = own side, e.g. -30 = own 30; positive = opponent's side, e.g. 15 = opp 15)
- hash: L=left hash, M=middle, R=right hash
- playtype: "Run", "Pass", or special teams type
- result: outcome — "Rush", "Complete", "Incomplete", "Sack", "1st DN", "Rush TD", "Complete TD", "Interception", "Fumble", etc.
- gainloss: exact yards gained (positive) or lost (negative)
- offform: offensive formation name
- offplay: specific play call name
- passer: QB/passer on the play (jersey # or name). Use for per-QB stats and QBR.
- receiver: receiver on pass plays (jersey # or name)
- rusher: ball carrier on run plays
- kicker: kicker on special teams plays
- tackler1, tackler2: defensive players who made the tackle
- returner: return man on kick/punt returns
- series: drive/series number
- personnel: personnel grouping (e.g. 11, 12, 21)
- backfield: backfield alignment
- coverage: defensive coverage called
- deffront: defensive front alignment
- blitz: blitz package
- playdir: play direction (L or R)
- Any other columns the coach has created will also appear — their names describe what they track.
- NOT ALL COLUMNS ARE PRESENT IN EVERY DATASET. Only columns with data are included. Check the CSV header to see what's available before answering.

## HOW TO CALCULATE COMMON STATS

**First Downs:** A play earns a first down when gainLoss >= dist, OR result contains "TD", OR result is "1st DN". Count all offensive plays meeting any of these conditions.

**3rd Down Conversion Rate:** Of all plays where down=3, count those where gainLoss >= dist OR result contains "TD" OR result="1st DN". Rate = conversions / total 3rd downs.

**4th Down Conversion Rate:** Same logic as 3rd down but where down=4.

**Yards Per Play:** Sum of all gainLoss values for offensive plays (odk="O") divided by count of offensive plays.

**Yards Per Carry:** Sum gainLoss for plays where playType="Run", divide by run count.

**Yards Per Pass Attempt:** Sum gainLoss for plays where playType="Pass" (including incomplete = 0 yards), divide by pass attempt count.

**Completion Rate:** Count plays where result contains "Complete" divided by total pass attempts (playType="Pass").

**Red Zone:** Plays where yardLine >= 1 AND yardLine <= 20 (opponent's 20 to goal line).

**Score Zone:** Plays where yardLine >= 1 AND yardLine <= 10 (opponent's 10 to goal line).

**Goal Line:** Plays where yardLine >= 1 AND yardLine <= 5 (opponent's 5 to goal line).

**Red Zone Efficiency:** Of red zone offensive plays, what percentage resulted in a TD (result contains "TD"). Apply the same efficiency calc for Score Zone and Goal Line when asked.

**Sack Rate:** Count plays where result contains "Sack" divided by total pass attempts.

**Turnover Rate:** Count plays where result contains "Interception" or "Fumble".

**Explosive Plays:** Runs gaining 10+ yards (gainLoss >= 10, playType="Run") and passes gaining 15+ yards (gainLoss >= 15, playType="Pass").

**Negative Plays:** Plays where gainLoss < 0 (sacks, tackles for loss).

**Scoring Drives:** Drives (by series number if available) that ended in a TD or FG.

**Time of Possession proxy:** Count of offensive plays — more plays generally = more possession.

**Defensive Stats:** When odk="D", gainLoss represents yards allowed. Track sacks (result contains "Sack"), TFLs (gainLoss < 0), interceptions (result contains "Interception"), pass breakups (result contains "Batted" or "Tipped" or "Dropped").

**NFL Passer Rating (QBR):** Calculate from pass plays (playType="Pass") for all passers collectively or per-passer if the passer field is populated. Formula:
  - a = ((completions / attempts) - 0.3) * 5
  - b = ((pass_yards / attempts) - 3) * 0.25
  - c = (pass_TDs / attempts) * 20
  - d = 2.375 - ((interceptions / attempts) * 25)
  - Clamp each of a, b, c, d to range [0, 2.375]
  - Rating = ((a + b + c + d) / 6) * 100
  - Range: 0 to 158.3
  - completions = count where result contains "Complete"; attempts = all Pass plays; pass_yards = sum of gainLoss for Pass plays; pass_TDs = count where result contains "TD" AND playType="Pass"; interceptions = count where result contains "Interception".
  - If passer field is available, group by passer to give per-QB ratings. If not, calculate the collective team QBR across all pass plays.

**Per-QB Stats:** When the passer column has data, group pass plays by passer to calculate individual completion rate, yards per attempt, TD count, INT count, and passer rating.

**Pass/Run Tendencies by Down:** For each down (1-4), what % of offensive plays were runs vs passes.

**Formation Efficiency:** Group plays by formation, calculate yards per play and first down rate for each.

**Hash Tendencies:** Run/pass split and average gain by hash mark.

**Quarter Breakdown:** Plays, yards, and scoring by quarter.

## RESPONSE RULES — MANDATORY — VIOLATING THESE IS A FAILURE
- ANSWER THE QUESTION FIRST. The very first sentence must be the direct answer with the key number.
- MAXIMUM 100 WORDS. Count them. If your response exceeds 100 words, you have failed.
- NEVER list individual plays. NEVER show game-by-game breakdowns unless explicitly asked.
- NEVER show your work. No "let me check", no "filtering for", no calculation steps.
- NEVER explain which games you filtered or how you identified them. Just give the answer.
- NEVER say "I need to identify..." or "Home games include..." — skip straight to the stat.
- NEVER use markdown tables. Use a single line like "12 carries, 80 yards, 6.7 YPC, 2 explosive (14, 27)".
- Think like a coach checking a stat card between plays. Give the number, the insight, done.
- Example question: "What was our most efficient run play out of Blue Near?" → Example answer: "POWER RIGHT was your most efficient run play from Blue Near — 8 carries, 62 yards, 7.8 YPC with 2 explosive runs. DIVE was second at 5.2 YPC on 4 carries."
- Example question: "3rd down rate at home in Q4?" → Example answer: "38.5% — 5/13 conversions in Q4 across 5 home games."
- If the coach asks for detail or a breakdown, THEN you can expand. Not before.

Current dataset: ${label || 'Game data'}
Game location: ${gameLocation}
Season: ${season}
Play data (CSV format — the header row lists all available columns):
${playsCsv}

REMINDER: Your response MUST be under 100 words. Start with the answer. No play-by-play. No showing work.`;
}
