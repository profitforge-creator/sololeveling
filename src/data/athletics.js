/**
 * ARISE — Athletic Training Engine
 * Research-informed sprint/athleticism quest generation with:
 *  - Weekly periodization (never max sprint work on consecutive days)
 *  - Readiness gating (sleep, soreness, fatigue) that swaps intensity for recovery
 *  - "Why this quest" explanations attached to every generated protocol
 *
 * Principles applied (conservative, youth-athlete-safe):
 *  - Short accelerations with FULL recovery develop speed; fatigue kills speed work
 *  - Max-velocity exposure in small doses (flying 10–20m), only when fresh
 *  - Plyometric volume kept low (<60 contacts) with soft landings
 *  - Hamstring care: sprint mechanics + gradual exposure, no max work when sore
 *  - 48h between high-intensity CNS days; tempo/mobility fills the gaps
 *  - Sleep 8h+ is treated as training, not an accessory
 */

const A = {
  /* Warm-up / drills */
  sprint_warmup:   function (n) { return { id: "sprint_warmup",   name: "Sprint Warm-up (jog + leg swings + skips)", target: n,  unit: "min", stat: "Recovery" }; },
  a_skips:         function (n) { return { id: "a_skips",         name: "A-Skips",                       target: n, unit: "×20m", stat: "Agility" }; },
  b_skips:         function (n) { return { id: "b_skips",         name: "B-Skips",                       target: n, unit: "×20m", stat: "Agility" }; },
  high_knees:      function (n) { return { id: "high_knees",      name: "High-Knee Runs",                target: n, unit: "×20m", stat: "Agility" }; },
  fast_claw:       function (n) { return { id: "fast_claw",       name: "Straight-Leg Bounds (claw)",    target: n, unit: "×20m", stat: "Agility" }; },
  wall_drill:      function (n) { return { id: "wall_drill",      name: "Wall Acceleration Drill",       target: n, unit: "×10s", stat: "Agility" }; },
  arm_drive:       function (n) { return { id: "arm_drive",       name: "Seated Arm Drive",              target: n, unit: "×20s", stat: "Agility" }; },
  ankle_hops:      function (n) { return { id: "ankle_hops",      name: "Ankle Stiffness Hops (low)",    target: n, unit: "×15",  stat: "Agility" }; },
  /* Speed work */
  accel_10:        function (n) { return { id: "accel_10",        name: "10–20m Accelerations (full rest 2min+)", target: n, unit: "×", stat: "Agility" }; },
  accel_30:        function (n) { return { id: "accel_30",        name: "30m Build-ups (full rest)",     target: n, unit: "×",   stat: "Agility" }; },
  flying_sprint:   function (n) { return { id: "flying_sprint",   name: "Flying 10–20m (20m run-in, full rest 3min+)", target: n, unit: "×", stat: "Agility" }; },
  hill_sprint:     function (n) { return { id: "hill_sprint",     name: "Short Hill Sprints (walk-back rest)", target: n, unit: "×", stat: "Agility" }; },
  tempo_run:       function (n) { return { id: "tempo_run",       name: "Tempo 100m @ 70% (easy, relaxed)", target: n, unit: "×", stat: "Endurance" }; },
  sprint_starts:   function (n) { return { id: "sprint_starts",   name: "Standing/3-point Starts",       target: n, unit: "×",   stat: "Agility" }; },
  /* Plyometrics — low volume */
  broad_jump:      function (n) { return { id: "broad_jump",      name: "Broad Jumps (stick landing)",   target: n, unit: "×",   stat: "Agility" }; },
  pogo_hops:       function (n) { return { id: "pogo_hops",       name: "Pogo Hops",                     target: n, unit: "×10", stat: "Agility" }; },
  bounding:        function (n) { return { id: "bounding",        name: "Bounding (grass if possible)",  target: n, unit: "×20m", stat: "Agility" }; },
  box_step:        function (n) { return { id: "box_step",        name: "Explosive Step-ups (each leg)", target: n, unit: "",    stat: "Strength" }; },
  /* Strength support */
  pushups:         function (n) { return { id: "pushups",         name: "Push-ups",                      target: n, unit: "",    stat: "Strength" }; },
  pullups:         function (n) { return { id: "pullups",         name: "Pull-ups",                      target: n, unit: "",    stat: "Strength" }; },
  squats:          function (n) { return { id: "squats",          name: "Tempo Bodyweight Squats",       target: n, unit: "",    stat: "Strength" }; },
  split_squat:     function (n) { return { id: "split_squat",     name: "Split Squats (each leg)",       target: n, unit: "",    stat: "Strength" }; },
  sl_rdl:          function (n) { return { id: "sl_rdl",          name: "Single-Leg RDL (slow, bodyweight)", target: n, unit: "", stat: "Strength" }; },
  glute_bridge:    function (n) { return { id: "glute_bridge",    name: "Single-Leg Glute Bridges",      target: n, unit: "",    stat: "Strength" }; },
  calf_raise:      function (n) { return { id: "calf_raise",      name: "Slow Calf Raises (each leg)",   target: n, unit: "",    stat: "Strength" }; },
  nordic_ecc:      function (n) { return { id: "nordic_ecc",      name: "Hamstring Slides / Assisted Nordics (easy)", target: n, unit: "", stat: "Strength" }; },
  /* Core stiffness */
  dead_bug:        function (n) { return { id: "dead_bug",        name: "Dead Bugs (each side)",         target: n, unit: "",    stat: "Discipline" }; },
  side_plank:      function (n) { return { id: "side_plank",      name: "Side Plank (each side)",        target: n, unit: "×30s", stat: "Discipline" }; },
  pallof_iso:      function (n) { return { id: "pallof_iso",      name: "Anti-Rotation Hold (band/iso)", target: n, unit: "×20s", stat: "Discipline" }; },
  hollow_rocker:   function (n) { return { id: "hollow_rocker",   name: "Hollow Rockers",                target: n, unit: "",    stat: "Discipline" }; },
  v_ups:           function (n) { return { id: "v_ups",           name: "V-Ups",                         target: n, unit: "",    stat: "Discipline" }; },
  bird_dog:        function (n) { return { id: "bird_dog",        name: "Bird Dogs (slow, each side)",   target: n, unit: "",    stat: "Discipline" }; },
  /* Mobility / recovery */
  hip_mobility:    function (n) { return { id: "hip_mobility",    name: "Hip Mobility Flow (90/90, lunge stretch)", target: n, unit: "min", stat: "Recovery" }; },
  ankle_mobility:  function (n) { return { id: "ankle_mobility",  name: "Ankle Mobility (wall taps)",    target: n, unit: "min", stat: "Recovery" }; },
  hamstring_care:  function (n) { return { id: "hamstring_care",  name: "Hamstring Flossing + Easy Stretch", target: n, unit: "min", stat: "Recovery" }; },
  walk:            function (n) { return { id: "walk",            name: "Recovery Walk",                 target: n, unit: "min", stat: "Recovery" }; },
  breathing:       function (n) { return { id: "breathing",       name: "Down-Regulation Breathing",     target: n, unit: "min", stat: "Recovery" }; },
  stretching:      function (n) { return { id: "stretching",      name: "Full-Body Stretch Routine",     target: n, unit: "min", stat: "Recovery" }; },
  foam_roll:       function (n) { return { id: "foam_roll",       name: "Soft-Tissue Work (roller/ball)", target: n, unit: "min", stat: "Recovery" }; },
  /* Habits */
  hydration:       function ()  { return { id: "hydration",       name: "Hydration Protocol",            target: 3, unit: "L",  stat: "Recovery" }; },
  sleep:           function ()  { return { id: "sleep",           name: "Sleep 8h+ (in bed by target)",  target: 8, unit: "h",  stat: "Recovery" }; },
  protein_check:   function ()  { return { id: "protein_check",   name: "Protein Target Check",          target: 1, unit: "",   stat: "Recovery" }; },
  sprint_journal:  function ()  { return { id: "sprint_journal",  name: "Sprint Journal (times, feel, notes)", target: 1, unit: "", stat: "Intelligence" }; },
};

