/**
 * Hint / Tutorial Components
 *
 * HintModal: Full-screen modal showing a tutorial hint with optional code example
 * HintPanel: Small fixed panel listing active and dismissed hints
 */

import React, { useState } from "react";

/**
 * Full-screen modal for displaying a tutorial hint.
 * Shows the hint message, optional code example, and line number link.
 */
export function HintModal({ hint, onDismiss, onHintClick }) {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        zIndex: 10000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={onDismiss}
    >
      <div
        style={{
          backgroundColor: "rgba(30, 30, 30, 0.98)",
          border: "2px solid #4a9eff",
          borderRadius: "8px",
          padding: "24px",
          width: "90%",
          maxWidth: "500px",
          boxShadow:
            "0 8px 24px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(74, 158, 255, 0.3)",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "16px",
          }}
        >
          <div style={{ flex: 1 }}>
            {/* Title */}
            <div
              style={{
                color: "#4a9eff",
                fontSize: "14px",
                fontWeight: 600,
                marginBottom: "12px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Tutorial
            </div>

            {/* Message */}
            <div
              style={{
                color: "#e0e0e0",
                fontSize: "14px",
                lineHeight: "1.6",
                whiteSpace: "pre-wrap",
              }}
            >
              {hint.message}
            </div>

            {/* Code Example */}
            {hint.codeExample && (
              <div
                style={{
                  marginTop: "16px",
                  padding: "12px",
                  backgroundColor: "rgba(0, 0, 0, 0.3)",
                  borderRadius: "4px",
                  border: "1px solid rgba(74, 158, 255, 0.2)",
                  fontFamily: "monospace",
                  fontSize: "13px",
                  color: "#4a9eff",
                  overflowX: "auto",
                  whiteSpace: "pre",
                }}
              >
                {hint.codeExample}
              </div>
            )}

            {/* Line Number Link */}
            {hint.lineNumber && (
              <div
                style={{
                  color: "#888",
                  fontSize: "12px",
                  marginTop: "12px",
                  cursor: onHintClick ? "pointer" : "default",
                  textDecoration: onHintClick ? "underline" : "none",
                }}
                onClick={() => {
                  onHintClick?.(hint);
                  onDismiss();
                }}
              >
                Click to jump to line {hint.lineNumber}
              </div>
            )}
          </div>

          {/* Close X */}
          <button
            onClick={onDismiss}
            style={{
              padding: "4px 8px",
              fontSize: "20px",
              backgroundColor: "transparent",
              color: "#888",
              border: "none",
              cursor: "pointer",
              lineHeight: "1",
              flexShrink: 0,
            }}
            title="Dismiss"
          >
            ×
          </button>
        </div>

        {/* Got it button */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "8px",
            marginTop: "8px",
          }}
        >
          <button
            onClick={onDismiss}
            style={{
              padding: "8px 16px",
              fontSize: "13px",
              backgroundColor: "#4a9eff",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Small fixed panel showing active and dismissed hints.
 * Can be collapsed to a single "Hints" button.
 */
export function HintPanel({ activeHints, dismissedHints, onReopenHint }) {
  const [isMinimized, setIsMinimized] = useState(false);
  const hasHints = [...activeHints, ...dismissedHints].length > 0;

  // Minimized state - just a small button
  if (isMinimized && hasHints) {
    return (
      <div style={{ position: "fixed", right: "16px", bottom: "16px", zIndex: 9999 }}>
        <button
          onClick={() => setIsMinimized(false)}
          style={{
            padding: "8px 12px",
            backgroundColor: "#2d2d2d",
            color: "#cccccc",
            border: "1px solid #3c3c3c",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "12px",
          }}
        >
          Hints
        </button>
      </div>
    );
  }

  // Full panel
  return (
    <div
      style={{
        position: "fixed",
        right: "16px",
        bottom: "16px",
        width: "280px",
        maxHeight: "300px",
        backgroundColor: "rgba(30, 30, 30, 0.95)",
        border: "1px solid #3c3c3c",
        borderRadius: "4px",
        zIndex: 9999,
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.5)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "12px",
          borderBottom: "1px solid #3c3c3c",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h3 style={{ margin: 0, color: "#cccccc", fontSize: "14px", fontWeight: 600 }}>
          Hints
        </h3>
        <button
          onClick={() => setIsMinimized(true)}
          style={{
            padding: "4px 8px",
            fontSize: "11px",
            backgroundColor: "transparent",
            color: "#888",
            border: "none",
            cursor: "pointer",
          }}
        >
          −
        </button>
      </div>

      {/* Hint List */}
      <div style={{ overflowY: "auto", maxHeight: "250px" }}>
        {hasHints ? (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {/* Active hints */}
            {activeHints.map((hint) => (
              <div
                key={hint.id}
                style={{
                  padding: "12px",
                  borderBottom: "1px solid #3c3c3c",
                  backgroundColor: "rgba(74, 158, 255, 0.1)",
                }}
              >
                <div style={{ color: "#4a9eff", fontSize: "12px", fontWeight: 600 }}>
                  {hint.title || "New Tutorial"}
                </div>
                <div style={{ color: "#888", fontSize: "11px", marginTop: "4px" }}>
                  Click to view
                </div>
              </div>
            ))}

            {/* Dismissed hints (clickable to reopen) */}
            {dismissedHints.map((hint) => (
              <div
                key={hint.id}
                onClick={() => onReopenHint?.(hint)}
                style={{
                  padding: "12px",
                  borderBottom: "1px solid #3c3c3c",
                  cursor: onReopenHint ? "pointer" : "default",
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (onReopenHint) e.currentTarget.style.backgroundColor = "#2d2d2d";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <div
                  style={{
                    color: "#4a9eff",
                    fontSize: "12px",
                    lineHeight: "1.5",
                    textDecoration: "underline",
                  }}
                >
                  {hint.title || hint.message.substring(0, 50) + "..."}
                </div>
                {hint.lineNumber && (
                  <div style={{ color: "#888", fontSize: "11px", marginTop: "4px" }}>
                    Line {hint.lineNumber}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div
            style={{
              padding: "16px",
              color: "#888",
              fontSize: "12px",
              textAlign: "center",
            }}
          >
            No hints available
          </div>
        )}
      </div>
    </div>
  );
}
