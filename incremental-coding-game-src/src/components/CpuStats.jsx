import React from "react";
import { useGameStore } from "../gameStore.js";

export function CpuStats({ stats }) {
  const cpuLevel = useGameStore((s) => s.cpuLevel);
  const speedBoost = Math.round((1 - Math.pow(0.9, cpuLevel)) * 100);

  return (
    <div style={{
      padding: "12px",
      fontFamily: "var(--hk-font)",
      color: "#00ff41",
      height: "100%",
      overflowY: "auto",
      boxSizing: "border-box",
    }}>
      <div style={{ color: "#00cc33", fontSize: "11px", marginBottom: "12px", letterSpacing: "2px" }}>
        [ PROFILER ]
      </div>

      {/* CPU Info */}
      <div style={{ marginBottom: "12px", paddingBottom: "8px", borderBottom: "1px solid #003300" }}>
        <div style={{ fontSize: "10px", color: "#004400", marginBottom: "4px" }}>CPU</div>
        <div style={{ fontSize: "12px" }}>
          Level {cpuLevel}{speedBoost > 0 && <span style={{ color: "#00cc33" }}> (+{speedBoost}%)</span>}
        </div>
      </div>

      {/* Total Time */}
      <div style={{ marginBottom: "12px", paddingBottom: "8px", borderBottom: "1px solid #003300" }}>
        <div style={{ fontSize: "10px", color: "#004400", marginBottom: "4px" }}>TOTAL TIME</div>
        <div style={{ fontSize: "14px", fontWeight: "bold" }}>
          {stats.totalTime.toFixed(1)} ms
        </div>
      </div>

      {/* Status */}
      <div style={{ marginBottom: "12px", paddingBottom: "8px", borderBottom: "1px solid #003300" }}>
        <div style={{ fontSize: "10px", color: "#004400", marginBottom: "4px" }}>STATUS</div>
        <div style={{ fontSize: "12px", color: stats.isRunning ? "#00ff41" : "#004400" }}>
          {stats.isRunning ? "EXECUTING..." : "IDLE"}
          {stats.isRunning && <span style={{ animation: "blink-cursor 1s infinite" }}> _</span>}
        </div>
      </div>

      {/* Function Times */}
      {Object.keys(stats.functionTimes).length > 0 && (
        <div>
          <div style={{ fontSize: "10px", color: "#004400", marginBottom: "8px" }}>FUNCTION CALLS</div>
          {Object.entries(stats.functionTimes).map(([name, time]) => (
            <div key={name} style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "4px" }}>
              <span style={{ color: "#00cc33" }}>{name}</span>
              <span style={{ color: "#00ff41" }}>{time.toFixed(1)}ms</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
