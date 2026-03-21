import React, { useState, useEffect } from "react";
import { useGameStore } from "../store/gameStore";
import { useTheme } from "../themes";

export function DbExplorerPanel() {
  const t = useTheme();
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const { kvStore, tech } = useGameStore.getState();

  const entries = Object.entries(kvStore);
  let used = 0;
  for (const [k, v] of entries) used += k.length + v.length;
  const capacity = tech.hddTier4Unlocked ? 65536 : tech.hddTier3Unlocked ? 16384 : tech.hddTier2Unlocked ? 4096 : 1024;
  const usagePercent = capacity > 0 ? Math.min(100, (used / capacity) * 100) : 0;

  return (
    <div style={{
      padding: "12px",
      fontFamily: t.font,
      fontSize: "11px",
      color: t.primaryDim,
      height: "100%",
      boxSizing: "border-box",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{ color: t.primaryDark, fontSize: "10px", letterSpacing: "2px", marginBottom: "8px", flexShrink: 0 }}>
        [ HARD DRIVE ]
      </div>

      {/* Usage bar */}
      <div style={{ marginBottom: "10px", flexShrink: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
          <span>{used} / {capacity} bytes</span>
          <span>{entries.length} key{entries.length !== 1 ? "s" : ""}</span>
        </div>
        <div style={{ height: "6px", backgroundColor: t.bg3, border: `1px solid ${t.border}` }}>
          <div style={{
            height: "100%",
            width: `${usagePercent}%`,
            backgroundColor: usagePercent > 90 ? t.red : usagePercent > 70 ? t.yellow : t.accent,
            transition: "width 0.3s",
          }} />
        </div>
      </div>

      {/* Entries */}
      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
        {entries.length === 0 ? (
          <div style={{ color: t.border, fontStyle: "italic", padding: "8px 0" }}>
            Drive empty. Use dbSet(key, value) to store data.
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                <th style={{ textAlign: "left", padding: "4px 6px", color: t.primaryDark, fontSize: "10px", letterSpacing: "1px" }}>KEY</th>
                <th style={{ textAlign: "left", padding: "4px 6px", color: t.primaryDark, fontSize: "10px", letterSpacing: "1px" }}>VALUE</th>
                <th style={{ textAlign: "right", padding: "4px 6px", color: t.primaryDark, fontSize: "10px", letterSpacing: "1px", whiteSpace: "nowrap" }}>B</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(([key, value]) => (
                <tr key={key} style={{ borderBottom: `1px solid ${t.bg3}` }}>
                  <td style={{ padding: "3px 6px", color: t.accent, wordBreak: "break-all", maxWidth: "120px" }}>{key}</td>
                  <td style={{ padding: "3px 6px", color: t.primaryDim, wordBreak: "break-all" }}>
                    {value.length > 64 ? value.slice(0, 64) + "..." : value}
                  </td>
                  <td style={{ padding: "3px 6px", color: t.primaryDark, textAlign: "right", whiteSpace: "nowrap" }}>
                    {key.length + value.length}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
