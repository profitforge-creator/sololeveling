import React, { useState } from "react";
import { BUSINESS_QUEST_CHAINS, BUSINESS_SKILLS, treasuryOf, leakAlert, completedChainCount } from "../data/business.js";

/**
 * Business HQ — finance panel + quest chains + project dungeons + skill tree.
 * All money values are user-entered real numbers. Coins are the game economy;
 * real revenue is displayed as "Gold (real)" and never fabricated.
 */
export default function BusinessView({ business, onUpdateBusiness, onChainStep, accentColor }) {
  const c = accentColor || "#4db8ff";
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [logKind, setLogKind] = useState("income");
  const [projName, setProjName] = useState("");
  const [milestoneName, setMilestoneName] = useState({});

  const t = treasuryOf(business);
  const leak = leakAlert(business);
  const chains = completedChainCount(business);
  const prog = business.questProgress || {};
  const doneCounts = business.questDone || {};

  function addLog() {
    const n = parseFloat(amount);
    if (!isFinite(n) || n <= 0) return;
    const entry = { ts: Date.now(), amount: Math.round(n * 100) / 100, note: note.slice(0, 80) };
    const next = Object.assign({}, business);
    if (logKind === "income") next.incomeLog = (business.incomeLog || []).concat([entry]).slice(-200);
    else next.spendLog = (business.spendLog || []).concat([entry]).slice(-200);
    onUpdateBusiness(next, logKind === "income" ? "income" : "spend", entry);
    setAmount(""); setNote("");
  }

  function addProject() {
    if (!projName.trim()) return;
    const next = Object.assign({}, business, {
      projects: (business.projects || []).concat([{ id: "pj_" + Date.now(), name: projName.trim().slice(0, 60), milestones: [] }]),
    });
    onUpdateBusiness(next, "project");
    setProjName("");
  }

  function addMilestone(pjId) {
    const name = (milestoneName[pjId] || "").trim();
    if (!name) return;
    const next = Object.assign({}, business, {
      projects: business.projects.map(function (p) {
        if (p.id !== pjId) return p;
        return Object.assign({}, p, { milestones: p.milestones.concat([{ id: "ms_" + Date.now(), name: name.slice(0, 60), done: false }]) });
      }),
    });
    onUpdateBusiness(next, "milestone_add");
    setMilestoneName(Object.assign({}, milestoneName, { [pjId]: "" }));
  }

  function toggleMilestone(pjId, msId) {
    let completedNow = false;
    const next = Object.assign({}, business, {
      projects: business.projects.map(function (p) {
        if (p.id !== pjId) return p;
        return Object.assign({}, p, {
          milestones: p.milestones.map(function (m) {
            if (m.id !== msId) return m;
            if (!m.done) completedNow = true;
            return Object.assign({}, m, { done: !m.done });
          }),
        });
      }),
    });
    onUpdateBusiness(next, completedNow ? "milestone_clear" : "milestone_undo");
  }

  const inputStyle = { background: "rgba(5,10,20,0.9)", border: "1px solid " + c + "44", color: "#eaf2ff", fontSize: 13, padding: "9px 12px", outline: "none", fontFamily: "'Rajdhani',sans-serif" };

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 20, fontWeight: 700, color: "#eaf2ff" }}>Business HQ</div>
        <div style={{ height: 1, marginTop: 6, background: "linear-gradient(90deg," + c + ",transparent)" }} />
        <p style={{ fontSize: 12, color: "#5b7aa0", marginTop: 6 }}>
          Features are dungeons. Launches are boss raids. Revenue is gold. All money numbers here are yours — entered manually, never invented.
        </p>
      </div>

      {/* TREASURY */}
      <div className="sl-panel" style={{ marginBottom: 16, border: "1px solid #f5b65d55" }}>
        <div className="sl-corners" />
        <div className="sl-header-bar"><span className="sl-header-title" style={{ fontSize: 12, color: "#f5b65d" }}>◉ TREASURY (REAL GOLD)</span></div>
        <div style={{ padding: "14px 16px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 12 }}>
            {[["INCOME", t.income, "#2ee88a"], ["SPENT", t.spend, "#f53d3d"], ["NET", t.net, t.net >= 0 ? "#f5b65d" : "#f53d3d"]].map(function (s) {
              return (
                <div key={s[0]} style={{ border: "1px solid " + s[2] + "33", padding: "10px 6px", textAlign: "center" }}>
                  <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 17, fontWeight: 900, color: s[2] }}>{Number(s[1]).toFixed(2)}</div>
                  <div style={{ fontSize: 8, color: "#5b7aa0", letterSpacing: "0.15em", marginTop: 2 }}>{s[0]}</div>
                </div>
              );
            })}
          </div>
          {leak && (
            <div style={{ border: "1px solid #f53d3d66", background: "rgba(245,61,61,0.07)", padding: "9px 12px", fontSize: 11.5, color: "#f57a7a", marginBottom: 12, lineHeight: 1.6 }}>
              ⚠ {leak}
            </div>
          )}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <select value={logKind} onChange={function (e) { setLogKind(e.target.value); }} style={Object.assign({}, inputStyle, { flexShrink: 0 })}>
              <option value="income">+ Income</option>
              <option value="spend">− Spending</option>
            </select>
            <input type="number" min="0" step="0.01" placeholder="Amount" value={amount} onChange={function (e) { setAmount(e.target.value); }} style={Object.assign({}, inputStyle, { width: 90 })} />
            <input placeholder="Note (optional)" value={note} onChange={function (e) { setNote(e.target.value); }} style={Object.assign({}, inputStyle, { flex: 1, minWidth: 120 })} />
            <button onClick={addLog} style={{ background: c, color: "#03050c", border: "none", padding: "9px 16px", fontFamily: "'Orbitron',sans-serif", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>LOG</button>
          </div>
        </div>
      </div>

      {/* QUEST CHAINS */}
      <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 12, letterSpacing: "0.25em", color: "#5b7aa0", marginBottom: 10 }}>QUEST CHAINS</div>
      {BUSINESS_QUEST_CHAINS.map(function (chain) {
        const p = prog[chain.id] || {};
        const doneSteps = chain.steps.filter(function (s) { return p[s.id]; }).length;
        const timesCompleted = doneCounts[chain.id] || 0;
        return (
          <div key={chain.id} className="sl-panel" style={{ marginBottom: 12, border: "1px solid " + chain.color + "44" }}>
            <div className="sl-corners" />
            <div className="sl-header-bar" style={{ display: "flex", justifyContent: "space-between" }}>
              <span className="sl-header-title" style={{ fontSize: 12, color: chain.color }}>{chain.icon} {chain.name.toUpperCase()}</span>
              {timesCompleted > 0 && <span style={{ fontSize: 9, color: "#2ee88a", fontFamily: "'Orbitron',sans-serif" }}>CLEARED ×{timesCompleted}</span>}
            </div>
            <div style={{ padding: "10px 14px" }}>
              <div style={{ fontSize: 11, color: "#5b7aa0", marginBottom: 8 }}>{chain.desc}</div>
              {chain.steps.map(function (s, i) {
                const stepDone = !!p[s.id];
                const isNext = !stepDone && chain.steps.slice(0, i).every(function (ps) { return p[ps.id]; });
                return (
                  <button key={s.id}
                    onClick={function () { if (isNext && typeof onChainStep === "function") onChainStep(chain, s); }}
                    disabled={!isNext}
                    style={{
                      display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left", padding: "8px 10px", marginBottom: 4,
                      background: stepDone ? "rgba(46,232,138,0.05)" : isNext ? "rgba(77,184,255,0.06)" : "transparent",
                      border: "1px solid " + (stepDone ? "#2ee88a33" : isNext ? chain.color + "55" : "#16213599"),
                      cursor: isNext ? "pointer" : "default", color: "inherit", opacity: stepDone || isNext ? 1 : 0.5,
                    }}>
                    <span style={{ fontSize: 10, color: stepDone ? "#2ee88a" : "#5b7aa0", fontFamily: "monospace", flexShrink: 0 }}>{stepDone ? "✓" : "0" + (i + 1)}</span>
                    <span style={{ fontSize: 12.5, color: stepDone ? "#6fae6f" : "#dbe6ff", textDecoration: stepDone ? "line-through" : "none", flex: 1 }}>{s.name}</span>
                    <span style={{ fontSize: 9.5, color: chain.color, fontFamily: "'Orbitron',sans-serif", flexShrink: 0 }}>+{s.xp} XP</span>
                  </button>
                );
              })}
              <div style={{ height: 3, background: "rgba(77,184,255,0.1)", marginTop: 6 }}>
                <div style={{ height: "100%", width: Math.round((doneSteps / chain.steps.length) * 100) + "%", background: chain.color, transition: "width 0.4s ease" }} />
              </div>
            </div>
          </div>
        );
      })}

      {/* PROJECTS */}
      <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 12, letterSpacing: "0.25em", color: "#5b7aa0", margin: "18px 0 10px" }}>PROJECT DUNGEONS</div>
      <div className="sl-panel" style={{ marginBottom: 12, border: "1px solid " + c + "44" }}>
        <div className="sl-corners" />
        <div style={{ padding: "12px 14px" }}>
          <div style={{ display: "flex", gap: 6, marginBottom: (business.projects || []).length ? 14 : 0 }}>
            <input placeholder="New project name (e.g. LaunchForge)" value={projName} onChange={function (e) { setProjName(e.target.value); }} style={Object.assign({}, inputStyle, { flex: 1 })} />
            <button onClick={addProject} style={{ background: c, color: "#03050c", border: "none", padding: "9px 14px", fontFamily: "'Orbitron',sans-serif", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>OPEN GATE</button>
          </div>
          {(business.projects || []).map(function (pj) {
            const total = pj.milestones.length;
            const done = pj.milestones.filter(function (m) { return m.done; }).length;
            return (
              <div key={pj.id} style={{ border: "1px solid " + c + "33", padding: "10px 12px", marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                  <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 13, fontWeight: 700, color: "#dbe6ff" }}>{pj.name}</span>
                  <span style={{ fontSize: 10, color: total > 0 && done === total ? "#2ee88a" : "#5b7aa0", fontFamily: "'Orbitron',sans-serif" }}>
                    {total === 0 ? "NO ROOMS YET" : done + "/" + total + " ROOMS CLEARED"}
                  </span>
                </div>
                {pj.milestones.map(function (m) {
                  return (
                    <button key={m.id} onClick={function () { toggleMilestone(pj.id, m.id); }}
                      style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", textAlign: "left", background: "transparent", border: "none", padding: "4px 2px", cursor: "pointer", color: "inherit" }}>
                      <span style={{ width: 13, height: 13, border: "1px solid " + (m.done ? "#2ee88a" : c + "66"), fontSize: 9, color: "#2ee88a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: m.done ? "rgba(46,232,138,0.15)" : "transparent" }}>{m.done ? "✓" : ""}</span>
                      <span style={{ fontSize: 12, color: m.done ? "#6fae6f" : "#c8e8ff", textDecoration: m.done ? "line-through" : "none" }}>{m.name}</span>
                    </button>
                  );
                })}
                <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                  <input placeholder="Add milestone (room)" value={milestoneName[pj.id] || ""} onChange={function (e) { setMilestoneName(Object.assign({}, milestoneName, { [pj.id]: e.target.value })); }} style={Object.assign({}, inputStyle, { flex: 1, fontSize: 11, padding: "6px 10px" })} />
                  <button onClick={function () { addMilestone(pj.id); }} style={{ background: "transparent", border: "1px solid " + c + "66", color: c, padding: "6px 10px", fontSize: 10, cursor: "pointer", fontFamily: "'Orbitron',sans-serif" }}>+ROOM</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SKILL TREE */}
      <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 12, letterSpacing: "0.25em", color: "#5b7aa0", margin: "18px 0 10px" }}>DEVELOPER SKILL TREE · {chains} CHAINS CLEARED</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 8, marginBottom: 8 }}>
        {BUSINESS_SKILLS.map(function (sk) {
          const unlocked = chains >= sk.req;
          return (
            <div key={sk.id} style={{ border: "1px solid " + (unlocked ? "#2ee88a55" : "#1a2438"), padding: "12px 10px", textAlign: "center", opacity: unlocked ? 1 : 0.55, background: unlocked ? "rgba(46,232,138,0.04)" : "transparent" }}>
              <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: 12, fontWeight: 700, color: unlocked ? "#2ee88a" : "#3a4a65" }}>{sk.name}</div>
              <div style={{ fontSize: 9.5, color: "#5b7aa0", marginTop: 4 }}>{sk.desc}</div>
              <div style={{ fontSize: 9.5, color: unlocked ? "#c8e8ff" : "#3a4a65", marginTop: 4 }}>{sk.bonus}</div>
            </div>
          );
        })}
      </div>
      <div style={{ fontSize: 10, color: "#5b7aa0", lineHeight: 1.6 }}>
        ◈ Skill tiers unlock automatically as quest chains complete and grant their stat bonuses once. Getting users/views = Guild Reputation (log it in Marketing). Saving money = Treasury growth.
      </div>
    </div>
  );
}
