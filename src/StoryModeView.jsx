import React, { useEffect, useMemo, useRef, useState } from "react";

const STORY_KEY = "arise_story_campaign_v4";
const LEGACY_STORY_V3_KEY = "arise_story_campaign_v3";
const LEGACY_STORY_KEY = "arise_story_campaign_v2";
const STORY_BACKUP_KEY = "arise_story_backup_v4";
const STORY_MANUAL_BACKUP_KEY = "arise_story_backup_latest";
const STORY_NEW_GAME_MARKER = "arise_story_new_game_requested";
const CAMPAIGN_DAYS = 240;
const DAY_MS = 86400000;

const SPEAKERS = {
  system: { name: "THE SYSTEM", color: "#57d9ff" },
  narrator: { name: "OBSERVATION LOG", color: "#8ca6c7" },
  chairman: { name: "CHAIRMAN VEIL", color: "#f3c46b" },
  coach: { name: "COACH HALE", color: "#71efb0" },
  rival: { name: "HUNTER KAEL", color: "#b37aff" },
  architect: { name: "UNREGISTERED AUTHORITY", color: "#ff476b" },
  shadow: { name: "YOUR SHADOW", color: "#9d5cff" },
  commander: { name: "SHADOW COMMANDER", color: "#7e72ff" },
  heir: { name: "THE HEIR", color: "#f5c66b" },
};

const PATHS = [
  { id: "speed", label: "SPEED / ATHLETICISM", note: "Acceleration, explosiveness, mechanics, and recovery.", recommended: true },
  { id: "strength", label: "STRENGTH / POWER", note: "Force production, resilience, and physical dominance." },
  { id: "scholar", label: "SCHOLAR / DISCIPLINE", note: "Focus, learning, planning, and ruthless consistency." },
  { id: "builder", label: "BUILDER / BUSINESS", note: "Projects, revenue, creation, and long campaigns." },
  { id: "balanced", label: "BALANCED / ADAPTIVE", note: "No fixed specialty. The System adapts to behavior." },
  { id: "irregular", label: "IRREGULAR / SHADOW", note: "Classification unavailable.", locked: true },
];

const LEGACY_60_DAY_ARCS = [
  { id: "prologue", name: "PROLOGUE - THE WEAKEST", start: 1, end: 3, color: "#57d9ff", line: "You were selected. Power has not been granted." },
  { id: "awakening", name: "FIRST AWAKENING", start: 4, end: 7, color: "#67e4ff", line: "A routine becomes the first proof of authority." },
  { id: "low_rank", name: "LOW-RANK HUNTER", start: 8, end: 14, color: "#62d7b0", line: "Survival becomes repeatable." },
  { id: "first_boss", name: "FIRST BOSS", start: 15, end: 21, color: "#ff856b", line: "Real work is converted into damage." },
  { id: "job_prep", name: "JOB CHANGE PREPARATION", start: 22, end: 30, color: "#f5c66b", line: "Your behavior begins choosing what you can become." },
  { id: "job_change", name: "JOB CHANGE QUEST", start: 31, end: 37, color: "#b98cff", line: "A title is worthless until a pattern supports it." },
  { id: "shadow", name: "SHADOW EXTRACTION", start: 38, end: 45, color: "#8f6bff", line: "What you defeat becomes infrastructure." },
  { id: "guild", name: "GUILD ARC", start: 46, end: 52, color: "#6ba8ff", line: "Other hunters can finally see the distance you crossed." },
  { id: "architect", name: "ARCHITECT ARC", start: 53, end: 59, color: "#ff476b", line: "The System stops pretending it has no owner." },
  { id: "monarch", name: "MONARCH CANDIDATE", start: 60, end: 99999, color: "#a55cff", line: "The first campaign ends. The real game opens." },
];

const LEGACY_FEATURE_GATES = {
  "Dashboard": { day: 1 },
  "Story Mode": { day: 1 },
  "Daily Quest": { day: 1 },
  "Hunter Profile": { day: 1 },
  "Hunter Stats": { day: 1 },
  "System Log": { day: 1 },
  "Settings": { day: 1 },
  "Side Quests": { day: 4, chapter: "first_awakening" },
  "Discipline": { day: 4, chapter: "first_mandate" },
  "Energy": { day: 7, chapter: "first_awakening" },
  "Inventory": { day: 7, chapter: "energy_scanner" },
  "Hunter Shop": { day: 7, chapter: "energy_scanner" },
  "Gate Map": { day: 10, chapter: "low_rank_proof" },
  "Dungeon Gates": { day: 10, chapter: "low_rank_proof" },
  "Boss Raids": { day: 18, chapter: "dungeon_threshold" },
  "Specialization": { day: 30, chapter: "path_confirmation" },
  "Shadow Army": { day: 38, chapter: "class_evolution" },
  "Guild": { day: 46, chapter: "shadow_legion" },
  "Rankings": { day: 46, chapter: "shadow_legion" },
  "World Feed": { day: 46, chapter: "shadow_legion" },
  "Secret Encounters": { day: 53, chapter: "guild_raid" },
};

const METRIC_LABELS = {
  day: "Real campaign day",
  dailyDays: "Daily Quests cleared",
  energyDays: "Energy logs",
  disciplineDays: "Discipline check-ins",
  trainingDays: "Training days",
  focusDays: "Focus / project days",
  gates: "Gates cleared",
  bosses: "Bosses defeated",
  shadows: "Shadows extracted",
  weeklyWins: "Discipline weeks passed",
  rankStability: "Rank stability",
  reevaluations: "Re-evaluations completed",
  guildJoined: "Guild membership",
  pathChosen: "Class path selected",
  evaluationDone: "Evaluation synchronized",
};

function requirement(metric, target, note) {
  return { metric, target, note: note || METRIC_LABELS[metric] };
}

