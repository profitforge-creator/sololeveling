/**
 * ARISE — Dungeon Clear Probability
 * Deterministic, data-driven clear chance with a factor breakdown.
 * Never random: same inputs → same output.
 */

/**
 * ctx: { level, stats, rankIdx, energyScore, sleep, soreness, fatigue,
 *        streak, questCompletionToday (0..1), shadowDeployed (bool),
 *        gatesClearedSimilar (count), guildJoined }
 * gate: { minLevel, rank, statKey, tierIdx (0..6) }
 */
export function calcClearChance(gate, ctx) {
  const factors = [];
  const add = function (delta, label) {
    if (!delta) return;
    factors.push({ delta: Math.round(delta), label });
  };

  let chance = 55; /* base */

  /* Rank vs gate tier */
  const tierIdx = typeof gate.tierIdx === "number" ? gate.tierIdx : 1;
  const rankGap = (ctx.rankIdx || 0) - tierIdx;
  if (rankGap >= 1)      add(Math.min(20, rankGap * 8),  "Rank advantage over gate tier");
  else if (rankGap <= -1) add(Math.max(-25, rankGap * 12), "Gate difficulty above current rank");

  /* Level vs requirement */
  const lvlGap = (ctx.level || 1) - (gate.minLevel || 1);
  if (lvlGap >= 5) add(6, "Level well above entry threshold");
  else if (lvlGap < 0) add(-20, "Below minimum level");

  /* Relevant stat */
  const statVal = gate.statKey && ctx.stats ? (ctx.stats[gate.statKey] || 10) : 10;
  if (statVal >= 40) add(12, statVal + " " + (gate.statKey || "stat") + " — dominant attribute");
  else if (statVal >= 25) add(8, (gate.statKey || "Stat") + " advantage");
  else if (statVal < 12) add(-5, (gate.statKey || "Stat") + " under-developed");

  /* Energy / readiness */
  const es = typeof ctx.energyScore === "number" ? ctx.energyScore : 68;
  if (es >= 80) add(10, "Energy primed (" + es + ")");
  else if (es >= 60) add(5, "Energy stable (" + es + ")");
  else if (es < 35) add(-12, "Energy critical (" + es + ")");
  else if (es < 50) add(-6, "Energy below standard (" + es + ")");

  /* Fatigue / soreness penalties */
  if ((ctx.fatigue || 0) >= 7) add(-8, "Fatigue elevated");
  if ((ctx.soreness || 0) >= 7) add(-8, "Soreness elevated");
  if ((ctx.sleep !== undefined ? ctx.sleep : 7) <= 4) add(-6, "Sleep debt detected");

  /* Momentum */
  const streak = ctx.streak || 0;
  if (streak >= 7) add(8, streak + "-day streak momentum");
  else if (streak >= 3) add(4, streak + "-day streak");

  if ((ctx.questCompletionToday || 0) >= 0.99) add(5, "Daily quest already cleared");

  /* Support */
  if (ctx.shadowDeployed) add(5, "Shadow escort assigned");
  if (ctx.guildJoined) add(3, "Guild support network");

  /* History */
  if ((ctx.gatesClearedSimilar || 0) >= 3) add(6, "Proven record in similar gates");
  else if ((ctx.gatesClearedSimilar || 0) >= 1) add(3, "Prior clear in this gate type");

  factors.forEach(function (f) { chance += f.delta; });
  chance = Math.max(5, Math.min(97, Math.round(chance)));

  return { chance, factors };
}

export function chanceColor(pct) {
  if (pct >= 75) return "#2ee88a";
  if (pct >= 55) return "#4db8ff";
  if (pct >= 35) return "#f5b65d";
  return "#f53d3d";
}
