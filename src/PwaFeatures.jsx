import React, { useEffect, useState } from "react";
import {
  currentNotificationPermission,
  DEFAULT_NOTIFICATION_SETTINGS,
  installPromptAvailable,
  isIOSDevice,
  isStandaloneMode,
  loadNotificationSettings,
  pushBackendConfigured,
  requestNotificationAccess,
  saveNotificationSettings,
  sendPrivateTestNotification,
  syncPrivateNotificationProfile,
  triggerInstallPrompt,
} from "./pwa.js";
import { DEFAULT_TIMEZONE, loadPrivateLinkKey, savePrivateLinkKey } from "./privateConfig.js";

function Toggle({ checked, onChange, label, note }) {
  return <label className="pwa-setting-toggle"><span><strong>{label}</strong>{note&&<small>{note}</small>}</span><input type="checkbox" checked={Boolean(checked)} onChange={(event)=>onChange(event.target.checked)}/><i/></label>;
}

function TimeSetting({ label, value, onChange }) {
  return <label className="pwa-time-setting"><span>{label}</span><input type="time" value={value} onChange={(event)=>onChange(event.target.value)}/></label>;
}

export function NotificationSettingsPanel() {
  const [settings,setSettings]=useState(loadNotificationSettings);
  const [permission,setPermission]=useState(currentNotificationPermission());
  const [status,setStatus]=useState("");
  const [linkKey,setLinkKey]=useState(loadPrivateLinkKey);
  const backendReady=pushBackendConfigured();

  useEffect(() => { saveNotificationSettings(settings); }, [settings]);
  useEffect(() => {
    if (!linkKey || permission !== "granted") return undefined;
    const timer=setTimeout(async () => {
      const result=await syncPrivateNotificationProfile(settings);
      if (!result.ok && result.status !== "not_linked") setStatus("Schedule sync pending: "+result.status);
    },700);
    return () => clearTimeout(timer);
  }, [settings,linkKey,permission]);
  function update(key,value) { setSettings((previous)=>({ ...previous,[key]:value })); }
  function updateLinkKey(value) { setLinkKey(value); savePrivateLinkKey(value); }

  async function enable() {
    const result=await requestNotificationAccess();
    setPermission(currentNotificationPermission());
    if (result.ok) { setSettings((previous)=>({ ...previous,enabled:true })); setStatus(result.push&&result.push.configured&&!result.push.error?"Private push subscription active.":"Permission enabled. Add the private link key and server environment values to activate closed-app delivery."); }
    else if (result.status === "install_required") setStatus("Install ARISE to the iPhone Home Screen, open the installed app, then enable notifications.");
    else if (result.status === "denied") setStatus("Permission denied. Re-enable ARISE in device notification settings.");
    else setStatus("This browser does not currently support the required notification flow.");
  }

  async function test() {
    if (currentNotificationPermission() !== "granted") {
      const access=await requestNotificationAccess();
      setPermission(currentNotificationPermission());
      if (!access.ok) { setStatus("Enable notification permission before testing."); return; }
    }
    await syncPrivateNotificationProfile(settings);
    const result=await sendPrivateTestNotification();
    setStatus(result.ok?"Test notification sent to your private device.":"Test failed: "+result.status);
  }

  return (
    <section className="pwa-settings-card">
      <div className="pwa-settings-heading"><img src="/icons/system-s-transparent.png" alt="ARISE logo"/><div><small>SYSTEM COMMUNICATION CHANNEL</small><h3>NOTIFICATIONS</h3></div><em className={permission}>{permission.toUpperCase()}</em></div>
      <p>Daily Quest, Gate, Boss, Energy, Story, bedtime, and penalty alerts use the installed PWA notification channel.</p>
      <label className="pwa-private-key"><span>PRIVATE LINK KEY<small>Matches PRIVATE_API_TOKEN on Vercel. Stored only on this device.</small></span><input type="password" value={linkKey} onChange={(event)=>updateLinkKey(event.target.value)} placeholder="Enter your private key" autoComplete="off"/></label>
      <div className="pwa-private-profile"><b>PRIVATE SINGLE-USER MODE</b><span>One profile · One device subscription · {settings.timezone || DEFAULT_TIMEZONE}</span></div>
      <Toggle checked={settings.enabled} onChange={(value)=>update("enabled",value)} label="System Notifications" note="Master notification switch"/>
      <div className="pwa-time-grid">
        <TimeSetting label="Morning Routine" value={settings.morningTime} onChange={(value)=>update("morningTime",value)}/>
        <TimeSetting label="Energy Check-In" value={settings.energyCheckTime} onChange={(value)=>update("energyCheckTime",value)}/>
        <TimeSetting label="Training Reminder" value={settings.trainingTime} onChange={(value)=>update("trainingTime",value)}/>
        <TimeSetting label="Evening Routine" value={settings.eveningTime} onChange={(value)=>update("eveningTime",value)}/>
        <TimeSetting label="Night Routine" value={settings.nightTime} onChange={(value)=>update("nightTime",value)}/>
        <TimeSetting label="Bedtime Reminder" value={settings.bedtimeTime} onChange={(value)=>update("bedtimeTime",value)}/>
        <TimeSetting label="Sleep Target" value={settings.sleepTargetTime} onChange={(value)=>update("sleepTargetTime",value)}/>
        <TimeSetting label="Quiet Hours Start" value={settings.quietStart} onChange={(value)=>update("quietStart",value)}/>
        <TimeSetting label="Quiet Hours End" value={settings.quietEnd} onChange={(value)=>update("quietEnd",value)}/>
      </div>
      <div className="pwa-alert-toggles">
        <Toggle checked={settings.questAlerts} onChange={(value)=>update("questAlerts",value)} label="Quest Alerts"/>
        <Toggle checked={settings.storyAlerts} onChange={(value)=>update("storyAlerts",value)} label="Story Alerts"/>
        <Toggle checked={settings.bossAlerts} onChange={(value)=>update("bossAlerts",value)} label="Boss Alerts"/>
        <Toggle checked={settings.energyAlerts} onChange={(value)=>update("energyAlerts",value)} label="Energy / Sleep Alerts"/>
        <Toggle checked={settings.appLockAlerts} onChange={(value)=>update("appLockAlerts",value)} label="App-Lock / Break Alerts"/>
      </div>
      <div className="pwa-settings-actions"><button onClick={enable}>{permission==="granted"?"RESYNC PUSH CHANNEL":"ENABLE NOTIFICATIONS"}</button><button onClick={test}>SEND TEST ALERT</button><button onClick={()=>window.dispatchEvent(new CustomEvent("arise:open-notification-permission"))}>OPEN PERMISSION SCREEN</button></div>
      {permission==="denied"&&<div className="pwa-settings-warning">Permission is blocked. On iPhone: install ARISE, then open Settings → Notifications → ARISE. In desktop browsers, use the site permissions icon.</div>}
      {!backendReady&&<div className="pwa-backend-note"><b>REMOTE PUSH BACKEND PENDING</b><span>Closed-app delivery requires VITE_WEB_PUSH_PUBLIC_KEY plus server-side VAPID, storage, and private-token environment values.</span></div>}
      {status&&<div className="pwa-settings-status">{status}</div>}
    </section>
  );
}

