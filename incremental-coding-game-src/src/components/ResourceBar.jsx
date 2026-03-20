import React from "react";
import { useGameStore } from "../gameStore.js";
import { useTheme } from "../themes.js";

export function ResourceBar({
  isRunning,
  onRun,
  onStop,
  onSave,
  hasUnsavedChanges,
  onOpenTechTree,
  onReset,
  availableUpgradeCount,
  hasSeenUpgrades,
  onCycleTheme,
  themeName,
}) {
  const resources = useGameStore((s) => s.resources);
  const tech = useGameStore((s) => s.tech);
  const virtualTime = useGameStore((s) => s.virtualTime);
  const credits = useGameStore((s) => s.credits);
  const t = useTheme();

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = (seconds % 60).toFixed(1);
    return `${h}:${m.toString().padStart(2, "0")}:${s.padStart(4, "0")}`;
  };

  const btnStyle = (color, active) => ({
    padding: "3px 12px",
    fontSize: "11px",
    fontFamily: t.font,
    letterSpacing: "1px",
    backgroundColor: active ? t.bg3 : t.bg,
    color: active ? color : t.primaryDark,
    border: `1px solid ${active ? color : t.border}`,
    cursor: active ? "pointer" : "default",
    textTransform: "uppercase",
  });

  return (
    <div
      className="resource-bar-wrap"
      style={{
        height: "36px",
        backgroundColor: t.bg,
        borderBottom: `1px solid ${t.border}`,
        display: "flex",
        alignItems: "center",
        padding: "0 12px",
        gap: "16px",
        flexShrink: 0,
      }}
    >
      {/* Run/Stop */}
      {isRunning ? (
        <button onClick={onStop} style={btnStyle(t.red, true)}>
          [STOP]
        </button>
      ) : (
        <button onClick={onRun} style={btnStyle(t.primary, true)}>
          [RUN]
        </button>
      )}

      {/* Save */}
      <button
        onClick={onSave}
        disabled={!hasUnsavedChanges}
        style={{
          ...btnStyle(t.yellow, hasUnsavedChanges),
          opacity: hasUnsavedChanges ? 1 : 0.35,
          animation: hasUnsavedChanges ? "pulse-border 1.5s ease-in-out infinite" : "none",
        }}
        title="Save code (Ctrl+S)"
      >
        [SAVE]
      </button>

      {/* Resources */}
      <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
        <ResCount label="A" count={resources.A} color={t.resourceA} t={t} />
        {tech.convertAToBUnlocked && <ResCount label="B" count={resources.B} color={t.resourceB} t={t} />}
        {tech.resourceCUnlocked && <ResCount label="C" count={resources.C} color={t.resourceC} t={t} />}
      </div>

      {/* Credits */}
      <div style={{ fontSize: "12px", color: t.primary }}>
        <span style={{ color: t.primaryDim }}>$</span>{credits}
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Virtual Time (hidden on mobile via CSS) */}
      <span className="hide-mobile" style={{ color: t.primaryDark, fontSize: "10px" }}>CLOCK:</span>
      <span className="hide-mobile" style={{ color: t.primaryDim, fontSize: "11px", fontFamily: t.font }}>
        {formatTime(virtualTime)}
      </span>

      {/* Theme Switcher */}
      <button
        onClick={onCycleTheme}
        style={btnStyle(t.accent, true)}
        title={`Theme: ${themeName}`}
      >
        [{themeName?.toUpperCase().slice(0, 4) || "THEME"}]
      </button>

      {/* Tech Tree */}
      <button
        onClick={onOpenTechTree}
        style={{
          ...btnStyle(t.primary, true),
          position: "relative",
          animation: availableUpgradeCount > 0 && !hasSeenUpgrades ? "pulse-border 1.5s ease-in-out infinite" : "none",
        }}
      >
        [TECH]
        {availableUpgradeCount > 0 && (
          <span style={{
            position: "absolute", top: "-6px", right: "-6px",
            backgroundColor: t.primary, color: t.bg,
            borderRadius: "50%", width: "14px", height: "14px",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "9px", fontWeight: "bold",
          }}>
            {availableUpgradeCount}
          </span>
        )}
      </button>

      {/* Reset (hidden on mobile) */}
      <button className="hide-mobile" onClick={onReset} style={btnStyle(t.red, true)} title="Reset all progress">
        [RST]
      </button>
    </div>
  );
}

function ResCount({ label, count, color, t }) {
  return (
    <span style={{ fontSize: "12px", fontFamily: t.font }}>
      <span style={{ color, fontWeight: "bold" }}>{label}</span>
      <span style={{ color: t.primaryDim }}>:</span>
      <span style={{ color: t.primary }}>{count}</span>
    </span>
  );
}
