import React, { useState, useEffect, useRef } from "react";
import { NPCS, relTier, getTopics, npcReply, getGreeting } from "../data/npcs.js";

/** Original hunter silhouettes as SVG — different shapes per archetype. */
function Silhouette({ type, color, size }) {
  const s = size || 56;
  const c = color || "#4db8ff";
  const paths = {
    boy:     "M28 8 a8 8 0 1 0 0.1 0 M18 26 q10 -6 20 0 l3 18 h-6 l-2 -10 -1 22 h-8 l-1 -22 -2 10 h-6 z",
    girl:    "M28 8 a7.5 7.5 0 1 0 0.1 0 M17 25 q11 -7 22 0 l2 16 -5 1 -1 -8 -2 24 h-10 l-2 -24 -1 8 -5 -1 z M16 22 q-2 8 1 14 M40 22 q2 8 -1 14",
    adult:   "M28 7 a8 8 0 1 0 0.1 0 M16 27 q12 -8 24 0 l4 20 h-7 l-2 -12 -1 24 h-12 l-1 -24 -2 12 h-7 z",
    mentor:  "M28 8 a7.5 7.5 0 1 0 0.1 0 M17 26 q11 -6 22 0 l3 18 h-6 l-2 -10 -1 24 h-10 l-1 -24 -2 10 h-6 z M20 20 q8 6 16 0",
    leader:  "M28 6 a8 8 0 1 0 0.1 0 M14 28 q14 -10 28 0 l5 22 h-8 l-3 -14 -1 26 h-14 l-1 -26 -3 14 h-8 z M20 4 l8 -4 8 4 -8 3 z",
    trainer: "M28 8 a8 8 0 1 0 0.1 0 M15 30 q13 -10 26 0 l6 12 -5 3 -5 -9 -1 26 h-14 l-1 -26 -5 9 -5 -3 z",
    rival:   "M28 8 a8 8 0 1 0 0.1 0 M18 26 q10 -7 20 0 l6 14 -5 4 -4 -9 -1 27 h-12 l-1 -27 -4 9 -5 -4 z M44 20 l6 -6 M12 20 l-6 -6",
  };
  return (
    <svg width={s} height={s} viewBox="0 0 56 72" style={{ display: "block" }}>
      <path d={paths[type] || paths.adult} fill="#05070d" stroke={c} strokeWidth="1.2" opacity="0.95"
        style={{ filter: "drop-shadow(0 0 6px " + c + "55)" }} />
    </svg>
  );
}

