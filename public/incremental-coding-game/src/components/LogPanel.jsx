/**
 * LogPanel Component
 *
 * Displays timestamped log messages with color coding:
 * - Normal logs: white/gray
 * - Warnings: yellow
 * - Errors: red
 * - Unlock messages: green
 *
 * Auto-scrolls to the latest message.
 */

import React, { useEffect, useRef } from "react";

export function LogPanel({ logs }) {
  const bottomRef = useRef(null);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const getLogColor = (type) => {
    switch (type) {
      case "error":
        return "#dc3545";
      case "warning":
        return "#ffc107";
      case "unlock":
        return "#28a745";
      default:
        return "#d4d4d4";
    }
  };

  return (
    <div
      style={{
        padding: "1rem",
        fontFamily: "monospace",
        fontSize: "0.9em",
        backgroundColor: "#1e1e1e",
        color: "#d4d4d4",
        height: "100%",
        overflowY: "auto",
        overflowX: "hidden",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}
      >
        {logs.length === 0 ? (
          <div style={{ color: "#999", fontStyle: "italic" }}>
            No logs yet...
          </div>
        ) : (
          logs.map((log, index) => (
            <div key={index} style={{ color: getLogColor(log.type) }}>
              [{new Date(log.timestamp).toLocaleTimeString()}] {log.message}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
