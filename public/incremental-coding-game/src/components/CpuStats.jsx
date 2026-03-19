/**
 * CpuStats Component
 *
 * Fixed overlay showing execution timing stats:
 * - Total execution time
 * - Per-function timing breakdown
 * - Expandable for future detailed profiling
 */

import React, { useState } from "react";

export function CpuStats({ stats }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      style={{
        position: "fixed",
        right: "16px",
        top: "56px",
        width: "280px",
        backgroundColor: "rgba(30, 30, 30, 0.95)",
        border: "1px solid #3c3c3c",
        borderRadius: "4px",
        padding: "16px",
        zIndex: 9999,
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.5)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px",
        }}
      >
        <h3 style={{ margin: 0, color: "#cccccc", fontSize: "14px", fontWeight: 600 }}>
          CPU
        </h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            padding: "4px 8px",
            fontSize: "11px",
            backgroundColor: "transparent",
            color: "#888",
            border: "1px solid #3c3c3c",
            borderRadius: "3px",
            cursor: "pointer",
          }}
        >
          {isExpanded ? "Collapse" : "Expand"}
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {/* Total Time */}
        <div>
          <div style={{ color: "#888", fontSize: "11px", marginBottom: "4px" }}>
            Total Time
          </div>
          <div style={{ color: "#cccccc", fontSize: "13px", fontFamily: "monospace" }}>
            {stats.totalTime.toFixed(2)} ms
          </div>
        </div>

        {/* Per-Function Times */}
        {Object.keys(stats.functionTimes).length > 0 && (
          <div>
            <div style={{ color: "#888", fontSize: "11px", marginBottom: "4px" }}>
              Function Times
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {Object.entries(stats.functionTimes).map(([name, time]) => (
                <div
                  key={name}
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <span style={{ color: "#cccccc", fontSize: "12px" }}>
                    {name}:
                  </span>
                  <span
                    style={{ color: "#888", fontSize: "12px", fontFamily: "monospace" }}
                  >
                    {time.toFixed(2)} ms
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Expanded Section */}
        {isExpanded && (
          <div
            style={{
              marginTop: "8px",
              paddingTop: "8px",
              borderTop: "1px solid #3c3c3c",
            }}
          >
            <div style={{ color: "#888", fontSize: "11px" }}>
              Detailed profiling coming soon...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