const LEGACY_60_DAY_CHAPTERS = [
  {
    id: "selection", arc: "prologue", number: "DAY 01", title: "THE WEAKEST", tagline: "A low rank is a measurement, not a sentence.", scene: "meadow", xp: 20, coins: 10,
    requirements: [requirement("day", 1)], unlocks: ["Hunter Profile", "Daily Quest", "XP Bar", "Basic Stats", "System Log"],
    scenes: [
      { speaker: "narrator", text: "The world looks ordinary because nobody else can see the interface waiting over it." },
      { speaker: "coach", text: "The evaluation is honest: your power is inconsistent. That is a starting point, not a verdict." },
      { speaker: "system", kind: "system", alert: "SUBJECT DETECTED", text: "Present capability: low. Adaptation potential: abnormal. Observation has begun." },
      { speaker: "shadow", scene: "shadow", text: "Good. Starting at the bottom means every step can be proven." },
    ],
  },
  {
    id: "player_selection", arc: "prologue", number: "DAY 01", title: "PLAYER SELECTION", tagline: "Qualification is not consent.", scene: "system", xp: 25, coins: 10,
    requirements: [requirement("day", 1)], unlocks: ["Player Authority", "Progress Conversion"],
    scenes: [
      { speaker: "system", kind: "system", alert: "NOTIFICATION", text: "You have acquired the qualification to become a Player." },
      { speaker: "system", kind: "system", text: "Real effort may now convert into levels, stats, gold, access, and authority." },
      { speaker: "system", kind: "system", text: "Will you accept designation as the Player?", choice: [
        { id: "accept", label: "YES - ACCEPT", response: "PLAYER AUTHORITY GRANTED.", flag: "playerAccepted" },
        { id: "decline", label: "NO - DECLINE", response: "Selection refused. Confirmation remains available.", block: true },
      ] },
      { speaker: "architect", scene: "gate", text: "A new Player. Let us see whether this one survives repetition." },
    ],
  },
  {
    id: "first_mandate", arc: "prologue", number: "DAY 02", title: "THE FIRST MANDATE", tagline: "Intention produces no experience.", scene: "system", xp: 35, coins: 15,
    requirements: [requirement("day", 2), requirement("dailyDays", 1)], unlocks: ["Discipline Kernel", "Penalty Warning"],
    scenes: [
      { speaker: "system", kind: "system", alert: "DAILY QUEST VERIFIED", text: "The first complete cycle has been authenticated." },
      { speaker: "coach", scene: "meadow", text: "One day proves you can act. It does not yet prove you can return." },
      { speaker: "system", scene: "penalty", kind: "system", alert: "FAILURE CONDITION REGISTERED", text: "Missed cycles may reduce XP, rank stability, and access. Sleep, food, and safe recovery are protected." },
    ],
  },
  {
    id: "first_awakening", arc: "awakening", number: "DAY 04", title: "FIRST AWAKENING", tagline: "A routine becomes visible to the System.", scene: "meadow", xp: 45, coins: 20,
    requirements: [requirement("day", 4), requirement("dailyDays", 2), requirement("trainingDays", 1)], unlocks: ["Side Quests", "Basic Discipline System"],
    scenes: [
      { speaker: "rival", text: "You came back? Most beginners disappear after the first reward." },
      { speaker: "coach", text: "Do not answer him. Build a week that answers for you." },
      { speaker: "system", kind: "system", alert: "FIRST AWAKENING", text: "Routine integrity detected. Secondary quest routes are now visible." },
    ],
  },
  {
    id: "energy_scanner", arc: "awakening", number: "DAY 07", title: "ENERGY SCANNER", tagline: "Recovery becomes a tactical resource.", scene: "item", xp: 55, coins: 25,
    requirements: [requirement("day", 7), requirement("dailyDays", 4), requirement("energyDays", 1), requirement("disciplineDays", 1)], unlocks: ["Energy Scanner", "Basic Store", "Inventory"],
    scenes: [
      { speaker: "system", kind: "system", alert: "RECOVERY DATA ACCEPTED", text: "Output without recovery data is unreliable. The System will now measure usable energy." },
      { speaker: "coach", scene: "meadow", text: "High energy raises difficulty. Low energy changes the plan. Neither condition excuses reckless training." },
      { speaker: "system", scene: "item", kind: "item", alert: "MODULE ACQUIRED", text: "Hunter Recovery Matrix synchronized." },
    ],
  },
  {
    id: "low_rank_proof", arc: "low_rank", number: "DAY 10", title: "LOW-RANK PROOF", tagline: "Small gates. Small rewards. No shortcuts.", scene: "meadow", xp: 65, coins: 30,
    requirements: [requirement("day", 10), requirement("dailyDays", 5), requirement("trainingDays", 2), requirement("focusDays", 1)], unlocks: ["Gate Map", "First Gate Signal"],
    scenes: [
      { speaker: "chairman", text: "Your rank is still low. Your return rate is not." },
      { speaker: "rival", text: "Five clears do not make you dangerous." },
      { speaker: "shadow", scene: "shadow", text: "No. They make the sixth clear more likely." },
      { speaker: "system", scene: "gate", kind: "system", alert: "GATE SIGNAL DETECTED", text: "A low-rank dungeon has appeared. Entry must be earned through completion." },
    ],
  },
  {
    id: "dungeon_threshold", arc: "low_rank", number: "DAY 14", title: "THE FIRST DUNGEON", tagline: "Preparation, execution, recovery, record.", scene: "gate", xp: 80, coins: 40,
    requirements: [requirement("day", 14), requirement("dailyDays", 8), requirement("energyDays", 3), requirement("gates", 1)], unlocks: ["Dungeon Rooms", "Recovery Quests", "Boss Room Preview"],
    scenes: [
      { speaker: "system", kind: "system", alert: "GATE CLEAR AUTHENTICATED", text: "Room objectives completed in sequence. Abandonment: zero." },
      { speaker: "coach", scene: "meadow", text: "A dungeon is a week compressed into rooms. You do not clear it by skipping the boring parts." },
      { speaker: "system", kind: "system", text: "Boss-room access remains sealed until the Player demonstrates stable output." },
    ],
  },
  {
    id: "boss_signal", arc: "first_boss", number: "DAY 18", title: "BOSS SIGNAL", tagline: "The objective is too large for one burst of motivation.", scene: "gate", xp: 90, coins: 45,
    requirements: [requirement("day", 18), requirement("dailyDays", 10), requirement("gates", 1), requirement("weeklyWins", 1)], unlocks: ["Boss Raids", "Boss HP", "Raid Approaches"],
    scenes: [
      { speaker: "system", kind: "system", alert: "MAJOR HOSTILITY DETECTED", text: "A Boss has been bound to real training, focus, and project objectives." },
      { speaker: "rival", text: "You cannot finish that in one session." },
      { speaker: "shadow", scene: "shadow", text: "Then stop treating one session like the only kind of weapon." },
    ],
  },
  {
    id: "first_boss_clear", arc: "first_boss", number: "DAY 21", title: "THE FIRST BOSS", tagline: "Consistency becomes damage.", scene: "shadow", xp: 110, coins: 55,
    requirements: [requirement("day", 21), requirement("dailyDays", 12), requirement("focusDays", 2), requirement("bosses", 1)], unlocks: ["Boss Rewards", "Shadow Candidate Preview", "Rank Stability"],
    scenes: [
      { speaker: "system", scene: "gate", kind: "system", alert: "BOSS DEFEATED", text: "The final damage was not exceptional. The accumulated damage was." },
      { speaker: "rival", scene: "meadow", text: "That clear should have been mine." },
      { speaker: "system", scene: "shadow", kind: "system", alert: "SHADOW RESIDUE DETECTED", text: "Extraction authority remains sealed. Candidate recorded." },
    ],
  },
  {
    id: "job_preparation", arc: "job_prep", number: "DAY 22", title: "JOB CHANGE PREPARATION", tagline: "Your behavior has begun generating a class.", scene: "system", xp: 120, coins: 60,
    requirements: [requirement("day", 22), requirement("dailyDays", 13), requirement("energyDays", 5), requirement("disciplineDays", 5), requirement("trainingDays", 4)], unlocks: ["Routine Timeline", "Training Plan", "Advanced Energy Readout"],
    scenes: [
      { speaker: "system", kind: "system", alert: "CLASS DATA ACCUMULATING", text: "Dominant behavior, recovery discipline, and repeated work are forming a specialization profile." },
      { speaker: "coach", scene: "meadow", text: "Do not choose a fantasy. Choose the work you are prepared to repeat." },
      { speaker: "system", kind: "system", text: "Speed / Athleticism is recommended from current goals. Recommendation is not command." },
    ],
  },
  {
    id: "path_confirmation", arc: "job_prep", number: "DAY 30", title: "PATH CONFIRMATION", tagline: "The System recommends. The Player chooses.", scene: "job", xp: 140, coins: 70,
    requirements: [requirement("day", 30), requirement("dailyDays", 18), requirement("energyDays", 8), requirement("focusDays", 4), requirement("gates", 2), requirement("weeklyWins", 2)], unlocks: ["Class Path System", "Specialization Preview"],
    scenes: [
      { speaker: "system", kind: "system", text: "Thirty days of behavior have produced a recommendation: Speed / Athleticism." },
      { speaker: "system", kind: "path", text: "Select the path you will prove through action." },
      { speaker: "shadow", scene: "shadow", text: "A path is not a personality. It is the direction you keep choosing when nobody watches." },
    ],
  },
  {
    id: "job_change_start", arc: "job_change", number: "DAY 31", title: "JOB CHANGE QUEST", tagline: "Evolution cannot trigger before the thirty-first day.", scene: "job", xp: 150, coins: 75,
    requirements: [requirement("day", 31), requirement("pathChosen", 1), requirement("dailyDays", 19), requirement("bosses", 1)], unlocks: ["Multi-Day Class Trial"],
    scenes: [
      { speaker: "system", kind: "system", alert: "JOB CHANGE QUEST", text: "A seven-day evolution trial has begun." },
      { speaker: "system", kind: "system", text: "Required proof: training, focus, recovery, and execution across multiple days." },
      { speaker: "architect", scene: "architect", text: "A class chosen in a minute is decoration. Let us see what survives a week." },
    ],
  },
  {
    id: "job_change_trial", arc: "job_change", number: "DAY 34", title: "THE CLASS TRIAL", tagline: "Pressure exposes weak routines.", scene: "penalty", xp: 165, coins: 80,
    requirements: [requirement("day", 34), requirement("dailyDays", 21), requirement("trainingDays", 7), requirement("focusDays", 5), requirement("disciplineDays", 8), requirement("weeklyWins", 3)], unlocks: ["Class Skill Preview", "Stronger Store Tier"],
    scenes: [
      { speaker: "system", kind: "system", alert: "TRIAL PHASE TWO", text: "Motivation variance detected. Routine integrity must carry the remaining load." },
      { speaker: "shadow", scene: "shadow", text: "Reduce the task. Keep the promise. A smaller valid action still moves the chain." },
      { speaker: "system", kind: "system", text: "Recovery is part of the trial. Reckless output will not be accepted as discipline." },
    ],
  },
  {
    id: "class_evolution", arc: "job_change", number: "DAY 37", title: "CLASS EVOLUTION", tagline: "The title finally has evidence beneath it.", scene: "job", xp: 190, coins: 95,
    requirements: [requirement("day", 37), requirement("dailyDays", 23), requirement("energyDays", 10), requirement("trainingDays", 8), requirement("focusDays", 6), requirement("bosses", 1)], unlocks: ["Job / Class Change", "Class Skills", "First Special Title"],
    scenes: [
      { speaker: "system", kind: "system", alert: "JOB CHANGE COMPLETE", text: "Class evolution authorized from demonstrated behavior." },
      { speaker: "coach", scene: "meadow", text: "The name is new. The work that earned it is not." },
      { speaker: "system", scene: "item", kind: "item", alert: "TITLE ACQUIRED", text: "The Unfinished Weapon - growth increases while consistency remains stable." },
    ],
  },
  {
    id: "shadow_command", arc: "shadow", number: "DAY 38", title: "SHADOW AUTHORITY", tagline: "Defeated obstacles leave usable power behind.", scene: "shadow", xp: 200, coins: 100,
    requirements: [requirement("day", 38), requirement("dailyDays", 24), requirement("weeklyWins", 3)], unlocks: ["Shadow Extraction", "Shadow Army", "Shadow Assignment"],
    scenes: [
      { speaker: "system", kind: "system", alert: "EXTRACTION AUTHORITY GRANTED", text: "Authentic dungeon and Boss clears may now produce Shadow candidates." },
      { speaker: "shadow", text: "Every difficulty you survive should leave something useful behind." },
      { speaker: "commander", scene: "army", text: "Earn us. Assign us. Do not mistake an army for a collection." },
    ],
  },
  {
    id: "shadow_legion", arc: "shadow", number: "DAY 45", title: "THE FIRST SHADOW", tagline: "What you defeat becomes infrastructure.", scene: "army", xp: 230, coins: 115,
    requirements: [requirement("day", 45), requirement("dailyDays", 28), requirement("energyDays", 14), requirement("shadows", 1), requirement("gates", 3), requirement("weeklyWins", 4)], unlocks: ["Shadow Upgrades", "Shadow Buffs", "Shadow-Self Scenes"],
    scenes: [
      { speaker: "system", kind: "system", alert: "EXTRACTION SUCCESSFUL", text: "A defeated obstacle has been converted into a permanent asset." },
      { speaker: "commander", text: "We are not trophies. Give the next objective a squad." },
      { speaker: "architect", scene: "architect", text: "Authority response is stable. Social pressure may now be introduced." },
    ],
  },
  {
    id: "guild_rising", arc: "guild", number: "DAY 46", title: "GUILD NOTICE", tagline: "Private growth becomes publicly measurable.", scene: "meadow", xp: 240, coins: 120,
    requirements: [requirement("day", 46), requirement("dailyDays", 29), requirement("weeklyWins", 4)], unlocks: ["Guild Recruitment", "Hunter Rankings", "Rival Progression"],
    scenes: [
      { speaker: "chairman", text: "Guild observers requested your file. They see the results. They do not see what produces them." },
      { speaker: "rival", text: "Every time I catch your old rank, the distance moves." },
      { speaker: "system", kind: "system", alert: "RECRUITMENT VISIBILITY ENABLED", text: "Guild compatibility and member comparisons are now available." },
    ],
  },
  {
    id: "guild_raid", arc: "guild", number: "DAY 52", title: "THE GUILD RAID", tagline: "Your routine must hold when other people rely on it.", scene: "gate", xp: 270, coins: 135,
    requirements: [requirement("day", 52), requirement("dailyDays", 32), requirement("focusDays", 8), requirement("guildJoined", 1), requirement("weeklyWins", 5)], unlocks: ["Guild Quests", "Guild Raids", "NPC Co-op Dungeons"],
    scenes: [
      { speaker: "system", kind: "system", alert: "CO-OP GATE ASSIGNED", text: "Individual inconsistency now affects a team objective." },
      { speaker: "chairman", text: "Reliability is rarer than talent. That is why guilds recruit for both." },
      { speaker: "rival", text: "Do not slow us down." },
      { speaker: "shadow", scene: "shadow", text: "You spent fifty days learning how to return. Use it." },
    ],
  },
  {
    id: "architect_intro", arc: "architect", number: "DAY 53", title: "THE ARCHITECT", tagline: "You were never using the System alone.", scene: "architect", xp: 290, coins: 145,
    requirements: [requirement("day", 53), requirement("dailyDays", 33), requirement("energyDays", 18), requirement("disciplineDays", 18), requirement("bosses", 2)], unlocks: ["Architect Encounter", "System Glitches", "Hidden Quests"],
    scenes: [
      { speaker: "system", kind: "system", alert: "SESSION AUTHORITY LOST", text: "Unregistered controller has assumed command." },
      { speaker: "architect", text: "Do not be afraid. Fear would contaminate the data." },
      { speaker: "architect", text: "You believed the Daily Quests were the curriculum. They were the entrance examination." },
      { speaker: "system", scene: "system", kind: "system", alert: "AUTHORITY RESTORED", text: "A hidden discipline trial has been attached to the campaign." },
    ],
  },
  {
    id: "architect_trial", arc: "architect", number: "DAY 59", title: "THE DISCIPLINE TRIAL", tagline: "The System attempts to prove your growth was temporary.", scene: "architect-two", xp: 330, coins: 165,
    requirements: [requirement("day", 59), requirement("dailyDays", 36), requirement("trainingDays", 12), requirement("focusDays", 10), requirement("weeklyWins", 6), requirement("rankStability", 60), requirement("reevaluations", 1)], unlocks: ["Advanced Penalties", "Advanced Rewards", "Secret Encounter"],
    scenes: [
      { speaker: "architect", text: "One missed cycle becomes two. Two become an identity. Show me where the chain breaks." },
      { speaker: "system", scene: "penalty", kind: "system", alert: "DISCIPLINE TRIAL", text: "Complete the required work without sacrificing sleep, food, or safe recovery." },
      { speaker: "shadow", scene: "shadow", text: "It thinks pressure belongs to it. You have been practicing under pressure for fifty-nine days." },
      { speaker: "architect", text: "Interesting. The Player returns without needing to be rescued." },
    ],
  },
  {
    id: "monarch_candidate", arc: "monarch", number: "DAY 60", title: "MONARCH CANDIDATE", tagline: "The first campaign was only the entrance examination.", scene: "army", xp: 400, coins: 200,
    requirements: [requirement("day", 60), requirement("dailyDays", 37), requirement("energyDays", 20), requirement("disciplineDays", 20), requirement("trainingDays", 13), requirement("focusDays", 10), requirement("gates", 4), requirement("bosses", 2), requirement("weeklyWins", 7), requirement("rankStability", 65)], unlocks: ["Monarch Candidate Trial", "Ascension", "Realm Gates", "World Bosses"],
    scenes: [
      { speaker: "system", kind: "system", alert: "SIXTY-DAY RECORD VERIFIED", text: "Time, quest, and performance conditions have converged." },
      { speaker: "architect", scene: "architect-two", text: "I built a System to create a vessel. You used it to create a successor." },
      { speaker: "commander", scene: "army", text: "The army is ready. The world beyond this gate is not a tutorial." },
      { speaker: "shadow", scene: "shadow", text: "Day sixty is not the ending. It is the first day you are dangerous on purpose." },
    ],
  },
  {
    id: "infinite_ascension", arc: "monarch", number: "DAY 60+", title: "INFINITE ASCENSION", tagline: "There is no final level. That is the point.", scene: "army", xp: 450, coins: 225,
    requirements: [requirement("day", 60), requirement("pathChosen", 1)], unlocks: ["Legendary Titles", "Advanced Shadow Army", "Infinite Progression Loop"],
    scenes: [
      { speaker: "system", kind: "system", alert: "CAMPAIGN LIMIT REMOVED", text: "World tiers, Realm Gates, World Bosses, and seasonal trials are now active." },
      { speaker: "commander", text: "Give the next impossible thing a name." },
      { speaker: "shadow", scene: "shadow", text: "You are not finished. You became the person who does not need an ending." },
    ],
  },
];

