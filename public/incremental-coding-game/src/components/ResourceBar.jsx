/**
 * ResourceBar Component
 *
 * Fixed top bar showing current resource counts (A, B, C)
 * and virtual time elapsed. Resources are color-coded and
 * only shown after being unlocked.
 */

import React from "react";
import { useGameStore } from "../gameStore.js";

export function ResourceBar() {
  const resources = useGameStore((state) => state.resources);
  const tech = useGameStore((state) => state.tech);
  const virtualTime = useGameStore((state) => state.virtualTime);

  /** Format virtual time as H:MM:SS.ss */
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = (seconds % 60).toFixed(2);
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.padStart(5, "0")}`;
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: "40px",
        backgroundColor: "#1e1e1e",
        borderBottom: "1px solid #3c3c3c",
        display: "flex",
        alignItems: "center",
        padding: "0 16px",
        zIndex: 10000,
        justifyContent: "space-between",
      }}
    >
      {/* Resource Counts */}
      <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {/* Resource A - always visible */}
          <ResourceCounter color="#4a9eff" label="A" count={resources.A} />

          {/* Resource B - visible after conversion unlock */}
          {tech.convertAToBUnlocked && (
            <ResourceCounter color="#9d4edd" label="B" count={resources.B} />
          )}

          {/* Resource C - visible after resource C unlock */}
          {tech.resourceCUnlocked && (
            <ResourceCounter color="#ff6b35" label="C" count={resources.C} />
          )}
        </div>
      </div>

      {/* Virtual Time */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <span style={{ color: "#888", fontSize: "12px" }}>Virtual Time:</span>
        <span
          style={{
            color: "#cccccc",
            fontSize: "14px",
            fontFamily: "monospace",
          }}
        >
          {formatTime(virtualTime)}
        </span>
      </div>
    </div>
  );
}

/** Small colored square + count for a single resource */
function ResourceCounter({ color, label, count }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
      <div
        style={{
          width: "16px",
          height: "16px",
          backgroundColor: color,
          borderRadius: "2px",
        }}
      />
      <span
        style={{
          color: "#cccccc",
          fontSize: "14px",
          fontFamily: "monospace",
        }}
      >
        {label}: {count}
      </span>
    </div>
  );
}
