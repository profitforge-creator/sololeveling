import React, { useState, useEffect, useRef } from "react";

/**
 * ARISE — Custom System Logo + Boot Screen
 * Original mark: a stylized "S" formed from a gate-crack / lightning slash,
 * drawn as pure SVG. No copyrighted assets.
 */

export function SystemLogo({ size, color, glow }) {
  const s = size || 48;
  const c = color || "#4db8ff";
  return (
    <svg width={s} height={s} viewBox="0 0 64 64" style={{ display: "block", filter: glow ? "drop-shadow(0 0 " + Math.max(4, s / 8) + "px " + c + ")" : "none" }}>
      {/* Outer rune ring, broken like a cracked gate */}
      <path d="M32 4 A28 28 0 0 1 60 32" fill="none" stroke={c} strokeWidth="2" opacity="0.55" />
      <path d="M32 60 A28 28 0 0 1 4 32" fill="none" stroke={c} strokeWidth="2" opacity="0.55" />
      <path d="M55 50 A28 28 0 0 1 46 57" fill="none" stroke={c} strokeWidth="1.4" opacity="0.3" />
      <path d="M9 14 A28 28 0 0 1 18 7" fill="none" stroke={c} strokeWidth="1.4" opacity="0.3" />
      {/* The S — lightning-slash rune */}
      <path d="M44 14 L26 14 L20 26 L36 26 L40 33 L24 33 L30 22" fill="none" stroke={c} strokeWidth="0" />
      <path d="M45 12 L23 12 L18 27 L37 27 L33 37 L19 37 L16 44 L38 44 L46 24 L27 24 L31 19 L42 19 Z"
        fill={c} opacity="0.92" />
      {/* Slash spark */}
      <path d="M48 40 L41 52 L45 52 L38 62" fill="none" stroke={c} strokeWidth="2.2" strokeLinecap="round" opacity="0.85" />
      <circle cx="32" cy="32" r="30.5" fill="none" stroke={c} strokeWidth="0.6" opacity="0.25" />
    </svg>
  );
}

const BOOT_LINES = [
  "INITIALIZING HUNTER SYSTEM…",
  "Loading core modules… OK",
  "Scanning user data… OK",
  "Verifying save integrity… OK",
  "Calibrating energy scanner… OK",
  "Synchronizing gate network… OK",
  "Evaluation status: COMPLETE",
];

export function BootScreen({ onDone, hasSave }) {
  const [lineCount, setLineCount] = useState(0);
  const [fading, setFading] = useState(false);
  const timersRef = useRef([]);

  useEffect(function () {
    const lines = hasSave ? BOOT_LINES : BOOT_LINES.slice(0, 6).concat(["Evaluation status: PENDING"]);
    lines.forEach(function (_, i) {
      timersRef.current.push(setTimeout(function () { setLineCount(i + 1); }, 260 + i * 220));
    });
    timersRef.current.push(setTimeout(function () { setFading(true); }, 260 + lines.length * 220 + 500));
    timersRef.current.push(setTimeout(function () { if (typeof onDone === "function") onDone(); }, 260 + lines.length * 220 + 1050));
    return function () { timersRef.current.forEach(clearTimeout); };
  }, []);

  const lines = hasSave ? BOOT_LINES : BOOT_LINES.slice(0, 6).concat(["Evaluation status: PENDING"]);

  return (
    <div
      onClick={function () { if (typeof onDone === "function") onDone(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 12000, background: "radial-gradient(ellipse at 50% 35%,#0a1428 0%,#050a16 55%,#02040a 100%)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        opacity: fading ? 0 : 1, transition: "opacity 0.5s ease", cursor: "pointer",
      }}>
      <div style={{ animation: "bootPulse 2.2s ease-in-out infinite" }}>
        <SystemLogo size={110} color="#4db8ff" glow />
      </div>
      <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 13, letterSpacing: "0.5em", color: "#4db8ff", marginTop: 26, marginBottom: 4 }}>
        ARISE
      </div>
      <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 8, letterSpacing: "0.35em", color: "#5b7aa0", marginBottom: 28 }}>
        HUNTER SYSTEM INTERFACE
      </div>
      <div style={{ fontFamily: "monospace", fontSize: 10.5, color: "#5b7aa0", lineHeight: 1.9, minHeight: 150, width: 250 }}>
        {lines.slice(0, lineCount).map(function (l, i) {
          const last = i === lines.length - 1;
          return (
            <div key={i} className="fade-in" style={{ color: last ? "#2ee88a" : l.indexOf("INITIAL") === 0 ? "#4db8ff" : "#5b7aa0" }}>
              <span style={{ color: "#2a3a55" }}>▸ </span>{l}
            </div>
          );
        })}
      </div>
      <style>{"@keyframes bootPulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.06);opacity:0.85}}"}</style>
    </div>
  );
}