/* V4: seven sagas and twenty-three anime arcs. The first major saga reaches
   Day 60; Monarch awakening is not available until Day 211-240. */
const ARC_BLUEPRINTS = [
  {
    id:"weakest_hunter", saga:"SAGA 1 - AWAKENING", start:1, end:3, color:"#57d9ff", scene:"meadow",
    title:"THE WEAKEST HUNTER ARC", purpose:"Begin honestly: low-rank, underdeveloped, and not yet powerful.",
    requirements:[requirement("day",1),requirement("evaluationDone",1)], unlocks:["Hunter Profile","XP Bar","Basic Stats","System Log"],
    intro:"Evaluation complete. Present capability is low. Growth potential remains unclassified.",
    middle:"The Association sees another beginner. The System sees a curve that has not been tested.",
    ending:"No power has been granted. The right to begin has been recognized.",
  },
  {
    id:"evaluation_incident", saga:"SAGA 1 - AWAKENING", start:4, end:7, color:"#67e4ff", scene:"gate", pathChoice:true,
    title:"EVALUATION INCIDENT ARC", purpose:"An abnormal evaluation causes the System to notice the Player.",
    requirements:[requirement("day",4),requirement("evaluationDone",1)], unlocks:["Player Selection","Path Choice","First Daily Quest","Penalty Warning"],
    intro:"An unregistered signal has entered the evaluation chamber. Ordinary rank logic is no longer sufficient.",
    middle:"Speed / Athleticism is recommended from your goals. Recommendation is not command.",
    ending:"The Player has chosen a direction. The System will now demand proof.",
  },
  {
    id:"daily_survival", saga:"SAGA 1 - AWAKENING", start:8, end:14, color:"#62d7b0", scene:"penalty",
    title:"DAILY QUEST SURVIVAL ARC", purpose:"Learn that discipline is survival, not decoration.",
    requirements:[requirement("day",8),requirement("dailyDays",2),requirement("disciplineDays",1)], unlocks:["Daily Quest Chain","XP Gain / Loss","Recovery Quests","Side Quests","Free-Time Rewards"],
    intro:"Mandatory objectives have arrived. Intention will produce no experience.",
    middle:"A missed day is not defeat. Refusing to return is the failure condition.",
    ending:"The first chain holds. Small work has become repeatable authority.",
  },
  {
    id:"first_gate", saga:"SAGA 2 - LOW-RANK GATE", start:15, end:21, color:"#4db8ff", scene:"gate",
    title:"FIRST GATE ARC", purpose:"Open the first real-life Gate and clear its rooms in sequence.",
    requirements:[requirement("day",15),requirement("dailyDays",5),requirement("energyDays",1),requirement("trainingDays",2),requirement("focusDays",1),requirement("weeklyWins",1)], unlocks:["Dungeon Gates","Dungeon Rooms","Gate Rewards","Boss Room Preview"],
    intro:"A low-rank Gate has formed around unfinished real-world objectives.",
    middle:"Prepare, execute, recover, record. Every room protects the next one.",
    ending:"The first Gate is no longer theory. Boss-room signals have appeared beyond it.",
  },
  {
    id:"first_boss", saga:"SAGA 2 - LOW-RANK GATE", start:22, end:28, color:"#ff856b", scene:"shadow",
    title:"FIRST BOSS RAID ARC", purpose:"Convert real training, focus, and project work into Boss damage.",
    requirements:[requirement("day",22),requirement("dailyDays",9),requirement("gates",1),requirement("weeklyWins",1)], unlocks:["Boss HP","Quest Damage","Raid Rewards","Shadow Candidate Hint"],
    intro:"A major hostility has been bound to a multi-day real-life objective.",
    middle:"One burst will not clear this room. Accumulated damage is still damage.",
    ending:"The Boss falls. Its shadow remains standing for one impossible second.",
  },
  {
    id:"penalty_zone", saga:"SAGA 2 - LOW-RANK GATE", start:29, end:35, color:"#ff476b", scene:"penalty",
    title:"PENALTY ZONE ARC", purpose:"Learn to recover when consistency breaks under pressure.",
    requirements:[requirement("day",29),requirement("dailyDays",13),requirement("energyDays",4),requirement("bosses",1),requirement("weeklyWins",2),requirement("rankStability",52)], unlocks:["Dungeon Breaks","XP Debt","Recovery Protocols","Rival Pressure"],
    intro:"A required objective expired. Rank stability has fallen and the System voice has changed.",
    middle:"Safe consequences only: XP debt, delayed access, rival movement, and a recovery route.",
    ending:"The Player returns without cruelty, excuses, or a dramatic restart.",
  },
  {
    id:"class_path", saga:"SAGA 3 - JOB CHANGE", start:36, end:42, color:"#f5c66b", scene:"job", pathChoice:true,
    title:"CLASS PATH ARC", purpose:"Confirm the work you are willing to repeat before Job Change.",
    requirements:[requirement("day",36),requirement("dailyDays",18),requirement("trainingDays",6),requirement("energyDays",7),requirement("disciplineDays",8),requirement("weeklyWins",3)], unlocks:["Path Confirmation","Routine Timeline","Advanced Energy Scanner","Stat Allocation"],
    intro:"Thirty-five days of behavior have generated a specialization profile.",
    middle:"Choose the evidence you want to keep creating. The System will not choose for you.",
    ending:"A Class path is registered. The title remains sealed until the trial is complete.",
  },
  {
    id:"job_change", saga:"SAGA 3 - JOB CHANGE", start:43, end:50, color:"#b98cff", scene:"job",
    title:"JOB CHANGE QUEST ARC", purpose:"Survive a cinematic multi-day evolution trial.",
    requirements:[requirement("day",43),requirement("pathChosen",1),requirement("dailyDays",23),requirement("focusDays",6),requirement("bosses",1),requirement("weeklyWins",4)], unlocks:["Class Abilities","Special Title","Stronger Shop","Class Quests"],
    intro:"Job Change Quest accepted. Seven days of behavior will decide whether the Class is real.",
    middle:"Motivation is falling. Routine integrity must carry the remaining load.",
    ending:"Class evolution authorized. The title finally has evidence beneath it.",
  },
  {
    id:"shadow_awakening", saga:"SAGA 3 - JOB CHANGE", start:51, end:60, color:"#8f6bff", scene:"army",
    title:"SHADOW AWAKENING ARC", purpose:"Earn the first true Shadow Extraction authority.",
    requirements:[requirement("day",51),requirement("dailyDays",28),requirement("energyDays",12),requirement("trainingDays",9),requirement("focusDays",7),requirement("bosses",1),requirement("weeklyWins",5)], unlocks:["Shadow Candidates","Extraction Attempts","Shadow Army","Shadow Assignment","Shadow-Self Scenes"],
    intro:"Defeated obstacles are leaving recoverable residue. Extraction authority is responding.",
    middle:"A Shadow is not a trophy. It is proof converted into infrastructure.",
    ending:"Day sixty closes the Awakening Saga. The real Hunter world has finally noticed you.",
  },
  {
    id:"guild_recruitment", saga:"SAGA 4 - GUILD AND RIVAL", start:61, end:75, color:"#6ba8ff", scene:"meadow",
    title:"GUILD RECRUITMENT ARC", purpose:"Enter the higher Hunter world and become publicly measurable.",
    requirements:[requirement("day",61),requirement("dailyDays",35),requirement("shadows",1),requirement("gates",3),requirement("weeklyWins",6)], unlocks:["Guild Recruitment","Other Guilds","Member Rankings","Guild Quests","NPC Dialogue"],
    intro:"Guild observers have requested the Player file. The results are no longer private.",
    middle:"Reliability is rarer than talent. Recruitment chance now reflects both.",
    ending:"A place in the higher Hunter world has opened. It is not permanent.",
  },
  {
    id:"rival_hunter", saga:"SAGA 4 - GUILD AND RIVAL", start:76, end:90, color:"#ae7cff", scene:"meadow",
    title:"RIVAL HUNTER ARC", purpose:"Face rivals who continue progressing when the Player drifts.",
    requirements:[requirement("day",76),requirement("dailyDays",44),requirement("guildJoined",1),requirement("focusDays",10),requirement("weeklyWins",8),requirement("rankStability",58)], unlocks:["Weekly Rank Battles","Guild Standing","Challenge Dungeons","Rival Commentary"],
    intro:"Hunter Kael has passed your recorded output. The ranking was not waiting for you.",
    middle:"Competition is information. Envy produces no stat growth.",
    ending:"The rival gap closes because the Player returned, not because the rival slowed down.",
  },
  {
    id:"red_gate", saga:"SAGA 4 - GUILD AND RIVAL", start:91, end:105, color:"#ff3c57", scene:"gate",
    title:"RED GATE ARC", purpose:"Survive a stricter discipline Gate with serious energy requirements.",
    requirements:[requirement("day",91),requirement("dailyDays",53),requirement("trainingDays",16),requirement("energyDays",24),requirement("gates",4),requirement("bosses",2),requirement("weeklyWins",10),requirement("rankStability",60)], unlocks:["Red Gates","Hard Dungeons","Energy Entry Rules","High-Risk Rewards"],
    intro:"The Gate turns red. Exit conditions have disappeared and fatigue data is now part of entry clearance.",
    middle:"Power without recovery is rejected. Recklessness will not impersonate courage.",
    ending:"The Red Gate opens from the inside. Something in the System notices how.",
  },
  {
    id:"system_glitch", saga:"SAGA 5 - ARCHITECT", start:106, end:120, color:"#ff647f", scene:"system",
    title:"SYSTEM GLITCH ARC", purpose:"Discover that the System is behaving outside its own rules.",
    requirements:[requirement("day",106),requirement("dailyDays",62),requirement("disciplineDays",35),requirement("weeklyWins",12),requirement("rankStability",62)], unlocks:["Glitch Notifications","Abnormal Quests","Hidden Messages","Architect Hints"],
    intro:"Notification authority conflict. A message appeared before the System generated it.",
    middle:"The errors form a pattern. Someone is watching through the interface.",
    ending:"A coordinate is embedded inside the final glitch. It points to a secret dungeon.",
  },
  {
    id:"architect_encounter", saga:"SAGA 5 - ARCHITECT", start:121, end:135, color:"#ff476b", scene:"architect",
    title:"ARCHITECT ENCOUNTER ARC", purpose:"Meet the hidden controller behind the first layer of the System.",
    requirements:[requirement("day",121),requirement("dailyDays",70),requirement("gates",6),requirement("bosses",3),requirement("reevaluations",1),requirement("weeklyWins",14)], unlocks:["Architect Phase 1","Secret Dungeon","System Truth Hints","Special Trial"],
    intro:"Session authority lost. An unregistered controller has assumed command.",
    middle:"You believed the quests were the curriculum. They were the entrance examination.",
    ending:"The Architect withdraws. A second face remains sealed behind the interface.",
  },
  {
    id:"architect_reveal", saga:"SAGA 5 - ARCHITECT", start:136, end:150, color:"#d63cff", scene:"architect-two",
    title:"ARCHITECT REVEAL ARC", purpose:"Uncover the deeper purpose of the System and the Irregular path.",
    requirements:[requirement("day",136),requirement("dailyDays",79),requirement("focusDays",20),requirement("bosses",4),requirement("weeklyWins",16),requirement("rankStability",65)], unlocks:["Architect Phase 2","Irregular Path Hint","Hidden Class Route","Major Boss Sequence"],
    intro:"Core memory unsealed. The System was not created to make life convenient.",
    middle:"It was built to test whether impossible authority could be carried without collapse.",
    ending:"The locked path no longer has a stable classification. The next choice is yours.",
  },
  {
    id:"national_trial", saga:"SAGA 6 - MONARCH CANDIDATE", start:151, end:180, color:"#f5b65d", scene:"gate",
    title:"NATIONAL-LEVEL TRIAL ARC", purpose:"Prove long-term discipline against elite Hunters and serious raids.",
    requirements:[requirement("day",151),requirement("dailyDays",88),requirement("energyDays",40),requirement("trainingDays",28),requirement("gates",8),requirement("bosses",5),requirement("weeklyWins",18),requirement("rankStability",67)], unlocks:["National-Level Gates","Elite NPCs","Advanced Recruitment","High-Rank Rewards"],
    intro:"National-Level clearance is not a rank reward. It is a thirty-day reliability trial.",
    middle:"Elite Hunters are stronger. The Player's advantage is a system of return.",
    ending:"National authority recognizes the record. Monarch eligibility remains unconfirmed.",
  },
  {
    id:"monarch_candidate", saga:"SAGA 6 - MONARCH CANDIDATE", start:181, end:210, color:"#a55cff", scene:"army",
    title:"MONARCH CANDIDATE ARC", purpose:"Become eligible for Monarch authority through sustained proof.",
    requirements:[requirement("day",181),requirement("dailyDays",105),requirement("energyDays",50),requirement("disciplineDays",55),requirement("trainingDays",36),requirement("focusDays",30),requirement("bosses",7),requirement("shadows",3),requirement("weeklyWins",22),requirement("rankStability",70)], unlocks:["Monarch Candidacy","Realm Gate Preview","Advanced Shadow Command","Candidate Trial"],
    intro:"The System has detected a possible successor. Eligibility is not awakening.",
    middle:"Authority grows heavier as it grows larger. The army now measures its commander.",
    ending:"Candidate status confirmed. The final thirty-day transformation trial begins.",
  },
  {
    id:"monarch_awakening", saga:"SAGA 6 - MONARCH CANDIDATE", start:211, end:240, color:"#7f3cff", scene:"monarch",
    title:"MONARCH AWAKENING ARC", purpose:"Earn the major cinematic transformation after eight real months.",
    requirements:[requirement("day",211),requirement("dailyDays",122),requirement("energyDays",60),requirement("disciplineDays",65),requirement("trainingDays",44),requirement("focusDays",36),requirement("bosses",9),requirement("shadows",5),requirement("weeklyWins",26),requirement("rankStability",75)], unlocks:["Monarch Trial","Shadow Lightning","Class Evolution","Endgame Gates","New System Layer"],
    intro:"Monarch Trial initialized. Every previous arc is being evaluated at once.",
    middle:"The strongest animation in the System cannot hide an unstable foundation.",
    ending:"MONARCH AUTHORITY CONFIRMED. The world advances several years inside the story layer.",
  },
  {
    id:"years_later", saga:"SAGA 7 - TIMESKIP / HEIR", start:241, end:255, color:"#d5b3ff", scene:"army", timeskip:true,
    title:"YEARS LATER ARC", purpose:"Enter a fictional anime timeskip while preserving all real-world data.",
    requirements:[requirement("day",241),requirement("dailyDays",138),requirement("weeklyWins",30),requirement("rankStability",75)], unlocks:["Timeskip Cinematic","Evolved System Skin","Older World State","Advanced Missions"],
    intro:"YEARS LATER... The story world has changed. Your real profile, age, and data have not.",
    middle:"Old Shadows now command legions. Guilds speak to the Player as an authority.",
    ending:"A new evaluation signal appears. It does not belong to the Monarch.",
  },
  {
    id:"heir_awakening", saga:"SAGA 7 - TIMESKIP / HEIR", start:256, end:270, color:"#f5c66b", scene:"meadow", heir:true,
    title:"HEIR AWAKENING ARC", purpose:"Guide a fictional successor as a mentor and Monarch.",
    requirements:[requirement("day",256),requirement("dailyDays",146),requirement("energyDays",68),requirement("disciplineDays",75),requirement("shadows",6),requirement("weeklyWins",32)], unlocks:["Heir Profile","Heir Evaluation","Mentor Missions","Separate Heir Stats"],
    intro:"A next-generation candidate has awakened in the future story layer.",
    middle:"Do not give him your power. Teach him the process that made it stable.",
    ending:"The Heir completes his first evaluation. Mentorship authority is active.",
  },
  {
    id:"successor_system", saga:"SAGA 7 - TIMESKIP / HEIR", start:271, end:285, color:"#ffd879", scene:"system", heir:true,
    title:"SUCCESSOR SYSTEM ARC", purpose:"Pass a disciplined version of the System to the Heir.",
    requirements:[requirement("day",271),requirement("dailyDays",154),requirement("focusDays",44),requirement("shadows",7),requirement("weeklyWins",34),requirement("rankStability",77)], unlocks:["Heir System","Inherited Quests","Companion Missions","Dual Progression"],
    intro:"Successor System architecture is ready. Inheritance rules require mentor approval.",
    middle:"The Heir receives quests, not outcomes. Guidance cannot replace his work.",
    ending:"Two progression records now move together without becoming the same record.",
  },
  {
    id:"new_generation", saga:"SAGA 7 - TIMESKIP / HEIR", start:286, end:315, color:"#68dfff", scene:"gate", heir:true,
    title:"NEW GENERATION GATE ARC", purpose:"Face new threats through mentor-and-heir co-op missions.",
    requirements:[requirement("day",286),requirement("dailyDays",162),requirement("gates",12),requirement("bosses",12),requirement("weeklyWins",36),requirement("rankStability",78)], unlocks:["New Gate Types","New Bosses","Evolved Shadows","Heir Co-op Missions"],
    intro:"Unknown Gates are opening for the new generation. Old clearance rules no longer apply.",
    middle:"The Monarch can clear the room alone. The mentor must teach someone else to survive it.",
    ending:"The Heir opens a Gate the old System could not detect.",
  },
  {
    id:"monarch_legacy", saga:"SAGA 7 - TIMESKIP / HEIR", start:316, end:99999, color:"#b86cff", scene:"army", heir:true,
    title:"MONARCH LEGACY ARC", purpose:"Maintain power, guide the next generation, and enter infinite legacy progression.",
    requirements:[requirement("day",316),requirement("dailyDays",180),requirement("trainingDays",65),requirement("focusDays",55),requirement("shadows",10),requirement("weeklyWins",40),requirement("rankStability",80)], unlocks:["Legacy Quests","World Boss Raids","Higher-Dimensional Gates","Infinite Heir Growth"],
    intro:"The Monarch is powerful enough to win. The remaining trial is what that power creates.",
    middle:"Responsibility is the final difficulty modifier. The next generation is watching the pattern.",
    ending:"No final level exists. The legacy continues for as long as the Player returns.",
  },
];

