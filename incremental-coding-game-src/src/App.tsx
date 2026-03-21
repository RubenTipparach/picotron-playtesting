/**
 * App Component — Hackerman Edition
 *
 * Layout: fixed two-panel design
 * Left: Code editor (top) + Log output (bottom)
 * Right: Tabbed panel (Docs, Profiler, Hints, Shop)
 * Top: Resource bar + controls
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { useGameStore } from './store/gameStore';
import { getAvailableUpgrades } from './game/tech';
import {
  hasSeenHint,
  markHintAsSeen,
  resetAllHints,
  getErrorRunAttempts,
  incrementErrorRunAttempts,
  clearErrorRunAttempts,
  hashCode,
} from './utils/hintManager';

import { ResourcePanel } from './components/ResourcePanel';
import { CPUPanel } from './components/CPUPanel';
import { CodeEditor } from './components/CodeEditor';
import { LogPanel } from './components/LogPanel';
import { TechTreeModal } from './components/TechTreeModal';
import { DocumentationPanel } from './components/DocumentationPanel';
import { ShopPanel } from './components/ShopPanel';
import { StockMarketPanel } from './components/StockMarketPanel';
import { SnippetsPanel } from './components/SnippetsPanel';
import { HintPopover, HintsPanel } from './components/HintPopover';
import { THEMES, ThemeContext, loadThemeId, saveThemeId } from './themes';
import { initMarket, setDUnlocked, startMarketTimer, stopMarketTimer, setPlayerResourcesGetter } from './game/marketEngine';
import { PerfOverlay } from './components/PerfOverlay';
import { trackRender, trackEvent } from './utils/perfMonitor';
import { useMultiCore } from './hooks/useMultiCore';

interface LogEntry {
  type: string;
  message: string;
  timestamp: number;
}

interface FunctionDetail {
  calls: number;
  totalTime: number;
  lineNumber: number;
  functionName: string;
  codeLine: string;
}

interface LoopDetail {
  iterations: number;
  totalTime: number;
  lineNumber: number;
  codeLine: string;
}

interface Stats {
  totalTime: number;
  functionTimes: Record<string, number>;
  functionDetails?: Record<string, FunctionDetail>;
  loopDetails?: Record<string, LoopDetail>;
  isRunning: boolean;
}

interface HintData {
  id: string;
  title: string;
  message: string;
  codeExample?: string;
  isTutorial?: boolean;
  onDismiss?: () => void;
}

/**
 * Count tokens using PICO-8-style rules (adapted for JS):
 * - 1 token: identifiers, numbers, strings, keywords (except free ones), operators, opening brackets
 * - Free: comments, `const`/`let`/`var` (like PICO-8's `local`), commas, dots, colons, semicolons, closing brackets
 * - Unary -/~ on a number literal = 0 extra tokens (number itself is 1)
 */
