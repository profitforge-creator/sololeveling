/**
 * ARISE — Daily Routine System
 * Four routine chains (Morning / Athletic / Evening / Night), adaptively
 * built from profile + energy + weekday focus. Completion feeds the
 * free-time economy and routine streak.
 */
import { DAY_FOCUS } from "./athletics.js";

export const ROUTINE_DEFS = [
  { id: "morning", name: "Morning Protocol", icon: "☀", window: "06:30 – 09:00", color: "#f5b65d",
    desc: "Wake sequence. Hydrate, mobilize, check in, aim the day." },
  { id: "athletic", name: "Athletic Protocol", icon: "⚡", window: "10:00 – 18:00", color: "#4db8ff",
    desc: "The training block. Structure comes from today's Gate focus." },
  { id: "evening", name: "Evening Protocol", icon: "◈", window: "18:00 – 21:30", color: "#a05df5",
    desc: "Build block. Business, learning, environment reset, plan." },
  { id: "night", name: "Night Protocol", icon: "☾", window: "21:30 – 22:30", color: "#6f8bd8",
    desc: "Shutdown sequence. Screens down, body down, lights out by target." },
];

/**
 * Build today's adaptive steps for a routine.
 * Returns [{ id, name, detail }].
 */
export function buildRoutineSteps(routineId, profile, energyState, energyScore, dailyDayType) {
  const p = profile || {};
  const sleepTarget = p.sleepTarget || "22:30";
  const wakeTarget  = p.wakeTarget || "06:30";
  const e = energyState || {};
  const lowEnergy = (typeof energyScore === "number" ? energyScore : 68) < 40;
  const sore = (e.soreness || 0) >= 5;
  const dow = new Date().getDay();
  const focus = DAY_FOCUS[dow] || DAY_FOCUS[1];

  if (routineId === "morning") {
    return [
      { id: "wake",      name: "Wake by " + wakeTarget,            detail: "Feet on floor within 5 minutes of alarm." },
      { id: "hydrate",   name: "Hydrate (500ml)",                   detail: "Water before any screen." },
      { id: "mobility",  name: "5-min Light Mobility",              detail: sore ? "You reported soreness — extra 2 min on tight areas." : "Neck, hips, ankles. Wake the joints." },
      { id: "checkin",   name: "Energy Check-in",                   detail: "Log sleep/soreness/fatigue in the Energy scanner. The System recalibrates today from it." },
      { id: "review",    name: "Review Daily Quests",               detail: "Read today's Gate assignment and the reason it was chosen." },
      { id: "focus_task", name: "One Small Focus Task (10 min)",    detail: "One meaningful task before consumption. Sets the day's tone." },
      { id: "fuel",      name: "Breakfast / Fuel",                  detail: "Protein anchor. Training day: don't skip." },
    ];
  }
  if (routineId === "athletic") {
    const steps = [
      { id: "warmup",   name: "Sprint Warm-up",   detail: "Jog, leg swings, skips. Non-negotiable before intensity." },
      { id: "session",  name: "Clear today's " + focus.label, detail: "Full session lives in Daily Quest. Quality > volume." },
      { id: "cooldown", name: "Cooldown + Easy Stretch", detail: "5 min down-shift. Ends the session properly." },
      { id: "log",      name: "Log Soreness / Performance Notes", detail: "Times, reps, how it felt. The System learns from this." },
    ];
    if (lowEnergy || focus.id === "rest" || focus.id === "recovery" || dailyDayType === "recovery") {
      steps[1] = { id: "session", name: "Recovery Session (walk / mobility / core)", detail: "Intensity sealed today. Restore, don't drain." };
    }
    return steps;
  }
  if (routineId === "evening") {
    return [
      { id: "build",   name: "Business / Project Quest (25 min+)", detail: p.businessGoal ? ("Current objective: " + p.businessGoal) : "Ship something. Feature, study block, or content." },
      { id: "learn",   name: "School / Learning Block",            detail: "Skip only if genuinely done for the day." },
      { id: "reset",   name: "Room / Environment Reset",           detail: "5-minute reset. Disorder compounds." },
      { id: "plan",    name: "Plan Tomorrow (3 priorities)",       detail: "Write them. Tomorrow-you executes, tonight-you decides." },
      { id: "unwind",  name: "Optional: Light Walk / Stretch",     detail: "Earned free time unlocks after required quests." },
    ];
  }
  /* night */
  return [
    { id: "screens", name: "Screens Down (30 min before bed)",  detail: "Blue light delays melatonin. The System will not reward doom-scrolling." },
    { id: "hygiene", name: "Hygiene Sequence",                  detail: "Shower/teeth/skin. Automatic, not optional." },
    { id: "stretch", name: "Stretch + Breathing (5 min)",       detail: "Slow nasal breathing, 4-6 count. Down-regulate." },
    { id: "review",  name: "Review Cleared Quests",             detail: "Look at what you actually did today. Data, not vibes." },
    { id: "priority", name: "Set Tomorrow's #1 Priority",        detail: "One sentence." },
    { id: "sleep",   name: "In Bed by " + sleepTarget,          detail: "8h minimum. Sleep is the highest-XP quest in this entire System." },
  ];
}

export function routineDateKey() {
  const n = new Date();
  return n.getFullYear() + "-" + (n.getMonth() + 1) + "-" + n.getDate();
}

/* Free-time minutes granted when a routine chain completes */
export const ROUTINE_REWARD_MIN = { morning: 10, athletic: 15, evening: 10, night: 10 };
export const ROUTINE_XP = { morning: 40, athletic: 60, evening: 45, night: 40 };