/* Tier scaling: 0=E … 6=Monarch. Values are the "n" passed to templates. */
function vol(tier, arr) { return arr[Math.max(0, Math.min(6, tier))]; }

/* ---------------------------------------------------------------------------
   WEEKLY PERIODIZATION TEMPLATE
   Sun=0 rest · Mon=1 acceleration · Tue=2 strength/power · Wed=3 recovery
   Thu=4 max velocity/mechanics · Fri=5 strength+plyo · Sat=6 skill/tempo/test
--------------------------------------------------------------------------- */
export const DAY_FOCUS = {
  0: { id: "rest",     label: "Full Rest",              color: "#6fae6f" },
  1: { id: "accel",    label: "Acceleration Gate",      color: "#4db8ff" },
  2: { id: "strength", label: "Strength Support",       color: "#f53d3d" },
  3: { id: "recovery", label: "Mobility Recovery Gate", color: "#2ee88a" },
  4: { id: "maxv",     label: "Max Velocity Gate",      color: "#a05df5" },
  5: { id: "power",    label: "Plyometric Trial",       color: "#f5b65d" },
  6: { id: "skill",    label: "Speed Skill / Tempo",    color: "#4db8ff" },
};

function readinessGate(energyState, energyScore) {
  const e = energyState || {};
  const sleep    = e.sleep    !== undefined ? e.sleep    : 7;
  const soreness = e.soreness !== undefined ? e.soreness : 3;
  const fatigue  = e.fatigue  !== undefined ? e.fatigue  : 3;
  const score    = typeof energyScore === "number" && isFinite(energyScore) ? energyScore : 68;

  if (soreness >= 7 || sleep <= 3 || fatigue >= 8 || score < 25) {
    return { level: "blocked", reason:
      soreness >= 7 ? "soreness is high (" + soreness + "/10) — hamstring/injury risk is elevated"
      : sleep <= 3  ? "sleep is critically low (" + sleep + "/10) — CNS output and reaction time are compromised"
      : fatigue >= 8 ? "fatigue is high (" + fatigue + "/10) — speed quality would be junk volume"
      : "overall readiness is critical (" + score + "/100)" };
  }
  if (soreness >= 5 || sleep <= 5 || fatigue >= 6 || score < 45) {
    return { level: "reduced", reason:
      soreness >= 5 ? "moderate soreness (" + soreness + "/10)"
      : sleep <= 5  ? "sub-optimal sleep (" + sleep + "/10)"
      : fatigue >= 6 ? "moderate fatigue (" + fatigue + "/10)"
      : "readiness below standard (" + score + "/100)" };
  }
  if (score >= 80 && soreness <= 3 && sleep >= 7) {
    return { level: "primed", reason: "readiness is primed (" + score + "/100, sleep " + sleep + "/10, soreness " + soreness + "/10)" };
  }
  return { level: "normal", reason: "readiness is stable (" + score + "/100)" };
}