function countTokens(src: string): number {
  // Strip comments first
  let code = src.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");

  const FREE_KEYWORDS = new Set(["const", "let", "var"]); // like PICO-8's "local"
  const FREE_CHARS = new Set([",", ".", ";", ":", ")", "]", "}"]);

  let tokens = 0;
  let i = 0;
  while (i < code.length) {
    const ch = code[i];

    // Whitespace
    if (/\s/.test(ch)) { i++; continue; }

    // Free closing brackets and punctuation
    if (FREE_CHARS.has(ch)) { i++; continue; }

    // Opening brackets — 1 token each
    if (ch === "(" || ch === "[" || ch === "{") { tokens++; i++; continue; }

    // String literals — 1 token regardless of length
    if (ch === '"' || ch === "'" || ch === "`") {
      tokens++;
      const quote = ch;
      i++;
      while (i < code.length && code[i] !== quote) {
        if (code[i] === "\\") i++; // skip escaped char
        i++;
      }
      i++; // skip closing quote
      continue;
    }

    // Numbers (including hex 0x, binary 0b) — 1 token
    if (/\d/.test(ch) || (ch === "." && i + 1 < code.length && /\d/.test(code[i + 1]))) {
      tokens++;
      i++;
      while (i < code.length && /[\dA-Fa-fxXbBoOeE._]/.test(code[i])) i++;
      continue;
    }

    // Identifiers / keywords
    if (/[A-Za-z_$]/.test(ch)) {
      let word = "";
      while (i < code.length && /[\w$]/.test(code[i])) { word += code[i]; i++; }
      if (!FREE_KEYWORDS.has(word)) tokens++;
      continue;
    }

    // Operators — check for unary -/~ before a number (free, number counts as 1)
    if ((ch === "-" || ch === "~") && i + 1 < code.length && /[\d.]/.test(code[i + 1])) {
      // Check if this is unary (previous non-whitespace is operator, opening bracket, or start)
      let j = i - 1;
      while (j >= 0 && /\s/.test(code[j])) j--;
      const prev = j >= 0 ? code[j] : "";
      const isUnary = prev === "" || /[=+\-*/%<>&|^!~?:,;({[\[]/.test(prev);
      if (isUnary) {
        i++; // skip the unary op (free)
        // The number itself will be counted as 1 token on next iteration
        continue;
      }
    }

    // Multi-char operators (===, !==, >=, <=, ==, !=, &&, ||, **, >>, <<, =>, +=, -=, etc.)
    tokens++;
    if (i + 2 < code.length && (code.slice(i, i + 3) === "===" || code.slice(i, i + 3) === "!==" || code.slice(i, i + 3) === ">>>" || code.slice(i, i + 3) === "**=")) {
      i += 3;
    } else if (i + 1 < code.length && /^(==|!=|>=|<=|&&|\|\||<<|>>|\*\*|=>|\+=|-=|\*=|\/=|%=|&=|\|=|\^=|\?\?|\?\.)$/.test(code.slice(i, i + 2))) {
      i += 2;
    } else {
      i++;
    }
  }
  return tokens;
}

export function App(): React.ReactElement {
  // ── Theme state ──
  const [themeId, setThemeId] = useState<string>(loadThemeId);
  const theme = THEMES[themeId] || THEMES.hacker;
  const cycleTheme = useCallback(() => {
    const ids = Object.keys(THEMES);
    const next = ids[(ids.indexOf(themeId) + 1) % ids.length];
    setThemeId(next);
    saveThemeId(next);
  }, [themeId]);

  // ── Logs ──
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logsRef = useRef<LogEntry[]>([]);
  const logFlushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const appendLog = useCallback((entry: LogEntry) => {
    logsRef.current.push(entry);
    if (!logFlushTimer.current) {
      logFlushTimer.current = setTimeout(() => {
        logFlushTimer.current = null;
        setLogs([...logsRef.current]);
      }, 250);
    }
  }, []);

  // ── Multi-core state ──
  const cpuCores = useGameStore((s: any) => s.cpuCores);
  const [stats, setStats] = useState<Stats>({ totalTime: 0, functionTimes: {}, isRunning: false });

  const handleStatsEvent = useCallback((event: any, coreIndex: number, coreSavedCode: string) => {
    if (event.type === "functionStart") {
      setStats((prev) => ({ ...prev, isRunning: true }));
    } else if (event.type === "functionComplete") {
      const key = `${event.functionName}:${event.lineNumber}`;
      const codeLine = coreSavedCode.split(/\r?\n/)[event.lineNumber - 1]?.trim() || "";
      setStats((prev) => {
        const detail = prev.functionDetails?.[key] || { calls: 0, totalTime: 0, lineNumber: event.lineNumber, functionName: event.functionName, codeLine };
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
        const detail = prev.loopDetails?.[key] || { iterations: 0, totalTime: 0, lineNumber: event.lineNumber, codeLine: event.codeLine };
        return {
          ...prev,
          loopDetails: { ...prev.loopDetails, [key]: { ...detail, iterations: detail.iterations + 1, totalTime: detail.totalTime + event.duration } },
        };
      });
    } else if (event.type === "complete") {
      setStats((prev) => ({ ...prev, isRunning: false }));
    }
  }, []);

  const { cores, internals, setCode: setCoreCode, loadCode: loadCoreCode, saveCode: saveCoreCode, saveAllCodes, runAll, stopAll, pauseAll, resumeAll, stepAll, isAnyRunning, isAnyPaused } = useMultiCore(cpuCores, appendLog, handleStatsEvent);
  const [activeCore, setActiveCore] = useState(0);
  const [splitView, setSplitView] = useState(false);
  const [isSnippetsOpen, setIsSnippetsOpen] = useState<boolean>(false);
  const [showPerf, setShowPerf] = useState(false);

  // Convenience aliases for active core
  const code = cores[activeCore]?.code || "";
  const savedCode = cores[activeCore]?.savedCode || "";
  const isRunning = isAnyRunning;
  const hasUnsavedChanges = cores.some((c) => c.code !== c.savedCode);
  const editorRef = internals[activeCore]?.editorRef || { current: null };

  // ── Panel state ──
  const [rightTab, setRightTab] = useState<string>("docs"); // docs | profiler | hints | shop | market
  const [isTechTreeOpen, setIsTechTreeOpen] = useState<boolean>(false);
  const [techTreeSelectedId, setTechTreeSelectedId] = useState<string | undefined>(undefined);
  const [docsScrollSection, setDocsScrollSection] = useState<string | undefined>(undefined);

  // ── Hint state ──
  const [activeHints, setActiveHints] = useState<HintData[]>([]);
  const [dismissedHints, setDismissedHints] = useState<HintData[]>([]);
  const [hasError, setHasError] = useState<boolean>(false);

  // ── Upgrade notification state ──
  const [availableUpgradeCount, setAvailableUpgradeCount] = useState<number>(0);
  const [hasSeenUpgrades, setHasSeenUpgrades] = useState<boolean>(false);
  const prevUpgradeCountRef = useRef<number>(0);
  const completionsSinceUpgradeRef = useRef<number>(0);

  // ── Refs ──
  const lastCodeHashRef = useRef<string>("");
  const resources = useGameStore((state: any) => state.resources);
  const tech = useGameStore((state: any) => state.tech);
  const ram = useGameStore((state: any) => state.ram);
  const prevTechRef = useRef<any>(tech);

  // ── Initialize ──
  useEffect(() => {
    useGameStore.getState().syncFromLocalStorage();
    const state = useGameStore.getState();
    initMarket(state.market);
    setPlayerResourcesGetter(() => useGameStore.getState().resources as unknown as Record<string, number>);
    if (state.tech.resourceDUnlocked) setDUnlocked(true);

    // Start market timer if stock market is unlocked
    if (state.tech.stockMarketUnlocked) {
      startMarketTimer(
        (marketData: any) => useGameStore.getState().setMarket(marketData),
        (marketData: any) => useGameStore.getState().persistMarket(marketData),
      );
    }

    const restored: HintData[] = [];
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

  // ── Auto-save when not running ──
  useEffect(() => {
    if (!isRunning) {
      saveAllCodes();
    }
  }, [isRunning, saveAllCodes]);

  // ── Save handler — stops & restarts execution so cursor stays in sync ──
  const pendingRestartRef = useRef<boolean>(false);
  const handleSave = useCallback(() => {
    const wasRunning = isRunning;
    if (wasRunning) {
      stopAll();
      setStats((prev) => ({ ...prev, isRunning: false }));
      pendingRestartRef.current = true;
    }
    saveAllCodes();
  }, [isRunning, stopAll, saveAllCodes]);

  // ── Sync market engine with tech tree ──
  useEffect(() => {
    if (tech.stockMarketUnlocked) {
      startMarketTimer(
        (marketData: any) => useGameStore.getState().setMarket(marketData),
        (marketData: any) => useGameStore.getState().persistMarket(marketData),
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
  const dismissHint = useCallback((hintId: string, hint: HintData) => {
    markHintAsSeen(hintId);
    setActiveHints((prev) => prev.filter((h) => h.id !== hintId));
    setDismissedHints((prev) => prev.find((h) => h.id === hintId) ? prev : [...prev, { ...hint, onDismiss: undefined }]);
  }, []);

  const reopenHint = useCallback((hint: HintData) => {
    setDismissedHints((prev) => prev.filter((h) => h.id !== hint.id));
    setActiveHints((prev) => prev.find((h) => h.id === hint.id) ? prev : [...prev, { ...hint, onDismiss: () => dismissHint(hint.id, hint) }]);
  }, [dismissHint]);

  // ── First tutorial hint ──
  useEffect(() => {
    const hint: HintData = {
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
      const hint: HintData = {
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

  // ── Run code (all cores) ──
  const handleRun = useCallback(async () => {
    if (isRunning) return;

    setStats({ totalTime: 0, functionTimes: {}, functionDetails: {}, loopDetails: {}, isRunning: true });
    setHasError(false);
    appendLog({ type: "log", message: "--- Execution started ---", timestamp: Date.now() });

    const error = runAll(ram, countTokens);
    if (error) {
      appendLog({ type: "error", message: `ERROR: ${error}`, timestamp: Date.now() });
      setStats((prev) => ({ ...prev, isRunning: false }));
      return;
    }
  }, [isRunning, ram, runAll, appendLog]);

  const handleStop = useCallback(() => {
    if (!isRunning) return;
    stopAll();
    setStats((prev) => ({ ...prev, isRunning: false }));
    appendLog({ type: "log", message: "--- Execution stopped ---", timestamp: Date.now() });
  }, [isRunning, stopAll, appendLog]);

  // ── Auto-restart after save-while-running ──
  useEffect(() => {
    if (pendingRestartRef.current && !isRunning) {
      pendingRestartRef.current = false;
      const id = setTimeout(() => handleRun(), 50);
      return () => clearTimeout(id);
    }
  }, [isRunning, savedCode, handleRun]);

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
  useHotkeys("f3", (e) => { e.preventDefault(); setShowPerf(p => !p); }, { enableOnFormTags: true });

  // ── Mobile detection ──
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth < 768);
  const [mobilePanel, setMobilePanel] = useState<string>("code"); // "code" | "output" | "shop" | "docs" | "profiler" | "hints"

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // ── Resizable panels ──
  const [consoleHeight, setConsoleHeight] = useState<number>(200);
  const [rightPanelWidth, setRightPanelWidth] = useState<number>(320);
  const draggingRef = useRef<string | null>(null); // "vertical" | "horizontal" | null
  const leftPanelRef = useRef<HTMLDivElement | null>(null);
  const mainContentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const getClientPos = (e: any) => {
      if (e.touches && e.touches.length > 0) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
      return { x: e.clientX, y: e.clientY };
    };
    const onMove = (e: any) => {
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

  const totalTokenCount = cores.reduce((sum, c) => sum + countTokens(c.code), 0);
  const tokenCount = countTokens(code); // active core only (for display)
  const ramPercent = Math.min(100, (totalTokenCount / ram) * 100);
  const ramColor = ramPercent > 90 ? theme.red : ramPercent > 70 ? theme.yellow : theme.primary;

  const startDrag = (type: string, cursor: string) => { draggingRef.current = type; document.body.style.cursor = cursor; document.body.style.userSelect = "none"; };

  // Build visible tabs based on tech unlocks
  const desktopTabs: string[] = [
    ...(tech.shopUnlocked ? ["shop"] : []),
    ...(tech.stockMarketUnlocked ? ["market"] : []),
    "docs", "profiler", "hints",
  ];
  const mobileTabs: { id: string; label: string }[] = [
    { id: "code", label: "CODE" },
    { id: "output", label: "LOG" },
    ...(tech.shopUnlocked ? [{ id: "shop", label: "SHOP" }] : []),
    ...(tech.stockMarketUnlocked ? [{ id: "market", label: "MKT" }] : []),
    { id: "docs", label: "DOCS" },
    { id: "profiler", label: "CPU" },
  ];

  // Render the right panel tab content (shared between mobile and desktop)
  const renderTabContent = (tab: string) => {
    switch (tab) {
      case "shop": return <ShopPanel />;
      case "market": return <StockMarketPanel />;
      case "docs": return <DocumentationPanel isOpen={true} onClose={() => {}} scrollToSection={docsScrollSection} inline onInsertCode={(text: string) => { if (editorRef.current?.insertText) editorRef.current.insertText(text); }} />;
      case "profiler": return <CPUPanel stats={stats} onScrollToLine={(line: number) => { if (editorRef.current?.scrollToLine) editorRef.current.scrollToLine(line); }} />;
      case "hints": return <HintsPanel activeHints={activeHints} dismissedHints={dismissedHints} onReopenHint={reopenHint} inline />;
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

        <ResourcePanel
          isRunning={isRunning}
          isPaused={isAnyPaused}
          onRun={handleRun}
          onStop={handleStop}
          onPause={pauseAll}
          onResume={resumeAll}
          onStep={stepAll}
          onSave={handleSave}
          hasUnsavedChanges={hasUnsavedChanges}
          onOpenTechTree={() => { setIsTechTreeOpen(true); setTechTreeSelectedId(undefined); }}
          onReset={handleReset}
          onOpenSnippets={() => setIsSnippetsOpen(true)}
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
              ref={internals[activeCore]?.editorRef}
              code={code}
              onCodeChange={(v: string) => setCoreCode(activeCore, v)}
              onOpenTechTree={(techId: string) => { setIsTechTreeOpen(true); setTechTreeSelectedId(techId); }}
            />
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "3px", backgroundColor: theme.bg3 }}>
              <div style={{ height: "100%", width: `${ramPercent}%`, backgroundColor: ramColor, transition: "width 0.2s, background-color 0.3s" }} />
            </div>
            <div style={{ position: "absolute", bottom: "6px", right: "8px", fontSize: "10px", fontFamily: theme.font, color: ramColor, opacity: 0.8 }}>
              {totalTokenCount}/{ram}
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
          <HintPopover
            hint={activeHints[0]}
            onDismiss={() => { if (activeHints[0]?.onDismiss) activeHints[0].onDismiss(); }}
            onHintClick={() => {}}
          />
        )}

        <TechTreeModal
          isOpen={isTechTreeOpen}
          initialSelectedTechId={techTreeSelectedId}
          onFocus={() => setTechTreeSelectedId(undefined)}
          onClose={() => setIsTechTreeOpen(false)}
          onOpenDocs={(sectionId: string) => {
            setIsTechTreeOpen(false);
            setTechTreeSelectedId(undefined);
            setMobilePanel("docs");
            setDocsScrollSection(sectionId);
          }}
        />

        {/* Snippets Modal */}
        {isSnippetsOpen && (
          <div style={{ position: "fixed", inset: 0, zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.7)" }} onClick={() => setIsSnippetsOpen(false)} />
            <div style={{ position: "relative", width: "90%", maxWidth: "420px", maxHeight: "80vh", backgroundColor: theme.bg, border: `1px solid ${theme.border}`, overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", borderBottom: `1px solid ${theme.border}` }}>
                <span style={{ fontFamily: theme.font, fontSize: "11px", color: theme.primaryDim, letterSpacing: "2px" }}>SNIPPETS</span>
                <button onClick={() => setIsSnippetsOpen(false)} style={{ fontFamily: theme.font, fontSize: "12px", color: theme.primary, backgroundColor: "transparent", border: "none", cursor: "pointer" }}>X</button>
              </div>
              <div style={{ flex: 1, overflowY: "auto" }}>
                <SnippetsPanel currentCode={code} onLoad={(snippetCode: string) => { loadCoreCode(activeCore, snippetCode); setIsSnippetsOpen(false); }} />
              </div>
            </div>
          </div>
        )}
      {showPerf && <PerfOverlay />}
      </div>
      </ThemeContext.Provider>
    );
  }

  // ── DESKTOP LAYOUT ──
  return (
    <ThemeContext.Provider value={theme}>
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: theme.bg, fontFamily: theme.font, overflow: "hidden", display: "flex", flexDirection: "column" }}>
      {overlayEl}

      <ResourcePanel
        isRunning={isRunning}
        isPaused={isAnyPaused}
        onRun={handleRun}
        onStop={handleStop}
        onPause={pauseAll}
        onResume={resumeAll}
        onStep={stepAll}
        onSave={handleSave}
        hasUnsavedChanges={hasUnsavedChanges}
        onOpenSnippets={() => setIsSnippetsOpen(true)}
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
          {/* Core tab bar */}
          {cpuCores > 1 && (
            <div style={{ display: "flex", alignItems: "center", borderBottom: `1px solid ${theme.border}`, backgroundColor: theme.bg, flexShrink: 0 }}>
              {cores.slice(0, cpuCores).map((core, i) => {
                const isActive = activeCore === i;
                const status = core.isRunning
                  ? `L${core.currentLine || "?"}${core.currentFunction ? `: ${core.currentFunction}` : ""}`
                  : "idle";
                return (
                  <button
                    key={i}
                    onClick={() => setActiveCore(i)}
                    style={{
                      padding: "4px 8px", fontSize: "10px", fontFamily: theme.font,
                      backgroundColor: isActive ? theme.bg3 : theme.bg,
                      color: isActive ? theme.primary : theme.primaryDark,
                      border: "none", borderRight: `1px solid ${theme.border}`,
                      borderBottom: isActive ? `2px solid ${theme.primary}` : "2px solid transparent",
                      cursor: "pointer", whiteSpace: "nowrap",
                      width: "130px", overflow: "hidden", textOverflow: "ellipsis", textAlign: "left",
                    }}
                  >
                    C{i + 1} {core.isRunning ? "\u25B6" : "\u25CF"} {status}
                  </button>
                );
              })}
              <button
                onClick={() => setSplitView((v) => !v)}
                style={{
                  marginLeft: "auto", padding: "4px 8px", fontSize: "10px", fontFamily: theme.font,
                  backgroundColor: splitView ? theme.primary : theme.bg,
                  color: splitView ? theme.bg : theme.primaryDark,
                  border: `1px solid ${theme.border}`, cursor: "pointer",
                }}
                title="Toggle split view"
              >
                {splitView ? "\u229E" : "\u229E"}
              </button>
            </div>
          )}

          <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
            {splitView && cpuCores > 1 ? (
              /* Split view: grid of editors */
              <div style={{
                display: "grid",
                gridTemplateColumns: cpuCores <= 2 ? "1fr 1fr" : "1fr 1fr",
                gridTemplateRows: cpuCores <= 2 ? "1fr" : "1fr 1fr",
                height: "100%", gap: "1px", backgroundColor: theme.border,
              }}>
                {cores.slice(0, cpuCores).map((core, i) => (
                  <div key={i} style={{ position: "relative", overflow: "hidden", backgroundColor: theme.bg }}>
                    <div style={{
                      position: "absolute", top: "2px", left: "4px", zIndex: 10,
                      fontSize: "9px", fontFamily: theme.font, color: theme.primaryDark,
                      backgroundColor: `${theme.bg}cc`, padding: "1px 4px",
                    }}>
                      C{i + 1} {core.isRunning ? "\u25B6" : ""}
                    </div>
                    <CodeEditor
                      ref={internals[i]?.editorRef}
                      code={core.code}
                      onCodeChange={(v: string) => setCoreCode(i, v)}
                      onOpenTechTree={(techId: string) => { setIsTechTreeOpen(true); setTechTreeSelectedId(techId); }}
                      coreId={i}
                    />
                  </div>
                ))}
              </div>
            ) : (
              /* Tabbed view: single editor */
              <CodeEditor
                ref={internals[activeCore]?.editorRef}
                code={code}
                onCodeChange={(v: string) => setCoreCode(activeCore, v)}
                onOpenTechTree={(techId: string) => { setIsTechTreeOpen(true); setTechTreeSelectedId(techId); }}
                coreId={activeCore}
              />
            )}
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "3px", backgroundColor: theme.bg3 }}>
              <div style={{ height: "100%", width: `${ramPercent}%`, backgroundColor: ramColor, transition: "width 0.2s, background-color 0.3s" }} />
            </div>
            <div style={{ position: "absolute", bottom: "6px", right: "8px", fontSize: "10px", fontFamily: theme.font, color: ramColor, opacity: 0.8 }}>
              {totalTokenCount}/{ram}
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
        <HintPopover
          hint={activeHints[0]}
          onDismiss={() => { if (activeHints[0]?.onDismiss) activeHints[0].onDismiss(); }}
          onHintClick={() => {}}
        />
      )}

      <TechTreeModal
        isOpen={isTechTreeOpen}
        initialSelectedTechId={techTreeSelectedId}
        onFocus={() => setTechTreeSelectedId(undefined)}
        onClose={() => setIsTechTreeOpen(false)}
        onOpenDocs={(sectionId: string) => {
          setIsTechTreeOpen(false);
          setTechTreeSelectedId(undefined);
          setRightTab("docs");
          setDocsScrollSection(sectionId);
        }}
      />

      {/* Snippets Modal */}
      {isSnippetsOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.7)" }} onClick={() => setIsSnippetsOpen(false)} />
          <div style={{ position: "relative", width: "90%", maxWidth: "420px", maxHeight: "80vh", backgroundColor: theme.bg, border: `1px solid ${theme.border}`, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", borderBottom: `1px solid ${theme.border}` }}>
              <span style={{ fontFamily: theme.font, fontSize: "11px", color: theme.primaryDim, letterSpacing: "2px" }}>SNIPPETS</span>
              <button onClick={() => setIsSnippetsOpen(false)} style={{ fontFamily: theme.font, fontSize: "12px", color: theme.primary, backgroundColor: "transparent", border: "none", cursor: "pointer" }}>X</button>
            </div>
            <div style={{ flex: 1, overflowY: "auto" }}>
              <SnippetsPanel currentCode={code} onLoad={(snippetCode: string) => { loadCoreCode(activeCore, snippetCode); setIsSnippetsOpen(false); }} />
            </div>
          </div>
        </div>
      )}
    {showPerf && <PerfOverlay />}
    </div>
    </ThemeContext.Provider>
  );
}