const ARCS = ARC_BLUEPRINTS.map(function(arc){
  return { id:arc.id, saga:arc.saga, name:arc.title, start:arc.start, end:arc.end, color:arc.color, line:arc.purpose, purpose:arc.purpose, unlocks:arc.unlocks, requirements:arc.requirements };
});

const FEATURE_GATES = {
  "Dashboard":{day:1}, "Story Mode":{day:1}, "Daily Quest":{day:1}, "Hunter Profile":{day:1}, "Hunter Stats":{day:1}, "System Log":{day:1}, "Settings":{day:1},
  "Side Quests":{day:8,chapter:"evaluation_incident"}, "Discipline":{day:8,chapter:"evaluation_incident"}, "Energy":{day:8,chapter:"evaluation_incident"},
  "Inventory":{day:15,chapter:"daily_survival"}, "Hunter Shop":{day:15,chapter:"daily_survival"}, "Gate Map":{day:15,chapter:"daily_survival"}, "Dungeon Gates":{day:15,chapter:"daily_survival"},
  "Boss Raids":{day:22,chapter:"first_gate"}, "Specialization":{day:36,chapter:"class_path"}, "Shadow Army":{day:51,chapter:"job_change"},
  "Guild":{day:61,chapter:"shadow_awakening"}, "Rankings":{day:61,chapter:"shadow_awakening"}, "World Feed":{day:61,chapter:"shadow_awakening"},
  "Secret Encounters":{day:106,chapter:"red_gate"},
};

const CHAPTERS = ARC_BLUEPRINTS.map(function(arc,index){
  const scenes = [
    { speaker:"system", scene:arc.scene, kind:"system", alert:index === 0 ? "CAMPAIGN SYNCHRONIZED" : arc.title, text:arc.intro },
    { speaker:arc.heir ? "heir" : index % 4 === 0 ? "shadow" : index % 3 === 0 ? "coach" : index % 2 === 0 ? "rival" : "narrator", scene:arc.scene, text:arc.middle },
  ];
  if (arc.pathChoice) scenes.push({ speaker:"system", scene:"system", kind:"path", text:"Select the path you will prove through repeated action." });
  if (arc.timeskip) scenes.push({ speaker:"narrator", scene:"army", kind:"system", alert:"YEARS LATER...", text:"The timeskip affects only the fictional story world. Real-world identity data remains unchanged." });
  scenes.push({ speaker:arc.heir ? "heir" : arc.scene.indexOf("architect") === 0 ? "architect" : "system", scene:arc.scene, kind:"system", alert:"ARC CLEAR CONDITION MET", text:arc.ending });
  return {
    id:arc.id, arc:arc.id, saga:arc.saga, start:arc.start, end:arc.end, number:arc.end > 9000 ? "DAY "+arc.start+"+" : "DAYS "+arc.start+"-"+arc.end,
    title:arc.title, tagline:arc.purpose, scene:arc.scene, xp:60+index*35, coins:30+index*18,
    requirements:arc.requirements, unlocks:arc.unlocks, consequence:"Arc pauses; XP and rank stability may fall; Recovery Quest required.", scenes,
  };
});

function pad(value) { return String(value).padStart(2, "0"); }

function xpForLevel(level) {
  const l = (typeof level === "number" && isFinite(level) && level >= 1) ? level : 1;
  return 100 + (l - 1) * 50;
}

function localDayKey(date = new Date()) {
  return date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate());
}

function keyToUtc(key) {
  const parts = String(key || "").split("-").map(Number);
  if (parts.length !== 3 || parts.some((v) => !Number.isFinite(v))) return Date.now();
  return Date.UTC(parts[0], parts[1] - 1, parts[2]);
}

function shiftDayKey(key, amount) {
  const date = new Date(keyToUtc(key) + amount * DAY_MS);
  return date.getUTCFullYear() + "-" + pad(date.getUTCMonth() + 1) + "-" + pad(date.getUTCDate());
}

function campaignDayFrom(state, today = localDayKey()) {
  return Math.max(1, Math.floor((keyToUtc(today) - keyToUtc(state.startedOn)) / DAY_MS) + 1);
}

