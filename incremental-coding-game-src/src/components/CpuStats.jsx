import React from "react";
import { useGameStore } from "../gameStore.js";
import { useTheme } from "../themes.js";

/** Map 0-100% to a green→yellow→red heat color */
function heatColor(pctValue) {
  const p = Math.max(0, Math.min(100, pctValue));
  if (p < 50) {
    // green → yellow
    const r = Math.round((p / 50) * 255);
    return `rgb(${r}, 200, 60)`;
  }
  // yellow → red
  const g = Math.round(200 - ((p - 50) / 50) * 160);
  return `rgb(255, ${g}, 60)`;
}

export function CpuStats({ stats, onScrollToLine }) {
  const cpuLevel = useGameStore((s) => s.cpuLevel);
  const BASE_IPS = 10;
  const currentIps = BASE_IPS * Math.pow(1.5, cpuLevel);
  const t = useTheme();

  const functionDetails = stats.functionDetails || {};
  const loopDetails = stats.loopDetails || {};
  const totalTime = stats.totalTime || 0;

  const totalLoopTime = Object.values(loopDetails).reduce((sum, d) => sum + d.totalTime, 0);

  // Sort by total time descending
  const sortedFunctions = Object.entries(functionDetails).sort((a, b) => b[1].totalTime - a[1].totalTime);
  const sortedLoops = Object.entries(loopDetails).sort((a, b) => b[1].totalTime - a[1].totalTime);

  const clickable = (lineNumber) => ({
    cursor: "pointer",
    textDecoration: "underline",
    textDecorationStyle: "dotted",
    textUnderlineOffset: "2px",
    onClick: () => onScrollToLine?.(lineNumber),
  });

  const pctVal = (ms) => totalTime > 0 ? (ms / totalTime) * 100 : 0;
  const pct = (ms) => pctVal(ms).toFixed(1);
  const loopPct = (ms) => totalLoopTime > 0 ? ((ms / totalLoopTime) * 100).toFixed(1) : "0.0";

  return (
    <div style={{
      padding: "12px",
      fontFamily: t.font,
      color: t.primary,
      height: "100%",
      overflowY: "auto",
      boxSizing: "border-box",
    }}>
      <div style={{ color: t.primaryDim, fontSize: "11px", marginBottom: "12px", letterSpacing: "2px" }}>
        [ PROFILER ]
      </div>

      {/* CPU Info */}
      <div style={{ marginBottom: "12px", paddingBottom: "8px", borderBottom: `1px solid ${t.border}` }}>
        <div style={{ fontSize: "10px", color: t.primaryDark, marginBottom: "4px" }}>CPU</div>
        <div style={{ fontSize: "12px" }}>
          Level {cpuLevel} <span style={{ color: t.primaryDim }}>— {currentIps.toFixed(1)} IPS</span>
        </div>
      </div>

      {/* Total Time */}
      <div style={{ marginBottom: "12px", paddingBottom: "8px", borderBottom: `1px solid ${t.border}` }}>
        <div style={{ fontSize: "10px", color: t.primaryDark, marginBottom: "4px" }}>TOTAL TIME</div>
        <div style={{ fontSize: "14px", fontWeight: "bold" }}>
          {totalTime.toFixed(1)} ms
        </div>
      </div>

      {/* Status */}
      <div style={{ marginBottom: "12px", paddingBottom: "8px", borderBottom: `1px solid ${t.border}` }}>
        <div style={{ fontSize: "10px", color: t.primaryDark, marginBottom: "4px" }}>STATUS</div>
        <div style={{ fontSize: "12px", color: stats.isRunning ? t.primary : t.primaryDark }}>
          {stats.isRunning ? "EXECUTING..." : "IDLE"}
          {stats.isRunning && <span style={{ animation: "blink-cursor 1s infinite" }}> _</span>}
        </div>
      </div>

      {/* Function Details */}
      {sortedFunctions.length > 0 && (
        <div style={{ marginBottom: "12px", paddingBottom: "8px", borderBottom: `1px solid ${t.border}` }}>
          <div style={{ fontSize: "10px", color: t.primaryDark, marginBottom: "8px" }}>FUNCTION CALLS</div>
          {sortedFunctions.map(([key, detail]) => {
            const avgTime = detail.calls > 0 ? detail.totalTime / detail.calls : 0;
            const p = pctVal(detail.totalTime);
            const heat = heatColor(p);
            const { cursor, textDecoration, textDecorationStyle, textUnderlineOffset, onClick } = clickable(detail.lineNumber);
            return (
              <div key={key} style={{
                marginBottom: "8px", padding: "6px",
                backgroundColor: t.bg2 || t.bg3,
                borderLeft: `3px solid ${heat}`,
                borderTop: `1px solid ${t.border}`,
                borderRight: `1px solid ${t.border}`,
                borderBottom: `1px solid ${t.border}`,
                position: "relative",
                overflow: "hidden",
              }}>
                {/* Heat bar background */}
                <div style={{
                  position: "absolute", top: 0, left: 0, bottom: 0,
                  width: `${p}%`, backgroundColor: heat, opacity: 0.07,
                  transition: "width 0.3s ease",
                }} />

                {/* Function name + line — clickable */}
                <div
                  style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3px", cursor, textDecoration, textDecorationStyle, textUnderlineOffset }}
                  onClick={onClick}
                  title={`Jump to line ${detail.lineNumber}`}
                >
                  <span style={{ fontSize: "11px", fontWeight: "bold", color: heat }}>
                    {detail.functionName}()
                  </span>
                  <span style={{ fontSize: "9px", color: t.primaryDark }}>
                    line {detail.lineNumber}
                  </span>
                </div>

                {/* Code line reference */}
                <div style={{
                  position: "relative",
                  fontSize: "9px", color: t.primaryDark, marginBottom: "4px",
                  fontFamily: "'Fira Code', 'Cascadia Code', 'Consolas', monospace",
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  cursor, textDecoration, textDecorationStyle, textUnderlineOffset,
                }} onClick={onClick} title={detail.codeLine}>
                  {detail.codeLine}
                </div>

                {/* Stats row */}
                <div style={{ position: "relative", display: "flex", gap: "8px", fontSize: "10px", flexWrap: "wrap" }}>
                  <span style={{ color: t.primaryDim }}>
                    {detail.calls}x
                  </span>
                  <span style={{ color: heat, fontWeight: "bold" }}>
                    {detail.totalTime.toFixed(1)}ms
                  </span>
                  <span style={{ color: heat }}>
                    {pct(detail.totalTime)}%
                  </span>
                  <span style={{ color: t.primaryDim }}>
                    avg {avgTime.toFixed(1)}ms
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Loop Details */}
      {sortedLoops.length > 0 && (
        <div>
          <div style={{ fontSize: "10px", color: t.primaryDark, marginBottom: "8px" }}>LOOP TIMING</div>
          {sortedLoops.map(([key, detail]) => {
            const avgTime = detail.iterations > 0 ? detail.totalTime / detail.iterations : 0;
            const p = pctVal(detail.totalTime);
            const heat = heatColor(p);
            const { cursor, textDecoration, textDecorationStyle, textUnderlineOffset, onClick } = clickable(detail.lineNumber);
            return (
              <div key={key} style={{
                marginBottom: "8px", padding: "6px",
                backgroundColor: t.bg2 || t.bg3,
                borderLeft: `3px solid ${heat}`,
                borderTop: `1px solid ${t.border}`,
                borderRight: `1px solid ${t.border}`,
                borderBottom: `1px solid ${t.border}`,
                position: "relative",
                overflow: "hidden",
              }}>
                {/* Heat bar background */}
                <div style={{
                  position: "absolute", top: 0, left: 0, bottom: 0,
                  width: `${p}%`, backgroundColor: heat, opacity: 0.07,
                  transition: "width 0.3s ease",
                }} />

                {/* Loop header — clickable */}
                <div
                  style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3px", cursor, textDecoration, textDecorationStyle, textUnderlineOffset }}
                  onClick={onClick}
                  title={`Jump to line ${detail.lineNumber}`}
                >
                  <span style={{
                    fontSize: "10px", fontWeight: "bold", color: heat,
                    fontFamily: "'Fira Code', 'Cascadia Code', 'Consolas', monospace",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    maxWidth: "70%",
                  }}>
                    {detail.codeLine}
                  </span>
                  <span style={{ fontSize: "9px", color: t.primaryDark, flexShrink: 0 }}>
                    line {detail.lineNumber}
                  </span>
                </div>

                {/* Loop stats */}
                <div style={{ position: "relative", display: "flex", gap: "8px", fontSize: "10px", flexWrap: "wrap" }}>
                  <span style={{ color: t.primaryDim }}>
                    {detail.iterations} iters
                  </span>
                  <span style={{ color: heat, fontWeight: "bold" }}>
                    {detail.totalTime.toFixed(1)}ms
                  </span>
                  <span style={{ color: heat }}>
                    {pct(detail.totalTime)}% total
                  </span>
                  <span style={{ color: t.primaryDark }}>
                    {loopPct(detail.totalTime)}% loops
                  </span>
                  <span style={{ color: t.primaryDim }}>
                    avg {avgTime.toFixed(1)}ms/iter
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