export function InstallAppPanel() {
  const [available,setAvailable]=useState(installPromptAvailable());
  const [status,setStatus]=useState(isStandaloneMode()?"ARISE is running as an installed app.":"");
  const ios=isIOSDevice();

  useEffect(() => {
    const update=()=>setAvailable(installPromptAvailable());
    const installed=()=>{setAvailable(false);setStatus("ARISE installed successfully.");};
    window.addEventListener("arise:install-available",update); window.addEventListener("arise:app-installed",installed);
    return ()=>{window.removeEventListener("arise:install-available",update);window.removeEventListener("arise:app-installed",installed);};
  }, []);

  async function install() {
    const result=await triggerInstallPrompt();
    setAvailable(false);
    setStatus(result.ok?"Install accepted. Open ARISE from the Home Screen.":"Use the manual browser instructions below.");
  }

  return (
    <section className="pwa-settings-card pwa-install-card">
      <div className="pwa-settings-heading"><img src="/icons/icon-192.png" alt="ARISE app icon"/><div><small>FULLSCREEN HOME SCREEN APP</small><h3>INSTALL APP</h3></div><em className={isStandaloneMode()?"granted":"default"}>{isStandaloneMode()?"INSTALLED":ios?"IPHONE":"WEB"}</em></div>
      <p>Install the PWA for a fullscreen System feel, custom icon, startup screen, offline shell, and iPhone web push support.</p>
      {available&&<button className="pwa-install-button" onClick={install}>INSTALL ARISE</button>}
      <div className="pwa-install-grid">
        <div className={ios?"recommended":""}><small>IPHONE / SAFARI</small><ol><li>Open this app in Safari.</li><li>Tap the Share button.</li><li>Tap Add to Home Screen.</li><li>Confirm the ARISE name and icon.</li><li>Open ARISE from the Home Screen.</li></ol></div>
        <div className={!ios?"recommended":""}><small>ANDROID / CHROME</small><ol><li>Open this app in Chrome.</li><li>Tap the browser menu.</li><li>Tap Install App or Add to Home Screen.</li><li>Confirm installation.</li><li>Open ARISE from the app icon.</li></ol></div>
      </div>
      {status&&<div className="pwa-settings-status">{status}</div>}
    </section>
  );
}
