/**
 * ARISE — Safe Local Storage Utilities
 * All operations wrapped in try/catch.
 * Never throws. Always returns safe defaults on failure.
 */

const SAVE_KEY     = "arise_save_v1";
const SAVE_VERSION = 2;
const SAVE_BACKUP_KEY = "arise_save_backup_v1";
const MANUAL_BACKUP_KEY = "arise_save_backup_latest";
const STORY_V2_KEY = "arise_story_campaign_v2";
const STORY_V3_KEY = "arise_story_campaign_v3";
const STORY_V4_KEY = "arise_story_campaign_v4";
const STORY_BACKUP_KEY = "arise_story_backup_v4";
const STORY_NEW_GAME_MARKER = "arise_story_new_game_requested";
const REEVAL_KEY = "arise_last_reeval";
const DAILY_RESET_KEY = "arise_last_daily_reset";

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
    activeTitle: "awakened",
    stats: sanitiseStats(null),
  };
  if (!raw || typeof raw !== "object") return def;
  const level  = Number(raw.level);
  const xp     = Number(raw.xp);
  const streak = Number(raw.streak);
  return {
    name:        typeof raw.name === "string" && raw.name.trim() ? raw.name : def.name,
    level:       Number.isFinite(level)  && level  >= 1 ? Math.floor(level)  : 1,
    xp:          Number.isFinite(xp)     && xp     >= 0 ? Math.floor(xp)     : 0,
    streak:      Number.isFinite(streak) && streak >= 0 ? Math.floor(streak) : 0,
    job:         typeof raw.job === "string"      ? raw.job      : def.job,
    physique:    typeof raw.physique === "string" ? raw.physique : def.physique,
    goals:       Array.isArray(raw.goals)         ? raw.goals    : [],
    activeTitle: typeof raw.activeTitle === "string" ? raw.activeTitle : "awakened",
    stats:       sanitiseStats(raw.stats),
  };
}

export function defaultSave() {
  return {
    version: SAVE_VERSION, phase: "onboard",
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
    energyState: {
      sleepReserve: 72,
      hydrationReserve: 70,
      nutritionReserve: 64,
      focusBandwidth: 62,
      muscleFatigue: 34,
      neuralLoad: 28,
      stressNoise: 30,
      lastLoggedOn: null,
    },
    energyScore: 68,
    disciplineState: {
      willpower: 61,
      routineIntegrity: 58,
      urgeControl: 54,
      executionSharpness: 57,
      recoveryCompliance: 60,
      slips: 1,
      cleanCycles: 0,
      lastLoggedOn: null,
      protocols: {
        wake: true,
        training: true,
        nutrition: false,
        focus: false,
        sleep: true,
      },
    },
    disciplineScore: 57,
    bossHpSnapshot: null, secretUnlockedIds: [],
  };
}

export function saveGame(state) {
  try {
    const payload = Object.assign({}, state, { version: SAVE_VERSION, savedAt: Date.now() });
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
    if (parsed.version && parsed.version > SAVE_VERSION) return null;
    const parsedVersion = Number.isFinite(Number(parsed.version)) ? Number(parsed.version) : 1;
    if (parsedVersion < SAVE_VERSION && !localStorage.getItem(SAVE_BACKUP_KEY)) {
      const backup = safeStringify({ schemaVersion: parsedVersion, backedUpAt: Date.now(), raw });
      if (backup) localStorage.setItem(SAVE_BACKUP_KEY, backup);
    }
    const def = defaultSave();
    return {
      version: SAVE_VERSION,
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
      energyScore: Number.isFinite(Number(parsed.energyScore)) ? Math.max(0, Math.min(100, Math.round(Number(parsed.energyScore)))) : def.energyScore,
      disciplineState: typeof parsed.disciplineState === "object" && parsed.disciplineState ? parsed.disciplineState : def.disciplineState,
      disciplineScore: Number.isFinite(Number(parsed.disciplineScore)) ? Math.max(0, Math.min(100, Math.round(Number(parsed.disciplineScore)))) : def.disciplineScore,
      innerDemonActive: !!parsed.innerDemonActive,
      lastEvalStats: parsed.lastEvalStats && typeof parsed.lastEvalStats === "object" ? parsed.lastEvalStats : null,
      bossHpSnapshot: Array.isArray(parsed.bossHpSnapshot) ? parsed.bossHpSnapshot : null,
      secretUnlockedIds: Array.isArray(parsed.secretUnlockedIds) ? parsed.secretUnlockedIds : [],
      savedAt: typeof parsed.savedAt === "number" ? parsed.savedAt : null,
      migratedFrom: parsedVersion < SAVE_VERSION ? parsedVersion : null,
    };
  } catch (_) { return null; }
}

