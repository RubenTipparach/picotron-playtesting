/**
 * App Component — Hackerman Edition
 *
 * Layout: fixed two-panel design
 * Left: Code editor (top) + Log output (bottom)
 * Right: Tabbed panel (Docs, Profiler, Hints, Shop)
 * Top: Resource bar + controls
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
import { CodeEditor } from "./components/CodeEditor.jsx";
import { LogPanel } from "./components/LogPanel.jsx";
import { TechTreePanel } from "./components/TechTreePanel.jsx";
import { DocsPanel } from "./components/DocsPanel.jsx";
import { ShopPanel } from "./components/ShopPanel.jsx";
import { StockMarketPanel } from "./components/StockMarketPanel.jsx";
import { SnippetsPanel } from "./components/SnippetsPanel.jsx";
import { HintModal, HintPanel } from "./components/HintOverlay.jsx";
import { THEMES, ThemeContext, loadThemeId, saveThemeId } from "./themes.js";
import { initMarket, setDUnlocked, startMarketTimer, stopMarketTimer, setPlayerResourcesGetter } from "./marketEngine.js";

const CODE_STORAGE_KEY = "incremental-coding-game-code";

export function App() {
  // ── Theme state ──
  const [themeId, setThemeId] = useState(loadThemeId);
  const theme = THEMES[themeId] || THEMES.hacker;
  const cycleTheme = useCallback(() => {
    const ids = Object.keys(THEMES);
    const next = ids[(ids.indexOf(themeId) + 1) % ids.length];
    setThemeId(next);
    saveThemeId(next);
  }, [themeId]);

  // ── Code state ──
  const [savedCode, setSavedCode] = useState(
    localStorage.getItem(CODE_STORAGE_KEY) || "produceResourceA()"
  );
  const [code, setCode] = useState(savedCode);
  const hasUnsavedChanges = code !== savedCode;

  // ── Execution state ──
  const [isRunning, setIsRunning] = useState(false);
  const [executionEvents, setExecutionEvents] = useState([]);
  const [logs, setLogs] = useState([]);
  const [executor, setExecutor] = useState(null);
  const [stats, setStats] = useState({ totalTime: 0, functionTimes: {}, isRunning: false });

  // ── Panel state ──
  const [rightTab, setRightTab] = useState("docs"); // docs | profiler | hints | shop | market
  const [isTechTreeOpen, setIsTechTreeOpen] = useState(false);
  const [techTreeSelectedId, setTechTreeSelectedId] = useState(undefined);
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

  // ── Refs ──
  const [scrollToLine, setScrollToLine] = useState(null);
  const editorRef = useRef(null);
  const lastCodeHashRef = useRef("");
  const resources = useGameStore((state) => state.resources);
  const tech = useGameStore((state) => state.tech);
  const ram = useGameStore((state) => state.ram);
  const prevTechRef = useRef(tech);

  // ── Initialize ──
  useEffect(() => {
    useGameStore.getState().syncFromLocalStorage();
    const state = useGameStore.getState();
    initMarket(state.market);
    setPlayerResourcesGetter(() => useGameStore.getState().resources);
    if (state.tech.resourceDUnlocked) setDUnlocked(true);

    // Start market timer if stock market is unlocked
    if (state.tech.stockMarketUnlocked) {
      startMarketTimer(
        (marketData) => useGameStore.getState().setMarket(marketData),
        (marketData) => useGameStore.getState().persistMarket(marketData),
      );
    }

    const restored = [];
    if (hasSeenHint("first-tutorial")) {
      restored.push({ id: "first-tutorial", title: "Welcome Tutorial", message: "Welcome! Write code in the editor and press Run to execute it.", isTutorial: true });
    }
    if (hasSeenHint("loop-unlock")) {
      restored.push({ id: "loop-unlock", title: "Loops Unlocked", message: "Loops unlocked! Try automating with a while loop:", codeExample: "while (true) {\n  produceResourceA()\n}", isTutorial: true });
    }
    if (hasSeenHint("error-run")) {
      restored.push({ id: "error-run", title: "Code Has Errors", message: "Your code has errors. Check the red markers.", isTutorial: true });
    }
    if (hasSeenHint("upgrades-available")) {
      restored.push({ id: "upgrades-available", title: "Upgrades Available", message: "You have upgrades available! Open the Tech Tree (Ctrl+U).", isTutorial: true });
    }
    if (restored.length > 0) setDismissedHints(restored);
  }, []);

  // ── Persist saved code ──
  useEffect(() => {
    localStorage.setItem(CODE_STORAGE_KEY, savedCode);
  }, [savedCode]);

  // ── Auto-save when not running ──
  useEffect(() => {
    if (!isRunning) {
      setSavedCode(code);
    }
  }, [code, isRunning]);

  // ── Save handler — stops & restarts execution so cursor stays in sync ──
  const pendingRestartRef = useRef(false);
  const handleSave = useCallback(() => {
    const wasRunning = isRunning;
    if (wasRunning && executor) {
      executor.stop();
      setIsRunning(false);
      setStats((prev) => ({ ...prev, isRunning: false }));
      setExecutionEvents([]);
      pendingRestartRef.current = true;
    }
    setSavedCode(code);
  }, [code, isRunning, executor]);

  // ── Sync market engine with tech tree ──
  useEffect(() => {
    if (tech.stockMarketUnlocked) {
      startMarketTimer(
        (marketData) => useGameStore.getState().setMarket(marketData),
        (marketData) => useGameStore.getState().persistMarket(marketData),
      );
    }
    return () => stopMarketTimer();
  }, [tech.stockMarketUnlocked]);

  useEffect(() => {
    if (tech.resourceDUnlocked) setDUnlocked(true);
  }, [tech.resourceDUnlocked]);

  // ── Track upgrades ──
  useEffect(() => {
    const count = getAvailableUpgrades(resources, tech).length;
    setAvailableUpgradeCount(count);
    if (count > prevUpgradeCountRef.current && count > 0) setHasSeenUpgrades(false);
    prevUpgradeCountRef.current = count;
  }, [resources, tech]);

  useEffect(() => {
    if (isTechTreeOpen) { setHasSeenUpgrades(true); completionsSinceUpgradeRef.current = 0; }
  }, [isTechTreeOpen]);

  // ── Hint helpers ──
  const dismissHint = useCallback((hintId, hint) => {
    markHintSeen(hintId);
    setActiveHints((prev) => prev.filter((h) => h.id !== hintId));
    setDismissedHints((prev) => prev.find((h) => h.id === hintId) ? prev : [...prev, { ...hint, onDismiss: undefined }]);
  }, []);

  const reopenHint = useCallback((hint) => {
    setDismissedHints((prev) => prev.filter((h) => h.id !== hint.id));
    setActiveHints((prev) => prev.find((h) => h.id === hint.id) ? prev : [...prev, { ...hint, onDismiss: () => dismissHint(hint.id, hint) }]);
  }, [dismissHint]);

  // ── First tutorial hint ──
  useEffect(() => {
    const hint = {
      id: "first-tutorial",
      title: "Welcome Tutorial",
      message: "Welcome! Write code in the editor and press RUN or F5. Start by calling produceResourceA() to gather resources.",
      isTutorial: true,
      onDismiss: () => dismissHint("first-tutorial", hint),
    };
    if (hasSeenHint("first-tutorial")) {
      setDismissedHints((prev) => prev.find((h) => h.id === "first-tutorial") ? prev : [{ ...hint, onDismiss: undefined }]);
    } else {
      setActiveHints((prev) => prev.find((h) => h.id === "first-tutorial") ? prev : [hint]);
    }
  }, [dismissHint]);

  // ── Loop unlock hint ──
  useEffect(() => {
    const prevWhile = prevTechRef.current.whileUnlocked;
    if (tech.whileUnlocked) {
      const hint = {
        id: "loop-unlock",
        title: "Loops Unlocked",
        message: "Loops unlocked! Try automating with a while loop:",
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
        setDismissedHints((prev) => prev.find((h) => h.id === "loop-unlock") ? prev : [...prev, { ...hint, onDismiss: undefined }]);
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
          const msg = String(event.message);
          const isWarning = msg.startsWith("⚠️ Warning:");
          setLogs((prev) => [...prev, { type: isWarning ? "warning" : "log", message: event.message, timestamp: Date.now() }]);
        } else if (event.type === "error") {
          setIsRunning(false);
          setStats((prev) => ({ ...prev, isRunning: false }));
          setHasError(true);
          setLogs((prev) => [...prev, { type: "error", message: `ERROR: ${event.error.message}${event.lineNumber ? ` (line ${event.lineNumber})` : ""}`, timestamp: Date.now() }]);
        } else if (event.type === "functionStart") {
          setStats((prev) => ({ ...prev, isRunning: true }));
        } else if (event.type === "functionComplete") {
          const key = `${event.functionName}:${event.lineNumber}`;
          const codeLine = savedCode.split(/\r?\n/)[event.lineNumber - 1]?.trim() || "";
          setStats((prev) => {
            const detail = prev.functionDetails[key] || { calls: 0, totalTime: 0, lineNumber: event.lineNumber, functionName: event.functionName, codeLine };
            return {
              ...prev,
              functionTimes: { ...prev.functionTimes, [event.functionName]: (prev.functionTimes[event.functionName] || 0) + event.duration },
              functionDetails: { ...prev.functionDetails, [key]: { ...detail, calls: detail.calls + 1, totalTime: detail.totalTime + event.duration } },
              totalTime: prev.totalTime + event.duration,
            };
          });
        } else if (event.type === "loopIteration") {
          const key = `loop:${event.lineNumber}`;
          setStats((prev) => {
            const detail = prev.loopDetails[key] || { iterations: 0, totalTime: 0, lineNumber: event.lineNumber, codeLine: event.codeLine };
            return {
              ...prev,
              loopDetails: { ...prev.loopDetails, [key]: { ...detail, iterations: detail.iterations + 1, totalTime: detail.totalTime + event.duration } },
            };
          });
        } else if (event.type === "complete") {
          setIsRunning(false);
          setStats((prev) => ({ ...prev, isRunning: false }));
          setScrollToLine(null);
        }
      },
    });
    setExecutor(exec);
  }, []);

  // ── Run code ──
  const handleRun = useCallback(async () => {
    if (!executor || isRunning) return;

    // RAM check against saved code (what actually runs)
    if (savedCode.length > ram) {
      setLogs((prev) => [...prev, { type: "error", message: `ERROR: Code exceeds RAM limit (${savedCode.length}/${ram} chars). Buy more RAM in the Shop.`, timestamp: Date.now() }]);
      return;
    }

    const errors = validateCode(savedCode);
    const codeHash = hashCode(savedCode);

    if (errors.length > 0) {
      if (codeHash !== lastCodeHashRef.current) {
        clearErrorRunAttempts(lastCodeHashRef.current);
        lastCodeHashRef.current = codeHash;
      }
      incrementErrorRunAttempts(codeHash);

      const attempts = getErrorRunAttempts(codeHash);
      if (attempts === 1 && !hasSeenHint("error-run")) {
        const hint = {
          id: "error-run", title: "Code Has Errors",
          message: "Your code has errors. Check the red markers in the editor.",
          isTutorial: true,
          onDismiss: () => { markHintSeen("error-run"); dismissHint("error-run", hint); },
        };
        setActiveHints((prev) => prev.find((h) => h.id === "error-run") ? prev : [...prev, hint]);
      } else if (attempts >= 3 && hasSeenHint("error-run")) {
        setDismissedHints((prev) => prev.filter((h) => h.id !== "error-run-specific"));
        const messages = errors.map((e) => `Line ${e.lineNumber}: ${e.message}`).join("\n");
        const hint = {
          id: "error-run-specific", title: "Fix These Errors",
          message: `Errors found:\n\n${messages}`,
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

    clearErrorRunAttempts(codeHash);
    lastCodeHashRef.current = codeHash;
    setActiveHints((prev) => prev.filter((h) => h.id !== "error-run-specific"));

    setIsRunning(true);
    setExecutionEvents([]);
    setStats({ totalTime: 0, functionTimes: {}, functionDetails: {}, loopDetails: {}, isRunning: true });
    setHasError(false);
    setScrollToLine(null);
    setLogs((prev) => [...prev, { type: "log", message: "--- Execution started ---", timestamp: Date.now() }]);

    try {
      await executor.execute(savedCode);
      if (availableUpgradeCount > 0) {
        completionsSinceUpgradeRef.current += 1;
        if (completionsSinceUpgradeRef.current >= 3 && !hasSeenHint("upgrades-available")) {
          const hint = {
            id: "upgrades-available", title: "Upgrades Available",
            message: `${availableUpgradeCount} upgrade${availableUpgradeCount > 1 ? "s" : ""} available! Open the Tech Tree (Ctrl+U).`,
            isTutorial: true,
            onDismiss: () => { markHintSeen("upgrades-available"); dismissHint("upgrades-available", hint); },
          };
          setActiveHints((prev) => prev.find((h) => h.id === "upgrades-available") ? prev : [...prev, hint]);
        }
      } else {
        completionsSinceUpgradeRef.current = 0;
      }
    } catch (error) {
      setLogs((prev) => [...prev, { type: "error", message: `Execution failed: ${error instanceof Error ? error.message : String(error)}`, timestamp: Date.now() }]);
      setIsRunning(false);
      setStats((prev) => ({ ...prev, isRunning: false }));
      setScrollToLine(null);
    }
  }, [executor, isRunning, savedCode, ram, availableUpgradeCount, dismissHint]);

  const handleStop = useCallback(() => {
    if (!executor || !isRunning) return;
    executor.stop();
    setIsRunning(false);
    setStats((prev) => ({ ...prev, isRunning: false }));
    setExecutionEvents([]);
    setScrollToLine(null);
    setLogs((prev) => [...prev, { type: "log", message: "--- Execution stopped ---", timestamp: Date.now() }]);
  }, [executor, isRunning]);

  // ── Auto-restart after save-while-running ──
  useEffect(() => {
    if (pendingRestartRef.current && !isRunning && executor) {
      pendingRestartRef.current = false;
      const id = setTimeout(() => handleRun(), 50);
      return () => clearTimeout(id);
    }
  }, [isRunning, savedCode, executor, handleRun]);

  const handleReset = useCallback(() => {
    if (!window.confirm("RESET ALL PROGRESS? This cannot be undone.")) return;
    useGameStore.getState().resetGameState();
    resetAllHints();
    setActiveHints([]);
    setDismissedHints([]);
    window.location.reload();
  }, []);

  // ── Keyboard Shortcuts ──
  useHotkeys("f5", (e) => { e.preventDefault(); isRunning ? handleStop() : handleRun(); }, { enableOnFormTags: true }, [isRunning, handleRun, handleStop]);
  useHotkeys("escape", (e) => { if (isRunning) { e.preventDefault(); handleStop(); } }, { enableOnFormTags: true }, [isRunning]);
  useHotkeys("ctrl+u, cmd+u", (e) => { e.preventDefault(); setIsTechTreeOpen((p) => { if (!p) setTechTreeSelectedId(undefined); return !p; }); }, { enableOnFormTags: true });
  useHotkeys("ctrl+s, cmd+s", (e) => { e.preventDefault(); handleSave(); }, { enableOnFormTags: true }, [handleSave]);

  // ── Mobile detection ──
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [mobilePanel, setMobilePanel] = useState("code"); // "code" | "output" | "shop" | "docs" | "profiler" | "hints"

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // ── Resizable panels ──
  const [consoleHeight, setConsoleHeight] = useState(200);
  const [rightPanelWidth, setRightPanelWidth] = useState(320);
  const draggingRef = useRef(null); // "vertical" | "horizontal" | null
  const leftPanelRef = useRef(null);
  const mainContentRef = useRef(null);

  useEffect(() => {
    const getClientPos = (e) => {
      if (e.touches && e.touches.length > 0) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
      return { x: e.clientX, y: e.clientY };
    };
    const onMove = (e) => {
      const pos = getClientPos(e);
      if (draggingRef.current === "vertical" && leftPanelRef.current) {
        const rect = leftPanelRef.current.getBoundingClientRect();
        setConsoleHeight(Math.max(60, Math.min(rect.height - 120, rect.bottom - pos.y)));
      } else if (draggingRef.current === "horizontal" && mainContentRef.current) {
        const rect = mainContentRef.current.getBoundingClientRect();
        setRightPanelWidth(Math.max(260, Math.min(rect.width - 300, rect.right - pos.x)));
      }
    };
    const onEnd = () => { draggingRef.current = null; document.body.style.cursor = ""; document.body.style.userSelect = ""; };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onEnd);
    document.addEventListener("touchmove", onMove, { passive: false });
    document.addEventListener("touchend", onEnd);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onEnd);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onEnd);
    };
  }, []);

  const charCount = code.length;
  const ramPercent = Math.min(100, (charCount / ram) * 100);
  const ramColor = ramPercent > 90 ? theme.red : ramPercent > 70 ? theme.yellow : theme.primary;

  const startDrag = (type, cursor) => { draggingRef.current = type; document.body.style.cursor = cursor; document.body.style.userSelect = "none"; };

  // Build visible tabs based on tech unlocks
  const desktopTabs = [
    ...(tech.shopUnlocked ? ["shop"] : []),
    ...(tech.stockMarketUnlocked ? ["market"] : []),
    "docs", "snippets", "profiler", "hints",
  ];
  const mobileTabs = [
    { id: "code", label: "CODE" },
    { id: "output", label: "LOG" },
    ...(tech.shopUnlocked ? [{ id: "shop", label: "SHOP" }] : []),
    ...(tech.stockMarketUnlocked ? [{ id: "market", label: "MKT" }] : []),
    { id: "docs", label: "DOCS" },
    { id: "snippets", label: "SNIP" },
    { id: "profiler", label: "CPU" },
  ];

  // Render the right panel tab content (shared between mobile and desktop)
  const renderTabContent = (tab) => {
    switch (tab) {
      case "shop": return <ShopPanel />;
      case "market": return <StockMarketPanel />;
      case "docs": return <DocsPanel isOpen={true} onClose={() => {}} scrollToSection={docsScrollSection} inline onInsertCode={(text) => { if (editorRef.current?.insertText) editorRef.current.insertText(text); }} />;
      case "snippets": return <SnippetsPanel currentCode={code} onLoad={(snippetCode) => { setCode(snippetCode); setSavedCode(snippetCode); }} />;
      case "profiler": return <CpuStats stats={stats} onScrollToLine={(line) => { setScrollToLine(line); if (editorRef.current?.scrollToLine) editorRef.current.scrollToLine(line); }} />;
      case "hints": return <HintPanel activeHints={activeHints} dismissedHints={dismissedHints} onHintClick={() => {}} onReopenHint={reopenHint} inline />;
      default: return null;
    }
  };

  // ── Overlay element ──
  const overlayEl = theme.crt ? <div className="crt-overlay" /> : theme.overlay === "grid" ? <div className="grid-overlay" /> : null;

  // ── MOBILE LAYOUT ──
  if (isMobile) {
    const TAB_BAR_HEIGHT = 48;
    return (
      <ThemeContext.Provider value={theme}>
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: theme.bg, fontFamily: theme.font, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {overlayEl}

        <ResourceBar
          isRunning={isRunning}
          onRun={handleRun}
          onStop={handleStop}
          onSave={handleSave}
          hasUnsavedChanges={hasUnsavedChanges}
          onOpenTechTree={() => { setIsTechTreeOpen(true); setTechTreeSelectedId(undefined); }}
          onReset={handleReset}
          availableUpgradeCount={availableUpgradeCount}
          hasSeenUpgrades={hasSeenUpgrades}
          onCycleTheme={cycleTheme}
          themeName={theme.name}
        />

        {/* Mobile content area */}
        <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
          {/* All panels are absolutely positioned so they don't fight for flex space */}
          <div style={{ position: "absolute", inset: 0, display: mobilePanel === "code" ? "flex" : "none", flexDirection: "column" }}>
            <CodeEditor
              ref={editorRef}
              code={code}
              onCodeChange={setCode}
              executionEvents={executionEvents}
              scrollToLineNumber={scrollToLine}
              onOpenTechTree={(techId) => { setIsTechTreeOpen(true); setTechTreeSelectedId(techId); }}
            />
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "3px", backgroundColor: theme.bg3 }}>
              <div style={{ height: "100%", width: `${ramPercent}%`, backgroundColor: ramColor, transition: "width 0.2s, background-color 0.3s" }} />
            </div>
            <div style={{ position: "absolute", bottom: "6px", right: "8px", fontSize: "10px", fontFamily: theme.font, color: ramColor, opacity: 0.8 }}>
              {charCount}/{ram}
            </div>
          </div>

          <div style={{ position: "absolute", inset: 0, display: mobilePanel === "output" ? "block" : "none", overflow: "auto" }}>
            <LogPanel logs={logs} />
          </div>

          {desktopTabs.map((tab) => (
            <div key={tab} style={{ position: "absolute", inset: 0, display: mobilePanel === tab ? "block" : "none", overflow: "auto" }}>
              {mobilePanel === tab && renderTabContent(tab)}
            </div>
          ))}
        </div>

        {/* Mobile bottom tab bar - fixed height, always visible */}
        <div style={{
          display: "flex",
          height: `${TAB_BAR_HEIGHT}px`,
          flexShrink: 0,
          borderTop: `1px solid ${theme.border}`,
          backgroundColor: theme.bg,
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}>
          {mobileTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setMobilePanel(tab.id)}
              style={{
                flex: 1,
                padding: "8px 2px",
                fontFamily: theme.font,
                fontSize: "10px",
                letterSpacing: "1px",
                textTransform: "uppercase",
                background: mobilePanel === tab.id ? theme.bg3 : "transparent",
                color: mobilePanel === tab.id ? theme.primary : theme.primaryDark,
                border: "none",
                borderTop: mobilePanel === tab.id ? `2px solid ${theme.primary}` : "2px solid transparent",
                cursor: "pointer",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeHints.length > 0 && (
          <HintModal
            hint={activeHints[0]}
            onDismiss={() => { if (activeHints[0]?.onDismiss) activeHints[0].onDismiss(); }}
            onHintClick={() => {}}
          />
        )}

        <TechTreePanel
          isOpen={isTechTreeOpen}
          initialSelectedTechId={techTreeSelectedId}
          onFocus={() => setTechTreeSelectedId(undefined)}
          onClose={() => setIsTechTreeOpen(false)}
          onOpenDocs={(sectionId) => {
            setIsTechTreeOpen(false);
            setTechTreeSelectedId(undefined);
            setMobilePanel("docs");
            setDocsScrollSection(sectionId);
          }}
        />
      </div>
      </ThemeContext.Provider>
    );
  }

  // ── DESKTOP LAYOUT ──
  return (
    <ThemeContext.Provider value={theme}>
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: theme.bg, fontFamily: theme.font, overflow: "hidden", display: "flex", flexDirection: "column" }}>
      {overlayEl}

      <ResourceBar
        isRunning={isRunning}
        onRun={handleRun}
        onStop={handleStop}
        onSave={handleSave}
        hasUnsavedChanges={hasUnsavedChanges}
        onOpenTechTree={() => { setIsTechTreeOpen(true); setTechTreeSelectedId(undefined); }}
        onReset={handleReset}
        availableUpgradeCount={availableUpgradeCount}
        hasSeenUpgrades={hasSeenUpgrades}
        onCycleTheme={cycleTheme}
        themeName={theme.name}
      />

      <div ref={mainContentRef} style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* LEFT PANEL: Editor + Output */}
        <div ref={leftPanelRef} style={{ flex: 1, display: "flex", flexDirection: "column", borderRight: `1px solid ${theme.border}`, minWidth: 0 }}>
          <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
            <CodeEditor
              ref={editorRef}
              code={code}
              onCodeChange={setCode}
              executionEvents={executionEvents}
              scrollToLineNumber={scrollToLine}
              onOpenTechTree={(techId) => { setIsTechTreeOpen(true); setTechTreeSelectedId(techId); }}
            />
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "3px", backgroundColor: theme.bg3 }}>
              <div style={{ height: "100%", width: `${ramPercent}%`, backgroundColor: ramColor, transition: "width 0.2s, background-color 0.3s" }} />
            </div>
            <div style={{ position: "absolute", bottom: "6px", right: "8px", fontSize: "10px", fontFamily: theme.font, color: ramColor, opacity: 0.8 }}>
              {charCount}/{ram}
            </div>
          </div>

          {/* Vertical drag handle */}
          <div
            onMouseDown={() => startDrag("vertical", "row-resize")}
            onTouchStart={() => startDrag("vertical", "row-resize")}
            style={{ height: "5px", cursor: "row-resize", backgroundColor: theme.border, flexShrink: 0, position: "relative" }}
          >
            <div style={{ position: "absolute", left: "50%", top: "1px", transform: "translateX(-50%)", width: "40px", height: "3px", backgroundColor: theme.primaryDark, borderRadius: "2px" }} />
          </div>

          <div style={{ height: `${consoleHeight}px`, minHeight: "60px", overflow: "hidden", flexShrink: 0 }}>
            <LogPanel logs={logs} />
          </div>
        </div>

        {/* Horizontal drag handle */}
        <div
          onMouseDown={() => startDrag("horizontal", "col-resize")}
          onTouchStart={() => startDrag("horizontal", "col-resize")}
          style={{ width: "5px", cursor: "col-resize", backgroundColor: theme.border, flexShrink: 0, position: "relative" }}
        >
          <div style={{ position: "absolute", top: "50%", left: "1px", transform: "translateY(-50%)", width: "3px", height: "40px", backgroundColor: theme.primaryDark, borderRadius: "2px" }} />
        </div>

        {/* RIGHT PANEL: Tabbed */}
        <div style={{ width: `${rightPanelWidth}px`, display: "flex", flexDirection: "column", backgroundColor: theme.bg, flexShrink: 0 }}>
          <div style={{ display: "flex", flexWrap: "wrap", borderBottom: `1px solid ${theme.border}` }}>
            {desktopTabs.map((tab) => {
              const isActive = rightTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setRightTab(tab)}
                  style={{
                    padding: "6px 10px",
                    fontFamily: theme.font,
                    fontSize: "11px",
                    letterSpacing: "1px",
                    textTransform: "uppercase",
                    background: isActive ? theme.bg2 : "transparent",
                    color: isActive ? theme.primary : theme.primaryDark,
                    border: `1px solid ${isActive ? theme.borderBright : theme.border}`,
                    borderBottom: isActive ? `1px solid ${theme.bg2}` : `1px solid ${theme.border}`,
                    cursor: "pointer",
                    transition: "all 0.15s",
                    flexShrink: 0,
                  }}
                >
                  {tab}
                </button>
              );
            })}
          </div>
          <div style={{ flex: 1, overflow: "hidden" }}>
            {renderTabContent(rightTab)}
          </div>
        </div>
      </div>

      {activeHints.length > 0 && (
        <HintModal
          hint={activeHints[0]}
          onDismiss={() => { if (activeHints[0]?.onDismiss) activeHints[0].onDismiss(); }}
          onHintClick={() => {}}
        />
      )}

      <TechTreePanel
        isOpen={isTechTreeOpen}
        initialSelectedTechId={techTreeSelectedId}
        onFocus={() => setTechTreeSelectedId(undefined)}
        onClose={() => setIsTechTreeOpen(false)}
        onOpenDocs={(sectionId) => {
          setIsTechTreeOpen(false);
          setTechTreeSelectedId(undefined);
          setRightTab("docs");
          setDocsScrollSection(sectionId);
        }}
      />
    </div>
    </ThemeContext.Provider>
  );
}
