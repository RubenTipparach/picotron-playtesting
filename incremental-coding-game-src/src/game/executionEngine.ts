/**
 * Code Execution Engine
 *
 * Transforms user code for async execution, maps API calls to line numbers,
 * and manages the execution lifecycle (start, progress, cancel, errors).
 */

import { validateCode } from './codeValidator';
import { createAPI, ALL_API_FUNCTIONS } from './api';

// ─── Types ────────────────────────────────────────────────────────────

export type ExecutionEvent =
  | { type: 'lineChange'; lineNumber: number }
  | { type: 'functionStart'; lineNumber: number; functionName: string; duration: number }
  | { type: 'functionProgress'; lineNumber: number; progress: number }
  | { type: 'functionComplete'; lineNumber: number; functionName: string; duration: number }
  | { type: 'loopIteration'; lineNumber: number; codeLine: string; duration: number; iterationCount: number }
  | { type: 'log'; message: string }
  | { type: 'error'; error: Error; lineNumber?: number }
  | { type: 'complete' };

export interface ExecutionCallbacks {
  onEvent: (event: ExecutionEvent) => void;
}

interface SyntaxError {
  lineNumber: number;
  message: string;
}

interface ApiCallEntry {
  lineNumber: number;
  functionName: string;
}

interface LineMapEntry {
  lineNumber: number;
  functionName: string;
  startCol: number;
  endCol: number;
}

interface FunctionStackEntry {
  name: string;
  startLine: number;
  isAsync: boolean;
  hasAwait: boolean;
  type: 'arrow' | 'regular';
  entryBraceDepth: number;
}

// ─── Code Transformer ─────────────────────────────────────────────────

/**
 * Transform user code for async execution.
 *
 * This does several things:
 * 1. Inserts `await step(lineNumber)` calls after each statement
 *    so the executor can track which line is running and pause between lines
 * 2. Adds `await` before API function calls (produceResourceA, etc.)
 * 3. Automatically adds `async` to user-defined functions that contain `await`
 *
 * @param code - The user's source code
 * @param insertSteps - Whether to insert step() calls (default true)
 * @returns Transformed code ready for async execution
 */
