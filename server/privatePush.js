import webpush from "web-push";
import { get, put } from "@vercel/blob";

export const PRIVATE_MODE=true;
export const DEFAULT_TIMEZONE="America/New_York";
export const DEFAULT_BEDTIME="22:30";
export const DEFAULT_WAKE_TIME="06:30";
export const DEFAULT_SLEEP_GOAL_HOURS=8;
export const DEFAULT_MAIN_PATH="Speed/Athleticism";
const PROFILE_KEY="gatebound:private:notification-profile:v1";
const PROFILE_BLOB_PATH="gatebound/private-notification-profile-v1.json";

const DEFAULT_PREFERENCES={
  enabled:false, timezone:DEFAULT_TIMEZONE,
  morningTime:"06:35", energyCheckTime:"06:40", trainingTime:"16:00", eveningTime:"19:30",
  nightTime:"21:45", bedtimeTime:"22:00", sleepTargetTime:DEFAULT_BEDTIME,
  quietStart:"22:45", quietEnd:DEFAULT_WAKE_TIME,
  storyAlerts:true, bossAlerts:true, energyAlerts:true, questAlerts:true, appLockAlerts:true,
};

const PAYLOADS={
  morningRoutine:{title:"MORNING ROUTINE",body:"Morning Routine protocol is ready.",tag:"morning-routine",url:"/?open=daily",category:"quest"},
  energy:{title:"ENERGY CHECK-IN",body:"Energy Check-In required.",tag:"energy-check",url:"/?open=energy",category:"energy"},
  trainingGate:{title:"GATE DETECTED",body:"Training Gate detected.",tag:"training-gate",url:"/?open=daily",category:"quest"},
  eveningRoutine:{title:"EVENING ROUTINE",body:"Evening objectives are awaiting completion.",tag:"evening-routine",url:"/?open=daily",category:"quest"},
  nightRoutine:{title:"NIGHT ROUTINE",body:"Night Routine begins soon.",tag:"night-routine",url:"/?open=daily",category:"quest"},
  bedtime:{title:"SLEEP TARGET WARNING",body:"Shutdown protocol begins in thirty minutes.",tag:"bedtime-warning",url:"/?open=energy",category:"energy"},
  sleepTarget:{title:"SLEEP TARGET",body:"Sleep target: 10:30 PM.",tag:"sleep-target",url:"/?open=energy",category:"energy",requireInteraction:true},
  test:{title:"SYSTEM TEST",body:"System connection confirmed.",tag:"system-test",url:"/",category:"system"},
};

function env(name) { return String(process.env[name] || "").trim(); }
function json(response,status,payload) { response.status(status).json(payload); }

export function requirePrivateAccess(request,response) {
  const secret=env("PRIVATE_API_TOKEN");
  const supplied=String(request.headers.authorization || "");
  if (!secret || supplied !== "Bearer "+secret) { json(response,401,{ok:false,error:"private_link_required"}); return false; }
  return true;
}

export function requireCronAccess(request,response) {
  const secret=env("CRON_SECRET");
  const supplied=String(request.headers.authorization || "");
  if (!secret || supplied !== "Bearer "+secret) { json(response,401,{ok:false,error:"invalid_cron_authority"}); return false; }
  return true;
}

function redisConfig() {
  return {
    url:env("KV_REST_API_URL") || env("UPSTASH_REDIS_REST_URL"),
    token:env("KV_REST_API_TOKEN") || env("UPSTASH_REDIS_REST_TOKEN"),
  };
}

async function redis(command) {
  const config=redisConfig();
  if (!config.url || !config.token) throw new Error("private_storage_not_configured");
  const response=await fetch(config.url.replace(/\/$/,""),{
    method:"POST",
    headers:{"Authorization":"Bearer "+config.token,"Content-Type":"application/json"},
    body:JSON.stringify(command),
  });
  if (!response.ok) throw new Error("private_storage_failed_"+response.status);
  const body=await response.json();
  if (body.error) throw new Error(body.error);
  return body.result;
}

export async function loadProfile() {
  if (env("BLOB_READ_WRITE_TOKEN")) {
    const result=await get(PROFILE_BLOB_PATH,{access:"private"});
    if (!result || result.statusCode!==200 || !result.stream) return null;
    try { return JSON.parse(await new Response(result.stream).text()); } catch (_) { return null; }
  }
  const raw=await redis(["GET",PROFILE_KEY]);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch (_) { return null; }
}

export async function saveProfile(profile) {
  if (env("BLOB_READ_WRITE_TOKEN")) {
    await put(PROFILE_BLOB_PATH,JSON.stringify(profile),{access:"private",allowOverwrite:true,contentType:"application/json",cacheControlMaxAge:60});
    return profile;
  }
  await redis(["SET",PROFILE_KEY,JSON.stringify(profile)]);
  return profile;
}

