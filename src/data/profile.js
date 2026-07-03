/**
 * ARISE — Hunter Profile / Build Path module
 * Main goal paths, profile-derived targets (conservative, research-informed),
 * and helpers used by quest generation, routines and the companion.
 *
 * NOT medical advice. All nutrition/training numbers are conservative
 * general-population estimates and are labeled as such in the UI.
 */

export const MAIN_PATHS = [
  { id: "speed",      name: "Speed / Athleticism",     icon: "➤", color: "#4db8ff",
    desc: "Acceleration, max velocity, explosiveness, core stiffness. The default Monarch of Speed build.",
    primaryStats: ["Agility", "Endurance"] },
  { id: "track",      name: "Track / Sprinting",        icon: "⚡", color: "#4db8ff",
    desc: "Event-focused sprint training. Mechanics, starts, tempo, periodized speed work.",
    primaryStats: ["Agility", "Discipline"] },
  { id: "basketball", name: "Basketball / Athletic Build", icon: "❖", color: "#f5b65d",
    desc: "Vertical, lateral quickness, conditioning, athletic strength.",
    primaryStats: ["Agility", "Strength"] },
  { id: "strength",   name: "Strength",                 icon: "⚔", color: "#f53d3d",
    desc: "Progressive calisthenics and loaded strength work.",
    primaryStats: ["Strength", "Endurance"] },
  { id: "lean",       name: "Lean Physique",            icon: "◈", color: "#6fae6f",
    desc: "Conditioning, clean nutrition habits, sustainable volume.",
    primaryStats: ["Endurance", "Discipline"] },
  { id: "school",     name: "School / Grades",          icon: "✦", color: "#f5b65d",
    desc: "Deep work blocks, study systems, test preparation.",
    primaryStats: ["Intelligence", "Discipline"] },
  { id: "business",   name: "Business / App Development", icon: "⬡", color: "#a05df5",
    desc: "Ship products. Build revenue. Developer skill tree.",
    primaryStats: ["Intelligence", "Aura"] },
  { id: "creator",    name: "Creator Mode",             icon: "✸", color: "#a05df5",
    desc: "Content pipelines, publishing streaks, audience growth.",
    primaryStats: ["Intelligence", "Aura"] },
  { id: "discipline", name: "Discipline / Focus",       icon: "◈", color: "#4db8ff",
    desc: "Habit architecture, focus blocks, cold exposure, screens control.",
    primaryStats: ["Discipline", "Intelligence"] },
  { id: "recovery",   name: "Recovery / Health",        icon: "✚", color: "#2ee88a",
    desc: "Sleep, mobility, stress control, sustainable base building.",
    primaryStats: ["Recovery", "Discipline"] },
  { id: "monarch",    name: "Balanced Monarch Build",   icon: "◉", color: "#9b30ff",
    desc: "All domains, rotated. No single weakness.",
    primaryStats: ["Aura", "Discipline"] },
];

export function getMainPath(id) {
  return MAIN_PATHS.find(function (p) { return p.id === id; }) || MAIN_PATHS[0];
}

/* ---------------------------------------------------------------------------
   NUTRITION ESTIMATES — Mifflin-St Jeor when data available, otherwise null.
   Ranges are intentionally wide and conservative. UI must label these as
   estimates, not prescriptions.
--------------------------------------------------------------------------- */
export function estimateTargets(profile) {
  if (!profile || !profile.weightKg) return null;
  const w = profile.weightKg;
  const h = profile.heightCm || null;
  const a = profile.age || null;

  let bmr = null;
  if (h && a) {
    /* Mifflin-St Jeor; if sex not provided, use midpoint of the two offsets */
    const base = 10 * w + 6.25 * h - 5 * a;
    bmr = profile.sex === "male" ? base + 5
        : profile.sex === "female" ? base - 161
        : base - 78;
  }

  const activityMult = { low: 1.35, moderate: 1.55, high: 1.75 }[profile.activityLevel] || 1.55;
  const maintenance  = bmr ? Math.round(bmr * activityMult) : null;

  /* Goal adjustment — conservative. Growing athletes should not run big deficits. */
  const goalAdj = { performance: 0, lean: -200, gain: 250 }[profile.nutritionGoal] || 0;
  const calLow  = maintenance ? maintenance + goalAdj - 150 : null;
  const calHigh = maintenance ? maintenance + goalAdj + 150 : null;

  /* Protein: 1.4–2.0 g/kg for training athletes (ISSN position stand range) */
  const proteinLow  = Math.round(w * 1.4);
  const proteinHigh = Math.round(w * 2.0);

  /* Hydration: ~35 ml/kg baseline, capped display range */
  const waterL = Math.min(4, Math.max(1.8, Math.round((w * 0.035) * 10) / 10));

  return {
    maintenance, calLow, calHigh, proteinLow, proteinHigh, waterL,
    disclaimer: "Estimates only — general sports-nutrition ranges, not medical advice. Growing athletes should never run aggressive deficits.",
  };
}

/* ---------------------------------------------------------------------------
   PROFILE → SYSTEM MODIFIERS
--------------------------------------------------------------------------- */
export function getRiskLevel(profile, energyState) {
  const e = energyState || {};
  let risk = 0;
  if ((e.soreness || 0) >= 7) risk += 2;
  else if ((e.soreness || 0) >= 5) risk += 1;
  if ((e.sleep !== undefined ? e.sleep : 7) <= 3) risk += 2;
  else if ((e.sleep !== undefined ? e.sleep : 7) <= 5) risk += 1;
  if ((e.fatigue || 0) >= 8) risk += 2;
  else if ((e.fatigue || 0) >= 6) risk += 1;
  if (profile && profile.injuries && profile.injuries.trim().length > 3) risk += 1;
  if (risk >= 4) return { level: "high",     label: "ELEVATED",  color: "#f53d3d" };
  if (risk >= 2) return { level: "moderate", label: "CAUTION",   color: "#f5b65d" };
  return           { level: "low",      label: "STABLE",    color: "#2ee88a" };
}

export function profileSummaryLine(profile) {
  if (!profile || !profile.complete) return "Profile incomplete — the System is operating on defaults.";
  const bits = [];
  if (profile.age) bits.push(profile.age + "y");
  if (profile.heightCm) bits.push(profile.heightCm + "cm");
  if (profile.weightKg) bits.push(profile.weightKg + "kg");
  bits.push(getMainPath(profile.mainPath).name);
  return bits.join(" · ");
}
