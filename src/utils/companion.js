/**
 * ARISE — System Companion
 * The System as a conversational companion. Uses Gemini when an API key is
 * configured (stored locally only), otherwise falls back to a fully offline
 * rule-based engine grounded in real app data. Never invents percentages —
 * probabilities come from clearChance.js style deterministic math.
 */

const GEMINI_KEY_STORAGE = "arise_gemini_key";

export function getGeminiKey() {
  try { return localStorage.getItem(GEMINI_KEY_STORAGE) || ""; } catch (_) { return ""; }
}
export function setGeminiKey(key) {
  try {
    if (key) localStorage.setItem(GEMINI_KEY_STORAGE, key);
    else localStorage.removeItem(GEMINI_KEY_STORAGE);
    return true;
  } catch (_) { return false; }
}

/* Compact, factual context assembled from live app state */
export function buildContext(ctx) {
  const lines = [
    "Hunter: " + ctx.name + " · LV " + ctx.level + " · " + ctx.rankName,
    "Main path: " + ctx.mainPathName,
    "Streak: " + ctx.streak + " days · Daily quest " + (ctx.isDailyDone ? "CLEARED" : "not cleared"),
    "Energy score: " + ctx.energyScore + "/100 (sleep " + ctx.sleep + "/10, soreness " + ctx.soreness + "/10, fatigue " + ctx.fatigue + "/10)",
    "Gates cleared: " + ctx.gatesCleared + " · Bosses defeated: " + ctx.bossesDefeated + " · Shadows: " + ctx.shadows,
    "Coins: " + ctx.coins + " · Fame: " + ctx.fame + (ctx.guildName ? " · Guild: " + ctx.guildName : " · No guild"),
    "Today's assigned protocol: " + ctx.dailyLabel + (ctx.dailyWhy ? " — Reason: " + ctx.dailyWhy : ""),
  ];
  if (ctx.profileLine) lines.push("Profile: " + ctx.profileLine);
  if (ctx.riskLabel) lines.push("Injury/overtraining risk today: " + ctx.riskLabel);
  return lines.join("\n");
}

const SYSTEM_PERSONA =
  "You are THE SYSTEM from a private Solo Leveling-style life RPG. Personality: cold, direct, mysterious, genuinely helpful. Never corny, never cheerleader-motivational, never cruel. " +
  "Speak in short, precise sentences. Refer to real-life tasks as quests/gates/dungeons. You are talking to your single registered Hunter (a minor training for track sprinting — always keep training advice conservative, safe, and age-appropriate; never encourage overtraining, extreme dieting, or training through pain; recommend recovery when the data says so; you are not a doctor and say so if asked medical questions). " +
  "Ground every statement in the Hunter data provided. Never invent statistics or percentages that are not in the data. If asked to generate a quest, propose ONE concrete, safe, specific real-life quest with an XP value between 20 and 120 and a one-line reason tied to the data. Keep replies under 120 words.";

/**
 * Ask Gemini. Returns a Promise<string>. Throws on network/API failure —
 * callers should catch and fall back to localReply().
 */
export function askGemini(apiKey, contextStr, history, userMessage) {
  const contents = [];
  (history || []).slice(-8).forEach(function (m) {
    contents.push({ role: m.role === "user" ? "user" : "model", parts: [{ text: m.text }] });
  });
  contents.push({ role: "user", parts: [{ text: userMessage }] });

  const body = {
    system_instruction: { parts: [{ text: SYSTEM_PERSONA + "\n\n=== LIVE HUNTER DATA ===\n" + contextStr }] },
    contents,
    generationConfig: { maxOutputTokens: 512, temperature: 0.8 },
  };

  return fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + encodeURIComponent(apiKey),
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
  ).then(function (res) {
    if (!res.ok) throw new Error("Gemini API error " + res.status);
    return res.json();
  }).then(function (data) {
    const text = data && data.candidates && data.candidates[0] && data.candidates[0].content &&
      data.candidates[0].content.parts && data.candidates[0].content.parts[0] && data.candidates[0].content.parts[0].text;
    if (!text) throw new Error("Empty Gemini response");
    return text.trim();
  });
}

