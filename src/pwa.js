import {
  DEFAULT_BEDTIME,
  DEFAULT_TIMEZONE,
  loadPrivateLinkKey,
} from "./privateConfig.js";

export const NOTIFICATION_SETTINGS_KEY = "arise_notification_settings_v1";
export const NOTIFICATION_PROMPT_KEY = "arise_notification_prompt_seen_v1";
const NOTIFICATION_SENT_PREFIX = "arise_notification_sent_v1_";

export const SYSTEM_NOTIFICATION_COPY = {
  dailyQuest: { title:"DAILY QUEST", body:"A new Daily Quest has arrived.", tag:"daily-quest", url:"/?open=daily", category:"quest" },
  morningRoutine: { title:"MORNING ROUTINE", body:"Morning Routine protocol is ready.", tag:"morning-routine", url:"/?open=daily", category:"quest" },
  energy: { title:"ENERGY CHECK-IN", body:"Energy Check-In required.", tag:"energy-check", url:"/?open=energy", category:"energy" },
  trainingGate: { title:"GATE DETECTED", body:"Training Gate detected.", tag:"training-gate", url:"/?open=daily", category:"quest" },
  bossRaid: { title:"BOSS RAID", body:"Boss Raid is now available.", tag:"boss-raid", url:"/?open=boss", category:"boss" },
  dungeonBreak: { title:"DUNGEON BREAK WARNING", body:"Dungeon Break risk increasing.", tag:"dungeon-break", url:"/?open=daily", category:"appLock", requireInteraction:true },
  penalty: { title:"PENALTY WARNING", body:"Penalty warning: required quest incomplete.", tag:"penalty-warning", url:"/?open=daily", category:"quest", requireInteraction:true },
  freeTime: { title:"REWARD ACQUIRED", body:"Free Time Voucher unlocked.", tag:"free-time", url:"/", category:"quest" },
  nightRoutine: { title:"NIGHT ROUTINE", body:"Night Routine begins soon.", tag:"night-routine", url:"/?open=daily", category:"quest" },
  bedtime: { title:"BEDTIME REMINDER", body:"Begin shutdown protocol. Bedtime target approaching.", tag:"bedtime", url:"/?open=energy", category:"energy" },
  sleepTarget: { title:"SLEEP TARGET", body:"Sleep target: 10:30 PM.", tag:"sleep-target", url:"/?open=energy", category:"energy" },
  story: { title:"STORY MODE", body:"A new Story chapter has unlocked.", tag:"story-unlock", url:"/?open=story", category:"story" },
  reevaluation: { title:"RE-EVALUATION", body:"Hunter re-evaluation is now available.", tag:"reevaluation", url:"/?open=settings", category:"story" },
  test: { title:"SYSTEM TEST", body:"System connection confirmed.", tag:"system-test", url:"/", category:"system" },
};

export const DEFAULT_NOTIFICATION_SETTINGS = {
  enabled:false,
  timezone:DEFAULT_TIMEZONE,
  morningTime:"06:35",
  energyCheckTime:"06:40",
  trainingTime:"16:00",
  eveningTime:"19:30",
  nightTime:"21:45",
  bedtimeTime:"22:00",
  sleepTargetTime:DEFAULT_BEDTIME,
  quietStart:"22:45",
  quietEnd:"06:30",
  storyAlerts:true,
  bossAlerts:true,
  energyAlerts:true,
  questAlerts:true,
  appLockAlerts:true,
};

function safeParse(value, fallback) {
  try { const parsed=JSON.parse(value); return parsed && typeof parsed === "object" ? parsed : fallback; }
  catch (_) { return fallback; }
}

export function loadNotificationSettings() {
  try { return { ...DEFAULT_NOTIFICATION_SETTINGS, ...safeParse(localStorage.getItem(NOTIFICATION_SETTINGS_KEY), {}) }; }
  catch (_) { return { ...DEFAULT_NOTIFICATION_SETTINGS }; }
}

export function saveNotificationSettings(settings) {
  const next={ ...DEFAULT_NOTIFICATION_SETTINGS, ...(settings || {}) };
  try {
    localStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent("arise:notification-settings-changed", { detail:next }));
    return true;
  } catch (_) { return false; }
}

export function isIOSDevice() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent || "") || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

export function isStandaloneMode() {
  if (typeof window === "undefined") return false;
  return Boolean(window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) || Boolean(window.navigator.standalone);
}

export function notificationSupport() {
  if (typeof window === "undefined" || !("Notification" in window) || !("serviceWorker" in navigator)) return "unsupported";
  if (isIOSDevice() && !isStandaloneMode()) return "install_required";
  return "supported";
}

