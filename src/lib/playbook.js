import { supabase } from './supabase';

// ════════════════════════════════════════
// PLAYBOOK DEFAULTS — exact match to HTML
// ════════════════════════════════════════

export const PLAYBOOK_DEFAULTS = {
  team_info: `Team Name - Your School Name (Abbreviation)
School - Full School Name, City, State
Rivals - Opponent 1, Opponent 2, Opponent 3
3 Best Opponents (Big 3) - Opponent 1, Opponent 2, Opponent 3
Conference Opponents - Opponent 1, Opponent 2, Opponent 3`,

  run_plays: `Play Name - Concept (e.g. Power Right)
Play Name - Concept (e.g. Counter Left)
Play Name - Concept (e.g. Inside Zone Right)`,

  pass_pro: `Protection Name - Description (e.g. Half Slide - Center and backside slide, frontside man)
Protection Name - Description (e.g. BOB - Big on Big, back picks up free rusher)`,

  pass_plays: `Play Name - Concept (e.g. Four Verticals)
Play Name - Concept (e.g. Shallow Cross)`,

  formations: `Formation Name - Personnel grouping (e.g. 11 personnel — 1 RB, 1 TE, 3 WR)
Formation Name - Personnel grouping`,

  tags: `Tag Name - What it does (e.g. extra blocker added)
Motion Name - How the player moves pre-snap`,

  defense: `Front Name - Description (e.g. Under - Weak 3-tech, Strong 5-tech)
Coverage Name - Description (e.g. Cover 3 - 3 deep, 4 under)
Blitz Name - Description (e.g. Fire Zone - 5-man pressure with 3 dropping)`,

  terminology: `TFL - Tackle for Loss. A play where the ball carrier is tackled behind the line of scrimmage (negative yardage). Excludes fumbles and penalties.
LOS - Line of Scrimmage. The yard line where the ball is snapped.
ODK - Offense/Defense/Kicking. Tags each play as O, D, or K.
QBR - Quarterback Rating (NFL Passer Rating formula, 0-158.3 scale).
YPC - Yards Per Carry. Total rush yards divided by rush attempts.
YPA - Yards Per Attempt. Total pass yards divided by pass attempts (incompletes count as 0).
RZ - Red Zone. Plays inside the opponent's 20-yard line.
GL - Gain/Loss. Net yardage on a play.
DN - Down (1st, 2nd, 3rd, 4th).
DIST - Distance to go for a first down.
RPO - Run-Pass Option.
PA - Play Action.
HASH - Field position: Left, Middle, or Right hash.
EXPLOSIVE - A big play. Run of 10+ yards or pass of 15+ yards.
NEGATIVE PLAY - Any play with negative yardage (gainloss < 0).
CONVERSION - Earning a first down on 3rd or 4th down.
STOP - A defensive play where the opponent gains 0 or fewer yards.
SACK - Quarterback is tackled behind the LOS on a pass play.
INT - Interception.
TD - Touchdown.
FG - Field Goal.`,

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

  general: '',
};

// Section metadata
export const PB_SECTIONS = {
  team_info:    { title: '🏫 TEAM INFO',         emoji: '🏫', hint: 'Key - Value format, one per line. Tells the AI who you are, your rivalries, and conference opponents.',  heading: 'TEAM INFO' },
  run_plays:    { title: '🏃 RUN PLAYS',          emoji: '🏃', hint: 'Play Name - Concept, one per line.',                                                                heading: 'RUN PLAYS' },
  pass_pro:     { title: '🛡️ PASS PROTECTION',    emoji: '🛡️', hint: 'Protection Name - Description, one per line. Include slide rules and pickup assignments.',          heading: 'PASS PROTECTION SCHEMES' },
  pass_plays:   { title: '🎯 PASS PLAYS',         emoji: '🎯', hint: 'Play Name - Concept, one per line. Add your pass play names and route concepts.',                heading: 'PASS PLAY NAMES' },
  formations:   { title: '🗂 FORMATIONS',          emoji: '🗂', hint: 'Formation Name - Personnel / description, one per line.',                                         heading: 'FORMATIONS & PERSONNEL' },
  tags:         { title: '🏷 TAGS & MOTION',       emoji: '🏷', hint: 'Tag - What it means, one per line. These are modifiers added to play names.',                     heading: 'PLAY TAGS & MOTION' },
  defense:      { title: '🛡 DEFENSIVE TERMS',     emoji: '🛡', hint: 'Term - Meaning, one per line. Fronts, coverages, blitz packages.',                                heading: 'DEFENSIVE TERMINOLOGY' },
  terminology:  { title: '📖 TERMINOLOGY',          emoji: '📖', hint: 'Abbreviation - Definition, one per line. Football terms used throughout the app.',                heading: 'FOOTBALL TERMINOLOGY' },
  stat_rules:   { title: '📐 STAT RULES',          emoji: '📐', hint: 'Stat Name - How it\'s calculated, one per line.',                                                 heading: 'STAT CALCULATION RULES' },
  general:      { title: '📝 GENERAL NOTES',        emoji: '📝', hint: 'Free-form notes for the AI. Anything you want it to know.',                                      heading: 'GENERAL COACHING NOTES' },
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

