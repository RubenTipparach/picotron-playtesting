import React from "react";
import { useGameStore } from "../gameStore.js";

export function ResourceBar({
  isRunning,
  onRun,
  onStop,
  onOpenTechTree,
  onReset,
  availableUpgradeCount,
  hasSeenUpgrades,
}) {
  const resources = useGameStore((s) => s.resources);
  const tech = useGameStore((s) => s.tech);
  const virtualTime = useGameStore((s) => s.virtualTime);
  const credits = useGameStore((s) => s.credits);

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = (seconds % 60).toFixed(1);
    return `${h}:${m.toString().padStart(2, "0")}:${s.padStart(4, "0")}`;
  };

  const btnStyle = (color, active) => ({
    padding: "3px 12px",
    fontSize: "11px",
    fontFamily: "var(--hk-font)",
    letterSpacing: "1px",
    backgroundColor: active ? "#001a00" : "#0a0a0a",
    color: active ? color : "#004400",
    border: `1px solid ${active ? color : "#003300"}`,
    cursor: active ? "pointer" : "default",
    textTransform: "uppercase",
  });

  return (
    <div
      style={{
        height: "36px",
        backgroundColor: "#0a0a0a",
        borderBottom: "1px solid #003300",
        display: "flex",
        alignItems: "center",
        padding: "0 12px",
        gap: "16px",
        flexShrink: 0,
      }}
    >
      {/* Run/Stop */}
      {isRunning ? (
        <button onClick={onStop} style={btnStyle("#ff0040", true)}>
          [STOP]
        </button>
      ) : (
        <button onClick={onRun} style={btnStyle("#00ff41", true)}>
          [RUN]
        </button>
      )}

      {/* Resources */}
      <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
        <ResCount label="A" count={resources.A} color="#00aaff" />
        {tech.convertAToBUnlocked && <ResCount label="B" count={resources.B} color="#aa44ff" />}
        {tech.resourceCUnlocked && <ResCount label="C" count={resources.C} color="#ff6b35" />}
      </div>

      {/* Credits */}
      <div style={{ fontSize: "12px", color: "#00ff41" }}>
        <span style={{ color: "#00cc33" }}>$</span>{credits}
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Virtual Time */}
      <span style={{ color: "#004400", fontSize: "10px" }}>CLOCK:</span>
      <span style={{ color: "#00cc33", fontSize: "11px", fontFamily: "var(--hk-font)" }}>
        {formatTime(virtualTime)}
      </span>

      {/* Tech Tree */}
      <button
        onClick={onOpenTechTree}
        style={{
          ...btnStyle("#00ff41", true),
          position: "relative",
          animation: availableUpgradeCount > 0 && !hasSeenUpgrades ? "pulse-border 1.5s ease-in-out infinite" : "none",
        }}
      >
        [TECH]
        {availableUpgradeCount > 0 && (
          <span style={{
            position: "absolute", top: "-6px", right: "-6px",
            backgroundColor: "#00ff41", color: "#000",
            borderRadius: "50%", width: "14px", height: "14px",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "9px", fontWeight: "bold",
          }}>
            {availableUpgradeCount}
          </span>
        )}
      </button>

      {/* Reset */}
      <button onClick={onReset} style={btnStyle("#ff0040", true)} title="Reset all progress">
        [RST]
      </button>
    </div>
  );
}

function ResCount({ label, count, color }) {
  return (
    <span style={{ fontSize: "12px", fontFamily: "var(--hk-font)" }}>
      <span style={{ color, fontWeight: "bold" }}>{label}</span>
      <span style={{ color: "#00cc33" }}>:</span>
      <span style={{ color: "#00ff41" }}>{count}</span>
    </span>
  );
}
