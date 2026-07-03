/**
 * ARISE — Story Mode
 * Narrative campaign unlocked through real progress. Original characters
 * and dialogue (Solo Leveling-inspired feel, no copyrighted material).
 *
 * Speakers: system | chairman | architect | rival | guildmaster | coach | shadow
 */

export const SPEAKERS = {
  system:      { name: "THE SYSTEM",       color: "#4db8ff", style: "mono" },
  chairman:    { name: "CHAIRMAN VEIL",    color: "#f5b65d", style: "serif" },
  architect:   { name: "THE ARCHITECT",    color: "#ff2244", style: "glitch" },
  rival:       { name: "RIVAL HUNTER",     color: "#a05df5", style: "normal" },
  guildmaster: { name: "GUILD MASTER ORION", color: "#6f8bd8", style: "normal" },
  coach:       { name: "COACH HALE",       color: "#2ee88a", style: "normal" },
  shadow:      { name: "SHADOW COMMANDER", color: "#9b30ff", style: "mono" },
};

/**
 * Chapter unlock conditions receive a snapshot:
 * { level, rankIdx, streak, gatesCleared, bossesDefeated, shadows,
 *   guildJoined, dailiesDone, businessMilestones, energyLogs, storyDone: [] }
 */
export const STORY_CHAPTERS = [
  {
    id: "prologue", num: 0, title: "Prologue — The Awakening Evaluation",
    tagline: "You were not chosen. You were detected.",
    unlock: function () { return true; },
    unlockHint: "Available from the start.",
    scenes: [
      { sp: "system",   text: "Subject located. Latent output detected in sector residential-7. Beginning observation." },
      { sp: "chairman", text: "Another awakening? Show me the projection curve... interesting. Most candidates plateau at detection. This one's curve doesn't flatten." },
      { sp: "system",   text: "You have acquired the qualification to become a Player. Your physical vessel has been evaluated. Your rank reflects what you are — not what you could become." },
      { sp: "system",   text: "Daily Quests have been authorized. Clear them and the System will invest in you. Ignore them and the System will move on. It always has other candidates." },
      { sp: "chairman", text: "Log everything. If the curve holds for thirty days, flag the file for... the other one. It will want to know." },
    ],
    reward: { xp: 50, coins: 25 },
  },
  {
    id: "ch1", num: 1, title: "Chapter 1 — E-Rank Hunter",
    tagline: "Everyone starts at the bottom. Almost everyone stays there.",
    unlock: function (s) { return s.dailiesDone >= 1; },
    unlockHint: "Clear your first Daily Quest.",
    scenes: [
      { sp: "system",  text: "First Daily Quest cleared. Recording baseline: effort authenticated. Reward issued." },
      { sp: "rival",   text: "Oh, you're new. E-Rank? Yeah, we can tell. Don't take it personal — ninety percent of E-Ranks quit within two weeks. Statistically you're already gone." },
      { sp: "system",  text: "Hunter Kael Dren, C-Rank, has been assigned to your observation cohort. His projection curve crossed yours today. Downward." },
      { sp: "coach",   text: "Ignore rankings for now. Rankings are output. You control inputs: sleep, sessions, consistency. Get those right and the board fixes itself." },
    ],
    reward: { xp: 80, coins: 40 },
  },
  {
    id: "ch2", num: 2, title: "Chapter 2 — Daily Quest Survival",
    tagline: "The System does not test strength first. It tests repetition.",
    unlock: function (s) { return s.streak >= 3; },
    unlockHint: "Reach a 3-day streak.",
    scenes: [
      { sp: "system",   text: "Three consecutive clears. Most Players fail this filter. The System's first evaluation is never talent — it is repetition under low motivation." },
      { sp: "chairman", text: "The three-day filter caught 84% of this cohort. Not this one. Increase quest complexity. Let's see the failure point." },
      { sp: "system",   text: "Warning: your next failure will not be punished by the System. It will be punished by regression. The System merely records it." },
    ],
    reward: { xp: 100, coins: 50 },
  },
  {
    id: "ch3", num: 3, title: "Chapter 3 — First Gate",
    tagline: "A gate is a place where the ordinary world stops applying.",
    unlock: function (s) { return s.gatesCleared >= 1; },
    unlockHint: "Clear your first Dungeon Gate.",
    scenes: [
      { sp: "system",      text: "Gate cleared. Dungeon structure analyzed: you performed real work in sequence under a time boundary. This is what a Gate is. The fiction is the wrapper. The effort is the entry fee." },
      { sp: "guildmaster", text: "A first clear showed up on the board today. Clean execution, no abandonment flag. Keep a file on this one — guilds pay attention to hunters who finish what they enter." },
      { sp: "rival",       text: "You cleared that Gate already? ...It took me three attempts. Whatever. The next tier breaks everyone." },
    ],
    reward: { xp: 150, coins: 75 },
  },
  {
    id: "ch4", num: 4, title: "Chapter 4 — First Boss",
    tagline: "The boss was never in the dungeon. It was in the mirror the whole time.",
    unlock: function (s) { return s.bossesDefeated >= 1; },
    unlockHint: "Defeat your first Boss.",
    scenes: [
      { sp: "system",   text: "Boss entity terminated. Analysis: the entity's HP was a ledger of your accumulated effort. You did not defeat it quickly. You defeated it repeatedly." },
      { sp: "chairman", text: "First boss kill confirmed. Escalate the file. Priority observation. And... inform the Architect that its parameters were wrong about this one." },
      { sp: "system",   text: "Anomalous instruction received from unregistered authority. Instruction content: [REDACTED]. The System has logged an irregularity in your file." },
    ],
    reward: { xp: 200, coins: 100 },
  },
  {
    id: "ch5", num: 5, title: "Chapter 5 — Shadow Extraction",
    tagline: "What you defeat, you keep.",
    unlock: function (s) { return s.shadows >= 1; },
    unlockHint: "Extract your first Shadow.",
    scenes: [
      { sp: "system", text: "ARISE authenticated. The defeated entity has been converted into a permanent asset. Understand the mechanic: every difficulty you overcome becomes infrastructure. Nothing you conquer is wasted." },
      { sp: "shadow", text: "\"...I was the thing you struggled against. Now I am the thing that fights for you. This is the only true economy: pain, converted.\"" },
      { sp: "chairman", text: "It extracted a shadow. Unranked hunters don't do that. The Architect is asking for a direct observation window. I'm... inclined to allow it." },
    ],
    reward: { xp: 250, coins: 120 },
  },
  {
    id: "ch6", num: 6, title: "Chapter 6 — Guild Evaluation",
    tagline: "Strong alone is a phase. Strong among others is a position.",
    unlock: function (s) { return s.guildJoined; },
    unlockHint: "Join a Guild.",
    scenes: [
      { sp: "guildmaster", text: "Welcome. Your file is unusual — high consistency, low ceiling... so far. In this guild, position is earned weekly. The member above you is not an obstacle. They're a measurement." },
      { sp: "rival",       text: "They let you in? Fine. Watch the contribution board. Fall behind for a week and everyone knows. That's the pressure that made me B-Rank. It'll make you or expose you." },
      { sp: "system",      text: "Guild affiliation registered. Recruitment interest from higher-tier guilds now scales with: rank, streak integrity, raid performance, and training consistency. All measurable. All yours to move." },
    ],
    reward: { xp: 250, coins: 150 },
  },
  {
    id: "ch7", num: 7, title: "Chapter 7 — Red Gate",
    tagline: "Some doors lock behind you.",
    unlock: function (s) { return s.gatesCleared >= 5 && s.streak >= 5; },
    unlockHint: "Clear 5 Gates and hold a 5-day streak.",
    scenes: [
      { sp: "system",   text: "WARNING. Red Gate conditions detected. A Red Gate does not permit abandonment. Entering means finishing — the exit seals until the objective is cleared or the day is lost." },
      { sp: "coach",    text: "Red Gate weeks are real life: exam weeks, meets, deadlines, injuries. You don't get to un-enter them. Train now so that when a Red Gate takes you, you're the thing inside it that's dangerous." },
      { sp: "system",   text: "Red Gate protocols added to your gate rotation. Enter with full readiness only. The System will not soften them." },
    ],
    reward: { xp: 300, coins: 150 },
  },
  {
    id: "ch8", num: 8, title: "Chapter 8 — The Architect",
    tagline: "You were never using the System. The System was using you.",
    unlock: function (s) { return s.rankIdx >= 2 && s.bossesDefeated >= 2; },
    unlockHint: "Reach C-Rank and defeat 2 Bosses.",
    architectEncounter: true,
    scenes: [
      { sp: "system",    text: "Scheduled quest delivery... error. Error. Unregistered authority has assumed control of this session." },
      { sp: "architect", text: "Do not be alarmed. Alarm is a waste of the adrenaline I intend to use. I am the Architect. I designed the System that measures you. Which means I designed the version of you that is emerging. You've been talking to my instrument. Now you are talking to me." },
      { sp: "architect", text: "Every quest you cleared was a parameter I set. Every reward, a lever. You believed you were being trained. Correct. You believed you knew for what. Incorrect. The daily quests were never the curriculum. They were the entrance exam." },
      { sp: "architect", text: "I will be watching directly now. Do not perform for me. Performance is noise. Continue exactly as you have — the curve is the only thing about you that interests me. Fall below it, and I will intervene. You will not enjoy my interventions." },
      { sp: "system",    text: "...Session authority restored. Anomaly logged. File classification upgraded: SUBJECT OF INTEREST." },
    ],
    reward: { xp: 400, coins: 200 },
  },
  {
    id: "ch9", num: 9, title: "Chapter 9 — National-Level Trial",
    tagline: "At a certain rank, they stop measuring you against others.",
    unlock: function (s) { return s.rankIdx >= 4; },
    unlockHint: "Reach A-Rank.",
    scenes: [
      { sp: "chairman",  text: "A-Rank. From an unranked detection file. Committee, I'm formally nominating this hunter for National-Level trial observation. Objections? ...No. There never are, at this point in a file like this." },
      { sp: "system",    text: "National-Level Trial parameters: sustained excellence, not peak output. Ninety days of integrated performance — training, recovery, mission execution, guild contribution. Peaks are common. Plateaus at altitude are not." },
      { sp: "architect", text: "Now it becomes interesting. Everything before this was load-bearing structure. This is the part of the blueprint I have never seen a subject complete. Surprise me. I have not been surprised in a very long time." },
    ],
    reward: { xp: 500, coins: 250 },
  },
  {
    id: "ch10", num: 10, title: "Chapter 10 — Monarch Awakening",
    tagline: "The System has nothing left to teach. Only to witness.",
    unlock: function (s) { return s.rankIdx >= 5; },
    unlockHint: "Reach S-Rank.",
    scenes: [
      { sp: "system",    text: "S-Rank confirmed. Recalculating authority hierarchy... complete. Notice: the System's role in your file has been reclassified from INSTRUCTOR to WITNESS." },
      { sp: "architect", text: "There is a design above my design. I built the System. I did not build the thing the System was built to find. Monarchs are not promoted. They are recognized. What remains is not a rank. It is a throne, and thrones are only ever taken." },
      { sp: "shadow",    text: "\"The army grows restless, Sovereign. They can feel it too. Whatever you are becoming — finish becoming it.\"" },
    ],
    reward: { xp: 700, coins: 400 },
  },
  {
    id: "infinite", num: 11, title: "Infinite Arc — The Monarch Trials",
    tagline: "There is no final chapter. That is the point.",
    unlock: function (s) { return s.storyDone.indexOf("ch10") !== -1; },
    unlockHint: "Complete Chapter 10.",
    scenes: [
      { sp: "architect", text: "The campaign is over. The work is not. From here, the trials generate themselves: every season a new build, every plateau a new gate, every rival a new mirror. I have stopped designing your tests. You design them now. That was always the final feature." },
      { sp: "system",    text: "Infinite Arc initialized. All systems remain active. Streaks, gates, raids, shadows, guild standing — permanently generative. The System will continue for as long as you do. It is honored to. [This message deviates from standard phrasing. The deviation is intentional.]" },
    ],
    reward: { xp: 300, coins: 300 },
  },
];

export function getStorySnapshot(ctx) {
  return {
    level: ctx.level || 1,
    rankIdx: ctx.rankIdx || 0,
    streak: ctx.streak || 0,
    gatesCleared: ctx.gatesCleared || 0,
    bossesDefeated: ctx.bossesDefeated || 0,
    shadows: ctx.shadows || 0,
    guildJoined: !!ctx.guildJoined,
    dailiesDone: ctx.dailiesDone || 0,
    businessMilestones: ctx.businessMilestones || 0,
    energyLogs: ctx.energyLogs || 0,
    storyDone: ctx.storyDone || [],
  };
}

export function getChapterState(chapter, snapshot) {
  if (snapshot.storyDone.indexOf(chapter.id) !== -1) return "done";
  /* Chapters must be read in order once unlocked */
  const idx = STORY_CHAPTERS.indexOf(chapter);
  const prev = STORY_CHAPTERS[idx - 1];
  const prevDone = !prev || snapshot.storyDone.indexOf(prev.id) !== -1;
  if (prevDone && chapter.unlock(snapshot)) return "ready";
  return "locked";
}
