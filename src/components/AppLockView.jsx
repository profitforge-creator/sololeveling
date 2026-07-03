import React, { useState } from "react";

/**
 * App Lock Quest Gate — in-app lock logic + free-time economy.
 * A PWA cannot force-lock other apps; this view manages the contract
 * (what's sealed, what unlocks it, earned passes) and ships setup
 * instructions for iOS Screen Time / Android Digital Wellbeing enforcement.
 */

const NEVER_BLOCK = ["Phone / Emergency", "Messages (family)", "Maps", "Health apps", "School apps"];

const REQUIREMENTS = [
  { id: "daily",    label: "Clear today's Daily Quest",              desc: "The full assigned protocol." },
  { id: "routine",  label: "Complete Morning + one more routine",    desc: "Two full routine chains." },
  { id: "training", label: "Daily Quest + Athletic Routine",         desc: "The strictest gate. Training must be done." },
];

export default function AppLockView({ appLock, freeTime, onUpdateAppLock, onSpendFreeTime, onUsePass, requirementMet, accentColor }) {
  const c = accentColor || "#4db8ff";
  const [newApp, setNewApp] = useState("");
  const locked = appLock.enabled && !requirementMet;

  function toggleEnabled() {
    onUpdateAppLock(Object.assign({}, appLock, { enabled: !appLock.enabled }));
  }
  function setRequirement(id) {
    onUpdateAppLock(Object.assign({}, appLock, { requirement: id }));
  }
  function addApp() {
    const name = newApp.trim().slice(0, 30);
    if (!name || appLock.blockedApps.includes(name)) return;
    onUpdateAppLock(Object.assign({}, appLock, { blockedApps: appLock.blockedApps.concat([name]).slice(0, 20) }));
    setNewApp("");
  }
  function removeApp(name) {
    onUpdateAppLock(Object.assign({}, appLock, { blockedApps: appLock.blockedApps.filter(function (a) { return a !== name; }) }));
  }

  const req = REQUIREMENTS.find(function (r) { return r.id === appLock.requirement; }) || REQUIREMENTS[0];

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 20, fontWeight: 700, color: "#eaf2ff" }}>App Lock — Quest Gate</div>
        <div style={{ height: 1, marginTop: 6, background: "linear-gradient(90deg," + c + ",transparent)" }} />
        <p style={{ fontSize: 12, color: "#5b7aa0", marginTop: 6 }}>
          The System seals distractions until your Gate is cleared. Free time is earned, then spent.
        </p>
      </div>

      {/* STATUS */}
      <div className="sl-panel" style={{ marginBottom: 16, border: "2px solid " + (locked ? "#f53d3d88" : appLock.enabled ? "#2ee88a66" : "#2a3a55") }}>
        <div className="sl-corners" />
        <div style={{ padding: "18px 18px", textAlign: "center" }}>
          <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 10, letterSpacing: "0.35em", color: locked ? "#f53d3d" : appLock.enabled ? "#2ee88a" : "#5b7aa0", marginBottom: 8 }}>
            {locked ? "◈ SEAL ACTIVE" : appLock.enabled ? "◈ SEAL RELEASED — QUEST CLEARED" : "◈ SEAL DISABLED"}
          </div>
          <div style={{ fontSize: 15, color: "#dbe6ff", lineHeight: 1.7, marginBottom: 10 }}>
            {locked
              ? "The System has sealed your distractions. Clear your Gate to unlock free time."
              : appLock.enabled
                ? "Requirements met. Distraction apps are unsealed — spend your earned free time deliberately."
                : "Lock is off. Enable it to bind free-time access to quest completion."}
          </div>
          {locked && (
            <div style={{ fontSize: 12, color: "#f5b65d", marginBottom: 12 }}>
              Unlock requirement: <b>{req.label}</b>
            </div>
          )}
          <button onClick={toggleEnabled}
            style={{ background: appLock.enabled ? "transparent" : c, color: appLock.enabled ? "#f57a7a" : "#03050c", border: appLock.enabled ? "1px solid #f53d3d66" : "none", padding: "10px 22px", fontFamily: "'Orbitron',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", cursor: "pointer" }}>
            {appLock.enabled ? "DISABLE SEAL" : "ENABLE SEAL"}
          </button>
        </div>
      </div>

      {/* FREE TIME WALLET */}
      <div className="sl-panel" style={{ marginBottom: 16, border: "1px solid #f5b65d55" }}>
        <div className="sl-corners" />
        <div className="sl-header-bar"><span className="sl-header-title" style={{ fontSize: 12, color: "#f5b65d" }}>FREE TIME WALLET</span></div>
        <div style={{ padding: "14px 16px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 12 }}>
            {[
              ["MINUTES", (freeTime.minutes || 0) + "m", "#f5b65d"],
              ["VOUCHERS", freeTime.vouchers || 0, "#4db8ff"],
              ["UNLOCK PASSES", appLock.passes || 0, "#a05df5"],
            ].map(function (s) {
              return (
                <div key={s[0]} style={{ border: "1px solid " + s[2] + "33", padding: "10px 6px", textAlign: "center" }}>
                  <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 18, fontWeight: 900, color: s[2] }}>{s[1]}</div>
                  <div style={{ fontSize: 8, color: "#5b7aa0", letterSpacing: "0.14em", marginTop: 2 }}>{s[0]}</div>
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={function () { onSpendFreeTime(15); }} disabled={(freeTime.minutes || 0) < 15 || locked}
              style={{ flex: 1, minWidth: 130, padding: "10px", background: (freeTime.minutes || 0) >= 15 && !locked ? "rgba(245,182,93,0.12)" : "transparent", border: "1px solid #f5b65d55", color: (freeTime.minutes || 0) >= 15 && !locked ? "#f5b65d" : "#3a4a65", fontSize: 11, cursor: (freeTime.minutes || 0) >= 15 && !locked ? "pointer" : "not-allowed", fontFamily: "'Orbitron',sans-serif" }}>
              REDEEM 15 MIN
            </button>
            <button onClick={function () { onSpendFreeTime(30); }} disabled={(freeTime.minutes || 0) < 30 || locked}
              style={{ flex: 1, minWidth: 130, padding: "10px", background: (freeTime.minutes || 0) >= 30 && !locked ? "rgba(245,182,93,0.12)" : "transparent", border: "1px solid #f5b65d55", color: (freeTime.minutes || 0) >= 30 && !locked ? "#f5b65d" : "#3a4a65", fontSize: 11, cursor: (freeTime.minutes || 0) >= 30 && !locked ? "pointer" : "not-allowed", fontFamily: "'Orbitron',sans-serif" }}>
              REDEEM 30 MIN
            </button>
            <button onClick={onUsePass} disabled={(appLock.passes || 0) < 1}
              style={{ flex: 1, minWidth: 130, padding: "10px", background: (appLock.passes || 0) >= 1 ? "rgba(160,93,245,0.12)" : "transparent", border: "1px solid #a05df555", color: (appLock.passes || 0) >= 1 ? "#a05df5" : "#3a4a65", fontSize: 11, cursor: (appLock.passes || 0) >= 1 ? "pointer" : "not-allowed", fontFamily: "'Orbitron',sans-serif" }}>
              USE UNLOCK PASS (+{appLock.passMinutes}m)
            </button>
          </div>
          <div style={{ fontSize: 10, color: "#5b7aa0", marginTop: 10, lineHeight: 1.6 }}>
            Earn: routines (+10–15m), daily quest chain (+1 voucher), boss raids (+45m). A voucher converts to 30 minutes anytime.
            {freeTime.earnBlocked && <span style={{ color: "#f53d3d" }}> Earning is blocked until the Penalty Zone is cleared.</span>}
          </div>
        </div>
      </div>

      {/* SEALED APPS */}
      <div className="sl-panel" style={{ marginBottom: 16, border: "1px solid " + c + "44" }}>
        <div className="sl-corners" />
        <div className="sl-header-bar"><span className="sl-header-title" style={{ fontSize: 12 }}>SEALED APPLICATIONS</span></div>
        <div style={{ padding: "12px 16px" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
            {appLock.blockedApps.map(function (a) {
              return (
                <span key={a} style={{ display: "inline-flex", alignItems: "center", gap: 6, border: "1px solid " + (locked ? "#f53d3d66" : c + "44"), padding: "6px 10px", fontSize: 12, color: locked ? "#f57a7a" : "#c8e8ff", background: locked ? "rgba(245,61,61,0.05)" : "transparent" }}>
                  {locked ? "🔒" : "◈"} {a}
                  <button onClick={function () { removeApp(a); }} style={{ background: "transparent", border: "none", color: "#5b7aa0", cursor: "pointer", fontSize: 11, padding: 0 }}>✕</button>
                </span>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
            <input placeholder="Add app (e.g. Snapchat)" value={newApp} onChange={function (e) { setNewApp(e.target.value); }} onKeyDown={function (e) { if (e.key === "Enter") addApp(); }}
              style={{ flex: 1, background: "rgba(5,10,20,0.9)", border: "1px solid " + c + "44", color: "#eaf2ff", fontSize: 12, padding: "8px 12px", outline: "none" }} />
            <button onClick={addApp} style={{ background: c, color: "#03050c", border: "none", padding: "8px 14px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'Orbitron',sans-serif" }}>SEAL</button>
          </div>
          <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 9, letterSpacing: "0.2em", color: "#5b7aa0", marginBottom: 6 }}>UNLOCK REQUIREMENT</div>
          {REQUIREMENTS.map(function (r) {
            const sel = appLock.requirement === r.id;
            return (
              <button key={r.id} onClick={function () { setRequirement(r.id); }}
                style={{ display: "block", width: "100%", textAlign: "left", padding: "9px 12px", marginBottom: 5, background: sel ? "rgba(77,184,255,0.1)" : "transparent", border: "1px solid " + (sel ? c : c + "22"), color: "inherit", cursor: "pointer" }}>
                <span style={{ fontSize: 12.5, color: sel ? c : "#dbe6ff", fontWeight: sel ? 700 : 400 }}>{r.label}</span>
                <span style={{ fontSize: 10.5, color: "#5b7aa0", display: "block", marginTop: 2 }}>{r.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* NEVER BLOCKED + ENFORCEMENT SETUP */}
      <div className="sl-panel" style={{ marginBottom: 16, border: "1px solid #2ee88a44" }}>
        <div className="sl-corners" />
        <div className="sl-header-bar"><span className="sl-header-title" style={{ fontSize: 12, color: "#2ee88a" }}>SAFETY — NEVER SEALED</span></div>
        <div style={{ padding: "12px 16px", fontSize: 12, color: "#9fb8d8", lineHeight: 1.8 }}>
          {NEVER_BLOCK.join(" · ")}
          <div style={{ fontSize: 10.5, color: "#5b7aa0", marginTop: 6 }}>Emergency, communication with family, navigation, health and school functions are permanently exempt from the seal.</div>
        </div>
      </div>

      <div className="sl-panel" style={{ border: "1px solid " + c + "33" }}>
        <div className="sl-corners" />
        <div className="sl-header-bar"><span className="sl-header-title" style={{ fontSize: 12 }}>DEVICE ENFORCEMENT (OPTIONAL SETUP)</span></div>
        <div style={{ padding: "12px 16px", fontSize: 11.5, color: "#9fb8d8", lineHeight: 1.8 }}>
          A private web app cannot force-close other apps. To give the seal real teeth:
          <ol style={{ margin: "8px 0 8px 18px", padding: 0 }}>
            <li><b>iOS:</b> Settings → Screen Time → App Limits → add your sealed apps with a 1-minute limit. When ARISE says the seal is released, approve extra time yourself — the pass minutes are your budget.</li>
            <li><b>iOS Shortcuts:</b> Automation → "When [app] is opened" → show a reminder: "Gate uncleared — return to ARISE."</li>
            <li><b>Android:</b> Digital Wellbeing → App timers, same pattern.</li>
          </ol>
          The contract lives here; the enforcement lives in the OS. The System tracks whether you honored it.
        </div>
      </div>
    </div>
  );
}