function cleanPreferences(raw) {
  const next={...DEFAULT_PREFERENCES,...(raw&&typeof raw==="object"?raw:{})};
  const timeKeys=["morningTime","energyCheckTime","trainingTime","eveningTime","nightTime","bedtimeTime","sleepTargetTime","quietStart","quietEnd"];
  timeKeys.forEach((key)=>{ if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(String(next[key]))) next[key]=DEFAULT_PREFERENCES[key]; });
  next.timezone=typeof next.timezone==="string"&&next.timezone?next.timezone:DEFAULT_TIMEZONE;
  ["enabled","storyAlerts","bossAlerts","energyAlerts","questAlerts","appLockAlerts"].forEach((key)=>{next[key]=Boolean(next[key]);});
  return next;
}

export function validateSubscription(subscription) {
  if (!subscription || typeof subscription!=="object" || typeof subscription.endpoint!=="string" || !subscription.endpoint.startsWith("https://")) return false;
  const keys=subscription.keys || {};
  return typeof keys.p256dh==="string" && typeof keys.auth==="string";
}

export async function storeSubscription(body) {
  if (!validateSubscription(body&&body.subscription)) throw new Error("invalid_push_subscription");
  const previous=await loadProfile().catch(()=>null);
  const profile={
    privateMode:true,
    subscription:body.subscription,
    preferences:cleanPreferences(body.preferences),
    timezone:typeof body.timezone==="string"&&body.timezone?body.timezone:DEFAULT_TIMEZONE,
    permission:body.permission==="granted"?"granted":"unknown",
    installedPwa:Boolean(body.installedPwa),
    lastSent:previous&&previous.lastSent&&typeof previous.lastSent==="object"?previous.lastSent:{},
    createdAt:previous&&previous.createdAt?previous.createdAt:Date.now(),
    updatedAt:Date.now(),
  };
  return saveProfile(profile);
}

function configureVapid() {
  const publicKey=env("VAPID_PUBLIC_KEY");
  const privateKey=env("VAPID_PRIVATE_KEY");
  if (!publicKey || !privateKey) throw new Error("vapid_not_configured");
  webpush.setVapidDetails(env("VAPID_SUBJECT")||"mailto:private@example.com",publicKey,privateKey);
}

export async function sendPush(profile,payload) {
  if (!profile || !validateSubscription(profile.subscription)) throw new Error("subscription_not_found");
  configureVapid();
  try {
    await webpush.sendNotification(profile.subscription,JSON.stringify({...payload,type:payload.type||"system"}),{TTL:3600,urgency:"normal"});
    return {ok:true};
  } catch (error) {
    if (error && (error.statusCode===404 || error.statusCode===410)) {
      await saveProfile({...profile,subscription:null,updatedAt:Date.now()}).catch(()=>{});
      throw new Error("subscription_expired");
    }
    throw error;
  }
}

function zonedParts(date,timezone) {
  const parts=new Intl.DateTimeFormat("en-CA",{timeZone:timezone,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(date);
  const values={}; parts.forEach((part)=>{if(part.type!=="literal")values[part.type]=part.value;});
  return {date:values.year+"-"+values.month+"-"+values.day,time:values.hour+":"+values.minute,hour:Number(values.hour)};
}

function hourOf(time) { return Number(String(time||"00:00").slice(0,2)); }
function categoryEnabled(preferences,category) {
  if(category==="quest")return preferences.questAlerts;
  if(category==="energy")return preferences.energyAlerts;
  if(category==="story")return preferences.storyAlerts;
  if(category==="boss")return preferences.bossAlerts;
  if(category==="appLock")return preferences.appLockAlerts;
  return true;
}

export async function sendScheduledReminders(now=new Date()) {
  const profile=await loadProfile();
  if (!profile || !profile.subscription) return {ok:true,sent:[],status:"no_subscription"};
  const preferences=cleanPreferences(profile.preferences);
  if (!preferences.enabled) return {ok:true,sent:[],status:"disabled"};
  const local=zonedParts(now,profile.timezone||preferences.timezone||DEFAULT_TIMEZONE);
  const schedule=[
    ["morningRoutine",preferences.morningTime],["energy",preferences.energyCheckTime],["trainingGate",preferences.trainingTime],
    ["eveningRoutine",preferences.eveningTime],["nightRoutine",preferences.nightTime],["bedtime",preferences.bedtimeTime],["sleepTarget",preferences.sleepTargetTime],
  ];
  const sent=[]; const lastSent={...(profile.lastSent||{})};
  for (const [type,time] of schedule) {
    const payload=PAYLOADS[type]; const stamp=local.date+":"+type;
    if (hourOf(time)!==local.hour || lastSent[stamp] || !categoryEnabled(preferences,payload.category)) continue;
    await sendPush(profile,{...payload,type});
    lastSent[stamp]=new Date().toISOString(); sent.push(type);
  }
  if (sent.length) await saveProfile({...profile,preferences,lastSent,updatedAt:Date.now()});
  return {ok:true,sent,localTime:local.time,timezone:profile.timezone||DEFAULT_TIMEZONE};
}

export async function sendTest() {
  const profile=await loadProfile();
  await sendPush(profile,{...PAYLOADS.test,type:"test"});
  return {ok:true};
}

export function sendJson(response,status,payload) { json(response,status,payload); }
