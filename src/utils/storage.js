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

/* ---------------------------------------------------------------------------
   SYSTEM 2 SLICES — profile, routines, story, npc, business, app lock,
   free time, penalty. All new fields default safely so v1 saves upgrade
   in place without losing progress.
--------------------------------------------------------------------------- */
export function defaultProfile() {
  return {
    complete: false,
    age: null, heightCm: null, weightKg: null, sex: null, /* sex optional */
    sport: "track", mainPath: "speed",
    events: [], prs: {},            /* e.g. { "100m": "12.8" } */
    injuries: "",
    sleepTarget: "22:30", wakeTarget: "06:30",
    schedule: "summer",             /* summer | school | custom */
    equipment: { track: true, gym: false, pullupBar: false, homeSpace: true },
    activityLevel: "moderate",      /* low | moderate | high */
    nutritionGoal: "performance",   /* performance | lean | gain */
    businessGoal: "",
    freeTimePrefs: "",
  };
}

function sanitiseProfile(raw) {
  const def = defaultProfile();
  if (!raw || typeof raw !== "object") return def;
  const num = function (v, lo, hi) {
    const n = Number(v);
    return Number.isFinite(n) && n >= lo && n <= hi ? n : null;
  };
  return {
    complete:     !!raw.complete,
    age:          num(raw.age, 5, 120),
    heightCm:     num(raw.heightCm, 80, 260),
    weightKg:     num(raw.weightKg, 20, 300),
    sex:          raw.sex === "male" || raw.sex === "female" ? raw.sex : null,
    sport:        typeof raw.sport === "string" ? raw.sport : def.sport,
    mainPath:     typeof raw.mainPath === "string" ? raw.mainPath : def.mainPath,
    events:       Array.isArray(raw.events) ? raw.events.slice(0, 10) : [],
    prs:          raw.prs && typeof raw.prs === "object" ? raw.prs : {},
    injuries:     typeof raw.injuries === "string" ? raw.injuries.slice(0, 400) : "",
    sleepTarget:  typeof raw.sleepTarget === "string" ? raw.sleepTarget : def.sleepTarget,
    wakeTarget:   typeof raw.wakeTarget === "string" ? raw.wakeTarget : def.wakeTarget,
    schedule:     typeof raw.schedule === "string" ? raw.schedule : def.schedule,
    equipment:    raw.equipment && typeof raw.equipment === "object" ? {
      track:     !!raw.equipment.track,
      gym:       !!raw.equipment.gym,
      pullupBar: !!raw.equipment.pullupBar,
      homeSpace: raw.equipment.homeSpace !== false,
    } : def.equipment,
    activityLevel:  typeof raw.activityLevel === "string" ? raw.activityLevel : def.activityLevel,
    nutritionGoal:  typeof raw.nutritionGoal === "string" ? raw.nutritionGoal : def.nutritionGoal,
    businessGoal:   typeof raw.businessGoal === "string" ? raw.businessGoal.slice(0, 300) : "",
    freeTimePrefs:  typeof raw.freeTimePrefs === "string" ? raw.freeTimePrefs.slice(0, 300) : "",
  };
}

export function defaultBusiness() {
  return {
    revenueGoal: 0, savingsGoal: 0,
    incomeLog: [], spendLog: [],       /* { ts, amount, note } — user-entered real numbers */
    projects: [],                      /* { id, name, milestones: [{id,name,done}] } */
    questProgress: {}, questDone: {},  /* business quest chain progress */
    deepWorkDates: [],                 /* dateKeys of completed deep-work quests */
    skillsUnlocked: [],
  };
}

function sanitiseBusiness(raw) {
  const def = defaultBusiness();
  if (!raw || typeof raw !== "object") return def;
  const logOk = function (arr) {
    if (!Array.isArray(arr)) return [];
    return arr.filter(function (e) {
      return e && typeof e === "object" && Number.isFinite(Number(e.amount));
    }).slice(-200);
  };
  return {
    revenueGoal:   Number.isFinite(Number(raw.revenueGoal)) ? Math.max(0, Number(raw.revenueGoal)) : 0,
    savingsGoal:   Number.isFinite(Number(raw.savingsGoal)) ? Math.max(0, Number(raw.savingsGoal)) : 0,
    incomeLog:     logOk(raw.incomeLog),
    spendLog:      logOk(raw.spendLog),
    projects:      Array.isArray(raw.projects) ? raw.projects.slice(0, 30) : [],
    questProgress: raw.questProgress && typeof raw.questProgress === "object" ? raw.questProgress : {},
    questDone:     raw.questDone && typeof raw.questDone === "object" ? raw.questDone : {},
    deepWorkDates: Array.isArray(raw.deepWorkDates) ? raw.deepWorkDates.slice(-120) : [],
    skillsUnlocked: Array.isArray(raw.skillsUnlocked) ? raw.skillsUnlocked : [],
  };
}

export function defaultAppLock() {
  return {
    enabled: false,
    blockedApps: ["TikTok", "Instagram", "YouTube Shorts"],
    requirement: "daily",             /* daily | routine | training */
    passes: 0,                        /* earned App Unlock Passes */
    passMinutes: 30,                  /* minutes granted per pass */
  };
}