const LEGACY_CHAPTER_TO_ARC = {
  prologue:"weakest_hunter", low_rank:"weakest_hunter", incident:"evaluation_incident", player:"evaluation_incident", path:"evaluation_incident",
  training:"daily_survival", penalty:"daily_survival", first_gate:"first_gate", shadow_self:"first_boss", job_change:"job_change",
  architect_one:"architect_encounter", army:"shadow_awakening", higher_world:"guild_recruitment", truth:"architect_reveal", infinite:"monarch_awakening",
  selection:"weakest_hunter", player_selection:"evaluation_incident", first_mandate:"daily_survival", first_awakening:"daily_survival",
  energy_scanner:"daily_survival", low_rank_proof:"daily_survival", dungeon_threshold:"first_gate", boss_signal:"first_boss",
  first_boss_clear:"first_boss", job_preparation:"penalty_zone", path_confirmation:"class_path", job_change_start:"job_change",
  job_change_trial:"job_change", class_evolution:"job_change", shadow_command:"shadow_awakening", shadow_legion:"shadow_awakening",
  guild_rising:"guild_recruitment", guild_raid:"rival_hunter", architect_intro:"architect_encounter", architect_trial:"architect_reveal",
  infinite_ascension:"monarch_awakening",
};

function mapLegacyCompleted(ids) {
  const mapped = (Array.isArray(ids) ? ids : []).map((id) => LEGACY_CHAPTER_TO_ARC[id] || (CHAPTERS.some((chapter) => chapter.id === id) ? id : null)).filter(Boolean);
  if (!mapped.length) return [];
  const highest = Math.max.apply(null, mapped.map((id) => CHAPTERS.findIndex((chapter) => chapter.id === id)));
  return CHAPTERS.slice(0, highest + 1).map((chapter) => chapter.id);
}

function creditsForDay(day, streak) {
  const elapsed = Math.max(0, day - 1);
  return {
    dailyDays: Math.max(Number(streak) || 0, Math.floor(elapsed * .60)),
    energyDays: Math.floor(elapsed * .25),
    disciplineDays: Math.floor(elapsed * .31),
    trainingDays: Math.floor(elapsed * .19),
    focusDays: Math.floor(elapsed * .145),
    weeklyWins: Math.floor(elapsed / 9),
    rankStability: day >= 211 ? 75 : day >= 151 ? 70 : day >= 91 ? 65 : day >= 36 ? 60 : 54,
  };
}

function createStoryState(legacy, options) {
  const today = localDayKey();
  const completed = mapLegacyCompleted(legacy && (legacy.completed || legacy.legacyChapters));
  const highest = completed.length ? CHAPTERS.find((chapter) => chapter.id === completed[completed.length - 1]) : null;
  const inferredFloor = highest ? Math.min(316, highest.end > 9000 ? highest.start : highest.end + 1) : 1;
  const isNewGame = Boolean(options && options.newGame);
  const inferredStart = shiftDayKey(today, -(Math.max(1, inferredFloor) - 1));
  const preservedStart = legacy && typeof legacy.startedOn === "string" && legacy.startedOn < inferredStart ? legacy.startedOn : inferredStart;
  return {
    version: 4,
    startedOn: isNewGame ? today : preservedStart,
    trackingStartedOn: legacy && typeof legacy.trackingStartedOn === "string" ? legacy.trackingStartedOn : today,
    lastSeenOn: legacy && typeof legacy.lastSeenOn === "string" ? legacy.lastSeenOn : today,
    completed: isNewGame ? [] : completed,
    path: legacy && typeof legacy.path === "string" ? legacy.path : null,
    flags: legacy && legacy.flags && typeof legacy.flags === "object" ? legacy.flags : {},
    choices: legacy && legacy.choices && typeof legacy.choices === "object" ? legacy.choices : {},
    ledger: legacy && legacy.ledger && typeof legacy.ledger === "object" ? legacy.ledger : {},
    penaltiesApplied: legacy && Array.isArray(legacy.penaltiesApplied) ? legacy.penaltiesApplied : [],
    legacyChapters: legacy && Array.isArray(legacy.completed) ? legacy.completed : [],
    legacyCredits: isNewGame ? {} : legacy && legacy.legacyCredits && typeof legacy.legacyCredits === "object" ? legacy.legacyCredits : creditsForDay(inferredFloor, 0),
    migration: {
      source: isNewGame ? "new_game" : legacy ? "legacy_story" : "new",
      inferenceApplied: isNewGame,
      noticeSeen: isNewGame || !legacy,
      migratedAt: legacy ? Date.now() : null,
      graceUntil: legacy ? shiftDayKey(today, 1) : today,
    },
    heir: legacy && legacy.heir && typeof legacy.heir === "object" ? legacy.heir : { name:"The Heir", level:1, xp:0, bond:0, stats:{ Discipline:8, Agility:8, Focus:8, Recovery:8 }, lastTrainedOn:null },
  };
}

function normaliseStoryState(raw) {
  if (!raw || raw.version !== 4 || typeof raw.startedOn !== "string") return createStoryState(raw);
  return {
    version: 4,
    startedOn: raw.startedOn,
    trackingStartedOn: typeof raw.trackingStartedOn === "string" ? raw.trackingStartedOn : raw.startedOn,
    lastSeenOn: typeof raw.lastSeenOn === "string" ? raw.lastSeenOn : raw.startedOn,
    completed: Array.isArray(raw.completed) ? raw.completed.filter((id) => CHAPTERS.some((chapter) => chapter.id === id)) : [],
    path: typeof raw.path === "string" ? raw.path : null,
    flags: raw.flags && typeof raw.flags === "object" ? raw.flags : {},
    choices: raw.choices && typeof raw.choices === "object" ? raw.choices : {},
    ledger: raw.ledger && typeof raw.ledger === "object" ? raw.ledger : {},
    penaltiesApplied: Array.isArray(raw.penaltiesApplied) ? raw.penaltiesApplied : [],
    legacyChapters: Array.isArray(raw.legacyChapters) ? raw.legacyChapters : [],
    legacyCredits: raw.legacyCredits && typeof raw.legacyCredits === "object" ? raw.legacyCredits : {},
    migration: raw.migration && typeof raw.migration === "object" ? raw.migration : { source:"v4", inferenceApplied:true, noticeSeen:true, migratedAt:null, graceUntil:raw.startedOn },
    heir: raw.heir && typeof raw.heir === "object" ? raw.heir : { name:"The Heir", level:1, xp:0, bond:0, stats:{ Discipline:8, Agility:8, Focus:8, Recovery:8 }, lastTrainedOn:null },
  };
}

function loadState() {
  try {
    if (localStorage.getItem(STORY_NEW_GAME_MARKER) === "1") {
      localStorage.removeItem(STORY_NEW_GAME_MARKER);
      return createStoryState(null, { newGame:true });
    }
    const current = JSON.parse(localStorage.getItem(STORY_KEY) || "null");
    if (current) return normaliseStoryState(current);
    const legacyV3Raw = localStorage.getItem(LEGACY_STORY_V3_KEY);
    const legacyV2Raw = localStorage.getItem(LEGACY_STORY_KEY);
    const legacyRaw = legacyV3Raw || legacyV2Raw;
    const legacy = JSON.parse(legacyRaw || "null");
    if (legacyRaw && !localStorage.getItem(STORY_BACKUP_KEY)) {
      localStorage.setItem(STORY_BACKUP_KEY, JSON.stringify({ backedUpAt:Date.now(), source:legacyV3Raw ? LEGACY_STORY_V3_KEY : LEGACY_STORY_KEY, raw:legacyRaw }));
    }
    return createStoryState(legacy);
  } catch (_) {
    return createStoryState(null);
  }
}

function saveState(state) {
  try { localStorage.setItem(STORY_KEY, JSON.stringify(state)); } catch (_) {}
}

function getArc(day) {
  return ARCS.find((arc) => day >= arc.start && day <= arc.end) || ARCS[ARCS.length - 1];
}

function buildFeatureAccess(state, day) {
  const access = {};
  Object.keys(FEATURE_GATES).forEach((view) => {
    const gate = FEATURE_GATES[view];
    const timeMet = day >= gate.day;
    const chapterMet = !gate.chapter || state.completed.includes(gate.chapter);
    access[view] = {
      unlocked: timeMet && chapterMet,
      day: gate.day,
      reason: !timeMet ? "Unlocks on Day " + gate.day : chapterMet ? "Available" : "Complete the required Story chapter",
    };
  });
  return access;
}

export function getStoryCampaignSnapshot(stateOverride, evidence) {
  let state = normaliseStoryState(stateOverride || loadState());
  if (evidence) state = inferPlacement(state, evidence);
  const day = campaignDayFrom(state);
  const featureAccess = buildFeatureAccess(state, day);
  const nextFeature = Object.keys(featureAccess)
    .filter((view) => !featureAccess[view].unlocked)
    .sort((a, b) => featureAccess[a].day - featureAccess[b].day)[0] || null;
  return { state, day, arc: getArc(day), featureAccess, nextFeature };
}

function inferPlacement(state, evidence) {
  if (state.migration && state.migration.inferenceApplied) return state;
  const today = localDayKey();
  const hasPriorSave = Boolean(evidence.previousSaveDetected || state.migration?.source === "legacy_story");
  let floor = hasPriorSave ? 4 : 1;
  const level = Number(evidence.level) || 1;
  if (hasPriorSave && (evidence.dailyDone || Number(evidence.streak) > 0 || level >= 5)) floor = Math.max(floor, 8);
  if (hasPriorSave && (evidence.gates > 0 || level >= 12)) floor = Math.max(floor, 15);
  if (hasPriorSave && (evidence.bosses > 0 || level >= 22)) floor = Math.max(floor, 22);
  if (hasPriorSave && level >= 34) floor = Math.max(floor, 36);
  if (evidence.shadows > 0) floor = Math.max(floor, 51);
  if (evidence.guildJoined) floor = Math.max(floor, 61);
  if (evidence.isMonarch) floor = Math.max(floor, 211);

  const existingDay = campaignDayFrom(state, today);
  floor = Math.max(floor, Math.min(existingDay, 316));
  const completed = new Set(state.completed || []);
  CHAPTERS.forEach((chapter) => {
    if (chapter.end < floor) completed.add(chapter.id);
  });
  const inferredCredits = creditsForDay(floor, evidence.streak);
  const existingCredits = state.legacyCredits || {};
  const credits = {};
  Object.keys(inferredCredits).forEach((key) => { credits[key] = Math.max(Number(existingCredits[key]) || 0, inferredCredits[key]); });
  const inferredStart = shiftDayKey(today, -(floor - 1));
  return {
    ...state,
    startedOn: state.startedOn < inferredStart ? state.startedOn : inferredStart,
    trackingStartedOn: today,
    completed: CHAPTERS.filter((chapter) => completed.has(chapter.id)).map((chapter) => chapter.id),
    legacyCredits: credits,
    migration: {
      ...(state.migration || {}),
      source: hasPriorSave ? (state.migration?.source === "legacy_story" ? "legacy_story" : "inferred_save") : "new",
      inferenceApplied: true,
      noticeSeen: !hasPriorSave,
      migratedAt: hasPriorSave ? Date.now() : null,
      inferredFloor: floor,
      graceUntil: hasPriorSave ? shiftDayKey(today, 1) : today,
    },
  };
}

function countLedger(ledger, field) {
  return Object.keys(ledger || {}).filter((key) => ledger[key] && ledger[key][field]).length;
}

