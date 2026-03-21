import React from "react";
import { useTheme } from "../themes";

export interface Hint {
  id: string;
  message: string;
  title?: string;
  codeExample?: string;
  lineNumber?: number;
}

interface HintPopoverProps {
  hint: Hint;
  onDismiss: () => void;
  onHintClick?: (hint: Hint) => void;
}

export function HintPopover({ hint, onDismiss, onHintClick }: HintPopoverProps) {
  const t = useTheme();
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
          backgroundColor: t.bg,
          border: `1px solid ${t.borderBright}`,
          padding: "24px",
          width: "90%", maxWidth: "460px",
          boxShadow: `0 0 30px ${t.primary}33`,
          fontFamily: t.font,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ color: t.primary, fontSize: "12px", fontWeight: 600, marginBottom: "12px", letterSpacing: "2px" }}>
          [ SYSTEM MESSAGE ]
        </div>
        <div style={{ color: t.primaryDim, fontSize: "13px", lineHeight: "1.6", whiteSpace: "pre-wrap" }}>
          {hint.message}
        </div>
        {hint.codeExample && (
          <div style={{
            marginTop: "12px", padding: "10px",
            backgroundColor: t.bg3, border: `1px solid ${t.border}`,
            fontFamily: t.font, fontSize: "12px", color: t.primary,
            whiteSpace: "pre",
          }}>
            {hint.codeExample}
          </div>
        )}
        {hint.lineNumber && (
          <div
            style={{ color: t.primaryDark, fontSize: "11px", marginTop: "10px", cursor: "pointer", textDecoration: "underline" }}
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
              fontFamily: t.font,
              backgroundColor: t.bg3, color: t.primary,
              border: `1px solid ${t.borderBright}`, cursor: "pointer",
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

interface HintsPanelProps {
  activeHints: Hint[];
  dismissedHints: Hint[];
  onReopenHint?: (hint: Hint) => void;
  inline?: boolean;
}

export function HintsPanel({ activeHints, dismissedHints, onReopenHint, inline }: HintsPanelProps) {
  const t = useTheme();
  const hasHints = [...activeHints, ...dismissedHints].length > 0;

  const containerStyle: React.CSSProperties = inline
    ? { padding: "12px", fontFamily: t.font, color: t.primary, height: "100%", overflowY: "auto", boxSizing: "border-box" }
    : { position: "fixed", right: "16px", bottom: "16px", width: "280px", maxHeight: "300px", backgroundColor: t.bg, border: `1px solid ${t.border}`, zIndex: 9999, fontFamily: t.font };

  return (
    <div style={containerStyle}>
      <div style={{ color: t.primaryDim, fontSize: "11px", marginBottom: "12px", letterSpacing: "2px" }}>
        [ HINTS ]
      </div>
      {hasHints ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {activeHints.map((hint) => (
            <div key={hint.id} style={{ padding: "8px", backgroundColor: t.bg3, border: `1px solid ${t.border}`, fontSize: "11px" }}>
              <span style={{ color: t.primary }}>{hint.title || "Active"}</span>
            </div>
          ))}
          {dismissedHints.map((hint) => (
            <div
              key={hint.id}
              onClick={() => onReopenHint?.(hint)}
              style={{ padding: "8px", border: `1px solid ${t.border}`, fontSize: "11px", cursor: "pointer", color: t.primaryDark }}
            >
              {hint.title || hint.message?.substring(0, 40) + "..."}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ color: t.border, fontSize: "11px" }}>No hints available</div>
      )}
    </div>
  );
}
