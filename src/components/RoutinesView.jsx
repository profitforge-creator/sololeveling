import React from "react";
import { ROUTINE_DEFS, buildRoutineSteps, ROUTINE_REWARD_MIN, ROUTINE_XP } from "../data/routines.js";
import { DAY_FOCUS } from "../data/athletics.js";

/**
 * RoutineTimeline — Morning / Athletic / Evening / Night chains.
 * Steps adapt to profile + energy. Completing a full chain grants XP and
 * free-time minutes via onRoutineComplete.
 */
export default function RoutinesView({ profile, energyState, energyScore, routines, onStepToggle, accentColor, dailyDayType, freeTime }) {
  const c = accentColor || "#4db8ff";
  const dow = new Date().getDay();
  const focus = DAY_FOCUS[dow] || DAY_FOCUS[1];
  const done = routines && routines.done ? routines.done : {};

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 20, fontWeight: 700, color: "#eaf2ff" }}>Routine Timeline</div>
        <div style={{ height: 1, marginTop: 6, background: "linear-gradient(90deg," + c + ",transparent)" }} />
        <p style={{ fontSize: 12, color: "#5b7aa0", marginTop: 6 }}>
          Daily chains adapt to your energy and today's training focus. Full chains grant XP + free time.
        </p>
      </div>

      {/* Today's rotation header */}
      <div className="sl-panel" style={{ marginBottom: 16, border: "1px solid " + focus.color + "55" }}>
        <div className="sl-corners" />
        <div style={{ padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <div>
            <div style={{ fontSize: 9, color: "#5b7aa0", letterSpacing: "0.25em", fontFamily: "'Orbitron',sans-serif" }}>TODAY'S ROTATION</div>
            <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 15, fontWeight: 700, color: focus.color, marginTop: 3 }}>{focus.label}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 9, color: "#5b7aa0", letterSpacing: "0.2em", fontFamily: "'Orbitron',sans-serif" }}>ROUTINE STREAK</div>
            <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 18, fontWeight: 900, color: (routines && routines.streak >= 3) ? "#2ee88a" : c }}>
              {(routines && routines.streak) || 0}d
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 9, color: "#5b7aa0", letterSpacing: "0.2em", fontFamily: "'Orbitron',sans-serif" }}>FREE TIME BANK</div>
            <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 18, fontWeight: 900, color: "#f5b65d" }}>
              {(freeTime && freeTime.minutes) || 0}m
            </div>
          </div>
        </div>
      </div>

      {ROUTINE_DEFS.map(function (r) {
        const steps = buildRoutineSteps(r.id, profile, energyState, energyScore, dailyDayType);
        const rDone = done[r.id] || {};
        const doneCount = steps.filter(function (s) { return rDone[s.id]; }).length;
        const complete = doneCount >= steps.length;
        return (
          <div key={r.id} className="sl-panel" style={{ marginBottom: 16, border: "1px solid " + (complete ? "#2ee88a66" : r.color + "44"), opacity: complete ? 0.82 : 1 }}>
            <div className="sl-corners" />
            <div className="sl-header-bar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className="sl-header-title" style={{ fontSize: 12, color: r.color }}>{r.icon} {r.name.toUpperCase()}</span>
              <span style={{ fontSize: 9, color: "#5b7aa0", fontFamily: "'Orbitron',sans-serif", letterSpacing: "0.12em" }}>{r.window}</span>
            </div>
            <div style={{ padding: "12px 16px" }}>
              <div style={{ fontSize: 11, color: "#5b7aa0", marginBottom: 10 }}>{r.desc}</div>
              {steps.map(function (s) {
                const isDone = !!rDone[s.id];
                return (
                  <button key={s.id}
                    onClick={function () { if (!isDone && typeof onStepToggle === "function") onStepToggle(r.id, s.id, steps); }}
                    style={{
                      display: "flex", alignItems: "flex-start", gap: 10, width: "100%", textAlign: "left",
                      background: isDone ? "rgba(46,232,138,0.05)" : "transparent",
                      border: "1px solid " + (isDone ? "#2ee88a33" : "rgba(77,184,255,0.12)"),
                      padding: "9px 12px", marginBottom: 6, cursor: isDone ? "default" : "pointer", color: "inherit",
                    }}>
                    <span style={{
                      width: 16, height: 16, flexShrink: 0, marginTop: 1, border: "1px solid " + (isDone ? "#2ee88a" : r.color + "88"),
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#2ee88a",
                      background: isDone ? "rgba(46,232,138,0.15)" : "transparent",
                    }}>{isDone ? "✓" : ""}</span>
                    <span style={{ flex: 1 }}>
                      <span style={{ fontSize: 13, color: isDone ? "#6fae6f" : "#dbe6ff", textDecoration: isDone ? "line-through" : "none", display: "block" }}>{s.name}</span>
                      <span style={{ fontSize: 10.5, color: "#5b7aa0", display: "block", marginTop: 2, lineHeight: 1.5 }}>{s.detail}</span>
                    </span>
                  </button>
                );
              })}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                <div style={{ flex: 1, height: 4, background: "rgba(77,184,255,0.1)", marginRight: 12 }}>
                  <div style={{ height: "100%", width: Math.round((doneCount / steps.length) * 100) + "%", background: complete ? "#2ee88a" : r.color, transition: "width 0.4s ease", boxShadow: "0 0 6px " + (complete ? "#2ee88a" : r.color) }} />
                </div>
                <span style={{ fontSize: 10, color: complete ? "#2ee88a" : "#5b7aa0", fontFamily: "'Orbitron',sans-serif", flexShrink: 0 }}>
                  {complete ? "CHAIN CLEARED · +" + ROUTINE_XP[r.id] + " XP · +" + ROUTINE_REWARD_MIN[r.id] + "m free time" : doneCount + "/" + steps.length}
                </span>
              </div>
            </div>
          </div>
        );
      })}

      <div style={{ fontSize: 10.5, color: "#5b7aa0", lineHeight: 1.7, padding: "10px 12px", border: "1px solid rgba(77,184,255,0.15)" }}>
        ◈ Chains reset at midnight. Completing all four in one day extends your routine streak. The System rotates
        training emphasis through the week — hard days are separated by recovery on purpose. Do not chase intensity on rest days.
      </div>
    </div>
  );
}