export function currentNotificationPermission() {
  try { return "Notification" in window ? Notification.permission : "unsupported"; }
  catch (_) { return "unsupported"; }
}

export async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return { ok:false, reason:"unsupported" };
  if (!import.meta.env.PROD) return { ok:false, reason:"development" };
  try {
    const registration=await navigator.serviceWorker.register("/sw.js", { scope:"/" });
    await navigator.serviceWorker.ready;
    return { ok:true, registration };
  } catch (error) {
    return { ok:false, reason:error && error.message ? error.message : "registration_failed" };
  }
}

function urlBase64ToUint8Array(base64String) {
  const padding="=".repeat((4-(base64String.length%4))%4);
  const base64=(base64String+padding).replace(/-/g,"+").replace(/_/g,"/");
  const raw=window.atob(base64);
  return Uint8Array.from([...raw].map((character) => character.charCodeAt(0)));
}

async function subscribeForWebPush(registration, settings) {
  const publicKey=import.meta.env.VITE_WEB_PUSH_PUBLIC_KEY;
  const subscribeUrl=import.meta.env.VITE_WEB_PUSH_SUBSCRIBE_URL || "/api/notifications/subscribe";
  if (!publicKey || !subscribeUrl || !registration || !registration.pushManager) return { configured:false, reason:"backend_required" };
  try {
    let subscription=await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription=await registration.pushManager.subscribe({ userVisibleOnly:true, applicationServerKey:urlBase64ToUint8Array(publicKey) });
    }
    const response=await fetch(subscribeUrl, {
      method:"POST",
      headers:{ "Content-Type":"application/json", "Authorization":"Bearer "+loadPrivateLinkKey() },
      body:JSON.stringify({ subscription, preferences:settings || loadNotificationSettings(), app:"gatebound-system", timezone:(settings&&settings.timezone)||DEFAULT_TIMEZONE, permission:currentNotificationPermission(), installedPwa:isStandaloneMode() }),
    });
    if (!response.ok) throw new Error("Subscription endpoint returned "+response.status);
    return { configured:true, subscription };
  } catch (error) {
    return { configured:true, error:error && error.message ? error.message : "subscription_failed" };
  }
}

export async function requestNotificationAccess() {
  const support=notificationSupport();
  if (support !== "supported") return { ok:false, status:support };
  try {
    const permission=await Notification.requestPermission();
    if (permission !== "granted") return { ok:false, status:permission };
    const result=await registerServiceWorker();
    const registration=result.registration || await navigator.serviceWorker.ready;
    const settings={ ...loadNotificationSettings(), enabled:true };
    saveNotificationSettings(settings);
    const push=await subscribeForWebPush(registration,settings);
    return { ok:true, status:"granted", push };
  } catch (error) {
    return { ok:false, status:"error", error:error && error.message ? error.message : "permission_failed" };
  }
}

function minutes(value) {
  const parts=String(value || "00:00").split(":").map(Number);
  return (parts[0] || 0)*60+(parts[1] || 0);
}

function insideQuietHours(settings, now) {
  const current=now.getHours()*60+now.getMinutes();
  const start=minutes(settings.quietStart);
  const end=minutes(settings.quietEnd);
  if (start === end) return false;
  return start < end ? current >= start && current < end : current >= start || current < end;
}

function categoryEnabled(settings, category) {
  if (category === "story") return settings.storyAlerts;
  if (category === "boss") return settings.bossAlerts;
  if (category === "energy") return settings.energyAlerts;
  if (category === "quest") return settings.questAlerts;
  if (category === "appLock") return settings.appLockAlerts;
  return true;
}

export async function syncPrivateNotificationProfile(settings) {
  if (currentNotificationPermission() !== "granted" || !loadPrivateLinkKey()) return { ok:false, status:"not_linked" };
  try {
    const registration=await navigator.serviceWorker.ready;
    const subscription=await registration.pushManager.getSubscription();
    if (!subscription) return { ok:false, status:"subscription_required" };
    const response=await fetch(import.meta.env.VITE_WEB_PUSH_SUBSCRIBE_URL || "/api/notifications/subscribe", {
      method:"POST",
      headers:{ "Content-Type":"application/json", "Authorization":"Bearer "+loadPrivateLinkKey() },
      body:JSON.stringify({ subscription, preferences:settings || loadNotificationSettings(), app:"gatebound-system", timezone:(settings&&settings.timezone)||DEFAULT_TIMEZONE, permission:currentNotificationPermission(), installedPwa:isStandaloneMode() }),
    });
    const body=await response.json().catch(() => ({}));
    return response.ok ? { ok:true, body } : { ok:false, status:body.error || "sync_failed" };
  } catch (error) { return { ok:false, status:error&&error.message?error.message:"sync_failed" }; }
}

