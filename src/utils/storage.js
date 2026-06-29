/**
 * ARISE — Safe Local Storage Utilities
 * All operations wrapped in try/catch.
 * Never throws. Always returns safe defaults on failure.
 */

const SAVE_KEY     = "arise_save_v1";
const SAVE_VERSION = 1;

function safeStringify(value) {
  try { return JSON.stringify(value); }
  catch (_) { return null; }
}

function safeParse(str, fallback) {
  if (str === null || str === undefined) return fallback;
  try {
    const parsed = JSON.parse(str);
    return parsed !== null && parsed !== undefined ? parsed : fallback;
  } catch (_) { return fallback; }
}

function sanitiseStats(raw) {
  const defaults = {
    Strength: 10, Agility: 10, Endurance: 10,
    Discipline: 10, Intelligence: 10, Recovery: 10, Aura: 5,
  };
  if (!raw || typeof raw !== "object") return defaults;
  const out = {};
  Object.keys(defaults).forEach(function (k) {
    const v = Number(raw[k]);
    out[k] = Number.isFinite(v) && v >= 0 ? Math.round(v) : defaults[k];
  });
  return out;
}

function sanitisePlayer(raw) {
  const def = {
    name: "Hunter", level: 1, xp: 0, streak: 0,
    job: "fighter", physique: "hybrid", goals: [],
    activeTitle: "awakened", avatar: null,
    stats: sanitiseStats(null),
  };
  if (!raw || typeof raw !== "object") return def;
  const level  = Number(raw.level);
  const xp     = Number(raw.xp);
  const streak = Number(raw.streak);
  /* Avatar: base64 data URL only, capped to avoid blowing localStorage quota */
  const avatar = (typeof raw.avatar === "string" && raw.avatar.indexOf("data:image") === 0 && raw.avatar.length < 600000)
    ? raw.avatar : null;
  return {
    name:        typeof raw.name === "string" && raw.name.trim() ? raw.name : def.name,
    level:       Number.isFinite(level)  && level  >= 1 ? Math.floor(level)  : 1,
    xp:          Number.isFinite(xp)     && xp     >= 0 ? Math.floor(xp)     : 0,
    streak:      Number.isFinite(streak) && streak >= 0 ? Math.floor(streak) : 0,
    job:         typeof raw.job === "string"      ? raw.job      : def.job,
    physique:    typeof raw.physique === "string" ? raw.physique : def.physique,
    goals:       Array.isArray(raw.goals)         ? raw.goals    : [],
    activeTitle: typeof raw.activeTitle === "string" ? raw.activeTitle : "awakened",
    avatar:      avatar,
    stats:       sanitiseStats(raw.stats),
  };
}

export function defaultSave() {
  return {
    version: 1, phase: "onboard",
    player: sanitisePlayer(null),
    isDailyDone: false, dailyProgress: {},
    sideProgress: [], sideDone: [],
    extSideProgress: {}, extSideDone: {},
    anomalyProgress: {}, anomalyDone: {},
    recentAnomalyIds: [], clearedGates: {},
    dungeonKeys: [], coins: 0, fame: 0, inventory: [],
    shadowArmy: [], shadowSquads: [
      { id:"assault", name:"Assault Squad", shadowIds:[], icon:"⚔" },
      { id:"recon",   name:"Recon Squad",   shadowIds:[], icon:"➤" },
      { id:"raid",    name:"Raid Squad",    shadowIds:[], icon:"❖" },
    ],
    shadowMissions: [], shadowNames: {},
    loreFragments: 0, collectedLoreIds: [],
    earnedAchievements: [], unlockedSpecs: [], completedBTs: [],
    guildId: null, guildQuestProgress: {}, guildQuestDone: false,
    monarchInterest: 0, monarchStage: 0, isMonarch: false, ascensionCount: 0,
    soundOn: true,
    energyState: { sleep:7, soreness:3, fatigue:3, hydration:7, stress:3 },
    energyHistory: [],
    discipline: { startTs: null, bestDays: 0, lastResetTs: null, motivation: "", urgeLog: [], hidden: false },
    bossHpSnapshot: null, secretUnlockedIds: [],
  };
}

function sanitiseDiscipline(d, def) {
  if (!d || typeof d !== "object") return def;
  const num = function (v) { return (typeof v === "number" && isFinite(v)) ? v : null; };
  return {
    startTs:     num(d.startTs),
    bestDays:    (typeof d.bestDays === "number" && d.bestDays >= 0) ? Math.floor(d.bestDays) : 0,
    lastResetTs: num(d.lastResetTs),
    motivation:  typeof d.motivation === "string" ? d.motivation.slice(0, 500) : "",
    urgeLog:     Array.isArray(d.urgeLog) ? d.urgeLog.slice(0, 100) : [],
    hidden:      !!d.hidden,
  };
}

export function saveGame(state) {
  try {
    const payload = Object.assign({}, state, { version: 1, savedAt: Date.now() });
    const str = safeStringify(payload);
    if (!str) return false;
    localStorage.setItem(SAVE_KEY, str);
    return true;
  } catch (_) { return false; }
}