function ChatModal({ npc, ctx, onClose, onRelGain }) {
  const [log, setLog] = useState([]);
  const scrollRef = useRef(null);
  const gainedRef = useRef(0);

  useEffect(function () {
    setLog([{ from: "npc", text: getGreeting(npc, ctx) }]);
  }, [npc.id]);

  useEffect(function () {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [log]);

  function ask(topic) {
    const reply = npcReply(npc, topic.id, ctx);
    setLog(function (prev) { return prev.concat([{ from: "you", text: topic.label }, { from: "npc", text: reply }]); });
    /* Relationship gain capped at 3 per session */
    if (gainedRef.current < 3 && typeof onRelGain === "function") {
      gainedRef.current += 1;
      onRelGain(npc.id, 1);
    }
  }

  const topics = getTopics(npc, ctx);
  const tier = relTier(ctx.rel || 0);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 10000, background: "rgba(2,6,14,0.94)", display: "flex", alignItems: "center", justifyContent: "center", padding: 14 }}>
      <div className="fade-in-up sl-panel" style={{ maxWidth: 520, width: "100%", border: "1px solid " + npc.color + "66", maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
        <div className="sl-corners" />
        <div style={{ display: "flex", gap: 14, padding: "16px 18px 10px", alignItems: "center", borderBottom: "1px solid " + npc.color + "22" }}>
          <Silhouette type={npc.silhouette} color={npc.color} size={52} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 15, fontWeight: 700, color: npc.color }}>{npc.name}</div>
            <div style={{ fontSize: 11, color: "#9fb8d8" }}>{npc.role}</div>
            <div style={{ fontSize: 9.5, color: tier.color, fontFamily: "'Orbitron',sans-serif", letterSpacing: "0.12em", marginTop: 2 }}>
              {tier.label.toUpperCase()} · BOND {ctx.rel || 0}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "1px solid #2a3a55", color: "#5b7aa0", fontSize: 12, width: 28, height: 28, cursor: "pointer" }}>✕</button>
        </div>
        <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "14px 18px", minHeight: 180, maxHeight: 320 }}>
          {log.map(function (m, i) {
            return (
              <div key={i} style={{ marginBottom: 10, textAlign: m.from === "you" ? "right" : "left" }}>
                <div style={{
                  display: "inline-block", maxWidth: "88%", textAlign: "left", padding: "8px 12px", fontSize: 13, lineHeight: 1.65,
                  background: m.from === "you" ? "rgba(77,184,255,0.1)" : "rgba(10,18,34,0.9)",
                  border: "1px solid " + (m.from === "you" ? "#4db8ff44" : npc.color + "33"),
                  color: m.from === "you" ? "#c8e8ff" : "#dbe6ff",
                }}>{m.text}</div>
              </div>
            );
          })}
        </div>
        <div style={{ padding: "10px 14px 14px", borderTop: "1px solid " + npc.color + "22", display: "flex", flexWrap: "wrap", gap: 6 }}>
          {topics.map(function (t) {
            return (
              <button key={t.id} onClick={function () { ask(t); }}
                style={{ background: "rgba(77,184,255,0.06)", border: "1px solid " + npc.color + "44", color: "#c8e8ff", fontSize: 11.5, padding: "8px 12px", cursor: "pointer", fontFamily: "'Rajdhani',sans-serif", fontWeight: 600 }}>
                {t.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function NPCsView({ npcCtxBuilder, npcState, accentColor, onRelGain }) {
  const c = accentColor || "#4db8ff";
  const [chatting, setChatting] = useState(null);
  const rels = (npcState && npcState.relationships) || {};

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 20, fontWeight: 700, color: "#eaf2ff" }}>Hunter Network</div>
        <div style={{ height: 1, marginTop: 6, background: "linear-gradient(90deg," + c + ",transparent)" }} />
        <p style={{ fontSize: 12, color: "#5b7aa0", marginTop: 6 }}>
          Hunters, coaches and mentors in your orbit. They see your public record — not the System. Talking builds bonds.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(230px,1fr))", gap: 12 }}>
        {NPCS.map(function (npc) {
          const rel = rels[npc.id] || 0;
          const tier = relTier(rel);
          return (
            <button key={npc.id} onClick={function () { setChatting(npc); }}
              className="sl-panel"
              style={{ border: "1px solid " + npc.color + "44", padding: 0, cursor: "pointer", textAlign: "left", color: "inherit", background: "rgba(8,14,26,0.85)" }}>
              <div style={{ display: "flex", gap: 12, padding: "14px 14px 10px", alignItems: "center" }}>
                <Silhouette type={npc.silhouette} color={npc.color} size={46} />
                <div>
                  <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 13, fontWeight: 700, color: npc.color }}>{npc.name}</div>
                  <div style={{ fontSize: 10.5, color: "#9fb8d8", marginTop: 2 }}>{npc.role}</div>
                  <div style={{ fontSize: 9, color: tier.color, fontFamily: "'Orbitron',sans-serif", letterSpacing: "0.1em", marginTop: 3 }}>{tier.label.toUpperCase()} · {rel}</div>
                </div>
              </div>
              <div style={{ padding: "0 14px 12px", fontSize: 10.5, color: "#5b7aa0", lineHeight: 1.55 }}>{npc.bio}</div>
            </button>
          );
        })}
      </div>

      {chatting && (
        <ChatModal
          npc={chatting}
          ctx={npcCtxBuilder(chatting)}
          onClose={function () { setChatting(null); }}
          onRelGain={onRelGain}
        />
      )}
    </div>
  );
}