/* ---------------------------------------------------------------------------
   OFFLINE FALLBACK — rule-based System replies grounded in ctx
--------------------------------------------------------------------------- */
export function localReply(ctx, message) {
  const m = (message || "").toLowerCase();

  if (/(tired|exhausted|sore|hurt|pain|injur)/.test(m)) {
    return ctx.soreness >= 5 || ctx.fatigue >= 6
      ? "Your logs confirm it — soreness " + ctx.soreness + "/10, fatigue " + ctx.fatigue + "/10. High-intensity work is sealed. Recommendation: Recovery Gate — 10 min mobility, easy walk, hydration, sleep by target. Pain that is sharp or persistent is not a training variable. Tell an adult and rest it."
      : "Your logged readiness does not indicate a critical state (energy " + ctx.energyScore + "/100). If the body disagrees with the log, trust the body — update your energy check-in and the System will recalibrate today's protocol.";
  }
  if (/(quest|what should i do|task|next)/.test(m)) {
    return ctx.isDailyDone
      ? "Today's Gate is already cleared. Options: one Side Quest for bonus XP, an Evening Protocol block (business/study), or bank the win and protect your sleep target. Recommendation: the routine chain — streak integrity outranks extra volume."
      : "Priority: today's assigned protocol — " + ctx.dailyLabel + ". " + (ctx.dailyWhy || "") + " Clear it before optional content.";
  }
  if (/(sleep|bed|night)/.test(m)) {
    return "Sleep target: " + (ctx.sleepTarget || "22:30") + ", 8h minimum. Current sleep quality: " + ctx.sleep + "/10. Sleep is the highest-leverage quest in your entire build — speed development is gated on it. The System does not negotiate this one.";
  }
  if (/(fast|speed|sprint|track)/.test(m)) {
    return "Your build path is " + ctx.mainPathName + ". The formula the System runs: short accelerations + max-velocity micro-doses when fresh, stiffness (ankle/core) work, single-leg strength, and aggressive recovery. Today's readiness (" + ctx.energyScore + "/100) sets your dose. Log every sprint session — the data is the coach.";
  }
  if (/(business|app|money|revenue|launch)/.test(m)) {
    return "Business HQ has active quest chains: development dungeon, launch raid, marketing, outreach. The metric the System respects is shipped milestones — currently " + (ctx.businessMilestones || 0) + ". One 25-minute deep work block tonight advances the chain.";
  }
  if (/(streak|missed|fail)/.test(m)) {
    return ctx.streak > 0
      ? "Current streak: " + ctx.streak + " days. Protect the floor, not the ceiling — on bad days, clear the minimum viable version of the protocol. A Streak Shield from the shop can absorb one miss."
      : "Streak: 0. Irrelevant. The streak that matters starts with today's clear. One day. Then we talk.";
  }
  if (/(energy|check|status|how am i)/.test(m)) {
    return "Status readout — LV " + ctx.level + " " + ctx.rankName + " · streak " + ctx.streak + " · energy " + ctx.energyScore + "/100 · daily " + (ctx.isDailyDone ? "cleared" : "pending") + " · " + ctx.gatesCleared + " gates · " + ctx.shadows + " shadows. " + (ctx.energyScore < 45 ? "Readiness is the limiting factor today. Recovery actions carry full XP." : "No limiting factor detected. Execute.");
  }
  if (/(who are you|what are you|system)/.test(m)) {
    return "I am the System. I observe, measure, assign, and reward. I do not motivate — motivation decays. I build structure, which does not. Your only obligations: log honestly, clear what is assigned, and sleep when told.";
  }
  return "Query processed. The System responds best to: status, next quest, sleep, speed training, business, streak, or how you feel physically. State your objective, Hunter." +
    (ctx.isDailyDone ? "" : " Note: today's Gate remains uncleared.");
}
