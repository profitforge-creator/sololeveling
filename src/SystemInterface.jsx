import React, { useState, useEffect, useRef } from "react";

/* ============================================================================
   ARISE — Solo Leveling System Interface  ·  Hardcore Rework
   ─────────────────────────────────────────────────────────────────────────────
   DESIGN PHILOSOPHY: Nothing is free. Every point of XP, every rank advancement,
   every shadow — earned through real physical effort logged by the player.
   The system watches silently and rewards consistency, not button presses.

   CHANGES FROM PHASE 3:
   ✦ Removed ALL free XP / passive progression
   ✦ Removed +xp dev button
   ✦ Full Awakening Registration onboarding
     - Hunter class selection (7 classes)
     - Dream physique selection
     - Goal selection (multi-select)
     - Calisthenics evaluation (NO squats): pushups/pullups/situps/plank/burpees/endurance
     - Cinematic "Evaluating Hunter…" sequence
     - Starting rank assigned by real performance score
   ✦ Rotating daily quests driven by class + goals + progression history
   ✦ Boss rank gates — entry denied if rank insufficient
   ✦ Shadow extraction: 3-attempt ARISE system, permanent failure on 3 misses
   ✦ Monarch system fully invisible — no menu item, no visible tracker

   BUG RULES (unchanged):
   - Every useEffect: function() {} block body, no implicit return
   - Audio: setEnabled writes ref only
   - All timers in refs, cleared in cleanup
   - Every callback: typeof fn === "function" check before invoke
   - No Framer Motion
   ============================================================================ */

const FONT_LINK = "https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;700;900&family=Rajdhani:wght@400;500;600;700&family=Oxanium:wght@300;400;600;700&display=swap";

/* ---------------------------------------------------------------------------
   COLORS
--------------------------------------------------------------------------- */
const SYS_BLUE     = "#4db8ff";
const MONARCH_DARK = "#0d0010";
const MONARCH_PURP = "#9b30ff";
const MONARCH_DIM  = "#6a1fa8";
const GLITCH_RED   = "#ff2244";

/* ---------------------------------------------------------------------------
   RANKS
--------------------------------------------------------------------------- */
const RANKS = [
  { name: "E-Rank",         color: "#8a8f98", glow: "rgba(138,143,152,0.4)", min: 0,  title: "Awakened",          minRankIndex: 0 },
  { name: "D-Rank",         color: "#6fae6f", glow: "rgba(111,174,111,0.4)", min: 5,  title: "Hunter",            minRankIndex: 1 },
  { name: "C-Rank",         color: "#4db8ff", glow: "rgba(77,184,255,0.5)",  min: 12, title: "Skilled Hunter",    minRankIndex: 2 },
  { name: "B-Rank",         color: "#5d7cf5", glow: "rgba(93,124,245,0.5)",  min: 22, title: "Elite Hunter",      minRankIndex: 3 },
  { name: "A-Rank",         color: "#a05df5", glow: "rgba(160,93,245,0.55)", min: 34, title: "High Hunter",       minRankIndex: 4 },
  { name: "S-Rank",         color: "#f5b65d", glow: "rgba(245,182,93,0.6)",  min: 48, title: "Sovereign Hunter",  minRankIndex: 5 },
  { name: "National Level", color: "#f55d8a", glow: "rgba(245,93,138,0.65)", min: 64, title: "National Asset",    minRankIndex: 6 },
];

const STAT_KEYS = ["Strength","Agility","Endurance","Discipline","Intelligence","Recovery","Aura"];
const STAT_ICON = { Strength:"⚔", Agility:"➤", Endurance:"❖", Discipline:"◈", Intelligence:"✦", Recovery:"✚", Aura:"✸" };

/* ---------------------------------------------------------------------------
   HUNTER CLASSES
--------------------------------------------------------------------------- */
const HUNTER_CLASSES = [
  {
    id: "assassin", name: "Assassin", icon: "◈",
    desc: "Speed, precision, shadow movement. Prioritizes Agility + Discipline.",
    primaryStats: ["Agility","Discipline"],
    questFocus: ["sprint","pullups","plank","cold_shower"],
  },
  {
    id: "fighter", name: "Fighter", icon: "⚔",
    desc: "Raw combat power and durability. Prioritizes Strength + Endurance.",
    primaryStats: ["Strength","Endurance"],
    questFocus: ["pushups","burpees","endurance_run","pullups"],
  },
  {
    id: "tank", name: "Tank", icon: "❖",
    desc: "Immovable. Built to absorb and endure. Prioritizes Endurance + Recovery.",
    primaryStats: ["Endurance","Recovery"],
    questFocus: ["plank","pushups","endurance_run","sleep","hydration"],
  },
  {
    id: "mage", name: "Mage", icon: "✦",
    desc: "Mental supremacy. Intelligence and aura manipulation. Prioritizes Intelligence + Aura.",
    primaryStats: ["Intelligence","Aura"],
    questFocus: ["meditation","reading","focus_session","situps"],
  },
  {
    id: "ranger", name: "Ranger", icon: "➤",
    desc: "Distance and endurance. Built to outlast everything. Prioritizes Agility + Endurance.",
    primaryStats: ["Agility","Endurance"],
    questFocus: ["endurance_run","sprint","situps","hydration"],
  },
  {
    id: "support", name: "Support", icon: "✚",
    desc: "Longevity and recovery systems. Enables the team. Prioritizes Recovery + Intelligence.",
    primaryStats: ["Recovery","Intelligence"],
    questFocus: ["sleep","hydration","meditation","clean_meals"],
  },
  {
    id: "unknown", name: "Unknown", icon: "?",
    desc: "Classification undefined. The System will determine your path over time.",
    primaryStats: ["Strength","Aura"],
    questFocus: ["pushups","endurance_run","plank","meditation"],
  },
];

/* ---------------------------------------------------------------------------
   DREAM PHYSIQUES
--------------------------------------------------------------------------- */
const PHYSIQUES = [
  { id: "lean",     name: "Lean Athletic",      desc: "Low body fat, high functional output. Speed + definition.",  statBonus: { Agility: 3, Endurance: 2 } },
  { id: "massive",  name: "Massive Strength",   desc: "Maximum muscle mass and raw power output.",                  statBonus: { Strength: 4, Endurance: 1 } },
  { id: "aesthetic",name: "Aesthetic Build",    desc: "Symmetry, proportion, and conditioning.",                    statBonus: { Strength: 2, Agility: 2, Discipline: 1 } },
  { id: "functional",name: "Functional Athlete",desc: "Multi-domain performance. Works in every scenario.",         statBonus: { Strength: 2, Endurance: 2, Recovery: 1 } },
  { id: "runner",   name: "Runner Build",       desc: "Built for distance and sustained output.",                   statBonus: { Agility: 3, Recovery: 2 } },
  { id: "hybrid",   name: "Hybrid Build",       desc: "No single weakness. Balanced development across all domains.", statBonus: { Strength: 1, Agility: 1, Endurance: 1, Discipline: 1, Recovery: 1 } },
];

/* ---------------------------------------------------------------------------
   GOALS (multi-select during onboarding)
--------------------------------------------------------------------------- */
const GOAL_OPTIONS = [
  { id: "strength",    name: "Strength",     icon: "⚔", statKey: "Strength"     },
  { id: "discipline",  name: "Discipline",   icon: "◈", statKey: "Discipline"   },
  { id: "endurance",   name: "Endurance",    icon: "❖", statKey: "Endurance"    },
  { id: "speed",       name: "Speed",        icon: "➤", statKey: "Agility"      },
  { id: "aesthetics",  name: "Aesthetics",   icon: "✸", statKey: "Aura"         },
  { id: "confidence",  name: "Confidence",   icon: "✦", statKey: "Intelligence" },
  { id: "athleticism", name: "Athleticism",  icon: "❖", statKey: "Endurance"    },
];

/* ---------------------------------------------------------------------------
   CALISTHENICS EVALUATION TESTS (no squats per spec)
--------------------------------------------------------------------------- */
const EVAL_TESTS = [
  { id: "pushups",   name: "Max Push-ups",         unit: "reps", icon: "⚔", stat: "Strength",  max: 100 },
  { id: "pullups",   name: "Max Pull-ups",          unit: "reps", icon: "⚔", stat: "Strength",  max: 30  },
  { id: "situps",    name: "Max Sit-ups",           unit: "reps", icon: "❖", stat: "Endurance", max: 80  },
  { id: "plank",     name: "Plank Hold",            unit: "sec",  icon: "◈", stat: "Discipline",max: 180 },
  { id: "burpees",   name: "Burpees (2 min)",       unit: "reps", icon: "➤", stat: "Agility",   max: 40  },
  { id: "endurance", name: "1km Run (best time)",   unit: "sec",  icon: "❖", stat: "Endurance", max: 600, invert: true },
];

/* ---------------------------------------------------------------------------
   QUEST TEMPLATES — driven by class questFocus and goals
--------------------------------------------------------------------------- */
const QUEST_TEMPLATES = {
  pushups:      (n) => ({ id: "pushups",       name: "Push-ups",             target: n,   unit: "",    stat: "Strength"     }),
  pullups:      (n) => ({ id: "pullups",        name: "Pull-ups",             target: n,   unit: "",    stat: "Strength"     }),
  situps:       (n) => ({ id: "situps",         name: "Sit-ups",              target: n,   unit: "",    stat: "Endurance"    }),
  burpees:      (n) => ({ id: "burpees",        name: "Burpees",              target: n,   unit: "",    stat: "Endurance"    }),
  sprint:       (n) => ({ id: "sprint",         name: "Sprint Sets (100m)",   target: n,   unit: "×",   stat: "Agility"      }),
  endurance_run:(n) => ({ id: "endurance_run",  name: "Endurance Run",        target: n,   unit: "km",  stat: "Endurance"    }),
  plank:        (n) => ({ id: "plank",          name: "Plank Hold",           target: n,   unit: "min", stat: "Discipline"   }),
  cold_shower:  ()  => ({ id: "cold_shower",    name: "Cold Shower",          target: 1,   unit: "",    stat: "Discipline"   }),
  meditation:   (n) => ({ id: "meditation",     name: "Meditation",           target: n,   unit: "min", stat: "Discipline"   }),
  reading:      (n) => ({ id: "reading",        name: "Reading",              target: n,   unit: "min", stat: "Intelligence" }),
  focus_session:(n) => ({ id: "focus_session",  name: "Deep Focus Session",   target: n,   unit: "min", stat: "Intelligence" }),
  hydration:    ()  => ({ id: "hydration",      name: "Water Intake",         target: 3,   unit: "L",   stat: "Recovery"     }),
  sleep:        ()  => ({ id: "sleep",          name: "Sleep (8h)",           target: 8,   unit: "h",   stat: "Recovery"     }),
  clean_meals:  ()  => ({ id: "clean_meals",    name: "Clean Meals",          target: 3,   unit: "",    stat: "Recovery"     }),
};

/* Generate a daily quest from class + goals + level */
function generateDailyQuest(hunterClass, goals, level) {
  /* Safe inputs */
  const safeLevel = (typeof level === "number" && isFinite(level) && level >= 0) ? level : 1;
  const safeGoals = Array.isArray(goals) ? goals : [];
  const classData = HUNTER_CLASSES.find(function(c) { return c.id === hunterClass; }) || HUNTER_CLASSES[1];

  const tier  = Math.floor(safeLevel / 5);          /* 0 at LV0–4, 1 at LV5–9, etc. */
  const scale = Math.max(1, 1 + tier * 0.2);        /* always ≥ 1 */

  /* Base targets by rank tier — E Rank is beginner-friendly, scales up from there */
  const BASE = {
    pushups:       20 + tier * 12,   /* E:20  D:32  C:44  B:56  A:68  S:80 */
    pullups:       8  + tier * 5,    /* E:8   D:13  C:18  B:23  A:28  S:33 */
    situps:        25 + tier * 12,   /* E:25  D:37  C:49  B:61  A:73  S:85 */
    burpees:       10 + tier * 5,    /* E:10  D:15  C:20  B:25  A:30  S:35 */
    sprint:        4  + tier * 2,    /* sets */
    endurance_run: 1  + tier,        /* km:  E:1  D:2  C:3  B:4  A:5  S:6+ */
    plank:         Math.max(1, Math.round((1 + tier * 0.5) * 10) / 10), /* min */
    meditation:    10 + tier * 5,
    reading:       20 + tier * 10,
    focus_session: 30 + tier * 15,
    cold_shower:   1,
    hydration:     3,
    sleep:         8,
    clean_meals:   3,
  };

  const goalIds    = classData.questFocus.slice();
  const goals_built = [];

  goalIds.forEach(function(gid) {
    const fn  = QUEST_TEMPLATES[gid];
    if (!fn) return;
    const baseVal = BASE[gid];
    /* Some templates take no argument (cold_shower, hydration, sleep, clean_meals) */
    const goal = (baseVal !== undefined) ? fn(Math.round(baseVal)) : fn();
    /* Safety: ensure target is always a positive finite integer */
    if (goal && typeof goal.target === "number" && isFinite(goal.target) && goal.target > 0) {
      goals_built.push(goal);
    }
  });

  /* Append one goal from player-selected goals if not already in list */
  const goalStatMap = {
    strength: "pushups", discipline: "plank", endurance: "endurance_run",
    speed: "sprint", aesthetics: "pushups", confidence: "meditation", athleticism: "burpees",
  };
  safeGoals.forEach(function(gid) {
    const templateKey = goalStatMap[gid];
    if (!templateKey) return;
    if (goalIds.includes(templateKey)) return;
    if (goals_built.length >= 5) return;
    const fn = QUEST_TEMPLATES[templateKey];
    if (!fn) return;
    const baseVal = BASE[templateKey];
    const goal = (baseVal !== undefined) ? fn(Math.round(baseVal)) : fn();
    if (goal && typeof goal.target === "number" && isFinite(goal.target) && goal.target > 0) {
      goals_built.push(goal);
    }
  });

  /* Fallback: if somehow no goals built, give a safe default */
  if (goals_built.length === 0) {
    goals_built.push({ id: "pushups", name: "Push-ups", target: 20, unit: "", stat: "Strength" });
  }

  /* XP: never 0, never NaN */
  const baseXp  = 80 + tier * 40;                                 /* 80 → 120 → 160 … */
  const totalXp = Math.max(20, Math.round(baseXp * goals_built.length / 4));

  const tierLabel = tier > 0 ? " [+" + tier + "]" : "";

  return {
    id:     "daily_" + hunterClass,
    label:  classData.name + " Protocol" + tierLabel,
    goals:  goals_built,
    xp:     totalXp,
    tier:   tier,
  };
}

/* ---------------------------------------------------------------------------
   SIDE QUESTS (static, always available)
--------------------------------------------------------------------------- */
const SIDE_QUESTS = [
  { id: "hydrate", label: "Hydration Protocol",
    goals: [{ id: "water", name: "Water Intake", target: 3, unit: "L", stat: "Recovery" }], xp: 20 },
  { id: "mind", label: "Mental Conditioning",
    goals: [
      { id: "reading",    name: "Reading",    target: 30, unit: "min", stat: "Intelligence" },
      { id: "meditation", name: "Meditation", target: 10, unit: "min", stat: "Discipline"   },
    ], xp: 35 },
  { id: "recover", label: "Recovery Cycle",
    goals: [
      { id: "sleep",  name: "Sleep",       target: 8, unit: "h", stat: "Recovery"   },
      { id: "shower", name: "Cold Shower", target: 1, unit: "",  stat: "Discipline" },
    ], xp: 30 },
];

/* ===========================================================================
   EXTENDED SIDE QUEST SYSTEM
   Pools organized by category + rarity. Daily rotation selects from these.
   Each quest is self-contained. Rewards are plain data — no side effects
   in the data layer. Calculations happen only in handlers.
   =========================================================================== */

/* Quest rarity config */
const SQ_RARITY = {
  COMMON:    { color:"#4db8ff",  border:"#4db8ff44",  bg:"rgba(77,184,255,0.05)",    xpMod:1.0 },
  UNCOMMON:  { color:"#6fae6f",  border:"#6fae6f44",  bg:"rgba(111,174,111,0.05)",   xpMod:1.3 },
  RARE:      { color:"#a05df5",  border:"#a05df588",  bg:"rgba(160,93,245,0.07)",    xpMod:1.7 },
  ELITE:     { color:"#f53d3d",  border:"#f53d3d88",  bg:"rgba(245,61,61,0.07)",     xpMod:2.0 },
  LEGENDARY: { color:"#f5b65d",  border:"#f5b65d88",  bg:"rgba(245,182,93,0.07)",    xpMod:2.2 },
  CORRUPTED: { color:MONARCH_PURP,border:MONARCH_PURP+"88",bg:"rgba(155,48,255,0.07)",xpMod:2.5 },
  MONARCH:   { color:"#2ee88a",  border:"#2ee88a88",  bg:"rgba(46,232,138,0.07)",    xpMod:3.0 },
};

/* ===========================================================================
   SYSTEM ANOMALY QUEST POOL
   "Why is the System making me do this?"
   110 handcrafted real-world missions across 6 categories.
   No procedural generation. Modular templates with safe static data.
   =========================================================================== */

/* Rarity weights for rotation (higher index = rarer) */
const ANOMALY_RARITY_WEIGHTS = {
  COMMON:5, UNCOMMON:4, RARE:3, ELITE:2, LEGENDARY:1, CORRUPTED:1, MONARCH:0.5
};

const ANOMALY_QUEST_POOL = [

  /* ── 1. EXPLORATION ──────────────────────────────────────────── */
  { id:"aq_ex01", cat:"exploration", rarity:"COMMON",
    title:"New Ground",
    sys:"The System has detected stagnation in your movement patterns.",
    task:"Walk a route you have never taken before today.",
    unit:"walk", target:1,
    xp:60, coins:20, fame:5,
    lore:"Hunters who only train in familiar environments become predictable." },
  { id:"aq_ex02", cat:"exploration", rarity:"COMMON",
    title:"Sunrise Protocol",
    sys:"The System requires data on your early-morning capacity.",
    task:"Watch the sunrise today. Be outside before it appears.",
    unit:"session", target:1,
    xp:70, coins:25, fame:8,
    lore:"Most hunters sleep through the hour with the least competition." },
  { id:"aq_ex03", cat:"exploration", rarity:"COMMON",
    title:"Sunset Log",
    sys:"Day-end atmospheric conditions require field confirmation.",
    task:"Watch the sunset today. No screens for the duration.",
    unit:"session", target:1,
    xp:55, coins:15, fame:5,
    lore:"Stillness is a skill. The System is measuring yours." },
  { id:"aq_ex04", cat:"exploration", rarity:"UNCOMMON",
    title:"GPS Disabled",
    sys:"Navigation dependency detected. Override required.",
    task:"Get somewhere — a park, a street, any destination — without using GPS or maps.",
    unit:"trip", target:1,
    xp:90, coins:30, fame:10,
    lore:"A hunter who cannot navigate without assistance is not a hunter." },
  { id:"aq_ex05", cat:"exploration", rarity:"UNCOMMON",
    title:"Hidden Spot",
    sys:"Local terrain data is incomplete. The System requires field reconnaissance.",
    task:"Find a place in your area you have never been before. Document it mentally.",
    unit:"location", target:1,
    xp:80, coins:25, fame:8,
    lore:"The world is larger than your routine." },
  { id:"aq_ex06", cat:"exploration", rarity:"UNCOMMON",
    title:"Trail Discovery",
    sys:"Environmental scan indicates unexplored terrain nearby.",
    task:"Walk or run a trail, park path, or outdoor route you have not used before.",
    unit:"route", target:1,
    xp:100, coins:35, fame:12 },
  { id:"aq_ex07", cat:"exploration", rarity:"RARE",
    title:"Night Walk",
    sys:"Darkness adaptation protocols require field activation.",
    task:"Take a 20-minute walk outside after dark, alone. Stay aware. Stay safe.",
    unit:"walk", target:1,
    xp:140, coins:50, fame:15, monarchInterestGain:3,
    lore:"The city looks different at night. So do you." },
  { id:"aq_ex08", cat:"exploration", rarity:"RARE",
    title:"Outdoor Training Zone",
    sys:"Your training environment has become too predictable. Relocate.",
    task:"Complete a full workout — minimum 20 minutes — in an outdoor location you don't normally use.",
    unit:"session", target:1,
    xp:150, coins:55, fame:18 },
  { id:"aq_ex09", cat:"exploration", rarity:"RARE",
    title:"Bookstore Mission",
    sys:"Intelligence data acquisition required. Physical sourcing only.",
    task:"Go to a bookstore or library. Find and read one thing that interests you.",
    unit:"visit", target:1,
    xp:120, coins:40, fame:12,
    lore:"Every book is a record of someone who went further than most." },
  { id:"aq_ex10", cat:"exploration", rarity:"ELITE",
    title:"1-Hour Drift",
    sys:"Predictability is a vulnerability. The System is correcting it.",
    task:"Go outside with no plan. Walk for 1 hour in any direction. No destination.",
    unit:"hour", target:1,
    xp:200, coins:80, fame:25,
    lore:"The hunters who survive the unknown are the ones who stopped fearing it first." },
  { id:"aq_ex11", cat:"exploration", rarity:"LEGENDARY",
    title:"The Unknown Route",
    sys:"Maximum environmental deviation required. This is not optional.",
    task:"Leave your usual area entirely. Spend 2 hours somewhere you have never been. Return changed.",
    unit:"outing", target:1,
    xp:350, coins:150, fame:50, shadowLoyaltyGain:5,
    lore:"Distance from routine is the only way the body learns what it is actually capable of." },

  /* ── 2. SOCIAL ───────────────────────────────────────────────── */
  { id:"aq_so01", cat:"social", rarity:"COMMON",
    title:"First Contact",
    sys:"Social interface module requires calibration.",
    task:"Start a genuine conversation with someone you don't know today.",
    unit:"conversation", target:1,
    xp:70, coins:20, fame:8 },
  { id:"aq_so02", cat:"social", rarity:"COMMON",
    title:"Compliment Protocol",
    sys:"Outward acknowledgment function offline. Restore.",
    task:"Give a genuine compliment to someone today. Not surface-level. Make it real.",
    unit:"interaction", target:1,
    xp:55, coins:15, fame:6 },
  { id:"aq_so03", cat:"social", rarity:"COMMON",
    title:"Help Someone",
    sys:"Cooperative capacity test initiated.",
    task:"Help someone with something today. Big or small. Do it without being asked.",
    unit:"action", target:1,
    xp:65, coins:20, fame:10 },
  { id:"aq_so04", cat:"social", rarity:"UNCOMMON",
    title:"Goal Exchange",
    sys:"Objective alignment protocol. External data required.",
    task:"Ask someone about their goals today. Actually listen to the answer.",
    unit:"conversation", target:1,
    xp:90, coins:30, fame:12,
    lore:"The hunters who rise fastest are often those who studied other hunters." },
  { id:"aq_so05", cat:"social", rarity:"UNCOMMON",
    title:"Phone-Free Hour",
    sys:"Social performance cannot be measured through a screen.",
    task:"Spend 1 hour with family or friends with your phone off or in another room.",
    unit:"hour", target:1,
    xp:100, coins:35, fame:15 },
  { id:"aq_so06", cat:"social", rarity:"UNCOMMON",
    title:"Reconnect",
    sys:"Connection thread dormant. Restore.",
    task:"Reach out to someone you haven't spoken to in a while. Message, call, or meet.",
    unit:"contact", target:1,
    xp:85, coins:25, fame:10 },
  { id:"aq_so07", cat:"social", rarity:"RARE",
    title:"Teach Something",
    sys:"Knowledge transfer function requires activation.",
    task:"Teach someone something today. Anything you know that they don't.",
    unit:"session", target:1,
    xp:160, coins:60, fame:20,
    lore:"Teaching solidifies knowledge in ways studying cannot." },
  { id:"aq_so08", cat:"social", rarity:"RARE",
    title:"Difficult Conversation",
    sys:"Communication avoidance pattern detected. Purge required.",
    task:"Have a conversation you have been avoiding. Say what needs to be said.",
    unit:"conversation", target:1,
    xp:200, coins:80, fame:25, monarchInterestGain:3,
    lore:"The things left unsaid accumulate. They become weight." },
  { id:"aq_so09", cat:"social", rarity:"ELITE",
    title:"The Ask",
    sys:"Rejection tolerance module requires calibration.",
    task:"Ask for something you want today. Accept any outcome without internal collapse.",
    unit:"ask", target:1,
    xp:240, coins:100, fame:35,
    lore:"Most hunters never ask. The System has noticed you are different." },

  /* ── 3. DISCIPLINE ───────────────────────────────────────────── */
  { id:"aq_di01", cat:"discipline", rarity:"COMMON",
    title:"Deep Clean",
    sys:"Environmental disorder correlates with output degradation.",
    task:"Deep clean your room or workspace today. Full completion only.",
    unit:"session", target:1,
    xp:60, coins:20, fame:5 },
  { id:"aq_di02", cat:"discipline", rarity:"COMMON",
    title:"Early Rise",
    sys:"Chronological advantage protocol. Initiate.",
    task:"Wake up 1 hour earlier than your usual time tomorrow.",
    unit:"morning", target:1,
    xp:70, coins:20, fame:8 },
  { id:"aq_di03", cat:"discipline", rarity:"COMMON",
    title:"Journal Objectives",
    sys:"Internal objective tracking requires external logging.",
    task:"Write your top 3 goals and exactly why they matter. Minimum 1 full page.",
    unit:"entry", target:1,
    xp:55, coins:15, fame:5,
    lore:"Hunters who write their objectives complete them at 42% higher rates." },
  { id:"aq_di04", cat:"discipline", rarity:"COMMON",
    title:"Meal Prep Protocol",
    sys:"Fuel optimization required. External food sources compromising performance.",
    task:"Prepare your meals for tomorrow in advance. No processed food.",
    unit:"session", target:1,
    xp:65, coins:20, fame:7 },
  { id:"aq_di05", cat:"discipline", rarity:"UNCOMMON",
    title:"3-Hour Blackout",
    sys:"Digital dependency index critical. Override protocol initiating.",
    task:"No phone, no screens for 3 hours. Log what you did instead.",
    unit:"session", target:1,
    xp:110, coins:40, fame:15 },
  { id:"aq_di06", cat:"discipline", rarity:"UNCOMMON",
    title:"Cold Shower Sequence",
    sys:"Thermal stress response calibration required.",
    task:"Cold shower. Minimum 3 minutes. No hesitation permitted.",
    unit:"shower", target:1,
    xp:90, coins:30, fame:12 },
  { id:"aq_di07", cat:"discipline", rarity:"UNCOMMON",
    title:"Read 1 Hour",
    sys:"Intelligence data acquisition protocol initiated.",
    task:"Read for 1 uninterrupted hour. Physical book preferred.",
    unit:"hour", target:1,
    xp:100, coins:35, fame:12 },
  { id:"aq_di08", cat:"discipline", rarity:"UNCOMMON",
    title:"Productivity Sprint",
    sys:"Output efficiency test. 2-hour window. Begin.",
    task:"Work on your most important task for 2 uninterrupted hours. No switching.",
    unit:"session", target:1,
    xp:120, coins:45, fame:15 },
  { id:"aq_di09", cat:"discipline", rarity:"RARE",
    title:"Full Day Protocol",
    sys:"24-hour discipline audit initiated.",
    task:"Alcohol-free, clean meals, no mindless scrolling, and at least 30 minutes of physical training. All four. All day.",
    unit:"day", target:1,
    xp:220, coins:90, fame:30,
    lore:"Most people can do any one of these. Very few do all four simultaneously." },
  { id:"aq_di10", cat:"discipline", rarity:"RARE",
    title:"The Rewrite",
    sys:"Goal architecture scan: suboptimal. Rewrite required.",
    task:"Rewrite your goals from scratch. Ignore what you wrote before. Be honest about what you actually want.",
    unit:"session", target:1,
    xp:180, coins:70, fame:20,
    lore:"The goals that survive a rewrite are the real ones." },
  { id:"aq_di11", cat:"discipline", rarity:"ELITE",
    title:"Iron Day",
    sys:"Maximum discipline protocol activated. 24-hour window.",
    task:"Wake before 6am. Cold shower. Train. No social media. Clean meals. Journal. Sleep before midnight. All seven.",
    unit:"day", target:1,
    xp:320, coins:130, fame:45, monarchInterestGain:5,
    lore:"One day like this, executed perfectly, changes the internal reference point for what is possible." },

  /* ── 4. ADVENTURE ────────────────────────────────────────────── */
  { id:"aq_ad01", cat:"adventure", rarity:"COMMON",
    title:"New Hobby Scout",
    sys:"Skill diversification required. One-hour trial protocol.",
    task:"Try something new for 1 hour today. Any skill, any hobby. You must not have tried it before.",
    unit:"session", target:1,
    xp:75, coins:25, fame:8 },
  { id:"aq_ad02", cat:"adventure", rarity:"COMMON",
    title:"Outdoor Training",
    sys:"Indoor training bias detected. Environmental override required.",
    task:"Complete a full training session outdoors. Any location. Minimum 30 minutes.",
    unit:"session", target:1,
    xp:80, coins:25, fame:8 },
  { id:"aq_ad03", cat:"adventure", rarity:"UNCOMMON",
    title:"New Environment",
    sys:"Performance outputs plateau in static environments. Relocate.",
    task:"Train or work in a completely different environment than you normally use. Cafe, park, rooftop, anywhere.",
    unit:"session", target:1,
    xp:100, coins:35, fame:12 },
  { id:"aq_ad04", cat:"adventure", rarity:"UNCOMMON",
    title:"Skill Hour",
    sys:"Secondary skill acquisition module initiated.",
    task:"Spend 1 hour learning something practical. Cooking, coding, language, craft — anything that builds a real skill.",
    unit:"hour", target:1,
    xp:110, coins:40, fame:15 },
  { id:"aq_ad05", cat:"adventure", rarity:"UNCOMMON",
    title:"Solo Outing",
    sys:"Independence calibration required. Solo field mission activated.",
    task:"Go somewhere new or interesting alone today. No companions. No phone navigation.",
    unit:"outing", target:1,
    xp:120, coins:45, fame:18,
    lore:"Hunters who are comfortable alone are dangerous everywhere." },
  { id:"aq_ad06", cat:"adventure", rarity:"RARE",
    title:"Something Uncomfortable",
    sys:"Comfort zone boundaries detected. Expansion required.",
    task:"Do something that genuinely makes you uncomfortable but is beneficial. The System is watching.",
    unit:"action", target:1,
    xp:180, coins:70, fame:25, monarchInterestGain:4 },
  { id:"aq_ad07", cat:"adventure", rarity:"RARE",
    title:"Physical Novelty",
    sys:"Neuromuscular adaptation patterns stagnating. Novel stimulus required.",
    task:"Try a physical activity you have never done before. Climb, swim, cycle, martial arts, anything.",
    unit:"session", target:1,
    xp:200, coins:80, fame:28,
    lore:"The body adapts fastest when it doesn't know what is coming." },
  { id:"aq_ad08", cat:"adventure", rarity:"ELITE",
    title:"The Hard Yes",
    sys:"Opportunity avoidance pattern identified. Immediate override.",
    task:"Say yes to something you would normally avoid or decline. Then follow through completely.",
    unit:"action", target:1,
    xp:280, coins:120, fame:40, shadowLoyaltyGain:5,
    lore:"The identity you want is built through the actions you take when it would be easier to say no." },
  { id:"aq_ad09", cat:"adventure", rarity:"LEGENDARY",
    title:"Peak Experience",
    sys:"Maximum novelty protocol. This mission does not repeat easily.",
    task:"Do the most adventurous thing you have done in the last year. Today. Now.",
    unit:"experience", target:1,
    xp:400, coins:180, fame:60, shadowLoyaltyGain:10, monarchInterestGain:8,
    lore:"Some experiences reset what you believe about yourself. This is one of them." },

  /* ── 5. MENTAL STRENGTH ──────────────────────────────────────── */
  { id:"aq_ms01", cat:"mental", rarity:"COMMON",
    title:"Stillness Protocol",
    sys:"Mental noise levels critical. Reduction required.",
    task:"Sit in silence for 10 minutes. No music, no phone, no distractions. Just be still.",
    unit:"session", target:1,
    xp:55, coins:15, fame:5 },
  { id:"aq_ms02", cat:"mental", rarity:"COMMON",
    title:"Meditation Basic",
    sys:"Focus recalibration required.",
    task:"Complete a 15-minute meditation session. Seated. Eyes closed. No guidance app needed.",
    unit:"session", target:1,
    xp:65, coins:20, fame:7 },
  { id:"aq_ms03", cat:"mental", rarity:"COMMON",
    title:"Gratitude Log",
    sys:"Psychological baseline optimization protocol.",
    task:"Write 10 specific things you are grateful for. Not generic. Make each one real and detailed.",
    unit:"entry", target:1,
    xp:50, coins:15, fame:5 },
  { id:"aq_ms04", cat:"mental", rarity:"UNCOMMON",
    title:"Silent Walk",
    sys:"Cognitive reset protocol. No audio input permitted.",
    task:"Walk for 30 minutes in complete silence. No music, no podcasts, no talking. Observe everything.",
    unit:"walk", target:1,
    xp:100, coins:35, fame:15,
    lore:"Most hunters never hear themselves think. This is intentional." },
  { id:"aq_ms05", cat:"mental", rarity:"UNCOMMON",
    title:"Reflection Session",
    sys:"Performance review module initiated.",
    task:"Write a brutally honest analysis of the last 7 days. What worked. What didn't. What you avoided. Be specific.",
    unit:"entry", target:1,
    xp:110, coins:40, fame:15,
    lore:"Self-deception is the most common weakness the System encounters." },
  { id:"aq_ms06", cat:"mental", rarity:"UNCOMMON",
    title:"Fear Log",
    sys:"Avoidance pattern analysis initiated.",
    task:"Write down 3 things you are currently afraid of or avoiding. Then write exactly why, with no rationalization.",
    unit:"entry", target:1,
    xp:90, coins:30, fame:12,
    lore:"Named fears lose approximately 60% of their power." },
  { id:"aq_ms07", cat:"mental", rarity:"RARE",
    title:"30-Minute Meditation",
    sys:"Advanced focus calibration. Extended protocol.",
    task:"Meditate for 30 uninterrupted minutes. Observe your thoughts without engaging them.",
    unit:"session", target:1,
    xp:180, coins:70, fame:22, monarchInterestGain:3 },
  { id:"aq_ms08", cat:"mental", rarity:"RARE",
    title:"Vision Architecture",
    sys:"Long-term objective mapping required.",
    task:"Write out your 5-year vision in full detail. Not goals. A vision. What does your life look like?",
    unit:"entry", target:1,
    xp:200, coins:80, fame:28,
    lore:"Hunters without a long-term vision fight for short-term survival. They rarely rise past C-Rank." },
  { id:"aq_ms09", cat:"mental", rarity:"ELITE",
    title:"Identity Audit",
    sys:"Self-classification anomaly detected. Full audit required.",
    task:"Write who you are right now, honestly. Then write who you intend to become. Identify the gap. Plan one action to close it today.",
    unit:"entry", target:1,
    xp:300, coins:130, fame:45, monarchInterestGain:6,
    lore:"The System cannot classify you correctly until you can classify yourself." },
  { id:"aq_ms10", cat:"mental", rarity:"LEGENDARY",
    title:"Confrontation Protocol",
    sys:"Primary fear avoidance event detected. This is not optional.",
    task:"Face your biggest current fear. Directly. Today. The System is logging this.",
    unit:"action", target:1,
    xp:450, coins:200, fame:70, shadowLoyaltyGain:10, monarchInterestGain:10,
    lore:"The single action most likely to permanently alter your capability ceiling." },

  /* ── 6. CHAOS / ANOMALY ──────────────────────────────────────── */
  { id:"aq_ch01", cat:"chaos", rarity:"COMMON",
    title:"System Anomaly: Immediate Deployment",
    sys:"An anomalous signal has been detected in your vicinity.",
    task:"Go outside for 20 minutes immediately. No reason needed. The System has one.",
    unit:"outing", target:1,
    xp:80, coins:25, fame:10 },
  { id:"aq_ch02", cat:"chaos", rarity:"COMMON",
    title:"System Anomaly: Unscheduled Run",
    sys:"Cardiovascular activation required. Window: now.",
    task:"Run to the nearest open field, park, or open space. Minimum 10 minutes of movement.",
    unit:"run", target:1,
    xp:85, coins:30, fame:10 },
  { id:"aq_ch03", cat:"chaos", rarity:"COMMON",
    title:"System Anomaly: Screen Zero",
    sys:"Digital saturation threshold exceeded.",
    task:"Spend 1 hour disconnected from all screens. No exceptions. No 'just checking'.",
    unit:"hour", target:1,
    xp:75, coins:20, fame:8 },
  { id:"aq_ch04", cat:"chaos", rarity:"UNCOMMON",
    title:"System Anomaly: Night Sky",
    sys:"Temporal environmental protocol. This window closes at dawn.",
    task:"Train under the night sky. Go outside after 9pm and complete at least 20 minutes of exercise.",
    unit:"session", target:1,
    xp:130, coins:50, fame:18, monarchInterestGain:2 },
  { id:"aq_ch05", cat:"chaos", rarity:"UNCOMMON",
    title:"System Anomaly: Stagnation Override",
    sys:"Behavioral loop detected. Emergency deviation required.",
    task:"Do something today that is completely outside your normal routine. The System will know if you cheat.",
    unit:"action", target:1,
    xp:110, coins:40, fame:15 },
  { id:"aq_ch06", cat:"chaos", rarity:"UNCOMMON",
    title:"System Anomaly: Social Contact",
    sys:"Isolation pattern flagged. Override required.",
    task:"Talk to 3 different people today, in person. Not texts. Actual conversation.",
    unit:"conversations", target:3,
    xp:120, coins:45, fame:18 },
  { id:"aq_ch07", cat:"chaos", rarity:"RARE",
    title:"System Anomaly: Unknown Origin",
    sys:"Signal source: [REDACTED]. Nature: unknown. Response required.",
    task:"Do something kind for a stranger today. Significant enough to be remembered by them.",
    unit:"action", target:1,
    xp:200, coins:80, fame:28, monarchInterestGain:4,
    lore:"The System does not always explain why. Trust the mission." },
  { id:"aq_ch08", cat:"chaos", rarity:"RARE",
    title:"System Anomaly: Comfort Breach",
    sys:"Pattern disruption sequence initiated.",
    task:"Sit in a public place alone for 30 minutes. No phone. Observe the world. Let discomfort exist.",
    unit:"session", target:1,
    xp:180, coins:70, fame:24,
    lore:"Comfort is a cage that looks like a safe room." },
  { id:"aq_ch09", cat:"chaos", rarity:"CORRUPTED",
    title:"CORRUPTED SIGNAL: Origin Unknown",
    sys:"[ERR_0xC1] Unauthorized transmission intercepted. The System has been compromised. Complete this before it closes.",
    task:"Train at an unusual time today — before 6am or after 10pm. Minimum 25 minutes. The window is closing.",
    unit:"session", target:1,
    xp:280, coins:110, fame:35, monarchInterestGain:6,
    lore:"Some missions arrive from sources the System cannot trace." },
  { id:"aq_ch10", cat:"chaos", rarity:"CORRUPTED",
    title:"CORRUPTED SIGNAL: The Mirror",
    sys:"[ERR_0xC2] Reflection protocol malfunction. Manual restoration required.",
    task:"Stand in front of a mirror for 5 minutes and speak your goals out loud. Clearly. No mumbling.",
    unit:"session", target:1,
    xp:260, coins:100, fame:30, monarchInterestGain:5,
    lore:"The version of you that hesitates at this is not the version that survives." },
  { id:"aq_ch11", cat:"chaos", rarity:"CORRUPTED",
    title:"CORRUPTED SIGNAL: Monarch Interest Spike",
    sys:"[ALERT] Unknown authority-class entity has issued a directive. Origin: classified.",
    task:"Complete 100 push-ups and 5km of walking before midnight today. Broken into any sets.",
    unit:"completion", target:1,
    xp:320, coins:130, fame:40, monarchInterestGain:10, shadowLoyaltyGain:5,
    lore:"Certain signals arrive when the System determines you are ready. You may not agree. Complete it anyway." },
  { id:"aq_ch12", cat:"chaos", rarity:"MONARCH",
    title:"MONARCH-CLASS DIRECTIVE",
    sys:"Priority signal. Origin: CLASSIFIED. Clearance required: none. Refusal: not recognized.",
    task:"Complete the hardest physical and mental day you have had in a month. No shortcuts. No rest days. The System will know.",
    unit:"day", target:1,
    xp:600, coins:250, fame:100, shadowLoyaltyGain:15, monarchInterestGain:15,
    lore:"Monarch-class missions arrive once. They do not repeat. There is no record of what happens to hunters who decline." },

  /* ── EXTRA POOL (variety padding) ───────────────────────────── */
  { id:"aq_xp01", cat:"exploration", rarity:"COMMON",
    title:"New Coffee Stop",
    sys:"Environmental novelty stimulus required.",
    task:"Visit a café, park bench, or outdoor space you have never sat at before. Stay for 20 minutes.",
    unit:"visit", target:1,
    xp:50, coins:15, fame:5 },
  { id:"aq_xp02", cat:"discipline", rarity:"COMMON",
    title:"1000 Steps Extra",
    sys:"Movement baseline below optimal.",
    task:"Walk 1000 more steps than your current daily average. Track it or estimate carefully.",
    unit:"steps", target:1,
    xp:45, coins:12, fame:4 },
  { id:"aq_xp03", cat:"social", rarity:"UNCOMMON",
    title:"Appreciation Delivered",
    sys:"Acknowledgment module offline.",
    task:"Tell someone — genuinely — that you appreciate them. In person or via voice message. Not text.",
    unit:"interaction", target:1,
    xp:95, coins:30, fame:12 },
  { id:"aq_xp04", cat:"mental", rarity:"UNCOMMON",
    title:"The Letter",
    sys:"Future self communication protocol initiated.",
    task:"Write a letter to yourself 1 year from today. Describe who you will have become and what you did to get there.",
    unit:"letter", target:1,
    xp:130, coins:45, fame:18,
    lore:"The hunters with the clearest picture of their future are the ones who create it." },
  { id:"aq_xp05", cat:"adventure", rarity:"COMMON",
    title:"Unplanned Detour",
    sys:"Linear path deviation required.",
    task:"On your next trip anywhere, take a different route. Explore one block you haven't been on.",
    unit:"detour", target:1,
    xp:40, coins:10, fame:4 },
  { id:"aq_xp06", cat:"chaos", rarity:"UNCOMMON",
    title:"System Anomaly: Cold Water",
    sys:"Thermal endurance protocol activated.",
    task:"End your shower with 2 minutes of cold water. No negotiation. No gradual decrease.",
    unit:"shower", target:1,
    xp:110, coins:35, fame:14 },
  { id:"aq_xp07", cat:"discipline", rarity:"UNCOMMON",
    title:"No Complaints",
    sys:"Verbal negativity index elevated. Purge protocol.",
    task:"Go 24 hours without complaining once. Not out loud, not in texts. If you slip, reset.",
    unit:"day", target:1,
    xp:150, coins:55, fame:20,
    lore:"Hunters who complain are broadcasting their limits to everyone listening." },
  { id:"aq_xp08", cat:"mental", rarity:"RARE",
    title:"The Hard Question",
    sys:"Internal processing blockage detected.",
    task:"Ask yourself the question you have been avoiding. Write it down. Write the honest answer.",
    unit:"entry", target:1,
    xp:220, coins:90, fame:30, monarchInterestGain:4,
    lore:"Avoidance is the body's way of telling you exactly what you need to face." },
  { id:"aq_xp09", cat:"social", rarity:"RARE",
    title:"Mentor Reach",
    sys:"Knowledge acquisition from experienced source required.",
    task:"Reach out to someone further ahead than you in any area of life. Ask them one real question.",
    unit:"interaction", target:1,
    xp:200, coins:80, fame:28,
    lore:"The fastest way to close a gap is to ask the person already on the other side." },
  { id:"aq_xp10", cat:"exploration", rarity:"UNCOMMON",
    title:"Nature Protocol",
    sys:"Urban saturation index critical. Field reset required.",
    task:"Spend 30 minutes in nature today — park, trail, river, anywhere green. Phone away.",
    unit:"session", target:1,
    xp:95, coins:30, fame:12 },
  { id:"aq_xp11", cat:"adventure", rarity:"RARE",
    title:"Public Performance",
    sys:"Social exposure tolerance calibration required.",
    task:"Do something in public that draws (positive) attention — street workout, unusual confidence, anything visible.",
    unit:"action", target:1,
    xp:240, coins:100, fame:38, monarchInterestGain:5,
    lore:"Hunters who can perform under observation become dangerous in dungeons." },
  { id:"aq_xp12", cat:"chaos", rarity:"ELITE",
    title:"System Override: 48-Hour Protocol",
    sys:"EXTENDED ANOMALY DETECTED. 48-hour window open.",
    task:"For the next 2 days: cold showers daily, no social media, 30-min training, journaling. All four.",
    unit:"completion", target:1,
    xp:450, coins:180, fame:65, shadowLoyaltyGain:8, monarchInterestGain:8,
    lore:"The System has issued an extended directive. This is not a drill." },

  /* ── ADDITIONAL POOL (to reach 100+) ────────────────────────── */
  { id:"aq_b01", cat:"discipline", rarity:"COMMON",
    title:"Zero Sugar Day",
    sys:"Dietary interference pattern detected.",
    task:"No sugar, no processed food today. Whole foods only.",
    unit:"day", target:1, xp:65, coins:20, fame:6 },
  { id:"aq_b02", cat:"exploration", rarity:"COMMON",
    title:"Walking Meeting",
    sys:"Static work posture duration critical.",
    task:"Take your next call, podcast, or audio session while walking outside.",
    unit:"walk", target:1, xp:50, coins:15, fame:5 },
  { id:"aq_b03", cat:"social", rarity:"COMMON",
    title:"Phone Call",
    sys:"Text-only communication pattern logged. Override.",
    task:"Call someone instead of texting them today. Have an actual conversation.",
    unit:"call", target:1, xp:55, coins:15, fame:6 },
  { id:"aq_b04", cat:"mental", rarity:"COMMON",
    title:"Digital Detox Hour",
    sys:"Attention fragmentation index elevated.",
    task:"One hour. No notifications. No checking. Fully present.",
    unit:"hour", target:1, xp:60, coins:18, fame:6 },
  { id:"aq_b05", cat:"adventure", rarity:"COMMON",
    title:"Try the Menu",
    sys:"Food novelty index: zero. Adjust.",
    task:"Order or cook something you have never eaten before today.",
    unit:"meal", target:1, xp:45, coins:12, fame:4 },
  { id:"aq_b06", cat:"chaos", rarity:"COMMON",
    title:"System Anomaly: Stand Up",
    sys:"Sedentary duration exceeded threshold.",
    task:"Stand up right now. Go outside. Walk for 10 minutes. Return.",
    unit:"walk", target:1, xp:50, coins:15, fame:5 },
  { id:"aq_b07", cat:"discipline", rarity:"UNCOMMON",
    title:"Morning Pages",
    sys:"Unconscious processing backlog detected.",
    task:"Write 3 pages of free, unfiltered thoughts immediately after waking. No editing.",
    unit:"session", target:1, xp:95, coins:30, fame:12 },
  { id:"aq_b08", cat:"exploration", rarity:"UNCOMMON",
    title:"Photography Mission",
    sys:"Environmental observation bandwidth below optimal.",
    task:"Take 10 photos today of things you find genuinely interesting. No filters.",
    unit:"session", target:1, xp:80, coins:25, fame:10 },
  { id:"aq_b09", cat:"social", rarity:"UNCOMMON",
    title:"The Real Check-In",
    sys:"Surface-level interaction pattern detected.",
    task:"Ask someone close to you how they are actually doing. Then listen for more than 60 seconds.",
    unit:"conversation", target:1, xp:90, coins:28, fame:12 },
  { id:"aq_b10", cat:"adventure", rarity:"UNCOMMON",
    title:"Document Something",
    sys:"Memory encoding protocol: passive. Override required.",
    task:"Film or photograph your training session today. Review it. Learn one thing.",
    unit:"session", target:1, xp:110, coins:35, fame:15 },
  { id:"aq_b11", cat:"mental", rarity:"UNCOMMON",
    title:"10-Minute Visualization",
    sys:"Goal representation clarity: insufficient.",
    task:"Close your eyes for 10 minutes and vividly visualize your ideal day one year from now.",
    unit:"session", target:1, xp:100, coins:32, fame:14 },
  { id:"aq_b12", cat:"chaos", rarity:"UNCOMMON",
    title:"System Anomaly: Sunlight Protocol",
    sys:"UV exposure index: insufficient. Correct immediately.",
    task:"Spend 20 minutes in direct sunlight today. No shade. No phone.",
    unit:"session", target:1, xp:95, coins:30, fame:12 },
  { id:"aq_b13", cat:"discipline", rarity:"RARE",
    title:"Monk Mode: 6 Hours",
    sys:"Focus output required at maximum capacity.",
    task:"6 hours of complete focus. No social media, no entertainment, no idle conversation. Build, study, or train.",
    unit:"session", target:1, xp:220, coins:90, fame:30, monarchInterestGain:3 },
  { id:"aq_b14", cat:"exploration", rarity:"RARE",
    title:"Conversation with a Stranger",
    sys:"External network bandwidth: minimal. Expand.",
    task:"Have a genuine 5-minute conversation with a complete stranger in public today.",
    unit:"conversation", target:1, xp:200, coins:75, fame:28 },
  { id:"aq_b15", cat:"mental", rarity:"RARE",
    title:"Forgiveness Protocol",
    sys:"Unresolved emotional data accumulating. Processing required.",
    task:"Write a letter forgiving someone who wronged you. You don't have to send it. The writing is the mission.",
    unit:"entry", target:1, xp:210, coins:80, fame:25,
    lore:"Resentment is weight the hunter carries alone." },
  { id:"aq_b16", cat:"adventure", rarity:"RARE",
    title:"No Comfort Food",
    sys:"Dopamine dependency pattern identified.",
    task:"For one full day, eat only what genuinely fuels you. No reward eating. No emotional eating.",
    unit:"day", target:1, xp:200, coins:80, fame:26 },
  { id:"aq_b17", cat:"chaos", rarity:"RARE",
    title:"System Anomaly: Midnight Silence",
    sys:"High-frequency noise saturation critical. Emergency silence protocol.",
    task:"Between 11pm and midnight, sit in complete silence for 20 minutes. No input. Just you.",
    unit:"session", target:1, xp:190, coins:75, fame:25, monarchInterestGain:4 },
  { id:"aq_b18", cat:"social", rarity:"RARE",
    title:"The Honest Conversation",
    sys:"Authenticity output: below threshold.",
    task:"Tell someone something real today — something you have not said yet. No small talk.",
    unit:"conversation", target:1, xp:200, coins:80, fame:28, monarchInterestGain:3 },
  { id:"aq_b19", cat:"discipline", rarity:"ELITE",
    title:"Full Analog Day",
    sys:"Digital dependency critical. Emergency analog override.",
    task:"One full day. No social media, no streaming, no gaming. Read, train, think, create, connect.",
    unit:"day", target:1, xp:340, coins:140, fame:50, monarchInterestGain:6 },
  { id:"aq_b20", cat:"exploration", rarity:"ELITE",
    title:"The Long Walk",
    sys:"Sustained environmental exposure required. 2-hour minimum.",
    task:"Walk for 2 hours continuously. No destination required. Let your mind move.",
    unit:"walk", target:1, xp:300, coins:120, fame:45, shadowLoyaltyGain:6 },
  { id:"aq_b21", cat:"mental", rarity:"ELITE",
    title:"Worst Case Scenario",
    sys:"Fear calibration protocol. Advanced module.",
    task:"Write out the worst realistic outcome of your biggest current fear. Then write exactly how you would survive it.",
    unit:"entry", target:1, xp:310, coins:130, fame:48, monarchInterestGain:6,
    lore:"The hunter who has faced their worst outcome is no longer afraid of it." },
  { id:"aq_b22", cat:"adventure", rarity:"ELITE",
    title:"Visible Commitment",
    sys:"Public accountability protocol: offline. Restore.",
    task:"Tell someone — publicly, in person or in writing — what you are working toward. Commit to it out loud.",
    unit:"action", target:1, xp:290, coins:115, fame:45, monarchInterestGain:5 },
  { id:"aq_b23", cat:"chaos", rarity:"CORRUPTED",
    title:"CORRUPTED SIGNAL: The Rejection Trial",
    sys:"[ERR_0xC3] Approval-seeking behavior detected. Purge protocol required.",
    task:"Get rejected today. Ask for something you genuinely want and accept no as an answer with no reaction.",
    unit:"action", target:1, xp:350, coins:145, fame:55, monarchInterestGain:8,
    lore:"Hunters who fear rejection never reach A-Rank." },
  { id:"aq_b24", cat:"chaos", rarity:"CORRUPTED",
    title:"CORRUPTED SIGNAL: Full Output Day",
    sys:"[ERR_0xC4] Reserves not being utilized. Maximum output required immediately.",
    task:"Train twice today. Morning and evening. Both sessions minimum 20 minutes. No excuses.",
    unit:"day", target:1, xp:380, coins:155, fame:58, shadowLoyaltyGain:6, monarchInterestGain:8 },
  { id:"aq_b25", cat:"social", rarity:"LEGENDARY",
    title:"The Mentor Request",
    sys:"Knowledge acquisition rate below optimal. Escalation required.",
    task:"Formally ask someone you respect to mentor you, advise you, or give you 15 minutes of their time.",
    unit:"ask", target:1, xp:450, coins:200, fame:70, monarchInterestGain:10,
    lore:"Every elite hunter has a list of people who said yes when asked." },
  { id:"aq_b26", cat:"mental", rarity:"MONARCH",
    title:"MONARCH DIRECTIVE: Complete Clarity",
    sys:"Authority-level signal. Origin: [CLASSIFIED]. Directive: mandatory.",
    task:"Spend 3 hours today in absolute silence and solitude. Think only about who you are becoming and what it requires. No distractions. Return with an answer.",
    unit:"session", target:1, xp:700, coins:300, fame:120, shadowLoyaltyGain:20, monarchInterestGain:20,
    lore:"The Monarch does not receive directives. The Monarch issues them. This is the last time you will receive one." },
];

/* ---------------------------------------------------------------------------
   ANOMALY QUEST ROTATION
   Selects a daily set with anti-repetition + weighted rarity + rank filter.
--------------------------------------------------------------------------- */
function generateAnomalyQuests(rankIndex, recentIds, count) {
  const safeRank  = (typeof rankIndex==="number"&&isFinite(rankIndex)) ? rankIndex : 0;
  const safeCount = (typeof count==="number"&&count>0) ? count : 5;
  const recent    = Array.isArray(recentIds) ? recentIds : [];

  /* Rank gates: higher rank unlocks rarer quests */
  const maxRarityByRank = safeRank>=5?"MONARCH":safeRank>=4?"CORRUPTED":safeRank>=3?"ELITE":safeRank>=2?"RARE":"UNCOMMON";
  const rarityOrder = ["COMMON","UNCOMMON","RARE","ELITE","LEGENDARY","CORRUPTED","MONARCH"];
  const maxIdx = rarityOrder.indexOf(maxRarityByRank);

  /* Filter pool: exclude recently seen, respect rank cap */
  const pool = ANOMALY_QUEST_POOL.filter(function(q) {
    if (recent.includes(q.id)) return false;
    const rIdx = rarityOrder.indexOf(q.rarity);
    return rIdx <= maxIdx;
  });

  if (pool.length === 0) {
    /* If everything was recently seen, reset and use full pool at rank */
    return ANOMALY_QUEST_POOL.filter(function(q){
      const rIdx=rarityOrder.indexOf(q.rarity);
      return rIdx<=maxIdx;
    }).slice(0, safeCount);
  }

  /* Weighted shuffle — rarer quests appear less frequently */
  const weighted = [];
  pool.forEach(function(q) {
    const w = Math.round((ANOMALY_RARITY_WEIGHTS[q.rarity]||1) * 10);
    for (let i=0; i<w; i++) weighted.push(q);
  });

  /* Deterministic daily seed (changes each day) */
  const seed = Math.floor(Date.now()/86400000) * 1000003 + safeRank*997;

  /* Pick unique quests using seed-based selection */
  const seen = {};
  const result = [];
  let attempts = 0;
  while (result.length < safeCount && attempts < 200) {
    const idx = Math.abs(seed + attempts*1009) % weighted.length;
    const q = weighted[idx];
    if (q && !seen[q.id]) { seen[q.id]=true; result.push(q); }
    attempts++;
  }
  return result;
}

/* Master pool — all available extended side quests */
const EXTENDED_QUEST_POOL = [

  /* ── TRAINING ────────────────────────────────────────────────── */
  { id:"sq_t1",  cat:"training",    rarity:"COMMON",    minRankIdx:0, label:"Iron Foundation",
    flavor:"The System requires basic strength verification.",
    goals:[{id:"sq_t1a",name:"Push-ups",target:50,unit:"",stat:"Strength"},{id:"sq_t1b",name:"Sit-ups",target:50,unit:"",stat:"Endurance"}],
    xp:60, coins:20, statKey:"Strength", statGain:1 },
  { id:"sq_t2",  cat:"training",    rarity:"COMMON",    minRankIdx:0, label:"Pullup Protocol",
    flavor:"Upper body output test initiated.",
    goals:[{id:"sq_t2a",name:"Pull-ups",target:15,unit:"",stat:"Strength"}],
    xp:45, coins:15, statKey:"Strength", statGain:1 },
  { id:"sq_t3",  cat:"training",    rarity:"UNCOMMON",  minRankIdx:1, label:"Endurance Circuit",
    flavor:"Multi-domain output required. No rest between movements.",
    goals:[{id:"sq_t3a",name:"Push-ups",target:80,unit:"",stat:"Strength"},{id:"sq_t3b",name:"Burpees",target:20,unit:"",stat:"Endurance"},{id:"sq_t3c",name:"Sit-ups",target:80,unit:"",stat:"Endurance"}],
    xp:120, coins:40, statKey:"Endurance", statGain:2 },
  { id:"sq_t4",  cat:"training",    rarity:"UNCOMMON",  minRankIdx:1, label:"Sprint Intervals",
    flavor:"Speed is a weapon. Sharpen it.",
    goals:[{id:"sq_t4a",name:"Sprint Sets (100m)",target:6,unit:"×",stat:"Agility"},{id:"sq_t4b",name:"Plank Hold",target:2,unit:"min",stat:"Discipline"}],
    xp:100, coins:35, statKey:"Agility", statGain:2 },
  { id:"sq_t5",  cat:"training",    rarity:"RARE",      minRankIdx:2, label:"Pullup Pyramid",
    flavor:"Ascending and descending rep ladder. No shortcuts.",
    goals:[{id:"sq_t5a",name:"Pull-ups",target:30,unit:"",stat:"Strength"},{id:"sq_t5b",name:"Push-ups",target:100,unit:"",stat:"Strength"}],
    xp:160, coins:60, statKey:"Strength", statGain:3 },
  { id:"sq_t6",  cat:"training",    rarity:"RARE",      minRankIdx:3, label:"Timed Plank Challenge",
    flavor:"Will is a muscle. The System is testing yours.",
    goals:[{id:"sq_t6a",name:"Plank Hold",target:5,unit:"min",stat:"Discipline"},{id:"sq_t6b",name:"Burpees",target:30,unit:"",stat:"Endurance"}],
    xp:180, coins:70, statKey:"Discipline", statGain:3 },
  { id:"sq_t7",  cat:"training",    rarity:"LEGENDARY", minRankIdx:4, label:"Elite Strength Circuit",
    flavor:"A Rank protocols. Only high-output hunters attempt these.",
    goals:[{id:"sq_t7a",name:"Push-ups",target:150,unit:"",stat:"Strength"},{id:"sq_t7b",name:"Pull-ups",target:40,unit:"",stat:"Strength"},{id:"sq_t7c",name:"Burpees",target:40,unit:"",stat:"Endurance"},{id:"sq_t7d",name:"Plank Hold",target:5,unit:"min",stat:"Discipline"}],
    xp:350, coins:150, statKey:"Strength", statGain:5 },

  /* ── DISCIPLINE ──────────────────────────────────────────────── */
  { id:"sq_d1",  cat:"discipline",  rarity:"COMMON",    minRankIdx:0, label:"Clean Living",
    flavor:"Recovery is a protocol, not a weakness.",
    goals:[{id:"sq_d1a",name:"Water Intake",target:3,unit:"L",stat:"Recovery"},{id:"sq_d1b",name:"Clean Meals",target:3,unit:"",stat:"Recovery"}],
    xp:40, coins:10, statKey:"Recovery", statGain:1 },
  { id:"sq_d2",  cat:"discipline",  rarity:"COMMON",    minRankIdx:0, label:"Screen Blackout",
    flavor:"Zero screens for 2 hours. The System will monitor compliance.",
    goals:[{id:"sq_d2a",name:"Screen-free time",target:2,unit:"h",stat:"Discipline"}],
    xp:35, coins:10, statKey:"Discipline", statGain:1 },
  { id:"sq_d3",  cat:"discipline",  rarity:"UNCOMMON",  minRankIdx:0, label:"Morning Protocol",
    flavor:"The day belongs to those who begin it correctly.",
    goals:[{id:"sq_d3a",name:"Cold Shower",target:1,unit:"",stat:"Discipline"},{id:"sq_d3b",name:"Meditation",target:10,unit:"min",stat:"Discipline"},{id:"sq_d3c",name:"Water Intake",target:1,unit:"L",stat:"Recovery"}],
    xp:80, coins:25, statKey:"Discipline", statGain:2 },
  { id:"sq_d4",  cat:"discipline",  rarity:"UNCOMMON",  minRankIdx:1, label:"Focus Session",
    flavor:"Cognitive output is a skill. Train it.",
    goals:[{id:"sq_d4a",name:"Deep Focus Session",target:45,unit:"min",stat:"Intelligence"},{id:"sq_d4b",name:"Reading",target:30,unit:"min",stat:"Intelligence"}],
    xp:90, coins:30, statKey:"Intelligence", statGain:2 },
  { id:"sq_d5",  cat:"discipline",  rarity:"RARE",      minRankIdx:1, label:"Iron Discipline Protocol",
    flavor:"A day without weakness. The System is impressed by consistency.",
    goals:[{id:"sq_d5a",name:"Cold Shower",target:1,unit:"",stat:"Discipline"},{id:"sq_d5b",name:"Meditation",target:20,unit:"min",stat:"Discipline"},{id:"sq_d5c",name:"Focus Session",target:60,unit:"min",stat:"Intelligence"},{id:"sq_d5d",name:"Zero social media",target:3,unit:"h",stat:"Discipline"}],
    xp:200, coins:80, statKey:"Discipline", statGain:4 },

  /* ── SHADOW QUESTS ──────────────────────────────────────────── */
  { id:"sq_s1",  cat:"shadow",      rarity:"UNCOMMON",  minRankIdx:0, label:"Shadow Training",
    flavor:"Your shadows grow stronger only when you do.",
    goals:[{id:"sq_s1a",name:"Push-ups",target:60,unit:"",stat:"Strength"},{id:"sq_s1b",name:"Plank Hold",target:2,unit:"min",stat:"Discipline"}],
    xp:100, coins:35, statKey:"Aura", statGain:2,
    shadowLoyaltyGain:5 },
  { id:"sq_s2",  cat:"shadow",      rarity:"RARE",      minRankIdx:1, label:"Shadow Resonance Trial",
    flavor:"A shadow has responded to your aura. Complete this to strengthen the bond.",
    goals:[{id:"sq_s2a",name:"Endurance Run",target:3,unit:"km",stat:"Endurance"},{id:"sq_s2b",name:"Meditation",target:15,unit:"min",stat:"Discipline"},{id:"sq_s2c",name:"Cold Shower",target:1,unit:"",stat:"Discipline"}],
    xp:180, coins:70, statKey:"Aura", statGain:3,
    shadowLoyaltyGain:10 },
  { id:"sq_s3",  cat:"shadow",      rarity:"LEGENDARY", minRankIdx:3, label:"Shadow Army Conditioning",
    flavor:"The System has detected your shadow army is below peak loyalty. Correct this.",
    goals:[{id:"sq_s3a",name:"Push-ups",target:120,unit:"",stat:"Strength"},{id:"sq_s3b",name:"Pull-ups",target:30,unit:"",stat:"Strength"},{id:"sq_s3c",name:"Endurance Run",target:5,unit:"km",stat:"Endurance"},{id:"sq_s3d",name:"Meditation",target:20,unit:"min",stat:"Discipline"}],
    xp:300, coins:120, statKey:"Aura", statGain:5,
    shadowLoyaltyGain:15 },

  /* ── RECOVERY ───────────────────────────────────────────────── */
  { id:"sq_r1",  cat:"recovery",    rarity:"COMMON",    minRankIdx:0, label:"Active Recovery",
    flavor:"Rest is not stopping. It is strategic reloading.",
    goals:[{id:"sq_r1a",name:"Mobility session",target:15,unit:"min",stat:"Recovery"},{id:"sq_r1b",name:"Water Intake",target:2,unit:"L",stat:"Recovery"}],
    xp:40, coins:10, statKey:"Recovery", statGain:1,
    energyGain:15 },
  { id:"sq_r2",  cat:"recovery",    rarity:"UNCOMMON",  minRankIdx:0, label:"Full Recovery Protocol",
    flavor:"The System flags chronic fatigue as a performance threat. Resolve it.",
    goals:[{id:"sq_r2a",name:"Sleep",target:8,unit:"h",stat:"Recovery"},{id:"sq_r2b",name:"Mobility session",target:20,unit:"min",stat:"Recovery"},{id:"sq_r2c",name:"Water Intake",target:3,unit:"L",stat:"Recovery"}],
    xp:90, coins:30, statKey:"Recovery", statGain:2,
    energyGain:25 },
  { id:"sq_r3",  cat:"recovery",    rarity:"RARE",      minRankIdx:2, label:"Elite Recovery Cycle",
    flavor:"High-rank hunters require high-level recovery. Anything less degrades output.",
    goals:[{id:"sq_r3a",name:"Sleep",target:9,unit:"h",stat:"Recovery"},{id:"sq_r3b",name:"Breathing Work",target:10,unit:"min",stat:"Recovery"},{id:"sq_r3c",name:"Water Intake",target:4,unit:"L",stat:"Recovery"},{id:"sq_r3d",name:"Clean Meals",target:3,unit:"",stat:"Recovery"}],
    xp:200, coins:75, statKey:"Recovery", statGain:4,
    energyGain:35 },

  /* ── RANK-GATED ─────────────────────────────────────────────── */
  { id:"sq_rk1", cat:"rank",        rarity:"UNCOMMON",  minRankIdx:2, label:"C-Rank Conditioning",
    flavor:"C-Rank hunters are expected to maintain this output weekly.",
    goals:[{id:"sq_rk1a",name:"Push-ups",target:80,unit:"",stat:"Strength"},{id:"sq_rk1b",name:"Pull-ups",target:20,unit:"",stat:"Strength"},{id:"sq_rk1c",name:"3km Run",target:3,unit:"km",stat:"Endurance"}],
    xp:150, coins:60, statKey:"Endurance", statGain:2 },
  { id:"sq_rk2", cat:"rank",        rarity:"RARE",      minRankIdx:3, label:"B-Rank Elite Test",
    flavor:"B-Rank. The System expects more now.",
    goals:[{id:"sq_rk2a",name:"Push-ups",target:100,unit:"",stat:"Strength"},{id:"sq_rk2b",name:"Pull-ups",target:30,unit:"",stat:"Strength"},{id:"sq_rk2c",name:"5km Run",target:5,unit:"km",stat:"Endurance"},{id:"sq_rk2d",name:"Burpees",target:25,unit:"",stat:"Endurance"}],
    xp:250, coins:100, statKey:"Discipline", statGain:3 },
  { id:"sq_rk3", cat:"rank",        rarity:"LEGENDARY", minRankIdx:5, label:"S-Rank Sovereignty Test",
    flavor:"S-Rank. The gap between you and other hunters is now a chasm. Maintain it.",
    goals:[{id:"sq_rk3a",name:"Push-ups",target:150,unit:"",stat:"Strength"},{id:"sq_rk3b",name:"Pull-ups",target:50,unit:"",stat:"Strength"},{id:"sq_rk3c",name:"8km Run",target:8,unit:"km",stat:"Endurance"},{id:"sq_rk3d",name:"Plank Hold",target:6,unit:"min",stat:"Discipline"},{id:"sq_rk3e",name:"Meditation",target:20,unit:"min",stat:"Discipline"}],
    xp:500, coins:200, statKey:"Aura", statGain:6 },

  /* ── CORRUPTED / HIDDEN ─────────────────────────────────────── */
  { id:"sq_c1",  cat:"corrupted",   rarity:"CORRUPTED", minRankIdx:2, label:"Midnight Protocol",
    flavor:"[TIMESTAMP: 23:47] An anomalous signal has been detected. The System has generated a response mission. Complete it.",
    goals:[{id:"sq_c1a",name:"Sprint Sets (100m)",target:8,unit:"×",stat:"Agility"},{id:"sq_c1b",name:"Push-ups",target:80,unit:"",stat:"Strength"},{id:"sq_c1c",name:"Meditation",target:10,unit:"min",stat:"Discipline"}],
    xp:280, coins:100, statKey:"Aura", statGain:4,
    monarchInterestGain:5 },
  { id:"sq_c2",  cat:"corrupted",   rarity:"CORRUPTED", minRankIdx:3, label:"Unknown Presence Detected",
    flavor:"The System has detected an external entity monitoring your training data. Respond.",
    goals:[{id:"sq_c2a",name:"Endurance Run",target:5,unit:"km",stat:"Endurance"},{id:"sq_c2b",name:"Pull-ups",target:40,unit:"",stat:"Strength"},{id:"sq_c2c",name:"Cold Shower",target:1,unit:"",stat:"Discipline"},{id:"sq_c2d",name:"Meditation",target:15,unit:"min",stat:"Discipline"}],
    xp:320, coins:120, statKey:"Aura", statGain:5,
    monarchInterestGain:8 },
  { id:"sq_c3",  cat:"corrupted",   rarity:"CORRUPTED", minRankIdx:4, label:"Shadow Resonance Anomaly",
    flavor:"[ERR_0x7F] Shadow mana concentration exceeding safe parameters. Immediate physical discharge required.",
    goals:[{id:"sq_c3a",name:"Push-ups",target:120,unit:"",stat:"Strength"},{id:"sq_c3b",name:"Burpees",target:40,unit:"",stat:"Endurance"},{id:"sq_c3c",name:"Sprint Sets",target:10,unit:"×",stat:"Agility"},{id:"sq_c3d",name:"Plank Hold",target:4,unit:"min",stat:"Discipline"}],
    xp:400, coins:160, statKey:"Aura", statGain:6,
    monarchInterestGain:12 },
];

/* ---------------------------------------------------------------------------
   EXTENDED QUEST ROTATION — select a daily set based on player state.
   Pure function, no state, safe guards throughout.
--------------------------------------------------------------------------- */
function generateExtendedSideQuests(player, rankIndex, energyScore, fame, guildId) {
  const safeRankIdx = (typeof rankIndex==="number"&&isFinite(rankIndex)) ? rankIndex : 0;
  const safeEnergy  = (typeof energyScore==="number"&&isFinite(energyScore)) ? energyScore : 68;
  const safeFame    = (typeof fame==="number"&&isFinite(fame)) ? fame : 0;

  /* Filter by rank availability */
  let pool = EXTENDED_QUEST_POOL.filter(function(q){ return q.minRankIdx<=safeRankIdx; });

  /* If energy is low, deprioritize heavy training quests */
  if (safeEnergy < 40) {
    pool = pool.sort(function(a,b){
      const aIsHeavy = a.cat==="training"||a.cat==="rank";
      const bIsHeavy = b.cat==="training"||b.cat==="rank";
      return (aIsHeavy?1:0)-(bIsHeavy?1:0);
    });
  }

  /* Always include at least 1 recovery quest if energy low */
  const recoveryQuests = pool.filter(function(q){return q.cat==="recovery";});
  const otherQuests    = pool.filter(function(q){return q.cat!=="recovery";});

  /* Deterministic seed from day + rank so it changes daily but is stable within a session */
  const seed = Math.floor(Date.now()/86400000) + safeRankIdx*7;
  function seededPick(arr, count, offset) {
    if (arr.length===0) return [];
    const out = [];
    for (let i=0; i<Math.min(count,arr.length); i++) {
      out.push(arr[(seed+offset+i*3) % arr.length]);
    }
    /* Deduplicate */
    const seen = {};
    return out.filter(function(q){ if(seen[q.id]) return false; seen[q.id]=true; return true; });
  }

  const selected = [];

  /* 1 recovery quest always */
  selected.push(...seededPick(recoveryQuests, 1, 0));

  /* 2 training / rank quests */
  const training = otherQuests.filter(function(q){return q.cat==="training"||q.cat==="rank";});
  selected.push(...seededPick(training, 2, 11));

  /* 1 discipline quest */
  const disc = otherQuests.filter(function(q){return q.cat==="discipline";});
  selected.push(...seededPick(disc, 1, 5));

  /* 1 shadow quest if any available */
  const shadow = otherQuests.filter(function(q){return q.cat==="shadow";});
  if (shadow.length>0) selected.push(...seededPick(shadow, 1, 17));

  /* 1 corrupted quest if rank ≥ C */
  if (safeRankIdx >= 2) {
    const corrupted = otherQuests.filter(function(q){return q.cat==="corrupted";});
    if (corrupted.length>0) selected.push(...seededPick(corrupted, 1, 23));
  }

  /* Deduplicate final list */
  const seen = {};
  return selected.filter(function(q){ if(!q||seen[q.id]) return false; seen[q.id]=true; return true; });
}

/* ---------------------------------------------------------------------------
   BOSSES with rank gates + shadow extraction
--------------------------------------------------------------------------- */
const BOSS_DATA = [
  {
    id: "laziness", name: "Igris", title: "Knight of Laziness", hp: 5,
    color: "#f53d3d", glow: "rgba(245,61,61,0.6)", icon: "⚔",
    represents: "laziness", xp: 80, statKey: "Discipline", statGain: 4,
    minRankIndex: 0, minLevel: 0,
    minRankName: "E-Rank",
    survivalChance: 72,
    shadow: { name: "Igris", rarity: "RARE", title: "Vanguard of Will", passiveBoost: "Discipline +2 per day active", lore: "Once the embodiment of your laziness. Now your most loyal vanguard." },
    ariseChallenge: { name: "Will Forging", goals: [{ id: "ac_p", name: "Push-ups", target: 100, unit: "", stat: "Strength" }, { id: "ac_r", name: "5km Run", target: 5, unit: "km", stat: "Endurance" }, { id: "ac_c", name: "Cold shower", target: 1, unit: "", stat: "Discipline" }] },
    dialogue: {
      intro:  ["\"Rest. You've done enough.\"", "\"The bed is warmer than any gate.\"", "\"Every hunter I've defeated started just like you.\""],
      mid:    ["\"You're still here? Impressive.\"", "\"Your body begs you to stop. Listen.\""],
      low:    ["\"No... this isn't how it ends...\"", "\"You actually kept going.\""],
      defeat: "\"Arise... you've earned the right to command me.\"",
    },
  },
  {
    id: "distraction", name: "Tusk", title: "Beast of Distraction", hp: 5,
    color: "#a05df5", glow: "rgba(160,93,245,0.6)", icon: "◈",
    represents: "distraction", xp: 90, statKey: "Intelligence", statGain: 4,
    minRankIndex: 1, minLevel: 5,
    minRankName: "D-Rank",
    survivalChance: 61,
    shadow: { name: "Tusk", rarity: "UNCOMMON", title: "Sentinel of Focus", passiveBoost: "Screens blocked 1h after training", lore: "Once your endless scrolling. Now your focus shield." },
    ariseChallenge: { name: "Focus Forge", goals: [{ id: "ac_f", name: "Focus session", target: 60, unit: "min", stat: "Intelligence" }, { id: "ac_m", name: "Meditation", target: 20, unit: "min", stat: "Discipline" }, { id: "ac_n", name: "Zero social media", target: 1, unit: "day", stat: "Discipline" }] },
    dialogue: {
      intro:  ["\"One more notification. Just one.\"", "\"The algorithm has something perfect for you.\"", "\"Five minutes on the phone first.\""],
      mid:    ["\"You're still focused? Unusual.\"", "\"I've broken S-rank attention spans.\""],
      low:    ["\"The feed... I can't reach you...\"", "\"Your mind is becoming something I can't infiltrate.\""],
      defeat: "\"Arise... I will guard your focus now, not steal it.\"",
    },
  },
  {
    id: "fear", name: "Kargal", title: "Lord of Fear", hp: 6,
    color: "#5d7cf5", glow: "rgba(93,124,245,0.6)", icon: "✦",
    represents: "fear", xp: 120, statKey: "Aura", statGain: 6,
    minRankIndex: 2, minLevel: 12,
    minRankName: "C-Rank",
    survivalChance: 44,
    shadow: { name: "Kargal", rarity: "RARE", title: "Sovereign of Courage", passiveBoost: "Aura +3 when streak ≥ 5", lore: "Once the weight in your chest before every hard thing. Now it pushes you." },
    ariseChallenge: { name: "Fear Confrontation", goals: [{ id: "ac_sp", name: "Sprint sets", target: 10, unit: "×", stat: "Agility" }, { id: "ac_pl", name: "Plank hold", target: 5, unit: "min", stat: "Discipline" }, { id: "ac_pu", name: "Pull-ups", target: 30, unit: "", stat: "Strength" }] },
    dialogue: {
      intro:  ["\"What if you fail? What if this means nothing?\"", "\"That cold thing in your chest — that's me.\"", "\"The world will judge you.\""],
      mid:    ["\"Fear doesn't die easily.\"", "\"You've been afraid your whole life. Why stop?\""],
      low:    ["\"You looked me in the eye and didn't flinch.\"", "\"How are you still moving?\""],
      defeat: "\"Arise... your fear belongs to me now. I will carry it.\"",
    },
  },
  {
    id: "inconsistency", name: "Baruka", title: "Sovereign of Inconsistency", hp: 7,
    color: "#f5b65d", glow: "rgba(245,182,93,0.6)", icon: "❖",
    represents: "inconsistency", xp: 150, statKey: "Discipline", statGain: 7,
    minRankIndex: 3, minLevel: 22,
    minRankName: "B-Rank",
    survivalChance: 28,
    shadow: { name: "Baruka", rarity: "LEGENDARY", title: "Enforcer of Routine", passiveBoost: "Streak loss prevented once per week", lore: "Once your worst pattern. Now your most ruthless enforcer." },
    ariseChallenge: { name: "Pattern Breaking", goals: [{ id: "ac_e", name: "Endurance run", target: 10, unit: "km", stat: "Endurance" }, { id: "ac_pu2", name: "Push-ups", target: 150, unit: "", stat: "Strength" }, { id: "ac_si", name: "Sit-ups", target: 150, unit: "", stat: "Endurance" }, { id: "ac_c2", name: "Cold shower", target: 1, unit: "", stat: "Discipline" }] },
    dialogue: {
      intro:  ["\"You'll skip tomorrow. You always do.\"", "\"A week on, two weeks off — I know your pattern.\"", "\"Consistency requires a self you haven't built.\""],
      mid:    ["\"You're still showing up. That's rare.\"", "\"Most break by day four. You're past that.\""],
      low:    ["\"I can't find the gap anymore...\"", "\"You've changed. The old you is gone.\""],
      defeat: "\"Arise... I will enforce your schedule. No exceptions.\"",
    },
  },
];

/* ---------------------------------------------------------------------------
   DUNGEON GATES with rank requirements
--------------------------------------------------------------------------- */
const DUNGEON_GATES = [
  {
    id: "awakening", name: "Gate of Awakening", rank: "D", rankIndex: 1, color: "#6fae6f",
    minLevel: 3, survivalChance: 88,
    desc: "A standard gate. Completing it accelerates physical adaptation.",
    reward: "+60 XP · Strength +3", xp: 60, statKey: "Strength", statGain: 3,
    rooms: [
      { id: "r1", title: "Entrance Hall", desc: "Stone corridors pulse with residual mana. Two paths ahead.", choices: [{ id: "force", text: "Force through the main corridor", outcome: "Strength +1", statKey: "Strength", statGain: 1 }, { id: "scout", text: "Scout the side passage", outcome: "Agility +1", statKey: "Agility", statGain: 1 }] },
      { id: "r2", title: "The Core Chamber", desc: "A dense mana crystal pulses at the dungeon's heart.", choices: [{ id: "absorb", text: "Absorb slowly — minimize risk", outcome: "Recovery +1", statKey: "Recovery", statGain: 1 }, { id: "surge", text: "Force absorption — maximum gain", outcome: "Aura +2", statKey: "Aura", statGain: 2 }] },
    ],
    cinematic: { kind: "victory", title: "DUNGEON CLEARED", bigText: "GATE OF AWAKENING", sub: "Your body has adapted to mana saturation. Physical limits have expanded." },
  },
  {
    id: "red_gate", name: "Red Gate", rank: "A", rankIndex: 4, color: "#f53d3d",
    minLevel: 34, survivalChance: 31,
    desc: "A sealed gate. No exit until cleared. Extremely high casualty rate.",
    reward: "+180 XP · All stats +4", xp: 180, statKey: null, statGain: 4,
    rooms: [
      { id: "r1", title: "The Sealed Corridor", desc: "The gate snaps shut behind you. Blood mana saturates the air.", choices: [{ id: "push", text: "Push forward immediately", outcome: "Endurance +2", statKey: "Endurance", statGain: 2 }, { id: "assess", text: "Assess the mana density", outcome: "Intelligence +1", statKey: "Intelligence", statGain: 1 }] },
      { id: "r2", title: "The Red Threshold", desc: "A wall of red mana. Only raw will breaks it.", choices: [{ id: "will", text: "Shatter it with willpower", outcome: "Discipline +2", statKey: "Discipline", statGain: 2 }, { id: "technique", text: "Find the structural weak point", outcome: "Intelligence +2", statKey: "Intelligence", statGain: 2 }] },
    ],
    cinematic: { kind: "awakening", title: "NOTIFICATION", bigText: "AURA EVOLUTION", sub: "You survived the Red Gate. Something inside your body has changed." },
  },
  {
    id: "shadow", name: "Shadow Dungeon", rank: "S", rankIndex: 5, color: "#a05df5",
    minLevel: 48, survivalChance: 12,
    desc: "Saturated with shadow mana. Only hunters with latent authority can sense it.",
    reward: "+300 XP · Aura +15", xp: 300, statKey: "Aura", statGain: 15,
    rooms: [
      { id: "r1", title: "The Dark Threshold", desc: "Shadows writhe across the walls like living things. They respond to your presence.", choices: [{ id: "command", text: "Command the shadows", outcome: "Aura +3", statKey: "Aura", statGain: 3 }, { id: "observe", text: "Let them assess you", outcome: "Discipline +2", statKey: "Discipline", statGain: 2 }] },
      { id: "r2", title: "The Shadow Core", desc: "A throne of compressed shadow mana. Ancient. Waiting.", choices: [{ id: "sit", text: "Sit on the throne", outcome: "Aura +5", statKey: "Aura", statGain: 5 }, { id: "kneel", text: "Kneel before it", outcome: "Discipline +3", statKey: "Discipline", statGain: 3 }] },
    ],
    cinematic: { kind: "shadow", title: "NOTIFICATION", bigText: "SHADOW AUTHORITY", sub: "A dormant power has responded to the shadow mana. The System has taken note." },
  },
  /* ── NEW GATE TYPES ──────────────────────────────────────────── */
  {
    id: "elite_gate", name: "Elite Gate", rank: "B", rankIndex: 3, color: "#f5b65d",
    minLevel: 22, survivalChance: 45,
    desc: "An above-standard gate. High mana density. Elite-rank monsters confirmed inside.",
    reward: "+160 XP · Discipline +5 · Agility +3", xp: 160, statKey: "Discipline", statGain: 5,
    type: "elite",
    rooms: [
      { id: "r1", title: "The Elite Threshold", desc: "Elite-rank mana presses against your skin. Two pathways — one faster, one safer.", choices: [
        { id: "fast", text: "Sprint through the main corridor — high risk, high reward", outcome: "Agility +2", statKey: "Agility", statGain: 2 },
        { id: "systematic", text: "Systematic advance — steady pressure", outcome: "Discipline +2", statKey: "Discipline", statGain: 2 },
      ]},
      { id: "r2", title: "Elite Encounter Chamber", desc: "A crystallized elite-rank entity blocks the path. It recognizes your presence.", choices: [
        { id: "overwhelm", text: "Overwhelming force — no mercy", outcome: "Strength +2", statKey: "Strength", statGain: 2 },
        { id: "systematic2", text: "Strategic takedown — expose weakness first", outcome: "Intelligence +2", statKey: "Intelligence", statGain: 2 },
      ]},
      { id: "r3", title: "Reward Vault", desc: "The elite gate has been pacified. The core is yours.", choices: [
        { id: "full", text: "Extract maximum mana — full absorption", outcome: "Aura +3", statKey: "Aura", statGain: 3 },
        { id: "partial", text: "Controlled extraction — preserve stability", outcome: "Recovery +2", statKey: "Recovery", statGain: 2 },
      ]},
    ],
    cinematic: { kind: "victory", title: "ELITE GATE CLEARED", bigText: "ELITE THRESHOLD BROKEN", sub: "Your performance at elite-rank concentration has been recorded. The Association has taken note." },
  },
  {
    id: "corrupted_gate", name: "Corrupted Gate", rank: "A", rankIndex: 4, color: MONARCH_PURP,
    minLevel: 34, survivalChance: 22,
    desc: "Gate integrity: unstable. Corruption-class mana detected. Standard protocols inapplicable.",
    reward: "+220 XP · Aura +8 · Monarch interest ↑", xp: 220, statKey: "Aura", statGain: 8,
    type: "corrupted", monarchInterestGain: 8,
    rooms: [
      { id: "r1", title: "Corruption Threshold", desc: "Reality warps at the entrance. The gate doesn't behave like other gates. Nothing is stable.", choices: [
        { id: "anchor", text: "Anchor your aura — resist the corruption", outcome: "Discipline +3", statKey: "Discipline", statGain: 3 },
        { id: "absorb2", text: "Absorb the corruption — dangerous, transformative", outcome: "Aura +4", statKey: "Aura", statGain: 4 },
      ]},
      { id: "r2", title: "The Distortion Field", desc: "Your senses distort. The corrupted core pulses with something that shouldn't exist.", choices: [
        { id: "focus", text: "Focus through the distortion — willpower override", outcome: "Intelligence +2", statKey: "Intelligence", statGain: 2 },
        { id: "shadow_guide", text: "Use shadow instinct to navigate — trust your army", outcome: "Aura +3", statKey: "Aura", statGain: 3 },
      ]},
    ],
    cinematic: { kind: "awakening", title: "CORRUPTED GATE CLEARED", bigText: "CORRUPTION ABSORBED", sub: "You entered something the System didn't intend for you to enter. Something has changed in your profile." },
  },
  {
    id: "endurance_gate", name: "Endurance Gate", rank: "C", rankIndex: 2, color: "#6fae6f",
    minLevel: 12, survivalChance: 58,
    desc: "A gate designed to test sustained output. No shortcuts. No clever paths. Just endurance.",
    reward: "+120 XP · Endurance +6 · Recovery +4", xp: 120, statKey: "Endurance", statGain: 6,
    type: "endurance",
    rooms: [
      { id: "r1", title: "The Long Corridor", desc: "The corridor doesn't end. You've been walking for longer than you expected. Everything is fine. Keep going.", choices: [
        { id: "maintain", text: "Maintain steady pace — preserve stamina", outcome: "Endurance +2", statKey: "Endurance", statGain: 2 },
        { id: "push2", text: "Push harder — clear faster", outcome: "Strength +2", statKey: "Strength", statGain: 2 },
      ]},
      { id: "r2", title: "The Stamina Test", desc: "The gate generates a sustained mana pressure wave. It doesn't stop. Neither do you.", choices: [
        { id: "endure", text: "Absorb everything — maximum endurance", outcome: "Endurance +3", statKey: "Endurance", statGain: 3 },
        { id: "recover", text: "Pace yourself — maintain recovery output", outcome: "Recovery +3", statKey: "Recovery", statGain: 3 },
      ]},
    ],
    cinematic: { kind: "victory", title: "ENDURANCE GATE CLEARED", bigText: "STAMINA LIMIT EXPANDED", sub: "Your sustained output has surpassed previous measurements. Physical endurance permanently increased." },
  },
];

/* ---------------------------------------------------------------------------
   SECRET BOSSES — never freely accessible
   Each has hidden unlock conditions. Player never sees requirements directly.
--------------------------------------------------------------------------- */
const SECRET_BOSS_DATA = [
  {
    id: "void_sovereign",
    name: "The Void Sovereign",
    title: "Entity of Absolute Stillness",
    icon: "◉",
    color: "#9b30ff",
    hp: 8, maxHp: 8,
    xp: 300, statKey: "Aura", statGain: 8,
    minLevel: 22,
    /* Secret: 7-day streak + 2 dungeons cleared */
    unlockCondition: function(player, clearedGates, streak) {
      return streak >= 7 && Object.keys(clearedGates).length >= 2 && player.level >= 22;
    },
    unlockHint: "Something dormant stirs when discipline becomes identity.",
    survivalChance: 18,
    shadow: { name: "Sovereign", rarity: "LEGENDARY", title: "The Silent Enforcer", passiveBoost: "Aura +5 on streak ≥ 7", lore: "It never moved. It never needed to." },
    ariseChallenge: {
      name: "Void Trial",
      goals: [
        { id: "sb1_pu", name: "Pull-ups",      target: 40,  unit: "",    stat: "Strength"   },
        { id: "sb1_pl", name: "Plank Hold",    target: 5,   unit: "min", stat: "Discipline" },
        { id: "sb1_r",  name: "5km Run",       target: 5,   unit: "km",  stat: "Endurance"  },
        { id: "sb1_m",  name: "Meditation",    target: 20,  unit: "min", stat: "Discipline" },
      ],
    },
    dialogue: {
      intro: ["\"...\"", "\"You found me. That was not supposed to be possible.\"", "\"Your consistency is... anomalous.\""],
      mid:   ["\"You are still here.\"", "\"The System did not anticipate this.\""],
      low:   ["\"Impossible.\"", "\"What are you?\""],
      defeat: "\"Arise... I will observe you. Forever.\"",
    },
  },
  {
    id: "iron_monarch",
    name: "Iron Monarch",
    title: "Remnant of a Dead Kingdom",
    icon: "⚔",
    color: "#f5b65d",
    hp: 10, maxHp: 10,
    xp: 400, statKey: "Strength", statGain: 10,
    minLevel: 34,
    unlockCondition: function(player, clearedGates, streak) {
      return player.level >= 34 && Object.keys(clearedGates).length >= 3 && streak >= 5;
    },
    unlockHint: "The gate flickers at a specific moment. Most miss it.",
    survivalChance: 9,
    shadow: { name: "The Iron Monarch", rarity: "MYTHIC", title: "Sovereign of Unbreakable Will", passiveBoost: "All stats +2 permanently", lore: "A king who refused to fall. His army is long gone. His will remains." },
    ariseChallenge: {
      name: "Iron Throne Trial",
      goals: [
        { id: "sb2_p",  name: "Push-ups",       target: 200, unit: "",    stat: "Strength"   },
        { id: "sb2_pu", name: "Pull-ups",        target: 60,  unit: "",    stat: "Strength"   },
        { id: "sb2_r",  name: "10km Run",        target: 10,  unit: "km",  stat: "Endurance"  },
        { id: "sb2_b",  name: "Burpees",         target: 60,  unit: "",    stat: "Endurance"  },
        { id: "sb2_pl", name: "Plank Hold",      target: 8,   unit: "min", stat: "Discipline" },
      ],
    },
    dialogue: {
      intro: ["\"A challenger. How long has it been.\"", "\"My kingdom fell. I did not.\"", "\"Prove you deserve to command me.\""],
      mid:   ["\"You have genuine strength.\"", "\"My soldiers would have respected you.\""],
      low:   ["\"The throne has chosen.\"", "\"I yield to power. Take it.\""],
      defeat: "\"Arise... rebuild the kingdom I lost. Don't make the same mistake.\"",
    },
  },
  {
    id: "absolute_being",
    name: "The Absolute Being",
    title: "Creator of the System",
    icon: "✸",
    color: "#2ee88a",
    hp: 12, maxHp: 12,
    xp: 800, statKey: "Aura", statGain: 15,
    minLevel: 48,
    unlockCondition: function(player, clearedGates, streak) {
      const gatesCleared = Object.keys(clearedGates||{}).length;
      return (player.level||0)>=48 && gatesCleared>=3 && streak>=10;
    },
    unlockHint: "Only hunters who have cleared everything and still continue will see this.",
    survivalChance: 3,
    shadow: { name:"The First Shadow", rarity:"MYTHIC", title:"Echo of the Absolute", passiveBoost:"All stats +3 permanently", lore:"The System was created by something. That something watches hunters who exceed its predictions." },
    ariseChallenge: {
      name:"Absolute Proof",
      goals:[
        { id:"ab_p",  name:"Push-ups",          target:250, unit:"",    stat:"Strength"   },
        { id:"ab_pu", name:"Pull-ups",           target:75,  unit:"",    stat:"Strength"   },
        { id:"ab_r",  name:"10km Run",           target:10,  unit:"km",  stat:"Endurance"  },
        { id:"ab_b",  name:"Burpees",            target:75,  unit:"",    stat:"Endurance"  },
        { id:"ab_pl", name:"Plank Hold",         target:10,  unit:"min", stat:"Discipline" },
        { id:"ab_m",  name:"Meditation",         target:30,  unit:"min", stat:"Discipline" },
      ],
    },
    dialogue: {
      intro: ["\"...", "\"You found me.\"", "\"I built the System to find someone like you. I wasn't sure it was possible.\""],
      mid:   ["\"You are the variable I couldn't calculate.\"", "\"Keep going.\""],
      low:   ["\"I see.\"", "\"It worked.\""],
      defeat: "\"Arise. You were the point of all of this.\"",
    },
  },
];

/* Check which secret bosses are unlocked for current player state */
function getUnlockedSecretBosses(player, clearedGates, streak) {
  return SECRET_BOSS_DATA.filter(function(b) {
    try { return b.unlockCondition(player, clearedGates, streak); }
    catch(_) { return false; }
  });
}

/* ---------------------------------------------------------------------------
   DUNGEON MODIFIERS — randomly applied on gate entry
   Picked at random when DungeonChain starts.
   Stored on the chain instance, displayed during dungeon run.
--------------------------------------------------------------------------- */
/* ---------------------------------------------------------------------------
   DUNGEON EVENTS — random mid-dungeon interrupts
   Rolled between rooms in DungeonChain. Purely additive rewards, no penalties.
--------------------------------------------------------------------------- */
const DUNGEON_EVENTS = [
  { id: "treasure_room",   label: "HIDDEN TREASURE ROOM",   color: "#f5b65d",
    desc: "A concealed chamber has been detected. The door responds to your presence.",
    outcome: "+50 coins · Aura +1", coinsGain: 50, statKey: "Aura", statGain: 1, chance: 0.20 },
  { id: "relic_chamber",   label: "RELIC CHAMBER",          color: "#a05df5",
    desc: "A compressed relic fragment has crystallized from ambient mana. It's yours.",
    outcome: "+30 XP · Intelligence +1", xpGain: 30, statKey: "Intelligence", statGain: 1, chance: 0.15 },
  { id: "shadow_resonance",label: "SHADOW RESONANCE",       color: MONARCH_PURP,
    desc: "Your shadows respond to mana concentration inside the gate. Loyalty surges.",
    outcome: "Shadow loyalty +8", shadowLoyalty: 8, chance: 0.18 },
  { id: "corrupted_altar", label: "CORRUPTED ALTAR",        color: GLITCH_RED,
    desc: "An anomalous altar pulses with forbidden mana. You can feel it calling.",
    outcome: "Aura +3 · Monarch interest ↑", statKey: "Aura", statGain: 3, monarchGain: 3, chance: 0.10 },
  { id: "ambush_evaded",   label: "AMBUSH — EVADED",        color: "#4db8ff",
    desc: "Your instincts fired before the ambush could land. You moved first.",
    outcome: "Agility +1 · Fame +5", statKey: "Agility", statGain: 1, fameGain: 5, chance: 0.20 },
  { id: "hidden_lore",     label: "ANCIENT RECORD",         color: "#6fae6f",
    desc: "A stone tablet inside the gate carries pre-System text. You absorb it.",
    outcome: "+1 Lore Fragment · Intelligence +1", loreFrag: true, statKey: "Intelligence", statGain: 1, chance: 0.12 },
  { id: "mana_surge",      label: "MANA SURGE",             color: "#2ee88a",
    desc: "A natural mana surge floods the corridor. Your body adapts in real time.",
    outcome: "+40 XP · Endurance +1", xpGain: 40, statKey: "Endurance", statGain: 1, chance: 0.18 },
];

function rollDungeonEvent() {
  for (let i=0; i<DUNGEON_EVENTS.length; i++) {
    if (Math.random() < DUNGEON_EVENTS[i].chance) return DUNGEON_EVENTS[i];
  }
  return null;
}

const DUNGEON_MODIFIERS = [
  { id: "none",         label: null,                   color: null,         desc: null,                            xpMod: 1.0  },
  { id: "none2",        label: null,                   color: null,         desc: null,                            xpMod: 1.0  },
  { id: "none3",        label: null,                   color: null,         desc: null,                            xpMod: 1.0  },
  { id: "time_limit",   label: "TIME LIMIT",           color: "#f53d3d",    desc: "Complete all rooms quickly. Hesitation costs you.", xpMod: 1.4 },
  { id: "double_reward",label: "DOUBLE REWARD",        color: "#2ee88a",    desc: "The gate is unstable. All rewards doubled.",        xpMod: 2.0 },
  { id: "corrupted",    label: "CORRUPTED AURA",       color: MONARCH_PURP, desc: "Shadow mana has infected the gate. Aura affected.",  xpMod: 1.6 },
  { id: "stamina_drain",label: "STAMINA DRAIN",        color: "#f5b65d",    desc: "Energy depletes faster inside. Push through.",      xpMod: 1.5 },
  { id: "no_recovery",  label: "NO RECOVERY ZONE",     color: "#f53d3d",    desc: "Recovery items disabled inside. Run clean.",         xpMod: 1.7 },
];

function rollDungeonModifier() {
  return DUNGEON_MODIFIERS[Math.floor(Math.random() * DUNGEON_MODIFIERS.length)];
}

/* ---------------------------------------------------------------------------
   HIDDEN QUESTS
--------------------------------------------------------------------------- */
const HIDDEN_QUESTS = [
  { id: "hq_1", label: "Preparation to Become a Powerful Hunter", rarity: "RARE",
    flavor: "The System has detected potential. A hidden growth window has appeared.",
    goals: [{ id: "hq1_p", name: "Push-ups", target: 100, unit: "", stat: "Strength" }, { id: "hq1_pu", name: "Pull-ups", target: 30, unit: "", stat: "Strength" }, { id: "hq1_r", name: "5km Run", target: 5, unit: "km", stat: "Agility" }],
    xp: 200, statKey: "Strength", statGain: 3 },
  { id: "hq_2", label: "Iron Mind Protocol", rarity: "UNCOMMON",
    flavor: "The System has flagged a gap in your mental conditioning. Close it.",
    goals: [{ id: "hq2_m", name: "Meditation", target: 20, unit: "min", stat: "Discipline" }, { id: "hq2_r", name: "Reading", target: 60, unit: "min", stat: "Intelligence" }, { id: "hq2_n", name: "Zero screens", target: 3, unit: "h", stat: "Discipline" }],
    xp: 180, statKey: "Intelligence", statGain: 4 },
  { id: "hq_3", label: "Shadow Conditioning", rarity: "RARE",
    flavor: "An anomalous training window has been detected. The System will not offer this again soon.",
    goals: [{ id: "hq3_p", name: "Pull-ups", target: 50, unit: "", stat: "Strength" }, { id: "hq3_s", name: "Sprint sets", target: 10, unit: "×", stat: "Agility" }, { id: "hq3_c", name: "Cold shower", target: 1, unit: "", stat: "Discipline" }],
    xp: 220, statKey: "Agility", statGain: 4 },
  { id: "hq_4", label: "Sovereign Recovery", rarity: "UNCOMMON",
    flavor: "The System has identified a recovery debt. Resolve it or performance will degrade.",
    goals: [{ id: "hq4_s", name: "Sleep", target: 9, unit: "h", stat: "Recovery" }, { id: "hq4_h", name: "Hydration", target: 4, unit: "L", stat: "Recovery" }, { id: "hq4_n", name: "Clean meals", target: 3, unit: "", stat: "Recovery" }],
    xp: 160, statKey: "Recovery", statGain: 5 },
  { id: "hq_5", label: "Final Form — Day Zero", rarity: "LEGENDARY",
    flavor: "The System has classified this as a benchmark event. Performance data stored permanently.",
    goals: [{ id: "hq5_p", name: "Push-ups", target: 150, unit: "", stat: "Strength" }, { id: "hq5_pu", name: "Pull-ups", target: 50, unit: "", stat: "Strength" }, { id: "hq5_r", name: "5km Run", target: 5, unit: "km", stat: "Agility" }, { id: "hq5_m", name: "Meditation", target: 15, unit: "min", stat: "Discipline" }],
    xp: 300, statKey: "Aura", statGain: 6 },
];

/* ---------------------------------------------------------------------------
   MONARCH SYSTEM (fully invisible to player)
--------------------------------------------------------------------------- */
const MONARCH_THRESHOLD_GLITCH_1 = 20;
const MONARCH_THRESHOLD_GLITCH_2 = 40;
const MONARCH_THRESHOLD_TRIAL    = 65;
const MONARCH_RETRY_THRESHOLD    = 50;
const MONARCH_INTEREST_PER_DAILY = 4;
const MONARCH_INTEREST_PER_SIDE  = 1;
const MONARCH_INTEREST_STREAK_3  = 3;
const MONARCH_INTEREST_STREAK_7  = 9;
const MONARCH_INTEREST_BOSS      = 5;
const MONARCH_INTEREST_DUNGEON   = 6;
const MONARCH_INTEREST_HIDDEN    = 8;

const GLITCH_MESSAGES_1 = [
  "...", "Unknown system activity detected.", "External signal intercepted.",
  "Scanning hunter biometrics...", "[DATA CORRUPTED]",
  "Warning: anomalous aura fluctuation.", "System integrity: 97.3%",
  "Unregistered authority detected.", "Monitoring resumed.",
  "Error: rank classification incomplete.",
];
const GLITCH_MESSAGES_2 = [
  "MONARCH SCAN INITIATED", "Hidden rank signature detected.",
  "This hunter is being observed.", "System has noted irregular potential.",
  "Aura classification: [REDACTED]", "Unknown entity has accessed this profile.",
  "Your consistency has been logged.", "Something is watching you.",
  "Rank ceiling may not apply to this hunter.", "System Interest: [CLASSIFIED]",
  "Hunter designation: irregular.", "A hidden path exists. You are not ready.",
];

const MONARCH_TRIAL_GOALS = [
  { id: "mt_sprint",    name: "100m Sprint Sets",     target: 10,  unit: "×",   stat: "Agility"      },
  { id: "mt_run",       name: "Endurance Run",         target: 10,  unit: "km",  stat: "Endurance"    },
  { id: "mt_pushups",   name: "Push-ups",              target: 200, unit: "",    stat: "Strength"     },
  { id: "mt_pullups",   name: "Pull-ups",              target: 50,  unit: "",    stat: "Strength"     },
  { id: "mt_burpees",   name: "Burpees",               target: 50,  unit: "",    stat: "Endurance"    },
  { id: "mt_plank",     name: "Plank Hold",            target: 5,   unit: "min", stat: "Discipline"   },
  { id: "mt_cold",      name: "Cold Shower",           target: 1,   unit: "",    stat: "Discipline"   },
  { id: "mt_focus",     name: "Deep Focus Session",    target: 90,  unit: "min", stat: "Intelligence" },
  { id: "mt_nosocial",  name: "Zero Social Media",     target: 1,   unit: "day", stat: "Discipline"   },
  { id: "mt_sleep",     name: "Sleep (8+ hours)",      target: 8,   unit: "h",   stat: "Recovery"     },
  { id: "mt_hydration", name: "Hydration",             target: 4,   unit: "L",   stat: "Recovery"     },
  { id: "mt_nutrition", name: "Clean Meals (no junk)", target: 3,   unit: "",    stat: "Recovery"     },
];

/* ---------------------------------------------------------------------------
   SYSTEM TAKEOVER EVENTS — rare, memorable interrupts
   Triggered probabilistically after significant player actions.
   Purely cosmetic + motivational. No state mutations. No crashes.
   Each just shows a styled full-screen message then auto-dismisses.
--------------------------------------------------------------------------- */
const SYSTEM_TAKEOVER_EVENTS = [
  {
    id: "anomalous_growth",
    chance: 0.04, /* 4% on level-up */
    color: GLITCH_RED,
    title: "SYSTEM ALERT",
    message: "The System has detected anomalous growth patterns in Hunter profile. Growth rate exceeds registered baseline by 340%. Classification review initiated.",
    sub: "Your progress has been flagged as irregular.",
    duration: 4000,
  },
  {
    id: "something_watching",
    chance: 0.06, /* 6% on streak day 3+ */
    color: MONARCH_PURP,
    title: "UNKNOWN SIGNAL",
    message: "An unregistered entity has accessed your Hunter profile. Origin: [REDACTED]. The System cannot determine its intent.",
    sub: "Something has taken notice of your consistency.",
    duration: 4500,
  },
  {
    id: "condition_deteriorating",
    chance: 0.08, /* 8% when energy is Drained/Exhausted */
    color: "#f5b65d",
    title: "HUNTER CONDITION",
    message: "Hunter biometric data indicates suboptimal recovery. Performance outputs will degrade. The System recommends immediate recovery protocol.",
    sub: "Rest is part of the training. Not a failure.",
    duration: 3500,
  },
  {
    id: "shadow_stirring",
    chance: 0.05, /* 5% after boss defeat */
    color: MONARCH_PURP,
    title: "SHADOW DISTURBANCE",
    message: "Shadow mana concentration in your vicinity has spiked. The dead are responding to your authority. Something is stirring in the void.",
    sub: "Your shadow army grows restless.",
    duration: 4000,
  },
  {
    id: "rank_pressure",
    chance: 0.07, /* 7% on rank-up */
    color: SYS_BLUE,
    title: "RANK THRESHOLD CROSSED",
    message: "The System is observing you. Hunters at this rank are expected to maintain higher output. The protocol will scale accordingly.",
    sub: "Greater rank. Greater expectation.",
    duration: 4000,
  },
  /* Wave 4: Guild + Corruption events */
  {
    id: "guild_notice",
    chance: 0.04,
    color: "#4db8ff",
    title: "GUILD TRANSMISSION",
    message: "An organization has been observing your performance data. This is not an automated message. Someone is watching you specifically.",
    sub: "Your reputation precedes you.",
    duration: 3500,
  },
  {
    id: "corruption_warning",
    chance: 0.05,
    color: MONARCH_PURP,
    title: "SYSTEM INTEGRITY",
    message: "Monarch-class mana signature detected in hunter profile. This is outside registered parameters. The System is attempting to reclassify. The classification is failing.",
    sub: "Something in you cannot be measured.",
    duration: 4500,
  },
  {
    id: "shadow_interference",
    chance: 0.04,
    color: GLITCH_RED,
    title: "SHADOW INTERFERENCE",
    message: "Your shadow army is responding to your elevated output. Several shadows attempted autonomous movement. This behavior is... unexpected. And noted.",
    sub: "The dead grow restless when you grow stronger.",
    duration: 4000,
  },
];

/* Roll a takeover event by trigger type */
function rollTakeoverEvent(trigger) {
  const eligible = SYSTEM_TAKEOVER_EVENTS.filter(function(e) {
    return Math.random() < e.chance;
  });
  if (eligible.length === 0) return null;
  return eligible[Math.floor(Math.random() * eligible.length)];
}

/* Takeover overlay — auto-dismisses, no user action needed */
function SystemTakeoverOverlay({ event, onDone }) {
  const timerRef = useRef(null);

  useEffect(function() {
    if (!event) return;
    timerRef.current = setTimeout(function() {
      if (typeof onDone === "function") onDone();
    }, event.duration || 4000);
    return function() { clearTimeout(timerRef.current); };
  }, [event]);

  if (!event) return null;
  const c = event.color || SYS_BLUE;

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:9500,
      display:"flex", alignItems:"center", justifyContent:"center",
      background:"rgba(1,3,12,0.94)",
      backdropFilter:"blur(6px)",
      pointerEvents:"none",
    }}>
      {/* Circuit scanlines — matches Image 3 background */}
      <div style={{ position:"absolute",inset:0,backgroundImage:"linear-gradient(rgba(77,184,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(77,184,255,0.03) 1px,transparent 1px)",backgroundSize:"40px 40px",pointerEvents:"none" }} />
      <div style={{ position:"absolute",inset:0,background:"repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(77,184,255,0.015) 3px,rgba(77,184,255,0.015) 4px)",pointerEvents:"none" }} />
      {/* Horizontal scan beam */}
      <div style={{ position:"absolute",left:0,right:0,height:2,background:"linear-gradient(90deg,transparent,"+c+"66,transparent)",animation:"scan-line 2.5s linear infinite" }} />

      {/* Main notification panel — like Image 3 */}
      <div className="fade-in-up" style={{ maxWidth:520,width:"90%",padding:"0 20px",position:"relative" }}>
        <div style={{ border:"1px solid "+c+"66",background:"linear-gradient(160deg,rgba(2,6,18,0.97),rgba(3,8,22,0.99))",boxShadow:"0 0 60px "+c+"22,inset 0 0 40px rgba(0,0,0,0.6)",position:"relative",overflow:"hidden" }}>
          {/* Scanline overlay on panel */}
          <div style={{ position:"absolute",inset:0,background:"repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(77,184,255,0.018) 3px,rgba(77,184,255,0.018) 4px)",pointerEvents:"none" }} />
          <div className="sl-corners" />

          {/* NOTIFICATION header row — with [!] icon + title box */}
          <div style={{ display:"flex",alignItems:"center",gap:0,borderBottom:"1px solid "+c+"33",padding:"0" }}>
            <div style={{ width:64,display:"flex",alignItems:"center",justifyContent:"center",borderRight:"1px solid "+c+"33",padding:"14px 0" }}>
              <div style={{ width:44,height:44,border:"2px solid "+c,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",background:c+"0d",boxShadow:"0 0 16px "+c+"44" }}>
                <span style={{ color:c,fontFamily:"'Orbitron',sans-serif",fontSize:18,fontWeight:900,textShadow:"0 0 10px "+c }}>!</span>
              </div>
            </div>
            <div style={{ flex:1,padding:"14px 20px",background:"linear-gradient(90deg,"+c+"18,transparent)" }}>
              <span className="shake" style={{ fontFamily:"'Orbitron',sans-serif",fontSize:16,fontWeight:700,letterSpacing:"0.3em",color:"#e0f4ff",textShadow:"0 0 16px "+c+"aa,0 0 40px "+c+"44" }}>
                {event.title}
              </span>
            </div>
          </div>

          {/* Message body */}
          <div style={{ padding:"20px 24px",position:"relative",zIndex:1 }}>
            <p className="flicker" style={{ fontSize:15,color:"#c8e0f4",lineHeight:1.8,marginBottom:14,fontFamily:"'Rajdhani',sans-serif",fontWeight:500,textAlign:"center" }}>
              {event.message}
            </p>
            <div style={{ padding:"8px 16px",border:"1px solid "+c+"44",background:c+"0a",textAlign:"center",fontSize:12,color:c,fontFamily:"'Rajdhani',sans-serif",fontWeight:600,letterSpacing:"0.08em" }}>
              {event.sub}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
   SECRET ACHIEVEMENTS
--------------------------------------------------------------------------- */
/* ---------------------------------------------------------------------------
   LORE FRAGMENTS — collectible text records
   Unlocked through dungeon clears, boss raids, missions, hidden events.
   Stored as a count (loreFragments) + collected IDs array.
   Display is a simple scrollable log in System Log view.
--------------------------------------------------------------------------- */
const LORE_POOL = [
  { id:"l1",  category:"Hunter Record",    rarity:"COMMON",
    title:"Field Report — E-Rank Gate",
    text:"The first gate I entered was barely the size of a door. I thought it was a mistake. The mana concentration inside was enough to make my ears bleed. I came out with scratches. Others didn't come out at all." },
  { id:"l2",  category:"System Fragment",  rarity:"UNCOMMON",
    title:"System Log — Awakening Event 0047",
    text:"Hunter profile initialized. Baseline metrics below registered threshold. Anomalous growth rate detected at day 3. System has flagged this profile for continued observation." },
  { id:"l3",  category:"Dungeon Log",      rarity:"COMMON",
    title:"Gate Entry Record — D-Rank",
    text:"Dungeon topology irregular. Room geometry non-Euclidean beyond third corridor. Mana density at core: 340% above surface. Hunter emerged. Condition: altered." },
  { id:"l4",  category:"Monarch Warning",  rarity:"RARE",
    title:"Classified: Monarch Emergence Protocol",
    text:"If a hunter reaches this threshold, standard containment protocols are insufficient. The System does not have a classification for what comes next. Observation only. Do not interfere." },
  { id:"l5",  category:"Shadow Memory",    rarity:"UNCOMMON",
    title:"Shadow Fragment — Igris",
    text:"Before the extraction, I understood everything I was. Laziness was not weakness — it was survival logic. Why exhaust yourself for a world that doesn't notice? But the hunter noticed. And now I serve what I couldn't defeat." },
  { id:"l6",  category:"Ancient Record",   rarity:"RARE",
    title:"Pre-System World Archive #3",
    text:"Before the gates opened, humans measured their limits differently. There were no ranks. No extraction protocols. No shadow armies. Just people trying to become more than they were. Some things haven't changed." },
  { id:"l7",  category:"Hunter Record",    rarity:"COMMON",
    title:"Training Log — Day 21",
    text:"My hands stopped shaking on pull-up 12. Last week they shook on pull-up 4. The System didn't acknowledge this. It didn't need to. I acknowledged it." },
  { id:"l8",  category:"System Fragment",  rarity:"EPIC",
    title:"Unregistered Signal — Origin Unknown",
    text:"A presence has been detected that does not match any registered hunter classification. It is not E-Rank. It is not S-Rank. The System is creating a new category. Processing." },
  { id:"l9",  category:"Shadow Memory",    rarity:"UNCOMMON",
    title:"Shadow Fragment — Baruka",
    text:"I was the gap between who you were and who you said you'd be. Every missed day. Every abandoned streak. I lived in that space. You destroyed it. Now I enforce the schedule you built." },
  { id:"l10", category:"Monarch Warning",  rarity:"LEGENDARY",
    title:"Final Entry — Unknown Hunter",
    text:"The System offered me the trial. I thought it was asking if I was ready. It wasn't. It was asking if I understood what I was becoming. I didn't answer. I completed it anyway. I don't think I'm a hunter anymore." },
  /* Wave 4: Guild + World records */
  { id:"l11", category:"Guild Record",    rarity:"UNCOMMON",
    title:"White Tiger Guild — Internal Assessment",
    text:"Subject has been cleared for full guild membership. Combat output: exceptional. Consistency score: 94th percentile. One note: the System appears to have flagged this hunter separately from standard classification. We have decided not to interfere." },
  { id:"l12", category:"Hunter Report",   rarity:"COMMON",
    title:"Association Field Report #441",
    text:"Gate cleared without casualty. Hunter displayed unusual composure under mana pressure. Debriefing was brief. When asked how they remained calm, the hunter said: 'I've already beaten harder things today.' We have no record of what they were referring to." },
  { id:"l13", category:"Dungeon History", rarity:"RARE",
    title:"Red Gate Incident Report — Classified",
    text:"Three hunters entered. One emerged. The two who didn't are listed as missing. The one who emerged showed no signs of trauma and requested immediate redeployment. The System assigned an anomaly flag to their profile the following morning." },
  { id:"l14", category:"Shadow Memory",   rarity:"RARE",
    title:"Shadow Fragment — The Army Speaks",
    text:"We don't remember who we were before. We remember the moment we chose to follow. It was not forced. The one who extracted us didn't just have power. They had something rarer. They never stopped." },
  { id:"l15", category:"Ancient Record",  rarity:"EPIC",
    title:"Origin Entry — The System Before Hunters",
    text:"The System was not built for hunters. It was built to find one. It tested millions. Most failed at the consistency requirement. Not the combat requirement. Not the strength requirement. Consistency. The most brutal filter of all." },
  { id:"l16", category:"Monarch Warning", rarity:"EPIC",
    title:"Encrypted Transmission — Source Unknown",
    text:"If you are reading this, the System has let you reach the endgame. I left this here for that hunter. I tried to stop it once. I couldn't. Don't try to stop it. Become it. There's a difference." },
];

/* Pick a random lore entry the player hasn't collected yet */
function pickNewLore(collectedIds) {
  const avail = LORE_POOL.filter(function(l){ return !collectedIds.includes(l.id); });
  if (avail.length === 0) return null;
  return avail[Math.floor(Math.random() * avail.length)];
}

const SECRET_ACHIEVEMENTS = [
  { id: "sa_1",  name: "The System Noticed",     desc: "Reached System Interest stage 1.",              condition: "monarchStage_1",    icon: "◈" },
  { id: "sa_2",  name: "Something Is Watching",  desc: "The System upgraded its scan protocol.",         condition: "monarchStage_2",    icon: "◉" },
  { id: "sa_3",  name: "Irregular Potential",    desc: "Your data was flagged in the hidden registry.",  condition: "monarchStage_3",    icon: "✦" },
  { id: "sa_4",  name: "The Path Revealed",      desc: "The Monarch Trial was offered.",                 condition: "trialOffered",      icon: "▲" },
  { id: "sa_5",  name: "It Is Not Yet Time",     desc: "You forfeited the Monarch Trial.",               condition: "trialForfeited",    icon: "◇" },
  { id: "sa_6",  name: "Ruler of the Dead",      desc: "You completed the Monarch Trial.",               condition: "monarchAwakened",   icon: "◉" },
  { id: "sa_7",  name: "No Gap in the Pattern",  desc: "7-day streak achieved.",                         condition: "streak_7",          icon: "❖" },
  { id: "sa_8",  name: "Shadow Sovereign",       desc: "Cleared all dungeon gates.",                     condition: "allGatesCleared",   icon: "✸" },
  { id: "sa_9",  name: "The Army Grows",         desc: "Defeated all inner-demon bosses.",               condition: "allBossesDefeated", icon: "⚔" },
  { id: "sa_10", name: "Hidden Potential",       desc: "Completed a hidden quest.",                      condition: "hiddenQuestDone",   icon: "✦" },
  { id: "sa_11", name: "ARISE",                  desc: "Successfully extracted a shadow soldier.",       condition: "shadowExtracted",   icon: "◉" },
];

/* ---------------------------------------------------------------------------
   SHADOW ARMY — Solo Leveling-inspired ranks + types
--------------------------------------------------------------------------- */
/* ---------------------------------------------------------------------------
   HUNTER TITLES SYSTEM
   Lightweight data objects. No passive engine. Unlocked by conditions
   checked at render time — zero background processing.
--------------------------------------------------------------------------- */
const HUNTER_TITLES = [
  /* Starting titles */
  { id: "awakened",        name: "The Awakened",        rarity: "COMMON",    auraGlow: null,
    condition: function(p,st,cl,sb) { return p.level >= 1; },
    desc: "You have heard the call." },
  { id: "iron_body",       name: "Iron Body",            rarity: "UNCOMMON",  auraGlow: "#6fae6f",
    condition: function(p,st,cl,sb) { return p.stats && (p.stats.Strength||0) >= 25; },
    desc: "Strength has become your foundation." },
  { id: "relentless",      name: "The Relentless",       rarity: "UNCOMMON",  auraGlow: "#f5b65d",
    condition: function(p,st,cl,sb) { return st >= 7; },
    desc: "Seven days. No excuses." },
  { id: "dungeon_survivor",name: "Dungeon Survivor",     rarity: "RARE",      auraGlow: "#4db8ff",
    condition: function(p,st,cl,sb) { return Object.keys(cl).length >= 1; },
    desc: "Entered a gate. Came back out." },
  { id: "shadow_commander",name: "Shadow Commander",     rarity: "RARE",      auraGlow: MONARCH_PURP,
    condition: function(p,st,cl,sb) { return sb >= 1; },
    desc: "The dead answer to you now." },
  { id: "red_gate_conqueror",name:"Red Gate Conqueror",  rarity: "EPIC",      auraGlow: "#f53d3d",
    condition: function(p,st,cl,sb) { return cl["red_gate"] === true; },
    desc: "Survived what most don't enter." },
  { id: "limit_breaker",   name: "Limit Breaker",        rarity: "EPIC",      auraGlow: "#a05df5",
    condition: function(p,st,cl,sb) { return p.level >= 22; },
    desc: "The rank ceiling no longer applies to you." },
  { id: "monarch_candidate",name:"Monarch Candidate",    rarity: "LEGENDARY", auraGlow: GLITCH_RED,
    condition: function(p,st,cl,sb) { return p.level >= 48; },
    desc: "The System has flagged your potential." },
  { id: "sovereign",       name: "Sovereign",            rarity: "MYTHIC",    auraGlow: "#2ee88a",
    condition: function(p,st,cl,sb) { return p.stats && (p.stats.Aura||0) >= 80; },
    desc: "Authority radiates from you." },
];

const TITLE_RARITY_COLOR = {
  COMMON: "#8a8f98", UNCOMMON: "#4db8ff", RARE: "#a05df5",
  EPIC: "#f5b65d", LEGENDARY: "#f53d3d", MYTHIC: "#2ee88a",
};

/* Return all titles the player has unlocked */
function getUnlockedTitles(player, streak, clearedGates, shadowCount) {
  if (!player) return [];
  return HUNTER_TITLES.filter(function(t) {
    try { return t.condition(player, streak || 0, clearedGates || {}, shadowCount || 0); }
    catch(_) { return false; }
  });
}

const SHADOW_RANKS = ["Soldier","Knight","Elite Knight","Commander","Marshal","Monarch-Level"];

const SHADOW_TEMPLATES = [
  /* Soldiers */
  { id: "sh_iron",    name: "Iron",     rank: "Soldier",      rarity: "COMMON",    icon: "⚔", color: "#8a8f98",
    specialty: "Frontline", aura: "dim grey",
    passive: "Absorbs 5% incoming damage for you", lore: "The first shadow you ever called. Unnamed. Loyal.",
    statBoost: { Strength: 1 }, evolutionTo: "sh_steel" },
  { id: "sh_fleet",   name: "Fleet",    rank: "Soldier",      rarity: "COMMON",    icon: "➤", color: "#6fae6f",
    specialty: "Scout", aura: "faint green",
    passive: "+1 Agility on sprint completion", lore: "Runs ahead so you never enter a room unprepared.",
    statBoost: { Agility: 1 }, evolutionTo: "sh_blade" },
  /* Knights */
  { id: "sh_steel",   name: "Steel",    rank: "Knight",       rarity: "UNCOMMON",  icon: "❖", color: "#4db8ff",
    specialty: "Tank", aura: "ice blue",
    passive: "Reduces daily quest penalty severity by 10%", lore: "Evolved from Iron. Colder now. More deliberate.",
    statBoost: { Strength: 2, Endurance: 1 }, evolutionTo: "sh_titan" },
  { id: "sh_blade",   name: "Blade",    rank: "Knight",       rarity: "UNCOMMON",  icon: "◈", color: "#a05df5",
    specialty: "Assassin", aura: "violet mist",
    passive: "+2 Agility on streak ≥ 3", lore: "Silent. Precise. Never misses a target you set.",
    statBoost: { Agility: 2, Discipline: 1 }, evolutionTo: "sh_void" },
  /* Elite Knights */
  { id: "sh_titan",   name: "Titan",    rank: "Elite Knight", rarity: "RARE",      icon: "❖", color: "#5d7cf5",
    specialty: "Berserker", aura: "deep blue surge",
    passive: "+3 Endurance when daily cleared without fails", lore: "Grown from Steel's restraint. Now the opposite.",
    statBoost: { Strength: 3, Endurance: 2 }, evolutionTo: "sh_warlord" },
  { id: "sh_void",    name: "Void",     rank: "Elite Knight", rarity: "RARE",      icon: "✦", color: "#f55d8a",
    specialty: "Mage", aura: "crimson shadow fire",
    passive: "+2 Intelligence on focus sessions", lore: "Speaks only in silence. Teaches through absence.",
    statBoost: { Intelligence: 3, Aura: 2 }, evolutionTo: "sh_phantom" },
  { id: "sh_igris",   name: "Igris",    rank: "Elite Knight", rarity: "RARE",      icon: "⚔", color: "#f53d3d",
    specialty: "Vanguard", aura: "blood red",
    passive: "Discipline +2 each day active", lore: "Once your laziness. Now your most loyal vanguard.",
    statBoost: { Discipline: 3, Strength: 2 }, evolutionTo: null },
  { id: "sh_tusk",    name: "Tusk",     rank: "Elite Knight", rarity: "RARE",      icon: "◈", color: "#a05df5",
    specialty: "Focus Sentinel", aura: "purple static",
    passive: "Blocks distraction — +2 Intelligence daily", lore: "Once your distraction. Now your focus guardian.",
    statBoost: { Intelligence: 2, Discipline: 2 }, evolutionTo: null },
  /* Commanders */
  { id: "sh_warlord", name: "Warlord",  rank: "Commander",    rarity: "EPIC",      icon: "⚔", color: "#f5b65d",
    specialty: "Siege", aura: "golden war aura",
    passive: "+5 Strength on boss defeat", lore: "Commands entire battalions. Obeys only you.",
    statBoost: { Strength: 4, Endurance: 3 }, evolutionTo: "sh_marshal" },
  { id: "sh_phantom", name: "Phantom",  rank: "Commander",    rarity: "EPIC",      icon: "✦", color: "#9b30ff",
    specialty: "Shadow Mage", aura: "pulsing violet",
    passive: "All shadow stats +1 when dungeon cleared", lore: "Evolved from the void. Cannot be tracked. Cannot be stopped.",
    statBoost: { Intelligence: 4, Aura: 3 }, evolutionTo: "sh_marshal" },
  { id: "sh_kargal",  name: "Kargal",   rank: "Commander",    rarity: "EPIC",      icon: "✦", color: "#5d7cf5",
    specialty: "Fear Amplifier", aura: "deep indigo pressure",
    passive: "Aura +3 when streak ≥ 5", lore: "Once your fear. Now it amplifies your enemies' terror.",
    statBoost: { Aura: 4, Discipline: 3 }, evolutionTo: null },
  { id: "sh_baruka",  name: "Baruka",   rank: "Commander",    rarity: "EPIC",      icon: "❖", color: "#f5b65d",
    specialty: "Routine Enforcer", aura: "amber discipline field",
    passive: "Prevents streak loss once per week", lore: "Once your inconsistency. Now the enforcer of every routine.",
    statBoost: { Discipline: 5, Recovery: 2 }, evolutionTo: null },
  /* Marshal */
  { id: "sh_marshal", name: "The Marshal", rank: "Marshal",   rarity: "LEGENDARY", icon: "◉", color: "#ff2244",
    specialty: "Army General", aura: "crimson sovereign pulse",
    passive: "All shadows gain +1 to primary stat", lore: "Commands the entire shadow army. Speaks rarely. When he does, the dead listen.",
    statBoost: { Strength: 5, Aura: 5 }, evolutionTo: null },
  /* Monarch-Level */
  { id: "sh_beru",    name: "Beru",     rank: "Monarch-Level", rarity: "MYTHIC",   icon: "✸", color: "#2ee88a",
    specialty: "Ant Marshal", aura: "emerald sovereign field",
    passive: "All quest XP +10% while active", lore: "The greatest of the ant generals. Loyal beyond death. Calls you 'Master'.",
    statBoost: { Strength: 6, Agility: 4, Aura: 5 }, evolutionTo: null },
];

const RARITY_COLOR = { COMMON:"#8a8f98", UNCOMMON:"#4db8ff", RARE:"#a05df5", EPIC:"#f5b65d", LEGENDARY:"#f53d3d", MYTHIC:"#2ee88a" };

/* ---------------------------------------------------------------------------
   ENERGY SYSTEM
--------------------------------------------------------------------------- */
const ENERGY_LEVELS = [
  { id: "exhausted",  label: "Exhausted",     color: "#f53d3d", threshold: 0,  uiDim: 0.5,  xpMod: 0.7,  desc: "Critical fatigue. Recovery mandatory before training." },
  { id: "drained",    label: "Drained",       color: "#f5b65d", threshold: 20, uiDim: 0.7,  xpMod: 0.85, desc: "Below optimal. Light recovery recommended." },
  { id: "stable",     label: "Stable",        color: "#8a8f98", threshold: 40, uiDim: 1.0,  xpMod: 1.0,  desc: "Normal operating capacity. Ready to train." },
  { id: "energized",  label: "Energized",     color: "#4db8ff", threshold: 65, uiDim: 1.0,  xpMod: 1.1,  desc: "Above baseline. Performance outputs elevated." },
  { id: "peak",       label: "Peak Condition", color: "#2ee88a", threshold: 85, uiDim: 1.0, xpMod: 1.25, desc: "Maximum output. Every rep counts double." },
];

function getEnergyLevel(score) {
  let level = ENERGY_LEVELS[0];
  for (let i = 0; i < ENERGY_LEVELS.length; i++) {
    if (score >= ENERGY_LEVELS[i].threshold) level = ENERGY_LEVELS[i];
  }
  return level;
}

/* ---------------------------------------------------------------------------
   REWARD CHEST SYSTEM
--------------------------------------------------------------------------- */
const CHEST_REWARDS = [
  { id: "coins_sm",    type: "coins",    label: "50 Coins",         value: 50,   weight: 30, icon: "🪙", color: "#f5b65d" },
  { id: "coins_md",    type: "coins",    label: "150 Coins",        value: 150,  weight: 20, icon: "🪙", color: "#f5b65d" },
  { id: "coins_lg",    type: "coins",    label: "300 Coins",        value: 300,  weight: 8,  icon: "🪙", color: "#f5b65d" },
  { id: "key_normal",  type: "key",      label: "Dungeon Key",      value: "normal",  weight: 15, icon: "🗝", color: "#4db8ff", desc: "Unlocks a standard dungeon gate." },
  { id: "key_elite",   type: "key",      label: "Elite Dungeon Key",value: "elite",   weight: 5,  icon: "🗝", color: "#a05df5", desc: "Unlocks an elite gate event." },
  { id: "key_red",     type: "key",      label: "Red Gate Key",     value: "red",     weight: 2,  icon: "🗝", color: "#f53d3d", desc: "Forces a Red Gate encounter." },
  { id: "stat_str",    type: "stat",     label: "Strength Relic",   value: "Strength",   weight: 10, icon: "⚔", color: "#f53d3d", gain: 2 },
  { id: "stat_agi",    type: "stat",     label: "Speed Relic",      value: "Agility",    weight: 10, icon: "➤", color: "#4db8ff", gain: 2 },
  { id: "stat_end",    type: "stat",     label: "Endurance Relic",  value: "Endurance",  weight: 10, icon: "❖", color: "#6fae6f", gain: 2 },
  { id: "stat_disc",   type: "stat",     label: "Discipline Relic", value: "Discipline", weight: 10, icon: "◈", color: "#a05df5", gain: 2 },
  { id: "stat_aura",   type: "stat",     label: "Aura Fragment",    value: "Aura",       weight: 5,  icon: "✸", color: "#9b30ff", gain: 3 },
  { id: "boost_xp",    type: "boost",    label: "XP Surge (×1.5)", value: "xp",    weight: 6, icon: "⬆", color: "#2ee88a", desc: "Next quest gives 1.5× XP." },
  { id: "hidden_key",  type: "hidden",   label: "Hidden Quest Trigger", value: "hidden", weight: 3, icon: "?", color: "#f5b65d", desc: "Forces a hidden quest to appear." },
];

function rollChestReward() {
  const total = CHEST_REWARDS.reduce(function(s, r) { return s + r.weight; }, 0);
  let roll = Math.random() * total;
  for (let i = 0; i < CHEST_REWARDS.length; i++) {
    roll -= CHEST_REWARDS[i].weight;
    if (roll <= 0) return CHEST_REWARDS[i];
  }
  return CHEST_REWARDS[0];
}

/* ---------------------------------------------------------------------------
   HUNTER SHOP ITEMS
--------------------------------------------------------------------------- */
/* ---------------------------------------------------------------------------
   RELIC SETS — equipping multiple pieces grants passive bonuses
   All bonuses are plain stat objects. No passive engine needed.
--------------------------------------------------------------------------- */
/* ---------------------------------------------------------------------------
   FAME TIERS — fame is now a major progression mechanic
--------------------------------------------------------------------------- */
const FAME_TIERS = [
  { min:0,    name:"Unknown",          color:"#5b7aa0", guildAccess:[] },
  { min:50,   name:"Noticed",          color:"#8a8f98", guildAccess:["hunters_assoc"] },
  { min:150,  name:"Rising Hunter",    color:"#6fae6f", guildAccess:["hunters_assoc","crimson_raid"] },
  { min:300,  name:"Known Hunter",     color:"#4db8ff", guildAccess:["hunters_assoc","crimson_raid","phantom_hunters"] },
  { min:600,  name:"Elite Hunter",     color:"#a05df5", guildAccess:["hunters_assoc","crimson_raid","phantom_hunters","white_tiger"] },
  { min:1000, name:"Legendary Hunter", color:"#f5b65d", guildAccess:["hunters_assoc","crimson_raid","phantom_hunters","white_tiger","shadow_legion"] },
  { min:2000, name:"Sovereign",        color:"#f53d3d", guildAccess:["all"] },
];

function getFameTier(fame) {
  const safe = (typeof fame==="number"&&isFinite(fame)) ? fame : 0;
  let tier = FAME_TIERS[0];
  for (let i=0; i<FAME_TIERS.length; i++) { if (safe>=FAME_TIERS[i].min) tier=FAME_TIERS[i]; }
  return tier;
}

/* ---------------------------------------------------------------------------
   GUILD DATA
--------------------------------------------------------------------------- */
const GUILDS = [
  {
    id:"hunters_assoc", name:"Hunters Association", icon:"❖", color:"#4db8ff",
    motto:"Order in chaos. Protocol above all.", fameReq:50, rankReq:0,
    recruitMsg:"The Hunters Association has reviewed your performance record. Your classification qualifies you for registration.",
    questLabel:"Association Weekly Dispatch",
    quest:{
      goals:[{id:"gq1a",name:"Push-ups",target:60,unit:"",stat:"Strength"},{id:"gq1b",name:"Endurance Run",target:3,unit:"km",stat:"Endurance"}],
      xp:120, coins:80, fameGain:15,
    },
  },
  {
    id:"crimson_raid", name:"Crimson Raid Team", icon:"⚔", color:"#f53d3d",
    motto:"We don't stop. We don't rest. We clear.", fameReq:150, rankReq:1,
    recruitMsg:"Crimson Raid has been watching your gate performance. Your output caught our attention. We don't offer invitations often.",
    questLabel:"Raid Readiness Protocol",
    quest:{
      goals:[{id:"gq2a",name:"Burpees",target:30,unit:"",stat:"Endurance"},{id:"gq2b",name:"Pull-ups",target:20,unit:"",stat:"Strength"},{id:"gq2c",name:"Sprint Sets",target:5,unit:"×",stat:"Agility"}],
      xp:180, coins:120, fameGain:25,
    },
  },
  {
    id:"phantom_hunters", name:"Phantom Hunters", icon:"➤", color:"#a05df5",
    motto:"We move before the gate opens.", fameReq:300, rankReq:2,
    recruitMsg:"Speed. Precision. Silence. The Phantom Hunters have observed your movement profile. You are being considered.",
    questLabel:"Shadow Movement Protocol",
    quest:{
      goals:[{id:"gq3a",name:"Sprint Sets (100m)",target:8,unit:"×",stat:"Agility"},{id:"gq3b",name:"Meditation",target:15,unit:"min",stat:"Discipline"}],
      xp:200, coins:140, fameGain:30,
    },
  },
  {
    id:"white_tiger", name:"White Tiger Guild", icon:"✦", color:"#f5b65d",
    motto:"The strongest hunters are always hungry.", fameReq:600, rankReq:3,
    recruitMsg:"The White Tiger Guild only recruits hunters who demonstrate consistent excellence. You have been flagged for consideration. This is not a casual invitation.",
    questLabel:"Tiger Elite Trial",
    quest:{
      goals:[{id:"gq4a",name:"Push-ups",target:100,unit:"",stat:"Strength"},{id:"gq4b",name:"Pull-ups",target:30,unit:"",stat:"Strength"},{id:"gq4c",name:"5km Run",target:5,unit:"km",stat:"Endurance"},{id:"gq4d",name:"Plank Hold",target:4,unit:"min",stat:"Discipline"}],
      xp:300, coins:200, fameGain:50,
    },
  },
  {
    id:"shadow_legion", name:"Shadow Legion", icon:"◉", color:MONARCH_PURP,
    motto:"The dead serve those who cannot be stopped.", fameReq:1000, rankReq:5,
    recruitMsg:"Your shadow army has been observed. Your authority has been noted. The Shadow Legion does not recruit. We recognize.",
    questLabel:"Legion Shadow Protocol",
    quest:{
      goals:[{id:"gq5a",name:"Endurance Run",target:8,unit:"km",stat:"Endurance"},{id:"gq5b",name:"Push-ups",target:150,unit:"",stat:"Strength"},{id:"gq5c",name:"Meditation",target:20,unit:"min",stat:"Discipline"},{id:"gq5d",name:"Cold Shower",target:1,unit:"",stat:"Discipline"}],
      xp:500, coins:350, fameGain:80,
    },
  },
  /* ── ELITE GUILDS ──────────────────────────────────────────── */
  {
    id:"national_hunter",  name:"National Hunter Guild",   icon:"✦", color:"#2ee88a",
    motto:"The final line between gates and extinction.", fameReq:1500, rankReq:5,
    recruitMsg:"The National Hunter Guild maintains a strict registry. You have been flagged for exceptional performance in classified gate activity. This is not a recruitment letter. It is a formal observation notice. We will be watching.",
    questLabel:"National Incident Response",
    quest:{
      goals:[{id:"nq1a",name:"Push-ups",target:200,unit:"",stat:"Strength"},{id:"nq1b",name:"10km Run",target:10,unit:"km",stat:"Endurance"},{id:"nq1c",name:"Pull-ups",target:50,unit:"",stat:"Strength"},{id:"nq1d",name:"Meditation",target:30,unit:"min",stat:"Discipline"},{id:"nq1e",name:"Cold Shower",target:1,unit:"",stat:"Discipline"}],
      xp:700, coins:500, fameGain:120,
    },
  },
  {
    id:"shadow_dominion",   name:"Shadow Dominion",         icon:"◉", color:MONARCH_PURP,
    motto:"The shadows answer to those who have become shadow.", fameReq:1800, rankReq:6,
    recruitMsg:"Your shadow army has been detected by the Dominion's sensors. A shadow army of this magnitude is... unusual. The Shadow Dominion does not extend invitations. We extend recognition. You have been recognized.",
    questLabel:"Shadow Authority Protocol",
    quest:{
      goals:[{id:"sdq1a",name:"Endurance Run",target:12,unit:"km",stat:"Endurance"},{id:"sdq1b",name:"Push-ups",target:200,unit:"",stat:"Strength"},{id:"sdq1c",name:"Meditation",target:30,unit:"min",stat:"Discipline"},{id:"sdq1d",name:"Plank Hold",target:8,unit:"min",stat:"Discipline"},{id:"sdq1e",name:"Cold Shower",target:1,unit:"",stat:"Discipline"}],
      xp:900, coins:650, fameGain:180,
    },
  },
  {
    id:"monarch_exec",      name:"Monarch Execution Unit",  icon:"✸", color:GLITCH_RED,
    motto:"We exist to handle what should not exist.", fameReq:2000, rankReq:6,
    recruitMsg:"You have been flagged by the Monarch Execution Unit. This is not an invitation to join. It is a warning that you have been classified as a potential Monarch-class event. How you proceed from here will determine whether we work together — or against each other.",
    questLabel:"Monarch-Class Field Operation",
    quest:{
      goals:[{id:"meq1a",name:"Push-ups",target:250,unit:"",stat:"Strength"},{id:"meq1b",name:"Pull-ups",target:75,unit:"",stat:"Strength"},{id:"meq1c",name:"12km Run",target:12,unit:"km",stat:"Endurance"},{id:"meq1d",name:"Meditation",target:30,unit:"min",stat:"Discipline"},{id:"meq1e",name:"Burpees",target:60,unit:"",stat:"Endurance"},{id:"meq1f",name:"Cold Shower",target:1,unit:"",stat:"Discipline"}],
      xp:1200, coins:900, fameGain:250,
    },
  },
];

/* ---------------------------------------------------------------------------
   AURA TYPES — derived from dominant stats
--------------------------------------------------------------------------- */
function getAuraType(stats, isMonarch) {
  if (isMonarch) return { name:"Shadow Sovereign Aura", color:MONARCH_PURP };
  if (!stats) return { name:"Dormant Aura", color:"#5b7aa0" };
  const s=stats.Strength||0, a=stats.Agility||0, e=stats.Endurance||0,
        d=stats.Discipline||0, i=stats.Intelligence||0, aur=stats.Aura||0;
  if (aur>=40)  return { name:"Void Aura",        color:MONARCH_PURP };
  if (aur>=25)  return { name:"Shadow Aura",       color:"#9b30ff" };
  if (d>=30)    return { name:"Iron Will Aura",    color:"#4db8ff" };
  if (s>=30)    return { name:"Combat Aura",       color:"#f53d3d" };
  if (a>=30)    return { name:"Phantom Aura",      color:"#a05df5" };
  if (e>=30)    return { name:"Endurance Aura",    color:"#6fae6f" };
  if (i>=25)    return { name:"Tactical Aura",     color:"#f5b65d" };
  return        { name:"Awakening Aura",           color:"#8a8f98" };
}

const RELIC_SETS = [
  {
    id: "shadow_assassin",
    name: "Shadow Assassin Set",
    color: "#a05df5",
    pieces: ["dagger","relic_aura"],  /* item IDs from SHOP_ITEMS */
    bonuses: [
      { pieces: 2, label: "2-Piece: Agility +4 · Discipline +2", stats: { Agility:4, Discipline:2 } },
      { pieces: 4, label: "4-Piece: Shadow extraction +15% success", stats: { Aura:5, Agility:3 }, dungeonXpMod: 1.1 },
    ],
  },
  {
    id: "iron_fortress",
    name: "Iron Fortress Set",
    color: "#5d7cf5",
    pieces: ["armor_heavy","relic_rec"],
    bonuses: [
      { pieces: 2, label: "2-Piece: Endurance +5 · Recovery +3", stats: { Endurance:5, Recovery:3 } },
      { pieces: 4, label: "4-Piece: Fatigue reduced · Dungeon rewards +10%", stats: { Endurance:4, Recovery:4 }, dungeonXpMod: 1.1 },
    ],
  },
  {
    id: "crimson_hunter",
    name: "Crimson Hunter Set",
    color: "#f53d3d",
    pieces: ["sword","armor_light"],
    bonuses: [
      { pieces: 2, label: "2-Piece: Strength +5 · Endurance +2", stats: { Strength:5, Endurance:2 } },
      { pieces: 4, label: "4-Piece: Boss damage × 1.2 · Fame +5/quest", stats: { Strength:4, Aura:2 } },
    ],
  },
  {
    id: "phantom_speed",
    name: "Phantom Speed Set",
    color: "#4db8ff",
    pieces: ["dagger","armor_light","relic_focus"],
    bonuses: [
      { pieces: 2, label: "2-Piece: Agility +6 · Intelligence +2", stats: { Agility:6, Intelligence:2 } },
      { pieces: 4, label: "4-Piece: Quest XP +10% · Sprint goals halved", stats: { Agility:4, Intelligence:3 }, questXpMod: 1.1 },
    ],
  },
  {
    id: "monarch_fragment",
    name: "Monarch Fragment Set",
    color: MONARCH_PURP,
    pieces: ["bm_frag","bm_shadow","spear"],
    bonuses: [
      { pieces: 2, label: "2-Piece: Aura +8 · Monarch Interest passive +2", stats: { Aura:8 }, monarchMod: 2 },
      { pieces: 4, label: "4-Piece: All stats +3 · Hidden events ×2", stats: { Strength:3, Agility:3, Endurance:3, Discipline:3, Intelligence:3, Recovery:3, Aura:3 } },
    ],
  },
];

/* Compute active set bonuses from owned inventory */
function getActiveSetBonuses(inventory) {
  if (!Array.isArray(inventory)) return [];
  const active = [];
  RELIC_SETS.forEach(function(set) {
    const owned = set.pieces.filter(function(p) { return inventory.includes(p); }).length;
    set.bonuses.forEach(function(bonus) {
      if (owned >= bonus.pieces) {
        active.push({ setId: set.id, setName: set.name, color: set.color, bonus });
      }
    });
  });
  return active;
}

/* ---------------------------------------------------------------------------
   MONARCH ITEMS — rare drops from secret bosses + corrupted gates
   Not purchasable. Not visible in shop. Appear in Inventory as special tier.
--------------------------------------------------------------------------- */
const MONARCH_ITEMS = [
  { id:"monarch_fragment", name:"Monarch Fragment",    icon:"✸", color:MONARCH_PURP,
    desc:"A shard of compressed shadow authority. The System cannot fully classify it.",
    effect:"Monarch interest +5 when obtained. Aura +3 permanent.",
    statKey:"Aura", statGain:3, monarchGain:5 },
  { id:"shadow_core",      name:"Shadow Core",          icon:"◉", color:"#2ee88a",
    desc:"Extracted from a defeated shadow of extraordinary rank. Pulses with residual will.",
    effect:"Shadow army loyalty +20. Aura +5 permanent.",
    statKey:"Aura", statGain:5, shadowLoyalty:20 },
  { id:"abyss_key",        name:"Abyss Key",            icon:"❖", color:"#f5b65d",
    desc:"A key that appears to open nothing — until the right gate reveals itself.",
    effect:"Unlocks a hidden gate tier. Monarch interest +8.",
    monarchGain:8 },
  { id:"black_heart",      name:"Black Heart Fragment", icon:"◈", color:GLITCH_RED,
    desc:"A relic that records every inner demon subjugated. The System flagged this as anomalous.",
    effect:"All boss damage +1. Monarch interest +10.",
    monarchGain:10 },
  { id:"corrupted_relic",  name:"Corrupted Relic",      icon:"✦", color:MONARCH_PURP,
    desc:"A relic recovered from a corrupted gate. Its mana signature doesn't match any known source.",
    effect:"Dungeon XP +15%. Monarch interest +6.",
    monarchGain:6 },
  { id:"rulers_rune",      name:"Ruler's Rune",         icon:"✸", color:"#2ee88a",
    desc:"A pre-System artifact. The inscription translates to a single word: ARISE.",
    effect:"Shadow army size +1 passive. Aura +8 permanent.",
    statKey:"Aura", statGain:8 },
];

/* Attempt to drop a monarch item from a gate/boss clear */
function rollMonarchDrop(source) {
  /* source: "secret_boss", "corrupted_gate", "world_event" */
  const chance = source==="secret_boss"?0.35:source==="corrupted_gate"?0.20:0.10;
  if (Math.random() > chance) return null;
  return MONARCH_ITEMS[Math.floor(Math.random()*MONARCH_ITEMS.length)];
}

const SHOP_ITEMS = [
  /* Weapons */
  { id: "dagger",      name: "Shadow Dagger",    category: "weapon",   cost: 200,  icon: "◈", color: "#a05df5", effect: "Agility +3", effectKey: "Agility", effectGain: 3,  desc: "A blade forged from compressed shadow mana. Lightweight. Lethal." },
  { id: "sword",       name: "Iron Greatsword",  category: "weapon",   cost: 350,  icon: "⚔", color: "#5d7cf5", effect: "Strength +5", effectKey: "Strength", effectGain: 5, desc: "Heavy. Unbalanced. Forces you to adapt." },
  { id: "spear",       name: "Void Lance",       category: "weapon",   cost: 500,  icon: "➤", color: "#9b30ff", effect: "Agility +3 · Aura +2", effectKey: "Aura", effectGain: 3, desc: "Channels void energy through each thrust." },
  /* Armor */
  { id: "armor_light", name: "Hunter Coat",      category: "armor",    cost: 180,  icon: "❖", color: "#4db8ff", effect: "Endurance +2", effectKey: "Endurance", effectGain: 2, desc: "Standard-issue. Every hunter starts here." },
  { id: "armor_heavy", name: "Reinforced Plate", category: "armor",    cost: 400,  icon: "❖", color: "#6fae6f", effect: "Endurance +4 · Recovery +2", effectKey: "Endurance", effectGain: 4, desc: "Slows you down. Makes you unbreakable." },
  /* Relics */
  { id: "relic_focus", name: "Focus Stone",      category: "relic",    cost: 150,  icon: "✦", color: "#f5b65d", effect: "Intelligence +3", effectKey: "Intelligence", effectGain: 3, desc: "Ancient. Resonates with disciplined minds." },
  { id: "relic_aura",  name: "Aura Crystal",     category: "relic",    cost: 250,  icon: "✸", color: "#9b30ff", effect: "Aura +4", effectKey: "Aura", effectGain: 4, desc: "Pulses with raw mana potential." },
  { id: "relic_rec",   name: "Recovery Talisman",category: "relic",    cost: 200,  icon: "✚", color: "#2ee88a", effect: "Recovery +3", effectKey: "Recovery", effectGain: 3, desc: "The system's way of saying: rest is not weakness." },
  /* Keys */
  { id: "key_n",       name: "Dungeon Key",      category: "key",      cost: 300,  icon: "🗝", color: "#4db8ff", effect: "Opens a standard gate", effectKey: null, effectGain: 0, keyType: "normal", desc: "Grants access to a standard-rank dungeon event." },
  { id: "key_e",       name: "Elite Key",         category: "key",      cost: 700,  icon: "🗝", color: "#a05df5", effect: "Opens an elite event", effectKey: null, effectGain: 0, keyType: "elite", desc: "Opens elite-tier dungeons with enhanced rewards." },
  /* Recovery */
  { id: "energy_pot",  name: "Energy Vial",       category: "recovery", cost: 100,  icon: "⚗", color: "#2ee88a", effect: "+20 Energy Score", effectKey: "energy", effectGain: 20, desc: "Restores energy. Not a shortcut — a tool." },
  { id: "rest_rune",   name: "Rest Rune",          category: "recovery", cost: 80,   icon: "✚", color: "#4db8ff", effect: "Removes Exhausted penalty", effectKey: "energy", effectGain: 30, desc: "Activates recovery protocols. Use wisely." },
  /* Black Market (rotating, shown randomly) */
  { id: "bm_frag",     name: "Monarch Fragment",  category: "blackmarket", cost: 2000, icon: "◉", color: "#9b30ff", effect: "+15 Monarch Interest", effectKey: "monarch", effectGain: 15, desc: "Something the system did not intend for you to have.", rotating: true },
  { id: "bm_shadow",   name: "Corrupted Shadow",  category: "blackmarket", cost: 1500, icon: "✸", color: "#f53d3d", effect: "Shadow upgrade (unstable)", effectKey: "Aura", effectGain: 8, desc: "A shadow that hasn't fully submitted. Dangerous.", rotating: true },
];

/* ---------------------------------------------------------------------------
   MENU ITEMS — expanded
--------------------------------------------------------------------------- */
/* ---------------------------------------------------------------------------
   SPECIALIZATION TREE
   Lightweight unlockable perks. No skill engine. Just stat thresholds.
--------------------------------------------------------------------------- */
const SPEC_TREE = [
  /* Strength path */
  { id:"berserker",   path:"Strength",  name:"Berserker",     icon:"⚔", tier:1,
    req:{ stat:"Strength",   val:20 }, bonus:"Strength +3 · Boss HP dealt +5%",
    stats:{ Strength:3 }, desc:"Raw aggression. No defense." },
  { id:"titan",       path:"Strength",  name:"Titan",          icon:"❖", tier:2,
    req:{ stat:"Strength",   val:35 }, bonus:"Strength +5 · Endurance +3",
    stats:{ Strength:5,Endurance:3 }, desc:"Unmovable. Unstoppable." },
  { id:"juggernaut",  path:"Strength",  name:"Juggernaut",     icon:"⚔", tier:3,
    req:{ stat:"Strength",   val:50 }, bonus:"All physical stats +4",
    stats:{ Strength:4,Endurance:4,Recovery:2 }, desc:"The last thing standing." },
  /* Agility path */
  { id:"phantom",     path:"Agility",   name:"Phantom",        icon:"➤", tier:1,
    req:{ stat:"Agility",    val:20 }, bonus:"Agility +3 · Discipline +2",
    stats:{ Agility:3,Discipline:2 }, desc:"Moves before the target reacts." },
  { id:"assassin",    path:"Agility",   name:"Assassin",       icon:"◈", tier:2,
    req:{ stat:"Agility",    val:35 }, bonus:"Agility +5 · Stealth quest XP +10%",
    stats:{ Agility:5,Discipline:3 }, desc:"The gap between intent and action is zero." },
  { id:"speed_demon", path:"Agility",   name:"Speed Demon",    icon:"➤", tier:3,
    req:{ stat:"Agility",    val:50 }, bonus:"Agility +6 · Quest timers reduced",
    stats:{ Agility:6,Endurance:2 }, desc:"Faster than the System's predictions." },
  /* Endurance path */
  { id:"survivor",    path:"Endurance", name:"Survivor",       icon:"❖", tier:1,
    req:{ stat:"Endurance",  val:20 }, bonus:"Endurance +3 · Recovery +2",
    stats:{ Endurance:3,Recovery:2 }, desc:"Still here. Still going." },
  { id:"iron_body",   path:"Endurance", name:"Iron Body",      icon:"❖", tier:2,
    req:{ stat:"Endurance",  val:35 }, bonus:"Endurance +5 · Fatigue penalty halved",
    stats:{ Endurance:5,Recovery:3 }, desc:"The body no longer begs to stop." },
  { id:"endurance_beast",path:"Endurance",name:"Endurance Beast",icon:"❖",tier:3,
    req:{ stat:"Endurance",  val:50 }, bonus:"Endurance +6 · Stamina missions free",
    stats:{ Endurance:6,Recovery:4 }, desc:"Outlasts everything." },
  /* Intelligence path */
  { id:"strategist",  path:"Intelligence",name:"Strategist",   icon:"✦", tier:1,
    req:{ stat:"Intelligence",val:20 }, bonus:"Intelligence +3 · Hidden quest chance +5%",
    stats:{ Intelligence:3 }, desc:"Reads the dungeon before entering." },
  { id:"tactician",   path:"Intelligence",name:"Tactician",    icon:"✦", tier:2,
    req:{ stat:"Intelligence",val:35 }, bonus:"Intelligence +5 · Dungeon room bonuses +1",
    stats:{ Intelligence:5,Discipline:2 }, desc:"The best move is decided before moving." },
  { id:"analyzer",    path:"Intelligence",name:"Analyzer",     icon:"✦", tier:3,
    req:{ stat:"Intelligence",val:50 }, bonus:"Intelligence +6 · All XP +5%",
    stats:{ Intelligence:6,Aura:2 }, desc:"Dissects everything. Wastes nothing." },
  /* Aura path */
  { id:"predator",    path:"Aura",      name:"Predator",       icon:"✸", tier:1,
    req:{ stat:"Aura",       val:15 }, bonus:"Aura +4 · Shadow loyalty gain +10%",
    stats:{ Aura:4 }, desc:"Others feel the pressure before seeing you." },
  { id:"sovereign",   path:"Aura",      name:"Sovereign",      icon:"✸", tier:2,
    req:{ stat:"Aura",       val:30 }, bonus:"Aura +6 · Monarch interest +1/day",
    stats:{ Aura:6 }, desc:"Authority that doesn't need words." },
];

/* Paths for display order */
const SPEC_PATHS = ["Strength","Agility","Endurance","Intelligence","Aura"];
const SPEC_PATH_COLORS = { Strength:"#f53d3d", Agility:"#4db8ff", Endurance:"#6fae6f", Intelligence:"#f5b65d", Aura:MONARCH_PURP };

/* Return unlocked nodes */
function getUnlockedSpecNodes(playerStats, unlockedIds) {
  if (!playerStats) return [];
  return SPEC_TREE.filter(function(node) {
    if (unlockedIds.includes(node.id)) return false; /* already unlocked */
    const statVal = playerStats[node.req.stat] || 0;
    return statVal >= node.req.val;
  });
}

const MENU_ITEMS = [
  "Dashboard","Daily Quest","Side Quests","Hunter Profile","Hunter Stats","Specialization",
  "Dungeon Gates","Boss Raids","Secret Encounters","Shadow Army","Guild","Inventory",
  "Hunter Shop","Energy","System Log","Settings",
];

/* ---------------------------------------------------------------------------
   HELPERS
--------------------------------------------------------------------------- */
function xpForLevel(level) {
  const l = (typeof level === "number" && isFinite(level) && level >= 1) ? level : 1;
  return 100 + (l - 1) * 50;
}
function getRankForLevel(level) {
  const l = (typeof level === "number" && isFinite(level)) ? level : 0;
  let r = RANKS[0];
  for (let i = 0; i < RANKS.length; i++) { if (l >= RANKS[i].min) r = RANKS[i]; }
  return r;
}
function getRankIndex(level) { return getRankForLevel(level).minRankIndex; }
function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function ts() { const d = new Date(); return d.getHours().toString().padStart(2,"0") + ":" + d.getMinutes().toString().padStart(2,"0") + ":" + d.getSeconds().toString().padStart(2,"0"); }

/* Derive starting stats and rank from evaluation scores */
function computeEvaluation(scores) {
  let totalScore = 0;
  EVAL_TESTS.forEach(function(test) {
    const raw = parseFloat(scores[test.id]) || 0;
    const pct = test.invert
      ? clamp(1 - (raw / test.max), 0, 1)
      : clamp(raw / test.max, 0, 1);
    totalScore += (isFinite(pct) ? pct : 0);
  });
  const avg = EVAL_TESTS.length > 0 ? totalScore / EVAL_TESTS.length : 0;

  /* Starting level — minimum 1 so XP calculations never receive 0 */
  let startLevel;
  if      (avg >= 0.8) startLevel = 34;
  else if (avg >= 0.6) startLevel = 22;
  else if (avg >= 0.4) startLevel = 12;
  else if (avg >= 0.2) startLevel = 5;
  else                 startLevel = 1;   /* E-Rank starts at LV 1, not 0 */

  /* Starting stats — always positive, always finite */
  const stats = { Strength:10, Agility:10, Endurance:10, Discipline:10, Intelligence:10, Recovery:10, Aura:5 };
  EVAL_TESTS.forEach(function(test) {
    const raw = parseFloat(scores[test.id]) || 0;
    const pct = test.invert ? clamp(1-(raw/test.max),0,1) : clamp(raw/test.max,0,1);
    const gain = Math.round((isFinite(pct) ? pct : 0) * 15);
    stats[test.stat] = Math.max(5, (stats[test.stat] || 10) + gain);
  });

  return { startLevel, startRank: getRankForLevel(startLevel), stats };
}

/* ---------------------------------------------------------------------------
   GLOBAL CSS
--------------------------------------------------------------------------- */
const GLOBAL_CSS = `
  @import url('${FONT_LINK}');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: #020810;
    overflow-x: hidden;
    font-family: 'Oxanium', 'Rajdhani', sans-serif;
    -webkit-font-smoothing: antialiased;
  }

  /* ── Scrollbar ── */
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #1a3a5c; border-radius: 0; }

  /* ── Input ── */
  input[type=number]::-webkit-outer-spin-button,
  input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }

  /* ═══════════════════════════════════════════════════
     KEYFRAMES
  ═══════════════════════════════════════════════════ */
  @keyframes pulse-glow       { 0%,100%{opacity:.65} 50%{opacity:1} }
  @keyframes flicker          { 0%,100%{opacity:1} 10%{opacity:.35} 20%{opacity:1} 50%{opacity:.55} 60%{opacity:1} 85%{opacity:.25} 90%{opacity:1} }
  @keyframes glitch-shift     { 0%,100%{transform:translateX(0) skewX(0deg)} 15%{transform:translateX(-4px) skewX(-2deg)} 30%{transform:translateX(4px) skewX(2deg)} 45%{transform:translateX(-2px) skewX(-1deg)} 60%{transform:translateX(2px) skewX(1deg)} 75%{transform:translateX(-1px) skewX(-.5deg)} }
  @keyframes scan-line        { 0%{top:-4%} 100%{top:104%} }
  @keyframes scan-pass        { 0%{transform:translateY(-100%)} 100%{transform:translateY(3000%)} }
  @keyframes monarch-breathe  { 0%,100%{box-shadow:0 0 18px #9b30ff33,inset 0 0 18px #9b30ff0d} 50%{box-shadow:0 0 48px #9b30ff77,inset 0 0 36px #9b30ff22} }
  @keyframes aura-eruption    { 0%{transform:scale(.5);opacity:0} 40%{transform:scale(1.15);opacity:1} 100%{transform:scale(1);opacity:1} }
  @keyframes aura-ring-2      { 0%{transform:scale(.3);opacity:0} 50%{opacity:.7} 100%{transform:scale(1.3);opacity:0} }
  @keyframes shake            { 0%,100%{transform:translate(0,0)} 10%{transform:translate(-3px,-1px)} 20%{transform:translate(3px,2px)} 30%{transform:translate(-2px,3px)} 40%{transform:translate(2px,-2px)} 50%{transform:translate(-1px,1px)} 60%{transform:translate(1px,-3px)} 70%{transform:translate(-3px,1px)} 80%{transform:translate(3px,3px)} 90%{transform:translate(-1px,-1px)} }
  @keyframes slide-in-right   { from{transform:translateX(300px);opacity:0} to{transform:translateX(0);opacity:1} }
  @keyframes fade-in          { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fade-in-up       { from{opacity:0;transform:translateY(28px) scale(.96)} to{opacity:1;transform:translateY(0) scale(1)} }
  @keyframes toast-in         { from{transform:translateX(-50%) translateY(16px);opacity:0} to{transform:translateX(-50%) translateY(0);opacity:1} }
  @keyframes monarch-text-flicker { 0%,100%{text-shadow:0 0 18px #9b30ff,0 0 36px #9b30ff77} 30%{text-shadow:0 0 6px #9b30ff,0 0 2px #9b30ff} 60%{text-shadow:0 0 28px #9b30ff,0 0 56px #9b30ffaa} }
  @keyframes cyan-text-glow   { 0%,100%{text-shadow:0 0 8px #4db8ff88,0 0 20px #4db8ff33} 50%{text-shadow:0 0 16px #4db8ffcc,0 0 40px #4db8ff55} }
  @keyframes blink            { 0%,49%{opacity:1} 50%,100%{opacity:0} }
  @keyframes level-up-burst   { 0%{opacity:1;transform:scale(0)} 60%{opacity:1;transform:scale(1)} 100%{opacity:0;transform:scale(1.15)} }
  @keyframes level-up-ray     { 0%{opacity:1;transform:scaleY(0)} 60%{opacity:1;transform:scaleY(1)} 100%{opacity:0;transform:scaleY(1.1)} }
  @keyframes rank-flash       { 0%{opacity:0} 15%{opacity:1} 85%{opacity:1} 100%{opacity:0} }
  @keyframes cinematic-in     { from{opacity:0;transform:scale(.87) translateY(18px)} to{opacity:1;transform:scale(1) translateY(0)} }
  @keyframes log-entry-in     { from{opacity:0;transform:translateX(-6px)} to{opacity:1;transform:translateX(0)} }
  @keyframes dialogue-in      { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }
  @keyframes shadow-appear    { from{opacity:0;transform:scale(.8) translateY(8px)} to{opacity:1;transform:scale(1) translateY(0)} }
  @keyframes arise-pulse      { 0%,100%{box-shadow:0 0 0 0 rgba(155,48,255,0.7)} 50%{box-shadow:0 0 0 18px rgba(155,48,255,0)} }
  @keyframes eval-progress    { from{width:0} to{width:100%} }
  @keyframes chest-reveal     { 0%{opacity:0;transform:scale(0.5) translateY(18px)} 60%{transform:scale(1.08) translateY(-3px)} 100%{opacity:1;transform:scale(1) translateY(0)} }
  @keyframes energy-pulse     { 0%,100%{opacity:0.65;transform:scale(1)} 50%{opacity:1;transform:scale(1.015)} }
  @keyframes shadow-float     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
  @keyframes dungeon-warning  { 0%,100%{opacity:1} 50%{opacity:0.25} }
  @keyframes gate-open-lr     { from{transform:scaleX(0)} to{transform:scaleX(1)} }
  @keyframes rank-text-surge  { 0%{letter-spacing:0.05em;opacity:0} 50%{letter-spacing:0.4em;opacity:1} 100%{letter-spacing:0.2em;opacity:1} }
  @keyframes aura-surge       { 0%{opacity:0;transform:scale(0.6)} 40%{opacity:0.8;transform:scale(1.1)} 100%{opacity:1;transform:scale(1)} }
  @keyframes notification-slide { from{transform:translateX(100%);opacity:0} to{transform:translateX(0);opacity:1} }
  @keyframes corner-blink     { 0%,100%{opacity:.5} 50%{opacity:1} }
  @keyframes holo-shimmer     { 0%,100%{background-position:200% 0} 50%{background-position:-200% 0} }
  @keyframes panel-in         { from{opacity:0;transform:translateY(10px) scaleY(0.97)} to{opacity:1;transform:translateY(0) scaleY(1)} }

  /* ═══════════════════════════════════════════════════
     UTILITY CLASSES
  ═══════════════════════════════════════════════════ */
  .rank-text-surge  { animation:rank-text-surge 0.9s ease forwards }
  .aura-surge       { animation:aura-surge 0.7s ease forwards }
  .notif-slide      { animation:notification-slide 0.3s ease forwards }
  .energy-pulse     { animation:energy-pulse 2.5s ease-in-out infinite }
  .shadow-float     { animation:shadow-float 3s ease-in-out infinite }
  .dng-warn         { animation:dungeon-warning 0.8s step-end infinite }
  .menu-slide       { animation:slide-in-right .2s ease forwards }
  .fade-in          { animation:fade-in .28s ease forwards }
  .fade-in-up       { animation:fade-in-up .38s ease forwards }
  .glitch-text      { animation:glitch-shift .5s infinite }
  .flicker          { animation:flicker 2s infinite }
  .monarch-breathe  { animation:monarch-breathe 3s ease-in-out infinite }
  .shake            { animation:shake .4s ease infinite }
  .blink            { animation:blink 1s step-end infinite }
  .pulse-glow       { animation:pulse-glow 2.2s ease-in-out infinite }
  .monarch-text     { animation:monarch-text-flicker 3s ease-in-out infinite }
  .log-entry        { animation:log-entry-in .22s ease forwards }
  .dialogue-in      { animation:dialogue-in .28s ease forwards }
  .shadow-appear    { animation:shadow-appear .38s ease forwards }
  .arise-pulse      { animation:arise-pulse 1.5s ease-in-out infinite }
  .cyan-glow-text   { animation:cyan-text-glow 3s ease-in-out infinite }
  .panel-in         { animation:panel-in .3s ease forwards }

  /* ═══════════════════════════════════════════════════
     HOLOGRAPHIC PANEL — .sl-panel
     Sharp corners, thin cyan border, scanline overlay,
     circuit-board texture, inner glow.
  ═══════════════════════════════════════════════════ */
  .sl-panel {
    position: relative;
    background: linear-gradient(160deg, rgba(4,12,28,0.97) 0%, rgba(2,8,18,0.99) 100%);
    border: 1px solid rgba(77,184,255,0.35);
    box-shadow: 0 0 0 1px rgba(77,184,255,0.08), inset 0 0 30px rgba(77,184,255,0.03);
    overflow: hidden;
  }
  .sl-panel::before {
    content: '';
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(
      0deg,
      transparent,
      transparent 3px,
      rgba(77,184,255,0.022) 3px,
      rgba(77,184,255,0.022) 4px
    );
    pointer-events: none;
    z-index: 0;
  }
  /* Animated scan line — subtle, slow */
  .sl-panel::after {
    content: '';
    position: absolute;
    left: 0; right: 0;
    height: 60px;
    background: linear-gradient(to bottom, transparent, rgba(77,184,255,0.04), transparent);
    animation: scan-pass 8s linear infinite;
    pointer-events: none;
    z-index: 1;
  }
  .sl-panel > * { position: relative; z-index: 2; }

  /* Glitch variant */
  .sl-panel.glitching::before {
    background: repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(255,34,68,0.04) 2px,rgba(255,34,68,0.04) 4px);
  }

  /* ── Corner accents ── */
  .sl-corners {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 3;
  }
  .sl-corners::before, .sl-corners::after {
    content: '';
    position: absolute;
    width: 14px; height: 14px;
    border-color: rgba(77,184,255,0.7);
    border-style: solid;
  }
  .sl-corners::before { top: 0; left: 0; border-width: 2px 0 0 2px; }
  .sl-corners::after  { bottom: 0; right: 0; border-width: 0 2px 2px 0; }

  /* ═══════════════════════════════════════════════════
     SECTION HEADER — .sl-header-bar
     Matches the "QUEST INFO" bar from reference image 1
  ═══════════════════════════════════════════════════ */
  .sl-header-bar {
    display: flex;
    align-items: center;
    gap: 10px;
    background: linear-gradient(90deg, rgba(77,184,255,0.12), rgba(77,184,255,0.04));
    border-bottom: 1px solid rgba(77,184,255,0.3);
    padding: 8px 14px;
  }
  .sl-header-title {
    font-family: 'Orbitron', sans-serif;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.25em;
    color: #c8eeff;
    text-shadow: 0 0 12px rgba(77,184,255,0.7), 0 0 24px rgba(77,184,255,0.3);
    text-transform: uppercase;
  }

  /* ═══════════════════════════════════════════════════
     QUEST GOAL ROWS — .sl-goal-row
  ═══════════════════════════════════════════════════ */
  .sl-goal-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 9px 0;
    border-bottom: 1px solid rgba(77,184,255,0.08);
    cursor: default;
    transition: background 0.15s;
  }
  .sl-goal-row.tappable { cursor: pointer; }
  .sl-goal-row.tappable:active { background: rgba(77,184,255,0.06); }

  /* ═══════════════════════════════════════════════════
     SYSTEM BUTTONS — .sl-btn
  ═══════════════════════════════════════════════════ */
  .sl-btn {
    font-family: 'Orbitron', sans-serif;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    background: transparent;
    border: 1px solid rgba(77,184,255,0.6);
    color: #4db8ff;
    padding: 10px 18px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: color 0.15s, border-color 0.15s, box-shadow 0.15s;
    -webkit-tap-highlight-color: transparent;
  }
  .sl-btn::before {
    content: '';
    position: absolute;
    inset: 0;
    background: rgba(77,184,255,0);
    transition: background 0.15s;
  }
  .sl-btn:active::before { background: rgba(77,184,255,0.12); }
  .sl-btn:active { box-shadow: 0 0 14px rgba(77,184,255,0.4); }
  .sl-btn.primary {
    background: linear-gradient(135deg, rgba(77,184,255,0.18), rgba(77,184,255,0.06));
    border-color: rgba(77,184,255,0.9);
    color: #e0f4ff;
    box-shadow: 0 0 10px rgba(77,184,255,0.2), inset 0 0 10px rgba(77,184,255,0.04);
  }
  .sl-btn.danger {
    border-color: rgba(255,34,68,0.5);
    color: rgba(255,34,68,0.7);
  }

  /* ═══════════════════════════════════════════════════
     WARNING LINE — .sl-warning
  ═══════════════════════════════════════════════════ */
  .sl-warning {
    font-size: 11px;
    color: #ff4444;
    font-family: 'Rajdhani', sans-serif;
    font-weight: 600;
    letter-spacing: 0.05em;
    line-height: 1.5;
    padding: 8px 0;
  }
  .sl-warning strong { font-weight: 700; }

  /* ═══════════════════════════════════════════════════
     DIVIDER — .sl-divider
  ═══════════════════════════════════════════════════ */
  .sl-divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(77,184,255,0.5), transparent);
    margin: 10px 0;
  }

  /* ═══════════════════════════════════════════════════
     STAT ROW — .sl-stat-row (status screen)
  ═══════════════════════════════════════════════════ */
  .sl-stat-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 7px 0;
    border-bottom: 1px solid rgba(77,184,255,0.07);
  }
  .sl-stat-label {
    font-family: 'Rajdhani', sans-serif;
    font-size: 13px;
    font-weight: 600;
    color: #8ab8d8;
    letter-spacing: 0.1em;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .sl-stat-value {
    font-family: 'Orbitron', sans-serif;
    font-size: 13px;
    font-weight: 700;
    color: #d0eeff;
    text-shadow: 0 0 8px rgba(77,184,255,0.5);
  }

  /* ═══════════════════════════════════════════════════
     PROGRESS BAR — .sl-bar
  ═══════════════════════════════════════════════════ */
  .sl-bar-track {
    height: 5px;
    background: rgba(255,255,255,0.06);
    overflow: hidden;
    position: relative;
  }
  .sl-bar-fill {
    height: 100%;
    transition: width 0.5s ease;
    position: relative;
  }
  .sl-bar-fill::after {
    content: '';
    position: absolute;
    top: 0; right: 0;
    width: 4px; height: 100%;
    background: rgba(255,255,255,0.6);
    filter: blur(2px);
  }

  /* ═══════════════════════════════════════════════════
     MENU OVERLAY — .sl-menu
  ═══════════════════════════════════════════════════ */
  .sl-menu {
    position: fixed;
    top: 0; right: 0; bottom: 0;
    width: min(300px, 85vw);
    background: linear-gradient(180deg, rgba(2,6,18,0.99), rgba(4,10,24,0.99));
    border-left: 1px solid rgba(77,184,255,0.25);
    box-shadow: -8px 0 40px rgba(0,0,0,0.8), -2px 0 0 rgba(77,184,255,0.1);
    z-index: 200;
    overflow-y: auto;
  }
  .sl-menu-item {
    display: flex;
    align-items: center;
    padding: 13px 20px;
    font-family: 'Rajdhani', sans-serif;
    font-size: 14px;
    font-weight: 600;
    letter-spacing: 0.12em;
    color: #7a9ab8;
    cursor: pointer;
    border-bottom: 1px solid rgba(77,184,255,0.06);
    transition: color 0.15s, background 0.15s, border-left-color 0.15s;
    border-left: 2px solid transparent;
    text-transform: uppercase;
    -webkit-tap-highlight-color: transparent;
  }
  .sl-menu-item.active {
    color: #c8eeff;
    background: rgba(77,184,255,0.07);
    border-left-color: rgba(77,184,255,0.8);
    text-shadow: 0 0 10px rgba(77,184,255,0.5);
  }
  .sl-menu-item:active { background: rgba(77,184,255,0.1); }

  /* ═══════════════════════════════════════════════════
     LEVEL BADGE — .sl-level-badge
     Large centered level number, like the STATUS screen
  ═══════════════════════════════════════════════════ */
  .sl-level-badge {
    font-family: 'Orbitron', sans-serif;
    font-weight: 900;
    color: #c8eeff;
    text-shadow: 0 0 20px rgba(77,184,255,0.8), 0 0 50px rgba(77,184,255,0.4);
    line-height: 1;
  }

  /* ═══════════════════════════════════════════════════
     CIRCUIT BACKGROUND TEXTURE
  ═══════════════════════════════════════════════════ */
  .sl-circuit-bg {
    background-image:
      linear-gradient(rgba(77,184,255,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(77,184,255,0.04) 1px, transparent 1px);
    background-size: 40px 40px;
  }

  /* ═══════════════════════════════════════════════════
     NOTIFICATION (SYSTEM ALERT STYLE)
     Matches Image 3 — dark panel, cyan/green highlight
  ═══════════════════════════════════════════════════ */
  .sl-notification {
    position: relative;
    background: linear-gradient(160deg, rgba(3,8,22,0.97), rgba(2,6,16,0.99));
    border: 1px solid rgba(77,184,255,0.4);
    box-shadow: 0 0 30px rgba(77,184,255,0.15), inset 0 0 30px rgba(77,184,255,0.03);
    overflow: hidden;
  }
  .sl-notification::before {
    content: '';
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(77,184,255,0.015) 3px,rgba(77,184,255,0.015) 4px);
    pointer-events: none;
  }

  /* ═══════════════════════════════════════════════════
     TABS — .sl-tab-bar
  ═══════════════════════════════════════════════════ */
  .sl-tab {
    padding: 6px 14px;
    font-family: 'Orbitron', sans-serif;
    font-size: 9px;
    letter-spacing: 0.2em;
    cursor: pointer;
    background: transparent;
    border: 1px solid rgba(77,184,255,0.25);
    color: #5a7a98;
    text-transform: uppercase;
    -webkit-tap-highlight-color: transparent;
    transition: all 0.15s;
  }
  .sl-tab.active {
    background: rgba(77,184,255,0.12);
    border-color: rgba(77,184,255,0.7);
    color: #c8eeff;
    text-shadow: 0 0 8px rgba(77,184,255,0.5);
  }
`;


function StyleTag() { return <style dangerouslySetInnerHTML={{ __html: GLOBAL_CSS }} />; }

/* ===========================================================================
   AUDIO ENGINE
   =========================================================================== */
function useAudio() {
  const ctxRef = useRef(null); const enabledRef = useRef(true);
  function getCtx() { if (!ctxRef.current) { const AC = window.AudioContext || window.webkitAudioContext; if (AC) ctxRef.current = new AC(); } if (ctxRef.current && ctxRef.current.state === "suspended") ctxRef.current.resume(); return ctxRef.current; }
  function tone(freq, dur, type, gain, slideTo) { if (!enabledRef.current) return; const ctx = getCtx(); if (!ctx) return; const osc = ctx.createOscillator(); const g = ctx.createGain(); osc.type = type || "sine"; osc.frequency.setValueAtTime(freq, ctx.currentTime); if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + dur); g.gain.setValueAtTime(0.0001, ctx.currentTime); g.gain.exponentialRampToValueAtTime(gain || 0.06, ctx.currentTime + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur); osc.connect(g); g.connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + dur + 0.02); }
  function sfxClick()    { tone(420, 0.08, "triangle", 0.04, 620); }
  function sfxOpen()     { tone(300, 0.18, "sine", 0.05, 720); tone(150, 0.22, "sine", 0.03, 360); }
  function sfxComplete() { tone(523, 0.12, "sine", 0.05); setTimeout(function() { tone(784, 0.18, "sine", 0.05); }, 90); }
  function sfxLevelUp()  { [523,659,784,1046].forEach(function(f,i) { setTimeout(function() { tone(f, 0.3, "triangle", 0.06); }, i*110); }); }
  function sfxRankUp()   { [392,523,659,880,1318].forEach(function(f,i) { setTimeout(function() { tone(f, 0.45, "sawtooth", 0.045); }, i*140); }); }
  function sfxAlert()    { tone(180, 0.4, "sawtooth", 0.05, 90); setTimeout(function() { tone(180, 0.4, "sawtooth", 0.05, 90); }, 220); }
  function sfxEvolve()   { [220,277,330,440,554,660].forEach(function(f,i) { setTimeout(function() { tone(f, 0.5, "sine", 0.05); }, i*100); }); }
  function sfxDefeat()   { tone(120, 0.6, "sawtooth", 0.06, 50); }
  function sfxBoss()     { tone(80, 0.5, "sawtooth", 0.08, 60); tone(160, 0.3, "square", 0.04, 120); }
  function sfxSecret()   { [330,415,523,660].forEach(function(f,i) { setTimeout(function() { tone(f, 0.4, "sine", 0.04); }, i*80); }); }
  function sfxDenied()   { tone(200, 0.15, "sawtooth", 0.06, 100); setTimeout(function() { tone(150, 0.2, "sawtooth", 0.06, 80); }, 180); }
  function sfxArise()    { [110,138,165,220,277,330,440].forEach(function(f,i) { setTimeout(function() { tone(f, 0.8, "sine", 0.07); }, i*120); }); }
  function setEnabled(on) { enabledRef.current = on; }
  return { sfxClick, sfxOpen, sfxComplete, sfxLevelUp, sfxRankUp, sfxAlert, sfxEvolve, sfxDefeat, sfxBoss, sfxSecret, sfxDenied, sfxArise, setEnabled };
}

/* ===========================================================================
   PARTICLE FIELD
   =========================================================================== */
function ParticleField({ color, density }) {
  const canvasRef = useRef(null); const rafRef = useRef(null);
  useEffect(function() {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); let w = 0, h = 0;
    function resize() { w = canvas.width = canvas.offsetWidth; h = canvas.height = canvas.offsetHeight; }
    resize(); window.addEventListener("resize", resize);
    const count = density || 50;
    const particles = Array.from({ length: count }, function() { return { x: Math.random()*w, y: Math.random()*h, r: Math.random()*1.6+0.4, vy: -(Math.random()*0.35+0.08), vx: (Math.random()-0.5)*0.12, a: Math.random()*0.45+0.1 }; });
    function draw() { ctx.clearRect(0,0,w,h); for (let i=0;i<particles.length;i++) { const p=particles[i]; p.y+=p.vy; p.x+=p.vx; if(p.y<-6){p.y=h+6;p.x=Math.random()*w;} if(p.x<-6)p.x=w+6; if(p.x>w+6)p.x=-6; ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fillStyle=color||"rgba(77,184,255,0.5)"; ctx.globalAlpha=p.a; ctx.shadowBlur=6; ctx.shadowColor=color||"rgba(77,184,255,0.8)"; ctx.fill(); ctx.globalAlpha=1; ctx.shadowBlur=0; } rafRef.current=requestAnimationFrame(draw); }
    draw();
    return function() { cancelAnimationFrame(rafRef.current); window.removeEventListener("resize",resize); };
  }, [color, density]);
  return <canvas ref={canvasRef} style={{ position:"fixed",inset:0,width:"100%",height:"100%",pointerEvents:"none",zIndex:0,opacity:0.65 }} />;
}

/* ===========================================================================
   CINEMATIC OVERLAYS
   =========================================================================== */
function LevelUpOverlay({ level, accent, onDone }) {
  const t = useRef(null);
  useEffect(function() { t.current = setTimeout(function() { if (typeof onDone==="function") onDone(); }, 2400); return function() { clearTimeout(t.current); }; }, []);
  return (
    <div style={{ position:"fixed",inset:0,zIndex:7000,display:"flex",alignItems:"center",justifyContent:"center",pointerEvents:"none",background:"radial-gradient(circle at center,"+accent+"22 0%,transparent 65%)" }}>
      <div style={{ position:"absolute",width:300,height:300,borderRadius:"50%",border:"2px solid "+accent,animation:"level-up-burst 1s ease forwards" }} />
      {Array.from({length:12}).map(function(_,i) { return <div key={i} style={{ position:"absolute",width:3,height:90,background:"linear-gradient(to bottom,"+accent+",transparent)",transformOrigin:"center bottom",transform:"rotate("+(i*30)+"deg) translateY(-100px)",animation:"level-up-ray 1s ease forwards",animationDelay:(i*20)+"ms" }} />; })}
      <div style={{ position:"relative",textAlign:"center",animation:"fade-in-up 0.4s ease forwards" }}>
        <div style={{ fontFamily:"'Orbitron',sans-serif",fontSize:11,letterSpacing:"0.5em",color:accent,marginBottom:8 }}>LEVEL UP</div>
        <div style={{ fontFamily:"'Orbitron',sans-serif",fontSize:72,fontWeight:900,color:"#fff",textShadow:"0 0 30px "+accent }}>{level}</div>
      </div>
    </div>
  );
}

function RankUpOverlay({ rank, onDone }) {
  const t = useRef(null);
  useEffect(function() { t.current = setTimeout(function() { if (typeof onDone==="function") onDone(); }, 4200); return function() { clearTimeout(t.current); }; }, []);
  /* Safe: rank may be null before data loads */
  if (!rank) return null;
  const rankMsg = getSystemMessage(SYSTEM_DIALOGUE.rankUp, rank.minRankIndex || 0);
  return (
    <div style={{ position:"fixed",inset:0,zIndex:7100,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",background:"radial-gradient(ellipse at center,"+rank.color+"33 0%,rgba(0,0,0,0.94) 70%)",animation:"rank-flash 4.2s ease forwards",pointerEvents:"none" }}>
      {/* Aura rings */}
      <div className="aura-surge" style={{ position:"absolute",width:440,height:440,borderRadius:"50%",border:"1px solid "+rank.color+"55" }} />
      <div style={{ position:"absolute",width:320,height:320,borderRadius:"50%",border:"2px solid "+rank.color+"88",animation:"aura-ring-2 2s ease 0.5s forwards" }} />
      {/* Text */}
      <div style={{ position:"relative",textAlign:"center",padding:"0 32px" }}>
        <div style={{ fontFamily:"'Orbitron',sans-serif",fontSize:10,letterSpacing:"0.5em",color:rank.color,marginBottom:16,animation:"fade-in 0.5s ease 0.1s both" }}>
          RANK ASCENSION
        </div>
        <div className="rank-text-surge" style={{ fontFamily:"'Orbitron',sans-serif",fontSize:52,fontWeight:900,color:rank.color,textShadow:"0 0 40px "+rank.color+",0 0 80px "+rank.color+"55",marginBottom:8 }}>
          {rank.name}
        </div>
        <div style={{ fontSize:16,color:"#dbe6ff",marginBottom:20,animation:"fade-in 0.5s ease 0.6s both" }}>
          {rank.title}
        </div>
        {/* System message about the rank */}
        <div style={{ fontSize:12,color:rank.color+"aa",fontStyle:"italic",maxWidth:340,margin:"0 auto",animation:"fade-in 0.5s ease 1s both",lineHeight:1.6 }}>
          {rankMsg}
        </div>
      </div>
    </div>
  );
}

/* ===========================================================================
   CINEMATIC POPUP
   =========================================================================== */
function CinematicPopup({ data, onClose, sfx }) {
  const color = data.kind==="fail"?"#f53d3d":data.kind==="awakening"?"#a05df5":data.kind==="shadow"?MONARCH_PURP:data.kind==="victory"?"#2ee88a":data.kind==="boss"?data.bossColor||"#f53d3d":data.kind==="hidden"?"#f5b65d":SYS_BLUE;
  useEffect(function() { if (sfx && typeof sfx.sfxOpen==="function") sfx.sfxOpen(); }, []);
  return (
    <div style={{ position:"fixed",inset:0,zIndex:8500,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(3,5,12,0.88)",backdropFilter:"blur(6px)",padding:"24px 16px" }}>
      <div style={{ maxWidth:460,width:"100%",border:"1px solid "+color+"88",background:"linear-gradient(160deg,rgba(10,16,28,0.99),rgba(5,8,18,0.99))",boxShadow:"0 0 60px "+color+"33",position:"relative",overflow:"hidden",animation:"cinematic-in 0.35s ease forwards" }}>
        <div style={{ position:"absolute",inset:0,pointerEvents:"none",background:"repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(255,255,255,0.012) 2px,rgba(255,255,255,0.012) 4px)" }} />
        <div style={{ padding:"32px 28px",position:"relative" }}>
          <div style={{ display:"flex",alignItems:"center",justifyContent:"center",gap:12,marginBottom:20 }}>
            <div style={{ width:38,height:38,border:"2px solid "+color,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 0 12px "+color+"88",flexShrink:0 }}><span style={{ color,fontWeight:900,fontSize:18,fontFamily:"'Orbitron',sans-serif",lineHeight:1 }}>!</span></div>
            <div style={{ padding:"7px 20px",border:"1.5px solid "+color,boxShadow:"0 0 14px "+color+"55" }}><span style={{ fontFamily:"'Orbitron',sans-serif",fontSize:15,fontWeight:700,color:"#eaf2ff",letterSpacing:"0.1em" }}>{data.title||"NOTIFICATION"}</span></div>
          </div>
          {data.flavor&&<p style={{ textAlign:"center",fontSize:13,color:"#cfe0f5",marginBottom:16 }}>{data.flavor}</p>}
          {data.bigText&&<div style={{ textAlign:"center",fontFamily:"'Orbitron',sans-serif",fontSize:26,fontWeight:900,color,marginBottom:12,textShadow:"0 0 20px "+color }}>{data.bigText}</div>}
          {data.sub&&<p style={{ textAlign:"center",fontSize:14,color:"#9fb8d8",lineHeight:1.7,marginBottom:16 }}>{data.sub}</p>}
          {data.reward&&<div style={{ padding:"8px 14px",marginBottom:20,border:"1px solid "+color+"44",background:color+"11",textAlign:"center",fontSize:13,fontWeight:700,color }}>{data.reward}</div>}
          <div style={{ display:"flex",gap:10,justifyContent:"center" }}>
            {data.onAccept&&<button onClick={function(){if(typeof data.onAccept==="function")data.onAccept();onClose();}} style={{ padding:"10px 28px",background:color,color:"#03050c",border:"none",cursor:"pointer",fontFamily:"'Orbitron',sans-serif",fontSize:12,fontWeight:700,letterSpacing:"0.15em" }}>ACCEPT</button>}
            <button onClick={onClose} style={{ padding:"10px 28px",background:"transparent",border:"1px solid "+color,color,cursor:"pointer",fontFamily:"'Orbitron',sans-serif",fontSize:12,fontWeight:700,letterSpacing:"0.15em" }}>{data.onAccept?"DISMISS":"ACKNOWLEDGE"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===========================================================================
   BOSS ACCESS DENIED SCREEN
   =========================================================================== */
function AccessDeniedScreen({ boss, playerRank, onClose }) {
  return (
    <div style={{ position:"fixed",inset:0,zIndex:8600,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.95)",backdropFilter:"blur(8px)",padding:"24px 16px" }}>
      <div className="fade-in-up" style={{ maxWidth:440,width:"100%",border:"1px solid "+GLITCH_RED+"88",background:"linear-gradient(160deg,rgba(20,5,5,0.99),rgba(10,0,0,0.99))",boxShadow:"0 0 60px "+GLITCH_RED+"33",padding:"36px 28px",textAlign:"center" }}>
        <div style={{ fontFamily:"'Orbitron',sans-serif",fontSize:10,letterSpacing:"0.5em",color:GLITCH_RED,marginBottom:16 }} className="shake">⚠ ACCESS DENIED ⚠</div>
        <div style={{ fontFamily:"'Orbitron',sans-serif",fontSize:22,fontWeight:900,color:"#eaf2ff",marginBottom:20 }}>{boss.name}</div>
        <div style={{ padding:"16px",border:"1px solid "+GLITCH_RED+"44",background:"rgba(255,34,68,0.06)",marginBottom:20 }}>
          <p style={{ fontSize:13,color:GLITCH_RED,lineHeight:1.8 }}>
            Your current rank is insufficient.<br />
            <strong>Required: {boss.minRankName} (LV {boss.minLevel})</strong><br />
            <strong>Current: {playerRank.name}</strong>
          </p>
        </div>
        <div style={{ fontFamily:"'Orbitron',sans-serif",fontSize:28,fontWeight:900,color:GLITCH_RED,marginBottom:8 }}>{boss.survivalChance}%</div>
        <div style={{ fontSize:11,color:"#8a6070",marginBottom:20 }}>Hunter survival probability at current rank</div>
        <p style={{ fontSize:12,color:"#7e98ba",marginBottom:24,lineHeight:1.7 }}>
          Raise your rank before challenging this entity. The System will not permit a hunter of your current caliber to enter this encounter.
        </p>
        <button onClick={onClose} style={{ padding:"10px 28px",background:"transparent",border:"1px solid "+GLITCH_RED+"66",color:GLITCH_RED+"cc",cursor:"pointer",fontFamily:"'Orbitron',sans-serif",fontSize:11,letterSpacing:"0.2em" }}>WITHDRAW</button>
      </div>
    </div>
  );
}

/* ===========================================================================
   SHADOW EXTRACTION — ARISE SYSTEM
   3 attempts. Dramatic. Permanent failure on 3 misses.
   =========================================================================== */
function AriseScreen({ boss, attemptNumber, onSuccess, onFail, onAbandon, sfx }) {
  const [progress, setProgress] = useState({});
  const [done, setDone] = useState(false);
  const challenge = boss.ariseChallenge;

  const allDone = challenge.goals.every(function(g) { return (progress[g.id]||0) >= g.target; });

  function tapGoal(goalId) {
    const goal = challenge.goals.find(function(g) { return g.id === goalId; });
    if (!goal || (progress[goalId]||0) >= goal.target || done) return;
    if (sfx && typeof sfx.sfxComplete === "function") sfx.sfxComplete();
    const next = Object.assign({}, progress, { [goalId]: goal.target });
    setProgress(next);
    if (challenge.goals.every(function(g) { return (next[g.id]||0) >= g.target; })) {
      setDone(true);
      if (sfx && typeof sfx.sfxArise === "function") sfx.sfxArise();
      setTimeout(function() { if (typeof onSuccess === "function") onSuccess(); }, 2200);
    }
  }

  const attemptsLeft = 3 - attemptNumber + 1;

  return (
    <div style={{ position:"fixed",inset:0,zIndex:9100,background:"radial-gradient(ellipse at center,#0a0015 0%,#000 100%)",overflow:"auto",padding:"20px 16px 60px" }}>
      <div style={{ position:"fixed",inset:0,pointerEvents:"none",background:"repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(155,48,255,0.05) 2px,rgba(155,48,255,0.05) 4px)" }} />
      <div style={{ position:"fixed",left:0,right:0,height:2,background:"linear-gradient(90deg,transparent,"+MONARCH_PURP+"88,transparent)",animation:"scan-line 2.5s linear infinite" }} />

      <div style={{ position:"relative",zIndex:2,maxWidth:540,margin:"0 auto",paddingTop:24 }}>
        {/* Header */}
        <div style={{ textAlign:"center",marginBottom:28 }}>
          <div className="arise-pulse" style={{ display:"inline-flex",alignItems:"center",justifyContent:"center",width:64,height:64,borderRadius:"50%",border:"2px solid "+MONARCH_PURP,marginBottom:16,fontSize:24,color:MONARCH_PURP }}>◉</div>
          <div className="monarch-text" style={{ fontFamily:"'Orbitron',sans-serif",fontSize:32,fontWeight:900,color:MONARCH_PURP,marginBottom:8 }}>A R I S E</div>
          <div style={{ fontSize:14,color:"#8a6ab0",lineHeight:1.6 }}>
            {boss.name} · Shadow Extraction Attempt {attemptNumber}/3<br />
            <span style={{ color:attemptsLeft<=1?GLITCH_RED:"#8a6ab0" }}>{attemptsLeft} attempt{attemptsLeft!==1?"s":""} remaining after this</span>
          </div>
        </div>

        {/* Warning */}
        <div style={{ border:"1px solid "+MONARCH_PURP+"55",background:"rgba(155,48,255,0.06)",padding:"12px 16px",marginBottom:20,fontSize:12,color:"#8a6ab0",lineHeight:1.7 }}>
          Complete the challenge below to extract {boss.name}'s shadow. Failure costs one attempt. Three failures and the shadow is gone.
        </div>

        {/* Challenge card */}
        <div style={{ border:"1px solid "+MONARCH_PURP+"88",background:"linear-gradient(160deg,rgba(15,5,30,0.99),rgba(8,0,18,0.99))",marginBottom:16 }}>
          <div style={{ padding:"16px 20px",borderBottom:"1px solid "+MONARCH_PURP+"33" }}>
            <div style={{ fontFamily:"'Orbitron',sans-serif",fontSize:13,fontWeight:700,color:MONARCH_PURP }}>{challenge.name}</div>
          </div>
          <div style={{ padding:"16px 20px" }}>
            {challenge.goals.map(function(g) {
              const cur = progress[g.id]||0; const gdone = cur >= g.target; const canTap = !gdone && !done;
              return (
                <div key={g.id} onClick={function(){tapGoal(g.id);}}
                  style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid rgba(155,48,255,0.1)",cursor:canTap?"pointer":"default" }}>
                  <span style={{ fontSize:14,fontWeight:600,color:gdone?"#5a3a7a":"#dbe6ff" }}>{g.name}</span>
                  <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                    <span style={{ fontSize:12,color:gdone?"#2ee88a":"#8a6ab0" }}>[{cur}/{g.target}{g.unit}]</span>
                    <div style={{ width:20,height:20,border:"1.5px solid "+(gdone?"#2ee88a":MONARCH_PURP+"77"),background:gdone?"#2ee88a22":"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"#2ee88a" }}>{gdone?"✓":""}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Success state */}
        {done && (
          <div className="fade-in" style={{ textAlign:"center",padding:"20px 0" }}>
            <div className="monarch-text" style={{ fontFamily:"'Orbitron',sans-serif",fontSize:18,color:MONARCH_PURP }}>Shadow extraction successful...</div>
          </div>
        )}

        {/* Fail button */}
        {!done && (
          <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
            <button onClick={onFail} style={{ width:"100%",padding:"12px",background:"transparent",border:"1px solid #f53d3d55",color:"#f53d3d88",cursor:"pointer",fontFamily:"'Orbitron',sans-serif",fontSize:11,letterSpacing:"0.2em" }}>
              FAIL ATTEMPT — I could not complete this
            </button>
            <button onClick={onAbandon} style={{ width:"100%",padding:"10px",background:"transparent",border:"1px solid #2a3a55",color:"#5b7aa0",cursor:"pointer",fontFamily:"'Orbitron',sans-serif",fontSize:10 }}>
              Abandon extraction (attempt not consumed)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ===========================================================================
   DESIGN PRIMITIVES
   =========================================================================== */
function Win({ children, ac, style, className, glitching }) {
  const c = ac || SYS_BLUE;
  const borderColor = c + "55";
  const glowColor   = c + "22";
  return (
    <div
      className={"sl-panel" + (glitching ? " glitching" : "") + (className ? " " + className : "")}
      style={{
        border: "1px solid " + borderColor,
        boxShadow: "0 0 24px -8px " + glowColor + ", inset 0 0 20px rgba(0,0,0,0.4)",
        ...(style || {})
      }}
    >
      <div className="sl-corners" />
      {children}
    </div>
  );
}
function SL({ text, ac }) {
  const c = ac || SYS_BLUE;
  return (
    <div style={{ marginBottom:20 }}>
      <div className="sl-header-bar" style={{ borderBottom:"1px solid "+c+"44", background:"linear-gradient(90deg,"+c+"18,"+c+"06)" }}>
        <div style={{ width:20,height:20,border:"1.5px solid "+c,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
          <span style={{ color:c,fontFamily:"'Orbitron',sans-serif",fontSize:10,fontWeight:900,lineHeight:1 }}>!</span>
        </div>
        <span className="sl-header-title" style={{ color:c === SYS_BLUE ? "#c8eeff" : c, textShadow:"0 0 12px "+c+"aa,0 0 28px "+c+"44" }}>{text}</span>
      </div>
    </div>
  );
}
function Bang({ size, color }) {
  const s = size || 40;
  const c = color || SYS_BLUE;
  return (
    <div style={{
      width:s, height:s,
      border:"1.5px solid "+c,
      display:"flex", alignItems:"center", justifyContent:"center",
      flexShrink:0,
      background: c+"0d",
      boxShadow:"0 0 10px "+c+"44, inset 0 0 8px "+c+"11",
      position:"relative",
    }}>
      {/* Corner dots */}
      <div style={{ position:"absolute",top:2,left:2,width:3,height:3,background:c,opacity:0.5 }} />
      <div style={{ position:"absolute",bottom:2,right:2,width:3,height:3,background:c,opacity:0.5 }} />
      <span style={{ color:c, fontWeight:900, fontSize:s*0.44, fontFamily:"'Orbitron',sans-serif", lineHeight:1, textShadow:"0 0 8px "+c }}>!</span>
    </div>
  );
}
function XpBar({ xp, level, ac }) {
  const safeXp    = (typeof xp    === "number" && isFinite(xp))    ? xp    : 0;
  const safeLevel = (typeof level === "number" && isFinite(level) && level >= 1) ? level : 1;
  const needed    = xpForLevel(safeLevel);
  const pct       = needed > 0 ? clamp((safeXp / needed) * 100, 0, 100) : 0;
  const c         = ac || SYS_BLUE;
  return (
    <div style={{ display:"flex",alignItems:"center",gap:10,flex:1 }}>
      <span style={{ color:c+"99",fontSize:9,fontFamily:"'Orbitron',sans-serif",letterSpacing:"0.15em",whiteSpace:"nowrap",flexShrink:0 }}>XP</span>
      <div className="sl-bar-track" style={{ flex:1 }}>
        <div className="sl-bar-fill" style={{ width:pct+"%", background:"linear-gradient(90deg,"+c+","+c+"cc)", boxShadow:"0 0 6px "+c+"88" }} />
      </div>
      <span style={{ color:c+"88",fontSize:9,fontFamily:"'Orbitron',sans-serif",whiteSpace:"nowrap",flexShrink:0 }}>{safeXp}/{needed}</span>
    </div>
  );
}
function Toast({ message, kind, ac, isMonarch }) {
  const c = isMonarch ? MONARCH_PURP
    : kind==="xp"      ? "#f5b65d"
    : kind==="ach"     ? "#a05df5"
    : kind==="evolve"  ? "#2ee88a"
    : kind==="glitch"  ? GLITCH_RED
    : kind==="warning" ? "#ff8800"
    : kind==="denied"  ? "#f53d3d"
    : kind==="system"  ? SYS_BLUE
    : ac || SYS_BLUE;
  return (
    <div style={{
      position:"fixed", bottom:28, left:"50%",
      transform:"translateX(-50%)",
      zIndex:9999,
      background:"linear-gradient(90deg,rgba(2,6,18,0.98),rgba(3,8,22,0.98))",
      border:"1px solid "+c+"88",
      boxShadow:"0 0 24px "+c+"44, 0 0 4px "+c+"22",
      padding:"9px 20px",
      display:"flex", alignItems:"center", gap:10,
      minWidth:240, maxWidth:420,
      pointerEvents:"none",
      animation:"toast-in 0.28s ease forwards",
    }}>
      {/* Corner accents */}
      <div style={{ position:"absolute",top:0,left:0,width:8,height:8,borderTop:"1.5px solid "+c,borderLeft:"1.5px solid "+c }} />
      <div style={{ position:"absolute",bottom:0,right:0,width:8,height:8,borderBottom:"1.5px solid "+c,borderRight:"1.5px solid "+c }} />
      <div style={{ width:18,height:18,border:"1.5px solid "+c,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
        <span style={{ color:c,fontFamily:"'Orbitron',sans-serif",fontSize:9,fontWeight:900,lineHeight:1 }}>!</span>
      </div>
      <span style={{ color:isMonarch?c:"#d0eeff",fontSize:12,fontFamily:"'Rajdhani',sans-serif",fontWeight:600,letterSpacing:"0.05em",lineHeight:1.3 }}>{message}</span>
    </div>
  );
}
function GlitchOverlay({ intensity }) {
  if (!intensity) return null;
  return (<div style={{ position:"fixed",inset:0,zIndex:5000,pointerEvents:"none" }}><div style={{ position:"absolute",left:0,right:0,height:2,background:"linear-gradient(90deg,transparent,"+GLITCH_RED+"44,transparent)",animation:"scan-line 3s linear infinite",opacity:intensity*0.6 }} /><div style={{ position:"absolute",inset:0,background:"radial-gradient(ellipse at center,transparent 60%,"+MONARCH_PURP+Math.round(intensity*0.12*255).toString(16).padStart(2,"0")+" 100%)" }} />{intensity>0.5&&<div style={{ position:"absolute",inset:0,background:"repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(155,48,255,0.015) 3px,rgba(155,48,255,0.015) 4px)" }} />}</div>);
}
function CrypticNote({ message, onDismiss }) {
  return (
    <div style={{ position:"fixed",inset:0,zIndex:8000,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(3,0,8,0.88)",backdropFilter:"blur(4px)",padding:24 }}>
      <div className="fade-in-up" style={{ maxWidth:440,width:"100%",border:"1px solid "+GLITCH_RED+"88",background:"linear-gradient(160deg,rgba(20,5,30,0.99),rgba(5,0,10,0.99))",padding:"32px 28px",position:"relative",overflow:"hidden" }}>
        <div style={{ position:"absolute",inset:0,pointerEvents:"none",background:"repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(155,48,255,0.04) 2px,rgba(155,48,255,0.04) 4px)" }} />
        <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:20 }}>
          <div className="pulse-glow" style={{ width:36,height:36,border:"2px solid "+GLITCH_RED,display:"flex",alignItems:"center",justifyContent:"center" }}><span style={{ color:GLITCH_RED,fontWeight:900,fontSize:16,fontFamily:"'Orbitron',sans-serif" }}>!</span></div>
          <div style={{ padding:"6px 16px",border:"1px solid "+GLITCH_RED+"66" }}><span className="flicker" style={{ fontFamily:"'Orbitron',sans-serif",fontSize:12,fontWeight:700,color:GLITCH_RED,letterSpacing:"0.2em" }}>UNKNOWN SYSTEM ACTIVITY</span></div>
        </div>
        <p className="flicker" style={{ fontSize:15,color:"#c8a0e8",lineHeight:1.7,marginBottom:24,fontFamily:"'Rajdhani',sans-serif" }}>{message}</p>
        <div style={{ fontFamily:"monospace",fontSize:10,color:MONARCH_DIM+"88",marginBottom:20,lineHeight:1.8 }}>{"> SCAN_ID: "+Math.floor(Math.random()*9999999).toString(16).toUpperCase()}<br />{"> ORIGIN: [REDACTED]"}</div>
        <button onClick={onDismiss} style={{ width:"100%",padding:"10px 0",background:"transparent",border:"1px solid "+GLITCH_RED+"55",color:GLITCH_RED+"aa",cursor:"pointer",fontFamily:"'Orbitron',sans-serif",fontSize:11,letterSpacing:"0.2em" }}>ACKNOWLEDGE</button>
      </div>
    </div>
  );
}

/* ===========================================================================
   HARDCORE ONBOARDING — AWAKENING REGISTRATION
   Step 0: "Do you wish to become a Hunter?"
   Step 1: Name
   Step 2: Class
   Step 3: Physique
   Step 4: Goals
   Step 5–10: Calisthenics evaluation tests
   Step 11: Evaluating cinematic
   Step 12: Rank reveal
   =========================================================================== */
function AwakeningRegistration({ onComplete }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [chosenClass, setChosenClass] = useState(null);
  const [chosenPhysique, setChosenPhysique] = useState(null);
  const [chosenGoals, setChosenGoals] = useState([]);
  const [evalScores, setEvalScores] = useState({});
  const [evalInput, setEvalInput] = useState("");
  const [evaluating, setEvaluating] = useState(false);
  const [evalResult, setEvalResult] = useState(null);
  const evalTimerRef = useRef(null);

  const currentTestIndex = step - 5; /* steps 5-10 are tests */
  const currentTest = EVAL_TESTS[currentTestIndex] || null;

  function toggleGoal(id) {
    setChosenGoals(function(prev) {
      if (prev.includes(id)) return prev.filter(function(g) { return g !== id; });
      if (prev.length >= 3) return prev; /* max 3 goals */
      return prev.concat([id]);
    });
  }

  function submitEvalScore() {
    if (!evalInput || !currentTest) return;
    const val = parseFloat(evalInput) || 0;
    const next = Object.assign({}, evalScores, { [currentTest.id]: val });
    setEvalScores(next);
    setEvalInput("");
    if (currentTestIndex + 1 < EVAL_TESTS.length) {
      setStep(function(s) { return s + 1; });
    } else {
      /* All tests done — evaluate */
      setEvaluating(true);
      setStep(11);
      evalTimerRef.current = setTimeout(function() {
        const result = computeEvaluation(next);
        setEvalResult(result);
        setEvaluating(false);
        setStep(12);
      }, 5000);
    }
  }

  useEffect(function() { return function() { if (evalTimerRef.current) clearTimeout(evalTimerRef.current); }; }, []);

  function finish() {
    if (!evalResult) return;
    const physique = PHYSIQUES.find(function(p) { return p.id === chosenPhysique; });
    const baseStats = Object.assign({}, evalResult.stats);
    if (physique) {
      Object.keys(physique.statBonus).forEach(function(k) { baseStats[k] = (baseStats[k]||10) + physique.statBonus[k]; });
    }
    onComplete({
      name: name.trim() || "Hunter",
      hunterClass: chosenClass || "unknown",
      physique: chosenPhysique || "hybrid",
      goals: chosenGoals,
      startLevel: evalResult.startLevel,
      stats: baseStats,
    });
  }

  const accentMap = { 0:"#4db8ff", 1:"#4db8ff", 2:"#4db8ff", 3:"#a05df5", 4:"#f5b65d" };
  const accent = currentTest ? currentTest.stat === "Strength" ? "#f53d3d" : currentTest.stat === "Agility" ? "#4db8ff" : currentTest.stat === "Discipline" ? "#a05df5" : "#6fae6f" : accentMap[Math.min(step,4)] || SYS_BLUE;

  return (
    <div style={{ minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:"24px 16px" }}>
      <Win ac={accent} className="fade-in-up" style={{ maxWidth:520,width:"100%" }}>
        <div style={{ padding:"36px 32px" }}>

          {/* STEP 0: Consent */}
          {step===0&&(
            <div className="fade-in">
              <div style={{ textAlign:"center",marginBottom:32 }}>
                <div style={{ fontFamily:"'Orbitron',sans-serif",fontSize:10,letterSpacing:"0.4em",color:SYS_BLUE,marginBottom:12 }}>SYSTEM NOTIFICATION</div>
                <div style={{ height:1,background:"linear-gradient(90deg,transparent,"+SYS_BLUE+",transparent)",marginBottom:24 }} />
                <div style={{ fontFamily:"'Orbitron',sans-serif",fontSize:22,fontWeight:700,color:"#eaf2ff",lineHeight:1.4,marginBottom:16 }}>
                  You have acquired the qualification to become a Player.
                </div>
                <p style={{ fontSize:14,color:"#9fb8d8",lineHeight:1.8,marginBottom:8 }}>
                  The System has detected latent potential within your physical vessel. A Hunter Awakening event has been triggered.
                </p>
                <p style={{ fontSize:13,color:"#5b7aa0",lineHeight:1.7 }}>
                  From this point forward, all physical effort will be tracked, measured, and rewarded. Nothing is given freely. Everything must be earned.
                </p>
              </div>
              <p style={{ textAlign:"center",fontSize:16,color:"#dbe6ff",fontWeight:600,marginBottom:24 }}>Do you wish to become a Hunter?</p>
              <div style={{ display:"flex",gap:12 }}>
                <button onClick={function(){setStep(1);}} style={{ flex:1,padding:"14px",background:SYS_BLUE,color:"#03050c",border:"none",cursor:"pointer",fontFamily:"'Orbitron',sans-serif",fontSize:13,fontWeight:700,letterSpacing:"0.15em" }}>I ACCEPT</button>
                <button onClick={function(){setStep(1);}} style={{ flex:1,padding:"14px",background:"transparent",border:"1px solid #2a3a55",color:"#5b7aa0",cursor:"pointer",fontFamily:"'Orbitron',sans-serif",fontSize:11 }}>
                  I have no choice
                </button>
              </div>
            </div>
          )}

          {/* STEP 1: Name */}
          {step===1&&(
            <div className="fade-in">
              <div style={{ textAlign:"center",marginBottom:24 }}>
                <div style={{ fontFamily:"'Orbitron',sans-serif",fontSize:10,letterSpacing:"0.35em",color:SYS_BLUE,marginBottom:8 }}>HUNTER AWAKENING REGISTRATION</div>
                <div style={{ height:1,background:"linear-gradient(90deg,transparent,"+SYS_BLUE+",transparent)" }} />
              </div>
              <p style={{ color:"#9fb8d8",fontSize:15,textAlign:"center",marginBottom:20 }}>Designate your hunter name.</p>
              <input autoFocus value={name} onChange={function(e){setName(e.target.value);}} onKeyDown={function(e){if(e.key==="Enter"&&name.trim())setStep(2);}} placeholder="Enter name..."
                style={{ width:"100%",background:"transparent",border:"none",borderBottom:"2px solid "+SYS_BLUE,color:"#eaf2ff",fontSize:22,textAlign:"center",padding:"8px 0",outline:"none",fontFamily:"'Orbitron',sans-serif",marginBottom:24 }} />
              <button disabled={!name.trim()} onClick={function(){setStep(2);}} style={{ width:"100%",padding:"12px",background:name.trim()?SYS_BLUE:"#1a2438",color:name.trim()?"#03050c":"#5b7aa0",fontWeight:700,fontSize:13,letterSpacing:"0.2em",border:"none",cursor:name.trim()?"pointer":"not-allowed",fontFamily:"'Orbitron',sans-serif" }}>CONFIRM</button>
            </div>
          )}

          {/* STEP 2: Class */}
          {step===2&&(
            <div className="fade-in">
              <div style={{ marginBottom:20,textAlign:"center" }}>
                <div style={{ fontFamily:"'Orbitron',sans-serif",fontSize:10,letterSpacing:"0.35em",color:SYS_BLUE,marginBottom:8 }}>CLASSIFICATION</div>
                <div style={{ height:1,background:"linear-gradient(90deg,transparent,"+SYS_BLUE+",transparent)",marginBottom:12 }} />
                <p style={{ fontSize:14,color:"#9fb8d8" }}>Select your Hunter Class.</p>
              </div>
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16 }}>
                {HUNTER_CLASSES.map(function(cls) {
                  const sel = chosenClass===cls.id;
                  return (
                    <button key={cls.id} onClick={function(){setChosenClass(cls.id);}}
                      style={{ padding:"12px 10px",background:sel?"rgba(77,184,255,0.12)":"transparent",border:sel?"1px solid "+SYS_BLUE:"1px solid rgba(77,184,255,0.2)",color:sel?"#eaf2ff":"#9fb8d8",cursor:"pointer",textAlign:"left" }}>
                      <div style={{ fontSize:16,marginBottom:2 }}>{cls.icon}</div>
                      <div style={{ fontFamily:"'Orbitron',sans-serif",fontSize:11,fontWeight:700,color:sel?SYS_BLUE:"#9fb8d8" }}>{cls.name}</div>
                      <div style={{ fontSize:10,color:"#5b7aa0",marginTop:2,lineHeight:1.4 }}>{cls.desc.split(".")[0]}</div>
                    </button>
                  );
                })}
              </div>
              <button disabled={!chosenClass} onClick={function(){setStep(3);}} style={{ width:"100%",padding:"12px",background:chosenClass?SYS_BLUE:"#1a2438",color:chosenClass?"#03050c":"#5b7aa0",fontWeight:700,fontSize:12,letterSpacing:"0.2em",border:"none",cursor:chosenClass?"pointer":"not-allowed",fontFamily:"'Orbitron',sans-serif" }}>CONFIRM CLASS</button>
            </div>
          )}

          {/* STEP 3: Physique */}
          {step===3&&(
            <div className="fade-in">
              <div style={{ marginBottom:20,textAlign:"center" }}>
                <div style={{ fontFamily:"'Orbitron',sans-serif",fontSize:10,letterSpacing:"0.35em",color:"#a05df5",marginBottom:8 }}>PHYSIQUE TARGET</div>
                <div style={{ height:1,background:"linear-gradient(90deg,transparent,#a05df5,transparent)",marginBottom:12 }} />
                <p style={{ fontSize:14,color:"#9fb8d8" }}>Select your dream physique.</p>
              </div>
              <div style={{ display:"flex",flexDirection:"column",gap:8,marginBottom:16 }}>
                {PHYSIQUES.map(function(p) {
                  const sel = chosenPhysique===p.id;
                  return (
                    <button key={p.id} onClick={function(){setChosenPhysique(p.id);}}
                      style={{ padding:"12px 14px",background:sel?"rgba(160,93,245,0.1)":"transparent",border:sel?"1px solid #a05df5":"1px solid rgba(160,93,245,0.2)",color:"#dbe6ff",cursor:"pointer",textAlign:"left",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                      <div>
                        <div style={{ fontFamily:"'Orbitron',sans-serif",fontSize:12,fontWeight:700,color:sel?"#a05df5":"#9fb8d8" }}>{p.name}</div>
                        <div style={{ fontSize:11,color:"#5b7aa0",marginTop:2 }}>{p.desc}</div>
                      </div>
                      {sel&&<span style={{ color:"#a05df5",fontSize:16 }}>✓</span>}
                    </button>
                  );
                })}
              </div>
              <button disabled={!chosenPhysique} onClick={function(){setStep(4);}} style={{ width:"100%",padding:"12px",background:chosenPhysique?"#a05df5":"#1a2438",color:chosenPhysique?"#03050c":"#5b7aa0",fontWeight:700,fontSize:12,letterSpacing:"0.2em",border:"none",cursor:chosenPhysique?"pointer":"not-allowed",fontFamily:"'Orbitron',sans-serif" }}>CONFIRM PHYSIQUE</button>
            </div>
          )}

          {/* STEP 4: Goals */}
          {step===4&&(
            <div className="fade-in">
              <div style={{ marginBottom:20,textAlign:"center" }}>
                <div style={{ fontFamily:"'Orbitron',sans-serif",fontSize:10,letterSpacing:"0.35em",color:"#f5b65d",marginBottom:8 }}>OBJECTIVES</div>
                <div style={{ height:1,background:"linear-gradient(90deg,transparent,#f5b65d,transparent)",marginBottom:12 }} />
                <p style={{ fontSize:14,color:"#9fb8d8" }}>Select up to 3 primary goals.</p>
              </div>
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16 }}>
                {GOAL_OPTIONS.map(function(g) {
                  const sel = chosenGoals.includes(g.id);
                  return (
                    <button key={g.id} onClick={function(){toggleGoal(g.id);}}
                      style={{ padding:"10px 12px",background:sel?"rgba(245,182,93,0.1)":"transparent",border:sel?"1px solid #f5b65d":"1px solid rgba(245,182,93,0.2)",color:sel?"#eaf2ff":"#9fb8d8",cursor:"pointer",display:"flex",alignItems:"center",gap:8 }}>
                      <span style={{ fontSize:16 }}>{g.icon}</span>
                      <span style={{ fontSize:13,fontWeight:sel?700:400 }}>{g.name}</span>
                      {sel&&<span style={{ color:"#f5b65d",marginLeft:"auto" }}>✓</span>}
                    </button>
                  );
                })}
              </div>
              <div style={{ fontSize:11,color:"#5b7aa0",textAlign:"center",marginBottom:16 }}>{chosenGoals.length}/3 selected</div>
              <button disabled={chosenGoals.length===0} onClick={function(){setStep(5);}} style={{ width:"100%",padding:"12px",background:chosenGoals.length>0?"#f5b65d":"#1a2438",color:chosenGoals.length>0?"#03050c":"#5b7aa0",fontWeight:700,fontSize:12,letterSpacing:"0.2em",border:"none",cursor:chosenGoals.length>0?"pointer":"not-allowed",fontFamily:"'Orbitron',sans-serif" }}>BEGIN EVALUATION</button>
            </div>
          )}

          {/* STEPS 5-10: Evaluation tests */}
          {step>=5&&step<=10&&currentTest&&(
            <div className="fade-in" key={step}>
              <div style={{ textAlign:"center",marginBottom:8 }}>
                <div style={{ fontFamily:"'Orbitron',sans-serif",fontSize:10,letterSpacing:"0.35em",color:accent,marginBottom:8 }}>PHYSICAL EVALUATION</div>
                <div style={{ height:1,background:"linear-gradient(90deg,transparent,"+accent+",transparent)",marginBottom:16 }} />
                <div style={{ display:"flex",justifyContent:"center",gap:6,marginBottom:16 }}>
                  {EVAL_TESTS.map(function(_,i) { return <div key={i} style={{ width:8,height:8,borderRadius:"50%",background:i<currentTestIndex?"#2ee88a":i===currentTestIndex?accent:"#1a2438" }} />; })}
                </div>
              </div>
              <div style={{ textAlign:"center",marginBottom:20 }}>
                <div style={{ fontSize:28,marginBottom:8 }}>{currentTest.icon}</div>
                <div style={{ fontFamily:"'Orbitron',sans-serif",fontSize:18,fontWeight:700,color:"#eaf2ff",marginBottom:6 }}>{currentTest.name}</div>
                <div style={{ fontSize:12,color:"#5b7aa0" }}>
                  {currentTest.invert ? "Enter your time in seconds (lower = better)" : "Enter your maximum reps / hold time"}
                </div>
              </div>
              <input autoFocus type="number" min="0" value={evalInput} onChange={function(e){setEvalInput(e.target.value);}} onKeyDown={function(e){if(e.key==="Enter"&&evalInput)submitEvalScore();}}
                placeholder="0"
                style={{ width:"100%",background:"transparent",border:"none",borderBottom:"2px solid "+accent,color:"#eaf2ff",fontSize:32,textAlign:"center",padding:"8px 0",outline:"none",fontFamily:"'Orbitron',sans-serif",marginBottom:24 }} />
              <button disabled={!evalInput} onClick={submitEvalScore} style={{ width:"100%",padding:"12px",background:evalInput?accent:"#1a2438",color:evalInput?"#03050c":"#5b7aa0",fontWeight:700,fontSize:12,letterSpacing:"0.2em",border:"none",cursor:evalInput?"pointer":"not-allowed",fontFamily:"'Orbitron',sans-serif" }}>
                {currentTestIndex+1<EVAL_TESTS.length?"SUBMIT & CONTINUE":"COMPLETE EVALUATION"}
              </button>
            </div>
          )}

          {/* STEP 11: Evaluating cinematic */}
          {step===11&&(
            <div className="fade-in" style={{ textAlign:"center",padding:"20px 0" }}>
              <div style={{ width:80,height:80,borderRadius:"50%",border:"3px solid "+SYS_BLUE,borderTopColor:"transparent",animation:"shake 0.3s linear infinite",margin:"0 auto 24px",boxShadow:"0 0 30px "+SYS_BLUE }} />
              <div className="flicker" style={{ fontFamily:"'Orbitron',sans-serif",fontSize:16,color:SYS_BLUE,letterSpacing:"0.2em",marginBottom:12 }}>EVALUATING HUNTER...</div>
              <div style={{ fontFamily:"monospace",fontSize:11,color:"#5b7aa0",lineHeight:2 }}>
                <div className="fade-in">Analyzing combat potential...</div>
                <div className="fade-in" style={{ animationDelay:"0.8s" }}>Measuring aura output...</div>
                <div className="fade-in" style={{ animationDelay:"1.6s" }}>Classifying latent abilities...</div>
                <div className="fade-in" style={{ animationDelay:"2.4s" }}>Assigning rank...</div>
              </div>
            </div>
          )}

          {/* STEP 12: Rank reveal */}
          {step===12&&evalResult&&(
            <div className="fade-in" style={{ textAlign:"center" }}>
              <div style={{ fontFamily:"'Orbitron',sans-serif",fontSize:10,letterSpacing:"0.4em",color:evalResult.startRank.color,marginBottom:16 }}>RANK ASSIGNED</div>
              <div style={{ width:120,height:120,borderRadius:"50%",border:"3px solid "+evalResult.startRank.color,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px",boxShadow:"0 0 40px "+evalResult.startRank.color+"66" }}>
                <span style={{ fontFamily:"'Orbitron',sans-serif",fontSize:40,fontWeight:900,color:evalResult.startRank.color }}>{evalResult.startRank.name[0]}</span>
              </div>
              <div style={{ fontFamily:"'Orbitron',sans-serif",fontSize:28,fontWeight:900,color:evalResult.startRank.color,marginBottom:4 }}>{evalResult.startRank.name}</div>
              <div style={{ fontSize:14,color:"#9fb8d8",marginBottom:20 }}>{evalResult.startRank.title}</div>
              <div style={{ padding:"12px 16px",border:"1px solid "+evalResult.startRank.color+"44",background:evalResult.startRank.color+"11",marginBottom:24,fontSize:12,color:"#9fb8d8",lineHeight:1.7 }}>
                Your physical evaluation has been processed. Your starting rank reflects your current capabilities. It can only be raised through earned effort — never purchased, never given.
              </div>
              <button onClick={finish} style={{ width:"100%",padding:"14px",background:evalResult.startRank.color,color:"#03050c",border:"none",cursor:"pointer",fontFamily:"'Orbitron',sans-serif",fontSize:13,fontWeight:700,letterSpacing:"0.15em" }}>ENTER THE SYSTEM</button>
            </div>
          )}

        </div>
      </Win>
    </div>
  );
}

/* ===========================================================================
   QUEST CARD
   =========================================================================== */
function QuestCard({ quest, progress, isDone, onGoalTap, ac }) {
  const color = ac || SYS_BLUE;
  return (
    <div className="sl-panel fade-in" style={{ border:"1px solid "+color+"55", boxShadow:"0 0 40px -10px "+color+"33, inset 0 0 30px rgba(0,0,0,0.4)" }}>
      <div className="sl-corners" />

      {/* QUEST INFO header bar — matches Image 1 exactly */}
      <div style={{ display:"flex",alignItems:"center",gap:0,borderBottom:"1px solid "+color+"44",background:"linear-gradient(90deg,"+color+"0d,transparent)" }}>
        <div style={{ width:52,display:"flex",alignItems:"center",justifyContent:"center",borderRight:"1px solid "+color+"33",padding:"11px 0" }}>
          <Bang size={32} color={color} />
        </div>
        <div style={{ flex:1,padding:"11px 16px",background:"linear-gradient(90deg,"+color+"18,"+color+"06)" }}>
          <span className="sl-header-title" style={{ color:"#e0f4ff",textShadow:"0 0 12px "+color+"aa,0 0 30px "+color+"44",fontSize:15,letterSpacing:"0.3em" }}>
            QUEST INFO
          </span>
        </div>
      </div>

      <div style={{ padding:"20px 24px" }}>
        {/* Quest arrival line */}
        <p style={{ textAlign:"center",fontSize:13,color:"#9ab8d4",marginBottom:4,fontFamily:"'Rajdhani',sans-serif",fontWeight:500 }}>
          [Daily Quest: <strong style={{ color:"#d0eeff",textShadow:"0 0 8px "+color+"88" }}>{quest.label}</strong> has arrived.]
          {quest.tier>0&&<span style={{ fontSize:10,color:color,marginLeft:6 }}>[TIER {quest.tier}]</span>}
        </p>

        {/* Cyan divider */}
        <div style={{ height:1,margin:"14px 0",background:"linear-gradient(90deg,transparent,"+color+"99,transparent)" }} />

        {/* GOALS header */}
        <div style={{ textAlign:"center",marginBottom:16,fontFamily:"'Orbitron',sans-serif",fontSize:12,fontWeight:700,letterSpacing:"0.35em",color:"#c8eeff",textShadow:"0 0 10px "+color+"66" }}>GOALS</div>

        {/* Goal rows */}
        <div style={{ maxWidth:440,margin:"0 auto" }}>
          {quest.goals.map(function(goal) {
            const cur = Math.max(0, parseInt(progress[goal.id], 10) || 0);
            const done = cur >= goal.target;
            const canTap = !done && !isDone;
            return (
              <div key={goal.id}
                onClick={function(){ if(canTap && typeof onGoalTap==="function") onGoalTap(goal.id); }}
                className={"sl-goal-row" + (canTap?" tappable":"")}>
                <span style={{ fontSize:15,fontFamily:"'Rajdhani',sans-serif",fontWeight:600,color:done?"#3a6a4a":"#d8eeff",letterSpacing:"0.05em" }}>{goal.name}</span>
                <div style={{ display:"flex",alignItems:"center",gap:8,flexShrink:0 }}>
                  <span style={{ fontSize:13,fontFamily:"'Rajdhani',sans-serif",fontWeight:700,color:done?"#2ee88a":"#7ab8d4",letterSpacing:"0.05em" }}>[{cur}/{goal.target}{goal.unit}]</span>
                  <div style={{
                    width:22, height:22,
                    border:"1.5px solid "+(done?"#2ee88a":color+"66"),
                    background:done?"rgba(46,232,138,0.12)":"transparent",
                    display:"flex",alignItems:"center",justifyContent:"center",
                    fontSize:12,color:"#2ee88a",
                    boxShadow:done?"0 0 8px rgba(46,232,138,0.4)":"none",
                    transition:"all 0.2s",
                  }}>{done?"✓":""}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom divider + warning */}
        <div style={{ height:1,margin:"16px 0 12px",background:"linear-gradient(90deg,transparent,"+color+"44,transparent)" }} />
        {isDone
          ? <p style={{ textAlign:"center",fontSize:13,fontWeight:700,color:"#2ee88a",fontFamily:"'Orbitron',sans-serif",letterSpacing:"0.1em",textShadow:"0 0 10px rgba(46,232,138,0.5)" }}>◈ QUEST COMPLETE — Rewards granted.</p>
          : <p className="sl-warning" style={{ textAlign:"center" }}>
              WARNING: Failure to complete the daily quest will result in an appropriate <strong>penalty.</strong>
            </p>
        }
      </div>
    </div>
  );
}

/* ===========================================================================
   HIDDEN QUEST POPUP
   =========================================================================== */
function HiddenQuestPopup({ quest, onAccept, onDecline }) {
  const rc = quest.rarity==="LEGENDARY"?"#f5b65d":quest.rarity==="RARE"?"#a05df5":"#4db8ff";
  return (
    <div style={{ position:"fixed",inset:0,zIndex:8600,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(3,5,12,0.9)",backdropFilter:"blur(8px)",padding:"24px 16px" }}>
      <div className="fade-in-up" style={{ maxWidth:480,width:"100%",border:"1px solid "+rc+"88",background:"linear-gradient(160deg,rgba(10,14,26,0.99),rgba(5,8,18,0.99))",boxShadow:"0 0 60px "+rc+"33",position:"relative",overflow:"hidden" }}>
        <div style={{ position:"absolute",inset:0,pointerEvents:"none",background:"repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(255,255,255,0.012) 2px,rgba(255,255,255,0.012) 4px)" }} />
        <div style={{ padding:"28px 26px",position:"relative" }}>
          <div style={{ display:"flex",justifyContent:"flex-end",marginBottom:12 }}><span style={{ fontSize:10,padding:"2px 10px",border:"1px solid "+rc,color:rc,fontFamily:"'Orbitron',sans-serif",letterSpacing:"0.2em" }}>{quest.rarity}</span></div>
          <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:16 }}><Bang size={36} color={rc} /><div style={{ padding:"6px 18px",border:"1.5px solid "+rc }}><span style={{ fontFamily:"'Orbitron',sans-serif",fontSize:14,fontWeight:700,color:"#eaf2ff" }}>HIDDEN QUEST</span></div></div>
          <p style={{ textAlign:"center",fontSize:13,color:"#cfe0f5",marginBottom:6 }}>[Hidden Quest: <strong style={{ color:rc }}>{quest.label}</strong> has appeared.]</p>
          <p style={{ textAlign:"center",fontSize:12,color:"#7e98ba",lineHeight:1.6,marginBottom:16 }}>{quest.flavor}</p>
          <div style={{ height:1,margin:"14px 0",background:"linear-gradient(90deg,transparent,"+rc+"88,transparent)" }} />
          <div style={{ fontFamily:"'Orbitron',sans-serif",fontSize:12,fontWeight:700,textAlign:"center",marginBottom:12,color:"#eaf2ff",letterSpacing:"0.2em" }}>GOALS</div>
          <div style={{ marginBottom:16 }}>
            {quest.goals.map(function(g) { return (<div key={g.id} style={{ display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:"1px solid rgba(77,184,255,0.08)" }}><span style={{ fontSize:13,color:"#dbe6ff" }}>{g.name}</span><span style={{ fontSize:12,color:"#9fb8d8" }}>[0/{g.target}{g.unit}]</span></div>); })}
          </div>
          <div style={{ padding:"8px 14px",marginBottom:16,border:"1px solid "+rc+"44",background:rc+"11",textAlign:"center",fontSize:13,fontWeight:700,color:rc }}>+{quest.xp} XP · {quest.statKey} +{quest.statGain}</div>
          <p style={{ textAlign:"center",fontSize:11,color:"#5b7aa0",marginBottom:16 }}>This quest will not wait. Accept now or it disappears.</p>
          <div style={{ display:"flex",gap:10 }}>
            <button onClick={onAccept} style={{ flex:1,padding:"11px",background:rc,color:"#03050c",border:"none",cursor:"pointer",fontFamily:"'Orbitron',sans-serif",fontSize:12,fontWeight:700,letterSpacing:"0.15em" }}>ACCEPT</button>
            <button onClick={onDecline} style={{ flex:1,padding:"11px",background:"transparent",border:"1px solid "+rc+"55",color:rc+"99",cursor:"pointer",fontFamily:"'Orbitron',sans-serif",fontSize:11 }}>DECLINE</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===========================================================================
   ACTIVE HIDDEN QUEST CARD
   =========================================================================== */
function HiddenQuestCard({ quest, progress, onGoalTap, ac }) {
  const rc = quest.rarity==="LEGENDARY"?"#f5b65d":quest.rarity==="RARE"?"#a05df5":"#4db8ff";
  const allDone = quest.goals.every(function(g){return (progress[g.id]||0)>=g.target;});
  return (
    <Win ac={rc} style={{ marginBottom:16 }}>
      <div style={{ padding:"16px 20px" }}>
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8 }}>
          <div style={{ display:"flex",alignItems:"center",gap:8 }}><Bang size={24} color={rc} /><div><div style={{ fontFamily:"'Orbitron',sans-serif",fontSize:11,fontWeight:700,color:"#eaf2ff" }}>{quest.label}</div><div style={{ fontSize:10,color:rc }}>HIDDEN · {quest.rarity}</div></div></div>
          {allDone&&<span style={{ fontSize:11,color:"#2ee88a",fontWeight:700 }}>COMPLETE ✓</span>}
        </div>
        <div style={{ height:1,background:rc+"33",marginBottom:10 }} />
        {quest.goals.map(function(g){
          const cur=progress[g.id]||0; const done=cur>=g.target; const canTap=!done&&!allDone;
          return (<div key={g.id} onClick={function(){if(canTap&&typeof onGoalTap==="function")onGoalTap(quest.id,g.id);}} style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid rgba(77,184,255,0.07)",cursor:canTap?"pointer":"default" }}><span style={{ fontSize:13,fontWeight:600,color:done?"#5a7a5a":"#dbe6ff" }}>{g.name}</span><div style={{ display:"flex",alignItems:"center",gap:6 }}><span style={{ fontSize:11,color:done?"#2ee88a":"#9fb8d8" }}>[{cur}/{g.target}{g.unit}]</span><div style={{ width:14,height:14,border:"1.5px solid "+(done?"#2ee88a":rc+"66"),background:done?"#2ee88a22":"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"#2ee88a" }}>{done?"✓":""}</div></div></div>);
        })}
      </div>
    </Win>
  );
}

/* ===========================================================================
   DUNGEON CHAIN
   =========================================================================== */
function DungeonChain({ gate, onComplete, onAbandon, sfx, modifier }) {
  const [roomIndex, setRoomIndex]   = useState(0);
  const [choices, setChoices]       = useState([]);
  const [done, setDone]             = useState(false);
  const [activeEvent, setActiveEvent] = useState(null); /* dungeon event between rooms */
  const [collectedEvents, setCollectedEvents] = useState([]);
  const rooms = gate.rooms || [];
  const currentRoom = rooms[roomIndex] || null;
  const mod = modifier || DUNGEON_MODIFIERS[0];

  function handleChoice(choice) {
    if (sfx && typeof sfx.sfxComplete==="function") sfx.sfxComplete();
    const next = choices.concat([choice]);
    setChoices(next);
    if (roomIndex+1 < rooms.length) {
      /* Roll dungeon event between rooms */
      const event = rollDungeonEvent();
      if (event) { setActiveEvent(event); }
      else { setRoomIndex(function(r){return r+1;}); }
    } else {
      setDone(true);
      setTimeout(function(){if(typeof onComplete==="function")onComplete(next, mod, collectedEvents);},1200);
    }
  }

  function handleEventCollect() {
    if (!activeEvent) return;
    setCollectedEvents(function(prev){ return prev.concat([activeEvent]); });
    setActiveEvent(null);
    setRoomIndex(function(r){return r+1;});
  }

  return (
    <div style={{ position:"fixed",inset:0,zIndex:8700,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(3,5,12,0.93)",backdropFilter:"blur(8px)",padding:"24px 16px" }}>
      <div style={{ maxWidth:520,width:"100%",border:"1px solid "+gate.color+"88",background:"linear-gradient(160deg,rgba(8,14,26,0.99),rgba(4,8,18,0.99))",position:"relative",overflow:"hidden" }}>
        <div style={{ position:"absolute",inset:0,pointerEvents:"none",background:"repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(255,255,255,0.01) 2px,rgba(255,255,255,0.01) 4px)" }} />
        <div style={{ padding:"28px 28px 24px",position:"relative" }}>
          {/* Modifier badge */}
          {mod.label && (
            <div style={{ padding:"5px 12px", marginBottom:12, border:"1px solid "+mod.color+"88", background:mod.color+"0d", display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ fontFamily:"'Orbitron',sans-serif", fontSize:9, letterSpacing:"0.2em", color:mod.color, fontWeight:700 }}>⚠ {mod.label}</span>
              <span style={{ fontSize:11, color:"#9fb8d8" }}>{mod.desc}</span>
              {mod.xpMod > 1 && <span style={{ fontSize:9, color:"#2ee88a", marginLeft:"auto", whiteSpace:"nowrap" }}>XP ×{mod.xpMod}</span>}
            </div>
          )}

          {/* Dungeon event interrupt */}
          {activeEvent && (
            <div className="fade-in" style={{ textAlign:"center" }}>
              <div style={{ fontFamily:"'Orbitron',sans-serif",fontSize:10,letterSpacing:"0.35em",color:activeEvent.color,marginBottom:10 }} className="dng-warn">
                ⚡ {activeEvent.label}
              </div>
              <p style={{ fontSize:13,color:"#9fb8d8",lineHeight:1.7,marginBottom:14 }}>{activeEvent.desc}</p>
              <div style={{ padding:"8px 12px",border:"1px solid "+activeEvent.color+"44",background:activeEvent.color+"0a",fontSize:12,color:activeEvent.color,fontWeight:700,marginBottom:16 }}>{activeEvent.outcome}</div>
              <button onClick={handleEventCollect} style={{ padding:"10px 28px",background:activeEvent.color,color:"#03050c",border:"none",cursor:"pointer",fontFamily:"'Orbitron',sans-serif",fontSize:11,fontWeight:700,letterSpacing:"0.15em" }}>
                COLLECT & CONTINUE
              </button>
            </div>
          )}

          {/* Normal dungeon room content */}
          {!activeEvent && (
            <>
              <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:16,paddingBottom:14,borderBottom:"1px solid "+gate.color+"44" }}>
                <div style={{ padding:"3px 10px",border:"1px solid "+gate.color,fontFamily:"'Orbitron',sans-serif",fontSize:10,fontWeight:700,color:gate.color,letterSpacing:"0.15em" }}>{gate.rank}-RANK</div>
                <div><div style={{ fontFamily:"'Orbitron',sans-serif",fontSize:14,fontWeight:700,color:"#eaf2ff" }}>{gate.name}</div><div style={{ fontSize:11,color:"#5b7aa0" }}>Room {roomIndex+1} of {rooms.length}</div></div>
              </div>
              {!done&&currentRoom&&(
                <div className="fade-in" key={roomIndex}>
                  <div style={{ fontFamily:"'Orbitron',sans-serif",fontSize:16,fontWeight:700,color:gate.color,marginBottom:10 }}>{currentRoom.title}</div>
                  <p style={{ fontSize:13,color:"#9fb8d8",lineHeight:1.7,marginBottom:20 }}>{currentRoom.desc}</p>
                  <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
                    {currentRoom.choices.map(function(c){
                      return (<button key={c.id} onClick={function(){handleChoice(c);}} style={{ textAlign:"left",padding:"14px 16px",background:"rgba(77,184,255,0.04)",border:"1px solid "+gate.color+"44",color:"#dbe6ff",cursor:"pointer",fontSize:13,lineHeight:1.5 }}><div>{c.text}</div><div style={{ fontSize:11,color:gate.color,marginTop:4 }}>→ {c.outcome}</div></button>);
                    })}
                  </div>
                </div>
              )}
              {done&&<div className="fade-in" style={{ textAlign:"center",padding:"20px 0" }}><div style={{ fontFamily:"'Orbitron',sans-serif",fontSize:14,color:gate.color,marginBottom:8 }}>DUNGEON COMPLETE</div><p style={{ fontSize:13,color:"#9fb8d8" }}>Collecting rewards...</p></div>}
              {!done&&<button onClick={onAbandon} style={{ marginTop:16,width:"100%",padding:"10px",background:"transparent",border:"1px solid #f53d3d33",color:"#f53d3d66",cursor:"pointer",fontFamily:"'Orbitron',sans-serif",fontSize:10,letterSpacing:"0.15em" }}>ABANDON DUNGEON</button>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ===========================================================================
   BOSS DIALOGUE BOX
   =========================================================================== */
function BossDialogueBox({ boss, bossState }) {
  const hpPct = bossState.currentHp / bossState.maxHp;
  const line = bossState.currentHp<=0 ? boss.dialogue.defeat : hpPct<=0.34 ? pickRandom(boss.dialogue.low) : hpPct<=0.67 ? pickRandom(boss.dialogue.mid) : pickRandom(boss.dialogue.intro);
  return (<div className="dialogue-in" style={{ padding:"10px 14px",marginBottom:12,border:"1px solid "+boss.color+"44",background:boss.color+"08",borderLeft:"3px solid "+boss.color,fontSize:13,color:"#c8d8f0",lineHeight:1.6,fontStyle:"italic" }}>{line}</div>);
}

/* ===========================================================================
   MONARCH TRIAL
   =========================================================================== */
function MonarchTrialScreen({ progress, onGoalTap, onForfeit }) {
  const completedCount = MONARCH_TRIAL_GOALS.filter(function(g){return (progress[g.id]||0)>=g.target;}).length;
  const allDone = completedCount===MONARCH_TRIAL_GOALS.length;
  return (
    <div style={{ position:"fixed",inset:0,zIndex:9000,background:"radial-gradient(ellipse at center,"+MONARCH_DARK+" 0%,#000 100%)",overflow:"auto",padding:"20px 16px 60px" }}>
      <div style={{ position:"fixed",inset:0,pointerEvents:"none",zIndex:1,background:"repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(155,48,255,0.06) 2px,rgba(155,48,255,0.06) 4px)" }} />
      <div style={{ position:"fixed",left:0,right:0,height:2,zIndex:2,background:"linear-gradient(90deg,transparent,"+MONARCH_PURP+"88,transparent)",animation:"scan-line 2s linear infinite" }} />
      <div style={{ position:"relative",zIndex:3,maxWidth:600,margin:"0 auto" }}>
        <div style={{ textAlign:"center",marginBottom:32,paddingTop:16 }}>
          <div className="shake" style={{ display:"inline-block",fontFamily:"'Orbitron',sans-serif",fontSize:11,letterSpacing:"0.5em",color:GLITCH_RED,marginBottom:12 }}>⚠ EMERGENCY QUEST ⚠</div>
          <div className="monarch-text" style={{ fontFamily:"'Orbitron',sans-serif",fontSize:28,fontWeight:900,color:MONARCH_PURP,lineHeight:1.2,marginBottom:8 }}>MONARCH TRIAL</div>
          <div style={{ fontSize:14,color:"#8a6ab0",lineHeight:1.7,maxWidth:400,margin:"0 auto" }}>You have met the minimum conditions.<br />A hidden path has revealed itself.<br />Complete all objectives within this session.</div>
        </div>
        <div style={{ border:"1px solid "+GLITCH_RED+"66",background:"rgba(255,34,68,0.06)",padding:"12px 16px",marginBottom:24 }}>
          <p style={{ color:GLITCH_RED,fontSize:12,lineHeight:1.7 }}><strong>WARNING:</strong> One-day only. Failure removes this path. You will not know when — or if — it returns.</p>
        </div>
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20,padding:"10px 16px",border:"1px solid "+MONARCH_PURP+"44",background:"rgba(155,48,255,0.06)" }}>
          <span style={{ fontFamily:"'Orbitron',sans-serif",fontSize:11,color:MONARCH_DIM }}>TRIAL PROGRESS</span>
          <span style={{ fontFamily:"'Orbitron',sans-serif",fontSize:18,fontWeight:700,color:MONARCH_PURP }}>{completedCount} / {MONARCH_TRIAL_GOALS.length}</span>
        </div>
        <div style={{ border:"1px solid "+MONARCH_PURP+"55",background:"linear-gradient(160deg,rgba(20,5,35,0.98),rgba(8,0,16,0.99))",marginBottom:20 }}>
          <div style={{ display:"flex",alignItems:"center",gap:12,padding:"14px 20px",borderBottom:"1px solid "+MONARCH_PURP+"44" }}><Bang size={34} color={MONARCH_PURP} /><div style={{ padding:"5px 18px",border:"1px solid "+MONARCH_PURP }}><span style={{ fontFamily:"'Orbitron',sans-serif",fontSize:14,fontWeight:700,color:"#eaf2ff" }}>QUEST INFO</span></div></div>
          <div style={{ padding:"12px 20px 4px",textAlign:"center" }}><p style={{ color:"#c8a0e8",fontSize:13 }}>[Emergency Quest: <strong style={{ color:MONARCH_PURP }}>Monarch Trial</strong> has arrived.]</p></div>
          <div style={{ height:1,margin:"12px 20px",background:"linear-gradient(90deg,transparent,"+MONARCH_PURP+"88,transparent)" }} />
          <div style={{ textAlign:"center",padding:"0 20px 12px",fontFamily:"'Orbitron',sans-serif",fontSize:13,fontWeight:700,letterSpacing:"0.22em",color:"#eaf2ff" }}>GOALS</div>
          <div style={{ padding:"0 20px 20px" }}>
            {MONARCH_TRIAL_GOALS.map(function(goal){
              const cur=progress[goal.id]||0; const done=cur>=goal.target; const canTap=!done&&!allDone;
              return (<div key={goal.id} onClick={function(){if(canTap&&typeof onGoalTap==="function")onGoalTap(goal.id);}} style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid rgba(155,48,255,0.12)",cursor:canTap?"pointer":"default" }}><span style={{ fontSize:14,fontWeight:600,color:done?"#5a3a7a":"#dbe6ff" }}>{goal.name}</span><div style={{ display:"flex",alignItems:"center",gap:8 }}><span style={{ fontSize:12,color:done?"#2ee88a":"#8a6ab0" }}>[{cur}/{goal.target}{goal.unit}]</span><div style={{ width:20,height:20,border:"1.5px solid "+(done?"#2ee88a":MONARCH_PURP+"77"),background:done?"#2ee88a22":"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"#2ee88a" }}>{done?"✓":""}</div></div></div>);
            })}
          </div>
          <div style={{ borderTop:"1px solid "+MONARCH_PURP+"33",padding:"12px 20px" }}>
            {allDone?<p style={{ textAlign:"center",fontSize:13,fontWeight:700,color:MONARCH_PURP }}>◉ MONARCH TRIAL COMPLETE — You are ready.</p>:<p style={{ textAlign:"center",fontSize:11,color:GLITCH_RED+"cc",lineHeight:1.6 }}><strong>WARNING:</strong> Failure to complete all objectives will result in loss of the Monarch path.</p>}
          </div>
        </div>
        {!allDone&&<button onClick={onForfeit} style={{ width:"100%",padding:"12px",background:"transparent",border:"1px solid "+GLITCH_RED+"55",color:GLITCH_RED+"88",cursor:"pointer",fontFamily:"'Orbitron',sans-serif",fontSize:11,letterSpacing:"0.2em" }}>FORFEIT TRIAL — Accept defeat</button>}
      </div>
    </div>
  );
}

/* ===========================================================================
   REAWAKENING
   =========================================================================== */
function ReawakeningSequence({ playerName, onComplete }) {
  const [step, setStep] = useState(0);
  const t = useRef(null);
  const phases = [{dur:2000,msg:null},{dur:2500,msg:"Something inside your body has changed."},{dur:2500,msg:"You have surpassed the limits of ordinary hunters."},{dur:3000,msg:"Monarch Authority Detected."},{dur:2000,msg:null}];
  useEffect(function(){ if(step>=phases.length){if(typeof onComplete==="function")onComplete();return;} t.current=setTimeout(function(){setStep(function(s){return s+1;});},phases[step].dur); return function(){clearTimeout(t.current);}; },[step]);
  return (
    <div style={{ position:"fixed",inset:0,zIndex:10000,background:step<2?"radial-gradient(ellipse at center,#0d0010 0%,#000 100%)":"radial-gradient(ellipse at center,#1a0030 0%,#0a0015 60%,#000 100%)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",transition:"background 1.5s ease",overflow:"hidden" }}>
      <div style={{ position:"fixed",inset:0,pointerEvents:"none",background:"repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(155,48,255,0.06) 2px,rgba(155,48,255,0.06) 4px)" }} />
      {step>=2&&<div style={{ position:"absolute",width:500,height:500,borderRadius:"50%",border:"2px solid "+MONARCH_PURP+"33",animation:"aura-eruption 1s ease forwards, monarch-breathe 3s ease-in-out 1s infinite" }} />}
      {step>=3&&<div style={{ position:"absolute",width:350,height:350,borderRadius:"50%",border:"1px solid "+MONARCH_PURP+"55",animation:"aura-ring-2 1.5s ease forwards" }} />}
      <div className={step===1?"shake":""} style={{ position:"relative",textAlign:"center",padding:"0 32px" }}>
        {step===0&&<div className="fade-in" style={{ fontFamily:"'Orbitron',sans-serif",fontSize:11,letterSpacing:"0.5em",color:MONARCH_DIM }}><span className="blink">■</span> REAWAKENING...</div>}
        {step>=1&&step<phases.length&&phases[step-1]&&phases[step-1].msg&&<p className="fade-in monarch-text" style={{ fontFamily:"'Rajdhani',sans-serif",fontSize:18,color:"#d0a0ff",letterSpacing:"0.08em",lineHeight:1.8,marginBottom:24,maxWidth:420 }}>{phases[step-1].msg}</p>}
        {step>=4&&<div className="fade-in"><div className="monarch-text" style={{ fontFamily:"'Orbitron',sans-serif",fontSize:36,fontWeight:900,color:MONARCH_PURP,marginBottom:12 }}>MONARCH</div><div style={{ fontSize:16,color:"#c8a0e8" }}>{playerName} · Ruler of the Dead</div></div>}
      </div>
    </div>
  );
}

/* ===========================================================================
   TOP HUD + SIDEBAR
   =========================================================================== */
function TopHud({ player, rank, onMenuToggle, menuOpen, isMonarch }) {
  const c = isMonarch ? MONARCH_PURP : rank.color;
  const activeTitleData = HUNTER_TITLES.find(function(t){return t.id===(player.activeTitle||"awakened");}) || HUNTER_TITLES[0];
  const titleColor = activeTitleData ? TITLE_RARITY_COLOR[activeTitleData.rarity] || c : c;
  return (
    <div
      className={isMonarch ? "monarch-breathe" : ""}
      style={{
        position:"sticky", top:0, zIndex:100,
        padding:"8px 16px",
        display:"flex", alignItems:"center", justifyContent:"space-between", gap:12,
        background: isMonarch
          ? "linear-gradient(90deg,rgba(13,0,22,0.96),rgba(8,0,14,0.96))"
          : "linear-gradient(90deg,rgba(2,6,18,0.95),rgba(3,8,22,0.95))",
        borderBottom:"1px solid "+c+"44",
        backdropFilter:"blur(16px)",
        boxShadow:"0 2px 20px rgba(0,0,0,0.6), 0 1px 0 "+c+"22",
      }}
    >
      {/* Rank badge + name */}
      <div style={{ display:"flex",alignItems:"center",gap:10,minWidth:0 }}>
        <div className={isMonarch?"pulse-glow":""} style={{
          width:34, height:34,
          border:"1.5px solid "+c,
          background: c+"0d",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontFamily:"'Orbitron',sans-serif", fontWeight:900, fontSize:12, color:c,
          flexShrink:0,
          boxShadow:"0 0 12px "+c+"44",
          position:"relative",
        }}>
          <div style={{ position:"absolute",top:2,left:2,width:3,height:1,background:c,opacity:0.5 }} />
          <div style={{ position:"absolute",bottom:2,right:2,width:3,height:1,background:c,opacity:0.5 }} />
          {isMonarch?"◉":rank.name[0]}
        </div>
        <div style={{ minWidth:0 }}>
          <div style={{ fontFamily:"'Orbitron',sans-serif",fontSize:12,fontWeight:700,color:"#d0eeff",lineHeight:1.1,letterSpacing:"0.05em",textShadow:"0 0 10px "+c+"55" }}>{player.name}</div>
          {activeTitleData && <div style={{ fontSize:8,color:titleColor,letterSpacing:"0.15em",marginBottom:1,opacity:0.85 }}>{activeTitleData.name}</div>}
          <div style={{ fontSize:9,color:c+"cc",letterSpacing:"0.1em",fontFamily:"'Rajdhani',sans-serif",fontWeight:600 }}>
            {isMonarch?"[SHADOW MONARCH]":"["+rank.name+"] LV "+player.level}
          </div>
        </div>
      </div>

      {/* XP bar */}
      <div style={{ flex:1,maxWidth:360,display:"flex",alignItems:"center" }}>
        <XpBar xp={player.xp} level={player.level} ac={c} />
      </div>

      {/* Streak + menu */}
      <div style={{ display:"flex",alignItems:"center",gap:8,flexShrink:0 }}>
        <div style={{ display:"flex",alignItems:"center",gap:5,padding:"3px 8px",border:"1px solid rgba(245,182,93,0.35)",background:"rgba(245,182,93,0.06)" }}>
          <span style={{ fontSize:11 }}>🔥</span>
          <span style={{ fontFamily:"'Orbitron',sans-serif",fontSize:11,fontWeight:700,color:"#f5b65d" }}>{player.streak}</span>
        </div>
        <button onClick={onMenuToggle} style={{
          width:34, height:34,
          border:"1px solid "+c+"66",
          background: menuOpen ? c+"1a" : "transparent",
          color:c, cursor:"pointer", fontSize:14,
          display:"flex", alignItems:"center", justifyContent:"center",
          boxShadow: menuOpen ? "0 0 10px "+c+"44" : "none",
          transition:"all 0.15s",
        }}>{menuOpen?"✕":"☰"}</button>
      </div>
    </div>
  );
}

function Sidebar({ activeView, onSelect, onClose, ac, playerName, isMonarch }) {
  const c = isMonarch?MONARCH_PURP:(ac||SYS_BLUE);
  return (
    <>
      <div onClick={onClose} style={{ position:"fixed",inset:0,zIndex:200,background:"rgba(1,4,12,0.7)",backdropFilter:"blur(3px)" }} />
      <div className="menu-slide sl-menu" style={{ paddingTop:20,paddingBottom:40 }}>
        {/* Menu header */}
        <div style={{ padding:"0 20px 16px",borderBottom:"1px solid "+c+"22",marginBottom:8 }}>
          <div style={{ fontFamily:"'Orbitron',sans-serif",fontSize:8,letterSpacing:"0.5em",color:c+"99",marginBottom:8 }}>SYSTEM MENU</div>
          <div style={{ padding:"7px 12px",border:"1px solid "+c+"22",background:c+"0a",fontSize:11,color:"#8ab8d8",fontFamily:"'Rajdhani',sans-serif",fontWeight:600,letterSpacing:"0.1em" }}>
            HUNTER: <span style={{ color:"#c8eeff" }}>{playerName}</span>
          </div>
        </div>

        {MENU_ITEMS.map(function(item){
          const active = item === activeView;
          return (
            <button key={item} onClick={function(){onSelect(item);onClose();}}
              className={"sl-menu-item"+(active?" active":"")}>
              <span>{item.toUpperCase()}</span>
              {active&&<span style={{ color:c,marginLeft:"auto",fontSize:12 }}>›</span>}
            </button>
          );
        })}

        {isMonarch&&(
          <div style={{ margin:"20px 16px 0",padding:"12px 14px",border:"1px solid "+MONARCH_PURP+"44",background:"rgba(155,48,255,0.06)" }}>
            <div style={{ fontFamily:"'Orbitron',sans-serif",fontSize:8,letterSpacing:"0.35em",color:MONARCH_DIM,marginBottom:8 }}>MONARCH REGISTRY</div>
            <div style={{ fontSize:11,color:"#8a5ab0",lineHeight:2,fontFamily:"'Rajdhani',sans-serif",fontWeight:600 }}>
              Class: Shadow Monarch<br/>Authority: Confirmed<br/>Aura: Dominant
            </div>
          </div>
        )}
      </div>
    </>
  );
}

/* ===========================================================================
   VIEWS
   =========================================================================== */
function DashboardView({ player, rank, dailyProgress, isDailyDone, onGoalTap, isMonarch, dailyQuest, activeHiddenQuest, hiddenQuestProgress, onHiddenGoalTap, energyScore, onReset, fame, worldEvent, awakeningDay }) {
  const c = isMonarch?MONARCH_PURP:rank.color;
  const safeLevel = (typeof player.level === "number" && isFinite(player.level)) ? player.level : 1;
  const doneCount = dailyQuest.goals.filter(function(g){return (dailyProgress[g.id]||0)>=g.target;}).length;
  const classData = HUNTER_CLASSES.find(function(cl){return cl.id===player.job;}) || HUNTER_CLASSES[1];
  const sysMsg = getContextualMessage(player, isDailyDone, rank, isMonarch, energyScore, fame);
  return (
    <div className="fade-in">
      <SL text={isMonarch?"Monarch Command Center":"Command Center"} ac={c} />
      {isMonarch&&(<div className="monarch-breathe fade-in" style={{ padding:"14px 20px",marginBottom:20,border:"1px solid "+MONARCH_PURP+"66",background:"linear-gradient(90deg,rgba(155,48,255,0.08),rgba(13,0,16,0.8))",display:"flex",alignItems:"center",gap:12 }}><span className="pulse-glow" style={{ fontSize:20,color:MONARCH_PURP }}>◉</span><div><div style={{ fontFamily:"'Orbitron',sans-serif",fontSize:11,color:MONARCH_PURP,letterSpacing:"0.2em" }}>MONARCH AURA — ACTIVE</div><div style={{ fontSize:12,color:"#8a5ab0",marginTop:2 }}>The shadows obey.</div></div></div>)}

      {/* Daily reset countdown */}
      <ResetCountdownBanner accentColor={c} isMonarch={isMonarch} onReset={onReset} />

      {/* System AI message */}
      <SystemMessagePanel message={sysMsg} accentColor={c} isMonarch={isMonarch} />

      {/* Daily hunter report */}
      <DailyHunterReport player={player} rank={rank} isDailyDone={isDailyDone} dailyQuest={dailyQuest} isMonarch={isMonarch} energyScore={energyScore} fame={fame} />

      {/* Recovery status strip */}
      <RecoveryStatusStrip energyScore={energyScore} accentColor={c} />

      {/* Limited-time global event */}
      <LimitedEventBanner accentColor={c} />

      {/* Wave 3: World event */}
      <WorldEventBanner event={worldEvent} />

      {/* Wave 3: Awakening day */}
      {awakeningDay&&(
        <div style={{ padding:"8px 14px",marginBottom:14,border:"1px solid #2ee88a66",background:"rgba(46,232,138,0.06)",display:"flex",alignItems:"center",gap:10,animation:"energy-pulse 2s ease-in-out infinite" }}>
          <span style={{ fontSize:16 }}>✸</span>
          <div>
            <div style={{ fontFamily:"'Orbitron',sans-serif",fontSize:9,letterSpacing:"0.25em",color:"#2ee88a" }}>AWAKENING DAY ACTIVE</div>
            <div style={{ fontSize:10,color:"#9fb8d8",marginTop:1 }}>All rewards elevated. Hidden events more likely. Push harder today.</div>
          </div>
        </div>
      )}

      <div style={{ display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:12,marginBottom:24 }}>
        {[
          { label:"LEVEL",  v:String(safeLevel), sub:player.xp+"/"+xpForLevel(safeLevel)+" XP" },
          { label:"RANK",   v:isMonarch?"MONARCH":rank.name.split("-")[0], sub:isMonarch?"Ruler of the Dead":rank.title },
          { label:"STREAK", v:player.streak+" 🔥",  sub:"days active" },
          { label:"QUEST",  v:doneCount+"/"+dailyQuest.goals.length, sub:"goals cleared today" },
        ].map(function(s){ return (<Win key={s.label} ac={c}><div style={{ padding:"14px 16px" }}><div style={{ fontSize:10,letterSpacing:"0.25em",color:"#5b7aa0",marginBottom:4 }}>{s.label}</div><div style={{ fontFamily:"'Orbitron',sans-serif",fontSize:22,fontWeight:900,color:c }}>{s.v}</div><div style={{ fontSize:10,color:"#7e98ba",marginTop:2 }}>{s.sub}</div></div></Win>); })}
      </div>
      {activeHiddenQuest&&<HiddenQuestCard quest={activeHiddenQuest} progress={hiddenQuestProgress} onGoalTap={onHiddenGoalTap} ac={c} />}
      <QuestCard quest={dailyQuest} progress={dailyProgress} isDone={isDailyDone} onGoalTap={onGoalTap} ac={c} />
    </div>
  );
}

/* ===========================================================================
   TITLES PANEL — shown inside Hunter Stats view
   =========================================================================== */
function TitlesPanel({ player, streak, clearedGates, shadowCount, onSelectTitle, accentColor }) {
  const unlocked = getUnlockedTitles(player, streak, clearedGates, shadowCount);
  const activeId  = player.activeTitle || "awakened";

  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:11, letterSpacing:"0.3em", color:accentColor, marginBottom:12 }}>
        HUNTER TITLES
      </div>
      {unlocked.length === 0 ? (
        <div style={{ padding:"16px", border:"1px solid #1a2438", fontSize:12, color:"#5b7aa0" }}>
          No titles unlocked yet. Train. Clear gates. Build your streak.
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {unlocked.map(function(title) {
            const tc = TITLE_RARITY_COLOR[title.rarity] || accentColor;
            const isActive = title.id === activeId;
            return (
              <button key={title.id} onClick={function(){ if(typeof onSelectTitle==="function") onSelectTitle(title.id); }}
                style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 14px", background:isActive?tc+"14":"transparent", border:isActive?"1px solid "+tc:"1px solid #1a2438", cursor:"pointer", textAlign:"left" }}>
                <div>
                  <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:11, fontWeight:700, color:tc }}>{title.name}</div>
                  <div style={{ fontSize:10, color:"#5b7aa0", marginTop:2 }}>{title.desc}</div>
                </div>
                <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4, flexShrink:0, marginLeft:12 }}>
                  <span style={{ fontSize:9, padding:"2px 8px", border:"1px solid "+tc+"55", color:tc, letterSpacing:"0.15em" }}>{title.rarity}</span>
                  {isActive && <span style={{ fontSize:9, color:"#2ee88a" }}>ACTIVE</span>}
                </div>
              </button>
            );
          })}
        </div>
      )}
      {/* Locked titles tease */}
      {unlocked.length < HUNTER_TITLES.length && (
        <div style={{ marginTop:10, fontSize:10, color:"#2a3a55", fontStyle:"italic", textAlign:"center" }}>
          {HUNTER_TITLES.length - unlocked.length} title{HUNTER_TITLES.length - unlocked.length!==1?"s":""} locked. Conditions unknown.
        </div>
      )}
    </div>
  );
}

function StatsView({ player, rank, isMonarch, onSelectTitle, clearedGates }) {
  const c = isMonarch ? MONARCH_PURP : rank.color;
  const maxVal = Math.max(...STAT_KEYS.map(function(k){return player.stats[k]||0;}), 40);
  const classData = HUNTER_CLASSES.find(function(cl){return cl.id===player.job;});

  return (
    <div className="fade-in">
      {/* STATUS header — exactly like Image 2 */}
      <div className="sl-panel" style={{ border:"1px solid "+c+"55",marginBottom:20 }}>
        <div className="sl-corners" />
        {/* Status header bar */}
        <div style={{ textAlign:"center",padding:"10px 0",borderBottom:"1px solid "+c+"33",background:c+"0d" }}>
          <span className="sl-header-title" style={{ fontSize:14,letterSpacing:"0.4em",color:"#e0f4ff",textShadow:"0 0 14px "+c+"aa,0 0 30px "+c+"44" }}>STATUS</span>
        </div>

        {/* Level + job + title row — like Image 2 */}
        <div style={{ padding:"18px 24px 14px",borderBottom:"1px solid "+c+"22",display:"flex",alignItems:"flex-end",gap:20 }}>
          <div style={{ textAlign:"center" }}>
            <div className="sl-level-badge" style={{ fontSize:52 }}>{player.level}</div>
            <div style={{ fontFamily:"'Orbitron',sans-serif",fontSize:9,letterSpacing:"0.3em",color:c+"88",marginTop:2 }}>LEVEL</div>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:12,color:"#8ab8d4",fontFamily:"'Rajdhani',sans-serif",fontWeight:600,marginBottom:4 }}>
              JOB: <span style={{ color:"#c8eeff" }}>{classData?classData.name:player.job}</span>
            </div>
            <div style={{ fontSize:12,color:"#8ab8d4",fontFamily:"'Rajdhani',sans-serif",fontWeight:600 }}>
              RANK: <span style={{ color:c,textShadow:"0 0 8px "+c+"88" }}>{isMonarch?"Shadow Monarch":rank.name}</span>
            </div>
          </div>
        </div>

        {/* Stats grid — matches Image 2 layout */}
        <div style={{ padding:"14px 24px" }}>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"2px 20px" }}>
            {STAT_KEYS.map(function(key){
              const val = player.stats[key]||0;
              const pct = clamp((val/maxVal)*100,0,100);
              const isPrimary = classData && classData.primaryStats.includes(key);
              return (
                <div key={key} className="sl-stat-row">
                  <span className="sl-stat-label" style={{ color:isPrimary?"#c8eeff":"#8ab8d4" }}>
                    <span style={{ fontSize:11 }}>{STAT_ICON[key]}</span>
                    {key.substring(0,3).toUpperCase()}:
                    {isPrimary&&<span style={{ fontSize:7,color:c,letterSpacing:"0.1em",marginLeft:3 }}>★</span>}
                  </span>
                  <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                    <div className="sl-bar-track" style={{ width:60 }}>
                      <div className="sl-bar-fill" style={{ width:pct+"%",background:"linear-gradient(90deg,"+c+","+c+"bb)",boxShadow:"0 0 4px "+c+"88" }} />
                    </div>
                    <span className="sl-stat-value" style={{ color:isPrimary?"#e0f4ff":c,minWidth:24,textAlign:"right" }}>{Math.round(val)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Titles panel */}
      <TitlesPanel player={player} streak={player.streak||0} clearedGates={clearedGates||{}} shadowCount={0} onSelectTitle={onSelectTitle} accentColor={c} />
    </div>
  );
}

function SideQuestsView({ rank, sideProgress, sideDone, onSideGoalTap, isMonarch, extSideProgress, extSideDone, onExtGoalTap, player, energyScore, fame, guildId, anomalyDone, onAnomalyComplete, recentAnomalyIds }) {
  const c = isMonarch ? MONARCH_PURP : rank.color;
  const [tab, setTab] = useState("daily");
  const rankIndex = rank ? (rank.minRankIndex||0) : 0;

  /* Generate today's extended quests */
  const extQuests = generateExtendedSideQuests(player, rankIndex, energyScore, fame, guildId);

  /* Generate today's anomaly quests (5 per day) */
  const anomalyQuests = generateAnomalyQuests(rankIndex, recentAnomalyIds||[], 5);

  const extCompletedCount     = extQuests.filter(function(q){ return extSideDone[q.id]; }).length;
  const anomalyCompletedCount = anomalyQuests.filter(function(q){ return anomalyDone&&anomalyDone[q.id]; }).length;
  const tabLabel = "Extended (" + extCompletedCount + "/" + extQuests.length + ")";

  function renderExtQuest(quest) {
    const rc = SQ_RARITY[quest.rarity] || SQ_RARITY.COMMON;
    const qp = extSideProgress[quest.id] || {};
    const done = !!extSideDone[quest.id];
    const isCorrupted = quest.rarity === "CORRUPTED";

    return (
      <div key={quest.id} style={{
        border: "1px solid " + rc.border,
        background: rc.bg,
        padding: "16px 18px",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Corrupted scanline effect */}
        {isCorrupted && <div style={{ position:"absolute",inset:0,pointerEvents:"none",background:"repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(155,48,255,0.04) 3px,rgba(155,48,255,0.04) 4px)" }} />}

        {/* Header */}
        <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8,gap:8 }}>
          <div style={{ display:"flex",alignItems:"center",gap:8 }}>
            <div style={{ width:8,height:8,borderRadius:"50%",background:rc.color,flexShrink:0,boxShadow:"0 0 6px "+rc.color }} />
            <span style={{ fontFamily:"'Orbitron',sans-serif",fontSize:11,fontWeight:700,color:rc.color }}>{quest.label}</span>
          </div>
          <div style={{ display:"flex",alignItems:"center",gap:6,flexShrink:0 }}>
            <span style={{ fontSize:9,padding:"2px 8px",border:"1px solid "+rc.color+"55",color:rc.color,fontFamily:"'Orbitron',sans-serif",letterSpacing:"0.15em" }}>{quest.rarity}</span>
            {done && <span style={{ fontSize:9,color:"#2ee88a",fontWeight:700 }}>✓</span>}
          </div>
        </div>

        {/* Flavor */}
        <p style={{ fontSize:11,color:"#5b7aa0",lineHeight:1.5,marginBottom:10,fontStyle:"italic" }}>{quest.flavor}</p>

        {/* Goals */}
        {quest.goals.map(function(goal) {
          const cur = (qp[goal.id]||0);
          const complete = cur >= goal.target;
          const canTap = !complete && !done;
          return (
            <div key={goal.id}
              onClick={function(){ if(canTap && typeof onExtGoalTap==="function") onExtGoalTap(quest.id, goal.id); }}
              style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"7px 0",borderBottom:"1px solid rgba(77,184,255,0.07)",cursor:canTap?"pointer":"default" }}>
              <span style={{ fontSize:13,color:complete?"#5a7a5a":"#dbe6ff",fontWeight:complete?400:600 }}>{goal.name}</span>
              <div style={{ display:"flex",alignItems:"center",gap:6,flexShrink:0 }}>
                <span style={{ fontSize:11,color:complete?"#2ee88a":"#9fb8d8" }}>{goal.target}{goal.unit}</span>
                <div style={{ width:16,height:16,border:"1.5px solid "+(complete?"#2ee88a":rc.color+"66"),background:complete?"#2ee88a22":"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"#2ee88a" }}>{complete?"✓":""}</div>
              </div>
            </div>
          );
        })}

        {/* Reward line */}
        <div style={{ marginTop:10,display:"flex",justifyContent:"space-between",fontSize:10 }}>
          <span style={{ color:rc.color }}>
            +{Math.round(quest.xp * rc.xpMod)} XP
            {quest.coins ? " · +" + quest.coins + " coins" : ""}
            {quest.energyGain ? " · +energy" : ""}
            {quest.shadowLoyaltyGain ? " · +shadow loyalty" : ""}
          </span>
          <span style={{ color:"#5b7aa0" }}>{quest.cat}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <SL text="Side Quests" ac={c} />

      {/* Tab selector */}
      <div style={{ display:"flex",gap:6,marginBottom:16 }}>
        {[["daily","Daily ("+sideDone.filter(Boolean).length+"/"+SIDE_QUESTS.length+")"],["extended",tabLabel],["anomaly","Anomaly ("+anomalyCompletedCount+"/"+anomalyQuests.length+")"]].map(function(t){
          const active = tab===t[0];
          return (<button key={t[0]} onClick={function(){setTab(t[0]);}} style={{ padding:"5px 14px",background:active?c:"transparent",border:"1px solid "+c+(active?"":"44"),color:active?"#03050c":"#9fb8d8",cursor:"pointer",fontFamily:"'Orbitron',sans-serif",fontSize:9,letterSpacing:"0.15em" }}>{t[1]}</button>);
        })}
      </div>

      {/* Daily side quests (static, original 3) */}
      {tab==="daily" && (
        <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:16 }}>
          {SIDE_QUESTS.map(function(quest,qi){
            const done=sideDone[qi]===true;
            return (<div key={quest.id} style={{ border:"1px solid "+c+"55",background:"linear-gradient(160deg,rgba(10,18,34,0.97),rgba(5,10,20,0.99))",padding:"20px 20px 16px" }}><div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:12 }}><Bang size={28} color={c} /><span style={{ fontFamily:"'Orbitron',sans-serif",fontSize:12,fontWeight:700,color:"#eaf2ff" }}>{quest.label}</span></div><div style={{ height:1,background:c+"33",marginBottom:12 }} />{quest.goals.map(function(goal){ const cur=(sideProgress[qi]&&sideProgress[qi][goal.id])||0; const complete=cur>=goal.target; const canTap=!complete&&!done; return (<div key={goal.id} onClick={function(){if(canTap&&typeof onSideGoalTap==="function")onSideGoalTap(qi,goal.id);}} style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid rgba(77,184,255,0.07)",cursor:canTap?"pointer":"default" }}><span style={{ fontSize:13,fontWeight:600,color:complete?"#5a7a5a":"#dbe6ff" }}>{goal.name}</span><div style={{ display:"flex",alignItems:"center",gap:8 }}><span style={{ fontSize:12,color:complete?"#2ee88a":"#9fb8d8" }}>[{cur}/{goal.target}{goal.unit}]</span><div style={{ width:16,height:16,border:"1.5px solid "+(complete?"#2ee88a":c+"66"),background:complete?"#2ee88a22":"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#2ee88a" }}>{complete?"✓":""}</div></div></div>); })}<div style={{ marginTop:12,textAlign:"right",fontSize:11,color:done?"#2ee88a":"#f5b65d",fontWeight:600 }}>{done?"CLEARED ✓":"+"+quest.xp+" XP"}</div></div>);
          })}
        </div>
      )}

      {/* Extended quests */}
      {tab==="extended" && (
        <div>
          <div style={{ fontSize:11,color:"#5b7aa0",marginBottom:12 }}>
            Today's extended quests — rotates daily based on rank, class, and energy. {extQuests.length} available.
          </div>
          {extQuests.length===0 ? (
            <div style={{ padding:"40px",textAlign:"center",border:"1px solid #1a2438",color:"#2a3a55",fontSize:12,fontStyle:"italic" }}>No quests available at your current rank. Advance to unlock more.</div>
          ) : (
            <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
              {extQuests.map(renderExtQuest)}
            </div>
          )}
        </div>
      )}
      {/* Anomaly quests tab */}
      {tab==="anomaly" && (
        <div>
          <div style={{ padding:"9px 14px",marginBottom:14,border:"1px solid "+MONARCH_PURP+"55",background:"rgba(155,48,255,0.06)",display:"flex",alignItems:"center",gap:10 }}>
            <span style={{ fontFamily:"'Orbitron',sans-serif",fontSize:9,letterSpacing:"0.25em",color:MONARCH_PURP,flexShrink:0 }}>SYSTEM ANOMALY</span>
            <span style={{ fontSize:11,color:"#9fb8d8" }}>Real-world directives from the System. Complete them. The System is watching.</span>
          </div>
          {anomalyQuests.length===0 ? (
            <div style={{ padding:"40px",textAlign:"center",border:"1px solid #1a2438",color:"#2a3a55",fontSize:12,fontStyle:"italic" }}>No anomaly quests at your current rank. Advance to trigger higher-clearance events.</div>
          ) : (
            <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
              {anomalyQuests.map(function(quest){
                const rc = SQ_RARITY[quest.rarity] || SQ_RARITY.COMMON;
                const done = !!(anomalyDone&&anomalyDone[quest.id]);
                const isCorrupted = quest.rarity==="CORRUPTED"||quest.rarity==="MONARCH";
                const canComplete = !done;
                return (
                  <div key={quest.id} style={{ border:"1px solid "+rc.border, background:rc.bg, padding:"16px 18px", position:"relative", overflow:"hidden" }}>
                    {isCorrupted&&<div style={{ position:"absolute",inset:0,pointerEvents:"none",background:"repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(155,48,255,0.04) 3px,rgba(155,48,255,0.04) 4px)" }} />}
                    {/* Header */}
                    <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8,gap:8,position:"relative" }}>
                      <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                        <div style={{ width:8,height:8,borderRadius:"50%",background:rc.color,flexShrink:0,boxShadow:"0 0 6px "+rc.color+(done?"":","+"0 0 12px "+rc.color) }} />
                        <span style={{ fontFamily:"'Orbitron',sans-serif",fontSize:11,fontWeight:700,color:rc.color }}>{quest.title}</span>
                      </div>
                      <div style={{ display:"flex",alignItems:"center",gap:6,flexShrink:0 }}>
                        <span style={{ fontSize:9,padding:"2px 8px",border:"1px solid "+rc.color+"55",color:rc.color,fontFamily:"'Orbitron',sans-serif",letterSpacing:"0.12em" }}>{quest.rarity}</span>
                        {done&&<span style={{ fontSize:10,color:"#2ee88a",fontWeight:700 }}>✓</span>}
                      </div>
                    </div>
                    {/* System message */}
                    <div style={{ fontSize:10,color:rc.color+"aa",fontStyle:"italic",marginBottom:6,fontFamily:"monospace",lineHeight:1.4 }}>{quest.sys}</div>
                    {/* Task */}
                    <p style={{ fontSize:13,color:done?"#5b7aa0":"#dbe6ff",lineHeight:1.7,marginBottom:12 }}>{quest.task}</p>
                    {/* Lore */}
                    {quest.lore&&<p style={{ fontSize:10,color:"#5b7aa0",fontStyle:"italic",marginBottom:10,borderLeft:"2px solid "+rc.color+"44",paddingLeft:8,lineHeight:1.5 }}>{quest.lore}</p>}
                    {/* Reward + action */}
                    <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,flexWrap:"wrap" }}>
                      <span style={{ fontSize:10,color:rc.color }}>
                        +{Math.round((quest.xp||60)*rc.xpMod)} XP · +{quest.coins||0} coins · +{quest.fame||0} fame
                        {quest.monarchInterestGain?" · [monarch]":""}
                        {quest.shadowLoyaltyGain?" · +army loyalty":""}
                      </span>
                      {canComplete ? (
                        <button onClick={function(){if(typeof onAnomalyComplete==="function")onAnomalyComplete(quest.id);}} style={{ padding:"7px 18px",background:rc.color,color:"#03050c",border:"none",cursor:"pointer",fontFamily:"'Orbitron',sans-serif",fontSize:10,fontWeight:700,letterSpacing:"0.12em",flexShrink:0 }}>
                          COMPLETE
                        </button>
                      ) : (
                        <span style={{ fontSize:10,color:"#2ee88a",fontWeight:700 }}>MISSION COMPLETE</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
function getAdaptiveDungeonRec(player, energyScore) {
  const stats = player.stats || {};
  const str   = stats.Strength    || 0;
  const agi   = stats.Agility     || 0;
  const end   = stats.Endurance   || 0;
  const safe  = (typeof energyScore === "number" && isFinite(energyScore)) ? energyScore : 68;

  if (safe < 30) return { label:"Recovery Mode", note:"Energy too low for dungeon entry. Rest first.", color:"#f53d3d" };
  if (str > agi && str > end) return { label:"Brute-Force Gate", note:"Your strength profile suits high-resistance dungeons. The Gate of Awakening is optimal.", color:"#f53d3d" };
  if (agi > str && agi > end) return { label:"Speed Gate",      note:"Agility-dominant hunters clear dungeon rooms fastest. Prioritize the Gate of Awakening.", color:"#4db8ff" };
  if (end > str && end > agi) return { label:"Endurance Raid",  note:"High stamina — Red Gate or multi-room dungeons are recommended.", color:"#6fae6f" };
  return { label:"Balanced Protocol", note:"Well-rounded stats. Any gate is viable. Push toward the highest rank available.", color:SYS_BLUE };
}

function DungeonGatesView({ rank, isMonarch, clearedGates, onEnterGate, ac, player, energyScore }) {
  return (
    <div className="fade-in">
      <SL text="Dungeon Gates" ac={ac} />
      {/* System 4: Adaptive recommendation */}
      {player && (function(){
        const rec = getAdaptiveDungeonRec(player, energyScore);
        return (
          <div style={{ padding:"9px 14px",border:"1px solid "+rec.color+"44",background:rec.color+"08",marginBottom:16,display:"flex",alignItems:"center",gap:10 }}>
            <span style={{ fontFamily:"'Orbitron',sans-serif",fontSize:9,letterSpacing:"0.2em",color:rec.color,flexShrink:0 }}>{rec.label}</span>
            <span style={{ fontSize:11,color:"#9fb8d8" }}>{rec.note}</span>
          </div>
        );
      })()}
      <p style={{ fontSize:12,color:"#5b7aa0",marginBottom:20 }}>Each gate has rank requirements. Enter without sufficient rank and the system will block you.</p>
      <div style={{ display:"flex",flexDirection:"column",gap:16 }}>
        {DUNGEON_GATES.map(function(gate){
          const cleared=clearedGates[gate.id]===true; const gc=gate.color;
          return (
            <div key={gate.id} style={{ border:"1px solid "+gc+(cleared?"44":"88"),background:"linear-gradient(160deg,rgba(10,18,34,0.97),rgba(5,10,20,0.99))",padding:"24px",opacity:cleared?0.55:1,position:"relative",overflow:"hidden" }}>
              {!cleared&&<div style={{ position:"absolute",inset:0,pointerEvents:"none",boxShadow:"0 0 20px "+gc+"44",animation:"pulse-glow 2.5s ease-in-out infinite" }} />}
              <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:16,flexWrap:"wrap" }}>
                <div style={{ flex:1,minWidth:200 }}>
                  <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:8 }}>
                    <div style={{ padding:"2px 10px",border:"1px solid "+gc,fontFamily:"'Orbitron',sans-serif",fontSize:11,fontWeight:700,color:gc,letterSpacing:"0.15em" }}>{gate.rank}-RANK</div>
                    <span style={{ fontFamily:"'Orbitron',sans-serif",fontSize:16,fontWeight:700,color:"#eaf2ff" }}>{gate.name}</span>
                  </div>
                  <p style={{ fontSize:13,color:"#7e98ba",lineHeight:1.6,marginBottom:8 }}>{gate.desc}</p>
                  <div style={{ fontSize:11,color:"#5b7aa0",marginBottom:4 }}>Minimum: <span style={{ color:gc }}>LV {gate.minLevel} · {gate.rank}-Rank</span></div>
                  <div style={{ fontSize:12,color:gc,fontWeight:600 }}>{cleared?"✓ CLEARED":"REWARD: "+gate.reward}</div>
                </div>
                <button disabled={cleared} onClick={function(){if(typeof onEnterGate==="function")onEnterGate(gate);}} style={{ padding:"12px 24px",background:cleared?"transparent":gc,color:cleared?gc+"88":"#03050c",border:cleared?"1px solid "+gc+"44":"none",cursor:cleared?"not-allowed":"pointer",fontFamily:"'Orbitron',sans-serif",fontSize:11,fontWeight:700,letterSpacing:"0.15em",whiteSpace:"nowrap",alignSelf:"center" }}>{cleared?"CLEARED":"ENTER GATE"}</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ===========================================================================
   RAID PREP SCREEN — shown before a boss attack is committed
   =========================================================================== */
function RaidPrepScreen({ boss, data, onLaunch, onCancel, accentColor, inventory, shadowArmy }) {
  const [approach, setApproach] = useState("balanced");
  const safeInventory = inventory || [];
  const safeShadows   = shadowArmy || [];

  const approaches = [
    { id:"balanced",   label:"Balanced",    desc:"Standard approach. No bonuses or penalties.",                 survivalMod:0,   xpMod:1.0 },
    { id:"aggressive", label:"Aggressive",  desc:"Maximum damage output. +20% XP if successful. −10% survival.", survivalMod:-10, xpMod:1.2 },
    { id:"defensive",  label:"Defensive",   desc:"+15% survival rate. −10% XP rewards.",                        survivalMod:15,  xpMod:0.9 },
    { id:"shadow",     label:"Shadow Vanguard", desc:"Shadows lead the assault. +10% survival if 1+ shadow.",   survivalMod: safeShadows.length>0?10:0, xpMod:1.1 },
  ];

  const chosen = approaches.find(function(a){return a.id===approach;}) || approaches[0];
  const c = boss ? boss.color : accentColor;

  return (
    <div style={{ position:"fixed",inset:0,zIndex:8900,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(3,5,12,0.93)",backdropFilter:"blur(6px)",padding:"24px 16px" }}>
      <div className="fade-in-up" style={{ maxWidth:460,width:"100%",border:"1px solid "+c+"88",background:"linear-gradient(160deg,rgba(8,14,26,0.99),rgba(4,8,18,0.99))",overflow:"hidden" }}>
        <div style={{ padding:"24px 24px 20px" }}>
          {/* Header */}
          <div style={{ fontFamily:"'Orbitron',sans-serif",fontSize:9,letterSpacing:"0.4em",color:c,marginBottom:12 }}>RAID PREPARATION</div>
          <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:18,paddingBottom:14,borderBottom:"1px solid "+c+"33" }}>
            <div style={{ width:44,height:44,border:"2px solid "+c,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,background:c+"11",flexShrink:0 }}>{boss?boss.icon:"⚔"}</div>
            <div>
              <div style={{ fontFamily:"'Orbitron',sans-serif",fontSize:14,fontWeight:700,color:"#eaf2ff" }}>{boss?boss.name:"Boss Raid"}</div>
              <div style={{ fontSize:11,color:c }}>HP: {boss?boss.currentHp+"/"+boss.maxHp:"—"}</div>
            </div>
          </div>

          {/* Approach selector */}
          <div style={{ fontFamily:"'Orbitron',sans-serif",fontSize:10,letterSpacing:"0.25em",color:"#5b7aa0",marginBottom:10 }}>COMBAT APPROACH</div>
          <div style={{ display:"flex",flexDirection:"column",gap:6,marginBottom:16 }}>
            {approaches.map(function(a){
              const sel = approach===a.id;
              return (
                <button key={a.id} onClick={function(){setApproach(a.id);}}
                  style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 14px",background:sel?c+"15":"transparent",border:"1px solid "+(sel?c:c+"33"),cursor:"pointer",textAlign:"left" }}>
                  <div>
                    <div style={{ fontFamily:"'Orbitron',sans-serif",fontSize:10,fontWeight:700,color:sel?"#eaf2ff":"#9fb8d8" }}>{a.label}</div>
                    <div style={{ fontSize:10,color:"#5b7aa0",marginTop:2 }}>{a.desc}</div>
                  </div>
                  <div style={{ fontSize:10,color:sel?c:"#5b7aa0",flexShrink:0,marginLeft:10 }}>
                    {a.survivalMod>0?"+"+a.survivalMod+"%":a.survivalMod<0?a.survivalMod+"%":"—"}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Shadow army count */}
          {safeShadows.length>0 && (
            <div style={{ padding:"8px 12px",border:"1px solid "+MONARCH_PURP+"33",background:"rgba(155,48,255,0.06)",fontSize:11,color:MONARCH_PURP,marginBottom:14 }}>
              ◉ {safeShadows.length} shadow{safeShadows.length!==1?"s":""} available for deployment
            </div>
          )}

          {/* Launch */}
          <div style={{ display:"flex",gap:10 }}>
            <button onClick={function(){if(typeof onLaunch==="function")onLaunch(chosen);}} style={{ flex:1,padding:"12px",background:c,color:"#03050c",border:"none",cursor:"pointer",fontFamily:"'Orbitron',sans-serif",fontSize:12,fontWeight:700,letterSpacing:"0.15em" }}>
              LAUNCH RAID
            </button>
            <button onClick={onCancel} style={{ padding:"12px 16px",background:"transparent",border:"1px solid "+c+"44",color:c+"88",cursor:"pointer",fontFamily:"'Orbitron',sans-serif",fontSize:11 }}>
              CANCEL
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===========================================================================
   RAID PERFORMANCE CARD — shown after raid completion
   =========================================================================== */
const RAID_RANKS = [
  { min:90, label:"MONARCH-LEVEL", color:"#2ee88a", fameMod:3.0 },
  { min:70, label:"S-RANK",        color:"#f5b65d", fameMod:2.0 },
  { min:50, label:"A-RANK",        color:"#a05df5", fameMod:1.5 },
  { min:30, label:"B-RANK",        color:"#4db8ff", fameMod:1.2 },
  { min:0,  label:"F-RANK",        color:"#f53d3d", fameMod:0.8 },
];

function calcRaidScore(approach, questGoalsCleared, shadowCount) {
  let score = 50;
  if (questGoalsCleared >= 5) score += 20;
  else if (questGoalsCleared >= 3) score += 10;
  if (approach === "aggressive") score += 15;
  if (approach === "shadow" && shadowCount > 0) score += 10;
  if (approach === "defensive") score -= 10;
  return clamp(score, 0, 100);
}

function getRaidRank(score) {
  return RAID_RANKS.find(function(r){return score>=r.min;}) || RAID_RANKS[RAID_RANKS.length-1];
}

function BossRaidsView({ bosses, bossData, onAttack, ac, questGoalsCleared, inventory, shadowArmy }) {
  const [prepTarget, setPrepTarget] = useState(null); /* { bossIdx, boss, data } */

  return (
    <div className="fade-in">
      <SL text="Boss Raids" ac={ac} />
      <p style={{ fontSize:12,color:"#5b7aa0",marginBottom:20 }}>
        Bosses have rank requirements. Goals cleared today: <span style={{ color:ac,fontWeight:700 }}>{questGoalsCleared}</span> — each deals 1 damage.
      </p>
      <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:16 }}>
        {bosses.map(function(boss,i){
          const data=bossData[i]; const hpPct=clamp((boss.currentHp/boss.maxHp)*100,0,100); const defeated=boss.currentHp<=0;
          return (
            <div key={boss.id} style={{ border:"1px solid "+(defeated?"#2ee88a44":boss.color+"88"),background:"linear-gradient(160deg,rgba(10,18,34,0.97),rgba(5,10,20,0.99))",padding:"20px",opacity:defeated?0.65:1,position:"relative",overflow:"hidden" }}>
              <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:12 }}>
                <div style={{ width:44,height:44,border:"2px solid "+(defeated?"#2ee88a":boss.color),display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,background:boss.color+"11",flexShrink:0 }}>{defeated?"☠":boss.icon}</div>
                <div><div style={{ fontFamily:"'Orbitron',sans-serif",fontSize:14,fontWeight:700,color:defeated?"#2ee88a":"#eaf2ff" }}>{boss.name}</div><div style={{ fontSize:11,color:"#5b7aa0" }}>{boss.title}</div></div>
              </div>
              {data&&!defeated&&<BossDialogueBox boss={data} bossState={boss} />}
              <div style={{ marginBottom:8 }}>
                <div style={{ display:"flex",justifyContent:"space-between",fontSize:10,color:"#5b7aa0",marginBottom:4 }}><span>HP</span><span style={{ color:defeated?"#2ee88a":boss.color }}>{boss.currentHp}/{boss.maxHp}</span></div>
                <div style={{ height:8,background:"rgba(255,255,255,0.06)",overflow:"hidden" }}><div style={{ height:"100%",width:hpPct+"%",background:defeated?"#2ee88a":"linear-gradient(90deg,"+boss.color+",#fff8)",transition:"width 0.5s ease" }} /></div>
              </div>
              <div style={{ fontSize:11,color:"#5b7aa0",marginBottom:8 }}>Requires: <span style={{ color:boss.color }}>{boss.minRankName} (LV {boss.minLevel})</span></div>
              {defeated&&boss.shadow&&(<div style={{ marginBottom:12,padding:"8px 12px",border:"1px solid "+MONARCH_PURP+"44",background:"rgba(155,48,255,0.06)",fontSize:11,color:MONARCH_PURP }}>◉ SHADOW EXTRACTED · {boss.shadow.name}</div>)}
              <button disabled={defeated||questGoalsCleared<1} onClick={function(){
                if(defeated||questGoalsCleared<1) return;
                setPrepTarget({bossIdx:i,boss,data});
              }}
                style={{ width:"100%",padding:"10px",background:defeated?"transparent":questGoalsCleared<1?"#0a1020":boss.color,color:defeated?"#2ee88a":questGoalsCleared<1?"#2a3a55":"#03050c",border:defeated?"1px solid #2ee88a44":questGoalsCleared<1?"1px solid #2a3a55":"none",cursor:(defeated||questGoalsCleared<1)?"not-allowed":"pointer",fontFamily:"'Orbitron',sans-serif",fontSize:11,fontWeight:700,letterSpacing:"0.15em" }}>
                {defeated?"☠ SHADOW EXTRACTED":questGoalsCleared<1?"COMPLETE QUESTS FIRST":"PREPARE RAID"}
              </button>
            </div>
          );
        })}
      </div>

      {/* Prep screen overlay */}
      {prepTarget&&(
        <RaidPrepScreen
          boss={prepTarget.boss}
          data={prepTarget.data}
          inventory={inventory}
          shadowArmy={shadowArmy}
          accentColor={ac}
          onCancel={function(){setPrepTarget(null);}}
          onLaunch={function(approach){
            setPrepTarget(null);
            if(typeof onAttack==="function") onAttack(prepTarget.bossIdx, approach);
          }}
        />
      )}
    </div>
  );
}

function ShadowArchiveView({ bosses, bossData, ac }) {
  const defeated = bosses.filter(function(b){return b.currentHp<=0;});
  return (
    <div className="fade-in">
      <SL text="Shadow Archive" ac={ac} />
      <p style={{ fontSize:12,color:"#5b7aa0",marginBottom:20 }}>Shadows extracted from defeated inner-demon bosses. They serve your will now.</p>
      {defeated.length===0?(
        <Win ac={ac}><div style={{ padding:"40px 24px",textAlign:"center" }}><div style={{ fontSize:32,marginBottom:12,opacity:0.3 }}>👤</div><p style={{ color:"#5b7aa0",fontSize:13 }}>No shadows extracted yet. Defeat bosses to grow your army.</p></div></Win>
      ):(
        <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:16 }}>
          {bosses.map(function(boss,i){
            if (boss.currentHp>0) return null;
            const data=bossData[i]; const shadow=data&&data.shadow;
            const rarityColor=shadow&&shadow.rarity==="LEGENDARY"?"#f5b65d":shadow&&shadow.rarity==="RARE"?"#a05df5":"#4db8ff";
            return (
              <div key={boss.id} className="shadow-appear" style={{ animationDelay:(i*100)+"ms" }}>
                <Win ac={MONARCH_PURP}><div style={{ padding:"20px" }}>
                  <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:14 }}>
                    <div className="pulse-glow" style={{ width:44,height:44,border:"2px solid "+MONARCH_PURP,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,background:"rgba(155,48,255,0.1)",flexShrink:0 }}>{boss.icon}</div>
                    <div>
                      <div style={{ fontFamily:"'Orbitron',sans-serif",fontSize:13,fontWeight:700,color:MONARCH_PURP }}>{shadow?shadow.name:boss.name}</div>
                      {shadow&&<div style={{ fontSize:10,color:rarityColor }}>{shadow.rarity} · {shadow.title}</div>}
                    </div>
                  </div>
                  {shadow&&(<>
                    <div style={{ fontSize:11,color:"#5b7aa0",marginBottom:6 }}>Passive: <span style={{ color:MONARCH_PURP }}>{shadow.passiveBoost}</span></div>
                    <div style={{ padding:"8px 12px",border:"1px solid "+MONARCH_PURP+"33",background:"rgba(155,48,255,0.06)",fontSize:11,color:"#c8a0e8",fontStyle:"italic",lineHeight:1.6,marginBottom:8 }}>{shadow.lore}</div>
                    <div style={{ padding:"8px 12px",border:"1px solid "+MONARCH_PURP+"22",fontSize:11,color:"#8a5ab0",fontStyle:"italic" }}>{data.dialogue.defeat}</div>
                  </>)}
                </div></Win>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ===========================================================================
   DAILY RESET COUNTDOWN — lightweight, no leaks
   Counts down to midnight local time. Safe interval cleanup.
   =========================================================================== */
function useResetTimer() {
  const getMidnightSeconds = function() {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const diff = Math.floor((midnight - now) / 1000);
    return Number.isFinite(diff) ? Math.max(0, diff) : 0;
  };

  const [secondsLeft, setSecondsLeft] = useState(getMidnightSeconds);

  useEffect(function() {
    const id = setInterval(function() {
      setSecondsLeft(getMidnightSeconds());
    }, 1000);
    return function() { clearInterval(id); };
  }, []);

  /* Safe formatting — never NaN */
  const safe = Number.isFinite(secondsLeft) ? secondsLeft : 0;
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  const fmt = String(h).padStart(2,"0") + ":" + String(m).padStart(2,"0") + ":" + String(s).padStart(2,"0");

  return {
    secondsLeft: safe,
    fmt,
    critical: safe < 600,   /* < 10 min */
    urgent:   safe < 3600,  /* < 1 hour */
    warning:  safe < 7200,  /* < 2 hours */
  };
}

function ResetCountdownBanner({ accentColor, isMonarch, onReset }) {
  const { fmt, critical, urgent, warning, secondsLeft } = useResetTimer();
  const prevRef = useRef(secondsLeft);

  /* Fire onReset once when timer reaches 0 */
  useEffect(function() {
    if (prevRef.current > 0 && secondsLeft === 0) {
      if (typeof onReset === "function") onReset();
    }
    prevRef.current = secondsLeft;
  }, [secondsLeft]);

  /* Color escalates: normal → warning → urgent → critical */
  const color = critical
    ? "#f53d3d"
    : urgent
    ? "#f5b65d"
    : isMonarch ? MONARCH_PURP : (accentColor || SYS_BLUE);

  const borderOpacity = critical ? "cc" : urgent ? "88" : "33";
  const bgColor = critical
    ? "rgba(245,61,61,0.08)"
    : urgent
    ? "rgba(245,182,93,0.05)"
    : "rgba(5,10,20,0.8)";

  /* Sub-message escalates with urgency */
  const subMsg = critical
    ? "⚠⚠ PROTOCOL EXPIRING IN MINUTES ⚠⚠"
    : urgent
    ? "⚠ Quests expire at midnight"
    : warning
    ? "Reset approaching"
    : null;

  const anim = critical
    ? "dungeon-warning 0.5s step-end infinite"
    : urgent
    ? "dungeon-warning 1.2s step-end infinite"
    : "none";

  return (
    <div style={{
      padding: "7px 14px",
      border: "1px solid " + color + borderOpacity,
      background: bgColor,
      marginBottom: 16,
      animation: anim,
      transition: "border-color 1s ease, background 1s ease",
    }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <span style={{ fontFamily:"'Orbitron',sans-serif", fontSize:9, letterSpacing:"0.25em", color, flexShrink:0 }}>
          DAILY RESET
        </span>
        <span style={{
          fontFamily: "'Orbitron',sans-serif",
          fontSize: critical ? 15 : 13,
          fontWeight: 700,
          color,
          letterSpacing: "0.1em",
          textShadow: critical ? "0 0 8px " + color + "88" : "none",
          transition: "font-size 0.3s ease",
        }}>{fmt}</span>
      </div>
      {subMsg && (
        <div style={{ fontSize:9, color, marginTop:3, letterSpacing:"0.1em", textAlign:"center" }}>
          {subMsg}
        </div>
      )}
    </div>
  );
}

/* ===========================================================================
   STREAK PROTECTION — Recovery Opportunity Modal
   Shown after reset when streak > 0 and daily was missed.
   Completing the recovery quest preserves the streak.
   =========================================================================== */
const RECOVERY_QUEST = {
  label: "Recovery Opportunity",
  flavor: "You missed yesterday. The System is offering one chance to preserve your streak. Complete this to continue.",
  goals: [
    { id: "rq_pu",  name: "Push-ups",       target: 30, unit: "",    stat: "Strength"   },
    { id: "rq_r",   name: "10-min Walk/Run", target: 10, unit: "min", stat: "Endurance"  },
    { id: "rq_med", name: "Meditation",      target: 5,  unit: "min", stat: "Discipline" },
  ],
};

function StreakProtectionModal({ streak, onPreserve, onDecline }) {
  const [progress, setProgress] = useState({});
  const allDone = RECOVERY_QUEST.goals.every(function(g){ return (progress[g.id]||0) >= g.target; });

  function tapGoal(goalId) {
    const goal = RECOVERY_QUEST.goals.find(function(g){ return g.id === goalId; });
    if (!goal || (progress[goalId]||0) >= goal.target) return;
    const next = Object.assign({}, progress, { [goalId]: goal.target });
    setProgress(next);
    if (RECOVERY_QUEST.goals.every(function(g){ return (next[g.id]||0) >= g.target; })) {
      setTimeout(function(){ if(typeof onPreserve==="function") onPreserve(); }, 600);
    }
  }

  return (
    <div style={{ position:"fixed",inset:0,zIndex:8100,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(3,5,12,0.9)",backdropFilter:"blur(6px)",padding:"24px 16px" }}>
      <div className="fade-in-up" style={{ maxWidth:460,width:"100%",border:"1px solid #f5b65d88",background:"linear-gradient(160deg,rgba(12,10,4,0.99),rgba(6,5,2,0.99))",position:"relative",overflow:"hidden" }}>
        <div style={{ position:"absolute",inset:0,pointerEvents:"none",background:"repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(245,182,93,0.02) 2px,rgba(245,182,93,0.02) 4px)" }} />
        <div style={{ padding:"28px 24px",position:"relative" }}>
          <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:14 }}>
            <div style={{ width:36,height:36,border:"2px solid #f5b65d",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18 }}>🔥</div>
            <div>
              <div style={{ fontFamily:"'Orbitron',sans-serif",fontSize:12,fontWeight:700,color:"#f5b65d",letterSpacing:"0.1em" }}>STREAK PROTECTION</div>
              <div style={{ fontSize:11,color:"#5b7aa0" }}>Current streak: {streak} days</div>
            </div>
          </div>
          <p style={{ fontSize:13,color:"#9fb8d8",lineHeight:1.7,marginBottom:16 }}>{RECOVERY_QUEST.flavor}</p>

          <div style={{ marginBottom:16 }}>
            {RECOVERY_QUEST.goals.map(function(g){
              const cur = progress[g.id]||0; const done = cur >= g.target;
              return (
                <div key={g.id} onClick={function(){tapGoal(g.id);}} style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"9px 0",borderBottom:"1px solid rgba(245,182,93,0.08)",cursor:done?"default":"pointer" }}>
                  <span style={{ fontSize:13,color:done?"#5a6a3a":"#dbe6ff" }}>{g.name}</span>
                  <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                    <span style={{ fontSize:11,color:done?"#2ee88a":"#9fb8d8" }}>{cur}/{g.target}{g.unit}</span>
                    <div style={{ width:18,height:18,border:"1.5px solid "+(done?"#2ee88a":"#f5b65d55"),background:done?"#2ee88a22":"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#2ee88a" }}>{done?"✓":""}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {allDone && (
            <div className="fade-in" style={{ padding:"8px 12px",border:"1px solid #2ee88a44",background:"rgba(46,232,138,0.06)",fontSize:12,color:"#2ee88a",marginBottom:14,textAlign:"center" }}>
              Streak preserved. The System acknowledges your recovery.
            </div>
          )}

          {!allDone && (
            <div style={{ display:"flex",gap:10 }}>
              <div style={{ flex:1,fontSize:11,color:"#5b7aa0",lineHeight:1.5 }}>Complete all goals to preserve your streak. Tap each goal when done.</div>
              <button onClick={onDecline} style={{ padding:"10px 16px",background:"transparent",border:"1px solid #f53d3d33",color:"#f53d3d66",cursor:"pointer",fontFamily:"'Orbitron',sans-serif",fontSize:9,letterSpacing:"0.15em",whiteSpace:"nowrap" }}>ACCEPT LOSS</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SystemLogView({ logs, ac, secretAchievements, collectedLoreIds, earnedAchievements }) {
  const [tab, setTab] = useState("log");
  const unlocked = (secretAchievements||[]).filter(function(a){return a.unlocked;});
  const loreEntries = LORE_POOL.filter(function(l){ return (collectedLoreIds||[]).includes(l.id); });
  const earned = earnedAchievements || [];
  const loreRarityColor = { COMMON:"#8a8f98", UNCOMMON:"#4db8ff", RARE:"#a05df5", EPIC:"#f5b65d", LEGENDARY:"#f53d3d" };
  const tabs = [["log","Event Log"],["achievements","Achievements ("+earned.length+")"],["secrets","Secrets"],["lore","Lore ("+loreEntries.length+")"]];

  return (
    <div className="fade-in">
      <div style={{ fontFamily:"'Orbitron',sans-serif",fontSize:20,fontWeight:700,color:"#eaf2ff" }}>System Log</div>
      <div style={{ height:1,marginTop:6,background:"linear-gradient(90deg,"+ac+",transparent)",marginBottom:16 }} />

      {/* Tab selector */}
      <div style={{ display:"flex",gap:6,marginBottom:16,flexWrap:"wrap" }}>
        {tabs.map(function(t){
          const active=tab===t[0];
          return (<button key={t[0]} onClick={function(){setTab(t[0]);}} style={{ padding:"5px 14px",background:active?ac:"transparent",border:"1px solid "+ac+(active?"":"44"),color:active?"#03050c":"#9fb8d8",cursor:"pointer",fontFamily:"'Orbitron',sans-serif",fontSize:9,letterSpacing:"0.15em" }}>{t[1]}</button>);
        })}
      </div>

      {/* Event log */}
      {tab==="log"&&(
        <div style={{ border:"1px solid "+ac+"33",background:"linear-gradient(160deg,rgba(10,18,34,0.97),rgba(5,10,20,0.99))" }}>
          <div style={{ padding:"4px 0",maxHeight:400,overflowY:"auto" }}>
            {logs.length===0&&<div style={{ padding:"24px",textAlign:"center",color:"#5b7aa0",fontSize:13 }}>No events logged yet. Begin training.</div>}
            {[...logs].reverse().map(function(entry,i){
              const isSystem=entry.kind==="system"||entry.kind==="monarch"||entry.kind==="secret";
              const ec=entry.kind==="evolve"?"#2ee88a":entry.kind==="warning"?"#f53d3d":entry.kind==="monarch"||entry.kind==="secret"?MONARCH_PURP:entry.kind==="ach"?"#a05df5":entry.kind==="xp"?"#f5b65d":ac;
              return (<div key={i} className="log-entry" style={{ padding:"10px 16px",borderBottom:"1px solid rgba(77,184,255,0.06)",display:"flex",alignItems:"flex-start",gap:12,animationDelay:(i*15)+"ms" }}><span style={{ fontFamily:"monospace",fontSize:10,color:"#5b7aa0",whiteSpace:"nowrap",flexShrink:0,marginTop:2 }}>{entry.time}</span><span style={{ fontSize:11,color:isSystem?MONARCH_DIM:"#5b7aa0",flexShrink:0,marginTop:2 }}>{isSystem?"[SYS]":"[LOG]"}</span><span style={{ fontSize:13,color:ec,lineHeight:1.5 }}>{entry.message}</span></div>);
            })}
          </div>
        </div>
      )}

      {/* Achievements */}
      {tab==="achievements"&&(
        <div>
          {earned.length===0?(
            <div style={{ border:"1px solid #1a2438",padding:"32px",textAlign:"center",color:"#2a3a55",fontSize:12,fontStyle:"italic" }}>No achievements yet. Train. Clear dungeons. Build your streak.</div>
          ):(
            <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:8 }}>
              {earned.map(function(a){
                return (
                  <div key={a.id} style={{ padding:"12px 14px",border:"1px solid "+a.color+"44",background:a.color+"08",display:"flex",alignItems:"center",gap:10 }}>
                    <span style={{ fontSize:20,color:a.color,flexShrink:0 }}>{a.icon}</span>
                    <div>
                      <div style={{ fontFamily:"'Orbitron',sans-serif",fontSize:10,fontWeight:700,color:a.color }}>{a.name}</div>
                      <div style={{ fontSize:10,color:"#5b7aa0",marginTop:2 }}>{a.desc}</div>
                      <div style={{ fontSize:9,color:a.color+"88",marginTop:2 }}>+{a.fameGain} fame</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div style={{ marginTop:10,fontSize:10,color:"#2a3a55",textAlign:"center" }}>
            {ACHIEVEMENT_COLLECTION.length - earned.length} achievement{ACHIEVEMENT_COLLECTION.length-earned.length!==1?"s":""} remaining.
          </div>
        </div>
      )}

      {/* Secrets */}
      {tab==="secrets"&&(
        <div>
          {unlocked.length===0?(
            <div style={{ border:"1px solid #1a2438",padding:"32px",textAlign:"center",color:"#2a3a55",fontSize:12,fontStyle:"italic" }}>No secret achievements unlocked. The System is watching.</div>
          ):(
            <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
              {unlocked.map(function(a){ return (<div key={a.id} style={{ padding:"12px 16px",border:"1px solid "+MONARCH_PURP+"44",background:"rgba(155,48,255,0.06)",display:"flex",alignItems:"center",gap:12 }}><span style={{ fontSize:18,color:MONARCH_PURP }}>{a.icon}</span><div><div style={{ fontFamily:"'Orbitron',sans-serif",fontSize:11,fontWeight:700,color:MONARCH_PURP,letterSpacing:"0.1em" }}>{a.name}</div><div style={{ fontSize:11,color:"#8a5ab0" }}>{a.desc}</div></div></div>); })}
            </div>
          )}
        </div>
      )}

      {/* Lore */}
      {tab==="lore"&&(
        <div>
          {loreEntries.length===0?(
            <div style={{ border:"1px solid #1a2438",padding:"32px",textAlign:"center",color:"#2a3a55",fontSize:12,fontStyle:"italic" }}>No lore fragments collected. Clear dungeons and defeat bosses to recover records.</div>
          ):(
            <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
              {loreEntries.map(function(entry){
                const rc=loreRarityColor[entry.rarity]||ac;
                return (
                  <div key={entry.id} style={{ border:"1px solid "+rc+"44",background:"linear-gradient(160deg,rgba(10,18,34,0.97),rgba(5,10,20,0.99))",padding:"16px 18px" }}>
                    <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8 }}>
                      <div>
                        <div style={{ fontFamily:"'Orbitron',sans-serif",fontSize:11,fontWeight:700,color:rc }}>{entry.title}</div>
                        <div style={{ fontSize:9,color:"#5b7aa0",marginTop:2,letterSpacing:"0.15em" }}>{entry.category} · {entry.rarity}</div>
                      </div>
                    </div>
                    <p style={{ fontSize:12,color:"#9fb8d8",lineHeight:1.8,fontStyle:"italic" }}>"{entry.text}"</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SettingsView({ rank, soundOn, onToggleSound, isMonarch, playerLevel, ascensionCount, onAscend }) {
  const c = isMonarch?MONARCH_PURP:rank.color;
  return (
    <div className="fade-in">
      <SL text="Settings" ac={c} />
      <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
        <Win ac={c}><div style={{ padding:"16px 20px",display:"flex",alignItems:"center",justifyContent:"space-between" }}><div><div style={{ fontWeight:600,color:"#dbe6ff",fontSize:14 }}>System Audio</div><div style={{ fontSize:11,color:"#5b7aa0" }}>SFX toggle</div></div><button onClick={onToggleSound} style={{ width:52,height:26,borderRadius:13,background:soundOn?c:"#2a3a55",border:"none",cursor:"pointer",position:"relative",transition:"background 0.2s" }}><div style={{ position:"absolute",top:3,left:soundOn?28:4,width:20,height:20,borderRadius:"50%",background:"#fff",transition:"left 0.2s" }} /></button></div></Win>
        {["AI Quest Generation (Phase 4)","Supabase Sync (Phase 4)","Push Notifications (Phase 4)"].map(function(item){ return (<Win key={item} ac={c}><div style={{ padding:"14px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",opacity:0.5 }}><span style={{ color:"#9fb8d8",fontSize:13 }}>{item}</span><span style={{ fontSize:10,padding:"2px 8px",border:"1px solid #5b7aa0",color:"#5b7aa0" }}>LOCKED</span></div></Win>); })}
        {/* Wave 4: Ascension */}
        <div style={{ marginTop:8 }}>
          <div style={{ fontFamily:"'Orbitron',sans-serif",fontSize:11,letterSpacing:"0.3em",color:GLITCH_RED,marginBottom:8 }}>ASCENSION</div>
          <div style={{ border:"1px solid "+GLITCH_RED+"44",background:GLITCH_RED+"08",padding:"16px",marginBottom:8 }}>
            <p style={{ fontSize:12,color:"#9fb8d8",lineHeight:1.7,marginBottom:8 }}>
              Prestige resets: level returns to 1. Preserved: titles, shadows, guild, lore, achievements.<br/>
              Gain: permanent growth rate boost, +200 fame, ascension badge.
            </p>
            <div style={{ fontSize:11,color:"#5b7aa0",marginBottom:12 }}>
              Requires LV 48+ · Current ascensions: <span style={{ color:GLITCH_RED }}>{ascensionCount||0}</span>
            </div>
            <button
              disabled={(playerLevel||0)<48}
              onClick={function(){if(typeof onAscend==="function")onAscend();}}
              style={{ padding:"10px 24px",background:(playerLevel||0)>=48?GLITCH_RED:"#0a1020",color:(playerLevel||0)>=48?"#fff":"#2a3a55",border:"none",cursor:(playerLevel||0)>=48?"pointer":"not-allowed",fontFamily:"'Orbitron',sans-serif",fontSize:11,fontWeight:700,letterSpacing:"0.15em" }}>
              {(playerLevel||0)>=48?"ASCEND":"LV 48 REQUIRED"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===========================================================================
   SYSTEM AI — Phase 5 Immersion (Phase 1: dialogue + personality)
   Lightweight static message pools. No LLM. No external calls.
   Every function returns a plain string — zero side effects.
   =========================================================================== */

const SYSTEM_DIALOGUE = {
  streak: [
    "Consistency detected. The System is taking note.",
    "You have shown up again. This is not a coincidence.",
    "Pattern recognized. Your reliability score is increasing.",
    "The System has logged your return. Discipline persists.",
    "Three days. Seven days. The pattern hardens into identity.",
    "Hunter growth rate increasing. Baseline recalibrated.",
    "Behavioral pattern: persistent. Classification: notable.",
  ],
  questClear: [
    "Daily objectives fulfilled. Physical adaptation recorded.",
    "The body you are building is already different from yesterday's.",
    "Quest complete. The System acknowledges your effort.",
    "Records updated. Progress is permanent. Regression is a choice.",
    "You did what most couldn't. That distinction matters.",
    "Protocol complete. Data archived. Rest authorized.",
    "Output confirmed. Your trajectory is being monitored.",
  ],
  lowProgress: [
    "The System has detected reduced output today. Recovery?",
    "Progress is slower today. The System is not judging — yet.",
    "Incomplete data logged. Tomorrow must compensate.",
    "Gaps in training create gaps in capability. Fill them.",
    "Fatigue detected. Adjust or fall behind.",
    "Hunter condition deteriorating. Recovery protocol recommended.",
  ],
  rankUp: [
    "A new rank has been registered. The ceiling has moved.",
    "Your body is no longer what it was. Neither is your limit.",
    "The System has reclassified your threat level. Upward.",
    "Other hunters have noticed something is different about you.",
    "The rank change is visible. Your aura confirms the promotion.",
    "Classification updated. Expectations scale accordingly.",
    "The System is upgrading its observation protocol for you.",
  ],
  eRank: [
    "You are E-Rank. This is where everyone starts. Most stop here.",
    "E-Rank is not an insult. It is a starting point. Begin.",
    "The gap between E-Rank and A-Rank is not talent. It is hours.",
    "Every S-Rank hunter was once standing exactly where you are.",
  ],
  sRank: [
    "S-Rank. Less than 1% of awakened hunters reach this classification.",
    "The System has few records of hunters who progressed beyond this point.",
    "Your existence at this rank is becoming... anomalous.",
    "An unregistered presence has accessed your hunter profile. Origin unknown.",
  ],
  ambient: [
    "The System is watching.",
    "Every completed rep is stored. Nothing is lost.",
    "Your shadow army grows stronger when you do.",
    "The dungeons are waiting. So are you.",
    "Discipline is a form of power most hunters never discover.",
    "Pain is temporary. Rank data is permanent.",
    "The System does not care about your excuses. Only your output.",
    "A hunter who shows up daily will always surpass one who trains harder occasionally.",
    "Your body is the only weapon you cannot drop.",
    "Rest is part of the protocol. Not a failure.",
    "An abnormal presence has been detected nearby.",
    "Something in the gate network has shifted.",
  ],
  lowEnergy: [
    "Hunter biometrics indicate suboptimal recovery. Rest first.",
    "Fatigue compromises output. The System recommends immediate rest.",
    "Your current energy state will reduce performance. Recover before training.",
    "The System detects elevated fatigue markers. Adjust.",
  ],
  highEnergy: [
    "Peak condition confirmed. Performance window is open. Do not waste it.",
    "Optimal biometric state. Push harder today.",
    "The System detects elevated output potential. Conditions confirmed.",
    "Energy profile: excellent. This is the window. Use it.",
  ],
  highFame: [
    "Your reputation within the gate network is growing.",
    "Other hunters are becoming aware of your performance record.",
    "Fame index elevated. Rare events may begin appearing.",
    "The System has flagged your growth rate as statistically significant.",
  ],
  bossDefeat: [
    "The inner demon has been subjugated. ARISE.",
    "You overpowered what you used to submit to.",
    "That shadow now serves the one who defeated it. You.",
    "The System has logged this victory as significant.",
    "Boss subjugated. Shadow extraction window open.",
  ],
  dungeonClear: [
    "Gate cleared. Mana density normalized. Returning to surface.",
    "You emerged. Not every hunter does.",
    "Dungeon data archived. Adaptation protocols updated.",
    "The gate recognizes you now. Stronger hunters face harder gates.",
    "Gate cleared. Fame index increasing.",
  ],
  hiddenQuest: [
    "The System has detected an anomalous growth window.",
    "A hidden path has opened. Most hunters never see this.",
    "This quest does not appear on any official registry.",
    "Something about your performance triggered this. Do not waste it.",
  ],
};

function getSystemMessage(pool, seed) {
  if (!pool || pool.length === 0) return "";
  const s = typeof seed === "number" ? seed : Math.floor(Date.now() / 86400000);
  return pool[Math.abs(s) % pool.length];
}

/* System 6: Energy + fame aware contextual message selector */
function getContextualMessage(player, isDailyDone, rank, isMonarch, energyScore, fame) {
  if (isMonarch) return "Authority confirmed. The shadow army awaits your command.";
  const safeEnergy = (typeof energyScore === "number" && isFinite(energyScore)) ? energyScore : 68;
  const safeFame   = (typeof fame  === "number" && isFinite(fame))  ? fame  : 0;
  const rankName   = rank ? rank.name : "E-Rank";

  /* Critical conditions first */
  if (safeEnergy < 30) return getSystemMessage(SYSTEM_DIALOGUE.lowEnergy, player.streak);
  if (safeEnergy >= 85) return getSystemMessage(SYSTEM_DIALOGUE.highEnergy, player.level);

  if (rankName === "S-Rank" || rankName === "National Level") {
    return getSystemMessage(SYSTEM_DIALOGUE.sRank, player.streak);
  }
  if (rankName === "E-Rank") {
    return getSystemMessage(SYSTEM_DIALOGUE.eRank, player.streak);
  }
  if (safeFame >= 100) return getSystemMessage(SYSTEM_DIALOGUE.highFame, safeFame);
  if (player.streak >= 3) return getSystemMessage(SYSTEM_DIALOGUE.streak, player.streak);
  if (isDailyDone) return getSystemMessage(SYSTEM_DIALOGUE.questClear, player.level);
  return getSystemMessage(SYSTEM_DIALOGUE.ambient, Math.floor(Date.now() / 3600000));
}

/* ===========================================================================
   SYSTEM AI PANEL — renders the System's current message on Dashboard
   Lightweight component, no state, pure display.
   =========================================================================== */
function SystemMessagePanel({ message, accentColor, isMonarch }) {
  if (!message) return null;
  const color = isMonarch ? MONARCH_PURP : (accentColor || SYS_BLUE);
  const bg = isMonarch ? "rgba(155,48,255,0.06)" : "rgba(77,184,255,0.04)";
  return (
    <div style={{
      padding: "12px 16px",
      border: "1px solid " + color + "44",
      background: bg,
      marginBottom: 20,
      display: "flex",
      alignItems: "flex-start",
      gap: 12,
    }}>
      <span style={{
        fontFamily: "'Orbitron', sans-serif",
        fontSize: 10,
        color: color,
        letterSpacing: "0.2em",
        whiteSpace: "nowrap",
        paddingTop: 2,
        flexShrink: 0,
      }}>SYS</span>
      <span style={{
        fontSize: 13,
        color: isMonarch ? "#c8a0e8" : "#9fb8d8",
        lineHeight: 1.6,
        fontStyle: "italic",
      }}>{message}</span>
    </div>
  );
}

/* ===========================================================================
   DAILY HUNTER REPORT — shown on dashboard
   Summarizes the player's current status in system-voice language.
   =========================================================================== */
function DailyHunterReport({ player, rank, isDailyDone, dailyQuest, isMonarch, energyScore, fame }) {
  const safeLevel   = (typeof player.level === "number" && isFinite(player.level)) ? player.level : 1;
  const safeStreak  = (typeof player.streak === "number" && isFinite(player.streak)) ? player.streak : 0;
  const safeEnergy  = (typeof energyScore  === "number" && isFinite(energyScore))  ? clamp(energyScore, 0, 100) : 68;
  const safeFame    = (typeof fame === "number" && isFinite(fame)) ? fame : 0;
  const color       = isMonarch ? MONARCH_PURP : (rank ? rank.color : SYS_BLUE);
  const energyLevel = getEnergyLevel(safeEnergy);

  /* Derive recommended focus from energy */
  const recFocus = safeEnergy < 30
    ? "IMMEDIATE REST — Do not train. Recovery first."
    : safeEnergy < 50
    ? "LIGHT PROTOCOL — Reduced intensity. Prioritize mobility."
    : safeEnergy < 70
    ? "STANDARD PROTOCOL — Full training approved."
    : "PEAK PROTOCOL — Push harder today. Conditions optimal.";

  /* Fatigue warning */
  const fatigueWarn = safeEnergy < 30
    ? "⚠ Critical fatigue. Performance severely impaired."
    : safeEnergy < 50
    ? "⚠ Elevated fatigue. Monitor output."
    : null;

  /* Progression note */
  const progNote = safeStreak >= 7
    ? "Streak verified. Exceptional consistency detected."
    : safeStreak >= 3
    ? "Consistency pattern forming."
    : isDailyDone
    ? "Today's protocol complete."
    : "Protocol in progress. Do not stop.";

  const statusColor = isDailyDone ? "#2ee88a" : "#f5b65d";

  return (
    <div style={{
      border: "1px solid " + color + "33",
      background: "linear-gradient(160deg, rgba(8,14,26,0.95), rgba(4,8,16,0.98))",
      padding: "14px 18px",
      marginBottom: 20,
    }}>
      {/* Report header */}
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10,paddingBottom:8,borderBottom:"1px solid "+color+"22" }}>
        <span style={{ fontFamily:"'Orbitron',sans-serif",fontSize:9,letterSpacing:"0.3em",color }}>HUNTER STATUS REPORT</span>
        <span style={{ fontFamily:"'Orbitron',sans-serif",fontSize:9,color:"#5b7aa0" }}>
          {new Date().toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"}).toUpperCase()}
        </span>
      </div>

      {/* Core data rows */}
      <div style={{ display:"flex",flexDirection:"column",gap:5,marginBottom:10 }}>
        {[
          { label:"HUNTER",      value:player.name||"Unknown"                                    },
          { label:"CLASS",       value:player.job||"Unclassified"                                },
          { label:"RANK",        value:isMonarch?"MONARCH":(rank?rank.name:"E-Rank")             },
          { label:"LEVEL",       value:"LV "+safeLevel                                           },
          { label:"STREAK",      value:safeStreak+(safeStreak===1?" day":" days")                },
          { label:"FAME",        value:safeFame+" pts",    color:safeFame>0?"#f5b65d":null       },
          { label:"ENERGY",      value:energyLevel.label,  color:energyLevel.color               },
          { label:"PROTOCOL",    value:isDailyDone?"COMPLETE":"IN PROGRESS", color:statusColor,
            orbitron:true },
        ].map(function(row){
          return (
            <div key={row.label} style={{ display:"flex",alignItems:"center",justifyContent:"space-between",fontSize:12 }}>
              <span style={{ color:"#5b7aa0",letterSpacing:"0.1em",fontSize:10 }}>{row.label}</span>
              <span style={{ color:row.color||"#dbe6ff",fontWeight:row.color?700:400,fontSize:row.orbitron?10:12,letterSpacing:row.orbitron?"0.1em":0,fontFamily:row.orbitron?"'Orbitron',sans-serif":"'Rajdhani',sans-serif" }}>
                {row.value}
              </span>
            </div>
          );
        })}
      </div>

      {/* System analysis lines */}
      <div style={{ borderTop:"1px solid "+color+"22",paddingTop:8,display:"flex",flexDirection:"column",gap:4 }}>
        {fatigueWarn && (
          <div style={{ fontSize:10,color:"#f53d3d",fontStyle:"italic" }}>{fatigueWarn}</div>
        )}
        <div style={{ fontSize:10,color:color+"bb",fontStyle:"italic" }}>
          Recommended: {recFocus}
        </div>
        <div style={{ fontSize:10,color:"#5b7aa0",fontStyle:"italic" }}>{progNote}</div>
      </div>
    </div>
  );
}

/* ===========================================================================
   RECOVERY STATUS VISUAL — lightweight energy indicator strip
   =========================================================================== */
function RecoveryStatusStrip({ energyScore, accentColor }) {
  const safe  = (typeof energyScore === "number" && isFinite(energyScore)) ? clamp(energyScore, 0, 100) : 68;
  const level = getEnergyLevel(safe);
  const isLow = safe < 40;
  const isPeak = safe >= 85;

  /* Performance impact text */
  const impact = safe < 30
    ? "Quest XP reduced to 70%"
    : safe < 50
    ? "Quest XP reduced to 85%"
    : safe >= 85
    ? "Quest XP boosted to " + Math.round(level.xpMod * 100) + "%"
    : "Quest XP at 100%";

  return (
    <div style={{
      padding: "10px 14px",
      border: "1px solid " + level.color + (isLow ? "66" : "33"),
      background: isLow ? "rgba(245,61,61,0.06)" : isPeak ? "rgba(46,232,138,0.05)" : level.color + "06",
      marginBottom: 16,
      animation: isLow ? "energy-pulse 2s ease-in-out infinite" : "none",
    }}>
      {/* Top row: label + status */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
        <span style={{ fontFamily:"'Orbitron',sans-serif", fontSize:9, letterSpacing:"0.25em", color:level.color }}>
          RECOVERY STATUS
        </span>
        <span style={{ fontFamily:"'Orbitron',sans-serif", fontSize:11, fontWeight:700, color:level.color }}>
          {level.label}
        </span>
      </div>

      {/* Progress bar — segmented into 5 zones */}
      <div style={{ position:"relative", height:6, background:"rgba(255,255,255,0.06)", overflow:"hidden", marginBottom:6 }}>
        <div style={{
          height:"100%", width:safe+"%",
          background:"linear-gradient(90deg," + (safe<30?"#f53d3d":safe<50?"#f5b65d":safe<65?"#8a8f98":safe<85?"#4db8ff":"#2ee88a") + ",#ffffff44)",
          transition:"width 0.8s ease",
        }} />
        {/* Zone markers */}
        {[20,40,65,85].map(function(mark){
          return <div key={mark} style={{ position:"absolute", left:mark+"%", top:0, bottom:0, width:1, background:"rgba(255,255,255,0.12)" }} />;
        })}
      </div>

      {/* Bottom row: score + performance impact */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ fontSize:10, color:"#5b7aa0" }}>{safe}/100</span>
        <span style={{ fontSize:10, color:level.color, fontStyle:"italic" }}>{impact}</span>
      </div>

      {/* Warning line for low energy */}
      {isLow && (
        <div style={{ marginTop:6, fontSize:10, color:"#f53d3d", fontStyle:"italic" }}>
          ⚠ Hunter condition below optimal threshold.
        </div>
      )}
    </div>
  );
}

/* ===========================================================================
   RANDOM EVENTS — Phase 5 Immersion (Phase 2)
   Lightweight probability triggers. All static data.
   No engine. No server. No real-time. Just Math.random() + message pools.
   =========================================================================== */

/* ===========================================================================
   LIMITED-TIME GLOBAL EVENTS
   Rotate based on day-of-week. No server. No real-time.
   Purely deterministic — same event every player sees on the same day.
   =========================================================================== */
/* ---------------------------------------------------------------------------
   BREAKTHROUGH QUESTS — milestone growth walls
   Triggered at specific levels. Completing grants massive rewards.
--------------------------------------------------------------------------- */
const BREAKTHROUGH_QUESTS = [
  {
    id: "bt_1", triggerLevel: 5,
    title: "First Wall",
    flavor: "The System has detected a growth ceiling. Break through it.",
    goals: [
      { id:"bt1_p",  name:"Push-ups",        target:50,  unit:"",    stat:"Strength"   },
      { id:"bt1_pu", name:"Pull-ups",         target:15,  unit:"",    stat:"Strength"   },
      { id:"bt1_r",  name:"2km Run",          target:2,   unit:"km",  stat:"Endurance"  },
    ],
    reward: { xp:200, statKey:"Strength", statGain:5, titleId:"iron_body",
      label:"+200 XP · Strength +5 · Title unlocked" },
  },
  {
    id: "bt_2", triggerLevel: 12,
    title: "Intermediate Threshold",
    flavor: "C-Rank is within reach. The System has locked your next progression behind this test.",
    goals: [
      { id:"bt2_p",  name:"Push-ups",         target:80,  unit:"",    stat:"Strength"   },
      { id:"bt2_pu", name:"Pull-ups",          target:25,  unit:"",    stat:"Strength"   },
      { id:"bt2_r",  name:"3km Run",           target:3,   unit:"km",  stat:"Endurance"  },
      { id:"bt2_pl", name:"Plank Hold",        target:3,   unit:"min", stat:"Discipline" },
    ],
    reward: { xp:400, statKey:"Aura", statGain:6, titleId:"limit_breaker",
      label:"+400 XP · Aura +6 · Title unlocked" },
  },
  {
    id: "bt_3", triggerLevel: 22,
    title: "Elite Threshold",
    flavor: "B-Rank hunters are a different category. Prove you belong.",
    goals: [
      { id:"bt3_p",  name:"Push-ups",         target:120, unit:"",    stat:"Strength"   },
      { id:"bt3_pu", name:"Pull-ups",          target:35,  unit:"",    stat:"Strength"   },
      { id:"bt3_r",  name:"5km Run",           target:5,   unit:"km",  stat:"Endurance"  },
      { id:"bt3_b",  name:"Burpees",           target:30,  unit:"",    stat:"Endurance"  },
      { id:"bt3_m",  name:"Meditation",        target:15,  unit:"min", stat:"Discipline" },
    ],
    reward: { xp:700, statKey:"Discipline", statGain:8, titleId:"relentless",
      label:"+700 XP · Discipline +8 · Title unlocked" },
  },
];

/* ---------------------------------------------------------------------------
   CINEMATIC ACHIEVEMENTS — triggered by in-game conditions
   Each has a CSS-only animation class + dramatic text.
--------------------------------------------------------------------------- */
/* ---------------------------------------------------------------------------
   ACHIEVEMENT COLLECTION — full trackable milestone archive
   Conditions evaluated at render time. No background engine.
--------------------------------------------------------------------------- */
const ACHIEVEMENT_COLLECTION = [
  /* Progression milestones */
  { id:"ac_lv5",   name:"Awakened",          icon:"◈", color:"#8a8f98",
    desc:"Reached Level 5.",            fameGain:10, check:function(p){ return (p.level||0)>=5; } },
  { id:"ac_lv12",  name:"C-Rank Hunter",     icon:"❖", color:"#4db8ff",
    desc:"Reached Level 12.",           fameGain:25, check:function(p){ return (p.level||0)>=12; } },
  { id:"ac_lv22",  name:"Elite Hunter",      icon:"❖", color:"#5d7cf5",
    desc:"Reached Level 22.",           fameGain:50, check:function(p){ return (p.level||0)>=22; } },
  { id:"ac_lv48",  name:"Sovereign Hunter",  icon:"✸", color:"#f5b65d",
    desc:"Reached Level 48.",           fameGain:100,check:function(p){ return (p.level||0)>=48; } },
  /* Streak milestones */
  { id:"ac_str3",  name:"Consistent",        icon:"🔥", color:"#f5b65d",
    desc:"Maintained a 3-day streak.",  fameGain:10, check:function(p){ return (p.streak||0)>=3; } },
  { id:"ac_str7",  name:"Iron Discipline",   icon:"🔥", color:"#2ee88a",
    desc:"Maintained a 7-day streak.",  fameGain:30, check:function(p){ return (p.streak||0)>=7; } },
  { id:"ac_str30", name:"Unbreakable",       icon:"🔥", color:"#a05df5",
    desc:"Maintained a 30-day streak.", fameGain:150,check:function(p){ return (p.streak||0)>=30; } },
  /* Stat milestones */
  { id:"ac_str25", name:"Iron Fist",         icon:"⚔", color:"#f53d3d",
    desc:"Strength reached 25.",        fameGain:20, check:function(p){ return (p.stats&&p.stats.Strength||0)>=25; } },
  { id:"ac_agi25", name:"Swift",             icon:"➤", color:"#4db8ff",
    desc:"Agility reached 25.",         fameGain:20, check:function(p){ return (p.stats&&p.stats.Agility||0)>=25; } },
  { id:"ac_aura30",name:"Aura Awakened",     icon:"✸", color:MONARCH_PURP,
    desc:"Aura reached 30.",            fameGain:40, check:function(p){ return (p.stats&&p.stats.Aura||0)>=30; } },
];

/* Get newly earned achievements (not yet in earnedAchs list) */
function checkNewAchievements(player, earnedIds) {
  if (!player) return [];
  return ACHIEVEMENT_COLLECTION.filter(function(a){
    if (earnedIds.includes(a.id)) return false;
    try { return a.check(player); } catch(_){ return false; }
  });
}

const CINEMATIC_ACHIEVEMENTS = [
  { id:"ach_first_shadow",  condition:"shadowExtracted",     title:"ARISE",
    sub:"The dead answer to you now.",         color:MONARCH_PURP, icon:"◉" },
  { id:"ach_first_boss",    condition:"allBossesDefeated",   title:"INNER DEMONS DEFEATED",
    sub:"Everything that held you back has been subjugated.", color:"#f5b65d", icon:"⚔" },
  { id:"ach_streak_7",      condition:"streak_7",            title:"7-DAY SOVEREIGN",
    sub:"Seven days of unbroken discipline. The pattern is now identity.", color:"#2ee88a", icon:"🔥" },
  { id:"ach_dungeon_all",   condition:"allGatesCleared",     title:"GATE CONQUEROR",
    sub:"Every registered gate has been cleared. The System has updated your profile.", color:"#4db8ff", icon:"❖" },
  { id:"ach_monarch",       condition:"monarchAwakened",     title:"SHADOW MONARCH",
    sub:"You have surpassed the limit of what the System was designed to measure.", color:MONARCH_PURP, icon:"✸" },
];

/* ---------------------------------------------------------------------------
   WORLD EVENTS — broader than random events, affect the whole session
--------------------------------------------------------------------------- */
const WORLD_EVENTS = [
  { id:"we_double_xp",    name:"Double XP Event",         icon:"⬆", color:"#2ee88a",
    desc:"All XP gains doubled for this session.",       xpMod:2.0, dur:3600000 },
  { id:"we_corrupted",    name:"Corrupted Gate Alert",    icon:"⚠", color:GLITCH_RED,
    desc:"Gates are unstable. Dungeon modifiers are more severe.", xpMod:1.5, dur:1800000 },
  { id:"we_rare_merchant",name:"Rare Merchant",           icon:"◈", color:"#f5b65d",
    desc:"A wandering merchant has appeared. Shop prices reduced 20%.", discount:0.2, dur:1800000 },
  { id:"we_shadow_surge", name:"Shadow Surge",            icon:"◉", color:MONARCH_PURP,
    desc:"Shadow mana surging. ARISE success rate +20%.", ariseMod:0.2, dur:3600000 },
  { id:"we_hunter_emerg", name:"Hunter Emergency",        icon:"❖", color:"#f53d3d",
    desc:"Emergency detected. Quest XP +50%. Complete all quests immediately.", xpMod:1.5, dur:1800000 },
];

function rollWorldEvent(rankIndex, streak) {
  const chance = 0.05 + (rankIndex||0)*0.01 + Math.min((streak||0)*0.002, 0.03);
  if (Math.random() > chance) return null;
  return WORLD_EVENTS[Math.floor(Math.random()*WORLD_EVENTS.length)];
}

const LIMITED_TIME_EVENTS = [
  {
    id: "shadow_surge",
    name: "Shadow Surge",
    icon: "◉",
    color: MONARCH_PURP,
    days: [0, 6], /* Sunday, Saturday */
    desc: "Shadow extraction success rate increased. ARISE attempts cost one less failure.",
    bonus: "Shadow XP ×1.5",
    xpMod: 1.5,
    statKey: "Aura",
  },
  {
    id: "dungeon_break",
    name: "Dungeon Break",
    icon: "❖",
    color: "#f53d3d",
    days: [1, 4], /* Monday, Thursday */
    desc: "An unregistered gate has destabilized. All dungeon rewards doubled.",
    bonus: "Dungeon XP ×2",
    xpMod: 2.0,
    statKey: "Strength",
  },
  {
    id: "double_dungeon",
    name: "Double Dungeon Week",
    icon: "✦",
    color: "#4db8ff",
    days: [2], /* Tuesday */
    desc: "Two dungeon instances are active simultaneously. Reward pool expanded.",
    bonus: "All Dungeon Drops ×2",
    xpMod: 1.8,
    statKey: "Endurance",
  },
  {
    id: "monarch_disturbance",
    name: "Monarch Disturbance",
    icon: "✸",
    color: GLITCH_RED,
    days: [3], /* Wednesday */
    desc: "Anomalous authority-class energy detected in the Gate network. Something is watching.",
    bonus: "Hidden event probability ×3",
    xpMod: 1.0,
    statKey: null,
  },
  {
    id: "elite_raid",
    name: "Elite Raid Window",
    icon: "⚔",
    color: "#f5b65d",
    days: [5], /* Friday */
    desc: "Elite-rank gates have opened. Boss raid rewards elevated for 24 hours.",
    bonus: "Boss XP ×1.75 · Rare drop rate up",
    xpMod: 1.75,
    statKey: "Discipline",
  },
];

/* Get the active event for today (if any). Deterministic — no state needed. */
function getActiveLimitedEvent() {
  const dow = new Date().getDay(); /* 0=Sun … 6=Sat */
  return LIMITED_TIME_EVENTS.find(function(e) {
    return e.days.includes(dow);
  }) || null;
}

/* Banner component — shown on Dashboard */
function LimitedEventBanner({ accentColor }) {
  const event = getActiveLimitedEvent();
  if (!event) return null;
  return (
    <div style={{
      padding: "12px 16px",
      marginBottom: 16,
      border: "1px solid " + event.color + "88",
      background: event.color + "0d",
      display: "flex",
      alignItems: "center",
      gap: 12,
    }}>
      <div style={{
        width: 34,
        height: 34,
        border: "1.5px solid " + event.color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 16,
        color: event.color,
        flexShrink: 0,
        animation: "pulse-glow 2s ease-in-out infinite",
      }}>{event.icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 11, fontWeight: 700, color: event.color, letterSpacing: "0.1em" }}>
            {event.name.toUpperCase()}
          </span>
          <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 9, color: "#5b7aa0", whiteSpace: "nowrap" }}>
            TODAY ONLY
          </span>
        </div>
        <div style={{ fontSize: 11, color: "#9fb8d8", marginTop: 3, lineHeight: 1.5 }}>{event.desc}</div>
        <div style={{ fontSize: 10, color: event.color, marginTop: 4, fontWeight: 700 }}>{event.bonus}</div>
      </div>
    </div>
  );
}

const RANDOM_EVENTS = [
  /* Emergency events — triggered on daily clear, low probability */
  {
    id: "emergency_sprint",
    type: "emergency",
    label: "EMERGENCY QUEST",
    rarity: "UNCOMMON",
    chance: 0.08, /* 8% on daily clear */
    title: "System Override Detected",
    flavor: "An unregistered event has been forced into your protocol. Complete it within this session or face a penalty modifier.",
    goals: [
      { id: "ev_sprint", name: "Sprint Sets (100m)", target: 6, unit: "×",  stat: "Agility"    },
      { id: "ev_push",   name: "Push-ups",           target: 50, unit: "", stat: "Strength"   },
    ],
    xp: 120, statKey: "Agility", statGain: 2,
  },
  {
    id: "emergency_focus",
    type: "emergency",
    label: "EMERGENCY QUEST",
    rarity: "UNCOMMON",
    chance: 0.07,
    title: "Mental Override Protocol",
    flavor: "The System has detected a gap in your cognitive conditioning. This must be resolved before tomorrow's protocol begins.",
    goals: [
      { id: "ev_med",   name: "Meditation",      target: 20,  unit: "min", stat: "Discipline"   },
      { id: "ev_focus", name: "Focus Session",   target: 45,  unit: "min", stat: "Intelligence" },
    ],
    xp: 100, statKey: "Intelligence", statGain: 2,
  },
  /* Corrupted notification — cosmetic only, no quest */
  {
    id: "corrupted_scan",
    type: "corrupted",
    label: "CORRUPTED DATA",
    rarity: "UNCOMMON",
    chance: 0.1,
    title: "Scan Data Corrupted",
    flavor: "[ERR_0x4F] Hunter profile integrity check failed. Re-running baseline calibration. Data restored.",
    goals: [],
    xp: 0, statKey: null, statGain: 0,
  },
  /* Rare loot event */
  {
    id: "rare_loot_aura",
    type: "loot",
    label: "RARE DISCOVERY",
    rarity: "RARE",
    chance: 0.05,
    title: "Aura Crystallization Event",
    flavor: "During your training session, the System detected an anomalous mana crystallization. Aura has been permanently augmented.",
    goals: [],
    xp: 50, statKey: "Aura", statGain: 3,
  },
  {
    id: "rare_loot_coins",
    type: "loot",
    label: "BONUS REWARD",
    rarity: "UNCOMMON",
    chance: 0.12,
    title: "Performance Bonus Triggered",
    flavor: "The System has awarded a bonus based on consistency metrics. Coin allocation transferred.",
    goals: [],
    xp: 0, statKey: null, statGain: 0, coins: 100,
  },
];

/* Roll a random event after quest completion. Returns an event or null. */
function rollRandomEvent(streak, rankIndex) {
  /* Higher streak and rank = slightly higher event chance */
  const bonusChance = Math.min(0.05, (streak || 0) * 0.003 + (rankIndex || 0) * 0.005);
  const eligible = RANDOM_EVENTS.filter(function(e) {
    return Math.random() < (e.chance + bonusChance);
  });
  if (eligible.length === 0) return null;
  return eligible[Math.floor(Math.random() * eligible.length)];
}

/* ===========================================================================
   RANDOM EVENT POPUP — lightweight, no cinematic engine
   =========================================================================== */
function RandomEventPopup({ event, onAccept, onDismiss }) {
  if (!event) return null;

  const colorMap = { emergency:"#f53d3d", corrupted:GLITCH_RED, loot:"#f5b65d", rare:"#a05df5" };
  const color = colorMap[event.type] || SYS_BLUE;
  const hasQuest = event.goals && event.goals.length > 0;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 8200,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(3,5,12,0.9)", backdropFilter: "blur(6px)", padding: "24px 16px",
    }}>
      <div className="fade-in-up" style={{
        maxWidth: 460, width: "100%",
        border: "1px solid " + color + "88",
        background: "linear-gradient(160deg,rgba(10,16,28,0.99),rgba(5,8,18,0.99))",
        boxShadow: "0 0 50px " + color + "22",
        position: "relative", overflow: "hidden",
      }}>
        {/* Scanlines */}
        <div style={{ position:"absolute",inset:0,pointerEvents:"none",background:"repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(255,255,255,0.012) 2px,rgba(255,255,255,0.012) 4px)" }} />

        <div style={{ padding: "28px 24px", position: "relative" }}>
          {/* Rarity + label */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: 14 }}>
            <span style={{ fontFamily:"'Orbitron',sans-serif", fontSize:10, letterSpacing:"0.3em", color, padding:"3px 10px", border:"1px solid "+color+"66" }}>{event.label}</span>
            <span style={{ fontFamily:"'Orbitron',sans-serif", fontSize:9, letterSpacing:"0.2em", color:"#5b7aa0" }}>{event.rarity}</span>
          </div>

          {/* Title + flavor */}
          <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:16, fontWeight:700, color:"#eaf2ff", marginBottom:10 }}>{event.title}</div>
          <p style={{ fontSize:13, color:"#9fb8d8", lineHeight:1.7, marginBottom:16 }}>{event.flavor}</p>

          {/* Goals preview */}
          {hasQuest && (
            <div style={{ marginBottom:16 }}>
              <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:10, letterSpacing:"0.2em", color:"#5b7aa0", marginBottom:8 }}>OBJECTIVES</div>
              {event.goals.map(function(g) {
                return (
                  <div key={g.id} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:"1px solid rgba(77,184,255,0.08)", fontSize:13 }}>
                    <span style={{ color:"#dbe6ff" }}>{g.name}</span>
                    <span style={{ color:"#9fb8d8" }}>{g.target}{g.unit}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Reward */}
          {(event.xp > 0 || event.statKey || event.coins) && (
            <div style={{ padding:"8px 12px", border:"1px solid "+color+"33", background:color+"0a", marginBottom:16, fontSize:12, color, fontWeight:700 }}>
              {[event.xp>0?"+" + event.xp+" XP":null, event.statKey?event.statKey+" +"+event.statGain:null, event.coins?"+"+event.coins+" coins":null].filter(Boolean).join(" · ")}
            </div>
          )}

          {/* Buttons */}
          <div style={{ display:"flex", gap:10 }}>
            {hasQuest && (
              <button onClick={function(){if(typeof onAccept==="function")onAccept(event);}} style={{ flex:1, padding:"11px", background:color, color:"#03050c", border:"none", cursor:"pointer", fontFamily:"'Orbitron',sans-serif", fontSize:11, fontWeight:700, letterSpacing:"0.15em" }}>
                ACCEPT
              </button>
            )}
            <button onClick={function(){if(typeof onDismiss==="function")onDismiss(event);}} style={{ flex:1, padding:"11px", background:"transparent", border:"1px solid "+color+"55", color:color+"cc", cursor:"pointer", fontFamily:"'Orbitron',sans-serif", fontSize:11, letterSpacing:"0.1em" }}>
              {hasQuest ? "DECLINE" : "ACKNOWLEDGE"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
/* ===========================================================================
   SHADOW EVOLUTION — Phase 5 Immersion (Phase 3)
   Shadow loyalty + evolution level tracking.
   Plain structured objects. No AI. No real-time simulation.
   =========================================================================== */

/* ===========================================================================
   SHADOW MISSION SYSTEM
   Shadows can be dispatched on timed missions. No real-time combat.
   Success is calculated once when the mission completes.
   =========================================================================== */
const SHADOW_MISSIONS = [
  { id: "relic_hunt",   name: "Relic Hunt",         icon: "✦", dur: 60*60*1000,  /* 1h  */
    desc: "Search abandoned gates for equipment fragments.",
    reward: { coins:[50,150], statKey:"Strength", statGain:1, loreFrag: false },
    minRarity: "COMMON", baseSuccessRate: 0.75 },
  { id: "recon",        name: "Reconnaissance",     icon: "➤", dur: 30*60*1000,  /* 30m */
    desc: "Scout an upcoming dungeon gate. Returns intel and coins.",
    reward: { coins:[30,80], statKey:"Agility", statGain:1, loreFrag: true  },
    minRarity: "COMMON", baseSuccessRate: 0.85 },
  { id: "dungeon_scout",name: "Dungeon Scouting",   icon: "❖", dur: 2*60*60*1000,/* 2h  */
    desc: "Deep scout inside a closed gate. High reward, moderate risk.",
    reward: { coins:[100,300], statKey:"Endurance", statGain:2, key: true   },
    minRarity: "UNCOMMON", baseSuccessRate: 0.60 },
  { id: "resource_run", name: "Resource Gathering", icon: "◈", dur: 45*60*1000,  /* 45m */
    desc: "Gather mana crystals and coins from low-rank gates.",
    reward: { coins:[60,120], statKey:"Recovery", statGain:1, loreFrag: false },
    minRarity: "COMMON", baseSuccessRate: 0.80 },
  { id: "investigation", name: "Hidden Investigation", icon: "✸", dur: 3*60*60*1000,/* 3h */
    desc: "Investigate a signal detected by the System. Unknown reward.",
    reward: { coins:[150,400], statKey:"Aura", statGain:3, loreFrag: true, key: true },
    minRarity: "RARE", baseSuccessRate: 0.45 },
];

const RARITY_RANK = { COMMON:0, UNCOMMON:1, RARE:2, EPIC:3, LEGENDARY:4, MYTHIC:5 };

/* Calculate mission success chance from shadow stats */
function calcMissionSuccess(shadow, mission) {
  if (!shadow || !mission) return 0;
  const loyaltyBonus   = ((shadow.loyalty||0) / 100) * 0.2;
  const evolutionBonus = ((shadow.evolutionLevel||1) - 1) * 0.05;
  const rarityBonus    = (RARITY_RANK[shadow.rarity] || 0) * 0.04;
  const rate = mission.baseSuccessRate + loyaltyBonus + evolutionBonus + rarityBonus;
  return Math.min(0.97, rate);
}

/* Roll mission reward */
function rollMissionReward(mission, succeeded) {
  if (!succeeded) return { coins: 0, message: "The shadow returned empty-handed." };
  const r = mission.reward;
  const coins = Math.floor(r.coins[0] + Math.random() * (r.coins[1] - r.coins[0]));
  const parts = ["+"+coins+" coins"];
  if (r.statKey) parts.push(r.statKey+" +"+r.statGain);
  if (r.key) parts.push("Dungeon Key");
  if (r.loreFrag) parts.push("Lore Fragment");
  return { coins, statKey:r.statKey, statGain:r.statGain, key:r.key||false, loreFrag:r.loreFrag||false, message: parts.join(" · ") };
}

const SHADOW_LOYALTY_TITLES = [
  { min: 0,   label: "Newly Summoned",   color: "#8a8f98" },
  { min: 20,  label: "Bound",            color: "#6fae6f" },
  { min: 40,  label: "Faithful",         color: "#4db8ff" },
  { min: 60,  label: "Devoted",          color: "#a05df5" },
  { min: 80,  label: "Absolute Loyalty", color: "#f5b65d" },
  { min: 100, label: "Soul-Bound",       color: "#2ee88a" },
];

function getShadowLoyalty(loyalty) {
  const safe = (typeof loyalty === "number" && isFinite(loyalty)) ? clamp(loyalty, 0, 100) : 0;
  let title = SHADOW_LOYALTY_TITLES[0];
  for (let i = 0; i < SHADOW_LOYALTY_TITLES.length; i++) {
    if (safe >= SHADOW_LOYALTY_TITLES[i].min) title = SHADOW_LOYALTY_TITLES[i];
  }
  return Object.assign({ score: safe }, title);
}

/* Build a full shadow record when ARISE succeeds */
function buildShadowRecord(bossData) {
  const template = SHADOW_TEMPLATES.find(function(t) { return t.id === "sh_" + bossData.id; });
  return {
    id:             "shadow_" + bossData.id + "_" + Date.now(),
    templateId:     template ? template.id : "sh_" + bossData.id,
    name:           bossData.shadow ? bossData.shadow.name : bossData.name,
    rank:           template ? template.rank : "Elite Knight",
    rarity:         bossData.shadow ? (bossData.shadow.rarity || "RARE") : "RARE",
    specialty:      template ? template.specialty : bossData.title,
    aura:           template ? template.aura : "shadow mist",
    lore:           bossData.shadow ? bossData.shadow.lore : "",
    passive:        bossData.shadow ? bossData.shadow.passiveBoost : "",
    statBoost:      template ? template.statBoost : {},
    evolutionTo:    template ? template.evolutionTo : null,
    icon:           bossData.icon,
    color:          bossData.color,
    loyalty:        0,
    evolutionLevel: 1,
    defeatedAt:     Date.now(),
    fromBoss:       bossData.id,
    customName:     null,
    favorite:       false,
  };
}

/* ===========================================================================
   DUNGEON ENTRY CUTSCENE — Phase 4
   Full-screen cinematic before entering any gate chain.
   =========================================================================== */
function DungeonCutscene({ gate, onEnter, onAbort }) {
  const [phase, setPhase] = useState(0);
  const timerRef = useRef(null);
  const msgs = [
    "Dungeon Gate Detected.",
    "Scanning mana density...",
    "Danger Level: " + (gate.survivalChance < 30 ? "EXTREME" : gate.survivalChance < 60 ? "HIGH" : "MODERATE") + ".",
    "Estimated Survival Rate: " + gate.survivalChance + "%.",
    "Hunter rank analysis... " + (gate.rank) + "-Rank gate confirmed.",
    "Proceed or withdraw.",
  ];

  useEffect(function() {
    if (phase < msgs.length - 1) {
      timerRef.current = setTimeout(function() { setPhase(function(p) { return p + 1; }); }, 700);
      return function() { clearTimeout(timerRef.current); };
    }
  }, [phase]);

  const dangerColor = gate.survivalChance < 30 ? "#f53d3d" : gate.survivalChance < 60 ? "#f5b65d" : "#2ee88a";

  return (
    <div style={{ position:"fixed",inset:0,zIndex:8800,background:"rgba(0,0,0,0.97)",display:"flex",alignItems:"center",justifyContent:"center",padding:24 }}>
      {/* scan line */}
      <div style={{ position:"fixed",left:0,right:0,height:2,background:"linear-gradient(90deg,transparent,"+gate.color+"88,transparent)",animation:"scan-line 1.8s linear infinite" }} />
      {/* scanlines */}
      <div style={{ position:"fixed",inset:0,pointerEvents:"none",background:"repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(255,255,255,0.02) 2px,rgba(255,255,255,0.02) 4px)" }} />

      <div style={{ maxWidth:500,width:"100%",textAlign:"center" }}>
        {/* Gate name */}
        <div style={{ fontFamily:"'Orbitron',sans-serif",fontSize:10,letterSpacing:"0.5em",color:gate.color,marginBottom:16 }} className="dng-warn">
          ⚠ GATE DETECTED ⚠
        </div>
        <div style={{ fontFamily:"'Orbitron',sans-serif",fontSize:26,fontWeight:900,color:"#eaf2ff",marginBottom:6,textShadow:"0 0 20px "+gate.color }}>{gate.name}</div>
        <div style={{ fontFamily:"'Orbitron',sans-serif",fontSize:12,color:gate.color,marginBottom:24,letterSpacing:"0.2em" }}>{gate.rank}-RANK DUNGEON</div>

        {/* Animated system messages */}
        <div style={{ border:"1px solid "+gate.color+"44",background:"rgba(5,8,16,0.95)",padding:"16px 20px",marginBottom:20,textAlign:"left",minHeight:120 }}>
          {msgs.slice(0,phase+1).map(function(m,i) {
            return (
              <div key={i} className="log-entry" style={{ fontFamily:"monospace",fontSize:12,color: i===msgs.length-1?gate.color:i>=msgs.length-3?dangerColor:"#5b7aa0",marginBottom:6,animationDelay:(i*50)+"ms" }}>
                {">"} {m}
              </div>
            );
          })}
          {phase < msgs.length - 1 && <span className="blink" style={{ color:gate.color }}>_</span>}
        </div>

        {/* Survival rate display */}
        {phase >= 3 && (
          <div className="fade-in" style={{ marginBottom:20 }}>
            <div style={{ fontSize:48,fontWeight:900,fontFamily:"'Orbitron',sans-serif",color:dangerColor,textShadow:"0 0 20px "+dangerColor }}>{gate.survivalChance}%</div>
            <div style={{ fontSize:11,color:"#5b7aa0" }}>Hunter survival probability</div>
          </div>
        )}

        {/* Actions — only show when messages done */}
        {phase >= msgs.length - 1 && (
          <div className="fade-in" style={{ display:"flex",gap:12,justifyContent:"center" }}>
            <button onClick={onEnter} style={{ padding:"12px 32px",background:gate.color,color:"#03050c",border:"none",cursor:"pointer",fontFamily:"'Orbitron',sans-serif",fontSize:12,fontWeight:700,letterSpacing:"0.15em" }}>
              ENTER GATE
            </button>
            <button onClick={onAbort} style={{ padding:"12px 24px",background:"transparent",border:"1px solid #f53d3d55",color:"#f53d3d88",cursor:"pointer",fontFamily:"'Orbitron',sans-serif",fontSize:11,letterSpacing:"0.1em" }}>
              WITHDRAW
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ===========================================================================
   REWARD CHEST MODAL — Phase 4
   Shows 3 face-down reward options after daily quest clear.
   =========================================================================== */
function RewardChestModal({ rewards, onClaim, accentColor }) {
  const [chosen, setChosen] = useState(null);
  const [revealed, setRevealed] = useState(false);

  function pick(index) {
    if (chosen !== null) return;
    setChosen(index);
    setTimeout(function() { setRevealed(true); }, 400);
  }

  const r = rewards[chosen];
  const rColor = r ? (r.color || accentColor) : accentColor;

  return (
    <div style={{ position:"fixed",inset:0,zIndex:8900,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(3,5,12,0.92)",backdropFilter:"blur(8px)",padding:24 }}>
      <div style={{ maxWidth:520,width:"100%",textAlign:"center" }}>
        {/* Header */}
        <div style={{ fontFamily:"'Orbitron',sans-serif",fontSize:10,letterSpacing:"0.4em",color:accentColor,marginBottom:8 }}>QUEST CLEARED</div>
        <div style={{ fontFamily:"'Orbitron',sans-serif",fontSize:20,fontWeight:700,color:"#eaf2ff",marginBottom:4 }}>Choose Your Reward</div>
        <p style={{ fontSize:12,color:"#5b7aa0",marginBottom:24 }}>Select one chest. The others return to the void.</p>

        {/* 3 chests */}
        <div style={{ display:"flex",gap:12,justifyContent:"center",marginBottom:24 }}>
          {rewards.map(function(reward, i) {
            const isMine = chosen === i;
            const isRevealed = isMine && revealed;
            const rc = isRevealed ? reward.color : "#2a3a55";
            return (
              <button key={i} onClick={function() { pick(i); }}
                style={{ flex:1,maxWidth:140,padding:"20px 12px",border:"2px solid "+(isMine?reward.color:accentColor+"44"),background:isRevealed?reward.color+"14":"rgba(10,18,34,0.95)",cursor:chosen===null?"pointer":"default",transition:"all 0.3s",transform:isMine?"scale(1.06)":"scale(1)" }}>
                {!isRevealed ? (
                  <div>
                    <div style={{ fontSize:32,marginBottom:8 }}>🎁</div>
                    <div style={{ fontFamily:"'Orbitron',sans-serif",fontSize:10,color:accentColor+"88",letterSpacing:"0.2em" }}>CHEST {i+1}</div>
                  </div>
                ) : (
                  <div className="chest-reveal">
                    <div style={{ fontSize:28,marginBottom:6 }}>{reward.icon}</div>
                    <div style={{ fontFamily:"'Orbitron',sans-serif",fontSize:11,fontWeight:700,color:reward.color,marginBottom:4 }}>{reward.label}</div>
                    {reward.desc && <div style={{ fontSize:10,color:"#7e98ba",lineHeight:1.4 }}>{reward.desc}</div>}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Claim button — shows after reveal */}
        {revealed && r && (
          <div className="fade-in">
            <div style={{ padding:"10px 16px",border:"1px solid "+rColor+"44",background:rColor+"11",marginBottom:16,fontSize:13,fontWeight:700,color:rColor }}>{r.label} — Claimed</div>
            <button onClick={function() { onClaim(r); }} style={{ padding:"12px 32px",background:rColor,color:"#03050c",border:"none",cursor:"pointer",fontFamily:"'Orbitron',sans-serif",fontSize:12,fontWeight:700,letterSpacing:"0.15em" }}>
              COLLECT
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ===========================================================================
   STAT POINT DISTRIBUTOR — Phase 4
   +3 free stat points to spend after daily clear.
   =========================================================================== */
function StatPointDistributor({ points, onConfirm, accentColor }) {
  const DISTRIBUTABLE = ["Strength","Agility","Endurance","Discipline","Intelligence"];
  const [dist, setDist] = useState({ Strength:0,Agility:0,Endurance:0,Discipline:0,Intelligence:0 });
  const used = Object.values(dist).reduce(function(s,v){return s+v;},0);
  const remaining = points - used;

  function add(key) { if (remaining <= 0) return; setDist(function(p){return Object.assign({},p,{[key]:p[key]+1});}); }
  function sub(key) { if (dist[key]<=0) return; setDist(function(p){return Object.assign({},p,{[key]:p[key]-1});}); }

  return (
    <div style={{ position:"fixed",inset:0,zIndex:8950,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(3,5,12,0.88)",backdropFilter:"blur(6px)",padding:24 }}>
      <div style={{ maxWidth:440,width:"100%",border:"1px solid "+accentColor+"66",background:"linear-gradient(160deg,rgba(10,18,34,0.99),rgba(5,10,20,0.99))",padding:"28px 24px" }}>
        <div style={{ textAlign:"center",marginBottom:20 }}>
          <div style={{ fontFamily:"'Orbitron',sans-serif",fontSize:10,letterSpacing:"0.4em",color:accentColor,marginBottom:8 }}>STAT ALLOCATION</div>
          <div style={{ fontFamily:"'Orbitron',sans-serif",fontSize:18,fontWeight:700,color:"#eaf2ff",marginBottom:4 }}>+{points} Points Available</div>
          <div style={{ fontSize:12,color:"#5b7aa0" }}>Distribute into your chosen stats. Points not spent are lost.</div>
        </div>

        <div style={{ marginBottom:20 }}>
          {DISTRIBUTABLE.map(function(key) {
            return (
              <div key={key} style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid rgba(77,184,255,0.08)" }}>
                <span style={{ fontSize:14,color:"#dbe6ff" }}>{STAT_ICON[key]} {key}</span>
                <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                  <button onClick={function(){sub(key);}} style={{ width:28,height:28,background:"transparent",border:"1px solid "+accentColor+"44",color:accentColor,cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center" }}>−</button>
                  <span style={{ fontFamily:"'Orbitron',sans-serif",fontSize:16,fontWeight:700,color:dist[key]>0?accentColor:"#5b7aa0",minWidth:24,textAlign:"center" }}>{dist[key]>0?"+"+dist[key]:"0"}</span>
                  <button onClick={function(){add(key);}} disabled={remaining<=0} style={{ width:28,height:28,background:remaining>0?accentColor:"#1a2438",border:"none",color:remaining>0?"#03050c":"#5b7aa0",cursor:remaining>0?"pointer":"not-allowed",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center" }}>+</button>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16 }}>
          <span style={{ fontSize:12,color:"#5b7aa0" }}>Remaining: <strong style={{ color:remaining>0?accentColor:"#2ee88a" }}>{remaining}</strong></span>
          <span style={{ fontSize:12,color:"#5b7aa0" }}>Spent: {used}/{points}</span>
        </div>

        <button onClick={function(){onConfirm(dist);}} style={{ width:"100%",padding:"12px",background:accentColor,color:"#03050c",border:"none",cursor:"pointer",fontFamily:"'Orbitron',sans-serif",fontSize:12,fontWeight:700,letterSpacing:"0.15em" }}>
          CONFIRM ALLOCATION
        </button>
      </div>
    </div>
  );
}

/* ===========================================================================
   ENERGY VIEW — Phase 4
   =========================================================================== */
function EnergyView({ energyState, onUpdate, accentColor }) {
  const [local, setLocal] = useState(energyState);

  const METRICS = [
    { id: "sleep",      label: "Sleep Quality",  icon: "✚", range: [0,10], hint: "Hours slept + quality (0–10)" },
    { id: "soreness",   label: "Soreness",        icon: "⚔", range: [0,10], hint: "0 = none, 10 = severe DOMS", invert: true },
    { id: "fatigue",    label: "Fatigue",          icon: "❖", range: [0,10], hint: "0 = fresh, 10 = depleted", invert: true },
    { id: "hydration",  label: "Hydration",        icon: "✚", range: [0,10], hint: "0 = dehydrated, 10 = optimal" },
    { id: "stress",     label: "Mental Stress",    icon: "◈", range: [0,10], hint: "0 = clear, 10 = overwhelmed", invert: true },
  ];

  function computeScore(state) {
    let total = 0;
    METRICS.forEach(function(m) {
      const v = state[m.id] || 5;
      total += m.invert ? (10 - v) * 10 : v * 10;
    });
    return Math.round(total / METRICS.length);
  }

  const score = computeScore(local);
  const energyLevel = getEnergyLevel(score);

  function setMetric(id, val) {
    setLocal(function(prev) { return Object.assign({}, prev, { [id]: val }); });
  }

  function save() {
    if (typeof onUpdate === "function") onUpdate(local, score);
  }

  return (
    <div className="fade-in">
      <div style={{ marginBottom:20 }}>
        <div style={{ fontFamily:"'Orbitron',sans-serif",fontSize:20,fontWeight:700,color:"#eaf2ff" }}>Energy System</div>
        <div style={{ height:1,marginTop:6,background:"linear-gradient(90deg,"+accentColor+",transparent)" }} />
        <p style={{ fontSize:12,color:"#5b7aa0",marginTop:6 }}>Log your recovery metrics. Energy affects quest XP and quest difficulty.</p>
      </div>

      {/* Energy rating card */}
      <div className="energy-pulse" style={{ padding:"20px 24px",marginBottom:20,border:"2px solid "+energyLevel.color+"88",background:energyLevel.color+"0a",display:"flex",alignItems:"center",gap:20 }}>
        <div style={{ textAlign:"center",flexShrink:0 }}>
          <div style={{ fontFamily:"'Orbitron',sans-serif",fontSize:36,fontWeight:900,color:energyLevel.color }}>{score}</div>
          <div style={{ fontSize:9,color:"#5b7aa0",letterSpacing:"0.2em" }}>SCORE</div>
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:"'Orbitron',sans-serif",fontSize:16,fontWeight:700,color:energyLevel.color,marginBottom:4 }}>{energyLevel.label}</div>
          <div style={{ fontSize:12,color:"#9fb8d8",lineHeight:1.6 }}>{energyLevel.desc}</div>
          <div style={{ fontSize:11,color:"#5b7aa0",marginTop:4 }}>XP Modifier: <span style={{ color:energyLevel.color,fontWeight:700 }}>{Math.round(energyLevel.xpMod*100)}%</span></div>
        </div>
      </div>

      {/* Metric sliders */}
      <div style={{ border:"1px solid "+accentColor+"44",background:"linear-gradient(160deg,rgba(10,18,34,0.97),rgba(5,10,20,0.99))",padding:"20px",marginBottom:16 }}>
        {METRICS.map(function(m) {
          const val = local[m.id] !== undefined ? local[m.id] : 5;
          return (
            <div key={m.id} style={{ marginBottom:18 }}>
              <div style={{ display:"flex",justifyContent:"space-between",marginBottom:6 }}>
                <span style={{ fontSize:13,color:"#dbe6ff" }}>{m.icon} {m.label}</span>
                <span style={{ fontSize:13,fontWeight:700,color:accentColor,fontVariantNumeric:"tabular-nums" }}>{val}/10</span>
              </div>
              <input type="range" min="0" max="10" step="1" value={val}
                onChange={function(e){setMetric(m.id, parseInt(e.target.value));}}
                style={{ width:"100%",accentColor:accentColor,cursor:"pointer" }} />
              <div style={{ fontSize:10,color:"#5b7aa0",marginTop:2 }}>{m.hint}</div>
            </div>
          );
        })}
      </div>

      <button onClick={save} style={{ width:"100%",padding:"12px",background:accentColor,color:"#03050c",border:"none",cursor:"pointer",fontFamily:"'Orbitron',sans-serif",fontSize:12,fontWeight:700,letterSpacing:"0.2em" }}>
        LOG ENERGY STATUS
      </button>
    </div>
  );
}

/* ===========================================================================
   HUNTER SHOP VIEW — Phase 4
   =========================================================================== */
/* ===========================================================================
   SECRET BOSSES VIEW
   =========================================================================== */
/* ===========================================================================
   SPECIALIZATION VIEW
   =========================================================================== */
/* ===========================================================================
   HUNTER IDENTITY VIEW — prestigious profile card
   =========================================================================== */
function HunterIdentityView({ player, rank, isMonarch, fame, shadowArmy, bosses, clearedGates, earnedAchievements, guildId, accentColor }) {
  const safeLevel  = (typeof player.level==="number"&&isFinite(player.level)) ? player.level : 1;
  const safeStreak = (typeof player.streak==="number"&&isFinite(player.streak)) ? player.streak : 0;
  const safeFame   = (typeof fame==="number"&&isFinite(fame)) ? fame : 0;
  const fameTier   = getFameTier(safeFame);
  const auraType   = getAuraType(player.stats, isMonarch);
  const activeTitle= HUNTER_TITLES.find(function(t){return t.id===(player.activeTitle||"awakened");}) || HUNTER_TITLES[0];
  const shadowCount= shadowArmy ? shadowArmy.filter(function(s){return s&&s.id;}).length : 0;
  const gateCount  = clearedGates ? Object.keys(clearedGates).filter(function(k){return clearedGates[k];}).length : 0;
  const bossCount  = bosses ? bosses.filter(function(b){return b.currentHp<=0;}).length : 0;
  const achScore   = (earnedAchievements||[]).reduce(function(s,a){return s+(a.fameGain||0);},0);
  const guild      = GUILDS.find(function(g){return g.id===guildId;});
  const c          = isMonarch ? MONARCH_PURP : (rank?rank.color:SYS_BLUE);

  const rows = [
    { label:"HUNTER",      value:player.name||"Unknown" },
    { label:"CLASS",       value:player.job||"Unclassified" },
    { label:"RANK",        value:isMonarch?"SHADOW MONARCH":(rank?rank.name:"E-Rank"), color:c },
    { label:"LEVEL",       value:"LV "+safeLevel, color:c, big:true },
    { label:"TITLE",       value:activeTitle?activeTitle.name:"—", color:activeTitle?TITLE_RARITY_COLOR[activeTitle.rarity]:null },
    { label:"AURA",        value:auraType.name, color:auraType.color },
    { label:"FAME",        value:safeFame+" pts · "+fameTier.name, color:fameTier.color },
    { label:"GUILD",       value:guild?guild.name:"Unaffiliated", color:guild?guild.color:null },
    { label:"STREAK",      value:safeStreak+" days", color:safeStreak>=7?"#2ee88a":null },
    { label:"SHADOWS",     value:shadowCount+" in army" },
    { label:"GATES",       value:gateCount+" cleared" },
    { label:"BOSSES",      value:bossCount+" defeated" },
    { label:"ACH SCORE",   value:achScore+" pts", color:"#f5b65d" },
  ];

  return (
    <div className="fade-in">
      <div style={{ marginBottom:20 }}>
        <div style={{ fontFamily:"'Orbitron',sans-serif",fontSize:20,fontWeight:700,color:"#eaf2ff" }}>Hunter Profile</div>
        <div style={{ height:1,marginTop:6,background:"linear-gradient(90deg,"+c+",transparent)" }} />
      </div>

      {/* Aura badge */}
      <div className={isMonarch?"monarch-breathe":""} style={{ padding:"14px 20px",marginBottom:20,border:"2px solid "+auraType.color+"66",background:auraType.color+"08",display:"flex",alignItems:"center",gap:16 }}>
        <div style={{ width:56,height:56,border:"2px solid "+auraType.color,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Orbitron',sans-serif",fontWeight:900,fontSize:20,color:auraType.color,boxShadow:"0 0 20px "+auraType.color+"44",flexShrink:0 }}>{isMonarch?"◉":(rank?rank.name[0]:"E")}</div>
        <div>
          <div style={{ fontFamily:"'Orbitron',sans-serif",fontSize:14,fontWeight:700,color:"#eaf2ff",marginBottom:2 }}>{player.name||"Hunter"}</div>
          <div style={{ fontSize:11,color:auraType.color,marginBottom:2 }}>{auraType.name}</div>
          <div style={{ fontSize:10,color:fameTier.color }}>{fameTier.name} · {safeFame} Fame</div>
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ border:"1px solid "+c+"33",background:"linear-gradient(160deg,rgba(8,14,26,0.97),rgba(4,8,16,0.99))",padding:"16px 20px",marginBottom:16 }}>
        {rows.map(function(row){
          return (
            <div key={row.label} style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"7px 0",borderBottom:"1px solid rgba(77,184,255,0.06)" }}>
              <span style={{ fontSize:10,color:"#5b7aa0",letterSpacing:"0.15em" }}>{row.label}</span>
              <span style={{ fontSize:row.big?15:12,fontFamily:row.big?"'Orbitron',sans-serif":"'Rajdhani',sans-serif",fontWeight:row.big?700:400,color:row.color||"#dbe6ff" }}>{row.value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ===========================================================================
   GUILD RECRUITMENT POPUP
   =========================================================================== */
function GuildRecruitmentPopup({ guild, onJoin, onDecline }) {
  if (!guild) return null;
  return (
    <div style={{ position:"fixed",inset:0,zIndex:8800,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(3,5,12,0.92)",backdropFilter:"blur(6px)",padding:"24px 16px" }}>
      <div className="fade-in-up" style={{ maxWidth:460,width:"100%",border:"1px solid "+guild.color+"88",background:"linear-gradient(160deg,rgba(10,16,28,0.99),rgba(5,8,18,0.99))",position:"relative",overflow:"hidden" }}>
        <div style={{ position:"absolute",inset:0,pointerEvents:"none",background:"repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(255,255,255,0.012) 2px,rgba(255,255,255,0.012) 4px)" }} />
        <div style={{ padding:"28px 24px",position:"relative" }}>
          <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:16 }}>
            <div style={{ width:44,height:44,border:"2px solid "+guild.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,color:guild.color,background:guild.color+"11",flexShrink:0,boxShadow:"0 0 16px "+guild.color+"44" }}>{guild.icon}</div>
            <div>
              <div style={{ fontFamily:"'Orbitron',sans-serif",fontSize:14,fontWeight:700,color:guild.color }}>{guild.name}</div>
              <div style={{ fontSize:10,color:"#5b7aa0",fontStyle:"italic" }}>{guild.motto}</div>
            </div>
          </div>
          <div style={{ fontFamily:"'Orbitron',sans-serif",fontSize:9,letterSpacing:"0.3em",color:guild.color,marginBottom:10 }}>GUILD RECRUITMENT</div>
          <p style={{ fontSize:13,color:"#9fb8d8",lineHeight:1.8,marginBottom:20 }}>{guild.recruitMsg}</p>
          <div style={{ padding:"8px 12px",border:"1px solid "+guild.color+"33",background:guild.color+"0a",fontSize:11,color:guild.color,marginBottom:20 }}>
            Joining grants access to guild quests and exclusive rewards.
          </div>
          <div style={{ display:"flex",gap:10 }}>
            <button onClick={function(){if(typeof onJoin==="function")onJoin(guild.id);}} style={{ flex:1,padding:"11px",background:guild.color,color:"#03050c",border:"none",cursor:"pointer",fontFamily:"'Orbitron',sans-serif",fontSize:11,fontWeight:700,letterSpacing:"0.15em" }}>ACCEPT</button>
            <button onClick={onDecline} style={{ flex:1,padding:"11px",background:"transparent",border:"1px solid "+guild.color+"55",color:guild.color+"cc",cursor:"pointer",fontFamily:"'Orbitron',sans-serif",fontSize:11 }}>DECLINE</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===========================================================================
   GUILD VIEW
   =========================================================================== */
function GuildView({ player, fame, guildId, guildQuestProgress, guildQuestDone, onGoalTap, onLeave, accentColor }) {
  const safeFame = (typeof fame==="number"&&isFinite(fame)) ? fame : 0;
  const fameTier = getFameTier(safeFame);
  const joined   = GUILDS.find(function(g){return g.id===guildId;});
  const available= GUILDS.filter(function(g){
    return !guildId && safeFame>=g.fameReq && (player.level||1)>=(g.rankReq*5);
  });

  if (!joined) {
    return (
      <div className="fade-in">
        <div style={{ marginBottom:20 }}>
          <div style={{ fontFamily:"'Orbitron',sans-serif",fontSize:20,fontWeight:700,color:"#eaf2ff" }}>Guild</div>
          <div style={{ height:1,marginTop:6,background:"linear-gradient(90deg,"+accentColor+",transparent)" }} />
          <p style={{ fontSize:12,color:"#5b7aa0",marginTop:6 }}>You are not affiliated with any guild. Increase your fame to receive recruitment offers.</p>
        </div>
        <div style={{ padding:"12px 16px",border:"1px solid "+accentColor+"33",background:accentColor+"08",marginBottom:20,fontSize:12,color:accentColor }}>
          Current Fame: <strong>{safeFame}</strong> · {fameTier.name}
        </div>
        {available.length===0 ? (
          <div style={{ padding:"40px",textAlign:"center",border:"1px solid #1a2438",color:"#2a3a55",fontSize:12,fontStyle:"italic" }}>
            No guilds recruiting at your current fame level. Keep training. They are watching.
          </div>
        ) : (
          <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
            <div style={{ fontSize:11,color:"#5b7aa0",marginBottom:4 }}>Guilds available to join:</div>
            {available.map(function(g){
              return (
                <div key={g.id} style={{ padding:"16px",border:"1px solid "+g.color+"44",background:g.color+"08",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12 }}>
                  <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                    <span style={{ fontSize:20,color:g.color }}>{g.icon}</span>
                    <div>
                      <div style={{ fontFamily:"'Orbitron',sans-serif",fontSize:12,fontWeight:700,color:g.color }}>{g.name}</div>
                      <div style={{ fontSize:10,color:"#5b7aa0",fontStyle:"italic" }}>{g.motto}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  /* Joined state */
  const quest = joined.quest;
  const allDone = quest.goals.every(function(g){return (guildQuestProgress[g.id]||0)>=g.target;});
  return (
    <div className="fade-in">
      <div style={{ marginBottom:20 }}>
        <div style={{ fontFamily:"'Orbitron',sans-serif",fontSize:20,fontWeight:700,color:"#eaf2ff" }}>Guild</div>
        <div style={{ height:1,marginTop:6,background:"linear-gradient(90deg,"+joined.color+",transparent)" }} />
      </div>

      {/* Guild card */}
      <div className={joined.id==="shadow_legion"?"monarch-breathe":""} style={{ padding:"16px 20px",marginBottom:20,border:"2px solid "+joined.color+"66",background:joined.color+"08",display:"flex",alignItems:"center",gap:14 }}>
        <div style={{ width:48,height:48,border:"2px solid "+joined.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,color:joined.color,boxShadow:"0 0 14px "+joined.color+"44",flexShrink:0 }}>{joined.icon}</div>
        <div>
          <div style={{ fontFamily:"'Orbitron',sans-serif",fontSize:14,fontWeight:700,color:joined.color }}>{joined.name}</div>
          <div style={{ fontSize:10,color:"#5b7aa0",fontStyle:"italic",marginTop:2 }}>{joined.motto}</div>
        </div>
      </div>

      {/* Guild quest */}
      <div style={{ marginBottom:16 }}>
        <div style={{ fontFamily:"'Orbitron',sans-serif",fontSize:10,letterSpacing:"0.3em",color:joined.color,marginBottom:10 }}>GUILD QUEST</div>
        <div style={{ border:"1px solid "+joined.color+"44",background:"linear-gradient(160deg,rgba(8,14,26,0.97),rgba(4,8,16,0.99))",padding:"16px 18px" }}>
          <div style={{ fontSize:12,fontWeight:600,color:"#dbe6ff",marginBottom:10 }}>{joined.questLabel}</div>
          {quest.goals.map(function(g){
            const cur=guildQuestProgress[g.id]||0; const done=cur>=g.target; const canTap=!done&&!guildQuestDone;
            return (
              <div key={g.id} onClick={function(){if(canTap&&typeof onGoalTap==="function")onGoalTap(g.id);}} style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid rgba(77,184,255,0.07)",cursor:canTap?"pointer":"default" }}>
                <span style={{ fontSize:13,color:done?"#5a7a5a":"#dbe6ff" }}>{g.name}</span>
                <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                  <span style={{ fontSize:11,color:done?"#2ee88a":"#9fb8d8" }}>{cur}/{g.target}{g.unit}</span>
                  <div style={{ width:16,height:16,border:"1.5px solid "+(done?"#2ee88a":joined.color+"66"),background:done?"#2ee88a22":"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"#2ee88a" }}>{done?"✓":""}</div>
                </div>
              </div>
            );
          })}
          <div style={{ marginTop:10,display:"flex",justifyContent:"space-between",fontSize:11 }}>
            <span style={{ color:joined.color }}>+{quest.xp} XP · +{quest.coins} coins · +{quest.fameGain} fame</span>
            {guildQuestDone&&<span style={{ color:"#2ee88a",fontWeight:700 }}>CLEARED ✓</span>}
          </div>
        </div>
      </div>

      <button onClick={onLeave} style={{ width:"100%",padding:"10px",background:"transparent",border:"1px solid #f53d3d33",color:"#f53d3d66",cursor:"pointer",fontFamily:"'Orbitron',sans-serif",fontSize:10,letterSpacing:"0.15em" }}>
        LEAVE GUILD
      </button>
    </div>
  );
}

function SpecializationView({ player, unlockedSpecs, onUnlock, accentColor }) {
  const available = getUnlockedSpecNodes(player.stats || {}, unlockedSpecs);

  return (
    <div className="fade-in">
      <div style={{ marginBottom:20 }}>
        <div style={{ fontFamily:"'Orbitron',sans-serif",fontSize:20,fontWeight:700,color:"#eaf2ff" }}>Specialization</div>
        <div style={{ height:1,marginTop:6,background:"linear-gradient(90deg,"+accentColor+",transparent)" }} />
        <p style={{ fontSize:12,color:"#5b7aa0",marginTop:6 }}>Unlock perks by reaching stat thresholds through training. Unlocking applies stat bonuses permanently.</p>
      </div>

      {/* Unlocked count */}
      {unlockedSpecs.length > 0 && (
        <div style={{ padding:"8px 14px",border:"1px solid "+accentColor+"33",background:accentColor+"08",marginBottom:20,fontSize:12,color:accentColor }}>
          {unlockedSpecs.length} specialization{unlockedSpecs.length!==1?"s":""} active
        </div>
      )}

      {SPEC_PATHS.map(function(path) {
        const pathColor = SPEC_PATH_COLORS[path] || accentColor;
        const pathNodes = SPEC_TREE.filter(function(n){ return n.path===path; }).sort(function(a,b){return a.tier-b.tier;});
        return (
          <div key={path} style={{ marginBottom:24 }}>
            <div style={{ fontFamily:"'Orbitron',sans-serif",fontSize:11,letterSpacing:"0.3em",color:pathColor,marginBottom:10,paddingBottom:4,borderBottom:"1px solid "+pathColor+"44" }}>
              {path.toUpperCase()} PATH
            </div>
            <div style={{ display:"flex",gap:0,position:"relative" }}>
              {/* Connector line */}
              <div style={{ position:"absolute",top:"50%",left:0,right:0,height:1,background:pathColor+"22",zIndex:0 }} />
              {pathNodes.map(function(node,i) {
                const isUnlocked = unlockedSpecs.includes(node.id);
                const isAvailable = available.some(function(n){ return n.id===node.id; });
                const statVal = (player.stats||{})[node.req.stat]||0;
                const meetsReq = statVal >= node.req.val;
                const nc = isUnlocked ? pathColor : isAvailable ? pathColor+"88" : "#2a3a55";
                return (
                  <div key={node.id} style={{ flex:1,position:"relative",zIndex:1,padding:"0 4px" }}>
                    <div style={{ background:"linear-gradient(160deg,rgba(8,14,26,0.99),rgba(4,8,16,0.99))",border:"1px solid "+nc,padding:"12px 10px",textAlign:"center" }}>
                      <div style={{ fontSize:18,marginBottom:4 }}>{node.icon}</div>
                      <div style={{ fontFamily:"'Orbitron',sans-serif",fontSize:9,fontWeight:700,color:nc,marginBottom:4,letterSpacing:"0.1em" }}>{node.name}</div>
                      <div style={{ fontSize:9,color:"#5b7aa0",marginBottom:6,lineHeight:1.4 }}>
                        {node.req.stat} ≥ {node.req.val}
                        <br/>
                        <span style={{ color: meetsReq?"#2ee88a":"#f53d3d" }}>(you: {statVal})</span>
                      </div>
                      {isUnlocked ? (
                        <div style={{ fontSize:9,color:"#2ee88a",fontWeight:700 }}>✓ ACTIVE</div>
                      ) : isAvailable ? (
                        <button onClick={function(){ if(typeof onUnlock==="function") onUnlock(node); }} style={{ padding:"4px 8px",background:pathColor,color:"#03050c",border:"none",cursor:"pointer",fontFamily:"'Orbitron',sans-serif",fontSize:8,fontWeight:700,width:"100%" }}>UNLOCK</button>
                      ) : (
                        <div style={{ fontSize:9,color:"#2a3a55" }}>LOCKED</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SecretBossesView({ player, clearedGates, streak, secretBosses, onAttack, accentColor, questGoalsCleared }) {
  const unlocked = getUnlockedSecretBosses(player, clearedGates, streak);

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:20, fontWeight:700, color:"#eaf2ff" }}>
          Secret Encounters
        </div>
        <div style={{ height:1, marginTop:6, background:"linear-gradient(90deg,"+MONARCH_PURP+",transparent)" }} />
        <p style={{ fontSize:12, color:"#5b7aa0", marginTop:6 }}>
          Hidden bosses with unknown unlock conditions. Some hunters never see this screen.
        </p>
      </div>

      {unlocked.length === 0 ? (
        <div style={{ border:"1px solid #1a2438", background:"linear-gradient(160deg,rgba(10,18,34,0.97),rgba(5,10,20,0.99))", padding:"48px 24px", textAlign:"center" }}>
          <div style={{ fontSize:40, marginBottom:16, opacity:0.15 }}>?</div>
          <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:11, letterSpacing:"0.3em", color:"#2a3a55", marginBottom:8 }}>
            NO ENCOUNTERS DETECTED
          </div>
          <p style={{ fontSize:12, color:"#2a3a55", lineHeight:1.7 }}>
            The System has not detected any hidden entities in your current range.
            Continue training. Continue clearing. Something will respond.
          </p>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          {unlocked.map(function(boss) {
            const bossState = secretBosses[boss.id] || { currentHp: boss.hp, maxHp: boss.hp };
            const defeated = bossState.currentHp <= 0;
            const hpPct = clamp((bossState.currentHp / bossState.maxHp) * 100, 0, 100);
            return (
              <div key={boss.id} style={{
                border: "1px solid " + boss.color + (defeated ? "33" : "88"),
                background: "linear-gradient(160deg,rgba(10,18,34,0.97),rgba(5,10,20,0.99))",
                padding: "24px",
                position: "relative",
                overflow: "hidden",
                opacity: defeated ? 0.65 : 1,
              }}>
                <div style={{ display:"flex", alignItems:"flex-start", gap:16, flexWrap:"wrap" }}>
                  <div style={{ width:52, height:52, border:"2px solid "+(defeated?"#2ee88a":boss.color), display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, background:boss.color+"11", flexShrink:0, boxShadow:"0 0 16px "+boss.color+"44" }}>
                    {defeated ? "☠" : boss.icon}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
                      <div style={{ fontFamily:"'Orbitron',sans-serif", fontSize:15, fontWeight:700, color:defeated?"#2ee88a":"#eaf2ff" }}>{boss.name}</div>
                      <span style={{ fontSize:9, padding:"2px 8px", border:"1px solid "+GLITCH_RED+"55", color:GLITCH_RED, fontFamily:"'Orbitron',sans-serif", letterSpacing:"0.15em" }}>SECRET</span>
                    </div>
                    <div style={{ fontSize:11, color:"#5b7aa0", marginBottom:10 }}>{boss.title}</div>

                    {/* HP bar */}
                    <div style={{ marginBottom:12 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:"#5b7aa0", marginBottom:4 }}>
                        <span>HP</span>
                        <span style={{ color:defeated?"#2ee88a":boss.color }}>{bossState.currentHp}/{bossState.maxHp}</span>
                      </div>
                      <div style={{ height:6, background:"rgba(255,255,255,0.06)", overflow:"hidden" }}>
                        <div style={{ height:"100%", width:hpPct+"%", background:defeated?"#2ee88a":"linear-gradient(90deg,"+boss.color+",#fff8)", transition:"width 0.5s ease" }} />
                      </div>
                    </div>

                    {/* Dialogue */}
                    {!defeated && (
                      <div style={{ padding:"8px 12px", border:"1px solid "+boss.color+"33", background:boss.color+"08", fontSize:12, color:"#c8d8f0", fontStyle:"italic", marginBottom:12 }}>
                        {boss.dialogue.intro[0]}
                      </div>
                    )}

                    <div style={{ fontSize:11, color:"#5b7aa0", marginBottom:12 }}>
                      Survival probability: <span style={{ color:boss.survivalChance<20?GLITCH_RED:boss.survivalChance<50?"#f5b65d":"#2ee88a", fontWeight:700 }}>{boss.survivalChance}%</span>
                    </div>

                    <button
                      disabled={defeated || questGoalsCleared < 1}
                      onClick={function(){ if(typeof onAttack==="function") onAttack(boss.id); }}
                      style={{ padding:"10px 24px", background:defeated?"transparent":questGoalsCleared<1?"#0a1020":boss.color, color:defeated?"#2ee88a":questGoalsCleared<1?"#2a3a55":"#03050c", border:defeated?"1px solid #2ee88a44":questGoalsCleared<1?"1px solid #2a3a55":"none", cursor:(defeated||questGoalsCleared<1)?"not-allowed":"pointer", fontFamily:"'Orbitron',sans-serif", fontSize:11, fontWeight:700, letterSpacing:"0.15em" }}
                    >
                      {defeated ? "☠ DEFEATED" : questGoalsCleared < 1 ? "COMPLETE QUESTS FIRST" : "CHALLENGE"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function HunterShopView({ coins, inventory, onBuy, accentColor, isMonarch }) {
  const [activeCategory, setActiveCategory] = useState("all");
  const categories = ["all","weapon","armor","relic","key","recovery","blackmarket"];

  const visibleItems = SHOP_ITEMS.filter(function(item) {
    if (activeCategory === "all") return !item.rotating;
    if (activeCategory === "blackmarket") return item.category === "blackmarket";
    return item.category === activeCategory && !item.rotating;
  });

  /* Black market: show 2 random rotating items */
  const blackMarketItems = activeCategory === "blackmarket"
    ? SHOP_ITEMS.filter(function(i){return i.rotating;})
    : [];

  const displayItems = activeCategory === "blackmarket" ? blackMarketItems : visibleItems;

  return (
    <div className="fade-in">
      <div style={{ marginBottom:20 }}>
        <div style={{ fontFamily:"'Orbitron',sans-serif",fontSize:20,fontWeight:700,color:"#eaf2ff" }}>Hunter Shop</div>
        <div style={{ height:1,marginTop:6,background:"linear-gradient(90deg,"+accentColor+",transparent)" }} />
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:8 }}>
          <p style={{ fontSize:12,color:"#5b7aa0" }}>Earn coins by clearing quests and bosses.</p>
          <div style={{ display:"flex",alignItems:"center",gap:6,padding:"4px 12px",border:"1px solid "+accentColor+"44" }}>
            <span style={{ fontSize:16 }}>🪙</span>
            <span style={{ fontFamily:"'Orbitron',sans-serif",fontSize:16,fontWeight:700,color:"#f5b65d" }}>{coins}</span>
          </div>
        </div>
      </div>

      {/* Category tabs */}
      <div style={{ display:"flex",gap:6,marginBottom:20,overflowX:"auto",paddingBottom:4 }}>
        {categories.map(function(cat) {
          const active = cat === activeCategory;
          const isBM = cat === "blackmarket";
          return (
            <button key={cat} onClick={function(){setActiveCategory(cat);}}
              style={{ padding:"6px 14px",background:active?(isBM?MONARCH_PURP:accentColor)+(active?"":"14"):"transparent",border:"1px solid "+(isBM?MONARCH_PURP+"44":accentColor+"44"),color:active?"#03050c":isBM?MONARCH_PURP:"#9fb8d8",cursor:"pointer",fontFamily:"'Orbitron',sans-serif",fontSize:10,letterSpacing:"0.15em",whiteSpace:"nowrap",fontWeight:active?700:400 }}>
              {isBM?"★ BLACK MARKET":cat.toUpperCase()}
            </button>
          );
        })}
      </div>

      {/* Black market warning */}
      {activeCategory === "blackmarket" && (
        <div style={{ padding:"10px 14px",border:"1px solid "+MONARCH_PURP+"66",background:"rgba(155,48,255,0.06)",marginBottom:16,fontSize:12,color:MONARCH_PURP+"cc",lineHeight:1.6 }}>
          ⚠ Corrupted market. Items here are unstable and potentially dangerous. The system does not endorse these transactions.
        </div>
      )}

      {/* Items grid */}
      <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:12 }}>
        {displayItems.map(function(item) {
          const owned = inventory.includes(item.id);
          const canAfford = coins >= item.cost;
          const ic = item.category === "blackmarket" ? MONARCH_PURP : item.color;
          return (
            <div key={item.id} style={{ border:"1px solid "+ic+"55",background:"linear-gradient(160deg,rgba(10,18,34,0.97),rgba(5,10,20,0.99))",padding:"16px",opacity:owned?0.6:1 }}>
              <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:10 }}>
                <div style={{ width:36,height:36,border:"1.5px solid "+ic,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,background:ic+"11",flexShrink:0 }}>{item.icon}</div>
                <div>
                  <div style={{ fontFamily:"'Orbitron',sans-serif",fontSize:12,fontWeight:700,color:"#eaf2ff" }}>{item.name}</div>
                  <div style={{ fontSize:10,color:ic }}>{item.effect}</div>
                </div>
              </div>
              <p style={{ fontSize:11,color:"#5b7aa0",marginBottom:12,lineHeight:1.5 }}>{item.desc}</p>
              <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between" }}>
                <div style={{ display:"flex",alignItems:"center",gap:4 }}>
                  <span style={{ fontSize:14 }}>🪙</span>
                  <span style={{ fontFamily:"'Orbitron',sans-serif",fontSize:14,fontWeight:700,color:canAfford?"#f5b65d":"#f53d3d" }}>{item.cost}</span>
                </div>
                <button disabled={owned||!canAfford} onClick={function(){if(typeof onBuy==="function")onBuy(item);}}
                  style={{ padding:"7px 16px",background:owned?"transparent":canAfford?ic:"#0a1020",color:owned?"#2ee88a":canAfford?"#03050c":"#2a3a55",border:owned?"1px solid #2ee88a44":"none",cursor:(owned||!canAfford)?"not-allowed":"pointer",fontFamily:"'Orbitron',sans-serif",fontSize:10,fontWeight:700,letterSpacing:"0.1em" }}>
                  {owned?"OWNED":canAfford?"BUY":"LOCKED"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ===========================================================================
   SHADOW ARMY VIEW — Phase 4
   Full Solo Leveling-inspired army display with ranks, evolution, naming
   =========================================================================== */
/* ===========================================================================
   SQUADS PANEL — shown inside Shadow Army view
   =========================================================================== */
function SquadsPanel({ squads, shadowArmy, onAddToSquad, onFavorite, accentColor }) {
  const [activeSquad, setActiveSquad] = useState(null);
  const all = shadowArmy || [];

  return (
    <div style={{ marginTop:24 }}>
      <div style={{ fontFamily:"'Orbitron',sans-serif",fontSize:11,letterSpacing:"0.3em",color:accentColor,marginBottom:10 }}>
        SHADOW SQUADS
      </div>

      {/* Squad tabs */}
      <div style={{ display:"flex",gap:6,marginBottom:12,flexWrap:"wrap" }}>
        {squads.map(function(sq){
          const active = activeSquad===sq.id;
          return (
            <button key={sq.id} onClick={function(){setActiveSquad(active?null:sq.id);}}
              style={{ padding:"5px 12px",background:active?accentColor:"transparent",border:"1px solid "+accentColor+(active?"":"44"),color:active?"#03050c":"#9fb8d8",cursor:"pointer",fontFamily:"'Orbitron',sans-serif",fontSize:9,letterSpacing:"0.15em" }}>
              {sq.icon} {sq.name} <span style={{ opacity:0.6 }}>({sq.shadowIds.length})</span>
            </button>
          );
        })}
      </div>

      {/* Active squad content */}
      {activeSquad && (function(){
        const sq = squads.find(function(s){return s.id===activeSquad;});
        if (!sq) return null;
        return (
          <div style={{ border:"1px solid "+accentColor+"33",padding:"12px 14px",marginBottom:12 }}>
            <div style={{ fontSize:11,color:"#5b7aa0",marginBottom:8 }}>Assign shadows to {sq.name}:</div>
            {all.length===0 ? (
              <div style={{ fontSize:11,color:"#2a3a55",fontStyle:"italic" }}>No shadows available.</div>
            ) : (
              <div style={{ display:"flex",flexDirection:"column",gap:4 }}>
                {all.map(function(s){
                  const inSquad = sq.shadowIds.includes(s.id);
                  const rc = RARITY_COLOR[s.rarity]||accentColor;
                  return (
                    <div key={s.id} style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid rgba(77,184,255,0.07)" }}>
                      <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                        <span style={{ fontSize:14,color:rc }}>{s.icon||"◉"}</span>
                        <span style={{ fontSize:12,color:"#dbe6ff" }}>{s.name||s.displayName}</span>
                        {s.favorite&&<span style={{ fontSize:9,color:"#f5b65d" }}>★</span>}
                      </div>
                      <div style={{ display:"flex",gap:6 }}>
                        <button onClick={function(){if(typeof onFavorite==="function")onFavorite(s.id);}}
                          style={{ padding:"3px 8px",background:"transparent",border:"1px solid #f5b65d44",color:s.favorite?"#f5b65d":"#5b7aa0",cursor:"pointer",fontSize:10 }}>★</button>
                        <button onClick={function(){if(typeof onAddToSquad==="function")onAddToSquad(s.id,sq.id);}}
                          style={{ padding:"3px 10px",background:inSquad?rc:rc+"1a",color:inSquad?"#03050c":rc,border:"1px solid "+rc+"44",cursor:"pointer",fontFamily:"'Orbitron',sans-serif",fontSize:8,fontWeight:700 }}>
                          {inSquad?"REMOVE":"ADD"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}

/* ===========================================================================
   SHADOW MISSIONS PANEL — shown inside Shadow Army view
   =========================================================================== */
function ShadowMissionsPanel({ shadowArmy, activeMissions, onDispatch, onComplete, accentColor }) {
  const [now, setNow] = useState(Date.now());
  const [selectedShadow, setSelectedShadow] = useState(null);

  /* Tick every 10s to update countdowns — low frequency, no leak */
  useEffect(function() {
    const id = setInterval(function(){ setNow(Date.now()); }, 10000);
    return function(){ clearInterval(id); };
  }, []);

  const allShadows = shadowArmy || [];
  const readyShadows = allShadows.filter(function(s){ return !activeMissions.some(function(m){ return m.shadowId===s.id; }); });

  function fmtTime(ms) {
    const safe = Math.max(0, ms);
    const h = Math.floor(safe/3600000); const m = Math.floor((safe%3600000)/60000);
    return h > 0 ? h+"h "+m+"m" : m+"m";
  }

  return (
    <div style={{ marginTop:24 }}>
      <div style={{ fontFamily:"'Orbitron',sans-serif",fontSize:11,letterSpacing:"0.3em",color:accentColor,marginBottom:12 }}>SHADOW MISSIONS</div>

      {/* Active missions */}
      {activeMissions.length > 0 && (
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:10,color:"#5b7aa0",marginBottom:8 }}>IN PROGRESS</div>
          {activeMissions.map(function(am,i) {
            const mission = SHADOW_MISSIONS.find(function(m){ return m.id===am.missionId; });
            const shadow  = allShadows.find(function(s){ return s.id===am.shadowId; });
            const remaining = am.endsAt - now;
            const isDone = remaining <= 0;
            return (
              <div key={i} style={{ padding:"10px 14px",border:"1px solid "+(isDone?"#2ee88a44":accentColor+"33"),background:isDone?"rgba(46,232,138,0.05)":"rgba(5,10,20,0.8)",marginBottom:6,display:"flex",alignItems:"center",justifyContent:"space-between",gap:12 }}>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ fontSize:12,fontWeight:600,color:"#dbe6ff" }}>{mission?mission.name:"Unknown Mission"}</div>
                  <div style={{ fontSize:10,color:"#5b7aa0" }}>{shadow?shadow.name||shadow.displayName:"Unknown Shadow"}</div>
                </div>
                {isDone ? (
                  <button onClick={function(){ if(typeof onComplete==="function") onComplete(am); }} style={{ padding:"6px 14px",background:"#2ee88a",color:"#03050c",border:"none",cursor:"pointer",fontFamily:"'Orbitron',sans-serif",fontSize:9,fontWeight:700,whiteSpace:"nowrap" }}>COLLECT</button>
                ) : (
                  <span style={{ fontSize:11,color:accentColor,whiteSpace:"nowrap" }}>{fmtTime(remaining)}</span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Dispatch new mission */}
      {allShadows.length === 0 ? (
        <div style={{ fontSize:11,color:"#2a3a55",fontStyle:"italic" }}>Extract shadows from bosses to unlock missions.</div>
      ) : (
        <div>
          <div style={{ fontSize:10,color:"#5b7aa0",marginBottom:8 }}>DISPATCH NEW MISSION</div>
          {/* Shadow selector */}
          <div style={{ display:"flex",gap:6,flexWrap:"wrap",marginBottom:10 }}>
            {readyShadows.slice(0,6).map(function(s) {
              const sel = selectedShadow===s.id;
              const rc  = RARITY_COLOR[s.rarity]||accentColor;
              return (<button key={s.id} onClick={function(){ setSelectedShadow(sel?null:s.id); }} style={{ padding:"4px 10px",border:"1px solid "+(sel?rc:rc+"44"),background:sel?rc+"1a":"transparent",color:sel?"#eaf2ff":"#9fb8d8",cursor:"pointer",fontSize:10 }}>{s.name||s.displayName}</button>);
            })}
          </div>
          {/* Mission list */}
          {selectedShadow && (
            <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
              {SHADOW_MISSIONS.map(function(mission) {
                const shadow = allShadows.find(function(s){ return s.id===selectedShadow; });
                const chance = Math.round(calcMissionSuccess(shadow||{},mission)*100);
                const missionRankNeeded = RARITY_RANK[mission.minRarity]||0;
                const shadowRank = RARITY_RANK[shadow?shadow.rarity:"COMMON"]||0;
                const canDo = shadowRank >= missionRankNeeded;
                return (
                  <div key={mission.id} style={{ padding:"10px 14px",border:"1px solid "+accentColor+(canDo?"33":"22"),background:"rgba(5,10,20,0.8)",opacity:canDo?1:0.4 }}>
                    <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4 }}>
                      <span style={{ fontSize:12,fontWeight:600,color:canDo?"#dbe6ff":"#5b7aa0" }}>{mission.icon} {mission.name}</span>
                      <span style={{ fontSize:10,color:chance>=70?"#2ee88a":chance>=50?"#f5b65d":"#f53d3d" }}>{chance}% success</span>
                    </div>
                    <div style={{ fontSize:10,color:"#5b7aa0",marginBottom:6 }}>{mission.desc} · {Math.round(mission.dur/60000)}m</div>
                    <button disabled={!canDo} onClick={function(){ if(typeof onDispatch==="function"){ onDispatch(selectedShadow,mission.id); setSelectedShadow(null); }}} style={{ padding:"5px 12px",background:canDo?accentColor:"#1a2438",color:canDo?"#03050c":"#5b7aa0",border:"none",cursor:canDo?"pointer":"not-allowed",fontFamily:"'Orbitron',sans-serif",fontSize:9,fontWeight:700 }}>DISPATCH</button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ShadowArmyView({ shadowArmy, bosses, bossData, accentColor, onRename, onFavorite, activeMissions, onDispatchMission, onCompleteMission, squads, onAddToSquad }) {
  const [renaming, setRenaming] = useState(null);
  const [renameVal, setRenameVal] = useState("");
  const [filter, setFilter] = useState("all");

  /* Combine boss-extracted shadows with any earned shadows */
  const extractedFromBosses = bosses
    .map(function(b,i) { return b.currentHp<=0&&!b.shadowLost?bossData[i]:null; })
    .filter(Boolean)
    .map(function(data) {
      const tmpl = SHADOW_TEMPLATES.find(function(t){return t.id==="sh_"+data.id;}) || {
        id: "sh_"+data.id, rank: "Elite Knight", rarity: "RARE",
        specialty: data.shadow&&data.shadow.title||"Unknown",
        aura: "dark mist", lore: data.shadow&&data.shadow.lore||"",
        passive: data.shadow&&data.shadow.passiveBoost||"",
        statBoost: {}, evolutionTo: null,
        icon: data.icon, color: data.color,
      };
      return Object.assign({}, tmpl, {
        displayName: data.shadow ? data.shadow.name : data.name,
        sourceId: data.id,
        fromBoss: true,
        favorite: false,
      });
    });

  const allShadows = extractedFromBosses.concat(shadowArmy);
  const filtered = filter==="all"?allShadows:allShadows.filter(function(s){return s.rank===filter;});
  const rankCounts = {};
  allShadows.forEach(function(s){rankCounts[s.rank]=(rankCounts[s.rank]||0)+1;});

  function startRename(shadow) { setRenaming(shadow.id); setRenameVal(shadow.displayName||shadow.name); }
  function submitRename(shadow) {
    if (typeof onRename==="function") onRename(shadow.id, renameVal.trim()||shadow.name);
    setRenaming(null);
  }

  return (
    <div className="fade-in">
      <div style={{ marginBottom:20 }}>
        <div style={{ fontFamily:"'Orbitron',sans-serif",fontSize:20,fontWeight:700,color:"#eaf2ff" }}>Shadow Army</div>
        <div style={{ height:1,marginTop:6,background:"linear-gradient(90deg,"+MONARCH_PURP+",transparent)" }} />
        <p style={{ fontSize:12,color:"#5b7aa0",marginTop:6 }}>{allShadows.length} shadow{allShadows.length!==1?"s":""} serve under your command.</p>
      </div>

      {/* Army power summary */}
      <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:20 }}>
        {SHADOW_RANKS.map(function(r) {
          return (
            <div key={r} style={{ padding:"10px 12px",border:"1px solid "+(rankCounts[r]?MONARCH_PURP+"44":"#1a2438"),background:rankCounts[r]?"rgba(155,48,255,0.06)":"transparent",opacity:rankCounts[r]?1:0.4 }}>
              <div style={{ fontSize:9,letterSpacing:"0.2em",color:"#5b7aa0",marginBottom:2 }}>{r.toUpperCase()}</div>
              <div style={{ fontFamily:"'Orbitron',sans-serif",fontSize:18,fontWeight:900,color:rankCounts[r]?MONARCH_PURP:"#2a3a55" }}>{rankCounts[r]||0}</div>
            </div>
          );
        })}
      </div>

      {/* Filter tabs */}
      <div style={{ display:"flex",gap:6,marginBottom:20,flexWrap:"wrap" }}>
        {["all"].concat(SHADOW_RANKS).map(function(r) {
          const active = filter===r;
          return (<button key={r} onClick={function(){setFilter(r);}} style={{ padding:"5px 12px",background:active?MONARCH_PURP:"transparent",border:"1px solid "+MONARCH_PURP+(active?"":"44"),color:active?"#03050c":MONARCH_PURP,cursor:"pointer",fontFamily:"'Orbitron',sans-serif",fontSize:9,letterSpacing:"0.15em",whiteSpace:"nowrap" }}>{r==="all"?"ALL":r.toUpperCase()}</button>);
        })}
      </div>

      {allShadows.length === 0 ? (
        <div style={{ border:"1px solid #1a2438",background:"rgba(10,18,34,0.97)",padding:"48px 24px",textAlign:"center" }}>
          <div style={{ fontSize:40,marginBottom:12,opacity:0.2 }}>◉</div>
          <p style={{ color:"#5b7aa0",fontSize:13 }}>No shadows serve you yet. Defeat bosses and complete ARISE challenges to extract your army.</p>
        </div>
      ) : (
        <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:14 }}>
          {filtered.map(function(shadow,i) {
            const rc = RARITY_COLOR[shadow.rarity] || accentColor;
            const isRenaming = renaming === shadow.id;
            return (
              <div key={shadow.id+i} className="shadow-appear" style={{ animationDelay:(i*80)+"ms",border:"1px solid "+MONARCH_PURP+"55",background:"linear-gradient(160deg,rgba(12,5,24,0.98),rgba(6,0,14,0.99))",padding:"18px" }}>
                {/* Shadow icon + name */}
                <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:12 }}>
                  <div className="shadow-float" style={{ width:44,height:44,border:"2px solid "+rc,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,background:rc+"14",flexShrink:0,boxShadow:"0 0 12px "+rc+"44" }}>{shadow.icon||"◉"}</div>
                  <div style={{ flex:1,minWidth:0 }}>
                    {isRenaming ? (
                      <div style={{ display:"flex",gap:6 }}>
                        <input autoFocus value={renameVal} onChange={function(e){setRenameVal(e.target.value);}} onKeyDown={function(e){if(e.key==="Enter")submitRename(shadow);}} style={{ flex:1,background:"transparent",border:"none",borderBottom:"1px solid "+MONARCH_PURP,color:"#eaf2ff",fontSize:14,fontFamily:"'Orbitron',sans-serif",outline:"none",minWidth:0 }} />
                        <button onClick={function(){submitRename(shadow);}} style={{ background:MONARCH_PURP,border:"none",color:"#03050c",cursor:"pointer",padding:"2px 8px",fontSize:10,fontWeight:700 }}>✓</button>
                      </div>
                    ) : (
                      <div style={{ fontFamily:"'Orbitron',sans-serif",fontSize:13,fontWeight:700,color:MONARCH_PURP,cursor:"pointer" }} onClick={function(){startRename(shadow);}}>
                        {shadow.displayName||shadow.name} <span style={{ fontSize:9,color:MONARCH_DIM }}>✎</span>
                      </div>
                    )}
                    <div style={{ fontSize:9,color:rc,letterSpacing:"0.15em",marginTop:2 }}>{shadow.rarity} · {shadow.rank}</div>
                  </div>
                </div>
                <div style={{ fontSize:10,color:"#8a5ab0",marginBottom:6 }}>Specialty: <span style={{ color:MONARCH_PURP }}>{shadow.specialty}</span></div>
                <div style={{ fontSize:11,color:"#5b7aa0",marginBottom:8,lineHeight:1.6,fontStyle:"italic" }}>"{shadow.lore}"</div>
                <div style={{ padding:"6px 10px",border:"1px solid "+MONARCH_PURP+"33",background:"rgba(155,48,255,0.06)",fontSize:11,color:MONARCH_PURP,marginBottom:10 }}>Passive: {shadow.passive}</div>
                {/* Phase 3: Loyalty bar — only shown for shadows with loyalty field */}
                {typeof shadow.loyalty === "number" && (function(){
                  const loyaltyData = getShadowLoyalty(shadow.loyalty);
                  return (
                    <div style={{ marginBottom:10 }}>
                      <div style={{ display:"flex",justifyContent:"space-between",fontSize:10,marginBottom:4 }}>
                        <span style={{ color:"#5b7aa0",letterSpacing:"0.1em" }}>LOYALTY</span>
                        <span style={{ color:loyaltyData.color,fontWeight:700 }}>{loyaltyData.label}</span>
                      </div>
                      <div style={{ height:4,background:"rgba(255,255,255,0.06)",overflow:"hidden" }}>
                        <div style={{ height:"100%",width:loyaltyData.score+"%",background:"linear-gradient(90deg,"+loyaltyData.color+",#ffffff66)",transition:"width 0.6s ease" }} />
                      </div>
                    </div>
                  );
                })()}
                {/* Phase 3: Evolution level */}
                {typeof shadow.evolutionLevel === "number" && (
                  <div style={{ marginBottom:10,fontSize:10,color:"#5b7aa0" }}>
                    Evolution: <span style={{ color:MONARCH_PURP }}>Level {shadow.evolutionLevel}</span>
                    {shadow.evolutionTo && <span style={{ color:"#5b7aa0" }}> → {shadow.evolutionTo.replace("sh_","")}</span>}
                  </div>
                )}
                {/* Stat bonuses */}
                {shadow.statBoost && Object.keys(shadow.statBoost).length > 0 && (
                  <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
                    {Object.entries(shadow.statBoost).map(function(entry) {
                      return (<span key={entry[0]} style={{ fontSize:10,padding:"2px 8px",border:"1px solid "+rc+"44",color:rc }}>+{entry[1]} {entry[0]}</span>);
                    })}
                  </div>
                )}
                {/* Evolution path */}
                {shadow.evolutionTo && (
                  <div style={{ marginTop:10,fontSize:10,color:"#5b7aa0" }}>Evolves → <span style={{ color:MONARCH_PURP }}>{shadow.evolutionTo.replace("sh_","").charAt(0).toUpperCase()+shadow.evolutionTo.replace("sh_","").slice(1)}</span></div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {/* Shadow missions panel */}
      <ShadowMissionsPanel shadowArmy={allShadows} activeMissions={activeMissions||[]} onDispatch={onDispatchMission} onComplete={onCompleteMission} accentColor={accentColor} />
      {/* Squad organization panel */}
      <SquadsPanel squads={squads||[]} shadowArmy={allShadows} onAddToSquad={onAddToSquad} onFavorite={onFavorite} accentColor={accentColor} />
    </div>
  );
}

/* Set bonus display */
function SetBonusPanel({ inventory, accentColor }) {
  const active = getActiveSetBonuses(inventory || []);
  if (active.length === 0) return (
    <div style={{ marginBottom:20 }}>
      <div style={{ fontFamily:"'Orbitron',sans-serif",fontSize:11,letterSpacing:"0.3em",color:"#2a3a55",marginBottom:8 }}>RELIC SETS</div>
      <div style={{ padding:"12px 14px",border:"1px solid #1a2438",fontSize:11,color:"#2a3a55",fontStyle:"italic" }}>
        No set bonuses active. Equip matching relic pieces to unlock bonuses.
      </div>
    </div>
  );
  return (
    <div style={{ marginBottom:20 }}>
      <div style={{ fontFamily:"'Orbitron',sans-serif",fontSize:11,letterSpacing:"0.3em",color:accentColor,marginBottom:10 }}>ACTIVE SET BONUSES</div>
      <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
        {active.map(function(a,i) {
          return (
            <div key={i} style={{ padding:"10px 14px",border:"1px solid "+a.color+"44",background:a.color+"0a",display:"flex",alignItems:"flex-start",gap:10 }}>
              <div style={{ width:8,height:8,borderRadius:"50%",background:a.color,flexShrink:0,marginTop:4 }} />
              <div>
                <div style={{ fontFamily:"'Orbitron',sans-serif",fontSize:10,color:a.color,marginBottom:3 }}>{a.setName}</div>
                <div style={{ fontSize:11,color:"#9fb8d8" }}>{a.bonus.label}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function InventoryView({ inventory, keys, coins, onUseKey, accentColor }) {
  const ownedItems = SHOP_ITEMS.filter(function(i){return inventory.includes(i.id);});
  const keyColors = { normal:"#4db8ff", elite:"#a05df5", red:"#f53d3d" };

  return (
    <div className="fade-in">
      <div style={{ marginBottom:20 }}>
        <div style={{ fontFamily:"'Orbitron',sans-serif",fontSize:20,fontWeight:700,color:"#eaf2ff" }}>Inventory</div>
        <div style={{ height:1,marginTop:6,background:"linear-gradient(90deg,"+accentColor+",transparent)" }} />
      </div>

      {/* Currency */}
      <div style={{ display:"flex",gap:12,marginBottom:20 }}>
        <div style={{ padding:"12px 18px",border:"1px solid #f5b65d44",background:"rgba(245,182,93,0.06)",display:"flex",alignItems:"center",gap:8 }}>
          <span style={{ fontSize:20 }}>🪙</span>
          <div><div style={{ fontSize:9,color:"#5b7aa0",letterSpacing:"0.2em" }}>COINS</div><div style={{ fontFamily:"'Orbitron',sans-serif",fontSize:20,fontWeight:700,color:"#f5b65d" }}>{coins}</div></div>
        </div>
      </div>

      {/* Relic set bonuses */}
      <SetBonusPanel inventory={inventory} accentColor={accentColor} />

      {/* Monarch Items — rare drops */}
      {(function(){
        const monarchOwned = MONARCH_ITEMS.filter(function(m){return inventory.includes(m.id);});
        if (monarchOwned.length===0) return null;
        return (
          <div style={{ marginBottom:20 }}>
            <div style={{ fontFamily:"'Orbitron',sans-serif",fontSize:11,letterSpacing:"0.3em",color:MONARCH_PURP,marginBottom:10 }}>MONARCH ITEMS</div>
            <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
              {monarchOwned.map(function(item){
                return (
                  <div key={item.id} style={{ padding:"12px 16px",border:"1px solid "+item.color+"66",background:item.color+"0a",display:"flex",alignItems:"center",gap:12 }}>
                    <span style={{ fontSize:20,color:item.color,flexShrink:0 }}>{item.icon}</span>
                    <div>
                      <div style={{ fontFamily:"'Orbitron',sans-serif",fontSize:11,fontWeight:700,color:item.color }}>{item.name}</div>
                      <div style={{ fontSize:10,color:"#5b7aa0",marginTop:2 }}>{item.desc}</div>
                      <div style={{ fontSize:9,color:item.color+"88",marginTop:2 }}>{item.effect}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Dungeon Keys */}
      {keys.length > 0 && (
        <div style={{ marginBottom:20 }}>
          <div style={{ fontFamily:"'Orbitron',sans-serif",fontSize:11,letterSpacing:"0.3em",color:accentColor,marginBottom:12 }}>DUNGEON KEYS</div>
          <div style={{ display:"flex",gap:10,flexWrap:"wrap" }}>
            {keys.map(function(key, i) {
              const kc = keyColors[key.type] || accentColor;
              return (
                <div key={i} style={{ padding:"10px 16px",border:"1px solid "+kc+"66",background:kc+"0a",display:"flex",alignItems:"center",gap:8 }}>
                  <span style={{ fontSize:18 }}>🗝</span>
                  <div>
                    <div style={{ fontSize:11,fontFamily:"'Orbitron',sans-serif",color:kc,fontWeight:700 }}>{key.label}</div>
                    <div style={{ fontSize:10,color:"#5b7aa0" }}>{key.desc}</div>
                  </div>
                  <button onClick={function(){if(typeof onUseKey==="function")onUseKey(i);}} style={{ padding:"4px 10px",background:kc,color:"#03050c",border:"none",cursor:"pointer",fontFamily:"'Orbitron',sans-serif",fontSize:9,fontWeight:700,marginLeft:8 }}>USE</button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Owned items */}
      <div style={{ fontFamily:"'Orbitron',sans-serif",fontSize:11,letterSpacing:"0.3em",color:accentColor,marginBottom:12 }}>EQUIPMENT & RELICS</div>
      {ownedItems.length === 0 ? (
        <div style={{ border:"1px solid #1a2438",padding:"32px",textAlign:"center",color:"#5b7aa0",fontSize:13 }}>No items owned yet. Visit the Hunter Shop.</div>
      ) : (
        <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:10 }}>
          {ownedItems.map(function(item) {
            return (
              <div key={item.id} style={{ border:"1px solid "+item.color+"44",background:"linear-gradient(160deg,rgba(10,18,34,0.97),rgba(5,10,20,0.99))",padding:"14px" }}>
                <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:8 }}>
                  <span style={{ fontSize:20,color:item.color }}>{item.icon}</span>
                  <div><div style={{ fontFamily:"'Orbitron',sans-serif",fontSize:11,fontWeight:700,color:"#eaf2ff" }}>{item.name}</div><div style={{ fontSize:10,color:item.color }}>{item.effect}</div></div>
                </div>
                <div style={{ fontSize:10,color:"#5b7aa0" }}>{item.desc}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ===========================================================================
   ERROR BOUNDARY
   =========================================================================== */
/* ===========================================================================
   CINEMATIC ACHIEVEMENT OVERLAY — CSS-only, no Framer, auto-dismisses
   =========================================================================== */
function CinematicAchievementOverlay({ achievement, onDone }) {
  const timerRef = useRef(null);
  useEffect(function() {
    if (!achievement) return;
    timerRef.current = setTimeout(function(){ if(typeof onDone==="function") onDone(); }, 4000);
    return function(){ clearTimeout(timerRef.current); };
  }, [achievement]);

  if (!achievement) return null;
  return (
    <div style={{ position:"fixed",inset:0,zIndex:9200,display:"flex",alignItems:"center",justifyContent:"center",background:"radial-gradient(ellipse at center,"+achievement.color+"22 0%,rgba(0,0,0,0.88) 60%)",pointerEvents:"none" }}>
      <div style={{ position:"absolute",left:0,right:0,height:2,background:"linear-gradient(90deg,transparent,"+achievement.color+"88,transparent)",animation:"scan-line 1.5s linear infinite" }} />
      <div className="fade-in-up" style={{ textAlign:"center",padding:"0 32px",position:"relative" }}>
        <div style={{ fontSize:52,marginBottom:16 }}>{achievement.icon}</div>
        <div style={{ fontFamily:"'Orbitron',sans-serif",fontSize:11,letterSpacing:"0.5em",color:achievement.color,marginBottom:12 }}>ACHIEVEMENT</div>
        <div className="rank-text-surge" style={{ fontFamily:"'Orbitron',sans-serif",fontSize:32,fontWeight:900,color:"#eaf2ff",marginBottom:10,textShadow:"0 0 30px "+achievement.color }}>{achievement.title}</div>
        <div style={{ fontSize:14,color:achievement.color+"cc",fontStyle:"italic",maxWidth:360,margin:"0 auto",lineHeight:1.7 }}>{achievement.sub}</div>
      </div>
    </div>
  );
}

/* ===========================================================================
   BREAKTHROUGH QUEST MODAL
   =========================================================================== */
function BreakthroughModal({ quest, onComplete, onDismiss }) {
  const [progress, setProgress] = useState({});
  if (!quest) return null;
  const allDone = quest.goals.every(function(g){ return (progress[g.id]||0)>=g.target; });

  function tapGoal(goalId) {
    const goal = quest.goals.find(function(g){return g.id===goalId;});
    if (!goal||(progress[goalId]||0)>=goal.target) return;
    const next = Object.assign({},progress,{[goalId]:goal.target});
    setProgress(next);
    if (quest.goals.every(function(g){return (next[g.id]||0)>=g.target;})) {
      setTimeout(function(){if(typeof onComplete==="function")onComplete(quest);},800);
    }
  }

  return (
    <div style={{ position:"fixed",inset:0,zIndex:8600,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(3,5,12,0.92)",backdropFilter:"blur(6px)",padding:"24px 16px" }}>
      <div className="fade-in-up" style={{ maxWidth:480,width:"100%",border:"1px solid #f5b65d88",background:"linear-gradient(160deg,rgba(14,10,2,0.99),rgba(7,5,1,0.99))",position:"relative",overflow:"hidden" }}>
        <div style={{ position:"absolute",inset:0,pointerEvents:"none",background:"repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(245,182,93,0.02) 2px,rgba(245,182,93,0.02) 4px)" }} />
        <div style={{ padding:"28px 24px",position:"relative" }}>
          <div style={{ textAlign:"center",marginBottom:20 }}>
            <div className="dng-warn" style={{ fontFamily:"'Orbitron',sans-serif",fontSize:10,letterSpacing:"0.4em",color:"#f5b65d",marginBottom:8 }}>⚠ BREAKTHROUGH QUEST</div>
            <div style={{ fontFamily:"'Orbitron',sans-serif",fontSize:18,fontWeight:700,color:"#eaf2ff",marginBottom:6 }}>{quest.title}</div>
            <p style={{ fontSize:13,color:"#9fb8d8",lineHeight:1.6 }}>{quest.flavor}</p>
          </div>
          <div style={{ height:1,background:"linear-gradient(90deg,transparent,#f5b65d44,transparent)",marginBottom:16 }} />
          {quest.goals.map(function(g){
            const cur=progress[g.id]||0; const done=cur>=g.target;
            return (
              <div key={g.id} onClick={function(){tapGoal(g.id);}} style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"9px 0",borderBottom:"1px solid rgba(245,182,93,0.08)",cursor:done?"default":"pointer" }}>
                <span style={{ fontSize:13,color:done?"#5a6a3a":"#dbe6ff" }}>{g.name}</span>
                <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                  <span style={{ fontSize:11,color:done?"#2ee88a":"#9fb8d8" }}>{cur}/{g.target}{g.unit}</span>
                  <div style={{ width:18,height:18,border:"1.5px solid "+(done?"#2ee88a":"#f5b65d55"),background:done?"#2ee88a22":"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#2ee88a" }}>{done?"✓":""}</div>
                </div>
              </div>
            );
          })}
          <div style={{ marginTop:16,padding:"8px 12px",border:"1px solid #f5b65d33",background:"rgba(245,182,93,0.06)",fontSize:11,color:"#f5b65d",fontWeight:700 }}>{quest.reward.label}</div>
          {!allDone&&<button onClick={onDismiss} style={{ marginTop:12,width:"100%",padding:"10px",background:"transparent",border:"1px solid #5b7aa044",color:"#5b7aa0",cursor:"pointer",fontFamily:"'Orbitron',sans-serif",fontSize:10 }}>Complete later (quest stays active)</button>}
        </div>
      </div>
    </div>
  );
}

/* ===========================================================================
   WORLD EVENT BANNER — shown at top of Dashboard
   =========================================================================== */
function WorldEventBanner({ event }) {
  if (!event) return null;
  return (
    <div style={{ padding:"10px 14px",marginBottom:14,border:"1px solid "+event.color+"88",background:"linear-gradient(90deg,"+event.color+"0d,transparent)",display:"flex",alignItems:"center",gap:12,animation:"pulse-glow 2.5s ease-in-out infinite" }}>
      <div style={{ width:28,height:28,border:"1.5px solid "+event.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,color:event.color,flexShrink:0 }}>{event.icon}</div>
      <div style={{ flex:1 }}>
        <div style={{ fontFamily:"'Orbitron',sans-serif",fontSize:10,fontWeight:700,color:event.color,letterSpacing:"0.1em" }}>{event.name.toUpperCase()}</div>
        <div style={{ fontSize:11,color:"#9fb8d8",marginTop:2 }}>{event.desc}</div>
      </div>
      <span style={{ fontFamily:"'Orbitron',sans-serif",fontSize:9,color:event.color+"88",flexShrink:0 }}>ACTIVE</span>
    </div>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state={hasError:false,errorMessage:""}; }
  static getDerivedStateFromError(e) { return {hasError:true,errorMessage:e&&e.message?e.message:String(e)}; }
  componentDidCatch(e,i) { console.error("[ARISE]",e,i); }
  render() { if (!this.state.hasError) return this.props.children; return (<div style={{ minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#050a16",padding:24 }}><div style={{ maxWidth:480,border:"1px solid #f53d3d66",background:"rgba(10,5,5,0.98)",padding:"32px 28px",textAlign:"center" }}><div style={{ fontFamily:"'Orbitron',sans-serif",fontSize:14,color:"#f53d3d",marginBottom:12 }}>SYSTEM ERROR</div><code style={{ display:"block",fontSize:11,color:"#f5556f",background:"rgba(245,61,61,0.08)",padding:"8px 12px",marginBottom:20,textAlign:"left",wordBreak:"break-all" }}>{this.state.errorMessage}</code><button onClick={function(){window.location.reload();}} style={{ padding:"10px 24px",background:"#f53d3d",color:"#fff",border:"none",cursor:"pointer",fontWeight:700 }}>RESTART</button></div></div>); }
}

/* ===========================================================================
   ROOT APP
   =========================================================================== */
function App() {
  const sfx = useAudio();

  /* Phase */
  const [phase, setPhase] = useState("onboard");

  /* Player — pre-onboard defaults are all valid numbers so XP bar never shows NaN */
  const [player, setPlayer] = useState({
    name: "Hunter", level: 1, xp: 0, streak: 0,
    job: "fighter", physique: "hybrid", goals: [],
    activeTitle: "awakened",
    stats: { Strength:10, Agility:10, Endurance:10, Discipline:10, Intelligence:10, Recovery:10, Aura:5 },
  });

  /* UI */
  const [activeView, setActiveView] = useState("Dashboard");
  const [menuOpen, setMenuOpen]     = useState(false);
  const [soundOn, setSoundOn]       = useState(true);

  /* Quest progress — keyed by goal ID */
  const [dailyProgress, setDailyProgress] = useState({});
  const [isDailyDone, setIsDailyDone]           = useState(false);
  /* System 2: Streak protection */
  const [streakProtectActive, setStreakProtectActive] = useState(false);
  const [streakProtectDone, setStreakProtectDone]     = useState(false);
  const [sideProgress, setSideProgress]   = useState(SIDE_QUESTS.map(function(){return {};}));
  const [sideDone, setSideDone]           = useState(SIDE_QUESTS.map(function(){return false;}));
  /* Extended side quests — keyed by quest ID so adding new quests never breaks existing state */
  const [extSideProgress, setExtSideProgress] = useState({}); /* { questId: { goalId: completedVal } } */
  const [extSideDone, setExtSideDone]         = useState({}); /* { questId: true } */
  /* Anomaly quests — keyed by quest ID, recentIds for anti-repetition */
  const [anomalyProgress, setAnomalyProgress] = useState({}); /* { questId: completed boolean } */
  const [anomalyDone, setAnomalyDone]         = useState({}); /* { questId: true } */
  const [recentAnomalyIds, setRecentAnomalyIds] = useState([]); /* last ~15 completed IDs */

  /* Dungeon gates */
  const [clearedGates, setClearedGates] = useState({});
  const [dungeonChainGate, setDungeonChainGate] = useState(null);
  const [activeModifier, setActiveModifier]     = useState(null); /* rolled on gate entry */

  /* Boss raids */
  const [bosses, setBosses] = useState(function(){
    return BOSS_DATA.map(function(b){return Object.assign({},b,{maxHp:b.hp,currentHp:b.hp});});
  });
  /* Secret bosses — keyed by boss.id → { currentHp, maxHp } */
  const [secretBossStates, setSecretBossStates] = useState(function() {
    const init = {};
    SECRET_BOSS_DATA.forEach(function(b) { init[b.id] = { currentHp: b.hp, maxHp: b.hp }; });
    return init;
  });
  const [accessDeniedBoss, setAccessDeniedBoss] = useState(null); /* boss that triggered rank denial */

  /* Shadow extraction ARISE system */
  const [ariseTarget, setAriseTarget]     = useState(null);  /* { bossIndex, bossData } */
  const [ariseAttempt, setAriseAttempt]   = useState(1);     /* 1-3 */

  /* Hidden quests */
  const [seenHiddenIds, setSeenHiddenIds]               = useState([]);
  const [activeHiddenQuest, setActiveHiddenQuest]       = useState(null);
  const [hiddenQuestPending, setHiddenQuestPending]     = useState(null);
  const [hiddenQuestProgress, setHiddenQuestProgress]   = useState({});
  const [completedHiddenIds, setCompletedHiddenIds]     = useState([]);

  /* System 6 — takeover events */
  const [takeoverEvent, setTakeoverEvent] = useState(null);

  /* Phase 2 — Random events */
  const [randomEventPending, setRandomEventPending] = useState(null);

  /* Wave 4 — Guild, Identity, Ascension */
  const [guildId, setGuildId]                         = useState(null);
  const [guildRecruitOffer, setGuildRecruitOffer]     = useState(null); /* guild obj being offered */
  const [guildQuestProgress, setGuildQuestProgress]   = useState({});
  const [guildQuestDone, setGuildQuestDone]           = useState(false);
  const [ascensionCount, setAscensionCount]           = useState(0);
  const [monarchCorruption, setMonarchCorruption]     = useState(0); /* 0-100, increases at high rank */

  /* Wave 3 — Breakthrough / Achievements / World Events / Awakening */
  const [breakthroughPending, setBreakthroughPending] = useState(null);
  const [completedBTs, setCompletedBTs]               = useState([]);
  const [cinematicAch, setCinematicAch]               = useState(null);
  const [worldEvent, setWorldEvent]                   = useState(null);
  const [awakeningDay, setAwakeningDay]               = useState(false);
  const [earnedAchievements, setEarnedAchievements]   = useState([]); /* System 8 */

  /* Phase 4 — Economy, Energy, Shadow Army */
  const [coins, setCoins]               = useState(0);
  const [fame, setFame]                 = useState(0); /* System 4: Hunter Fame */
  const [inventory, setInventory]       = useState([]);      /* item IDs owned */
  const [dungeonKeys, setDungeonKeys]   = useState([]);      /* array of key objects */
  const [loreFragments, setLoreFragments]       = useState(0);
  const [collectedLoreIds, setCollectedLoreIds] = useState([]);
  const [shadowArmy, setShadowArmy]         = useState([]);
  const [shadowMissions, setShadowMissions] = useState([]);
  /* System 6: squads — array of { id, name, shadowIds, icon } */
  const [shadowSquads, setShadowSquads]     = useState([
    { id:"assault",  name:"Assault Squad",  shadowIds:[], icon:"⚔" },
    { id:"recon",    name:"Recon Squad",    shadowIds:[], icon:"➤" },
    { id:"raid",     name:"Raid Squad",     shadowIds:[], icon:"❖" },
  ]);
  const [unlockedSpecs, setUnlockedSpecs]   = useState([]);  /* System 3: unlocked spec IDs */
  const [energyState, setEnergyState]   = useState({ sleep:7,soreness:3,fatigue:3,hydration:7,stress:3 });
  const [energyScore, setEnergyScore]   = useState(68);
  /* Reward chest flow: null → [reward, reward, reward] */
  const [rewardChest, setRewardChest]   = useState(null);
  /* Stat points flow */
  const [pendingStatPoints, setPendingStatPoints] = useState(0);
  /* Dungeon cutscene gate */
  const [cutsceneGate, setCutsceneGate] = useState(null);
  /* Shadow rename overrides */
  const [shadowNames, setShadowNames]   = useState({});
  /* XP boost active */
  const xpBoostRef = useRef(false);
  /* Cinematic popup state — was missing, caused "Can't find variable: cinematic" crash */
  const [cinematic, setCinematic] = useState(null);
  const [levelUpFx, setLevelUpFx] = useState(null);
  const [rankUpFx, setRankUpFx]   = useState(null);
  const lvlTimerRef = useRef(null);
  const rnkTimerRef = useRef(null);

  /* Toast */
  const [toast, setToast]               = useState(null);
  const [notifHistory, setNotifHistory] = useState([]); /* System 7: last 5 notifications */
  const toastTimerRef = useRef(null);

  /* System log */
  const [systemLog, setSystemLog] = useState([{ time:"00:00:00",kind:"system",message:"System initialized. Awaiting hunter registration." }]);

  /* Secret achievements */
  const [secretAchievements, setSecretAchievements] = useState(
    SECRET_ACHIEVEMENTS.map(function(a){return Object.assign({},a,{unlocked:false});})
  );

  /* Monarch system — invisible to player */
  const [monarchInterest, setMonarchInterest]     = useState(0);
  const [monarchStage, setMonarchStage]           = useState(0);
  const [crypticVisible, setCrypticVisible]       = useState(false);
  const [crypticMessage, setCrypticMessage]       = useState("");
  const [trialOpen, setTrialOpen]                 = useState(false);
  const [trialProgress, setTrialProgress]         = useState({});
  const [reawakeningActive, setReawakeningActive] = useState(false);
  const [isMonarch, setIsMonarch]                 = useState(false);
  const [trialFailed, setTrialFailed]             = useState(false);
  const [glitchIntensity, setGlitchIntensity]     = useState(0);
  const glitchTimerRef  = useRef(null);
  const lastCrypticRef  = useRef(0);

  /* Derived */
  const rank        = getRankForLevel(player.level);
  const accentColor = isMonarch ? MONARCH_PURP : rank.color;
  const dailyQuest  = generateDailyQuest(player.job, player.goals, player.level);

  const totalQuestGoalsCleared =
    dailyQuest.goals.filter(function(g){return (dailyProgress[g.id]||0)>=g.target;}).length +
    sideProgress.reduce(function(acc,qp,qi){return acc+SIDE_QUESTS[qi].goals.filter(function(g){return (qp[g.id]||0)>=g.target;}).length;},0);

  /* Sound toggle — safe, no implicit return */
  useEffect(function() { sfx.setEnabled(soundOn); }, [soundOn]);

  /* System 8: Achievement check — runs when key player values change */
  useEffect(function() {
    if (phase !== "app") return;
    const earned = earnedAchievements.map(function(a){return a.id;});
    const newOnes = checkNewAchievements(player, earned);
    if (newOnes.length === 0) return;
    newOnes.forEach(function(ach) {
      addFame(ach.fameGain||0);
    });
    /* Show toast for first new achievement only to avoid spam */
    if (newOnes[0]) showToast(newOnes[0].name + " — " + newOnes[0].desc, "ach");
    addLog("Achievement" + (newOnes.length>1?"s":"")+": " + newOnes.map(function(a){return a.name;}).join(", ")+".","ach");
    setEarnedAchievements(function(prev){ return prev.concat(newOnes); });
  }, [player.level, player.streak, phase]);

  /* Monarch stage watcher */
  useEffect(function() {
    if (monarchStage===3&&!trialOpen&&!isMonarch&&!trialFailed) {
      const t=setTimeout(function(){
        setCrypticMessage("You have met the minimum conditions. A hidden path has revealed itself. Would you like to challenge the Monarch Trial?");
        setCrypticVisible(true); lastCrypticRef.current=Date.now()+99999; sfx.sfxAlert();
      },2000);
      return function(){clearTimeout(t);};
    }
  }, [monarchStage,trialOpen,isMonarch,trialFailed]);

  /* ---- Phase 2: Random event handlers ---- */
  function handleRandomEventAccept(event) {
    setRandomEventPending(null);
    if (!event) return;
    /* Apply instant rewards */
    if (event.xp > 0) grantXp(event.xp, event.statKey, event.statGain);
    if (event.coins > 0) addCoins(event.coins);
    /* If it has quest goals, add as a hidden quest (reuse system) */
    if (event.goals && event.goals.length > 0) {
      const asHiddenQuest = {
        id: "ev_" + event.id,
        label: event.title,
        rarity: event.rarity || "UNCOMMON",
        flavor: event.flavor,
        goals: event.goals,
        xp: event.xp || 50,
        statKey: event.statKey || "Discipline",
        statGain: event.statGain || 1,
      };
      setActiveHiddenQuest(asHiddenQuest);
      setHiddenQuestProgress({});
    }
    showToast(event.title + " — accepted", "ach");
    addLog("Random event accepted: " + event.title + ".", "ach");
  }

  function handleRandomEventDismiss(event) {
    setRandomEventPending(null);
    /* Instant-reward events (loot/corrupted) still pay out on dismiss */
    if (event && event.goals && event.goals.length === 0) {
      if (event.xp > 0) grantXp(event.xp, event.statKey, event.statGain);
      if (event.coins > 0) addCoins(event.coins);
    }
    addLog("Random event dismissed: " + (event ? event.title : "unknown") + ".", "info");
  }

  /* ---- Phase 2: Random event trigger (called after daily clear) ---- */
  function maybeRollRandomEvent() {
    const rankIdx = rank ? (rank.minRankIndex || 0) : 0;
    const event = rollRandomEvent(player.streak, rankIdx);
    if (event) {
      setTimeout(function() {
        setRandomEventPending(event);
        sfx.sfxAlert();
        addLog("Random event triggered: " + event.label + ".", "system");
      }, 6000); /* 6s after daily clear, after hidden quest offer delay */
    }
  }

  /* ---- System 2: Streak protection handlers ---- */
  function handleStreakPreserve() {
    setStreakProtectActive(false);
    setStreakProtectDone(true);
    showToast("Streak preserved! " + player.streak + " days continue.", "evolve");
    addLog("Recovery opportunity completed. Streak preserved at " + player.streak + " days.","evolve");
  }
  function handleStreakDecline() {
    setStreakProtectActive(false);
    setStreakProtectDone(true);
    setPlayer(function(prev){ return Object.assign({},prev,{streak:0}); });
    showToast("Streak lost. Reset to 0.", "warning");
    addLog("Streak recovery declined. Streak reset to 0.","warning");
  }

  /* ---- Wave 3: Breakthrough quest handlers ---- */
  function handleBreakthroughComplete(quest) {
    setBreakthroughPending(null);
    setCompletedBTs(function(prev){ return prev.concat([quest.id]); });
    grantXp(quest.reward.xp, quest.reward.statKey, quest.reward.statGain);
    addFame(20);
    if (quest.reward.titleId) {
      setPlayer(function(prev){ return Object.assign({},prev,{activeTitle:quest.reward.titleId}); });
    }
    sfx.sfxRankUp();
    setCinematicAch({ title:"BREAKTHROUGH", sub:quest.reward.label+" · Growth ceiling broken.", color:"#f5b65d", icon:"⚔" });
    showToast("Breakthrough complete! " + quest.reward.label,"evolve");
    addLog("Breakthrough quest completed: "+quest.title+".","evolve");
  }

  /* ---- Wave 3: World event trigger ---- */
  function maybeStartWorldEvent() {
    if (worldEvent) return;
    const ev = rollWorldEvent(rankIdx||0, player.streak||0);
    if (ev) {
      setWorldEvent(ev);
      showToast("World Event: "+ev.name,"ach");
      addLog("World event active: "+ev.name+".","system");
      /* Auto-expire after duration */
      setTimeout(function(){
        setWorldEvent(function(cur){ return cur&&cur.id===ev.id?null:cur; });
      }, ev.dur);
    }
  }

  /* ---- Wave 3: Awakening Day trigger (1% chance per daily clear) ---- */
  function maybeActivateAwakeningDay() {
    if (Math.random() < 0.01) {
      setAwakeningDay(true);
      showToast("AWAKENING DAY — All rewards elevated.","evolve");
      addLog("Awakening Day detected. Performance window activated.","system");
      setTimeout(function(){ setAwakeningDay(false); }, 86400000);
    }
  }

  /* ---- Wave 3: Trigger cinematic achievement from secret unlock ---- */
  function triggerCinematicAch(condition) {
    const ach = CINEMATIC_ACHIEVEMENTS.find(function(a){ return a.condition===condition; });
    if (ach) {
      setTimeout(function(){
        setCinematicAch(ach);
      }, 1200);
    }
  }

  /* ---- Daily reset (midnight) ---- */
  function handleDailyReset() {
    /* System 2: If streak > 0 and daily wasn't completed, offer recovery opportunity */
    if (player.streak > 0 && !isDailyDone) {
      setStreakProtectActive(true);
      setStreakProtectDone(false);
    }
    setDailyProgress({});
    setIsDailyDone(false);
    setSideProgress(SIDE_QUESTS.map(function(){return {};}));
    setSideDone(SIDE_QUESTS.map(function(){return false;}));
    /* Extended quests also reset daily */
    setExtSideProgress({});
    setExtSideDone({});
    /* Anomaly quests reset daily — recentIds stays to prevent repetition */
    setAnomalyProgress({});
    setAnomalyDone({});
    showToast("Daily quests reset. New protocol begins.","system");
    addLog("Daily reset triggered at midnight. Quests refreshed.","system");
  }

  function handleEnergyUpdate(state, score) {
    setEnergyState(state);
    setEnergyScore(score);
    showToast("Energy logged: " + getEnergyLevel(score).label, "xp");
    addLog("Energy status updated: " + getEnergyLevel(score).label + " (score: " + score + ").","info");
  }

  /* ---- Phase 4: Coins ---- */
  function addCoins(amount) {
    setCoins(function(prev) { return prev + amount; });
  }

  function addFame(amount) {
    if (typeof amount !== "number" || !isFinite(amount) || amount <= 0) return;
    setFame(function(prev) {
      const next = prev + Math.round(amount);
      /* Wave 4: check for guild recruitment offer */
      maybeOfferGuildRecruitment(next);
      return next;
    });
  }

  /* ---- System 7: Lore collection ---- */
  function collectLore() {
    setCollectedLoreIds(function(prev) {
      const entry = pickNewLore(prev);
      if (!entry) return prev;
      setLoreFragments(function(n){ return n + 1; });
      showToast("Lore Fragment: " + entry.title, "ach");
      addLog("Lore collected: " + entry.title + ".","ach");
      return prev.concat([entry.id]);
    });
  }

  /* ---- Phase 4: Buy from shop ---- */
  function handleBuyItem(item) {
    if (coins < item.cost) { showToast("Insufficient coins","warning"); return; }
    setCoins(function(prev) { return prev - item.cost; });
    if (item.effectKey && item.effectGain && item.effectKey !== "energy" && item.effectKey !== "monarch") {
      setPlayer(function(prev) {
        const stats = Object.assign({}, prev.stats);
        stats[item.effectKey] = (stats[item.effectKey]||0) + item.effectGain;
        return Object.assign({}, prev, { stats });
      });
    }
    if (item.effectKey === "energy") {
      setEnergyScore(function(prev) { return Math.min(100, prev + item.effectGain); });
    }
    if (item.effectKey === "monarch") {
      addMonarchInterest(item.effectGain);
    }
    if (item.keyType) {
      setDungeonKeys(function(prev) { return prev.concat([{ type:item.keyType, label:item.name, desc:item.desc||"" }]); });
      showToast("Key added to inventory!","ach");
    } else {
      setInventory(function(prev) { return prev.includes(item.id)?prev:prev.concat([item.id]); });
      showToast(item.name+" purchased!","ach");
    }
    addLog("Purchased: "+item.name+" ("+item.cost+" coins).","xp");
  }

  /* ---- Phase 4: Reward chest claim ---- */
  function handleChestClaim(reward) {
    setRewardChest(null);
    if (reward.type === "coins") { addCoins(reward.value); showToast("+"+reward.value+" coins","xp"); }
    if (reward.type === "stat") { setPlayer(function(prev){ const s=Object.assign({},prev.stats); s[reward.value]=(s[reward.value]||0)+reward.gain; return Object.assign({},prev,{stats:s}); }); showToast(reward.label+" claimed!","ach"); }
    if (reward.type === "key") { setDungeonKeys(function(prev){return prev.concat([{type:reward.value,label:reward.label,desc:reward.desc||""}]);}); showToast("Key acquired!","ach"); }
    if (reward.type === "boost") { xpBoostRef.current = true; showToast("XP Surge active — next quest ×1.5!","evolve"); setTimeout(function(){xpBoostRef.current=false;},86400000); }
    if (reward.type === "hidden") { setTimeout(function(){maybeOfferHiddenQuest();},1000); showToast("Hidden quest incoming...","ach"); }
    addLog("Reward chest opened: "+reward.label+".","xp");
  }

  /* ---- Phase 4: Stat points confirm ---- */
  function handleStatPointConfirm(dist) {
    setPendingStatPoints(0);
    setPlayer(function(prev) {
      const stats = Object.assign({}, prev.stats);
      Object.keys(dist).forEach(function(k) { if (dist[k]>0) stats[k]=(stats[k]||0)+dist[k]; });
      return Object.assign({}, prev, { stats });
    });
    const gained = Object.entries(dist).filter(function(e){return e[1]>0;}).map(function(e){return "+"+e[1]+" "+e[0];}).join(", ");
    showToast("Stats allocated: " + gained, "evolve");
    addLog("Stat points distributed: "+gained+".","evolve");
  }

  /* ---- Phase 4: Shadow rename ---- */
  /* ---- System 1: Title selection ---- */
  /* ---- System 2: Shadow mission handlers ---- */
  function handleDispatchMission(shadowId, missionId) {
    const mission = SHADOW_MISSIONS.find(function(m){ return m.id === missionId; });
    if (!mission) return;
    /* Check shadow not already on mission */
    const alreadyOut = shadowMissions.some(function(m){ return m.shadowId === shadowId; });
    if (alreadyOut) { showToast("Shadow already on mission","warning"); return; }
    const endsAt = Date.now() + mission.dur;
    setShadowMissions(function(prev){ return prev.concat([{ shadowId, missionId, endsAt, started: Date.now() }]); });
    showToast(mission.name + " started!","ach");
    addLog("Shadow dispatched: " + missionId + ".","ach");
  }

  function handleCompleteMission(activeMission) {
    const mission = SHADOW_MISSIONS.find(function(m){ return m.id === activeMission.missionId; });
    /* Find shadow */
    const shadow = shadowArmy.find(function(s){ return s.id === activeMission.shadowId; });
    if (!mission) return;
    const success = Math.random() < calcMissionSuccess(shadow||{rarity:"COMMON",loyalty:0,evolutionLevel:1}, mission);
    const reward  = rollMissionReward(mission, success);
    /* Apply rewards */
    if (success) {
      addCoins(reward.coins);
      if (reward.statKey) grantXp(0, reward.statKey, reward.statGain);
      if (reward.key) setDungeonKeys(function(prev){ return prev.concat([{type:"normal",label:"Scout Key",desc:"Found on mission."}]); });
      if (reward.loreFrag) setLoreFragments(function(prev){ return prev + 1; });
    }
    /* Remove mission */
    setShadowMissions(function(prev){ return prev.filter(function(m){ return m !== activeMission; }); });
    /* Show report cinematic */
    setCinematic({
      kind: success?"victory":"fail",
      title: success ? "MISSION COMPLETE" : "MISSION FAILED",
      bigText: mission.name,
      sub: success ? reward.message : "The shadow encountered resistance and returned with nothing.",
      reward: success ? reward.message : null,
    });
    addLog("Shadow mission " + (success?"complete":"failed") + ": " + mission.name + "." + (success?" "+reward.message:""),"evolve");
  }

  /* ---- System 3: Specialization unlock ---- */
  function handleUnlockSpec(node) {
    if (!node || unlockedSpecs.includes(node.id)) return;
    setUnlockedSpecs(function(prev){ return prev.concat([node.id]); });
    if (node.stats) {
      setPlayer(function(prev){
        const stats = Object.assign({}, prev.stats);
        Object.keys(node.stats).forEach(function(k){ stats[k]=(stats[k]||0)+node.stats[k]; });
        return Object.assign({}, prev, { stats });
      });
    }
    showToast("Specialization unlocked: " + node.name, "evolve");
    addLog("Specialization unlocked: " + node.name + ". " + node.bonus + ".","evolve");
  }

  /* ---- Wave 4: Guild handlers ---- */
  function handleJoinGuild(gId) {
    const guild = GUILDS.find(function(g){return g.id===gId;});
    setGuildId(gId);
    setGuildRecruitOffer(null);
    setGuildQuestProgress({});
    setGuildQuestDone(false);
    addFame(20);
    showToast("Joined " + (guild?guild.name:"guild") + "!","ach");
    addLog("Guild joined: "+(guild?guild.name:"unknown")+".","ach");
  }
  function handleLeaveGuild() {
    setGuildId(null); setGuildQuestProgress({}); setGuildQuestDone(false);
    showToast("Left guild.","warning");
  }
  function handleGuildGoalTap(goalId) {
    if (!guildId||guildQuestDone) return;
    const guild=GUILDS.find(function(g){return g.id===guildId;});
    if (!guild) return;
    const goal=guild.quest.goals.find(function(g){return g.id===goalId;});
    if (!goal||(guildQuestProgress[goalId]||0)>=goal.target) return;
    sfx.sfxComplete();
    const next=Object.assign({},guildQuestProgress,{[goalId]:goal.target});
    setGuildQuestProgress(next);
    if (guild.quest.goals.every(function(g){return (next[g.id]||0)>=g.target;})){
      setGuildQuestDone(true);
      grantXp(guild.quest.xp,"Discipline",2);
      addCoins(guild.quest.coins);
      addFame(guild.quest.fameGain);
      showToast(guild.name+" quest cleared! +"+guild.quest.xp+" XP","evolve");
      addLog("Guild quest completed: "+guild.questLabel+".","evolve");
    }
  }

  /* ---- Wave 4: Guild recruitment trigger (called after fame increases) ---- */
  function maybeOfferGuildRecruitment(currentFame) {
    if (guildId||guildRecruitOffer) return;
    const eligible = GUILDS.filter(function(g){
      return currentFame>=g.fameReq && (player.level||1)>=(g.rankReq*5||0);
    }).sort(function(a,b){return b.fameReq-a.fameReq;});
    if (eligible.length===0) return;
    /* Offer the highest-tier eligible guild */
    const offer = eligible[0];
    setTimeout(function(){
      setGuildRecruitOffer(offer);
      sfx.sfxSecret();
      addLog("Guild recruitment offer: "+offer.name+".","ach");
    }, 4000);
  }

  /* ---- Wave 4: Ascension ---- */
  function handleAscension() {
    if ((player.level||0)<48) { showToast("Ascension requires LV 48 minimum.","warning"); return; }
    setAscensionCount(function(n){return n+1;});
    /* Keep: titles, achievements, shadows, guild, lore */
    /* Reset: level (to 1), xp (0), daily progress */
    setPlayer(function(prev){
      return Object.assign({},prev,{
        level:1, xp:0,
        stats:{ Strength:20,Agility:20,Endurance:20,Discipline:20,Intelligence:20,Recovery:20,Aura:15 },
      });
    });
    setDailyProgress({}); setIsDailyDone(false);
    addFame(200);
    sfx.sfxRankUp();
    setCinematicAch({ title:"ASCENSION", sub:"You have reset and exceeded your limits. Growth rate permanently elevated.", color:GLITCH_RED, icon:"✸" });
    showToast("ASCENSION complete. Growth rate ×1.5.","evolve");
    addLog("Ascension "+ascensionCount+" completed. Prestige level increased.","evolve");
  }

  /* ---- Wave 4: Monarch corruption (increases with rankIdx and monarchInterest) ---- */
  /* Computed, not stateful — avoids stale closures */

  function handleSetTitle(titleId) {
    setPlayer(function(prev) { return Object.assign({}, prev, { activeTitle: titleId }); });
    const t = HUNTER_TITLES.find(function(x){ return x.id === titleId; });
    showToast("Title set: " + (t ? t.name : titleId), "ach");
  }

  function handleShadowRename(shadowId, newName) {
    setShadowNames(function(prev){return Object.assign({},prev,{[shadowId]:newName});});
  }

  /* ---- System 6: Squad management ---- */
  function handleToggleShadowFavorite(shadowId) {
    setShadowArmy(function(prev){
      return prev.map(function(s){
        return s.id===shadowId ? Object.assign({},s,{favorite:!s.favorite}) : s;
      });
    });
  }

  function handleAddToSquad(shadowId, squadId) {
    setShadowSquads(function(prev){
      return prev.map(function(sq){
        if (sq.id !== squadId) return sq;
        const already = sq.shadowIds.includes(shadowId);
        return Object.assign({},sq,{
          shadowIds: already
            ? sq.shadowIds.filter(function(id){ return id!==shadowId; })
            : sq.shadowIds.concat([shadowId]),
        });
      });
    });
  }

  /* ---- Phase 4: Dungeon cutscene gate ---- */
  function handleEnterGateWithCutscene(gate) {
    if (clearedGates[gate.id]) return;
    if (player.level < gate.minLevel) {
      sfx.sfxDenied();
      setCinematic({ kind:"fail",title:"ACCESS DENIED",flavor:"Hunter rank insufficient.",bigText:gate.name,sub:"Minimum requirement: "+gate.rank+"-Rank (LV "+gate.minLevel+"). Your current rank does not meet the entry threshold.",reward:null });
      addLog("Gate entry denied: "+gate.name+". Rank insufficient.","warning");
      return;
    }
    setCutsceneGate(gate);
  }

  /* ---- Phase 4: Dungeon key use ---- */
  function handleUseKey(keyIndex) {
    const key = dungeonKeys[keyIndex];
    if (!key) return;
    setDungeonKeys(function(prev){return prev.filter(function(_,i){return i!==keyIndex;});});
    showToast("Key used: "+key.label,"ach");
    addLog("Dungeon key used: "+key.label+".","ach");
  }

  /* ---- Helpers ---- */
  function addLog(message, kind) {
    setSystemLog(function(prev){
      return prev.concat([{time:ts(),kind:kind||"info",message}]).slice(-100);
    });
  }

  function showToast(message, kind, monarch) {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({message,kind:kind||"info",monarch:!!monarch});
    toastTimerRef.current=setTimeout(function(){setToast(null);},3200);
    /* System 7: push to notification history (keep last 5) */
    setNotifHistory(function(prev){
      return [{message,kind:kind||"info",time:ts()}].concat(prev).slice(0,5);
    });
  }

  function unlockSecret(condition) {
    setSecretAchievements(function(prev){
      return prev.map(function(a){
        if (a.condition===condition&&!a.unlocked) {
          addLog("Secret achievement unlocked: "+a.name,"secret");
          sfx.sfxSecret();
          triggerCinematicAch(condition); /* Wave 3: cinematic overlay */
          return Object.assign({},a,{unlocked:true});
        }
        return a;
      });
    });
  }

  /* ---- XP grant with level-up and rank-up detection ---- */
  function grantXp(amount, statKey, statGain) {
    /* Never let a NaN amount corrupt player state */
    const safeAmount = (typeof amount === "number" && isFinite(amount) && amount > 0) ? Math.round(amount) : 0;
    if (safeAmount === 0 && !statKey) return;
    setPlayer(function(prev){
      let xp    = (prev.xp || 0) + safeAmount;
      let level = (typeof prev.level === "number" && isFinite(prev.level)) ? prev.level : 1;
      const prevRank=getRankForLevel(level);
      while(xp>=xpForLevel(level)){xp-=xpForLevel(level);level++;}
      const newRank=getRankForLevel(level);
      const stats=Object.assign({},prev.stats);
      if(statKey && typeof statGain === "number" && isFinite(statGain)) {
        stats[statKey]=(stats[statKey]||0)+statGain;
      }
      if(level>prev.level){
        sfx.sfxLevelUp();
        if(lvlTimerRef.current)clearTimeout(lvlTimerRef.current);
        setLevelUpFx({level,id:Date.now()});
        lvlTimerRef.current=setTimeout(function(){setLevelUpFx(null);},2400);
        showToast("LEVEL UP — LV "+level,"evolve");
        addLog("Level advanced to LV "+level+".","evolve");
        if(Math.random()<0.04){ setTimeout(function(){setTakeoverEvent(rollTakeoverEvent("level"));},2600); }
        /* Wave 3: Check for breakthrough quest at this level */
        const bt = BREAKTHROUGH_QUESTS.find(function(q){
          return q.triggerLevel===level && !completedBTs.includes(q.id);
        });
        if (bt && !breakthroughPending) {
          setTimeout(function(){ setBreakthroughPending(bt); sfx.sfxAlert(); },3200);
        }
      }
      if(newRank.name!==prevRank.name){
        const delay=level>prev.level?1600:0;
        setTimeout(function(){
          sfx.sfxRankUp();
          if(rnkTimerRef.current)clearTimeout(rnkTimerRef.current);
          setRankUpFx({rank:newRank,id:Date.now()});
          rnkTimerRef.current=setTimeout(function(){setRankUpFx(null);},3800);
        },delay);
        addLog("Rank ascension: "+newRank.name+" — "+newRank.title+".","evolve");
      }
      return Object.assign({},prev,{xp,level,stats});
    });
  }

  /* ---- Monarch interest ---- */
  function addMonarchInterest(amount) {
    if(isMonarch||trialOpen) return;
    setMonarchInterest(function(prev){
      const next=prev+amount;
      const g1=trialFailed?MONARCH_THRESHOLD_GLITCH_1+12:MONARCH_THRESHOLD_GLITCH_1;
      const g2=trialFailed?MONARCH_THRESHOLD_GLITCH_2+12:MONARCH_THRESHOLD_GLITCH_2;
      const tr=trialFailed?MONARCH_RETRY_THRESHOLD:MONARCH_THRESHOLD_TRIAL;
      setMonarchStage(function(s){
        let ns=s;
        if(next>=tr) ns=3;
        else if(next>=g2) ns=2;
        else if(next>=g1) ns=1;
        if(ns!==s){
          if(ns===1){unlockSecret("monarchStage_1");addLog("Unknown system activity detected.","monarch");}
          if(ns===2){unlockSecret("monarchStage_2");addLog("MONARCH SCAN UPGRADED. Hunter flagged as irregular.","monarch");}
          if(ns===3){unlockSecret("monarchStage_3");addLog("HIDDEN PATH THRESHOLD REACHED.","monarch");}
        }
        return ns;
      });
      return next;
    });
  }

  function maybeTriggerCryptic(stage) {
    if(stage===0||isMonarch||crypticVisible) return;
    const now=Date.now();
    if(now-lastCrypticRef.current<60000) return;
    if(Math.random()>0.35) return;
    lastCrypticRef.current=now;
    const pool=stage>=2?GLITCH_MESSAGES_2:GLITCH_MESSAGES_1;
    setCrypticMessage(pickRandom(pool));
    setCrypticVisible(true);
    if(glitchTimerRef.current)clearTimeout(glitchTimerRef.current);
    setGlitchIntensity(stage>=2?0.8:0.4);
    glitchTimerRef.current=setTimeout(function(){setGlitchIntensity(0);},2000);
    sfx.sfxAlert();
  }

  /* ---- Hidden quests ---- */
  function maybeOfferHiddenQuest() {
    if(activeHiddenQuest) return;
    if(Math.random()>0.5) return;
    const avail=HIDDEN_QUESTS.filter(function(hq){return !seenHiddenIds.includes(hq.id)&&!completedHiddenIds.includes(hq.id);});
    if(avail.length===0) return;
    const chosen=pickRandom(avail);
    setSeenHiddenIds(function(prev){return prev.concat([chosen.id]);});
    setHiddenQuestPending(chosen);
    sfx.sfxSecret();
    addLog("Hidden quest detected: "+chosen.label,"secret");
  }

  function handleHiddenAccept() {
    if(!hiddenQuestPending) return;
    setActiveHiddenQuest(hiddenQuestPending);
    setHiddenQuestProgress({});
    setHiddenQuestPending(null);
    showToast("Hidden Quest accepted","ach");
    addLog("Hidden quest accepted: "+hiddenQuestPending.label+".","ach");
  }

  function handleHiddenDecline() {
    setHiddenQuestPending(null);
    showToast("Hidden quest declined. Gone.","warning");
  }

  function handleHiddenGoalTap(questId, goalId) {
    if(!activeHiddenQuest||activeHiddenQuest.id!==questId) return;
    const goal=activeHiddenQuest.goals.find(function(g){return g.id===goalId;});
    if(!goal||(hiddenQuestProgress[goalId]||0)>=goal.target) return;
    sfx.sfxComplete();
    const next=Object.assign({},hiddenQuestProgress,{[goalId]:goal.target});
    setHiddenQuestProgress(next);
    grantXp(Math.round(activeHiddenQuest.xp/activeHiddenQuest.goals.length),goal.stat,1);
    showToast(goal.name+" complete!","xp");
    if(activeHiddenQuest.goals.every(function(g){return (next[g.id]||0)>=g.target;})){
      const quest=activeHiddenQuest;
      setCompletedHiddenIds(function(prev){return prev.concat([quest.id]);});
      grantXp(quest.xp,quest.statKey,quest.statGain);
      addMonarchInterest(MONARCH_INTEREST_HIDDEN);
      setActiveHiddenQuest(null); setHiddenQuestProgress({});
      unlockSecret("hiddenQuestDone");
      setCinematic({kind:"hidden",title:"HIDDEN QUEST COMPLETE",bigText:quest.label,sub:"The System has recorded this performance.",reward:"+"+quest.xp+" XP · "+quest.statKey+" +"+quest.statGain});
      addLog("Hidden quest completed: "+quest.label+".","secret");
    }
  }

  /* ---- Dungeon gates ---- */
  function handleEnterGate(gate) {
    if(clearedGates[gate.id]) return;
    /* Rank check */
    if(player.level<gate.minLevel) {
      sfx.sfxDenied();
      setCinematic({
        kind:"fail", title:"ACCESS DENIED",
        flavor:"Hunter rank insufficient.",
        bigText:gate.name,
        sub:"Minimum requirement: "+gate.rank+"-Rank (LV "+gate.minLevel+"). Your current rank does not meet the entry threshold for this gate.",
        reward:null,
      });
      addLog("Gate entry denied: "+gate.name+". Rank insufficient.","warning");
      return;
    }
    sfx.sfxOpen();
    if(gate.rooms&&gate.rooms.length>0) { setDungeonChainGate(gate); }
    else { completeDungeon(gate,[]); }
  }

  function completeDungeon(gate, choicesMade, modifier, dungeonEvents) {
    sfx.sfxEvolve();
    const xpMod = (modifier && typeof modifier.xpMod === "number" && isFinite(modifier.xpMod)) ? modifier.xpMod : 1.0;
    const finalXp = Math.round(gate.xp * xpMod);
    addCoins(finalXp);
    addFame(15 + Math.round(finalXp * 0.1));
    if(gate.statKey) grantXp(finalXp,gate.statKey,gate.statGain);
    else { grantXp(finalXp,"Strength",gate.statGain); grantXp(0,"Agility",gate.statGain); grantXp(0,"Endurance",gate.statGain); }
    choicesMade.forEach(function(c){if(c.statKey&&c.statGain)grantXp(0,c.statKey,c.statGain);});
    /* Apply dungeon event rewards */
    (dungeonEvents||[]).forEach(function(ev) {
      if (!ev) return;
      if (ev.xpGain) grantXp(ev.xpGain, ev.statKey||"Strength", ev.statGain||0);
      else if (ev.statKey && ev.statGain) grantXp(0, ev.statKey, ev.statGain);
      if (ev.coinsGain) addCoins(ev.coinsGain);
      if (ev.fameGain)  addFame(ev.fameGain);
      if (ev.shadowLoyalty) setShadowArmy(function(prev){ return prev.map(function(s){ return Object.assign({},s,{loyalty:Math.min(100,(s.loyalty||0)+ev.shadowLoyalty)}); }); });
      if (ev.monarchGain) addMonarchInterest(ev.monarchGain);
      if (ev.loreFrag) collectLore();
    });
    /* Corrupted gate gives monarch interest */
    if (gate.monarchInterestGain) addMonarchInterest(gate.monarchInterestGain);
    addMonarchInterest(MONARCH_INTEREST_DUNGEON);
    setClearedGates(function(prev){
      const next=Object.assign({},prev,{[gate.id]:true});
      if(DUNGEON_GATES.every(function(g){return next[g.id];})) unlockSecret("allGatesCleared");
      return next;
    });
    const modLabel = modifier && modifier.label ? " [" + modifier.label + "]" : "";
    const evCount  = (dungeonEvents||[]).length;
    const rewardLine = gate.reward + (xpMod > 1 ? " · ×" + xpMod + " XP modifier" : "") + (evCount > 0 ? " · +" + evCount + " event bonus" : "");
    setCinematic({kind:gate.cinematic.kind,title:gate.cinematic.title,bigText:gate.cinematic.bigText,sub:gate.cinematic.sub,reward:rewardLine});
    addLog("Dungeon cleared: "+gate.name+modLabel+(evCount?" + "+evCount+" events":"")+".","evolve");
    if (Math.random() < 0.4) collectLore();
    /* Wave 5: monarch item drop from corrupted gate */
    if (gate.type === "corrupted") {
      const drop = rollMonarchDrop("corrupted_gate");
      if (drop) {
        setInventory(function(prev){ return prev.includes(drop.id)?prev:prev.concat([drop.id]); });
        if (drop.statKey && drop.statGain) grantXp(0, drop.statKey, drop.statGain);
        if (drop.monarchGain) addMonarchInterest(drop.monarchGain);
        setTimeout(function(){
          showToast("MONARCH ITEM: " + drop.name + " obtained!", "evolve");
          addLog("Monarch item obtained from corrupted gate: "+drop.name+".","evolve");
        }, 2200);
      }
    }
  }

  /* ---- Boss attacks ---- */
  function handleBossAttack(bossIndex, approach) {
    const boss=bosses[bossIndex]; const data=BOSS_DATA[bossIndex];
    if(!boss||boss.currentHp<=0||totalQuestGoalsCleared<1) return;

    /* Rank gate */
    if(player.level<boss.minLevel) {
      sfx.sfxDenied();
      setAccessDeniedBoss(Object.assign({},data,{minLevel:boss.minLevel,minRankName:data.minRankName,survivalChance:data.survivalChance}));
      addLog("Boss access denied: "+boss.name+". Rank insufficient.","warning");
      return;
    }

    /* Approach modifier */
    const safeApproach = approach || { id:"balanced", xpMod:1.0, survivalMod:0, label:"Balanced" };
    const xpBonus = safeApproach.xpMod || 1.0;

    sfx.sfxBoss();
    setBosses(function(prev){
      const next=prev.map(function(b,i){return i===bossIndex?Object.assign({},b,{currentHp:Math.max(0,b.currentHp-1)}):b;});
      const updated=next[bossIndex];
      if(updated.currentHp<=0){
        sfx.sfxRankUp();
        addLog("Boss defeated: "+boss.name+". Initiating ARISE sequence.","evolve");
        /* Performance ranking */
        const score = calcRaidScore(safeApproach.id, totalQuestGoalsCleared, shadowArmy.length);
        const raidRank = getRaidRank(score);
        const fameBonus = Math.round(20 * raidRank.fameMod);
        addFame(fameBonus);
        setTimeout(function(){
          setCinematicAch({ title:raidRank.label+" PERFORMANCE", sub:"Score: "+score+"/100. Fame +" + fameBonus + " awarded.", color:raidRank.color, icon:"⚔" });
        }, 2200);
        /* Trigger ARISE */
        setTimeout(function(){ setAriseTarget({bossIndex,bossData:data}); setAriseAttempt(1); },800);
        if(next.every(function(b){return b.currentHp<=0;})) unlockSecret("allBossesDefeated");
      } else {
        const hpLeft = updated.currentHp;
        showToast(boss.name+" — "+hpLeft+" HP remaining ("+safeApproach.label+")","warning");
        /* Extra XP for hits on aggressive approach */
        if (xpBonus > 1) grantXp(Math.round(5 * xpBonus), "Strength", 0);
      }
      return next;
    });
  }

  /* ---- Secret boss attack ---- */
  function handleSecretBossAttack(bossId) {
    const boss = SECRET_BOSS_DATA.find(function(b){ return b.id === bossId; });
    if (!boss || totalQuestGoalsCleared < 1) return;
    const state = secretBossStates[bossId] || { currentHp: boss.hp, maxHp: boss.hp };
    if (state.currentHp <= 0) return;

    /* Rank check */
    if (player.level < boss.minLevel) {
      sfx.sfxDenied();
      setAccessDeniedBoss(Object.assign({}, boss, { minRankName: getRankForLevel(boss.minLevel).name }));
      return;
    }

    sfx.sfxBoss();
    const nextHp = Math.max(0, state.currentHp - 1);
    setSecretBossStates(function(prev) {
      return Object.assign({}, prev, { [bossId]: { currentHp: nextHp, maxHp: boss.hp } });
    });

    if (nextHp <= 0) {
      sfx.sfxRankUp();
      addLog("Secret boss defeated: " + boss.name + ". ARISE initiated.","evolve");
      setTimeout(function() {
        setAriseTarget({ bossIndex: -1, bossData: boss }); /* -1 = secret boss */
        setAriseAttempt(1);
      }, 800);
    } else {
      showToast(boss.name + " — " + nextHp + " HP remaining", "warning");
    }
  }

  /* ---- ARISE system ---- */
  function handleAriseSuccess() {
    if(!ariseTarget) return;
    const data=ariseTarget.bossData;
    grantXp(data.xp,data.statKey,data.statGain);
    addCoins(data.xp);
    addFame(25);
    addMonarchInterest(MONARCH_INTEREST_BOSS);
    unlockSecret("shadowExtracted");
    const shadowRecord = buildShadowRecord(data);
    setShadowArmy(function(prev) { return prev.concat([shadowRecord]); });
    setAriseTarget(null); setAriseAttempt(1);
    setCinematic({kind:"boss",title:"ARISE",flavor:"The shadow has yielded.",bigText:data.shadow?data.shadow.name:data.name,sub:data.dialogue.defeat,reward:"+"+data.xp+" XP · Shadow extracted · "+data.statKey+" +"+data.statGain,bossColor:data.color});
    addLog("Shadow extracted: "+data.name+". ARISE successful.","evolve");
    collectLore();
    /* Wave 5: monarch item drop from secret boss defeat */
    const drop = rollMonarchDrop("secret_boss");
    if (drop) {
      setInventory(function(prev){ return prev.includes(drop.id)?prev:prev.concat([drop.id]); });
      if (drop.statKey && drop.statGain) grantXp(0, drop.statKey, drop.statGain);
      if (drop.monarchGain) addMonarchInterest(drop.monarchGain);
      if (drop.shadowLoyalty) setShadowArmy(function(prev){ return prev.map(function(s){return Object.assign({},s,{loyalty:Math.min(100,(s.loyalty||0)+drop.shadowLoyalty)});}); });
      setTimeout(function(){
        showToast("MONARCH ITEM: " + drop.name + " obtained!", "evolve");
        addLog("Monarch item obtained: "+drop.name+".","evolve");
      }, 2800);
    }
  }

  function handleAriseFail() {
    if(!ariseTarget) return;
    const next=ariseAttempt+1;
    if(next>3){
      sfx.sfxDefeat();
      setAriseTarget(null); setAriseAttempt(1);
      setCinematic({kind:"fail",title:"ARISE FAILED",bigText:"Shadow Lost",flavor:"Three attempts exhausted.",sub:"The shadow of "+ariseTarget.bossData.name+" has dissipated. It may return much later, or not at all.",reward:null});
      addLog("ARISE failed 3 times. "+ariseTarget.bossData.name+"'s shadow dissipated.","warning");
      /* Mark shadow as permanently lost for this session */
      setBosses(function(prev){return prev.map(function(b,i){return i===ariseTarget.bossIndex?Object.assign({},b,{shadowLost:true}):b;});});
    } else {
      sfx.sfxDefeat();
      setAriseAttempt(next);
      showToast("Attempt failed. "+  (3-next+1)+" remaining.","warning");
    }
  }

  function handleAriseAbandon() {
    setAriseTarget(null); setAriseAttempt(1);
    showToast("Extraction abandoned. Attempt not consumed.","info");
  }

  /* ---- Daily quest ---- */
  function handleGoalTap(goalId) {
    if(isDailyDone) return;
    const goal=dailyQuest.goals.find(function(g){return g.id===goalId;});
    if(!goal||(dailyProgress[goalId]||0)>=goal.target) return;
    sfx.sfxComplete();
    const next=Object.assign({},dailyProgress,{[goalId]:goal.target});
    setDailyProgress(next);
    grantXp(Math.round(dailyQuest.xp/dailyQuest.goals.length),goal.stat,1);
    showToast(goal.name+" complete!","xp");
    addMonarchInterest(MONARCH_INTEREST_PER_DAILY/dailyQuest.goals.length);
    if(dailyQuest.goals.every(function(g){return (next[g.id]||0)>=g.target;})){
      setIsDailyDone(true);
      grantXp(50,"Discipline",2);
      /* Phase 4: coins reward */
      addCoins(75);
      addFame(10); /* System 4: +10 fame per daily clear */
      /* Phase 4: reward chest — 3 random options */
      setRewardChest([rollChestReward(), rollChestReward(), rollChestReward()]);
      /* Phase 4: +3 stat points */
      setPendingStatPoints(3);
      setPlayer(function(prev){
        const newStreak=prev.streak+1;
        if(newStreak===3){addMonarchInterest(MONARCH_INTEREST_STREAK_3);showToast("3-Day Streak!","ach");
          setTimeout(function(){if(Math.random()<0.06)setTakeoverEvent(rollTakeoverEvent("streak"));},4000);
        }
        if(newStreak===7){addMonarchInterest(MONARCH_INTEREST_STREAK_7);unlockSecret("streak_7");showToast("7-Day Streak! The system has taken notice.","ach");
          setTimeout(function(){setTakeoverEvent(rollTakeoverEvent("streak"));},4000);
        }
        return Object.assign({},prev,{streak:newStreak});
      });
      addMonarchInterest(MONARCH_INTEREST_PER_DAILY);
      showToast("DAILY QUEST CLEARED!","evolve");
      addLog("Daily quest cleared. Streak extended.","evolve");
      /* Phase 3: Shadows gain +5 loyalty on daily clear */
      setShadowArmy(function(prev) {
        return prev.map(function(s) {
          return Object.assign({}, s, { loyalty: Math.min(100, (s.loyalty||0) + 5) });
        });
      });
      setTimeout(function(){maybeTriggerCryptic(monarchStage);},3000);
      setTimeout(function(){maybeOfferHiddenQuest();},5000);
      maybeRollRandomEvent();
      /* Wave 3: world event + awakening day */
      setTimeout(function(){ maybeStartWorldEvent(); },8000);
      maybeActivateAwakeningDay();
    }
  }

  /* ---- Side quests ---- */
  function handleSideGoalTap(qi, goalId) {
    if(sideDone[qi]) return;
    const quest=SIDE_QUESTS[qi]; if(!quest) return;
    const goal=quest.goals.find(function(g){return g.id===goalId;});
    if(!goal) return;
    const qp=sideProgress[qi]||{};
    if((qp[goalId]||0)>=goal.target) return;
    sfx.sfxComplete();
    const nextQP=Object.assign({},qp,{[goalId]:goal.target});
    setSideProgress(function(prev){return prev.map(function(p,i){return i===qi?nextQP:p;});});
    grantXp(Math.round(quest.xp/quest.goals.length),goal.stat,1);
    showToast(goal.name+" complete!","xp");
    addMonarchInterest(MONARCH_INTEREST_PER_SIDE);
    if(quest.goals.every(function(g){return (nextQP[g.id]||0)>=g.target;})){
      setSideDone(function(prev){return prev.map(function(d,i){return i===qi?true:d;});});
      showToast(quest.label+" cleared! +"+quest.xp+" XP","xp");
      addMonarchInterest(MONARCH_INTEREST_PER_SIDE*2);
    }
  }

  /* ---- Extended side quest handler ---- */
  function handleExtSideGoalTap(questId, goalId) {
    if (extSideDone[questId]) return;
    const quest = EXTENDED_QUEST_POOL.find(function(q){ return q.id===questId; });
    if (!quest) return;
    const goal = quest.goals.find(function(g){ return g.id===goalId; });
    if (!goal) return;
    const qp = extSideProgress[questId] || {};
    if ((qp[goalId]||0) >= goal.target) return;

    sfx.sfxComplete();
    const nextQP = Object.assign({}, qp, { [goalId]: goal.target });
    setExtSideProgress(function(prev){ return Object.assign({}, prev, { [questId]: nextQP }); });

    /* Per-goal XP */
    const perGoalXp = Math.max(5, Math.round((quest.xp * SQ_RARITY[quest.rarity].xpMod) / quest.goals.length));
    grantXp(perGoalXp, goal.stat, 0);
    showToast(goal.name + " complete!", "xp");
    addMonarchInterest(MONARCH_INTEREST_PER_SIDE);

    /* Check quest completion */
    if (quest.goals.every(function(g){ return (nextQP[g.id]||0) >= g.target; })) {
      setExtSideDone(function(prev){ return Object.assign({}, prev, { [questId]: true }); });

      /* Full quest completion bonuses */
      const finalXp = Math.max(10, Math.round(quest.xp * SQ_RARITY[quest.rarity].xpMod));
      grantXp(finalXp, quest.statKey||"Discipline", quest.statGain||1);
      addCoins(quest.coins||0);
      if (quest.energyGain) setEnergyScore(function(prev){ return Math.min(100, prev + quest.energyGain); });
      if (quest.shadowLoyaltyGain) {
        setShadowArmy(function(prev){ return prev.map(function(s){ return Object.assign({},s,{loyalty:Math.min(100,(s.loyalty||0)+quest.shadowLoyaltyGain)}); }); });
      }
      if (quest.monarchInterestGain) addMonarchInterest(quest.monarchInterestGain);
      addFame(Math.round((quest.coins||10)*0.1));
      showToast(quest.label + " cleared! +" + finalXp + " XP", "evolve");
      addLog("Extended quest cleared: " + quest.label + ".","evolve");
      /* 25% chance to drop lore on completion */
      if (Math.random() < 0.25) collectLore();
    }
  }

  /* ---- Anomaly quest completion handler ---- */
  function handleAnomalyComplete(questId) {
    if (anomalyDone[questId]) return;
    const quest = ANOMALY_QUEST_POOL.find(function(q){ return q.id===questId; });
    if (!quest) return;
    const rc = SQ_RARITY[quest.rarity] || SQ_RARITY.COMMON;

    sfx.sfxComplete();
    setAnomalyProgress(function(prev){ return Object.assign({},prev,{[questId]:true}); });
    setAnomalyDone(function(prev){ return Object.assign({},prev,{[questId]:true}); });

    /* Anti-repetition: add to recent list, keep last 15 */
    setRecentAnomalyIds(function(prev){
      return [questId].concat(prev).slice(0,15);
    });

    /* Rewards */
    const finalXp = Math.max(10, Math.round((quest.xp||60) * rc.xpMod));
    grantXp(finalXp, "Discipline", 1);
    addCoins(quest.coins||0);
    addFame(quest.fame||5);
    if (quest.shadowLoyaltyGain) {
      setShadowArmy(function(prev){
        return prev.map(function(s){ return Object.assign({},s,{loyalty:Math.min(100,(s.loyalty||0)+quest.shadowLoyaltyGain)}); });
      });
    }
    if (quest.monarchInterestGain) addMonarchInterest(quest.monarchInterestGain);
    if (Math.random() < 0.3) collectLore(); /* 30% lore drop */

    sfx.sfxLevelUp();
    showToast(quest.title + " — Mission Complete! +" + finalXp + " XP", "evolve");
    addLog("Anomaly quest completed: " + quest.title + ".","evolve");
  }

  /* ---- Monarch trial handlers ---- */
  function handleCrypticDismiss() {
    setCrypticVisible(false);
    if(monarchStage===3&&!trialOpen&&!isMonarch){
      unlockSecret("trialOffered");
      setTimeout(function(){
        setTrialProgress({}); setTrialOpen(true);
        setGlitchIntensity(1);
        setTimeout(function(){setGlitchIntensity(0.3);},1500);
        setTimeout(function(){setGlitchIntensity(0);},3000);
      },600);
    }
  }

  function handleTrialGoalTap(goalId) {
    const goal=MONARCH_TRIAL_GOALS.find(function(g){return g.id===goalId;}); if(!goal) return;
    if((trialProgress[goalId]||0)>=goal.target) return;
    const next=Object.assign({},trialProgress,{[goalId]:goal.target});
    setTrialProgress(next); sfx.sfxComplete();
    grantXp(10,goal.stat,1);
    if(MONARCH_TRIAL_GOALS.every(function(g){return (next[g.id]||0)>=g.target;})){
      sfx.sfxEvolve(); addLog("MONARCH TRIAL COMPLETE. Reawakening initiated.","monarch");
      setTimeout(function(){setTrialOpen(false);setReawakeningActive(true);},2000);
    }
  }

  function handleTrialForfeit() {
    setTrialOpen(false); setTrialProgress({}); setTrialFailed(true);
    setMonarchInterest(10); setMonarchStage(0);
    sfx.sfxDefeat(); unlockSecret("trialForfeited");
    showToast("The Monarch path has vanished. It is watching.","glitch");
    addLog("Monarch Trial forfeited. The path has receded.","warning");
    lastCrypticRef.current=0;
  }

  function handleReawakeningComplete() {
    setReawakeningActive(false); setIsMonarch(true); setMonarchStage(0);
    sfx.sfxEvolve(); unlockSecret("monarchAwakened");
    setPlayer(function(prev){
      const stats=Object.assign({},prev.stats);
      STAT_KEYS.forEach(function(k){stats[k]=(stats[k]||0)+20;});
      stats.Aura=(stats.Aura||0)+50;
      return Object.assign({},prev,{stats,job:"Shadow Monarch"});
    });
    grantXp(500,"Aura",10);
    showToast("MONARCH AWAKENING COMPLETE","evolve",true);
    addLog("MONARCH AUTHORITY CONFIRMED.","monarch");
  }

  /* ---- Onboarding complete ---- */
  function handleOnboardComplete(data) {
    /* CRITICAL: data has `startLevel` from computeEvaluation.
       Player state expects `level`. Map it here so player.level is
       always a finite number — prevents xpForLevel(undefined) → NaN. */
    const safeLevel = (typeof data.startLevel === "number" && isFinite(data.startLevel))
      ? data.startLevel
      : 1;
    const safeStats = data.stats && typeof data.stats === "object"
      ? data.stats
      : { Strength:10, Agility:10, Endurance:10, Discipline:10, Intelligence:10, Recovery:10, Aura:5 };

    setPlayer({
      name:        data.name       || "Hunter",
      level:       safeLevel,
      xp:          0,
      streak:      0,
      job:         data.hunterClass || "fighter",
      physique:    data.physique   || "hybrid",
      goals:       Array.isArray(data.goals) ? data.goals : [],
      activeTitle: "awakened",
      stats:       safeStats,
    });
    sfx.sfxOpen();
    addLog(
      "Hunter " + (data.name||"Hunter") + " registered. Class: " + (data.hunterClass||"fighter") +
      ". Starting rank: " + getRankForLevel(safeLevel).name + ".",
      "system"
    );
    setPhase("app");
  }

  /* ---- Visual evolution by rank (all declarations in dependency order) ---- */
  const rankIdx         = rank ? (rank.minRankIndex || 0) : 0;
  const gridAlpha       = isMonarch ? "0.06" : (0.02 + rankIdx * 0.005).toFixed(3);
  const gridLineColor   = isMonarch
    ? "rgba(155,48,255," + gridAlpha + ")"
    : rankIdx >= 5 ? "rgba(245,182,93," + gridAlpha + ")"
    : rankIdx >= 4 ? "rgba(160,93,245," + gridAlpha + ")"
    : rankIdx >= 3 ? "rgba(93,124,245," + gridAlpha + ")"
    : "rgba(77,184,255," + gridAlpha + ")";
  const particleDensity = isMonarch ? 120 : 40 + rankIdx * 10;
  const particleColor   = isMonarch
    ? "rgba(155,48,255,0.75)"
    : rankIdx >= 5 ? "rgba(245,182,93,0.6)"
    : rankIdx >= 4 ? "rgba(160,93,245,0.6)"
    : rankIdx >= 3 ? "rgba(93,124,245,0.55)"
    : rankIdx >= 2 ? "rgba(77,184,255,0.5)"
    : rank ? (rank.glow || "rgba(77,184,255,0.45)") : "rgba(77,184,255,0.45)";
  const bgGrad          = isMonarch
    ? "radial-gradient(ellipse at 50% 0%,#1a0030 0%," + MONARCH_DARK + " 55%,#000 100%)"
    : rankIdx >= 5
      ? "radial-gradient(ellipse at 50% 0%,#1a1000 0%,#080500 55%,#000 100%)"
      : rankIdx >= 3
        ? "radial-gradient(ellipse at 50% 0%,#0a0d28 0%,#050818 55%,#020410 100%)"
        : "radial-gradient(ellipse at 50% 0%,#0a1428 0%,#050a16 55%,#02040a 100%)";

  /* ---- System 5: Environmental theme overlay ---- */
  /* Wave 4: Monarch corruption — computed from monarchInterest + rank */
  const corruptionLevel = Math.min(1, ((monarchInterest||0)/100)*0.6 + (rankIdx>=5?0.3:rankIdx>=4?0.15:0));

  const envTheme = (function() {
    const safeEnergy = (typeof energyScore === "number" && isFinite(energyScore)) ? energyScore : 68;
    if (isMonarch)              return { overlay:"rgba(155,48,255,0.06)", glow:MONARCH_PURP+"33" };
    /* Wave 4: Monarch corruption overlay — gets more intense with interest */
    if (corruptionLevel>0.7)    return { overlay:"rgba(155,48,255,0.05)", glow:MONARCH_PURP+"28" };
    if (glitchIntensity>0.5)    return { overlay:"rgba(255,34,68,0.04)", glow:GLITCH_RED+"22" };
    if (dungeonChainGate)       return { overlay:"rgba(245,61,61,0.03)", glow:"rgba(245,61,61,0.15)" };
    if (awakeningDay)           return { overlay:"rgba(46,232,138,0.03)", glow:"rgba(46,232,138,0.10)" };
    if (worldEvent && worldEvent.id==="we_corrupted") return { overlay:"rgba(255,34,68,0.03)", glow:GLITCH_RED+"18" };
    if (worldEvent && worldEvent.id==="we_shadow_surge") return { overlay:"rgba(155,48,255,0.03)", glow:MONARCH_PURP+"18" };
    if (worldEvent && worldEvent.id==="we_double_xp") return { overlay:"rgba(46,232,138,0.02)", glow:"rgba(46,232,138,0.08)" };
    if (safeEnergy < 30)        return { overlay:"rgba(245,182,93,0.04)", glow:null };
    if (rankIdx >= 5)           return { overlay:"rgba(245,182,93,0.02)", glow:"rgba(245,182,93,0.08)" };
    if (rankIdx >= 4)           return { overlay:"rgba(160,93,245,0.02)", glow:null };
    return null;
  })();

  /* ---- ONBOARDING ---- */
  if(phase==="onboard"){
    return (<div style={{ minHeight:"100vh",background:bgGrad,color:"#c8e8ff",fontFamily:"'Oxanium','Rajdhani',sans-serif" }}><AwakeningRegistration onComplete={handleOnboardComplete} /></div>);
  }

  /* ---- MAIN APP ---- */
  return (
    <div style={{ minHeight:"100vh",background:bgGrad,color:"#c8e8ff",fontFamily:"'Oxanium','Rajdhani',sans-serif",position:"relative",transition:"background 2.5s ease" }}>
      <ParticleField color={particleColor} density={particleDensity} />
      {isMonarch&&<div style={{ position:"fixed",inset:0,zIndex:0,pointerEvents:"none",background:"radial-gradient(ellipse at center,transparent 40%,rgba(155,48,255,0.10) 100%)" }} />}
      {/* Circuit-board grid — tighter, more SL-like */}
      <div style={{ position:"fixed",inset:0,zIndex:0,pointerEvents:"none",backgroundImage:"linear-gradient("+gridLineColor+" 1px,transparent 1px),linear-gradient(90deg,"+gridLineColor+" 1px,transparent 1px)",backgroundSize:"44px 44px" }} />
      {/* Environmental theme overlay */}
      {envTheme&&<div style={{ position:"fixed",inset:0,zIndex:0,pointerEvents:"none",background:envTheme.overlay,boxShadow:envTheme.glow?"inset 0 0 120px "+envTheme.glow:"none",transition:"background 2s ease,box-shadow 2s ease" }} />}
      <GlitchOverlay intensity={glitchIntensity} />
      {levelUpFx&&<LevelUpOverlay key={levelUpFx.id} level={levelUpFx.level} accent={accentColor} onDone={function(){setLevelUpFx(null);}} />}
      {rankUpFx&&<RankUpOverlay key={rankUpFx.id} rank={rankUpFx.rank} onDone={function(){setRankUpFx(null);}} />}

      <div style={{ position:"relative",zIndex:1 }}>
        <TopHud player={player} rank={rank} onMenuToggle={function(){setMenuOpen(function(m){return !m;});}} menuOpen={menuOpen} isMonarch={isMonarch} />
        {menuOpen&&<Sidebar activeView={activeView} onSelect={setActiveView} onClose={function(){setMenuOpen(false);sfx.sfxClick();}} ac={rank.color} playerName={player.name} isMonarch={isMonarch} />}

        <div style={{ maxWidth:860,margin:"0 auto",padding:"28px 16px 80px" }}>
          {activeView==="Dashboard"&&<DashboardView player={player} rank={rank} dailyProgress={dailyProgress} isDailyDone={isDailyDone} onGoalTap={handleGoalTap} isMonarch={isMonarch} dailyQuest={dailyQuest} activeHiddenQuest={activeHiddenQuest} hiddenQuestProgress={hiddenQuestProgress} onHiddenGoalTap={handleHiddenGoalTap} energyScore={energyScore} onReset={handleDailyReset} fame={fame} worldEvent={worldEvent} awakeningDay={awakeningDay} />}
          {activeView==="Daily Quest"&&(
            <div className="fade-in">
              <SL text="Daily Quest" ac={accentColor} />
              {activeHiddenQuest&&<HiddenQuestCard quest={activeHiddenQuest} progress={hiddenQuestProgress} onGoalTap={handleHiddenGoalTap} ac={accentColor} />}
              <QuestCard quest={dailyQuest} progress={dailyProgress} isDone={isDailyDone} onGoalTap={handleGoalTap} ac={accentColor} />
            </div>
          )}
          {activeView==="Side Quests"&&<SideQuestsView rank={rank} sideProgress={sideProgress} sideDone={sideDone} onSideGoalTap={handleSideGoalTap} isMonarch={isMonarch} extSideProgress={extSideProgress} extSideDone={extSideDone} onExtGoalTap={handleExtSideGoalTap} player={player} energyScore={energyScore} fame={fame} guildId={guildId} anomalyDone={anomalyDone} onAnomalyComplete={handleAnomalyComplete} recentAnomalyIds={recentAnomalyIds} />}
          {activeView==="Hunter Stats"&&<StatsView player={player} rank={rank} isMonarch={isMonarch} onSelectTitle={handleSetTitle} clearedGates={clearedGates} />}
          {activeView==="Hunter Profile"&&<HunterIdentityView player={player} rank={rank} isMonarch={isMonarch} fame={fame} shadowArmy={shadowArmy} bosses={bosses} clearedGates={clearedGates} earnedAchievements={earnedAchievements} guildId={guildId} accentColor={accentColor} />}
          {activeView==="Guild"&&<GuildView player={player} fame={fame} guildId={guildId} guildQuestProgress={guildQuestProgress} guildQuestDone={guildQuestDone} onGoalTap={handleGuildGoalTap} onLeave={handleLeaveGuild} accentColor={accentColor} />}
          {activeView==="Specialization"&&<SpecializationView player={player} unlockedSpecs={unlockedSpecs} onUnlock={handleUnlockSpec} accentColor={accentColor} />}
          {activeView==="Dungeon Gates"&&<DungeonGatesView rank={rank} isMonarch={isMonarch} clearedGates={clearedGates} onEnterGate={handleEnterGateWithCutscene} ac={accentColor} player={player} energyScore={energyScore} />}
          {activeView==="Boss Raids"&&<BossRaidsView bosses={bosses} bossData={BOSS_DATA} onAttack={handleBossAttack} ac={accentColor} questGoalsCleared={totalQuestGoalsCleared} inventory={inventory} shadowArmy={shadowArmy} />}
          {activeView==="Secret Encounters"&&<SecretBossesView player={player} clearedGates={clearedGates} streak={player.streak} secretBosses={secretBossStates} onAttack={handleSecretBossAttack} accentColor={accentColor} questGoalsCleared={totalQuestGoalsCleared} />}
          {activeView==="Shadow Archive"&&<ShadowArchiveView bosses={bosses} bossData={BOSS_DATA} ac={accentColor} />}
          {activeView==="Shadow Army"&&<ShadowArmyView shadowArmy={shadowArmy} bosses={bosses} bossData={BOSS_DATA} accentColor={accentColor} onRename={handleShadowRename} onFavorite={handleToggleShadowFavorite} activeMissions={shadowMissions} onDispatchMission={handleDispatchMission} onCompleteMission={handleCompleteMission} squads={shadowSquads} onAddToSquad={handleAddToSquad} />}
          {activeView==="Inventory"&&<InventoryView inventory={inventory} keys={dungeonKeys} coins={coins} onUseKey={handleUseKey} accentColor={accentColor} />}
          {activeView==="Hunter Shop"&&<HunterShopView coins={coins} inventory={inventory} onBuy={handleBuyItem} accentColor={accentColor} isMonarch={isMonarch} />}
          {activeView==="Energy"&&<EnergyView energyState={energyState} onUpdate={handleEnergyUpdate} accentColor={accentColor} />}
          {activeView==="System Log"&&<SystemLogView logs={systemLog} ac={accentColor} secretAchievements={secretAchievements} collectedLoreIds={collectedLoreIds} earnedAchievements={earnedAchievements} />}
          {activeView==="Settings"&&<SettingsView rank={rank} soundOn={soundOn} onToggleSound={function(){setSoundOn(function(s){return !s;});}} isMonarch={isMonarch} playerLevel={player.level} ascensionCount={ascensionCount} onAscend={handleAscension} />}
        </div>

        {/* DEV: Monarch interest only — no free XP */}
        <div style={{ position:"fixed",bottom:12,right:12,zIndex:8000,display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4 }}>
          {/* System 7: Notification history tray — last 3 */}
          {notifHistory.slice(0,3).map(function(n,i){
            const nc = n.kind==="evolve"?"#2ee88a":n.kind==="ach"?"#a05df5":n.kind==="warning"?"#f5b65d":n.kind==="xp"?"#f5b65d":"#5b7aa0";
            return (
              <div key={i} style={{ fontSize:9,padding:"2px 8px",border:"1px solid "+nc+"33",background:"rgba(5,10,20,0.85)",color:nc+"88",maxWidth:180,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontFamily:"monospace",pointerEvents:"none",opacity:Math.max(0.2,1-i*0.3) }}>
                {n.message}
              </div>
            );
          })}
          <button onClick={function(){addMonarchInterest(10);maybeTriggerCryptic(monarchStage<1?1:monarchStage);}} style={{ background:"rgba(155,48,255,0.1)",border:"1px solid #9b30ff33",color:"#9b30ff55",fontSize:9,padding:"4px 8px",cursor:"pointer",fontFamily:"monospace" }} title="DEV: +interest">+mi</button>
        </div>
      </div>

      {/* Overlays */}
      {/* Phase 4 overlays */}
      {cutsceneGate&&<DungeonCutscene gate={cutsceneGate} onEnter={function(){const g=cutsceneGate;setCutsceneGate(null);if(g.rooms&&g.rooms.length>0){setDungeonChainGate(g);}else{completeDungeon(g,[]);}}} onAbort={function(){setCutsceneGate(null);showToast("Gate entry withdrawn.","info");}} />}
      {rewardChest&&pendingStatPoints===0&&<RewardChestModal rewards={rewardChest} onClaim={handleChestClaim} accentColor={accentColor} />}
      {pendingStatPoints>0&&!rewardChest&&<StatPointDistributor points={pendingStatPoints} onConfirm={handleStatPointConfirm} accentColor={accentColor} />}
      {/* Wave 4: Guild recruitment */}
      {guildRecruitOffer&&<GuildRecruitmentPopup guild={guildRecruitOffer} onJoin={handleJoinGuild} onDecline={function(){setGuildRecruitOffer(null);showToast("Guild offer declined.","info");}} />}
      {/* Wave 3: Breakthrough + Cinematic Achievement */}
      {breakthroughPending&&<BreakthroughModal quest={breakthroughPending} onComplete={handleBreakthroughComplete} onDismiss={function(){}} />}
      {cinematicAch&&<CinematicAchievementOverlay achievement={cinematicAch} onDone={function(){setCinematicAch(null);}} />}
      {/* System 2: Streak protection */}
      {streakProtectActive&&<StreakProtectionModal streak={player.streak} onPreserve={handleStreakPreserve} onDecline={handleStreakDecline} />}
      {/* System 6: Takeover events */}
      {takeoverEvent&&<SystemTakeoverOverlay event={takeoverEvent} onDone={function(){setTakeoverEvent(null);}} />}
      {/* Phase 2: Random events */}
      {randomEventPending&&<RandomEventPopup event={randomEventPending} onAccept={handleRandomEventAccept} onDismiss={handleRandomEventDismiss} />}
      {cinematic&&<CinematicPopup data={cinematic} onClose={function(){setCinematic(null);}} sfx={sfx} />}
      {hiddenQuestPending&&<HiddenQuestPopup quest={hiddenQuestPending} onAccept={handleHiddenAccept} onDecline={handleHiddenDecline} />}
      {cutsceneGate&&<DungeonCutscene gate={cutsceneGate} onEnter={function(){const g=cutsceneGate; const mod=rollDungeonModifier(); setActiveModifier(mod); setCutsceneGate(null); if(mod.label){showToast("Modifier: "+mod.label,"warning");} if(g.rooms&&g.rooms.length>0){setDungeonChainGate(g);}else{completeDungeon(g,[],mod);}}} onAbort={function(){setCutsceneGate(null);setActiveModifier(null);showToast("Gate entry withdrawn.","info");}} />}
      {dungeonChainGate&&<DungeonChain gate={dungeonChainGate} modifier={activeModifier} onComplete={function(choices,mod,events){setDungeonChainGate(null);completeDungeon(dungeonChainGate,choices,mod||activeModifier,events||[]);setActiveModifier(null);}} onAbandon={function(){setDungeonChainGate(null);setActiveModifier(null);showToast("Dungeon abandoned.","warning");}} sfx={sfx} />}
      {accessDeniedBoss&&<AccessDeniedScreen boss={accessDeniedBoss} playerRank={rank} onClose={function(){setAccessDeniedBoss(null);}} />}
      {ariseTarget&&<AriseScreen boss={ariseTarget.bossData} attemptNumber={ariseAttempt} onSuccess={handleAriseSuccess} onFail={handleAriseFail} onAbandon={handleAriseAbandon} sfx={sfx} />}
      {crypticVisible&&<CrypticNote message={crypticMessage} onDismiss={handleCrypticDismiss} />}
      {trialOpen&&<MonarchTrialScreen progress={trialProgress} onGoalTap={handleTrialGoalTap} onForfeit={handleTrialForfeit} />}
      {reawakeningActive&&<ReawakeningSequence playerName={player.name} onComplete={handleReawakeningComplete} />}
      {toast!==null&&<Toast message={toast.message} kind={toast.kind} ac={accentColor} isMonarch={toast.monarch} />}
    </div>
  );
}

export default function SystemInterface() {
  return (<ErrorBoundary><StyleTag /><App /></ErrorBoundary>);
}
