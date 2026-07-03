import React, { useState, useEffect, useRef } from "react";
import { STORY_CHAPTERS, SPEAKERS, getChapterState } from "../data/story.js";
import { SystemLogo } from "./SystemLogo.jsx";

/**
 * Story Mode — chapter list + cinematic scene player.
 * Chapters unlock through real progress (snapshot computed in App).
 */

function ScenePlayer({ chapter, onFinish, onClose }) {
  const [sceneIdx, setSceneIdx] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const timerRef = useRef(null);
  const scene = chapter.scenes[sceneIdx];
  const speaker = SPEAKERS[scene.sp] || SPEAKERS.system;
  const isArchitect = scene.sp === "architect";

  useEffect(function () {
    setCharCount(0);
    timerRef.current = setInterval(function () {
      setCharCount(function (c) {
        if (c >= scene.text.length) { clearInterval(timerRef.current); return c; }
        return c + 2;
      });
    }, 14);
    return function () { clearInterval(timerRef.current); };
  }, [sceneIdx]);

  const textDone = charCount >= scene.text.length;
  const last = sceneIdx >= chapter.scenes.length - 1;

  function advance() {
    if (!textDone) { setCharCount(scene.text.length); return; }
    if (last) { if (typeof onFinish === "function") onFinish(chapter); }
    else setSceneIdx(sceneIdx + 1);
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 10000, background: isArchitect ? "rgba(8,0,4,0.96)" : "rgba(2,6,14,0.95)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={advance}>
      <div className="fade-in" style={{ maxWidth: 560, width: "100%", cursor: "pointer" }}>
        <div style={{ textAlign: "center", marginBottom: 18 }}>
          <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 9, letterSpacing: "0.4em", color: "#5b7aa0" }}>STORY MODE · {chapter.title.split("—")[0].trim().toUpperCase()}</div>
        </div>
        <div style={{
          border: "1px solid " + speaker.color + (isArchitect ? "aa" : "66"),
          background: isArchitect ? "linear-gradient(160deg,rgba(30,0,10,0.95),rgba(10,0,5,0.98))" : "linear-gradient(160deg,rgba(10,18,34,0.97),rgba(5,10,20,0.99))",
          boxShadow: "0 0 40px " + speaker.color + "22", padding: "22px 24px", position: "relative",
          animation: isArchitect && sceneIdx === 1 ? "shake 0.35s linear 2" : "none",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            {scene.sp === "system"
              ? <SystemLogo size={26} color={speaker.color} />
              : <div style={{
                  width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
                  background: "radial-gradient(circle at 35% 30%," + speaker.color + "55,#05070d 75%)",
                  border: "1px solid " + speaker.color + "88",
                  boxShadow: isArchitect ? "0 0 16px " + speaker.color + "88" : "none",
                }} />}
            <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.25em", color: speaker.color }}>
              {speaker.name}
            </div>
          </div>
          <div style={{
            fontSize: 14.5, lineHeight: 1.85, color: isArchitect ? "#f0d8dd" : "#dbe6ff", minHeight: 90,
            fontFamily: speaker.style === "mono" ? "monospace" : "'Rajdhani','Oxanium',sans-serif",
            fontStyle: speaker.style === "serif" ? "italic" : "normal",
          }}>
            {scene.text.slice(0, charCount)}
            {!textDone && <span style={{ opacity: 0.6 }}>▌</span>}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16, alignItems: "center" }}>
            <span style={{ fontSize: 9, color: "#5b7aa0", fontFamily: "monospace" }}>{sceneIdx + 1} / {chapter.scenes.length}</span>
            <span style={{ fontSize: 10, color: speaker.color, fontFamily: "'Orbitron',sans-serif", letterSpacing: "0.15em" }}>
              {textDone ? (last ? "TAP TO COMPLETE CHAPTER ▸" : "TAP TO CONTINUE ▸") : "TAP TO SKIP ▸"}
            </span>
          </div>
        </div>
        <div style={{ textAlign: "center", marginTop: 14 }}>
          <button onClick={function (e) { e.stopPropagation(); if (typeof onClose === "function") onClose(); }}
            style={{ background: "transparent", border: "1px solid #2a3a55", color: "#5b7aa0", fontSize: 10, padding: "6px 16px", cursor: "pointer", fontFamily: "'Orbitron',sans-serif", letterSpacing: "0.15em" }}>
            EXIT (progress kept)
          </button>
        </div>
      </div>
    </div>
  );
}

export default function StoryView({ snapshot, accentColor, onChapterComplete }) {
  const c = accentColor || "#4db8ff";
  const [playing, setPlaying] = useState(null);
  const doneCount = snapshot.storyDone.length;

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 20, fontWeight: 700, color: "#eaf2ff" }}>Story Mode</div>
        <div style={{ height: 1, marginTop: 6, background: "linear-gradient(90deg," + c + ",transparent)" }} />
        <p style={{ fontSize: 12, color: "#5b7aa0", marginTop: 6 }}>
          The campaign unlocks through real progress — quests, gates, bosses, streaks. {doneCount}/{STORY_CHAPTERS.length} chapters completed.
        </p>
      </div>

      {STORY_CHAPTERS.map(function (ch) {
        const state = getChapterState(ch, snapshot);
        const locked = state === "locked";
        const done = state === "done";
        const isArch = !!ch.architectEncounter;
        const borderColor = done ? "#2ee88a55" : locked ? "#1a2438" : isArch ? "#ff224488" : c + "66";
        return (
          <button key={ch.id}
            onClick={function () { if (state === "ready") setPlaying(ch); }}
            disabled={locked}
            className={state === "ready" ? "pulse-glow" : ""}
            style={{
              display: "block", width: "100%", textAlign: "left", marginBottom: 10, cursor: state === "ready" ? "pointer" : "default",
              border: "1px solid " + borderColor, padding: "14px 16px", color: "inherit",
              background: done ? "rgba(46,232,138,0.03)" : locked ? "rgba(10,16,28,0.5)" : isArch ? "rgba(255,34,68,0.05)" : "rgba(77,184,255,0.05)",
              opacity: locked ? 0.55 : 1, position: "relative",
            }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
              <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 13, fontWeight: 700, color: done ? "#6fae6f" : locked ? "#3a4a65" : isArch ? "#ff5566" : "#dbe6ff" }}>
                {ch.title}
              </span>
              <span style={{ fontSize: 9, fontFamily: "'Orbitron',sans-serif", letterSpacing: "0.15em", flexShrink: 0, color: done ? "#2ee88a" : locked ? "#3a4a65" : "#f5b65d" }}>
                {done ? "✓ CLEARED" : locked ? "◈ SEALED" : "▸ READY"}
              </span>
            </div>
            <div style={{ fontSize: 11.5, color: locked ? "#3a4a65" : "#5b7aa0", marginTop: 5, fontStyle: "italic" }}>
              {locked ? "Unlock: " + ch.unlockHint : ch.tagline}
            </div>
            {state === "ready" && (
              <div style={{ fontSize: 10, color: c, marginTop: 6, fontFamily: "'Orbitron',sans-serif", letterSpacing: "0.1em" }}>
                REWARD: +{ch.reward.xp} XP · +{ch.reward.coins} coins
              </div>
            )}
          </button>
        );
      })}

      {playing && (
        <ScenePlayer
          chapter={playing}
          onClose={function () { setPlaying(null); }}
          onFinish={function (ch) {
            setPlaying(null);
            if (typeof onChapterComplete === "function") onChapterComplete(ch);
          }}
        />
      )}
    </div>
  );
}
