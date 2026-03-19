/**
 * App Component
 *
 * Main application shell that manages:
 * - Floating windows (code editors, log panel)
 * - Code execution lifecycle (run, stop, errors)
 * - Tech tree and docs panel modals
 * - Keyboard shortcuts (F5, Ctrl+U, Ctrl+L, Ctrl+D, Escape)
 * - Tutorial hint system
 * - Window focus/ordering
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useGameStore } from "./gameStore.js";
import { validateCode, getAvailableUpgrades } from "./techTree.js";
import { CodeExecutor } from "./executionEngine.js";
import {
  hasSeenHint,
  markHintSeen,
  resetAllHints,
  getErrorRunAttempts,
  incrementErrorRunAttempts,
  clearErrorRunAttempts,
  hashCode,
} from "./hintSystem.js";

import { ResourceBar } from "./components/ResourceBar.jsx";
import { CpuStats } from "./components/CpuStats.jsx";
import { FloatingWindow } from "./components/FloatingWindow.jsx";
import { CodeEditor } from "./components/CodeEditor.jsx";
import { LogPanel } from "./components/LogPanel.jsx";
import { TechTreePanel } from "./components/TechTreePanel.jsx";
import { DocsPanel } from "./components/DocsPanel.jsx";
import { HintModal, HintPanel } from "./components/HintOverlay.jsx";

const CODE_STORAGE_KEY = "incremental-coding-game-code";

export function App() {
  // ── Window/file state ──
  const [files, setFiles] = useState([
    {
      id: "main",
      filename: "main.js",
      code: localStorage.getItem(CODE_STORAGE_KEY) || "produceResourceA()",
      x: 100,
      y: 60,
      width: 700,
      height: 500,
    },
  ]);
  const [activeWindowId, setActiveWindowId] = useState("main");

  // ── Execution state ──
  const [isRunning, setIsRunning] = useState(false);
  const [runningFileId, setRunningFileId] = useState(null);
  const [executionEvents, setExecutionEvents] = useState([]);
  const [logs, setLogs] = useState([]);
  const [executor, setExecutor] = useState(null);
  const [stats, setStats] = useState({ totalTime: 0, functionTimes: {}, isRunning: false });

  // ── Panel state ──
  const [isTechTreeOpen, setIsTechTreeOpen] = useState(false);
  const [techTreeSelectedId, setTechTreeSelectedId] = useState(undefined);
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [isDocsOpen, setIsDocsOpen] = useState(false);
  const [docsScrollSection, setDocsScrollSection] = useState(undefined);

  // ── Hint state ──
  const [activeHints, setActiveHints] = useState([]);
  const [dismissedHints, setDismissedHints] = useState([]);
  const [hasError, setHasError] = useState(false);

  // ── Upgrade notification state ──
  const [availableUpgradeCount, setAvailableUpgradeCount] = useState(0);
  const [hasSeenUpgrades, setHasSeenUpgrades] = useState(false);
  const prevUpgradeCountRef = useRef(0);
  const completionsSinceUpgradeRef = useRef(0);

  // ── Log notification state ──
  const [hasWarningInLog, setHasWarningInLog] = useState(false);
  const [hasErrorInLog, setHasErrorInLog] = useState(false);
  const [scrollToLine, setScrollToLine] = useState(null);

  // ── Refs ──
  const windowStackRef = useRef(["main"]);
  const editorRefsMap = useRef(new Map());
  const lastCodeHashRef = useRef("");
  const resources = useGameStore((state) => state.resources);
  const tech = useGameStore((state) => state.tech);
  const prevTechRef = useRef(tech);

  // ── Initialize ──
  useEffect(() => {
    useGameStore.getState().syncFromLocalStorage();

    // Restore dismissed hints
    const restored = [];
    if (hasSeenHint("first-tutorial")) {
      restored.push({
        id: "first-tutorial",
        title: "Welcome Tutorial",
        message: "Welcome! Write code in the editor above and press Run to execute it.",
        isTutorial: true,
      });
    }
    if (hasSeenHint("loop-unlock")) {
      restored.push({
        id: "loop-unlock",
        title: "Loops Unlocked",
        message: "Loops unlocked! Try automating your code with a while loop:",
        codeExample: "while (true) {\n  produceResourceA()\n}",
        isTutorial: true,
      });
    }
    if (hasSeenHint("error-run")) {
      restored.push({
        id: "error-run",
        title: "Code Has Errors",
        message: "Your code has errors. Check the red markers in the editor.",
        isTutorial: true,
      });
    }
    if (hasSeenHint("upgrades-available")) {
      restored.push({
        id: "upgrades-available",
        title: "Upgrades Available",
        message: "You have upgrades available! Open the Tech Tree (Ctrl+U) to unlock new features.",
        isTutorial: true,
      });
    }
    if (restored.length > 0) setDismissedHints(restored);
  }, []);

  // ── Persist code to localStorage ──
  useEffect(() => {
    const mainFile = files.find((f) => f.id === "main");
    if (mainFile) localStorage.setItem(CODE_STORAGE_KEY, mainFile.code);
  }, [files]);

  // ── Track available upgrades ──
  useEffect(() => {
    const count = getAvailableUpgrades(resources, tech).length;
    setAvailableUpgradeCount(count);
    if (count > prevUpgradeCountRef.current && count > 0) {
      setHasSeenUpgrades(false);
    }
    prevUpgradeCountRef.current = count;
  }, [resources, tech]);

  useEffect(() => {
    if (isTechTreeOpen) {
      setHasSeenUpgrades(true);
      completionsSinceUpgradeRef.current = 0;
    }
  }, [isTechTreeOpen]);

  // ── Dismiss hint helper ──
  const dismissHint = useCallback((hintId, hint) => {
    markHintSeen(hintId);
    setActiveHints((prev) => prev.filter((h) => h.id !== hintId));
    setDismissedHints((prev) =>
      prev.find((h) => h.id === hintId) ? prev : [...prev, { ...hint, onDismiss: undefined }]
    );
  }, []);

  // ── Reopen dismissed hint ──
  const reopenHint = useCallback(
    (hint) => {
      setDismissedHints((prev) => prev.filter((h) => h.id !== hint.id));

      if (hint.id === "error-run-specific") {
        const mainFile = files.find((f) => f.id === "main");
        if (mainFile) {
          const errors = validateCode(mainFile.code);
          if (errors.length > 0) {
            const messages = errors.map((e) => `Line ${e.lineNumber}: ${e.message}`).join("\n");
            const updated = {
              ...hint,
              message: `You've tried running this code multiple times. Here are the errors:\n\n${messages}`,
              onDismiss: () => dismissHint(hint.id, updated),
            };
            setActiveHints((prev) =>
              prev.find((h) => h.id === hint.id) ? prev : [...prev, updated]
            );
            return;
          }
        }
      }

      setActiveHints((prev) =>
        prev.find((h) => h.id === hint.id)
          ? prev
          : [...prev, { ...hint, onDismiss: () => dismissHint(hint.id, hint) }]
      );
    },
    [dismissHint, files]
  );

  // ── First tutorial hint ──
  useEffect(() => {
    if (!files.find((f) => f.id === "main")) return;

    const hint = {
      id: "first-tutorial",
      title: "Welcome Tutorial",
      message:
        "Welcome! Write code in the editor above and press Run to execute it. Start by calling `produceResourceA()` to gather resources.",
      isTutorial: true,
      onDismiss: () => dismissHint("first-tutorial", hint),
    };

    if (hasSeenHint("first-tutorial")) {
      setDismissedHints((prev) =>
        prev.find((h) => h.id === "first-tutorial")
          ? prev
          : [{ ...hint, onDismiss: undefined }]
      );
    } else {
      setActiveHints((prev) =>
        prev.find((h) => h.id === "first-tutorial") ? prev : [hint]
      );
    }
  }, [files, dismissHint]);

  // ── Loop unlock hint ──
  useEffect(() => {
    const prevWhile = prevTechRef.current.whileUnlocked;
    if (tech.whileUnlocked) {
      const hint = {
        id: "loop-unlock",
        title: "Loops Unlocked",
        message: "Loops unlocked! Try automating your code with a while loop:",
        codeExample: "while (true) {\n  produceResourceA()\n}",
        isTutorial: true,
        onDismiss: () => dismissHint("loop-unlock", hint),
      };

      if (!prevWhile && !hasSeenHint("loop-unlock")) {
        setActiveHints((prev) => {
          const filtered = prev.filter((h) => h.id !== "first-tutorial");
          return filtered.find((h) => h.id === "loop-unlock") ? filtered : [...filtered, hint];
        });
      } else if (hasSeenHint("loop-unlock")) {
        setDismissedHints((prev) =>
          prev.find((h) => h.id === "loop-unlock")
            ? prev
            : [...prev, { ...hint, onDismiss: undefined }]
        );
      }
    }
    prevTechRef.current = tech;
  }, [tech.whileUnlocked, dismissHint]);

  // ── Initialize executor ──
  useEffect(() => {
    const exec = new CodeExecutor({
      onEvent: (event) => {
        setExecutionEvents((prev) => [...prev, event]);

        if (event.type === "lineChange") {
          setScrollToLine(event.lineNumber);
        } else if (event.type === "log") {
          const isWarning = event.message.startsWith("⚠️ Warning:");
          const logType = isWarning ? "warning" : "log";
          setLogs((prev) => [
            ...prev,
            { type: logType, message: event.message, timestamp: Date.now() },
          ]);
          if (isWarning && !isLogOpen) setHasWarningInLog(true);
        } else if (event.type === "error") {
          setIsRunning(false);
          setRunningFileId(null);
          setStats((prev) => ({ ...prev, isRunning: false }));
          setHasError(true);
          setIsLogOpen(true);
          setHasErrorInLog(false);
          // Focus log window
          windowStackRef.current = ["log", ...windowStackRef.current.filter((w) => w !== "log")];
          setActiveWindowId("log");
          setLogs((prev) => [
            ...prev,
            {
              type: "error",
              message: `❌ Error: ${event.error.message}${event.lineNumber ? ` (line ${event.lineNumber})` : ""}`,
              timestamp: Date.now(),
            },
          ]);
        } else if (event.type === "functionStart") {
          setStats((prev) => ({ ...prev, isRunning: true }));
        } else if (event.type === "functionComplete") {
          setStats((prev) => ({
            ...prev,
            functionTimes: {
              ...prev.functionTimes,
              [event.functionName]: (prev.functionTimes[event.functionName] || 0) + event.duration,
            },
            totalTime: prev.totalTime + event.duration,
          }));
        } else if (event.type === "complete") {
          setIsRunning(false);
          setRunningFileId(null);
          setStats((prev) => ({ ...prev, isRunning: false }));
          setScrollToLine(null);
        }
      },
    });
    setExecutor(exec);
  }, []);

  // ── Run code ──
  const handleRun = useCallback(
    async (fileId) => {
      if (!executor || isRunning) return;

      const file = files.find((f) => f.id === fileId);
      if (!file) return;

      const errors = validateCode(file.code);
      const codeHash = hashCode(file.code);

      // Handle validation errors with progressive hints
      if (errors.length > 0) {
        if (codeHash !== lastCodeHashRef.current) {
          clearErrorRunAttempts(lastCodeHashRef.current);
          lastCodeHashRef.current = codeHash;
        }
        incrementErrorRunAttempts(codeHash);

        const attempts = getErrorRunAttempts(codeHash);
        const alreadySeen = hasSeenHint("error-run");

        // First attempt: show generic hint
        if (attempts === 1 && !alreadySeen) {
          const hint = {
            id: "error-run",
            title: "Code Has Errors",
            message: "Your code has errors. Check the red markers in the editor and fix them before running.",
            isTutorial: true,
            onDismiss: () => {
              markHintSeen("error-run");
              dismissHint("error-run", hint);
            },
          };
          setActiveHints((prev) =>
            prev.find((h) => h.id === "error-run") ? prev : [...prev, hint]
          );
        }
        // 3+ attempts: show specific errors
        else if (attempts >= 3 && alreadySeen) {
          setDismissedHints((prev) => prev.filter((h) => h.id !== "error-run-specific"));
          const messages = errors.map((e) => `Line ${e.lineNumber}: ${e.message}`).join("\n");
          const hint = {
            id: "error-run-specific",
            title: "Fix These Errors",
            message: `You've tried running this code multiple times. Here are the errors:\n\n${messages}`,
            isTutorial: true,
            onDismiss: () => dismissHint("error-run-specific", hint),
          };
          setActiveHints((prev) => {
            const filtered = prev.filter((h) => h.id !== "error-run");
            return filtered.find((h) => h.id === "error-run-specific") ? filtered : [...filtered, hint];
          });
        }
        return;
      }

      // Code is valid - clear error tracking
      clearErrorRunAttempts(codeHash);
      lastCodeHashRef.current = codeHash;
      setActiveHints((prev) => prev.filter((h) => h.id !== "error-run-specific"));

      // Start execution
      setIsRunning(true);
      setRunningFileId(fileId);
      setExecutionEvents([]);
      setStats({ totalTime: 0, functionTimes: {}, isRunning: true });
      setHasError(false);
      setScrollToLine(null);
      setLogs((prev) => [
        ...prev,
        {
          type: "log",
          message: `--- Execution started: ${file.filename} ---`,
          timestamp: Date.now(),
        },
      ]);

      try {
        console.log("Executing user code:", file.filename);
        await executor.execute(file.code);
        console.log("Execution completed");

        // Show upgrade hint after multiple runs
        if (availableUpgradeCount > 0) {
          completionsSinceUpgradeRef.current += 1;
          if (completionsSinceUpgradeRef.current >= 3 && !hasSeenHint("upgrades-available")) {
            const hint = {
              id: "upgrades-available",
              title: "Upgrades Available",
              message: `You have ${availableUpgradeCount} upgrade${availableUpgradeCount > 1 ? "s" : ""} available! Open the Tech Tree (Ctrl+U) to unlock new features.`,
              isTutorial: true,
              onDismiss: () => {
                markHintSeen("upgrades-available");
                dismissHint("upgrades-available", hint);
              },
            };
            setActiveHints((prev) =>
              prev.find((h) => h.id === "upgrades-available") ? prev : [...prev, hint]
            );
          }
        } else {
          completionsSinceUpgradeRef.current = 0;
        }
      } catch (error) {
        console.error("Execution error:", error);
        setLogs((prev) => [
          ...prev,
          {
            type: "error",
            message: `Execution failed: ${error instanceof Error ? error.message : String(error)}`,
            timestamp: Date.now(),
          },
        ]);
        if (!isLogOpen) setHasErrorInLog(true);
        setIsRunning(false);
        setRunningFileId(null);
        setStats((prev) => ({ ...prev, isRunning: false }));
        setScrollToLine(null);
      }
    },
    [executor, isRunning, files, isLogOpen, availableUpgradeCount, dismissHint]
  );

  // ── Stop execution ──
  const handleStop = useCallback(() => {
    if (!executor || !isRunning) return;
    console.log("App: Stopping execution");
    executor.stop();
    setIsRunning(false);
    setRunningFileId(null);
    setStats((prev) => ({ ...prev, isRunning: false }));
    setExecutionEvents([]);
    setScrollToLine(null);
    setLogs((prev) => [
      ...prev,
      { type: "log", message: "--- Execution stopped ---", timestamp: Date.now() },
    ]);
  }, [executor, isRunning]);

  // ── Code change handler ──
  const handleCodeChange = useCallback((fileId, newCode) => {
    setFiles((prev) => prev.map((f) => (f.id === fileId ? { ...f, code: newCode } : f)));
    setActiveWindowId(fileId);
  }, []);

  // ── Close file ──
  const handleCloseFile = useCallback(
    (fileId) => {
      if (files.length <= 1) return;
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
      if (activeWindowId === fileId) {
        const remaining = files.filter((f) => f.id !== fileId);
        if (remaining.length > 0) setActiveWindowId(remaining[0].id);
      }
    },
    [files, activeWindowId]
  );

  // ── Hint click (scroll to line) ──
  const handleHintClick = useCallback(
    (hint) => {
      if (hint.lineNumber) {
        const file = files.find((f) => f.id === activeWindowId);
        if (file) {
          const editorRef = editorRefsMap.current.get(file.id);
          if (editorRef) editorRef.scrollToLine(hint.lineNumber);
        }
      }
    },
    [activeWindowId, files]
  );

  // ── Reset game ──
  const handleReset = useCallback(() => {
    if (!window.confirm("Are you sure you want to reset all progress? This cannot be undone.")) {
      return;
    }
    useGameStore.getState().resetGameState();
    resetAllHints();
    setActiveHints([]);
    setDismissedHints([]);
    window.location.reload();
  }, []);

  // ── Focus window ──
  const focusWindow = useCallback((windowId) => {
    setActiveWindowId(windowId);
    windowStackRef.current = [windowId, ...windowStackRef.current.filter((w) => w !== windowId)];
  }, []);

  // ── Close active window (Escape) ──
  const closeActiveWindow = useCallback(() => {
    const id = activeWindowId;
    if (id === "main" || files.find((f) => f.id === id)) return;

    if (id === "tech-tree") {
      setIsTechTreeOpen(false);
    } else if (id === "log") {
      setIsLogOpen(false);
      setHasError(false);
      setHasWarningInLog(false);
      setHasErrorInLog(false);
    } else if (id === "docs") {
      setIsDocsOpen(false);
      setDocsScrollSection(undefined);
    }

    windowStackRef.current = windowStackRef.current.filter((w) => w !== id);
    if (windowStackRef.current.length > 0) {
      setActiveWindowId(windowStackRef.current[0]);
    } else {
      setActiveWindowId("main");
    }
  }, [activeWindowId, files]);

  // ── Keyboard Shortcuts ──
  useHotkeys(
    "ctrl+u, cmd+u",
    (e) => {
      e.preventDefault();
      setIsTechTreeOpen((prev) => {
        const opening = !prev;
        if (opening) {
          setTechTreeSelectedId(undefined);
          focusWindow("tech-tree");
        }
        return opening;
      });
    },
    { enableOnFormTags: true }
  );

  useHotkeys(
    "ctrl+l, cmd+l",
    (e) => {
      e.preventDefault();
      setIsLogOpen((prev) => {
        const opening = !prev;
        if (opening) {
          focusWindow("log");
          setHasWarningInLog(false);
          setHasErrorInLog(false);
        }
        return opening;
      });
    },
    { enableOnFormTags: true }
  );

  useHotkeys(
    "ctrl+d, cmd+d",
    (e) => {
      e.preventDefault();
      setIsDocsOpen((prev) => {
        const opening = !prev;
        if (opening) focusWindow("docs");
        return opening;
      });
    },
    { enableOnFormTags: true }
  );

  useHotkeys("ctrl+s, cmd+s", (e) => e.preventDefault(), { enableOnFormTags: true });

  useHotkeys("escape", (e) => { e.preventDefault(); closeActiveWindow(); }, { enableOnFormTags: true }, [closeActiveWindow]);

  useHotkeys(
    "f5",
    (e) => {
      e.preventDefault();
      isRunning ? handleStop() : handleRun(activeWindowId);
    },
    { enableOnFormTags: true },
    [isRunning, activeWindowId]
  );

  useHotkeys(
    "escape",
    (e) => { if (isRunning) { e.preventDefault(); handleStop(); } },
    { enableOnFormTags: true },
    [isRunning]
  );

  // ── Render ──
  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        backgroundColor: "#1e1e1e",
        fontFamily: "system-ui, -apple-system, sans-serif",
        overflow: "hidden",
      }}
    >
      <ResourceBar />
      <CpuStats stats={stats} />

      {/* Code Editor Windows */}
      {files.map((file) => (
        <FloatingWindow
          key={file.id}
          id={file.id}
          title={file.filename}
          initialX={file.x}
          initialY={file.y}
          initialWidth={file.width}
          initialHeight={file.height}
          isRunning={isRunning && runningFileId === file.id}
          canRun={!isRunning}
          isActive={activeWindowId === file.id}
          onFocus={() => focusWindow(file.id)}
          onRun={() => handleRun(file.id)}
          onStop={handleStop}
          onClose={files.length > 1 ? () => handleCloseFile(file.id) : undefined}
        >
          <CodeEditor
            ref={(ref) => {
              if (ref) editorRefsMap.current.set(file.id, ref);
              else editorRefsMap.current.delete(file.id);
            }}
            code={file.code}
            onCodeChange={(newCode) => handleCodeChange(file.id, newCode)}
            executionEvents={runningFileId === file.id ? executionEvents : []}
            scrollToLineNumber={runningFileId === file.id ? scrollToLine : null}
            onOpenTechTree={(techId) => {
              setIsTechTreeOpen(true);
              setTechTreeSelectedId(techId);
              focusWindow("tech-tree");
            }}
          />
        </FloatingWindow>
      ))}

      {/* Log Window */}
      {isLogOpen && (
        <FloatingWindow
          id="log"
          title={hasError ? "⚠️ Log (Error Detected)" : "Log"}
          initialX={100}
          initialY={580}
          initialWidth={700}
          initialHeight={200}
          canRun={false}
          isActive={activeWindowId === "log"}
          onFocus={() => focusWindow("log")}
          onClose={() => {
            setIsLogOpen(false);
            setHasError(false);
            setHasWarningInLog(false);
            setHasErrorInLog(false);
            windowStackRef.current = windowStackRef.current.filter((w) => w !== "log");
            if (windowStackRef.current.length > 0) {
              setActiveWindowId(windowStackRef.current[0]);
            }
          }}
        >
          <LogPanel logs={logs} />
        </FloatingWindow>
      )}

      {/* Hint Modal */}
      {activeHints.length > 0 && (
        <HintModal
          hint={activeHints[0]}
          onDismiss={() => {
            if (activeHints[0]?.onDismiss) activeHints[0].onDismiss();
          }}
          onHintClick={handleHintClick}
        />
      )}

      {/* Hint Panel */}
      <HintPanel
        activeHints={activeHints}
        dismissedHints={dismissedHints}
        onHintClick={handleHintClick}
        onReopenHint={reopenHint}
      />

      {/* Bottom Toolbar */}
      <div
        style={{
          position: "fixed",
          bottom: "16px",
          left: "16px",
          display: "flex",
          gap: "8px",
          zIndex: 9999,
        }}
      >
        {/* Tech Tree Button */}
        <button
          onClick={() => {
            setIsTechTreeOpen(true);
            setTechTreeSelectedId(undefined);
            focusWindow("tech-tree");
          }}
          style={{
            padding: "8px 16px",
            backgroundColor: "#2d2d2d",
            color: "#cccccc",
            border: "1px solid #ff6b35",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "13px",
            position: "relative",
            animation:
              availableUpgradeCount > 0 && !hasSeenUpgrades
                ? "pulse-border 1.5s ease-in-out infinite"
                : "none",
            boxShadow:
              availableUpgradeCount > 0 && !hasSeenUpgrades
                ? "0 0 10px rgba(255, 107, 53, 0.6)"
                : "none",
          }}
        >
          TECH TREE
          {availableUpgradeCount > 0 && (
            <span
              style={{
                position: "absolute",
                top: "-8px",
                right: "-8px",
                backgroundColor: "#ff6b35",
                color: "#fff",
                borderRadius: "50%",
                width: "20px",
                height: "20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "11px",
                fontWeight: "bold",
                border: "2px solid #1e1e1e",
              }}
            >
              {availableUpgradeCount}
            </span>
          )}
          <style>{`
            @keyframes pulse-border {
              0%, 100% { border-color: #ff6b35; box-shadow: 0 0 10px rgba(255, 107, 53, 0.6); }
              50% { border-color: #ff8c5a; box-shadow: 0 0 20px rgba(255, 107, 53, 0.9); }
            }
          `}</style>
        </button>

        {/* Log Button */}
        <button
          onClick={() => {
            const opening = !isLogOpen;
            setIsLogOpen(opening);
            if (opening) {
              setHasWarningInLog(false);
              setHasErrorInLog(false);
              focusWindow("log");
            }
          }}
          style={{
            padding: "8px 16px",
            backgroundColor:
              !isLogOpen && hasErrorInLog
                ? "#2d1e1e"
                : !isLogOpen && hasWarningInLog
                  ? "#2d2d1e"
                  : "#2d2d2d",
            color:
              !isLogOpen && hasErrorInLog
                ? "#ff6b6b"
                : !isLogOpen && hasWarningInLog
                  ? "#ffc107"
                  : "#cccccc",
            border:
              !isLogOpen && hasErrorInLog
                ? "1px solid #dc3545"
                : !isLogOpen && hasWarningInLog
                  ? "1px solid #ffc107"
                  : "1px solid #3c3c3c",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "13px",
          }}
        >
          {isLogOpen ? "Hide Log" : "Show Log"}
          {(hasErrorInLog || hasWarningInLog) && !isLogOpen && (
            <span style={{ marginLeft: "6px", fontSize: "11px" }}>⚠️</span>
          )}
        </button>

        {/* Docs Button */}
        <button
          onClick={() => {
            setIsDocsOpen(true);
            focusWindow("docs");
          }}
          style={{
            padding: "8px 16px",
            backgroundColor: "#2d2d2d",
            color: "#cccccc",
            border: "1px solid #4a9eff",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "13px",
          }}
        >
          Docs
        </button>

        {/* Reset Button */}
        <button
          onClick={handleReset}
          style={{
            padding: "8px 16px",
            backgroundColor: "#2d2d2d",
            color: "#dc3545",
            border: "1px solid #dc3545",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "13px",
          }}
          title="Reset all progress (for testing)"
        >
          Reset
        </button>
      </div>

      {/* Tech Tree Modal */}
      <TechTreePanel
        isOpen={isTechTreeOpen}
        initialSelectedTechId={techTreeSelectedId}
        onFocus={() => setTechTreeSelectedId(undefined)}
        onClose={() => setIsTechTreeOpen(false)}
        onOpenDocs={(sectionId) => {
          setIsTechTreeOpen(false);
          setTechTreeSelectedId(undefined);
          windowStackRef.current = windowStackRef.current.filter((w) => w !== "tech-tree");
          setIsDocsOpen(true);
          setDocsScrollSection(sectionId);
          focusWindow("docs");
        }}
      />

      {/* Docs Modal */}
      <DocsPanel
        isOpen={isDocsOpen}
        onClose={() => {
          setIsDocsOpen(false);
          setDocsScrollSection(undefined);
          windowStackRef.current = windowStackRef.current.filter((w) => w !== "docs");
          if (windowStackRef.current.length > 0) {
            setActiveWindowId(windowStackRef.current[0]);
          }
        }}
        scrollToSection={docsScrollSection}
      />
    </div>
  );
}