export function transformCode(code: string, insertSteps: boolean = true): string {
  let lines = code.split(/\r?\n/);
  const userAsyncFunctions = new Set<string>();

  // ── Phase 1: Insert step() calls after each statement ──
  if (insertSteps) {
    lines = lines.map((line, index) => {
      const lineNumber = index + 1;
      const trimmed = line.trim();

      // Skip empty lines, comments, braces, function declarations, and step() calls
      if (
        !trimmed ||
        trimmed.length === 0 ||
        trimmed.startsWith("//") ||
        trimmed.startsWith("*") ||
        trimmed === "{" ||
        trimmed === "}" ||
        trimmed.startsWith("/*") ||
        trimmed.endsWith("*/") ||
        trimmed.includes("step(") ||
        /^(?:function|async\s+function)\s+/.test(trimmed) ||
        (/^(?:const|let|var)\s+/.test(trimmed) && /=>\s*\{?\s*$/.test(trimmed))
      ) {
        return line;
      }

      const isLoopHeader = /^(?:while|for)\s*\(/.test(trimmed);

      // Control flow statements (if, else, while, for, etc.)
      if (
        /^(?:if|else|while|for|switch|case|default|try|catch|finally)\s*\(/.test(trimmed) ||
        /^(?:if|else|while|for|switch|case|default|try|catch|finally)\s*\{/.test(trimmed)
      ) {
        const hasApiCall = ALL_API_FUNCTIONS.some((fn) =>
          new RegExp(`\\b${fn}\\s*\\(`).test(trimmed)
        );

        // For loops without API calls, insert step at the start of the body
        if (isLoopHeader && !hasApiCall && trimmed.endsWith("{")) {
          return line.replace(/\{\s*$/, `{ await step(${lineNumber});`);
        }

        // For control flow with API calls in the condition, insert step before
        if (hasApiCall && trimmed.endsWith("{")) {
          return `await step(${lineNumber}); ${line}`;
        }

        if (trimmed.endsWith(";")) {
          return line.replace(/;\s*$/, `; await step(${lineNumber});`);
        }
        if (trimmed.endsWith("}")) {
          return line.replace(/\}\s*$/, `await step(${lineNumber}); }`);
        }
        return line;
      }

      // Skip lines that end with operators (multi-line expressions)
      if (
        (/[+\-*/%=<>!&|,]\s*$/.test(trimmed) &&
          !trimmed.endsWith("++") &&
          !trimmed.endsWith("--") &&
          !trimmed.match(/[+\-*/%=<>!&|,]{2,}\s*$/)) ||
        /=>\s*\{?\s*$/.test(trimmed)
      ) {
        return line;
      }

      // Regular statements - append step() call
      if (trimmed.endsWith(";")) {
        return line.replace(/;\s*$/, `; await step(${lineNumber});`);
      }
      if (trimmed.endsWith("}")) {
        return line.replace(/\}\s*$/, `await step(${lineNumber}); }`);
      }
      return line + `; await step(${lineNumber});`;
    });
  }

  // ── Phase 2: Add `await` before API function calls ──
  lines = lines.map((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("//") || trimmed.startsWith("/*") || trimmed.startsWith("*")) return line;
    let result = line;
    for (const funcName of ALL_API_FUNCTIONS) {
      const pattern = new RegExp(
        `(^|[^\\w])(await\\s+)?(${funcName}\\s*\\()`,
        "g"
      );
      result = result.replace(pattern, (match, prefix, awaitKeyword, call) => {
        // Already has await - leave it
        if (awaitKeyword) return match;

        // The regex captures at most 1 non-word char as prefix,
        // so no keyword checks are needed here. Always add await.

        return prefix + "await " + call;
      });
    }
    return result;
  });

  // ── Phase 3: Auto-detect functions that need `async` ──
  // Iteratively finds functions containing `await` that aren't marked `async`
  let changed = true;
  let iterations = 0;
  const MAX_ITERATIONS = 10;

  while (changed && iterations < MAX_ITERATIONS) {
    changed = false;
    iterations++;

    // Track function scope via brace depth
    const functionStack: FunctionStackEntry[] = [];
    let braceDepth = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const openBraces = (line.match(/\{/g) || []).length;
      const closeBraces = (line.match(/\}/g) || []).length;
      braceDepth += openBraces - closeBraces;

      // Detect arrow function declarations
      const arrowMatch = line.match(
        /(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(?:async\s+)?(\([^)]*\)|[a-zA-Z_$][a-zA-Z0-9_$]*)\s*=>/
      );
      // Detect regular function declarations
      const funcMatch = line.match(
        /\b(?:async\s+)?function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/
      );

      if (arrowMatch) {
        functionStack.push({
          name: arrowMatch[1],
          startLine: i,
          isAsync: line.includes("async"),
          hasAwait: false,
          type: "arrow",
          entryBraceDepth: braceDepth + openBraces,
        });
      } else if (funcMatch) {
        functionStack.push({
          name: funcMatch[1],
          startLine: i,
          isAsync: line.includes("async"),
          hasAwait: false,
          type: "regular",
          entryBraceDepth: braceDepth + openBraces,
        });
      }

      // Track if current function scope uses await
      if (functionStack.length > 0 && /\bawait\b/.test(line)) {
        for (const func of functionStack) {
          func.hasAwait = true;
        }
      }

      // When exiting a function scope, check if it needs async
      if (closeBraces > 0 && functionStack.length > 0) {
        const currentFunc = functionStack[functionStack.length - 1];
        if (braceDepth < currentFunc.entryBraceDepth) {
          if (currentFunc.hasAwait && !currentFunc.isAsync) {
            const originalLine = lines[currentFunc.startLine];

            if (currentFunc.type === "regular") {
              if (!originalLine.includes("async")) {
                lines[currentFunc.startLine] = originalLine.replace(
                  /\bfunction\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/,
                  "async function $1("
                );
              }
            } else {
              if (!originalLine.includes("async")) {
                lines[currentFunc.startLine] = originalLine.replace(
                  /=\s*(\([^)]*\)|[a-zA-Z_$][a-zA-Z0-9_$]*)\s*=>/,
                  "= async $1 =>"
                );
              }
            }

            currentFunc.isAsync = true;
            userAsyncFunctions.add(currentFunc.name);
            changed = true;
          }
          functionStack.pop();
        }
      }
    }

    // Add `await` before calls to user-defined async functions
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      for (const funcName of userAsyncFunctions) {
        // Skip function declaration lines
        if (
          new RegExp(
            `(?:async\\s+)?function\\s+${funcName}\\s*\\(|(?:const|let|var)\\s+${funcName}\\s*=\\s*(?:async\\s+)?[^=]*=>`
          ).test(line)
        ) {
          continue;
        }

        const pattern = new RegExp(
          `(^|[^\\w])(await\\s+)?(${funcName}\\s*\\()`,
          "g"
        );
        const replaced = line.replace(pattern, (match, prefix, awaitKw, call) =>
          awaitKw ? match : prefix + "await " + call
        );

        if (replaced !== line) {
          lines[i] = replaced;
          changed = true;
        }
      }
    }
  }

  return lines.join("\n");
}

