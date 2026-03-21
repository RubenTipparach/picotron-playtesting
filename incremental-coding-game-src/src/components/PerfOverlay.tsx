import React, { useState, useEffect } from "react";
import { getPerfData, resetPerf } from "../utils/perfMonitor";

export function PerfOverlay() {
  const [data, setData] = useState(getPerfData());

  useEffect(() => {
    const id = setInterval(() => setData(getPerfData()), 500);
    return () => clearInterval(id);
  }, []);

  const sorted = Object.entries(data).sort((a, b) => b[1].updatesPerSec - a[1].updatesPerSec);

  return (
    <div style={{
      position: "fixed", bottom: 10, left: 10, zIndex: 99999,
      backgroundColor: "rgba(0,0,0,0.9)", border: "1px solid #444",
      padding: "8px 12px", fontFamily: "monospace", fontSize: "11px",
      color: "#0f0", maxHeight: "300px", overflowY: "auto", minWidth: "380px",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
        <span style={{ color: "#fff", fontWeight: "bold" }}>PERF MONITOR (F3)</span>
        <span onClick={resetPerf} style={{ color: "#f55", cursor: "pointer" }}>[RESET]</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "140px 55px 60px 55px 55px", gap: "2px 8px", fontSize: "10px" }}>
        <span style={{ color: "#888" }}>NAME</span>
        <span style={{ color: "#888" }}>CNT</span>
        <span style={{ color: "#888" }}>UPD/s</span>
        <span style={{ color: "#888" }}>LAST</span>
        <span style={{ color: "#888" }}>AVG</span>
        {sorted.map(([name, e]) => {
          const avg = e.renders > 0 ? e.totalRenderMs / e.renders : 0;
          const hot = e.updatesPerSec > 10;
          const warm = e.updatesPerSec > 4;
          const color = hot ? "#f55" : warm ? "#ff5" : "#0f0";
          return (
            <React.Fragment key={name}>
              <span style={{ color, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</span>
              <span style={{ color }}>{e.renders}</span>
              <span style={{ color, fontWeight: hot ? "bold" : "normal" }}>{e.updatesPerSec.toFixed(1)}</span>
              <span style={{ color }}>{e.lastRenderMs.toFixed(1)}ms</span>
              <span style={{ color }}>{avg.toFixed(1)}ms</span>
            </React.Fragment>
          );
        })}
      </div>
      {sorted.length === 0 && <div style={{ color: "#888" }}>No data yet...</div>}
    </div>
  );
}