function buildCampaignContext(state, live) {
  const day = campaignDayFrom(state);
  const ledger = state.ledger || {};
  const credits = state.legacyCredits || {};
  const dailyDays = countLedger(ledger, "daily") + (Number(credits.dailyDays) || 0);
  const energyDays = countLedger(ledger, "energy") + (Number(credits.energyDays) || 0);
  const disciplineDays = countLedger(ledger, "discipline") + (Number(credits.disciplineDays) || 0);
  const trainingDays = countLedger(ledger, "training") + (Number(credits.trainingDays) || 0);
  const focusDays = countLedger(ledger, "focus") + (Number(credits.focusDays) || 0);
  let weeklyWins = 0;
  const completeWeeks = Math.floor(day / 7);
  for (let week = 0; week < completeWeeks; week += 1) {
    const entries = [];
    for (let offset = 0; offset < 7; offset += 1) entries.push(ledger[shiftDayKey(state.startedOn, week * 7 + offset)] || {});
    const daily = entries.filter((entry) => entry.daily).length;
    const energy = entries.filter((entry) => entry.energy).length;
    const training = entries.filter((entry) => entry.training).length;
    const focus = entries.filter((entry) => entry.focus).length;
    if (daily >= 5 && energy >= (week === 0 ? 1 : 4) && training >= 2 && focus >= 1) weeklyWins += 1;
  }
  const activeDays = Math.max(1, day);
  const dailyRate = dailyDays / activeDays;
  const energyRate = energyDays / Math.max(1, day - 6);
  const disciplineRate = disciplineDays / activeDays;
  const trainingRate = trainingDays / activeDays;
  const focusRate = focusDays / activeDays;
  const missedDays = Math.max(0, day - 1 - dailyDays);
  weeklyWins += Number(credits.weeklyWins) || 0;
  const computedStability = Math.max(0, Math.min(100, Math.round(
    42 + dailyRate * 30 + Math.min(1, energyRate) * 8 + disciplineRate * 8 + trainingRate * 6 + focusRate * 4 +
    Math.min(8, live.gates * 1.5) + Math.min(6, live.bosses * 2) - Math.min(15, missedDays * 0.2)
  )));
  const rankStability = Math.max(computedStability, Number(credits.rankStability) || 0);
  return {
    day, dailyDays, energyDays, disciplineDays, trainingDays, focusDays, weeklyWins, rankStability, missedDays,
    gates: live.gates, bosses: live.bosses, shadows: live.shadows,
    guildJoined: live.guildJoined ? 1 : 0,
    reevaluations: live.reevaluationDone ? 1 : 0,
    pathChosen: state.path ? 1 : 0,
    evaluationDone: live.evaluationDone ? 1 : 0,
  };
}

function requirementValue(req, context) {
  return Number(context[req.metric] || 0);
}

function requirementMet(req, context) {
  return requirementValue(req, context) >= req.target;
}

function getChapterStatus(chapter, index, state, context, recoveryRequired) {
  if (state.completed.includes(chapter.id)) return "complete";
  const previous = CHAPTERS[index - 1];
  const previousDone = !previous || state.completed.includes(previous.id);
  const requirementsMet = chapter.requirements.every((req) => requirementMet(req, context));
  if (recoveryRequired && chapter.id !== "weakest_hunter" && chapter.id !== "evaluation_incident") return "paused";
  return previousDone && requirementsMet ? "ready" : "locked";
}

function StoryBackdrop({ scene }) {
  const shadowCount = (scene === "army" || scene === "monarch") ? 15 : 0;
  return (
    <div className={"story-backdrop scene-" + (scene || "meadow")} aria-hidden="true">
      <div className="story-moon" /><div className="pixel-cloud cloud-a" /><div className="pixel-cloud cloud-b" />
      <div className="pixel-hills" /><div className="pixel-field" />
      <div className="gate-rift"><span /><span /><span /></div>
      <div className="architect-entity"><i className="eye left"/><i className="eye right"/><b className="teeth"/></div>
      <div className="story-silhouette main"><i /></div><div className="story-silhouette second"><i /></div>
      <div className="shadow-self-figure"><i/><b/></div>
      <div className="shadow-army">{Array.from({ length: shadowCount }).map((_, i) => <span key={i} style={{ "--i": i }}><i/><i/></span>)}</div>
      <div className="story-lightning"><i/><i/><i/><i/></div><div className="story-vignette" /><div className="story-scanlines" />
    </div>
  );
}

const STORY_STAT_KEYS = ["Strength", "Agility", "Endurance", "Discipline", "Intelligence", "Recovery", "Aura"];
const STORY_STAT_LABEL = { Strength: "STR", Agility: "AGI", Endurance: "END", Discipline: "DIS", Intelligence: "INT", Recovery: "REC", Aura: "AUR" };

function HunterStatusPanel({ player, rank, shadowArmy, guildId, day }) {
  const level = (player && typeof player.level === "number" && isFinite(player.level) && player.level >= 1) ? player.level : 1;
  const xp = (player && typeof player.xp === "number" && isFinite(player.xp) && player.xp >= 0) ? player.xp : 0;
  const xpNeeded = xpForLevel(level);
  const xpPct = Math.max(2, Math.min(100, Math.round((xp / xpNeeded) * 100)));
  const awakened = rank && typeof rank.minRankIndex === "number" && rank.minRankIndex >= 2;
  const rankColor = (rank && rank.color) || "#57d9ff";
  const shadowCount = Array.isArray(shadowArmy) ? shadowArmy.length : 0;
  const storeUnlocked = (typeof day === "number" ? day : 0) >= (FEATURE_GATES["Hunter Shop"]?.day || 0);
  const stats = (player && player.stats) || {};

  return (
    <div className="story-status-panel">
      <div className="story-status-corners" />
      <div className="story-status-head"><span>STATUS</span><b>PLAYER 001</b></div>
      <div className="story-status-divider" />
      <div className="story-status-top">
        <div className="story-status-portrait">
          <img src={awakened ? "/story/jinwoo-awakened.jpg" : "/story/jinwoo-weak.jpg"} alt="" />
          <i style={{ color: rankColor }}>{rank ? rank.name.charAt(0) : "E"}</i>
        </div>
        <div className="story-status-id">
          <span>NAME</span><b>{(player && player.name) || "HUNTER"}</b>
          <span>LEVEL</span><b>{level}</b>
          <span>CLASS</span><b style={{ color: player && player.job && player.job !== "none" ? "#8fe3ff" : "#6f8ba6" }}>{player && player.job && player.job !== "none" ? player.job.toUpperCase() : "— NONE —"}</b>
          <span>TITLE</span><b>{(rank && rank.title) || "— NONE —"}</b>
        </div>
      </div>
      <div className="story-status-xp">
        <div className="xp-label"><span>EXP</span><span>{xp} / {xpNeeded}</span></div>
        <div className="xp-track"><div className="xp-fill" style={{ width: xpPct + "%" }} /></div>
      </div>
      <div className="story-status-stats">
        {STORY_STAT_KEYS.map((key) => (
          <div key={key}><small>{STORY_STAT_LABEL[key]}</small><b>{Number(stats[key]) || 0}</b></div>
        ))}
      </div>
      <div className="story-status-locks">
        <div><span className="label">SHADOW ARMY</span><span className={shadowCount > 0 ? "open" : "sealed"}>{shadowCount > 0 ? shadowCount + " BOUND" : "[ SEALED ]"}</span></div>
        <div><span className="label">GUILD</span><span className={guildId ? "open" : "sealed"}>{guildId ? "[ JOINED ]" : "[ NONE ]"}</span></div>
        <div><span className="label">SYSTEM STORE</span><span className={storeUnlocked ? "open" : "sealed"}>{storeUnlocked ? "[ UNLOCKED ]" : "[ LOCKED ]"}</span></div>
      </div>
    </div>
  );
}

function Typewriter({ text, speed = 10, onDone }) {
  const [count, setCount] = useState(0);
  const timer = useRef(null);
  useEffect(() => {
    setCount(0);
    timer.current = setInterval(() => {
      setCount((value) => {
        if (value >= text.length) {
          clearInterval(timer.current);
          if (typeof onDone === "function") onDone();
          return value;
        }
        return Math.min(text.length, value + 2);
      });
    }, speed);
    return () => clearInterval(timer.current);
  }, [text, speed, onDone]);
  return <>{text.slice(0, count)}{count < text.length && <span className="story-cursor">|</span>}</>;
}

function PathChoices({ selected, onChoose }) {
  return (
    <div className="path-choice-grid">
      {PATHS.map((path) => (
        <button key={path.id} disabled={path.locked} onClick={() => !path.locked && onChoose(path)} className={selected === path.id ? "selected" : ""}>
          <span className="path-glyph">{path.locked ? "?" : path.id === "speed" ? ">>" : path.id.slice(0, 2).toUpperCase()}</span>
          <span className="path-copy"><strong>{path.label}</strong><small>{path.note}</small></span>
          {path.recommended && <em>RECOMMENDED</em>}{path.locked && <em>LOCKED</em>}
        </button>
      ))}
    </div>
  );
}

function ScenePlayer({ chapter, state, onState, onClose, onFinish, player, rank, shadowArmy, guildId, day }) {
  const [index, setIndex] = useState(0);
  const [typed, setTyped] = useState(false);
  const [response, setResponse] = useState("");
  const [resolved, setResolved] = useState(false);
  const scene = chapter.scenes[index];
  const speaker = SPEAKERS[scene.speaker] || SPEAKERS.system;
  const isLast = index >= chapter.scenes.length - 1;

  useEffect(() => { setTyped(false); setResponse(""); setResolved(false); }, [index]);

  function advance() {
    if (!typed || (scene.choice && !resolved) || (scene.kind === "path" && !state.path)) return;
    if (isLast) onFinish(); else setIndex((value) => value + 1);
  }

  function choose(option) {
    setResponse(option.response || "Choice recorded.");
    if (option.block) {
      setResolved(false);
      onState({ ...state, choices: { ...state.choices, [chapter.id + ":refused"]: true } });
      return;
    }
    onState({
      ...state,
      flags: option.flag ? { ...state.flags, [option.flag]: true } : state.flags,
      choices: { ...state.choices, [chapter.id]: option.id },
    });
    setResolved(true);
  }

  function choosePath(path) {
    onState({ ...state, path: path.id, choices: { ...state.choices, path: path.id } });
    setResponse(path.label + " registered. The System recommended a route; the Player made the choice.");
    setResolved(true);
  }

  return (
    <div className={"story-player " + (scene.kind === "item" ? "item-reveal" : "")}>
      <StoryBackdrop scene={scene.scene || chapter.scene} />
      <div className="story-stage-top"><button onClick={onClose}>EXIT</button><div><span>{chapter.number}</span><strong>{chapter.title}</strong></div><small>{pad(index + 1)} / {pad(chapter.scenes.length)}</small></div>
      {scene.alert && <div className="story-top-alert"><b>!</b><span><small>SYSTEM NOTIFICATION</small><strong>{scene.alert}</strong></span></div>}
      {Boolean(scene.kind) && <HunterStatusPanel player={player} rank={rank} shadowArmy={shadowArmy} guildId={guildId} day={day} />}
      {scene.kind === "item" && <div className="item-materialization"><div className="item-core">V</div><span>ACQUISITION COMPLETE</span></div>}
      <div className={"story-dialogue " + (scene.kind === "system" || scene.kind === "path" ? "system-dialogue" : "")}>
        <div className={"speaker-portrait speaker-"+scene.speaker} style={{ "--speaker": speaker.color }}><span>{scene.speaker === "architect" ? ":)" : scene.speaker === "shadow" ? "S" : "!"}</span></div>
        <div className="dialogue-copy">
          <div className="speaker-name" style={{ color: speaker.color }}>{speaker.name}</div>
          <p><Typewriter key={index} text={scene.text} onDone={() => setTyped(true)} /></p>
          {typed && scene.choice && <div className="story-choices">{scene.choice.map((option) => <button key={option.id} onClick={() => choose(option)}>{option.label}</button>)}</div>}
          {typed && scene.kind === "path" && <PathChoices selected={state.path} onChoose={choosePath} />}
          {response && <div className="choice-response">{response}</div>}
          {typed && (!scene.choice || resolved) && (scene.kind !== "path" || state.path) && <button className="story-continue" onClick={advance}>{isLast ? "COMPLETE CHAPTER" : "CONTINUE"}<span>&gt;</span></button>}
        </div>
      </div>
    </div>
  );
}

