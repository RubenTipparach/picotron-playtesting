import React, { useEffect, useRef } from "react";

export function LogPanel({ logs }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const getLogColor = (type) => {
    switch (type) {
      case "error": return "#ff0040";
      case "warning": return "#ccff00";
      case "unlock": return "#00ff41";
      default: return "#00cc33";
    }
  };

  return (
    <div style={{
      padding: "8px 12px",
      fontFamily: "var(--hk-font)",
      fontSize: "11px",
      backgroundColor: "#0a0a0a",
      color: "#00cc33",
      height: "100%",
      overflowY: "auto",
      overflowX: "hidden",
      boxSizing: "border-box",
      borderTop: "1px solid #003300",
    }}>
      <div style={{ color: "#004400", fontSize: "10px", marginBottom: "6px", letterSpacing: "2px" }}>
        &gt; OUTPUT
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
        {logs.length === 0 ? (
          <div style={{ color: "#003300", fontStyle: "italic" }}>
            Awaiting execution...
          </div>
        ) : (
          logs.map((log, i) => (
            <div key={i} style={{ color: getLogColor(log.type) }}>
              <span style={{ color: "#003300" }}>
                [{new Date(log.timestamp).toLocaleTimeString()}]
              </span>{" "}
              {log.message}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
