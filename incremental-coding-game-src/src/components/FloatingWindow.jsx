/**
 * FloatingWindow Component
 *
 * A draggable, resizable window that can contain any content.
 * Supports Run/Stop buttons, close button, and focus management.
 * Used to display code editors, log panels, etc.
 */

import React, { useState, useEffect, useRef } from "react";

export function FloatingWindow({
  title,
  initialX = 100,
  initialY = 100,
  initialWidth = 600,
  initialHeight = 400,
  children,
  onClose,
  onRun,
  onStop,
  isRunning = false,
  canRun = true,
  isActive = false,
  onFocus,
}) {
  const [position, setPosition] = useState({ x: initialX, y: initialY });
  const [size, setSize] = useState({ width: initialWidth, height: initialHeight });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const windowRef = useRef(null);

  useEffect(() => {
    if (isActive && onFocus) onFocus();
  }, [isActive, onFocus]);

  // ── Drag handling ──
  const handleDragStart = (event) => {
    if (
      event.target === event.currentTarget ||
      event.target.classList.contains("window-title")
    ) {
      setIsDragging(true);
      setDragOffset({
        x: event.clientX - position.x,
        y: event.clientY - position.y,
      });
      if (onFocus) onFocus();
    }
  };

  // ── Resize handling ──
  const handleResizeStart = (event) => {
    event.stopPropagation();
    setIsResizing(true);
    setDragOffset({
      x: event.clientX - size.width,
      y: event.clientY - size.height,
    });
  };

  useEffect(() => {
    const handleMouseMove = (event) => {
      if (isDragging) {
        setPosition({
          x: event.clientX - dragOffset.x,
          y: event.clientY - dragOffset.y,
        });
      } else if (isResizing) {
        setSize({
          width: Math.max(300, event.clientX - dragOffset.x),
          height: Math.max(200, event.clientY - dragOffset.y),
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, isResizing, dragOffset]);

  return (
    <div
      ref={windowRef}
      className="floating-window"
      style={{
        position: "absolute",
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        backgroundColor: "#1e1e1e",
        border: isActive
          ? isRunning
            ? "2px solid #28a745"
            : "2px solid #4a9eff"
          : "1px solid #3c3c3c",
        borderRadius: "4px",
        display: "flex",
        flexDirection: "column",
        boxShadow: isRunning
          ? "0 4px 12px rgba(40, 167, 69, 0.3)"
          : "0 4px 12px rgba(0, 0, 0, 0.5)",
        zIndex: isActive ? 1000 : 100,
        overflow: "hidden",
      }}
      onMouseDown={handleDragStart}
    >
      {/* Title Bar */}
      <div
        className="window-title"
        style={{
          backgroundColor: "#2d2d2d",
          padding: "8px 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "move",
          userSelect: "none",
          borderBottom: "1px solid #3c3c3c",
        }}
      >
        <span style={{ color: "#cccccc", fontSize: "13px", fontWeight: 500 }}>
          {title}
        </span>

        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {/* Stop button (shown while running) */}
          {isRunning && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStop?.();
              }}
              style={{
                padding: "4px 12px",
                fontSize: "12px",
                backgroundColor: "#dc3545",
                color: "white",
                border: "none",
                borderRadius: "3px",
                cursor: "pointer",
              }}
            >
              Stop
            </button>
          )}

          {/* Run button (shown when can run and not running) */}
          {canRun && !isRunning && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRun?.();
              }}
              style={{
                padding: "4px 12px",
                fontSize: "12px",
                backgroundColor: "#28a745",
                color: "white",
                border: "none",
                borderRadius: "3px",
                cursor: "pointer",
              }}
            >
              Run
            </button>
          )}

          {/* Close button */}
          {onClose && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              style={{
                padding: "2px 8px",
                fontSize: "16px",
                backgroundColor: "transparent",
                color: "#cccccc",
                border: "none",
                cursor: "pointer",
                lineHeight: "1",
              }}
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
        {children}
      </div>

      {/* Resize Handle (bottom-right corner) */}
      <div
        onMouseDown={handleResizeStart}
        style={{
          position: "absolute",
          bottom: 0,
          right: 0,
          width: "20px",
          height: "20px",
          cursor: "nwse-resize",
          background:
            "linear-gradient(135deg, transparent 0%, transparent 40%, #555 40%, #555 60%, transparent 60%)",
        }}
      />
    </div>
  );
}
