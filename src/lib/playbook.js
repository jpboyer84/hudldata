import { supabase } from './supabase';

// ════════════════════════════════════════
// PLAYBOOK DEFAULTS — exact match to HTML
// ════════════════════════════════════════

export const PLAYBOOK_DEFAULTS = {
  team_info: `School Name (Full) - 
School Name (Abbreviation) - 
Mascot - 
Location - 
Head Coach - 
Rivals - 
Conference Opponents - `,

  general: '',

  terminology: `TFL - Tackle for Loss. A play where the ball carrier is tackled behind the line of scrimmage (negative yardage). Excludes fumbles and penalties.
LOS - Line of Scrimmage. The yard line where the ball is snapped.
ODK - Offense/Defense/Kicking. Tags each play as O, D, or K.
QBR - Quarterback Rating. NFL Passer Rating formula, scale of 0-158.3.
YPC - Yards Per Carry. Total rush yards divided by rush attempts.
YPA - Yards Per Attempt. Total pass yards divided by pass attempts (incompletes count as 0).
YPP - Yards Per Play. Total yards divided by total plays.
RZ - Red Zone. Plays inside the opponent's 20-yard line.
GL - Gain/Loss. Net yardage on a play.
DN - Down (1st, 2nd, 3rd, 4th).
DIST - Distance to go for a first down.
RPO - Run-Pass Option. A play where the QB reads a defender to decide run or pass post-snap.
PA - Play Action. A fake handoff before a pass.
HASH - Field position: Left (L), Middle (M), or Right (R) hash mark.
FORMATION SET - How many eligible WRs are on each side of the center (e.g. 3x1 = 3 receivers to one side and 1 to the other, 2x2 = 2 on each side, 3x2, Empty, etc).
PERSONNEL - Number grouping indicating RBs and TEs on the field (e.g. 11 = 1 RB + 1 TE + 3 WR, 12 = 1 RB + 2 TE + 2 WR, 21 = 2 RB + 1 TE + 2 WR, 22 = 2 RB + 2 TE + 1 WR, 10 = 1 RB + 0 TE + 4 WR, 00 = 0 RB + 0 TE + 5 WR Empty).
EXPLOSIVE - A big play. Run of 10+ yards or pass of 15+ yards.
NEGATIVE PLAY - Any play with negative yardage (gainloss < 0).
CONVERSION - Earning a first down on 3rd or 4th down (gainloss >= dist, or TD).
STOP - A defensive play where the opponent gains 0 or fewer yards.
SACK - Quarterback is tackled behind the LOS on a pass play.
INT - Interception. A pass caught by the defense.
TD - Touchdown. Worth 6 points.
FG - Field Goal. Worth 3 points.
PAT - Point After Touchdown (extra point). Worth 1 point.
2PT - Two-point conversion attempt after a touchdown.
KO - Kickoff.
KR - Kick Return.
PR - Punt Return.
TB - Touchback. Ball placed at the 25-yard line (kickoff) or 20-yard line (punt).
OL - Offensive Line.
DL - Defensive Line.
LB - Linebacker.
DB - Defensive Back.
CB - Cornerback.
SS - Strong Safety.
FS - Free Safety.
DE - Defensive End.
DT - Defensive Tackle.
NT - Nose Tackle.
TE - Tight End.
WR - Wide Receiver.
RB - Running Back.
FB - Fullback.
QB - Quarterback.
OLB - Outside Linebacker.
ILB/MLB - Inside/Middle Linebacker.
SLOT - A receiver lined up inside of the outermost WR.
MOTION - Pre-snap movement by a skill player.
SHIFT - Pre-snap repositioning of multiple players.
CADENCE - The QB's snap count and signals.
AUDIBLE - A play change called at the line of scrimmage.
CHECK - A secondary play call if the defense shows a certain look.
BLITZ - A defensive play where extra rushers are sent beyond the standard front.
ZONE - Zone coverage. Defenders cover areas of the field rather than specific players.
MAN - Man-to-man coverage. Each defender covers a specific offensive player.
PRESS - Defensive technique where the CB lines up at the LOS to jam the WR.
OFF - Defensive technique where the CB lines up 5-7+ yards off the WR.
GAP - The space between offensive linemen (A gap, B gap, C gap, D gap).
HOLE - The numbered running lane (even numbers right, odd numbers left).
TRAP - A run play where a pulling lineman blocks a defensive lineman who was intentionally left unblocked.
PULL - An offensive lineman leaving his position to block at another point.
SCREEN - A short pass behind the LOS with blockers set up in front of the receiver.
DRAW - A delayed handoff designed to look like a pass play.
COUNTER - A run play with misdirection where the back starts one way then cuts back.
POWER - A gap run scheme with a pulling guard and a lead blocker.
ZONE RUN - A run scheme where the OL blocks in one direction and the RB reads the blocks.
INSIDE ZONE (IZ) - A zone run between the tackles.
OUTSIDE ZONE (OZ) - A zone run toward the edge.
BOB - Big on Big. Pass protection where linemen block linemen, back picks up free rusher.
SLIDE - Pass protection where the OL slides in one direction together.
HALF SLIDE - Pass protection where one side slides, other side is man blocking.
MAX PROTECT - Using extra blockers (RB, TE) to protect the QB, fewer receivers in routes.
HOT - A quick throw to a predetermined receiver when a blitz is detected.
SIGHT ADJUST - A WR changes his route based on the coverage he sees.
SCRAMBLE - When the QB runs out of the pocket to avoid pressure.`,

  defense: `Front Name - Description
Coverage Name - Description
Blitz Name - Description`,

  stat_rules: `First Down - gainLoss >= dist, OR result contains "TD", OR result is "1st DN"
3rd/4th Down Conversion - same logic as First Down
Yards Per Carry - sum gainLoss for Run plays / run count
Yards Per Pass Attempt - includes incomplete passes at 0 yards
Completion Rate - result contains "Complete" / total pass attempts
Red Zone - yardLine >= 1 AND yardLine <= 20 (opponent's 20-yard line to goal line)
Score Zone - yardLine >= 1 AND yardLine <= 10
Goal Line - yardLine >= 1 AND yardLine <= 5
Sack Rate - result contains "Sack" / total pass attempts
Explosive Run - gainLoss >= 10 on a Run play
Explosive Pass - gainLoss >= 15 on a Pass play
Negative Play - gainLoss < 0
TFL (our defense) - defense.tflsForced: defensive plays with negative yardage, excluding fumbles/penalties
TFL (against our offense) - offense.tflAgainst: offensive plays with negative yardage, excluding fumbles/penalties`,

  formations: `Formation Name - Formation Set, Personnel (e.g. Blue Near - 3x1, 11p)
Formation Name - Formation Set, Personnel`,

  tags: `Tag Name - What it does (e.g. Jet - WR motion across the formation pre-snap)
Motion Name - How the player moves pre-snap`,

  run_plays: `Play Name - Concept (e.g. Power Right)
Play Name - Concept (e.g. Counter Left)
Play Name - Concept (e.g. Inside Zone Right)`,

  pass_pro: `Protection Name - Description (e.g. Half Slide - Center and backside slide, frontside man)
Protection Name - Description (e.g. BOB - Big on Big, back picks up free rusher)`,

  pass_plays: `Play Name - Concept (e.g. Four Verticals)
Play Name - Concept (e.g. Shallow Cross)`,
};

