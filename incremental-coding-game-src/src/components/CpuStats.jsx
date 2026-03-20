import React from "react";
import { useGameStore } from "../gameStore.js";
import { useTheme } from "../themes.js";

export function CpuStats({ stats }) {
  const cpuLevel = useGameStore((s) => s.cpuLevel);
  const BASE_IPS = 10;
  const currentIps = BASE_IPS * Math.pow(1.5, cpuLevel);
  const t = useTheme();

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
          {stats.totalTime.toFixed(1)} ms
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

      {/* Function Times */}
      {Object.keys(stats.functionTimes).length > 0 && (
        <div>
          <div style={{ fontSize: "10px", color: t.primaryDark, marginBottom: "8px" }}>FUNCTION CALLS</div>
          {Object.entries(stats.functionTimes).map(([name, time]) => (
            <div key={name} style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "4px" }}>
              <span style={{ color: t.primaryDim }}>{name}</span>
              <span style={{ color: t.primary }}>{time.toFixed(1)}ms</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