// ─── Line Map Builder ─────────────────────────────────────────────────

/**
 * Build a map of line numbers to API function calls in the transformed code.
 * Used to correlate executing API calls back to user's source lines.
 *
 * @param transformedCode
 * @returns Map of line numbers to arrays of API call entries
 */
export function buildLineMap(transformedCode: string): Map<number, Array<LineMapEntry>> {
  const lineMap = new Map<number, Array<LineMapEntry>>();

  transformedCode.split("\n").forEach((line, index) => {
    const lineNumber = index + 1;
    const trimmed = line.trim();
    if (trimmed.startsWith("//") || trimmed.startsWith("/*") || trimmed.startsWith("*")) return;
    const calls: LineMapEntry[] = [];

    ALL_API_FUNCTIONS.forEach((funcName) => {
      const pattern = new RegExp(`\\b${funcName}\\s*\\(`, "g");
      let match;
      while ((match = pattern.exec(line)) !== null) {
        calls.push({
          lineNumber,
          functionName: funcName,
          startCol: match.index + 1,
          endCol: match.index + funcName.length + 1,
        });
      }
    });

    if (calls.length > 0) {
      lineMap.set(lineNumber, calls);
    }
  });

  return lineMap;
}

// ─── Cancellation Error ───────────────────────────────────────────────

class CancellationError extends Error {
  constructor() {
    super("Execution cancelled");
    this.name = "CancellationError";
  }
}

// ─── Code Executor ────────────────────────────────────────────────────

/**
 * The main execution engine. Manages the lifecycle of running user code:
 * - Validates code (syntax + tech tree restrictions)
 * - Transforms code for async execution
 * - Creates a sandboxed execution environment with the game API
 * - Tracks progress, handles errors, supports cancellation
 */
export class CodeExecutor {
  isRunning: boolean;
  isCancelled: boolean;
  isPaused: boolean;
  currentLine: number | null;
  lineMap: Map<number, Array<LineMapEntry>>;
  callbacks: ExecutionCallbacks;
  cancellationError: CancellationError | null;
  breakpoints: Set<number>;

  constructor(callbacks: ExecutionCallbacks) {
    this.isRunning = false;
    this.isCancelled = false;
    this.isPaused = false;
    this.currentLine = null;
    this.lineMap = new Map();
    this.breakpoints = new Set();
    this.callbacks = callbacks;
    this.cancellationError = null;
  }

