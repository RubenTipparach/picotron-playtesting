/**
 * Multi-Core State Hook
 *
 * Manages per-core state: code, executor, editor ref, execution status.
 * Replaces the single-executor pattern in App.tsx.
 */

import { useState, useRef, useEffect, useCallback, createRef } from "react";
import { CodeExecutor } from "../game/executionEngine";
import type { ExecutionEvent } from "../game/executionEngine";
import { validateCode } from "../game/codeValidator";
import { resetSyncBus } from "../game/syncBus";
import { trackEvent } from "../utils/perfMonitor";
import type { CodeEditorHandle } from "../components/CodeEditor";

const CODE_STORAGE_KEY = "incremental-coding-game-code";
const CORE_ENABLED_KEY = "core-enabled-states";

function coreStorageKey(i: number): string {
  return i === 0 ? CODE_STORAGE_KEY : `code-core-${i}`;
}

function loadCoreEnabledStates(): boolean[] {
  try {
    const stored = localStorage.getItem(CORE_ENABLED_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveCoreEnabledStates(states: boolean[]): void {
  try {
    localStorage.setItem(CORE_ENABLED_KEY, JSON.stringify(states));
  } catch {}
}

function loadCoreCode(i: number): string {
  try {
    return localStorage.getItem(coreStorageKey(i)) || (i === 0 ? "produceResourceA()" : "");
  } catch {
    return i === 0 ? "produceResourceA()" : "";
  }
}

function saveCoreCode(i: number, code: string): void {
  try {
    localStorage.setItem(coreStorageKey(i), code);
  } catch {}
}

export interface CoreState {
  code: string;
  savedCode: string;
  isRunning: boolean;
  enabled: boolean;
  currentLine: number | null;
  currentFunction: string;
}

interface CoreInternal {
  executor: CodeExecutor;
  editorRef: React.RefObject<CodeEditorHandle>;
}

interface UseMultiCoreResult {
  cores: CoreState[];
  internals: CoreInternal[];
  setCode: (coreIndex: number, code: string) => void;
  loadCode: (coreIndex: number, code: string) => void;
  saveCode: (coreIndex: number) => void;
  saveAllCodes: () => void;
  runAll: (ram: number, countTokens: (s: string) => number) => string | null;
  stopAll: () => void;
  pauseAll: () => void;
  resumeAll: () => void;
  stepAll: () => void;
  toggleCore: (coreIndex: number) => void;
  isAnyRunning: boolean;
  isAnyPaused: boolean;
}

export function useMultiCore(
  cpuCores: number,
  appendLog: (entry: { type: string; message: string; timestamp: number }) => void,
  onStatsEvent?: (event: ExecutionEvent, coreIndex: number, savedCode: string) => void
): UseMultiCoreResult {
  // Core state (triggers re-renders for UI)
  const [coreStates, setCoreStates] = useState<CoreState[]>(() => {
    const enabledStates = loadCoreEnabledStates();
    return Array.from({ length: cpuCores }, (_, i) => {
      const savedCode = loadCoreCode(i);
      return {
        code: savedCode,
        savedCode,
        isRunning: false,
        enabled: enabledStates[i] ?? true,
        currentLine: null,
        currentFunction: "",
      };
    });
  });

  // Internal refs (no re-renders)
  const internalsRef = useRef<CoreInternal[]>([]);
  const coreStatesRef = useRef(coreStates);
  coreStatesRef.current = coreStates;

  // Status update throttle
  const statusFlushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingStatus = useRef<Map<number, { line: number | null; fn: string }>>(new Map());

  const flushStatus = useCallback(() => {
    statusFlushTimer.current = null;
    const updates = new Map(pendingStatus.current);
    pendingStatus.current.clear();
    if (updates.size === 0) return;

    setCoreStates((prev) => {
      const next = [...prev];
      for (const [i, status] of updates) {
        if (next[i]) {
          next[i] = { ...next[i], currentLine: status.line, currentFunction: status.fn };
        }
      }
      return next;
    });
  }, []);

  const scheduleStatusFlush = useCallback(() => {
    if (!statusFlushTimer.current) {
      statusFlushTimer.current = setTimeout(flushStatus, 250);
    }
  }, [flushStatus]);

  // Initialize or resize cores
  useEffect(() => {
    const current = internalsRef.current;

    // Add new cores if needed
    while (current.length < cpuCores) {
      const coreIndex = current.length;
      const editorRef = createRef<CodeEditorHandle>();

      const executor = new CodeExecutor({
        onEvent: (event: ExecutionEvent) => {
          trackEvent(`evt:${event.type}`);

          // Forward stats events to App
          if (onStatsEvent) {
            const coreState = coreStatesRef.current[coreIndex];
            onStatsEvent(event, coreIndex, coreState?.savedCode || "");
          }

          // Push visual events to editor
          const ref = internalsRef.current[coreIndex]?.editorRef;
          if (ref?.current?.pushEvent) {
            ref.current.pushEvent(event);
          }

          // Update status for tab labels
          if (event.type === "lineChange") {
            pendingStatus.current.set(coreIndex, {
              line: event.lineNumber,
              fn: pendingStatus.current.get(coreIndex)?.fn || "",
            });
            scheduleStatusFlush();
          } else if (event.type === "functionStart") {
            pendingStatus.current.set(coreIndex, {
              line: pendingStatus.current.get(coreIndex)?.line || null,
              fn: event.functionName,
            });
            scheduleStatusFlush();
          } else if (event.type === "log") {
            const prefix = cpuCores > 1 ? `[Core ${coreIndex + 1}] ` : "";
            const msg = String(event.message);
            const isWarning = msg.startsWith("\u26A0\uFE0F Warning:");
            appendLog({ type: isWarning ? "warning" : "log", message: prefix + msg, timestamp: Date.now() });
          } else if (event.type === "error") {
            const prefix = cpuCores > 1 ? `[Core ${coreIndex + 1}] ` : "";
            setCoreStates((prev) => {
              const next = [...prev];
              if (next[coreIndex]) next[coreIndex] = { ...next[coreIndex], isRunning: false };
              return next;
            });
            appendLog({
              type: "error",
              message: `${prefix}ERROR: ${event.error.message}${event.lineNumber ? ` (line ${event.lineNumber})` : ""}`,
              timestamp: Date.now(),
            });
          } else if (event.type === "complete") {
            setCoreStates((prev) => {
              const next = [...prev];
              if (next[coreIndex]) {
                next[coreIndex] = { ...next[coreIndex], isRunning: false, currentLine: null, currentFunction: "" };
              }
              return next;
            });
          }
        },
      });

      current.push({ executor, editorRef });

      // Ensure state array matches
      setCoreStates((prev) => {
        if (prev.length <= coreIndex) {
          const savedCode = loadCoreCode(coreIndex);
          return [...prev, { code: savedCode, savedCode, isRunning: false, enabled: true, currentLine: null, currentFunction: "" }];
        }
        return prev;
      });
    }

    internalsRef.current = current;
  }, [cpuCores, appendLog, scheduleStatusFlush]);

  const setCode = useCallback((coreIndex: number, code: string) => {
    setCoreStates((prev) => {
      const next = [...prev];
      if (next[coreIndex]) next[coreIndex] = { ...next[coreIndex], code };
      return next;
    });
  }, []);

  const loadCode = useCallback((coreIndex: number, newCode: string) => {
    saveCoreCode(coreIndex, newCode);
    setCoreStates((prev) => {
      const next = [...prev];
      if (next[coreIndex]) next[coreIndex] = { ...next[coreIndex], code: newCode, savedCode: newCode };
      return next;
    });
  }, []);

  const saveCode = useCallback((coreIndex: number) => {
    setCoreStates((prev) => {
      const next = [...prev];
      if (next[coreIndex]) {
        next[coreIndex] = { ...next[coreIndex], savedCode: next[coreIndex].code };
        saveCoreCode(coreIndex, next[coreIndex].code);
      }
      return next;
    });
  }, []);

  const saveAllCodes = useCallback(() => {
    setCoreStates((prev) => {
      const next = prev.map((core, i) => {
        saveCoreCode(i, core.code);
        return { ...core, savedCode: core.code };
      });
      return next;
    });
  }, []);

  const runAll = useCallback((ram: number, countTokens: (s: string) => number): string | null => {
    const states = coreStates;
    const internals = internalsRef.current;

    // RAM check: sum enabled cores
    let totalTokens = 0;
    for (let i = 0; i < Math.min(cpuCores, states.length); i++) {
      if (states[i].enabled) totalTokens += countTokens(states[i].savedCode);
    }
    if (totalTokens > ram) {
      return `Code exceeds RAM limit (${totalTokens}/${ram} tokens across cores). Buy more RAM in the Shop.`;
    }

    // Validate enabled cores
    for (let i = 0; i < Math.min(cpuCores, states.length); i++) {
      if (!states[i].enabled) continue;
      const errors = validateCode(states[i].savedCode);
      if (errors.length > 0) {
        return `Core ${i + 1}: ${errors.map((e) => `Line ${e.lineNumber}: ${e.message}`).join(", ")}`;
      }
    }

    // Start enabled cores
    setCoreStates((prev) =>
      prev.map((core, i) => (i < cpuCores && core.enabled ? { ...core, isRunning: true } : core))
    );

    for (let i = 0; i < Math.min(cpuCores, internals.length, states.length); i++) {
      if (!states[i].enabled) continue;
      const executor = internals[i].executor;
      if (!executor.getRunning()) {
        executor.execute(states[i].savedCode).catch(() => {
          // Errors handled in onEvent callback
        });
      }
    }

    return null; // success
  }, [coreStates, cpuCores]);

  const stopAll = useCallback(() => {
    const internals = internalsRef.current;
    for (let i = 0; i < internals.length; i++) {
      internals[i].executor.stop();
      internals[i].editorRef.current?.clearDecorations?.();
    }
    resetSyncBus();
    setPaused(false);
    setCoreStates((prev) =>
      prev.map((core) => ({ ...core, isRunning: false, currentLine: null, currentFunction: "" }))
    );
  }, []);

  const toggleCore = useCallback((coreIndex: number) => {
    setCoreStates((prev) => {
      const next = [...prev];
      if (next[coreIndex]) {
        // If running, stop it first
        if (next[coreIndex].isRunning) {
          internalsRef.current[coreIndex]?.executor.stop();
          internalsRef.current[coreIndex]?.editorRef.current?.clearDecorations?.();
        }
        next[coreIndex] = { ...next[coreIndex], enabled: !next[coreIndex].enabled, isRunning: false };
      }
      saveCoreEnabledStates(next.map((c) => c.enabled));
      return next;
    });
  }, []);

  const isAnyRunning = coreStates.some((c) => c.isRunning);
  const [paused, setPaused] = useState(false);

  const pauseAll = useCallback(() => {
    for (const internal of internalsRef.current) {
      internal.executor.pause();
    }
    setPaused(true);
  }, []);

  const resumeAll = useCallback(() => {
    for (const internal of internalsRef.current) {
      internal.executor.resume();
    }
    setPaused(false);
  }, []);

  const stepAll = useCallback(() => {
    for (const internal of internalsRef.current) {
      internal.executor.stepOnce();
    }
    // stays paused — stepOnce re-pauses after one step
  }, []);

  const isAnyPaused = paused;

  return {
    cores: coreStates,
    internals: internalsRef.current,
    setCode,
    loadCode,
    saveCode,
    saveAllCodes,
    runAll,
    stopAll,
    toggleCore,
    pauseAll,
    resumeAll,
    stepAll,
    isAnyRunning,
    isAnyPaused,
  };
}
