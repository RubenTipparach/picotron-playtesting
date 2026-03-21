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
  onClear?: () => void;
}

export const LogPanel = React.memo(function LogPanel({ logs, onClear }: LogPanelProps) {
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
      fontFamily: t.font,
      fontSize: "11px",
      backgroundColor: t.bg,
      color: t.primaryDim,
      height: "100%",
      display: "flex",
      flexDirection: "column",
      boxSizing: "border-box",
      borderTop: `1px solid ${t.border}`,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px 6px", flexShrink: 0 }}>
        <span style={{ color: t.primaryDark, fontSize: "10px", letterSpacing: "2px" }}>&gt; OUTPUT</span>
        {onClear && (
          <button onClick={onClear} style={{
            padding: "1px 6px", fontSize: "9px", fontFamily: t.font,
            backgroundColor: t.bg3, color: t.primaryDim,
            border: `1px solid ${t.border}`, cursor: "pointer",
          }}>CLEAR</button>
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "2px", padding: "0 12px 8px", overflowY: "auto", overflowX: "hidden", flex: 1 }}>
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