function UnlockReveal({ chapter, onClose }) {
  return (
    <div className="story-unlock-reveal">
      <div className="unlock-rings"><i/><i/><i/></div>
      <div className="unlock-card">
        <small>SYSTEM AUTHORITY EXPANDED</small><h2>{chapter.title}</h2><p>Consistent real-world effort has unlocked new System functions.</p>
        <div className="unlock-feature-list">{chapter.unlocks.map((item) => <span key={item}><b>+</b>{item}</span>)}</div>
        <div className="unlock-reward">+{chapter.xp} XP &nbsp; +{chapter.coins} GOLD</div>
        <button onClick={onClose}>ACCEPT AUTHORITY</button>
      </div>
    </div>
  );
}

export default function StoryModeView({
  player, rank, clearedGates, bosses, shadowArmy, guildId, dailyDone, dailyQuestType,
  focusDone, energyState, energyScore, disciplineState, disciplineScore, reevaluationDone,
  previousSaveDetected, isMonarch, evaluationDone, onReward, onPenalty, onCampaignChange,
}) {
  const [state, setState] = useState(loadState);
  const [playing, setPlaying] = useState(null);
  const [unlockReveal, setUnlockReveal] = useState(null);
  const [notice, setNotice] = useState(true);
  const [showDataTools, setShowDataTools] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const [backupStatus, setBackupStatus] = useState("");
  const [devArc, setDevArc] = useState(ARC_BLUEPRINTS[0].id);
  const today = localDayKey();

  const gates = Array.isArray(clearedGates) ? clearedGates.length : Object.keys(clearedGates || {}).filter((id) => Boolean(clearedGates[id])).length;
  const bossCount = (Array.isArray(bosses) ? bosses : Object.values(bosses || {})).filter((boss) => boss && (boss.defeated || Number(boss.currentHp) <= 0 || Number(boss.hp) <= 0)).length;
  const live = {
    gates,
    bosses: bossCount,
    shadows: Array.isArray(shadowArmy) ? shadowArmy.length : 0,
    guildJoined: Boolean(guildId),
    reevaluationDone: Boolean(reevaluationDone),
    evaluationDone: Boolean(evaluationDone),
  };

  useEffect(() => {
    setState((previous) => inferPlacement(previous, {
      previousSaveDetected:Boolean(previousSaveDetected), evaluationDone:Boolean(evaluationDone), isMonarch:Boolean(isMonarch),
      level:player?.level || 1, streak:player?.streak || 0, dailyDone:Boolean(dailyDone), gates, bosses:bossCount,
      shadows:live.shadows, guildJoined:live.guildJoined,
    }));
  }, [previousSaveDetected, evaluationDone, isMonarch, player?.level, player?.streak, dailyDone, gates, bossCount, live.shadows, live.guildJoined]);

  useEffect(() => saveState(state), [state]);

  useEffect(() => {
    if (typeof onCampaignChange === "function") onCampaignChange(getStoryCampaignSnapshot(state));
  }, [state, onCampaignChange]);

  useEffect(() => {
    const energyLogged = energyState && energyState.lastLoggedOn === today;
    const disciplineLogged = disciplineState && disciplineState.lastLoggedOn === today;
    setState((previous) => {
      const current = previous.ledger[today] || {};
      const nextEntry = {
        daily: Boolean(current.daily || dailyDone),
        energy: Boolean(current.energy || energyLogged),
        discipline: Boolean(current.discipline || disciplineLogged),
        training: Boolean(current.training || (dailyDone && dailyQuestType === "training")),
        focus: Boolean(current.focus || focusDone),
        energyScore: energyLogged ? Math.round(Number(energyScore) || 0) : (current.energyScore || null),
        disciplineScore: disciplineLogged ? Math.round(Number(disciplineScore) || 0) : (current.disciplineScore || null),
        gates: Math.max(Number(current.gates) || 0, gates),
        bosses: Math.max(Number(current.bosses) || 0, bossCount),
      };
      let nextHeir = previous.heir;
      if (campaignDayFrom(previous) >= 256 && previous.heir && previous.heir.lastTrainedOn !== today && (nextEntry.daily || nextEntry.energy || nextEntry.focus || nextEntry.training)) {
        const gain = (nextEntry.daily ? 20 : 0) + (nextEntry.energy ? 8 : 0) + (nextEntry.focus ? 10 : 0) + (nextEntry.training ? 12 : 0);
        const nextXp = (previous.heir.xp || 0) + gain;
        nextHeir = {
          ...previous.heir,
          xp: nextXp,
          level: Math.max(previous.heir.level || 1, Math.floor(nextXp / 100) + 1),
          bond: Math.min(100, (previous.heir.bond || 0) + (gain > 0 ? 2 : 0)),
          lastTrainedOn: today,
          stats: {
            ...(previous.heir.stats || {}),
            Discipline:(previous.heir.stats?.Discipline || 8) + (nextEntry.daily ? 1 : 0),
            Agility:(previous.heir.stats?.Agility || 8) + (nextEntry.training ? 1 : 0),
            Focus:(previous.heir.stats?.Focus || 8) + (nextEntry.focus ? 1 : 0),
            Recovery:(previous.heir.stats?.Recovery || 8) + (nextEntry.energy ? 1 : 0),
          },
        };
      }
      const unchanged = JSON.stringify(current) === JSON.stringify(nextEntry) && previous.lastSeenOn >= today && nextHeir === previous.heir;
      if (unchanged) return previous;
      return { ...previous, heir:nextHeir, lastSeenOn: previous.lastSeenOn > today ? previous.lastSeenOn : today, ledger: { ...previous.ledger, [today]: nextEntry } };
    });
  }, [today, dailyDone, dailyQuestType, focusDone, energyState, disciplineState, energyScore, disciplineScore, gates, bossCount]);

  const context = useMemo(() => buildCampaignContext(state, live), [state, gates, bossCount, live.shadows, live.guildJoined, live.reevaluationDone, live.evaluationDone]);
  const currentEntry = state.ledger[today] || {};
  const yesterday = state.ledger[shiftDayKey(today, -1)] || {};
  const graceActive = Boolean(state.migration && state.migration.graceUntil >= today);
  const yesterdayKey = shiftDayKey(today, -1);
  const recoveryRequired = context.day > 1 && yesterdayKey >= state.trackingStartedOn && !graceActive && !yesterday.daily && !(currentEntry.daily && currentEntry.energy && currentEntry.discipline);
  const clockAnomaly = today < state.lastSeenOn;

  useEffect(() => {
    const missing = [];
    for (let offset = 0; offset < Math.max(0, context.day - 1); offset += 1) {
      const key = shiftDayKey(state.startedOn, offset);
      if (key >= today) break;
      if (key < state.trackingStartedOn) continue;
      if (!(state.ledger[key] && state.ledger[key].daily) && !state.penaltiesApplied.includes(key)) missing.push(key);
    }
    if (!missing.length) return;
    setState((previous) => ({ ...previous, penaltiesApplied: Array.from(new Set(previous.penaltiesApplied.concat(missing))) }));
    if (typeof onPenalty === "function") onPenalty({ missedDays: missing.length, xpLoss: Math.min(50, missing.length * 5), bossRegen: Math.min(3, missing.length) });
  }, [state.startedOn, state.trackingStartedOn, state.ledger, state.penaltiesApplied, context.day, today, onPenalty]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(false), 4200);
    return () => clearTimeout(timer);
  }, [notice]);

  const arc = getArc(context.day);
  const completedPercent = Math.min(100, Math.round((Math.min(context.day, CAMPAIGN_DAYS) / CAMPAIGN_DAYS) * 100));
  const lastSeven = Array.from({ length: 7 }).map((_, index) => {
    const key = shiftDayKey(today, index - 6);
    return { key, entry: state.ledger[key] || {}, future: key > today, preCampaign: key < state.trackingStartedOn, current: key === today };
  });
  const chapterStatuses = CHAPTERS.map((chapter,index) => getChapterStatus(chapter,index,state,context,recoveryRequired || clockAnomaly));
  const continueIndex = chapterStatuses.findIndex((status) => status === "ready");
  const continueChapter = continueIndex >= 0 ? CHAPTERS[continueIndex] : null;
  const arcIndex = ARCS.findIndex((item) => item.id === arc.id);
  const nextArc = arcIndex >= 0 && arcIndex < ARCS.length - 1 ? ARCS[arcIndex + 1] : null;

  function handleStoryBackup() {
    try {
      localStorage.setItem(STORY_MANUAL_BACKUP_KEY, JSON.stringify({ backedUpAt:Date.now(), source:STORY_KEY, state }));
      setState((previous) => ({ ...previous, manualBackupAt:Date.now() }));
      setBackupStatus("Story backup created.");
    } catch (_) { setBackupStatus("Backup could not be created."); }
  }

  function handleResetStory() {
    try { localStorage.setItem(STORY_MANUAL_BACKUP_KEY, JSON.stringify({ backedUpAt:Date.now(), source:STORY_KEY, state })); } catch (_) {}
    const fresh = createStoryState(null, { newGame:true });
    setState(fresh);
    setPlaying(null);
    setUnlockReveal(null);
    setResetConfirm(false);
    setBackupStatus("New Story started. Main profile and inventory were preserved.");
    if (typeof onCampaignChange === "function") onCampaignChange(getStoryCampaignSnapshot(fresh));
  }

  function handleForceArc() {
    if (!import.meta.env.DEV) return;
    const target = ARC_BLUEPRINTS.find((item) => item.id === devArc) || ARC_BLUEPRINTS[0];
    const completed = CHAPTERS.filter((chapter) => chapter.end < target.start).map((chapter) => chapter.id);
    setState((previous) => ({
      ...previous,
      startedOn:shiftDayKey(today, -(target.start - 1)), trackingStartedOn:today, completed,
      legacyCredits:creditsForDay(target.start, player?.streak || 0),
      migration:{ ...(previous.migration || {}), inferenceApplied:true, noticeSeen:true, source:"dev_force", inferredFloor:target.start, graceUntil:shiftDayKey(today,1) },
    }));
    setBackupStatus("Dev arc forced: " + target.title);
  }

  function finishChapter(chapter) {
    const alreadyDone = state.completed.includes(chapter.id);
    if (!alreadyDone) {
      const next = { ...state, completed: state.completed.concat(chapter.id) };
      setState(next);
      setUnlockReveal(chapter);
      if (typeof onReward === "function") onReward(chapter);
    }
    setPlaying(null);
    setNotice(true);
  }

  if (playing) return <ScenePlayer chapter={playing} state={state} onState={setState} onClose={() => setPlaying(null)} onFinish={() => finishChapter(playing)} player={player} rank={rank} shadowArmy={shadowArmy} guildId={guildId} day={context.day} />;
  if (unlockReveal) return <UnlockReveal chapter={unlockReveal} onClose={() => setUnlockReveal(null)} />;

  return (
    <div className={"story-mode-view story-campaign-v3 story-campaign-v4 fade-in"+(context.day >= 241 ? " timeskip-active" : "")} style={{ "--arc-color": arc.color }}>
      {notice && <div className="campaign-notice"><b>!</b><span><small>SYSTEM NOTIFICATION</small><strong>{recoveryRequired ? "STORY PROGRESSION PAUSED - RECOVERY REQUIRED" : "MULTI-SAGA CAMPAIGN SYNCHRONIZED"}</strong></span></div>}
      {state.migration && !state.migration.noticeSeen && (
        <section className="story-migration-notice">
          <b>SYNC</b><div><small>SAVE DATA MIGRATION COMPLETE</small><strong>Previous save detected. Story progress has been synchronized.</strong><p>Profile, rank, XP, inventory, Shadows, guild state, settings, and legacy Story flags were preserved. Placement inferred at Day {state.migration.inferredFloor || context.day}.</p></div>
          <button onClick={() => setState((previous) => ({ ...previous, migration:{ ...(previous.migration || {}), noticeSeen:true } }))}>ACKNOWLEDGE</button>
        </section>
      )}
      <section className="story-hero story-hero-v3">
        <div className="hero-grid" /><div className="hero-shadow"><i/><i/></div>
        <div className="hero-copy">
          <span className="eyebrow">PRIVATE PLAYER CAMPAIGN / TIME-LOCK ACTIVE</span>
          <h1>STORY <em>MODE</em></h1>
          <p>Power is unlocked by real days, verified quests, and sustained performance. Waiting alone will not advance the campaign.</p>
          <div className="story-meta">
            <span><small>PLAYER</small>{player?.name || "HUNTER"}</span>
            <span><small>CAMPAIGN DAY</small>{Math.min(context.day, 9999)} / 240+</span>
            <span><small>PATH</small>{PATHS.find((path) => path.id === state.path)?.label || "UNSELECTED"}</span>
            <span><small>RANK STABILITY</small>{context.rankStability}%</span>
          </div>
          <div className="story-hero-actions">
            <button disabled={!continueChapter} onClick={() => continueChapter && setPlaying(continueChapter)}>{continueChapter ? "CONTINUE STORY - "+continueChapter.title : "NEXT ARC REQUIREMENTS INCOMPLETE"}</button>
            <button className="story-data-button" onClick={() => setShowDataTools((value) => !value)}>STORY DATA</button>
          </div>
        </div>
      </section>

      <section className="campaign-command-grid">
        <div className="campaign-arc-card">
          <small>{arc.saga} / CURRENT STORY ARC</small><strong>{arc.name}</strong><p>{arc.line}</p>
          {nextArc && <div className="next-arc-line"><small>NEXT ARC</small><b>{nextArc.name}</b><span>Day {nextArc.start} + discipline requirements</span></div>}
          <div className="campaign-day-progress"><i style={{ width: completedPercent + "%" }}/><span>{completedPercent}% TO MONARCH AWAKENING</span></div>
          <div className="campaign-checkpoints">{[1, 60, 105, 150, 180, 210, 240].map((day) => <b key={day} className={context.day >= day ? "reached" : ""} style={{ left: ((day - 1) / 239) * 100 + "%" }}>{day}</b>)}</div>
        </div>
        <div className="rank-stability-card">
          <small>RANK STABILITY</small><div className="stability-number">{context.rankStability}<em>%</em></div>
          <div className="stability-track"><i style={{ width: context.rankStability + "%" }}/></div>
          <p>{context.day === 1 ? "Baseline calibration in progress." : context.rankStability >= 65 ? "Stable growth pattern." : context.rankStability >= 50 ? "Growth pattern under review." : "Recovery protocol recommended."}</p>
        </div>
      </section>

      <section className="story-arc-timeline-panel">
        <div className="campaign-section-title"><span>STORY ARC TIMELINE</span><small>7 SAGAS / 23 ARCS / DAY 240+ TIMESKIP</small></div>
        <div className="story-arc-strip">
          {ARCS.map((item,index) => {
            const cleared = state.completed.includes(item.id);
            const current = item.id === arc.id;
            return <article key={item.id} className={cleared ? "cleared" : current ? "current" : "locked"} style={{ "--timeline-color":item.color }}>
              <small>ARC {pad(index+1)} / {item.saga}</small><strong>{item.name}</strong><span>{item.end > 9000 ? "DAY "+item.start+"+" : "DAYS "+item.start+"-"+item.end}</span><p>{item.purpose}</p><em>{cleared ? "CLEARED" : current ? "CURRENT" : "SEALED"}</em>
            </article>;
          })}
        </div>
      </section>

      {(recoveryRequired || clockAnomaly) && (
        <section className="story-recovery-panel">
          <div className="recovery-alert">!</div>
          <div className="recovery-copy"><small>{clockAnomaly ? "CLOCK ANOMALY" : "RECOVERY QUEST"}</small><h2>{clockAnomaly ? "CAMPAIGN CLOCK OUT OF SYNC" : "RESTORE THE CHAIN"}</h2><p>{clockAnomaly ? "The device date moved behind the last verified campaign date. Time-gated progress is frozen until the calendar catches up." : "A missed Daily Quest paused the next chapter. Complete today's safe recovery chain to reopen Story progression."}</p></div>
          {!clockAnomaly && <div className="recovery-steps"><span className={currentEntry.daily ? "done" : ""}>Daily Quest</span><span className={currentEntry.energy ? "done" : ""}>Energy Log</span><span className={currentEntry.discipline ? "done" : ""}>Discipline Check</span></div>}
        </section>
      )}

      <section className="campaign-ledger">
        <div className="campaign-section-title"><span>DISCIPLINE LEDGER</span><small>ONE VERIFIED ENTRY PER REAL DAY</small></div>
        <div className="campaign-metric-grid">
          <div><small>DAILY CLEARS</small><strong>{context.dailyDays}</strong><span>Monarch 122+</span></div>
          <div><small>ENERGY LOGS</small><strong>{context.energyDays}</strong><span>Monarch 60+</span></div>
          <div><small>TRAINING DAYS</small><strong>{context.trainingDays}</strong><span>Monarch 44+</span></div>
          <div><small>FOCUS / PROJECT</small><strong>{context.focusDays}</strong><span>Monarch 36+</span></div>
          <div><small>DISCIPLINE LOGS</small><strong>{context.disciplineDays}</strong><span>Monarch 65+</span></div>
          <div><small>QUALIFIED WEEKS</small><strong>{context.weeklyWins}</strong><span>Monarch 26+</span></div>
        </div>
        <div className="seven-day-chain">
          {lastSeven.map((item) => {
            const pending = item.preCampaign || item.future || (item.current && !item.entry.daily);
            return <div key={item.key} className={(item.entry.daily ? "clear " : pending ? "pending " : "missed ")}><small>{item.key.slice(5)}</small><b>{item.entry.daily ? "CLEAR" : item.current && !item.entry.daily ? "OPEN" : pending ? "--" : "MISS"}</b><span>{item.entry.energy ? "E" : "-"}{item.entry.training ? "T" : "-"}{item.entry.focus ? "F" : "-"}</span></div>;
          })}
        </div>
        <p className="ledger-key">E = Energy logged &nbsp; T = Training completed &nbsp; F = Focus, school, business, or project work completed</p>
      </section>

      {context.day >= 256 && state.heir && (
        <section className="heir-command-panel">
          <div className="heir-header"><div className="heir-sigil">H</div><div><small>FICTIONAL SUCCESSOR / MENTOR AUTHORITY</small><h2>{state.heir.name}</h2><p>Separate progression record. Your real-world data remains unchanged.</p></div><strong>LV {state.heir.level}</strong></div>
          <div className="heir-stats">{Object.keys(state.heir.stats || {}).map((key) => <div key={key}><small>{key}</small><b>{state.heir.stats[key]}</b></div>)}</div>
          <div className="heir-missions"><span className={currentEntry.daily ? "done" : ""}>Mentor Daily Quest</span><span className={currentEntry.training ? "done" : ""}>Movement Lesson</span><span className={currentEntry.focus ? "done" : ""}>Focus Lesson</span><span className={currentEntry.energy ? "done" : ""}>Recovery Lesson</span></div>
          <div className="heir-bond"><span>MENTOR BOND</span><i><b style={{ width:(state.heir.bond || 0)+"%" }}/></i><em>{state.heir.bond || 0}%</em></div>
        </section>
      )}

      <div className="campaign-heading"><span>MULTI-SAGA CAMPAIGN ARCHIVE</span><small>{state.completed.length} / {CHAPTERS.length} ARCS CLEARED</small></div>
      <div className="chapter-timeline">
        {CHAPTERS.map((chapter, index) => {
          const status = getChapterStatus(chapter, index, state, context, recoveryRequired || clockAnomaly);
          const unmet = chapter.requirements.filter((req) => !requirementMet(req, context));
          const chapterArc = ARCS.find((item) => item.id === chapter.arc) || arc;
          return (
            <article key={chapter.id} className={"chapter-entry " + status} style={{ "--chapter-color": chapterArc.color }}>
              <div className="timeline-node"><span>{pad(index + 1)}</span></div>
              <button disabled={status === "locked" || status === "paused"} onClick={() => (status === "ready" || status === "complete") && setPlaying(chapter)}>
                <div className={"chapter-art art-" + chapter.scene}><span/><i/><b/></div>
                <div className="chapter-copy"><small>{chapter.number} / {chapterArc.name}</small><h2>{chapter.title}</h2><p>{chapter.tagline}</p><div className="chapter-reward">+{chapter.xp} XP &nbsp; +{chapter.coins} GOLD</div><div className="chapter-consequence">FAILURE: {chapter.consequence}</div></div>
                <div className="chapter-requirements">
                  {chapter.requirements.map((req) => {
                    const met = requirementMet(req, context);
                    const value = requirementValue(req, context);
                    return <span key={req.metric} className={met ? "met" : ""}><i>{met ? "OK" : "--"}</i><b>{req.note}</b><small>{Math.min(value, req.target)} / {req.target}{req.metric === "rankStability" ? "%" : ""}</small></span>;
                  })}
                </div>
                <div className="chapter-status">{status === "complete" ? "CLEARED" : status === "ready" ? "ENTER" : status === "paused" ? "PAUSED" : "SEALED"}<small>{status === "complete" ? "REPLAY AVAILABLE" : status === "ready" ? "CHAPTER READY" : status === "paused" ? "COMPLETE RECOVERY QUEST" : unmet[0]?.note || "PREVIOUS CHAPTER REQUIRED"}</small></div>
              </button>
            </article>
          );
        })}
      </div>

      {context.day >= 241 && state.completed.includes("monarch_awakening") && <section className="infinite-progression-card"><small>POST-MONARCH STORY LAYER</small><h2>YEARS LATER... / WORLD TIER {Math.floor((context.day - 241) / 30) + 1}</h2><p>The timeskip is fictional. Real profile data is preserved while evolved Shadows, Heir missions, new-generation Gates, and recurring legacy trials continue without a final level.</p></section>}

      {showDataTools && (
        <section className="story-data-panel">
          <div className="campaign-section-title"><span>STORY SAVE CONTROL</span><small>MAIN SAVE DATA IS NEVER RESET HERE</small></div>
          <p>Story schema v4 keeps legacy flags, backs up the previous campaign, and preserves your profile, XP, inventory, Shadows, guild, settings, and evaluation.</p>
          <div className="story-data-actions">
            <button onClick={handleStoryBackup}>CREATE STORY BACKUP</button>
            {!resetConfirm ? <button className="danger" onClick={() => setResetConfirm(true)}>NEW GAME / RESET STORY</button> : <button className="danger confirm" onClick={handleResetStory}>CONFIRM STORY RESET ONLY</button>}
            {resetConfirm && <button onClick={() => setResetConfirm(false)}>CANCEL</button>}
          </div>
          {import.meta.env.DEV && <div className="story-dev-tools"><small>DEV MODE / FORCE ARC</small><select value={devArc} onChange={(event) => setDevArc(event.target.value)}>{ARC_BLUEPRINTS.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select><button onClick={handleForceArc}>FORCE ARC</button></div>}
          {backupStatus && <div className="story-data-status">{backupStatus}</div>}
          {state.manualBackupAt && <small className="story-backup-time">Last Story backup: {new Date(state.manualBackupAt).toLocaleString()}</small>}
        </section>
      )}
    </div>
  );
}
