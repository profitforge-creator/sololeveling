import React, { useState, useEffect, useRef, useCallback } from "react";
import { saveGame, loadGame, defaultSave, deleteSave, exportSave, debounce } from "./utils/storage.js";

// ═════════════════════════════════════════════════════════════════
// ERROR BOUNDARY
// ═════════════════════════════════════════════════════════════════
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("SystemInterface Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100vh",
          background: "#050a16",
          color: "#e0e0e0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}>
          <div style={{
            textAlign: "center",
            maxWidth: "500px",
          }}>
            <h1 style={{ fontSize: "24px", marginBottom: "12px" }}>⚠ System Error</h1>
            <p style={{ fontSize: "14px", opacity: "0.7", marginBottom: "20px" }}>
              The system encountered an error. Please refresh the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: "10px 20px",
                background: "#6f42c1",
                border: "1px solid #8b5cf6",
                color: "#e0e0e0",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              Refresh
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function SystemInterface() {
  // ═════════════════════════════════════════════════════════════════
  // PHASE STATE
  // ═════════════════════════════════════════════════════════════════
  const [phase, setPhase] = useState("onboarding"); // "onboarding" | "playing" | "ascended"

  // ═════════════════════════════════════════════════════════════════
  // PLAYER STATE
  // ═════════════════════════════════════════════════════════════════
  const [player, setPlayer] = useState(() => {
    try {
      return defaultSave().player;
    } catch (_) {
      return { name: "Hunter", level: 1, xp: 0, streak: 0 };
    }
  });

  // ═════════════════════════════════════════════════════════════════
  // VIEW STATE
  // ═════════════════════════════════════════════════════════════════
  const [activeView, setActiveView] = useState("system");

  // ═════════════════════════════════════════════════════════════════
  // SAFE INITIALIZATION
  // ═════════════════════════════════════════════════════════════════
  useEffect(() => {
    try {
      const saved = loadGame();
      if (saved) {
        setPhase(saved.phase === "app" ? "playing" : "onboarding");
        setPlayer(saved.player || { name: "Hunter", level: 1, xp: 0, streak: 0 });
      }
    } catch (error) {
      console.error("Failed to load game state:", error);
    }
  }, []);

  // ═════════════════════════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════════════════════════
  return (
    <ErrorBoundary>
      <div style={{
        minHeight: "100vh",
        background: "#050a16",
        color: "#e0e0e0",
        fontFamily: "system-ui, -apple-system, sans-serif",
        padding: "16px",
      }}>
        {/* HEADER */}
        <div style={{
          marginBottom: "24px",
          borderBottom: "1px solid #333",
          paddingBottom: "16px",
        }}>
          <h1 style={{ margin: "0 0 8px 0", fontSize: "28px" }}>
            ARISE System
          </h1>
          <p style={{ margin: "0", fontSize: "13px", opacity: "0.6" }}>
            Phase: {phase} • {player.name}
          </p>
        </div>

        {/* MAIN CONTENT */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "16px",
          marginBottom: "24px",
        }}>
          {/* Player Card */}
          <div style={{
            background: "#0f1419",
            border: "1px solid #333",
            borderRadius: "6px",
            padding: "16px",
          }}>
            <h2 style={{ margin: "0 0 12px 0", fontSize: "14px", opacity: "0.8" }}>
              PLAYER
            </h2>
            <div style={{ fontSize: "13px", lineHeight: "1.6" }}>
              <div>Lv. {player.level || 1}</div>
              <div>XP: {player.xp || 0}</div>
              <div>Streak: {player.streak || 0}</div>
            </div>
          </div>

          {/* Phase Card */}
          <div style={{
            background: "#0f1419",
            border: "1px solid #333",
            borderRadius: "6px",
            padding: "16px",
          }}>
            <h2 style={{ margin: "0 0 12px 0", fontSize: "14px", opacity: "0.8" }}>
              PHASE
            </h2>
            <div style={{ fontSize: "13px", lineHeight: "1.6" }}>
              <div style={{ textTransform: "capitalize" }}>{phase}</div>
              <div style={{ fontSize: "11px", opacity: "0.5", marginTop: "8px" }}>
                Status: Ready
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{
            background: "#0f1419",
            border: "1px solid #333",
            borderRadius: "6px",
            padding: "16px",
          }}>
            <h2 style={{ margin: "0 0 12px 0", fontSize: "14px", opacity: "0.8" }}>
              ACTIONS
            </h2>
            <button
              onClick={() => {
                try {
                  const state = { phase, player, activeView };
                  const saved = saveGame(state);
                  console.log("Game saved:", saved);
                } catch (error) {
                  console.error("Save failed:", error);
                }
              }}
              style={{
                width: "100%",
                padding: "8px 12px",
                background: "#6f42c1",
                border: "1px solid #8b5cf6",
                color: "#e0e0e0",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "12px",
                marginBottom: "8px",
              }}
            >
              Save Game
            </button>
            <button
              onClick={() => {
                try {
                  setPhase("onboarding");
                  setPlayer({ name: "Hunter", level: 1, xp: 0, streak: 0 });
                  deleteSave();
                  console.log("Game reset");
                } catch (error) {
                  console.error("Reset failed:", error);
                }
              }}
              style={{
                width: "100%",
                padding: "8px 12px",
                background: "#333",
                border: "1px solid #555",
                color: "#e0e0e0",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "12px",
              }}
            >
              Reset
            </button>
          </div>
        </div>

        {/* STATUS */}
        <div style={{
          fontSize: "11px",
          opacity: "0.5",
          padding: "12px",
          background: "#0a0f17",
          borderRadius: "4px",
          borderLeft: "2px solid #6f42c1",
        }}>
          ✓ System initialized • Ready for commands
        </div>
      </div>
    </ErrorBoundary>
  );
}