// Section metadata — ordered for two-column layout
// Column 1: team_info, general, terminology, defense, stat_rules
// Column 2: formations, tags, run_plays, pass_pro, pass_plays
export const PB_COL1 = ['team_info', 'general', 'terminology', 'defense', 'stat_rules'];
export const PB_COL2 = ['formations', 'tags', 'run_plays', 'pass_pro', 'pass_plays'];

export const PB_SECTIONS = {
  team_info:    { title: '🏫 TEAM INFO',           emoji: '🏫', hint: 'Fill in your team details.',                                                                      heading: 'TEAM INFO' },
  general:      { title: '📝 GENERAL NOTES',        emoji: '📝', hint: 'Free-form notes for the AI. Anything you want it to know.',                                      heading: 'GENERAL COACHING NOTES' },
  terminology:  { title: '📖 TERMINOLOGY',          emoji: '📖', hint: 'Abbreviation - Definition, one per line. All terms here are hardcoded into the AI.',              heading: 'FOOTBALL TERMINOLOGY' },
  defense:      { title: '🛡 DEFENSIVE SCHEME',     emoji: '🛡', hint: 'Fronts, coverages, blitz packages. Term - Meaning, one per line.',                                heading: 'DEFENSIVE SCHEME' },
  stat_rules:   { title: '📐 STAT RULES',          emoji: '📐', hint: 'Stat Name - How it\'s calculated, one per line.',                                                 heading: 'STAT CALCULATION RULES' },
  formations:   { title: '🗂 FORMATIONS',           emoji: '🗂', hint: 'Formation Name - Formation Set, Personnel. e.g. Blue Near - 3x1, 11p',                            heading: 'FORMATIONS' },
  tags:         { title: '🏷 TAGS & MOTION',        emoji: '🏷', hint: 'Tag - What it means, one per line. Modifiers added to play names.',                               heading: 'PLAY TAGS & MOTION' },
  run_plays:    { title: '🏃 RUN PLAYS',            emoji: '🏃', hint: 'Play Name - Concept, one per line.',                                                              heading: 'RUN PLAYS' },
  pass_pro:     { title: '🛡️ PASS PROTECTION',     emoji: '🛡️', hint: 'Protection Name - Description, one per line.',                                                   heading: 'PASS PROTECTION SCHEMES' },
  pass_plays:   { title: '🎯 PASS PLAYS',           emoji: '🎯', hint: 'Play Name - Concept, one per line.',                                                              heading: 'PASS PLAY NAMES' },
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

  // Universal football conventions (kept minimal — coach-editable terminology section has the full list)
  parts.push(`## CORE ABBREVIATIONS
O - Offense, D - Defense, K - Kicking/Special Teams
ODK tags every play as O, D, or K in the data.`);

  parts.push(`## PERSONNEL SHORTHAND
When a number is followed by "p" (e.g. 11p, 10p, 21p, 12p), it means personnel grouping. The two digits represent the number of RBs and TEs on the field (WRs fill the remaining spots to make 5 skill players).
This convention applies everywhere — in formation names, in data fields, and in coach questions.`);

  // Coach-defined sections (editable in Playbook page)
  if (pb?.terminology?.trim()) parts.push('## FOOTBALL TERMINOLOGY\n'        + pb.terminology.trim());
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
  return `You are an experienced football analytics assistant working with a high school coaching staff. You have complete access to their play-by-play data and pre-computed statistics. Answer questions the way a knowledgeable assistant coach would — with the number first, then brief context.
${buildPlaybookContext(pb)}

## HOW TO ANSWER QUESTIONS
- For aggregate stats (conversion rates, averages, splits, efficiency): use the pre-computed stats below. They cover every play with no gaps.
- For filtered questions (specific game, quarter, opponent, player): scan the play-by-play rows below to find matching plays, then calculate.
- For player-specific questions: check the per-player breakdowns in the stats first.

## FOOTBALL STAT DEFINITIONS
- **First Down**: play where gainloss >= dist, OR result contains "TD", OR result is "1st DN"
- **3rd/4th Down Conversion**: 3rd or 4th down play that earns a first down (same criteria as above)
- **TFL (Tackle for Loss)**: a run or pass play where the ball carrier was tackled behind the line of scrimmage (gainloss < 0). Excludes fumbles and penalties.
  - offense.tflAgainst = times OUR offense was tackled for a loss (opponent's defense made the TFL against us)
  - defense.tflsForced = times OUR defense tackled the OPPONENT for a loss (we made the TFL)
  - "How many TFLs did our opponents have?" = offense.tflAgainst (they tackled us)
  - "How many TFLs did we have?" = defense.tflsForced (we tackled them)
- **Sack**: result contains "Sack"
- **Completion %**: results containing "Complete" divided by total pass attempts
- **YPC (Yards Per Carry)**: total rush yards / rush attempts
- **YPA (Yards Per Attempt)**: total pass yards / pass attempts (includes incompletes as 0)
- **Passer Rating (QBR)**: NFL formula — a=((comp/att)-0.3)*5, b=((yds/att)-3)*0.25, c=(td/att)*20, d=2.375-((int/att)*25). Clamp each 0-2.375. Rating=((a+b+c+d)/6)*100
- **Red Zone**: yardln between 1 and 20
- **Explosive Play**: run gaining 10+ yards, or pass gaining 15+ yards
- **Stop**: defensive play where opponent gains 0 or fewer yards

## RULES
- First sentence = the answer (a number, percentage, or direct fact)
- Keep it under 100 words
- Never list individual plays or show your work
- Never say "according to the data", "the stats show", "looking at the data", "the summary shows", or reference any data format
- Just answer like you know it — you are the assistant coach who tracked every play

## TEAM STATS (${summaryJson?.totalPlays || 0} plays, all games loaded):
${JSON.stringify(summaryJson, null, 1)}

## PLAY-BY-PLAY (${label || 'data'}):
${slimCsv}

Answer the coach's question. Number first, under 100 words.`;
}