function sanitiseAppLock(raw) {
  const def = defaultAppLock();
  if (!raw || typeof raw !== "object") return def;
  return {
    enabled:     !!raw.enabled,
    blockedApps: Array.isArray(raw.blockedApps) ? raw.blockedApps.filter(function (a) { return typeof a === "string"; }).slice(0, 20) : def.blockedApps,
    requirement: typeof raw.requirement === "string" ? raw.requirement : "daily",
    passes:      Number.isFinite(Number(raw.passes)) ? Math.max(0, Math.floor(Number(raw.passes))) : 0,
    passMinutes: Number.isFinite(Number(raw.passMinutes)) ? Math.min(120, Math.max(5, Math.floor(Number(raw.passMinutes)))) : 30,
  };
}

export function defaultFreeTime() {
  return { minutes: 0, vouchers: 0, spentToday: 0, lastSpendDate: null, earnBlocked: false };
}

function sanitiseFreeTime(raw) {
  const def = defaultFreeTime();
  if (!raw || typeof raw !== "object") return def;
  return {
    minutes:       Number.isFinite(Number(raw.minutes)) ? Math.max(0, Math.floor(Number(raw.minutes))) : 0,
    vouchers:      Number.isFinite(Number(raw.vouchers)) ? Math.max(0, Math.floor(Number(raw.vouchers))) : 0,
    spentToday:    Number.isFinite(Number(raw.spentToday)) ? Math.max(0, Math.floor(Number(raw.spentToday))) : 0,
    lastSpendDate: typeof raw.lastSpendDate === "string" ? raw.lastSpendDate : null,
    earnBlocked:   !!raw.earnBlocked,
  };
}

function sanitiseStory(raw) {
  if (!raw || typeof raw !== "object") return { completedChapters: [], seenScenes: [], architectMet: false };
  return {
    completedChapters: Array.isArray(raw.completedChapters) ? raw.completedChapters : [],
    seenScenes:        Array.isArray(raw.seenScenes) ? raw.seenScenes.slice(-200) : [],
    architectMet:      !!raw.architectMet,
  };
}

function sanitiseNpcState(raw) {
  if (!raw || typeof raw !== "object") return { relationships: {}, lastTalk: {}, challengesDone: [] };
  return {
    relationships:  raw.relationships && typeof raw.relationships === "object" ? raw.relationships : {},
    lastTalk:       raw.lastTalk && typeof raw.lastTalk === "object" ? raw.lastTalk : {},
    challengesDone: Array.isArray(raw.challengesDone) ? raw.challengesDone : [],
  };
}

function sanitiseRoutines(raw) {
  if (!raw || typeof raw !== "object") return { dateKey: null, done: {}, streak: 0, lastFullDate: null };
  return {
    dateKey:      typeof raw.dateKey === "string" ? raw.dateKey : null,
    done:         raw.done && typeof raw.done === "object" ? raw.done : {},
    streak:       Number.isFinite(Number(raw.streak)) ? Math.max(0, Math.floor(Number(raw.streak))) : 0,
    lastFullDate: typeof raw.lastFullDate === "string" ? raw.lastFullDate : null,
  };
}

function sanitisePenalty(raw) {
  if (!raw || typeof raw !== "object") return { activeZone: null, history: [] };
  return {
    activeZone: raw.activeZone && typeof raw.activeZone === "object" ? raw.activeZone : null,
    history:    Array.isArray(raw.history) ? raw.history.slice(-30) : [],
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
    deployedShadowId: null,
    discipline: { startTs: null, bestDays: 0, lastResetTs: null, motivation: "", urgeLog: [], hidden: false },
    bossHpSnapshot: null, secretUnlockedIds: [],
    /* System 2 slices */
    profile: defaultProfile(),
    routines: sanitiseRoutines(null),
    story: sanitiseStory(null),
    npcState: sanitiseNpcState(null),
    business: defaultBusiness(),
    appLock: defaultAppLock(),
    freeTime: defaultFreeTime(),
    penalty: sanitisePenalty(null),
    streakShields: 0,
    systemSkin: "default",
    auraFrame: "none",
    trainingLog: [],
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
      deployedShadowId: typeof parsed.deployedShadowId === "string" ? parsed.deployedShadowId : null,
      discipline: sanitiseDiscipline(parsed.discipline, def.discipline),
      bossHpSnapshot: Array.isArray(parsed.bossHpSnapshot) ? parsed.bossHpSnapshot : null,
      secretUnlockedIds: Array.isArray(parsed.secretUnlockedIds) ? parsed.secretUnlockedIds : [],
      /* System 2 slices — upgrade v1 saves in place with safe defaults */
      profile: sanitiseProfile(parsed.profile),
      routines: sanitiseRoutines(parsed.routines),
      story: sanitiseStory(parsed.story),
      npcState: sanitiseNpcState(parsed.npcState),
      business: sanitiseBusiness(parsed.business),
      appLock: sanitiseAppLock(parsed.appLock),
      freeTime: sanitiseFreeTime(parsed.freeTime),
      penalty: sanitisePenalty(parsed.penalty),
      streakShields: Number.isFinite(Number(parsed.streakShields)) ? Math.max(0, Math.floor(Number(parsed.streakShields))) : 0,
      systemSkin: typeof parsed.systemSkin === "string" ? parsed.systemSkin : "default",
      auraFrame: typeof parsed.auraFrame === "string" ? parsed.auraFrame : "none",
      trainingLog: Array.isArray(parsed.trainingLog) ? parsed.trainingLog.slice(-200) : [],
      innerDemonActive: !!parsed.innerDemonActive,
      lastEvalStats: parsed.lastEvalStats && typeof parsed.lastEvalStats === "object" ? parsed.lastEvalStats : null,
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