export function deleteSave() {
  try {
    localStorage.removeItem(SAVE_KEY);
    localStorage.removeItem(STORY_V2_KEY);
    localStorage.removeItem(STORY_V3_KEY);
    localStorage.removeItem(STORY_V4_KEY);
    localStorage.removeItem(STORY_NEW_GAME_MARKER);
    localStorage.removeItem(REEVAL_KEY);
    localStorage.removeItem(DAILY_RESET_KEY);
    return true;
  }
  catch (_) { return false; }
}

export function hasSave() {
  try { return localStorage.getItem(SAVE_KEY) !== null; }
  catch (_) { return false; }
}

export function exportSave() {
  try {
    return safeStringify({
      format: "arise_full_backup",
      schemaVersion: SAVE_VERSION,
      exportedAt: Date.now(),
      mainSave: safeParse(localStorage.getItem(SAVE_KEY), null),
      storyV4: safeParse(localStorage.getItem(STORY_V4_KEY), null),
      storyV3: safeParse(localStorage.getItem(STORY_V3_KEY), null),
      storyV2: safeParse(localStorage.getItem(STORY_V2_KEY), null),
      reevaluation: localStorage.getItem(REEVAL_KEY),
      dailyReset: localStorage.getItem(DAILY_RESET_KEY),
    });
  }
  catch (_) { return null; }
}

export function backupSaveData(reason) {
  try {
    const bundle = exportSave();
    if (!bundle) return false;
    const backup = safeStringify({ reason: reason || "manual", backedUpAt: Date.now(), bundle: safeParse(bundle, null) });
    if (!backup) return false;
    localStorage.setItem(MANUAL_BACKUP_KEY, backup);
    return true;
  } catch (_) { return false; }
}

export function importSave(raw) {
  try {
    const parsed = typeof raw === "string" ? safeParse(raw, null) : raw;
    if (!parsed || typeof parsed !== "object") return { ok:false, error:"Invalid backup file." };
    backupSaveData("before_import");
    if (parsed.format === "arise_full_backup") {
      if (!parsed.mainSave || typeof parsed.mainSave !== "object") return { ok:false, error:"Main save is missing." };
      localStorage.setItem(SAVE_KEY, JSON.stringify(parsed.mainSave));
      if (parsed.storyV4) localStorage.setItem(STORY_V4_KEY, JSON.stringify(parsed.storyV4));
      else if (parsed.storyV3) localStorage.setItem(STORY_V3_KEY, JSON.stringify(parsed.storyV3));
      else if (parsed.storyV2) localStorage.setItem(STORY_V2_KEY, JSON.stringify(parsed.storyV2));
      if (parsed.reevaluation !== null && parsed.reevaluation !== undefined) localStorage.setItem(REEVAL_KEY, String(parsed.reevaluation));
      if (parsed.dailyReset !== null && parsed.dailyReset !== undefined) localStorage.setItem(DAILY_RESET_KEY, String(parsed.dailyReset));
    } else {
      if (!parsed.player || typeof parsed.player !== "object") return { ok:false, error:"Unrecognized save format." };
      localStorage.setItem(SAVE_KEY, JSON.stringify(parsed));
    }
    return { ok:true };
  } catch (_) { return { ok:false, error:"Import failed." }; }
}

export function resetStoryOnly() {
  try {
    backupSaveData("before_story_reset");
    localStorage.removeItem(STORY_V2_KEY);
    localStorage.removeItem(STORY_V3_KEY);
    localStorage.removeItem(STORY_V4_KEY);
    localStorage.setItem(STORY_NEW_GAME_MARKER, "1");
    return true;
  } catch (_) { return false; }
}

export function debounce(fn, ms) {
  let timer = null;
  return function () {
    const args = arguments; const ctx = this;
    if (timer) clearTimeout(timer);
    timer = setTimeout(function () { fn.apply(ctx, args); }, ms);
  };
}