export function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed = safeParse(raw, null);
    if (!parsed || typeof parsed !== "object") return null;
    if (parsed.version && parsed.version > 1) return null;
    const def = defaultSave();
    return {
      version: 1,
      phase: parsed.phase === "app" ? "app" : "onboard",
      player: sanitisePlayer(parsed.player),
      isDailyDone: !!parsed.isDailyDone,
      dailyProgress: typeof parsed.dailyProgress === "object" && parsed.dailyProgress ? parsed.dailyProgress : {},
      sideProgress: Array.isArray(parsed.sideProgress) ? parsed.sideProgress : [],
      sideDone: Array.isArray(parsed.sideDone) ? parsed.sideDone : [],
      extSideProgress: typeof parsed.extSideProgress === "object" && parsed.extSideProgress ? parsed.extSideProgress : {},
      extSideDone: typeof parsed.extSideDone === "object" && parsed.extSideDone ? parsed.extSideDone : {},
      anomalyProgress: typeof parsed.anomalyProgress === "object" && parsed.anomalyProgress ? parsed.anomalyProgress : {},
      anomalyDone: typeof parsed.anomalyDone === "object" && parsed.anomalyDone ? parsed.anomalyDone : {},
      recentAnomalyIds: Array.isArray(parsed.recentAnomalyIds) ? parsed.recentAnomalyIds : [],
      clearedGates: typeof parsed.clearedGates === "object" && parsed.clearedGates ? parsed.clearedGates : {},
      dungeonKeys: Array.isArray(parsed.dungeonKeys) ? parsed.dungeonKeys : [],
      coins: Number.isFinite(Number(parsed.coins)) ? Math.max(0, Math.floor(Number(parsed.coins))) : 0,
      fame: Number.isFinite(Number(parsed.fame)) ? Math.max(0, Math.floor(Number(parsed.fame))) : 0,
      inventory: Array.isArray(parsed.inventory) ? parsed.inventory : [],
      shadowArmy: Array.isArray(parsed.shadowArmy) ? parsed.shadowArmy : [],
      shadowSquads: Array.isArray(parsed.shadowSquads) ? parsed.shadowSquads : def.shadowSquads,
      shadowMissions: Array.isArray(parsed.shadowMissions) ? parsed.shadowMissions : [],
      shadowNames: typeof parsed.shadowNames === "object" && parsed.shadowNames ? parsed.shadowNames : {},
      loreFragments: Number.isFinite(Number(parsed.loreFragments)) ? Math.max(0, Math.floor(Number(parsed.loreFragments))) : 0,
      collectedLoreIds: Array.isArray(parsed.collectedLoreIds) ? parsed.collectedLoreIds : [],
      earnedAchievements: Array.isArray(parsed.earnedAchievements) ? parsed.earnedAchievements : [],
      unlockedSpecs: Array.isArray(parsed.unlockedSpecs) ? parsed.unlockedSpecs : [],
      completedBTs: Array.isArray(parsed.completedBTs) ? parsed.completedBTs : [],
      guildId: typeof parsed.guildId === "string" ? parsed.guildId : null,
      guildQuestProgress: typeof parsed.guildQuestProgress === "object" && parsed.guildQuestProgress ? parsed.guildQuestProgress : {},
      guildQuestDone: !!parsed.guildQuestDone,
      monarchInterest: Number.isFinite(Number(parsed.monarchInterest)) ? Math.max(0, Math.floor(Number(parsed.monarchInterest))) : 0,
      monarchStage: Number.isFinite(Number(parsed.monarchStage)) ? Math.max(0, Math.floor(Number(parsed.monarchStage))) : 0,
      isMonarch: !!parsed.isMonarch,
      ascensionCount: Number.isFinite(Number(parsed.ascensionCount)) ? Math.max(0, Math.floor(Number(parsed.ascensionCount))) : 0,
      soundOn: typeof parsed.soundOn === "boolean" ? parsed.soundOn : true,
      energyState: typeof parsed.energyState === "object" && parsed.energyState ? parsed.energyState : def.energyState,
      energyHistory: Array.isArray(parsed.energyHistory) ? parsed.energyHistory.slice(-60) : [],
      discipline: sanitiseDiscipline(parsed.discipline, def.discipline),
      bossHpSnapshot: Array.isArray(parsed.bossHpSnapshot) ? parsed.bossHpSnapshot : null,
      secretUnlockedIds: Array.isArray(parsed.secretUnlockedIds) ? parsed.secretUnlockedIds : [],
      savedAt: typeof parsed.savedAt === "number" ? parsed.savedAt : null,
    };
  } catch (_) { return null; }
}

export function deleteSave() {
  try { localStorage.removeItem(SAVE_KEY); return true; }
  catch (_) { return false; }
}

export function hasSave() {
  try { return localStorage.getItem(SAVE_KEY) !== null; }
  catch (_) { return false; }
}

export function exportSave() {
  try { return localStorage.getItem(SAVE_KEY) || null; }
  catch (_) { return null; }
}

export function debounce(fn, ms) {
  let timer = null;
  return function () {
    const args = arguments; const ctx = this;
    if (timer) clearTimeout(timer);
    timer = setTimeout(function () { fn.apply(ctx, args); }, ms);
  };
}
