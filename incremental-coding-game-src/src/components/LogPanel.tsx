import React, { useEffect, useRef } from "react";
import { useTheme } from "../themes";
import { trackRender } from "../utils/perfMonitor";

interface LogEntry {
  type: string;
  message: string;
  timestamp: number;
}

interface LogPanelProps {
  logs: LogEntry[];
}

export const LogPanel = React.memo(function LogPanel({ logs }: LogPanelProps) {
  trackRender("LogPanel")();
  const bottomRef = useRef<HTMLDivElement>(null);
  const t = useTheme();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const getLogColor = (type: string): string => {
    switch (type) {
      case "error": return t.red;
      case "warning": return t.yellow;
      case "unlock": return t.primary;
      default: return t.primaryDim;
    }
  };

  return (
    <div style={{
      padding: "8px 12px",
      fontFamily: t.font,
      fontSize: "11px",
      backgroundColor: t.bg,
      color: t.primaryDim,
      height: "100%",
      overflowY: "auto",
      overflowX: "hidden",
      boxSizing: "border-box",
      borderTop: `1px solid ${t.border}`,
    }}>
      <div style={{ color: t.primaryDark, fontSize: "10px", marginBottom: "6px", letterSpacing: "2px" }}>
        &gt; OUTPUT
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
        {logs.length === 0 ? (
          <div style={{ color: t.border, fontStyle: "italic" }}>
            Awaiting execution...
          </div>
        ) : (
          logs.map((log, i) => (
            <div key={i} style={{ color: getLogColor(log.type) }}>
              <span style={{ color: t.border }}>
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
});
