import React from "react";

export function HintModal({ hint, onDismiss, onHintClick }) {
  return (
    <div
      style={{
        position: "fixed", inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        zIndex: 10000,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
      onClick={onDismiss}
    >
      <div
        style={{
          backgroundColor: "#0a0a0a",
          border: "1px solid #00ff41",
          padding: "24px",
          width: "90%", maxWidth: "460px",
          boxShadow: "0 0 30px rgba(0, 255, 65, 0.2)",
          fontFamily: "var(--hk-font)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ color: "#00ff41", fontSize: "12px", fontWeight: 600, marginBottom: "12px", letterSpacing: "2px" }}>
          [ SYSTEM MESSAGE ]
        </div>
        <div style={{ color: "#00cc33", fontSize: "13px", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>
          {hint.message}
        </div>
        {hint.codeExample && (
          <div style={{
            marginTop: "12px", padding: "10px",
            backgroundColor: "#001a00", border: "1px solid #003300",
            fontFamily: "var(--hk-font)", fontSize: "12px", color: "#00ff41",
            whiteSpace: "pre",
          }}>
            {hint.codeExample}
          </div>
        )}
        {hint.lineNumber && (
          <div
            style={{ color: "#004400", fontSize: "11px", marginTop: "10px", cursor: "pointer", textDecoration: "underline" }}
            onClick={() => { onHintClick?.(hint); onDismiss(); }}
          >
            Jump to line {hint.lineNumber}
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px" }}>
          <button
            onClick={onDismiss}
            style={{
              padding: "6px 16px", fontSize: "11px",
              fontFamily: "var(--hk-font)",
              backgroundColor: "#001a00", color: "#00ff41",
              border: "1px solid #00ff41", cursor: "pointer",
              letterSpacing: "1px",
            }}
          >
            [OK]
          </button>
        </div>
      </div>
    </div>
  );
}

export function HintPanel({ activeHints, dismissedHints, onReopenHint, inline }) {
  const hasHints = [...activeHints, ...dismissedHints].length > 0;

  const containerStyle = inline
    ? { padding: "12px", fontFamily: "var(--hk-font)", color: "#00ff41", height: "100%", overflowY: "auto", boxSizing: "border-box" }
    : { position: "fixed", right: "16px", bottom: "16px", width: "280px", maxHeight: "300px", backgroundColor: "#0a0a0a", border: "1px solid #003300", zIndex: 9999, fontFamily: "var(--hk-font)" };

  return (
    <div style={containerStyle}>
      <div style={{ color: "#00cc33", fontSize: "11px", marginBottom: "12px", letterSpacing: "2px" }}>
        [ HINTS ]
      </div>
      {hasHints ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {activeHints.map((hint) => (
            <div key={hint.id} style={{ padding: "8px", backgroundColor: "#001a00", border: "1px solid #003300", fontSize: "11px" }}>
              <span style={{ color: "#00ff41" }}>{hint.title || "Active"}</span>
            </div>
          ))}
          {dismissedHints.map((hint) => (
            <div
              key={hint.id}
              onClick={() => onReopenHint?.(hint)}
              style={{ padding: "8px", border: "1px solid #003300", fontSize: "11px", cursor: "pointer", color: "#004400" }}
            >
              {hint.title || hint.message?.substring(0, 40) + "..."}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ color: "#003300", fontSize: "11px" }}>No hints available</div>
      )}
    </div>
  );
}
