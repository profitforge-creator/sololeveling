import React, { useState } from "react";

/**
 * Penalty Zone — a safe 5–20 minute reset mission that opens when required
 * quests were failed. No shame mechanics: it redirects to action, restores
 * free-time earning and stabilizes rank.
 */
const PENALTY_STEPS = [
  { id: "pz_walk",    name: "5-minute walk or movement",           detail: "Leave the room. Move. Reset the state." },
  { id: "pz_water",   name: "Hydrate (full glass)",                detail: "Simple, immediate, done." },
  { id: "pz_clean",   name: "Clean one small area (2 min)",        detail: "Desk, bed, or floor. One zone only." },
  { id: "pz_breathe", name: "10 slow breaths",                     detail: "In 4 · hold 4 · out 6. Down-regulate." },
  { id: "pz_plan",    name: "Write tomorrow's #1 priority",        detail: "One sentence. This is the counter-attack." },
];

export default function PenaltyZoneModal({ zone, onComplete, onDefer }) {
  const [done, setDone] = useState({});
  const count = PENALTY_STEPS.filter(function (s) { return done[s.id]; }).length;
  const allDone = count >= PENALTY_STEPS.length;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 10500, background: "rgba(10,2,4,0.95)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div className="fade-in-up" style={{ maxWidth: 480, width: "100%", border: "2px solid #f53d3d88", background: "linear-gradient(160deg,rgba(24,6,10,0.97),rgba(8,2,4,0.99))", boxShadow: "0 0 50px rgba(245,61,61,0.25)", padding: "24px 22px", position: "relative" }}>
        <div style={{ textAlign: "center", marginBottom: 18 }}>
          <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 11, letterSpacing: "0.45em", color: "#f53d3d", marginBottom: 10 }}>⚠ PENALTY ZONE</div>
          <div style={{ height: 1, background: "linear-gradient(90deg,transparent,#f53d3d,transparent)", marginBottom: 14 }} />
          <div style={{ fontSize: 14, color: "#f0d8dd", lineHeight: 1.75 }}>
            You failed to clear {zone && zone.reason ? zone.reason : "yesterday's required Gate"}. A Penalty Zone has opened.
            Complete the Recovery Protocol to stabilize your rank and restore free-time earning.
          </div>
          <div style={{ fontSize: 10.5, color: "#8a6a70", marginTop: 8 }}>
            This is a reset, not a punishment. 5–20 minutes. No training debt is added.
          </div>
        </div>

        {PENALTY_STEPS.map(function (s) {
          const isDone = !!done[s.id];
          return (
            <button key={s.id} onClick={function () { setDone(Object.assign({}, done, { [s.id]: true })); }}
              style={{
                display: "flex", alignItems: "flex-start", gap: 10, width: "100%", textAlign: "left", padding: "9px 12px", marginBottom: 6,
                background: isDone ? "rgba(46,232,138,0.06)" : "rgba(245,61,61,0.04)",
                border: "1px solid " + (isDone ? "#2ee88a44" : "#f53d3d44"),
                cursor: isDone ? "default" : "pointer", color: "inherit",
              }}>
              <span style={{ width: 15, height: 15, flexShrink: 0, marginTop: 2, border: "1px solid " + (isDone ? "#2ee88a" : "#f53d3d88"), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "#2ee88a", background: isDone ? "rgba(46,232,138,0.15)" : "transparent" }}>{isDone ? "✓" : ""}</span>
              <span style={{ flex: 1 }}>
                <span style={{ fontSize: 13, color: isDone ? "#6fae6f" : "#f0d8dd", display: "block", textDecoration: isDone ? "line-through" : "none" }}>{s.name}</span>
                <span style={{ fontSize: 10.5, color: "#8a6a70", display: "block", marginTop: 2 }}>{s.detail}</span>
              </span>
            </button>
          );
        })}

        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button onClick={function () { if (allDone && typeof onComplete === "function") onComplete(); }} disabled={!allDone}
            style={{ flex: 2, padding: "13px", background: allDone ? "#2ee88a" : "#1a2438", color: allDone ? "#03050c" : "#5b7aa0", border: "none", cursor: allDone ? "pointer" : "not-allowed", fontFamily: "'Orbitron',sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: "0.15em" }}>
            {allDone ? "STABILIZE RANK" : count + "/" + PENALTY_STEPS.length + " CLEARED"}
          </button>
          <button onClick={onDefer}
            style={{ flex: 1, padding: "13px", background: "transparent", border: "1px solid #5b3a42", color: "#8a6a70", cursor: "pointer", fontFamily: "'Orbitron',sans-serif", fontSize: 10 }}>
            LATER
          </button>
        </div>
      </div>
    </div>
  );
}