  /**
   * Execute user code.
   *
   * @param code - The user's source code
   * @throws If code has syntax errors, validation errors, or runtime errors
   */
  async execute(code: string): Promise<void> {
    if (this.isRunning) {
      throw new Error("Execution already in progress");
    }

    console.log("Executor: Starting execution");

    // ── Syntax check ──
    const syntaxErrors = this.checkSyntaxErrors(code);
    if (syntaxErrors.length > 0) {
      const messages = syntaxErrors.map(
        (e) => `Line ${e.lineNumber}: ${e.message}`
      );
      const error = new Error(`Syntax error:\n${messages.join("\n")}`);
      this.callbacks.onEvent({
        type: "error",
        error,
        lineNumber: syntaxErrors[0].lineNumber,
      });
      throw error;
    }

    // ── Tech tree validation ──
    const validationErrors = validateCode(code);
    if (validationErrors.length > 0) {
      const messages = validationErrors.map(
        (e) => `Line ${e.lineNumber}: ${e.message}`
      );
      const error = new Error(
        `Code validation failed:\n${messages.join("\n")}`
      );
      this.callbacks.onEvent({
        type: "error",
        error,
        lineNumber: validationErrors[0].lineNumber,
      });
      throw error;
    }

    // ── Setup ──
    this.isRunning = true;
    this.isCancelled = false;
    this.currentLine = null;
    this.cancellationError = new CancellationError();

    // ── Transform code ──
    const transformedCode = transformCode(code);
    this.lineMap = buildLineMap(transformedCode);

    // Build ordered list of API calls for tracking
    const apiCallSequence: ApiCallEntry[] = [];
    Array.from(this.lineMap.keys())
      .sort((a, b) => a - b)
      .forEach((lineNum) => {
        const calls = this.lineMap.get(lineNum);
        if (calls) {
          calls.forEach((call) => {
            apiCallSequence.push({
              lineNumber: lineNum,
              functionName: call.functionName,
            });
          });
        }
      });

    let callIndex = 0;

    try {
      // ── Create execution context ──
      const executionContext = {
        functionName: "",
        lineNumber: undefined as number | undefined,
        isCancelled: () => this.isCancelled,
        throwIfCancelled: () => {
          if (this.isCancelled && this.cancellationError) {
            throw this.cancellationError;
          }
        },
        onLog: (message: string) => {
          this.callbacks.onEvent({ type: "log", message });
        },
        onStart: (lineNumber: number, functionName: string, duration: number) => {
          if (this.isCancelled) return;
          this.currentLine = lineNumber;
          this.callbacks.onEvent({ type: "lineChange", lineNumber });
          this.callbacks.onEvent({
            type: "functionStart",
            lineNumber,
            functionName,
            duration,
          });
        },
        onProgress: (lineNumber: number, progress: number) => {
          if (this.isCancelled) return;
          this.callbacks.onEvent({
            type: "functionProgress",
            lineNumber,
            progress,
          });
        },
        onComplete: (lineNumber: number, functionName: string, duration: number) => {
          if (this.isCancelled) return;
          this.callbacks.onEvent({
            type: "functionComplete",
            lineNumber,
            functionName,
            duration,
          });
        },
      };

      // ── Create API with line tracking ──
      const rawApi = createAPI(executionContext);
      const executor = this;

      // Proxy wraps API calls to update the execution context's line number
      // based on the expected sequence of API calls
      const trackedApi = new Proxy(rawApi, {
        get(target: any, property: string) {
          const method = target[property];
          if (typeof method !== "function") return method;

          return function (this: any, ...args: any[]) {
            if (apiCallSequence.length > 0) {
              const expectedIndex = callIndex % apiCallSequence.length;
              const expected = apiCallSequence[expectedIndex];

              if (expected && expected.functionName === property) {
                executionContext.lineNumber = expected.lineNumber;
                executionContext.functionName = property;
              } else {
                // Search for matching call in sequence
                let found: ApiCallEntry | null = null;
                let searchIndex = expectedIndex;
                for (let i = 0; i < apiCallSequence.length && !found; i++) {
                  const candidate = apiCallSequence[searchIndex];
                  if (candidate && candidate.functionName === property) {
                    found = candidate;
                    break;
                  }
                  searchIndex =
                    (searchIndex + 1) % apiCallSequence.length;
                }

                if (found) {
                  executionContext.lineNumber = found.lineNumber;
                  executionContext.functionName = property;
                } else if (expected) {
                  executionContext.lineNumber = expected.lineNumber;
                  executionContext.functionName = property;
                } else {
                  executionContext.lineNumber =
                    executor.currentLine || undefined;
                  executionContext.functionName = property;
                }
              }
              callIndex++;
            } else {
              executionContext.lineNumber =
                executor.currentLine || undefined;
              executionContext.functionName = property;
            }

            return method.apply(this, args);
          };
        },
      });

      // ── Loop tracking state ──
      const codeLines = code.split(/\r?\n/);
      const loopStartTimes: Record<number, number> = {}; // lineNumber -> timestamp of current iteration start
      const loopIterationCounts: Record<number, number> = {}; // lineNumber -> count

      // ── Step function ──
      // Called between statements to track the current line and allow pausing
      const step = async (lineNumber: number): Promise<void> => {
        if (this.isCancelled) throw this.cancellationError;

        const originalLine = codeLines[lineNumber - 1];
        if (!originalLine || originalLine.trim().length === 0) return;
        if (originalLine.trim().startsWith("//")) return;

        this.currentLine = lineNumber;
        this.callbacks.onEvent({ type: "lineChange", lineNumber });

        // Detect loop headers for loop timing
        const trimmed = originalLine.trim();
        const isLoopHeader = /^(?:while|for)\s*\(/.test(trimmed);
        if (isLoopHeader) {
          const now = performance.now();
          if (loopStartTimes[lineNumber] != null) {
            // End of previous iteration — emit timing
            const iterDuration = now - loopStartTimes[lineNumber];
            loopIterationCounts[lineNumber] = (loopIterationCounts[lineNumber] || 0) + 1;
            this.callbacks.onEvent({
              type: "loopIteration",
              lineNumber,
              codeLine: trimmed,
              duration: iterDuration,
              iterationCount: loopIterationCounts[lineNumber],
            });
          }
          // Start timing next iteration
          loopStartTimes[lineNumber] = now;
        }

        // Step-once: re-pause immediately
        if (this._stepOnce) {
          this._stepOnce = false;
          this.isPaused = true;
        }

        // Check breakpoints — auto-pause if we hit one
        if (this.breakpoints.has(lineNumber)) {
          this.isPaused = true;
        }

        // Wait while paused (check every 100ms)
        while (this.isPaused) {
          if (this.isCancelled) throw this.cancellationError;
          await new Promise<void>((resolve) => setTimeout(resolve, 100));
        }

        // Brief pause between statements (250ms)
        const STEP_DELAY = 250;
        await new Promise<void>((resolve) => setTimeout(resolve, STEP_DELAY));

        if (this.isCancelled) throw this.cancellationError;
      };

      // ── Build and execute the script ──
      const wrappedCode = `
        return (async function(api, step) {
          const { produceResourceA, convertAToB, getResourceCount, getBalance, log, convertABToC, makeResourceC, getMarketValue, buy, sell, wait, sync, send } = api;
          ${transformedCode}
        })(api, step);
      `;

      let scriptFunction: Function;
      try {
        scriptFunction = new Function("api", "step", wrappedCode);
      } catch (parseError) {
        const error =
          parseError instanceof Error
            ? parseError
            : new Error(String(parseError));
        const message = error.message;

        // Try to extract line number from error
        let errorLine: number | undefined;
        const lineMatch = message.match(/(?:line|at line)\s+(\d+)/i);
        if (lineMatch) {
          errorLine = parseInt(lineMatch[1], 10);
        }

        // If no line found, try to find the problematic line
        if (!errorLine) {
          const codeLines = transformedCode.split("\n");
          for (let i = 0; i < codeLines.length; i++) {
            if (
              /\bawait\s+/.test(codeLines[i]) &&
              !/async\s+(function|\(|=>)/.test(
                transformedCode.substring(0, transformedCode.indexOf(codeLines[i]))
              )
            ) {
              errorLine = i + 1;
              break;
            }
          }
        }

        this.callbacks.onEvent({
          type: "error",
          error: new Error(
            `${message}${errorLine ? ` (likely at line ${errorLine} in your code)` : ""}\n\nThis usually means a function needs to be async but wasn't transformed correctly.\nCheck for functions that call API functions but aren't marked as async.`
          ),
          lineNumber: errorLine || undefined,
        });
        throw error;
      }

      // ── Run the script ──
      console.log("Executor: Calling script function");
      try {
        await scriptFunction(trackedApi, step);

        if (this.isCancelled) {
          console.log("Executor: Execution cancelled");
          return;
        }

        console.log("Executor: Script function completed");
        if (!this.isCancelled) {
          console.log("Executor: Emitting complete event");
          this.callbacks.onEvent({ type: "complete" });
        }
      } catch (runtimeError) {
        // Handle cancellation
        if (
          runtimeError instanceof Error &&
          runtimeError.name === "CancellationError"
        ) {
          console.log("Executor: Execution cancelled via error");
          return;
        }
        if (this.isCancelled) {
          console.log(
            "Executor: Error during cancelled execution (ignored)"
          );
          return;
        }

        this.isCancelled = true;
        let errorLine: number | undefined = this.currentLine || undefined;

        if (runtimeError instanceof Error) {
          // Try to extract line from error message
          const lineMatch = runtimeError.message.match(
            /(?:line|at line)\s+(\d+)/i
          );
          if (lineMatch) {
            errorLine = Math.max(1, parseInt(lineMatch[1], 10) - 2);
          } else if (runtimeError.stack) {
            // Try to extract from stack trace
            const stackLines = runtimeError.stack.split("\n");
            for (const stackLine of stackLines) {
              const match = stackLine.match(/:(\d+):(\d+)/);
              if (match) {
                const lineNum = parseInt(match[1], 10);
                if (lineNum > 2) {
                  errorLine = lineNum - 2;
                  break;
                }
              }
            }
          }

          // Special handling for async errors
          if (
            runtimeError.message.includes(
              "await is only valid in async"
            )
          ) {
            const enhancedError = new Error(
              `${runtimeError.message}${errorLine ? ` (line ${errorLine})` : ""}\n\nThis usually means a function that calls API functions needs to be async.\nThe transformer should handle this automatically - this may be a bug.\nTry making the function explicitly async, or check for nested function calls.`
            );
            enhancedError.stack = runtimeError.stack;
            this.callbacks.onEvent({
              type: "error",
              error: enhancedError,
              lineNumber: errorLine,
            });
            throw enhancedError;
          }
        }

        this.callbacks.onEvent({
          type: "error",
          error:
            runtimeError instanceof Error
              ? runtimeError
              : new Error(String(runtimeError)),
          lineNumber: errorLine,
        });
        throw runtimeError;
      }
    } catch (outerError) {
      this.isCancelled = true;
      this.isRunning = false;
      this.callbacks.onEvent({
        type: "error",
        error:
          outerError instanceof Error
            ? outerError
            : new Error(String(outerError)),
        lineNumber: this.currentLine || undefined,
      });
    } finally {
      this.isRunning = false;
      this.currentLine = null;
    }
  }

  /** Stop execution immediately */
  stop(): void {
    console.log("Executor: Stop requested");
    this.isCancelled = true;
    this.isPaused = false;
    this.isRunning = false;
    this.currentLine = null;
    this.callbacks.onEvent({ type: "complete" });
  }

  /** Pause execution at current position */
  pause(): void {
    if (this.isRunning && !this.isCancelled) {
      this.isPaused = true;
    }
  }

  /** Resume execution from paused state */
  resume(): void {
    this.isPaused = false;
  }

  /** Execute one step then pause again */
  stepOnce(): void {
    if (this.isPaused) {
      this.isPaused = false;
      // Will re-pause at next step() call due to _stepOnce flag
      this._stepOnce = true;
    }
  }
  private _stepOnce: boolean = false;

  /** Check if currently running */
  getRunning(): boolean {
    return this.isRunning;
  }

  /** Toggle a breakpoint on a line */
  toggleBreakpoint(line: number): void {
    if (this.breakpoints.has(line)) {
      this.breakpoints.delete(line);
    } else {
      this.breakpoints.add(line);
    }
  }

  /** Get all breakpoints */
  getBreakpoints(): Set<number> {
    return this.breakpoints;
  }

  /**
   * Check for basic syntax errors in user code.
   * Currently checks for common arrow function declaration mistakes.
   */
  checkSyntaxErrors(code: string): SyntaxError[] {
    const errors: SyntaxError[] = [];

    code.split(/\r?\n/).forEach((line, index) => {
      const lineNumber = index + 1;
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith("//")) return;

      // Check for missing '=' in arrow function: `const foo(x) => {` instead of `const foo = (x) => {`
      if (
        /(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\([^)]*\)\s*(?:\{|=>)/.test(line) &&
        !/(?:const|let|var)\s+[a-zA-Z_$][a-zA-Z0-9_$]*\s*=\s*\(/.test(line)
      ) {
        const nameMatch = line.match(
          /(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/
        );
        const funcName = nameMatch?.[1] || "function";

        errors.push({
          lineNumber,
          message: `Missing '=' in arrow function declaration. Did you mean: const ${funcName} = (params) => { ... }?`,
        });
      }
    });

    return errors;
  }
}
