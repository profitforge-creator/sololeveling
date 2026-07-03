import React, { useState, useEffect, useRef } from "react";
import { getGeminiKey, setGeminiKey, buildContext, askGemini, localReply } from "../utils/companion.js";
import { SystemLogo } from "./SystemLogo.jsx";

/**
 * System Companion Chat — the System as a conversational entity.
 * Gemini-powered when a key is configured; offline rule-engine otherwise.
 */
export default function CompanionView({ ctx, accentColor }) {
  const c = accentColor || "#4db8ff";
  const [log, setLog] = useState([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [keyOpen, setKeyOpen] = useState(false);
  const [keyDraft, setKeyDraft] = useState("");
  const [hasKey, setHasKey] = useState(!!getGeminiKey());
  const scrollRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(function () {
    mountedRef.current = true;
    setLog([{
      role: "model",
      text: "Connection established. I am the System.\n\nCurrent read: LV " + ctx.level + " " + ctx.rankName + " · streak " + ctx.streak + " · energy " + ctx.energyScore + "/100 · daily quest " + (ctx.isDailyDone ? "cleared" : "pending") + ".\n\nState your objective — or ask about training, recovery, quests, business, or your status." +
        (hasKey ? "" : "\n\n[Offline reasoning mode. Add a Gemini API key below for full companion intelligence.]"),
    }]);
    return function () { mountedRef.current = false; };
  }, []);

  useEffect(function () {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [log, thinking]);

  function send() {
    const msg = input.trim();
    if (!msg || thinking) return;
    setInput("");
    const nextLog = log.concat([{ role: "user", text: msg }]);
    setLog(nextLog);
    const key = getGeminiKey();
    const contextStr = buildContext(ctx);

    if (key) {
      setThinking(true);
      askGemini(key, contextStr, nextLog.slice(0, -1), msg)
        .then(function (reply) {
          if (!mountedRef.current) return;
          setLog(function (prev) { return prev.concat([{ role: "model", text: reply }]); });
        })
        .catch(function () {
          if (!mountedRef.current) return;
          setLog(function (prev) { return prev.concat([{ role: "model", text: "[Uplink unstable — switching to local core]\n\n" + localReply(ctx, msg) }]); });
        })
        .then(function () { if (mountedRef.current) setThinking(false); });
    } else {
      setThinking(true);
      setTimeout(function () {
        if (!mountedRef.current) return;
        setLog(function (prev) { return prev.concat([{ role: "model", text: localReply(ctx, msg) }]); });
        setThinking(false);
      }, 450);
    }
  }

  function saveKey() {
    setGeminiKey(keyDraft.trim());
    setHasKey(!!keyDraft.trim());
    setKeyOpen(false);
    setKeyDraft("");
    setLog(function (prev) {
      return prev.concat([{ role: "model", text: keyDraft.trim() ? "External intelligence uplink configured. Full companion mode active." : "Uplink removed. Local core only." }]);
    });
  }

  const QUICK = ["Status report", "What's my next quest?", "How do I get faster?", "I'm feeling sore today", "Business check-in"];

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <SystemLogo size={26} color={c} glow />
          <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 20, fontWeight: 700, color: "#eaf2ff" }}>The System</div>
        </div>
        <div style={{ height: 1, marginTop: 6, background: "linear-gradient(90deg," + c + ",transparent)" }} />
        <p style={{ fontSize: 12, color: "#5b7aa0", marginTop: 6 }}>
          Your companion reads live data: energy, streak, quests, rank, business progress. It recommends — you decide.
          {" "}It is not a doctor; injuries and health concerns go to a real adult/professional.
        </p>
      </div>

      <div className="sl-panel" style={{ border: "1px solid " + c + "55", display: "flex", flexDirection: "column", height: "58vh", minHeight: 380 }}>
        <div className="sl-corners" />
        <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "16px 16px 8px" }}>
          {log.map(function (m, i) {
            const isSys = m.role === "model";
            return (
              <div key={i} style={{ marginBottom: 12, textAlign: isSys ? "left" : "right" }}>
                {isSys && (
                  <div style={{ fontSize: 8.5, color: c, fontFamily: "'Orbitron',sans-serif", letterSpacing: "0.25em", marginBottom: 3 }}>◈ SYSTEM</div>
                )}
                <div style={{
                  display: "inline-block", maxWidth: "92%", textAlign: "left", padding: "10px 14px", fontSize: 13, lineHeight: 1.7, whiteSpace: "pre-wrap",
                  background: isSys ? "rgba(10,18,34,0.92)" : "rgba(77,184,255,0.1)",
                  border: "1px solid " + (isSys ? c + "44" : "#4db8ff33"),
                  color: isSys ? "#c8e8ff" : "#dbe6ff",
                  boxShadow: isSys ? "0 0 12px " + c + "11" : "none",
                }}>{m.text}</div>
              </div>
            );
          })}
          {thinking && (
            <div style={{ fontSize: 11, color: c, fontFamily: "monospace", padding: "4px 2px" }} className="flicker">
              ▸ The System is processing…
            </div>
          )}
        </div>
        <div style={{ padding: "8px 12px", display: "flex", gap: 6, flexWrap: "wrap", borderTop: "1px solid " + c + "22" }}>
          {QUICK.map(function (q) {
            return (
              <button key={q} onClick={function () { setInput(q); }}
                style={{ background: "transparent", border: "1px solid " + c + "33", color: "#9fb8d8", fontSize: 10.5, padding: "5px 10px", cursor: "pointer" }}>
                {q}
              </button>
            );
          })}
        </div>
        <div style={{ padding: "10px 12px 12px", display: "flex", gap: 8 }}>
          <input
            value={input}
            onChange={function (e) { setInput(e.target.value); }}
            onKeyDown={function (e) { if (e.key === "Enter") send(); }}
            placeholder="Speak to the System…"
            style={{ flex: 1, background: "rgba(5,10,20,0.9)", border: "1px solid " + c + "44", color: "#eaf2ff", fontSize: 13, padding: "11px 14px", outline: "none", fontFamily: "'Rajdhani',sans-serif" }} />
          <button onClick={send} disabled={thinking}
            style={{ background: thinking ? "#1a2438" : c, color: thinking ? "#5b7aa0" : "#03050c", border: "none", padding: "0 20px", fontFamily: "'Orbitron',sans-serif", fontSize: 12, fontWeight: 700, cursor: thinking ? "wait" : "pointer" }}>
            SEND
          </button>
        </div>
      </div>

      {/* Gemini uplink config */}
      <div style={{ marginTop: 12, border: "1px solid " + (hasKey ? "#2ee88a44" : "#2a3a55"), padding: "10px 14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 11, color: hasKey ? "#2ee88a" : "#5b7aa0", fontFamily: "'Orbitron',sans-serif", letterSpacing: "0.12em" }}>
            {hasKey ? "◈ GEMINI UPLINK ACTIVE" : "◈ GEMINI UPLINK OFFLINE — local core in use"}
          </span>
          <button onClick={function () { setKeyOpen(!keyOpen); }}
            style={{ background: "transparent", border: "1px solid #2a3a55", color: "#9fb8d8", fontSize: 10, padding: "5px 12px", cursor: "pointer", fontFamily: "'Orbitron',sans-serif" }}>
            {keyOpen ? "CLOSE" : "CONFIGURE"}
          </button>
        </div>
        {keyOpen && (
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 10.5, color: "#5b7aa0", lineHeight: 1.6, marginBottom: 8 }}>
              Paste a Google AI Studio API key (aistudio.google.com → Get API key). Stored only on this device, sent only to Google's Gemini API.
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <input type="password" placeholder="AIza..." value={keyDraft} onChange={function (e) { setKeyDraft(e.target.value); }}
                style={{ flex: 1, background: "rgba(5,10,20,0.9)", border: "1px solid " + c + "44", color: "#eaf2ff", fontSize: 12, padding: "8px 12px", outline: "none", fontFamily: "monospace" }} />
              <button onClick={saveKey} style={{ background: c, color: "#03050c", border: "none", padding: "8px 14px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'Orbitron',sans-serif" }}>SAVE</button>
              {hasKey && <button onClick={function () { setKeyDraft(""); setGeminiKey(""); setHasKey(false); setKeyOpen(false); }} style={{ background: "transparent", border: "1px solid #f53d3d66", color: "#f57a7a", padding: "8px 12px", fontSize: 10, cursor: "pointer", fontFamily: "'Orbitron',sans-serif" }}>REMOVE</button>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