export async function sendPrivateTestNotification() {
  const key=loadPrivateLinkKey();
  if (!key) return { ok:false, status:"private_link_key_required" };
  try {
    const response=await fetch("/api/notifications/test", { method:"POST", headers:{ "Content-Type":"application/json", "Authorization":"Bearer "+key }, body:"{}" });
    const body=await response.json().catch(() => ({}));
    return response.ok ? { ok:true, body } : { ok:false, status:body.error || "test_failed" };
  } catch (error) { return { ok:false, status:error&&error.message?error.message:"test_failed" }; }
}

export async function sendSystemNotification(type, overrides) {
  const settings=loadNotificationSettings();
  const force=Boolean(overrides && overrides.force);
  const template=SYSTEM_NOTIFICATION_COPY[type] || SYSTEM_NOTIFICATION_COPY.test;
  if (!force && (!settings.enabled || !categoryEnabled(settings, template.category) || insideQuietHours(settings,new Date()))) return { ok:false, status:"suppressed" };
  if (currentNotificationPermission() !== "granted") return { ok:false, status:"permission_required" };
  const payload={ ...template, ...(overrides || {}) };
  delete payload.force;
  try {
    const registration=await navigator.serviceWorker.ready;
    await registration.showNotification(payload.title || "ARISE — THE SYSTEM", {
      body:payload.body,
      icon:"/icons/icon-192.png",
      badge:"/icons/icon-96.png",
      tag:payload.tag,
      requireInteraction:Boolean(payload.requireInteraction),
      data:{ url:payload.url || "/", type },
    });
    return { ok:true };
  } catch (error) {
    try { new Notification(payload.title || "ARISE — THE SYSTEM", { body:payload.body, icon:"/icons/icon-192.png", tag:payload.tag }); return { ok:true }; }
    catch (_) { return { ok:false, status:"display_failed" }; }
  }
}

function localDateKey(date) {
  return date.getFullYear()+"-"+String(date.getMonth()+1).padStart(2,"0")+"-"+String(date.getDate()).padStart(2,"0");
}

function scheduleCheck() {
  const settings=loadNotificationSettings();
  if (!settings.enabled || currentNotificationPermission() !== "granted") return;
  const now=new Date();
  const current=String(now.getHours()).padStart(2,"0")+":"+String(now.getMinutes()).padStart(2,"0");
  const schedule=[
    [settings.morningTime,"morningRoutine"], [settings.energyCheckTime,"energy"], [settings.trainingTime,"trainingGate"], [settings.eveningTime,"energy"],
    [settings.nightTime,"nightRoutine"], [settings.bedtimeTime,"bedtime"], [settings.sleepTargetTime,"sleepTarget"],
  ];
  schedule.forEach(([time,type]) => {
    if (time !== current) return;
    const key=NOTIFICATION_SENT_PREFIX+localDateKey(now)+"_"+type;
    try {
      if (localStorage.getItem(key)) return;
      localStorage.setItem(key,"1");
      sendSystemNotification(type);
    } catch (_) {}
  });
}

export function startForegroundNotificationScheduler() {
  scheduleCheck();
  const timer=window.setInterval(scheduleCheck,30000);
  return () => window.clearInterval(timer);
}

let deferredInstallPrompt=null;

export function initializeInstallPromptCapture() {
  if (typeof window === "undefined" || window.__ariseInstallCapture) return;
  window.__ariseInstallCapture=true;
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt=event;
    window.dispatchEvent(new CustomEvent("arise:install-available"));
  });
  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt=null;
    window.dispatchEvent(new CustomEvent("arise:app-installed"));
  });
}

export function installPromptAvailable() { return Boolean(deferredInstallPrompt); }

export async function triggerInstallPrompt() {
  if (!deferredInstallPrompt) return { ok:false, status:"manual_instructions" };
  deferredInstallPrompt.prompt();
  const choice=await deferredInstallPrompt.userChoice;
  deferredInstallPrompt=null;
  return { ok:choice && choice.outcome === "accepted", status:choice ? choice.outcome : "dismissed" };
}

export function notificationPromptSeen() {
  try { return localStorage.getItem(NOTIFICATION_PROMPT_KEY) === "1"; }
  catch (_) { return false; }
}

export function markNotificationPromptSeen() {
  try { localStorage.setItem(NOTIFICATION_PROMPT_KEY,"1"); } catch (_) {}
}

export function pushBackendConfigured() {
  return Boolean(import.meta.env.VITE_WEB_PUSH_PUBLIC_KEY);
}