/* ---------------------------------------------------------------------------
   MAIN GENERATOR
--------------------------------------------------------------------------- */
export function generateAthleticQuest(profile, level, energyState, energyScore, innerDemon) {
  const tier  = Math.min(6, Math.floor(((typeof level === "number" && isFinite(level)) ? level : 1) / 5));
  const dow   = new Date().getDay();
  const focus = DAY_FOCUS[dow] || DAY_FOCUS[1];
  const gate  = readinessGate(energyState, energyScore);
  const hasTrack = !profile || !profile.equipment || profile.equipment.track !== false;
  const hasBar   = profile && profile.equipment && profile.equipment.pullupBar;
  const demonMult = innerDemon && gate.level !== "blocked" && gate.level !== "reduced" ? 1.15 : 1.0;
  const n = function (arr) { return Math.max(1, Math.round(vol(tier, arr) * demonMult)); };

  const goals = [];
  let label = focus.label;
  let dayType = focus.id;
  let why;

  /* ---- FULL REST (Sunday) ---- */
  if (dow === 0) {
    goals.push(A.stretching(n([10,10,12,15,15,15,20])), A.walk(n([15,15,20,20,25,25,30])), A.hydration(), A.sleep());
    why = "Sunday is a scheduled full-rest day. Adaptation happens during recovery — speed gains are consolidated when the nervous system is allowed to rebuild. Only restorative work is assigned.";
    label = "Rest & Rebuild Protocol";
  }
  /* ---- READINESS BLOCKED → RECOVERY GATE (any day) ---- */
  else if (gate.level === "blocked") {
    goals.push(A.hip_mobility(n([8,10,10,12,12,15,15])), A.dead_bug(n([8,10,12,14,16,18,20])), A.bird_dog(n([6,8,8,10,10,12,12])), A.walk(n([15,15,20,20,20,25,25])), A.breathing(5));
    why = "High-intensity work has been sealed because " + gate.reason + ". Sprinting in this state is how hamstrings get injured. Replacement: Recovery Gate — mobility and core stability protect the speed you already built.";
    label = "Recovery Gate: Mobility + Core Stability";
    dayType = "recovery";
  }
  /* ---- ACCELERATION DAY (Mon) ---- */
  else if (dow === 1) {
    goals.push(A.sprint_warmup(10), A.wall_drill(n([3,3,4,4,5,5,6])));
    if (gate.level === "reduced") {
      goals.push(A.accel_30(n([3,3,4,4,5,5,6])), A.dead_bug(n([10,12,14,16,18,20,24])));
      why = "Acceleration day, reduced dose: " + gate.reason + ". Volume trimmed and intensity capped at build-ups — quality over quantity keeps mechanics sharp without stacking fatigue.";
      label = "Acceleration Gate [REDUCED]";
    } else {
      goals.push(hasTrack ? A.accel_10(n([4,5,6,6,7,8,10])) : A.hill_sprint(n([3,4,4,5,6,6,8])), A.sprint_starts(n([2,3,3,4,4,5,6])), A.dead_bug(n([10,12,14,16,18,20,24])));
      why = "Assigned because your goal path is Speed/Athleticism and " + gate.reason + ". Short accelerations with FULL recovery (2min+) train the first 10–20m — projection angle, shin drive, and ground force. Core (anti-extension) transfers force without energy leaks.";
    }
  }
  /* ---- STRENGTH SUPPORT (Tue) ---- */
  else if (dow === 2) {
    goals.push(A.split_squat(n([8,10,12,14,16,18,20])), A.sl_rdl(n([6,8,8,10,10,12,14])), hasBar ? A.pullups(n([4,6,8,10,12,15,18])) : A.pushups(n([12,16,20,26,32,40,50])), A.calf_raise(n([10,12,14,16,18,20,25])), A.glute_bridge(n([8,10,12,14,16,18,20])));
    why = "Strength-support day. Single-leg strength (split squats, RDLs, bridges) builds the force base sprinting draws from, and slow calf work builds ankle stiffness for ground contact. Kept sub-maximal — tomorrow is recovery, Thursday is speed.";
    if (gate.level === "reduced") {
      goals.length = 0;
      goals.push(A.split_squat(n([6,8,8,10,12,12,14])), A.glute_bridge(n([8,10,10,12,12,14,16])), A.hip_mobility(8));
      why = "Strength day at reduced volume: " + gate.reason + ". Load trimmed to movement-quality work so Thursday's speed session isn't compromised.";
      label = "Strength Support [REDUCED]";
    }
  }
  /* ---- MOBILITY RECOVERY (Wed) ---- */
  else if (dow === 3) {
    goals.push(A.hip_mobility(n([8,10,10,12,12,15,15])), A.ankle_mobility(5), A.hamstring_care(n([5,5,6,6,8,8,10])), A.walk(n([15,15,20,20,25,25,30])), A.hydration());
    why = "Scheduled mid-week recovery. Two CNS-intensive days flank this one — hip mobility restores sprint range, ankle work maintains stiffness capacity, hamstring care lowers strain risk for tomorrow's max-velocity exposure.";
  }
  /* ---- MAX VELOCITY / MECHANICS (Thu) ---- */
  else if (dow === 4) {
    goals.push(A.sprint_warmup(12), A.a_skips(n([2,3,3,4,4,4,5])), A.b_skips(n([2,2,3,3,4,4,5])));
    if (gate.level === "reduced") {
      goals.push(A.fast_claw(n([2,3,3,4,4,4,5])), A.tempo_run(n([4,5,6,6,8,8,10])));
      why = "Max-velocity work replaced with mechanics + tempo: " + gate.reason + ". Flying sprints demand a fresh nervous system — drilling posture and turnover at sub-max speed keeps the pattern without the risk.";
      label = "Sprint Mechanics [MODIFIED]";
    } else {
      goals.push(A.flying_sprint(n([2,3,3,4,4,5,6])), A.pogo_hops(n([2,3,3,4,4,5,6])), A.sprint_journal());
      why = "Assigned because " + gate.reason + " and it has been 72h since your last max-velocity exposure. Flying 10–20m sprints at full speed are the single most specific stimulus for top-end speed — tiny dose, full recovery between reps, stop at the first sign of slowing.";
    }
  }
  /* ---- STRENGTH + PLYO (Fri) ---- */
  else if (dow === 5) {
    if (gate.level === "reduced") {
      goals.push(A.squats(n([12,16,20,24,28,32,40])), A.side_plank(n([2,2,3,3,4,4,5])), A.hip_mobility(8));
      why = "Plyometric work withheld: " + gate.reason + ". Jumps on a fatigued base teach bad landings. Substituted tempo strength + lateral core.";
      label = "Plyometric Trial [SEALED → STRENGTH]";
    } else {
      goals.push(A.broad_jump(n([4,5,6,6,8,8,10])), A.bounding(n([2,2,3,3,4,4,5])), A.box_step(n([6,8,8,10,12,12,14])), A.side_plank(n([2,2,3,3,4,4,5])), A.hollow_rocker(n([8,10,12,14,16,20,24])));
      why = "Plyometric trial. Total ground contacts kept under ~60 (youth-safe volume). Broad jumps train horizontal force, bounding trains elastic return, stick every landing. Lateral core finishes the session — rotational stiffness is free speed.";
    }
  }
  /* ---- SKILL / TEMPO / TEST (Sat) ---- */
  else {
    const week = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
    const testWeek = week % 2 === 0;
    if (testWeek && gate.level !== "reduced") {
      goals.push(A.sprint_warmup(12), A.sprint_starts(3), { id: "speed_test", name: "Timed 30m or 60m Test (record it)", target: 1, unit: "", stat: "Agility" }, A.sprint_journal());
      why = "Bi-weekly Speed Evaluation. One timed effort under good conditions is the System's ground truth — it recalibrates your rank projections and proves the training is transferring. Log the time honestly.";
      label = "Weekly Speed Evaluation";
      dayType = "test";
    } else {
      goals.push(A.tempo_run(n([5,6,6,8,8,10,12])), A.high_knees(n([2,3,3,4,4,4,5])), A.v_ups(n([8,10,12,14,16,20,24])), A.stretching(10));
      why = "Extensive tempo day — relaxed 70% runs build sprint-specific conditioning and rehearse mechanics without CNS cost. This is the volume that lets the hard days stay hard.";
    }
  }

  /* Habit anchors appended to every non-rest day (max 6 goals total) */
  if (dow !== 0 && goals.length < 6) {
    if (!goals.some(function (g) { return g.id === "hydration"; })) goals.push(A.hydration());
  }

  const baseXp = 90 + tier * 40;
  const xpMult = gate.level === "primed" ? 1.2 : gate.level === "reduced" ? 0.85 : gate.level === "blocked" ? 0.7 : 1.0;
  const xp = Math.max(30, Math.round(baseXp * (goals.length / 4) * xpMult * (innerDemon ? 1.1 : 1.0)));

  return {
    id: "daily_athletic_" + focus.id,
    label: label + (tier > 0 ? " [+" + tier + "]" : "") + (innerDemon && gate.level === "normal" ? " ◈DEMON" : ""),
    goals: goals.slice(0, 6),
    xp,
    tier,
    dayType,
    why,
    readiness: gate.level,
    focusColor: focus.color,
  };
}

/* Attach a "why" to legacy-generator quests so every path explains itself */
export function explainLegacyQuest(quest, goals, energyScore) {
  if (!quest) return quest;
  const goalNames = (goals || []).join(", ") || "general development";
  quest.why = quest.dayType === "rest"
    ? "Scheduled rest day. Recovery is a training input, not a break from training."
    : quest.dayType === "recovery"
      ? "Active recovery assigned — readiness (" + Math.round(energyScore || 68) + "/100) and the weekly rotation both point to restorative volume today."
      : "Assigned from your goal profile (" + goalNames + ") at readiness " + Math.round(energyScore || 68) + "/100. Volume auto-scales with rank tier and today's energy.";
  return quest;
}
