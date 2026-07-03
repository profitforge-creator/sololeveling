import React, { useEffect, useState } from "react";
import {
  currentNotificationPermission,
  initializeInstallPromptCapture,
  isIOSDevice,
  isStandaloneMode,
  markNotificationPromptSeen,
  notificationPromptSeen,
  notificationSupport,
  registerServiceWorker,
  requestNotificationAccess,
  startForegroundNotificationScheduler,
} from "./pwa.js";
import { acknowledgeFreshStartNotice, freshStartNoticePending } from "./utils/storage.js";
import "./pwa.css";

const BOOT_STEPS=[
  "Initializing System...",
  "Scanning Hunter Data...",
  "Loading Story Progress...",
  "Synchronizing Quests...",
  "System Ready.",
];

function BootScreen({ step, closing }) {
  return (
    <div className={"pwa-boot-screen"+(closing?" closing":"")}>
      <div className="pwa-boot-grid" /><div className="pwa-boot-scan" />
      <div className="pwa-particles">{Array.from({length:18}).map((_,index)=><i key={index} style={{"--p":index}} />)}</div>
      <div className="pwa-boot-core"><div className="pwa-logo-rings"><i/><i/><i/></div><img src="/icons/system-s-transparent.png" alt="ARISE System S" /></div>
      <div className="pwa-boot-copy"><small>HUNTER SYSTEM / SECURE CHANNEL</small><strong>{BOOT_STEPS[step]}</strong><div className="pwa-boot-progress"><i style={{width:((step+1)/BOOT_STEPS.length*100)+"%"}} /></div><span>{String(step+1).padStart(2,"0")} / {String(BOOT_STEPS.length).padStart(2,"0")}</span></div>
    </div>
  );
}

function NotificationPermissionScreen({ onClose }) {
  const [status,setStatus]=useState(currentNotificationPermission());
  const [message,setMessage]=useState("");
  const support=notificationSupport();
  const needsInstall=support === "install_required";

  async function enable() {
    setMessage("Requesting System authority...");
    const result=await requestNotificationAccess();
    setStatus(result.status || currentNotificationPermission());
    if (result.ok) {
      setMessage(result.push && result.push.configured ? "Push channel synchronized." : "On-device alerts enabled. Remote push backend is not configured yet.");
      markNotificationPromptSeen();
      setTimeout(onClose,1400);
    } else if (result.status === "install_required") setMessage("On iPhone, add ARISE to the Home Screen first, then enable notifications from the installed app.");
    else if (result.status === "denied") setMessage("Permission was denied. Enable ARISE later in your browser or iPhone notification settings.");
    else setMessage("Notifications are not available in this browser context.");
  }

  function notNow() { markNotificationPromptSeen(); onClose(); }

  return (
    <div className="pwa-permission-backdrop">
      <section className="pwa-permission-panel">
        <div className="pwa-permission-logo"><img src="/icons/system-s-transparent.png" alt="System logo" /></div>
        <small>SYSTEM AUTHORITY REQUEST</small><h2>ENABLE NOTIFICATIONS?</h2>
        <p>System notifications are required for Daily Quest alerts, Gate warnings, Story Mode events, and Sleep Target reminders.</p>
        {needsInstall&&<div className="pwa-permission-warning">IPHONE INSTALL REQUIRED: Safari → Share → Add to Home Screen.</div>}
        {status === "denied"&&<div className="pwa-permission-denied">Notifications are blocked. Open device Settings → Notifications → ARISE after installing the app.</div>}
        {message&&<div className="pwa-permission-status">{message}</div>}
        <div className="pwa-permission-actions"><button onClick={enable}>ENABLE NOTIFICATIONS</button><button onClick={notNow}>NOT NOW</button></div>
        <em>{isIOSDevice()?isStandaloneMode()?"Installed iPhone PWA detected":"Safari browser session":"Web notification channel"}</em>
      </section>
    </div>
  );
}

function FreshStartIntro({ onClose }) {
  function begin() { acknowledgeFreshStartNotice(); onClose(); }
  return (
    <div className="pwa-fresh-start">
      <div className="pwa-fresh-rain"/><div className="pwa-fresh-mist"/>
      <div className="pwa-fresh-panel">
        <img src="/icons/system-s-transparent.png" alt="Gatebound System"/>
        <small>NEW PLAYER FILE / DAY 01</small>
        <h1>THE WEAKEST HUNTER</h1>
        <div className="pwa-fresh-messages"><span>Previous save data has been purged. New Player file initialized.</span><span><b>RANK:</b> E-RANK</span><span><b>LEVEL:</b> 1</span><span><b>STORY MODE:</b> BEGINNING</span></div>
        <p>The System has selected an unproven hunter. Evaluation begins in the forest. No path has been chosen. No authority has been earned.</p>
        <button onClick={begin}>ENTER THE FOREST</button>
      </div>
    </div>
  );
}

export default function PwaShell({ children }) {
  const [bootStep,setBootStep]=useState(0);
  const [bootClosing,setBootClosing]=useState(false);
  const [bootComplete,setBootComplete]=useState(false);
  const [permissionOpen,setPermissionOpen]=useState(false);
  const [freshIntroOpen,setFreshIntroOpen]=useState(false);
  const [serviceWorkerStatus,setServiceWorkerStatus]=useState("starting");

  useEffect(() => {
    initializeInstallPromptCapture();
    registerServiceWorker().then((result)=>setServiceWorkerStatus(result&&result.ok?"registered":(result&&result.reason)||"unavailable"));
    let index=0;
    const timer=setInterval(() => {
      index+=1;
      if (index < BOOT_STEPS.length) setBootStep(index);
      else {
        clearInterval(timer); setBootClosing(true);
        setTimeout(() => setBootComplete(true),480);
      }
    },460);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!bootComplete) return undefined;
    if (freshStartNoticePending()) setFreshIntroOpen(true);
    const stopScheduler=startForegroundNotificationScheduler();
    const open=()=>setPermissionOpen(true);
    window.addEventListener("arise:open-notification-permission",open);
    const promptTimer=setTimeout(() => {
      if (!freshStartNoticePending() && currentNotificationPermission() === "default" && !notificationPromptSeen()) setPermissionOpen(true);
    },4200);
    return () => { stopScheduler(); clearTimeout(promptTimer); window.removeEventListener("arise:open-notification-permission",open); };
  }, [bootComplete]);

  function closeFreshIntro() {
    setFreshIntroOpen(false);
    if (currentNotificationPermission()==="default"&&!notificationPromptSeen()) setTimeout(()=>setPermissionOpen(true),1800);
  }

  return <><div className={bootComplete?"pwa-app-ready":"pwa-app-loading"} data-pwa-service-worker={serviceWorkerStatus}>{children}</div>{!bootComplete&&<BootScreen step={bootStep} closing={bootClosing}/>} {freshIntroOpen&&<FreshStartIntro onClose={closeFreshIntro}/>} {permissionOpen&&!freshIntroOpen&&<NotificationPermissionScreen onClose={()=>setPermissionOpen(false)}/>}</>;
}
