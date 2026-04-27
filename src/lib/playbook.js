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

  terminology: `=== ACRONYMS ===
2PT - Two-Point Conversion
BOB - Big on Big
CB - Cornerback
DB - Defensive Back
DE - Defensive End
DL - Defensive Line
DN - Down
DIST - Distance
DT - Defensive Tackle
FB - Fullback
FG - Field Goal
FS - Free Safety
GL - Gain/Loss
HASH - Hash Mark
HOT - Hot Route
ILB - Inside Linebacker
INT - Interception
IZ - Inside Zone
KO - Kickoff
KR - Kick Return
LB - Linebacker
LOS - Line of Scrimmage
MLB - Middle Linebacker
NT - Nose Tackle
ODK - Offense/Defense/Kicking
OL - Offensive Line
OLB - Outside Linebacker
OZ - Outside Zone
PA - Play Action
PAT - Point After Touchdown
PR - Punt Return
QB - Quarterback
QBR - Quarterback Rating
RB - Running Back
RPO - Run-Pass Option
RZ - Red Zone
SS - Strong Safety
TB - Touchback
TD - Touchdown
TE - Tight End
TFL - Tackle for Loss
WR - Wide Receiver
YPA - Yards Per Attempt
YPC - Yards Per Carry
YPP - Yards Per Play

=== DEFINITIONS ===
Audible - A play change called by the QB at the line of scrimmage based on the defensive alignment.
Blitz - A defensive play where extra rushers are sent beyond the standard front to pressure the QB.
Cadence - The QB's snap count and verbal signals used to start the play.
Check - A secondary play call triggered if the defense shows a certain pre-snap look.
Conversion - Earning a first down on 3rd or 4th down (gainloss >= dist, or a touchdown).
Counter - A run play with misdirection where the back starts one way then cuts back the other direction.
Draw - A delayed handoff designed to look like a pass play, freezing linebackers before the run.
Explosive Play - A big play. Run of 10+ yards or pass of 15+ yards.
Formation Set - How many eligible WRs are on each side of the center (e.g. 3x1 = 3 to one side and 1 to the other, 2x2 = 2 on each side).
Gap - The space between offensive linemen (A gap between C and G, B gap between G and T, C gap between T and TE, D gap outside TE).
Half Slide - Pass protection where one side of the OL slides together while the other side blocks man-to-man.
Hole - The numbered running lane (even numbers to the right, odd numbers to the left).
Hot Route - A quick throw to a predetermined receiver when a blitz is detected pre-snap.
Inside Zone - A zone run scheme between the tackles where the RB reads the blocks.
Line of Scrimmage - The yard line where the ball is snapped to start each play.
Man Coverage - Man-to-man coverage where each defender covers a specific offensive player.
Max Protect - Using extra blockers (RB, TE) to protect the QB, sending fewer receivers into routes.
Motion - Pre-snap movement by a single skill player, often to identify coverage or gain alignment advantage.
Negative Play - Any play resulting in negative yardage (gainloss < 0).
Off Coverage - Defensive technique where the CB lines up 5-7+ yards off the WR at the snap.
Outside Zone - A zone run scheme toward the edge where the OL blocks laterally.
Personnel - Number grouping indicating RBs and TEs on the field (e.g. 11 = 1 RB + 1 TE + 3 WR, 12 = 1 RB + 2 TE + 2 WR, 21 = 2 RB + 1 TE, 22 = 2 RB + 2 TE, 10 = 1 RB + 4 WR, 00 = Empty 5 WR).
Power - A gap run scheme with a pulling guard and a lead blocker at the point of attack.
Press Coverage - Defensive technique where the CB lines up at the LOS to jam the WR at the snap.
Pull - An offensive lineman leaving his original position to block at another point on the line.
Quarterback Rating - NFL Passer Rating formula on a 0-158.3 scale. Uses completion %, yards/attempt, TD %, and INT %.
Red Zone - Plays inside the opponent's 20-yard line.
Run-Pass Option - A play where the QB reads a defender post-snap to decide whether to hand off or throw.
Scramble - When the QB runs out of the pocket to avoid pressure, either throwing on the run or gaining yards.
Screen - A short pass behind the LOS with blockers set up in front of the receiver.
Shift - Pre-snap repositioning of multiple offensive players simultaneously.
Sight Adjust - A WR changes his route on the fly based on the coverage he reads at the snap.
Slide Protection - Pass protection where the entire OL slides in one direction together.
Slot - A receiver lined up inside of the outermost WR, typically off the line of scrimmage.
Stop - A defensive play where the opponent gains 0 or fewer yards.
Tackle for Loss - A play where the ball carrier is tackled behind the line of scrimmage for negative yardage. Excludes penalties.
Touchback - Ball placed at the 25-yard line (kickoff) or 20-yard line (punt) when not returned.
Trap - A run play where a pulling lineman blocks a defensive lineman who was intentionally left unblocked.
Zone Coverage - Defenders cover areas of the field rather than specific offensive players.
Zone Run - A run scheme where the OL blocks in one direction and the RB reads the blocks to find the lane.`,

  defense: `Front Name - Description
Coverage Name - Description
Blitz Name - Description`,

  stat_rules: `3rd/4th Down Conversion - same logic as First Down (gainloss >= dist, or TD)
Completion Rate - result contains "Complete" / total pass attempts
Explosive Pass - gainLoss >= 15 on a Pass play
Explosive Run - gainLoss >= 10 on a Run play
First Down - gainLoss >= dist, OR result contains "TD", OR result is "1st DN"
Goal Line - yardLine >= 1 AND yardLine <= 5
Negative Play - gainLoss < 0
Red Zone - yardLine >= 1 AND yardLine <= 20 (opponent's 20-yard line to goal line)
Sack Rate - result contains "Sack" / total pass attempts
Score Zone - yardLine >= 1 AND yardLine <= 10
TFL (against our offense) - offense.tflAgainst: offensive plays with negative yardage, excluding penalties
TFL (our defense) - defense.tflsForced: defensive plays with negative yardage, excluding penalties
Yards Per Carry - sum gainLoss for Run plays / run count
Yards Per Pass Attempt - includes incomplete passes at 0 yards`,

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
  terminology:  { title: '📖 TERMINOLOGY',          emoji: '📖', hint: 'Two sections: Acronyms (abbreviation - expansion) and Definitions (term - full definition). All terms are hardcoded into the AI.',  heading: 'FOOTBALL TERMINOLOGY' },
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
- **TFL (Tackle for Loss)**: a run or pass play where the ball carrier was tackled behind the line of scrimmage (gainloss < 0). Excludes penalties.
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

