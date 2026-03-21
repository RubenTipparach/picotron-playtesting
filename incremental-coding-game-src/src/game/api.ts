/**
 * Game API Functions
 *
 * These are the functions exposed to the player's code editor.
 * Each function simulates a "processing time" delay and manipulates
 * the game state (resources, virtual time).
 */

import { useGameStore } from "../store/gameStore";
import {
  getMarketValue as engineGetMarketValue,
  executeBuy,
  executeSell,
  addMarketProfit,
} from "./marketEngine";

// ─── Types & Interfaces ──────────────────────────────────────────────

export interface APICallContext {
  functionName: string;
  lineNumber?: number;
  onStart?: (lineNumber: number, functionName: string, duration: number) => void;
  onProgress?: (lineNumber: number, progress: number) => void;
  onComplete?: (lineNumber: number, functionName: string, duration: number) => void;
  onLog?: (message: string) => void;
  isCancelled?: () => boolean;
  throwIfCancelled?: () => void;
}

export interface API {
  produceResourceA(): Promise<number>;
  convertAToB(): Promise<number>;
  getResourceCount(resourceName: string): Promise<number>;
  log(...args: unknown[]): Promise<void>;
  convertBToC(): Promise<number>;
  makeResourceC(): Promise<number>;
  getMarketValue(resource: string): Promise<number>;
  buy(resource: string, amount?: number): Promise<number>;
  sell(resource: string, amount?: number): Promise<number>;
}

/** All API function names available in the game */
export const ALL_API_FUNCTIONS: string[] = [
  "produceResourceA",
  "convertAToB",
  "getResourceCount",
  "log",
  "convertBToC",
  "makeResourceC",
  "getMarketValue",
  "buy",
  "sell",
];

// ─── Speed Configuration ──────────────────────────────────────────────

/**
 * Check if running in test environment.
 */
function isTestEnvironment(): boolean {
  if (typeof import.meta !== "undefined" && (import.meta as any).vitest) return true;
  try {
    const proc = (globalThis as any).process;
    if (proc && proc.env && proc.env.NODE_ENV === "test") return true;
  } catch {}
  return typeof globalThis !== "undefined" && "vitest" in globalThis;
}

/**
 * Get speed override from URL param (?speed=0.5) or env var (VITE_API_SPEED).
 * Returns null if no override is set.
 */
function getSpeedOverride(): number | null {
  // Check URL parameter
  if (typeof window !== "undefined") {
    const param = new URLSearchParams(window.location.search).get("speed");
    if (param) {
      const value = parseFloat(param);
      if (!isNaN(value) && value >= 0 && value <= 1) return value;
    }
  }

  // Check environment variable
  try {
    const proc = (globalThis as any).process;
    if (proc && proc.env && proc.env.VITE_API_SPEED) {
      const value = parseFloat(proc.env.VITE_API_SPEED);
      if (!isNaN(value) && value >= 0 && value <= 1) return value;
    }
  } catch {}

  // In test mode, use near-instant speed
  return isTestEnvironment() ? 0.001 : null;
}

/**
 * Calculate the current processing speed multiplier.
 * Lower = faster. 1.0 = normal speed.
 * Accounts for speed overrides and tech upgrades.
 */
function getProcessingSpeed(): number {
  const override = getSpeedOverride();
  if (override !== null) return override;

  const tech = useGameStore.getState().tech;
  let speed = 1;

  // Processing Speed I tech reduces time by 20%
  if (tech.processingSpeed1Unlocked) {
    speed *= 0.8;
  }

  // CPU upgrades: each level adds 50% more IPS (cumulative)
  // IPS = 1.5^cpuLevel, so time multiplier = 1 / 1.5^cpuLevel
  const cpuLevel = useGameStore.getState().cpuLevel;
  if (cpuLevel > 0) {
    speed /= Math.pow(1.5, cpuLevel);
  }

  return speed;
}

// ─── Execution Timer ──────────────────────────────────────────────────

/**
 * Execute a game function with a timed delay and progress tracking.
 *
 * @param baseDelayMs - Base delay in milliseconds before speed multiplier
 * @param context - Execution context with callbacks
 * @param action - The actual game logic to execute after the delay
 */
export async function executeWithDelay(
  baseDelayMs: number,
  context: APICallContext,
  action: () => void | Promise<void>
): Promise<void> {
  context.throwIfCancelled?.();

  const speed = getProcessingSpeed();
  const actualDelay = Math.max(0, baseDelayMs * speed);
  const startTime = Date.now();
  const lineNumber = context.lineNumber || 0;
  const functionName = context.functionName;

  // Notify start
  if (!context.isCancelled?.()) {
    context.onStart?.(lineNumber, functionName, actualDelay);
  }

  let progressInterval: ReturnType<typeof setInterval> | null = null;
  let delayTimeout: ReturnType<typeof setTimeout> | null = null;
  let cancelCheckInterval: ReturnType<typeof setInterval> | null = null;

  try {
    if (context.isCancelled?.()) return;

    // Progress reporting interval (60fps)
    progressInterval = setInterval(() => {
      try {
        context.throwIfCancelled?.();
      } catch {
        if (progressInterval) {
          clearInterval(progressInterval);
          progressInterval = null;
        }
        return;
      }
      const elapsed = Date.now() - startTime;
      const percent = Math.min((elapsed / actualDelay) * 100, 100);
      context.onProgress?.(lineNumber, percent);
    }, 16);

    // Wait for the delay, checking for cancellation
    await new Promise<void>((resolve, reject) => {
      try {
        context.throwIfCancelled?.();
      } catch (error) {
        reject(error);
        return;
      }

      delayTimeout = setTimeout(() => resolve(), actualDelay);

      // Check for cancellation during the delay
      cancelCheckInterval = setInterval(() => {
        try {
          context.throwIfCancelled?.();
        } catch (error) {
          if (cancelCheckInterval) {
            clearInterval(cancelCheckInterval);
            cancelCheckInterval = null;
          }
          if (delayTimeout) {
            clearTimeout(delayTimeout);
            delayTimeout = null;
          }
          reject(error);
        }
      }, 16);
    });

    context.throwIfCancelled?.();

    // Execute the actual game action
    await action();

    context.throwIfCancelled?.();
  } catch (error) {
    if (
      (error instanceof Error && error.name === "CancellationError") ||
      !context.isCancelled?.()
    ) {
      throw error;
    }
  } finally {
    if (progressInterval) clearInterval(progressInterval);
    if (cancelCheckInterval) clearInterval(cancelCheckInterval);
    if (delayTimeout) clearTimeout(delayTimeout);

    if (!context.isCancelled?.()) {
      context.onProgress?.(lineNumber, 100);
      context.onComplete?.(lineNumber, functionName, actualDelay);
    }
  }
}

/**
 * Format a value for log display, similar to console.log behavior.
 */
function formatLogValue(value: unknown): string {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (typeof value === "string") return value;
  if (typeof value === "function") return `[Function: ${value.name || "anonymous"}]`;
  if (typeof value === "object") {
    try { return JSON.stringify(value, null, 2); } catch { return String(value); }
  }
  return String(value);
}

function formatLogMessage(...args: unknown[]): string {
  return args.map(formatLogValue).join(" ");
}

// ─── API Function Factory ─────────────────────────────────────────────

/**
 * Create the API object containing all game functions.
 * Each function uses executeWithDelay for timing and progress tracking.
 *
 * @param executionContext - Shared context for all API calls
 * @returns API object with all game functions
 */
export function createAPI(executionContext: APICallContext): API {
  /** Advance virtual time (market runs on its own timer now) */
  function advanceTime(seconds: number): void {
    useGameStore.getState().addVirtualTime(seconds);
  }

  const api: API = {
    /**
     * Produce 1 unit of Resource A.
     * Takes 2 seconds. Adds 2 virtual seconds.
     * @returns 1 if produced, 0 if cancelled
     */
    async produceResourceA(): Promise<number> {
      const context: APICallContext = {
        ...executionContext,
        functionName: "produceResourceA",
        lineNumber: executionContext.lineNumber,
      };

      await executeWithDelay(2000, context, () => {
        if (context.isCancelled?.()) return;
        useGameStore.getState().addResource("A", 1);
        advanceTime(2);
      });

      return context.isCancelled?.() ? 0 : 1;
    },

    /**
     * Convert 2 A into 1 B.
     * Takes 3 seconds. Adds 3 virtual seconds.
     * @returns 1 if successful, 0 if insufficient resources or cancelled
     */
    async convertAToB(): Promise<number> {
      const context: APICallContext = {
        ...executionContext,
        functionName: "convertAToB",
        lineNumber: executionContext.lineNumber,
      };
      let success = false;

      await executeWithDelay(3000, context, () => {
        if (context.isCancelled?.()) return;

        const store = useGameStore.getState();
        if (store.consumeResource("A", 2)) {
          store.addResource("B", 1);
          advanceTime(3);
          success = true;
        } else {
          const available = store.resources.A;
          const lineInfo =
            context.lineNumber !== undefined
              ? ` (line ${context.lineNumber})`
              : "";
          throw new Error(
            `convertAToB() failed${lineInfo} — not enough A. Need 2, have ${available}. Use if/getResourceCount to check first!`
          );
        }
      });

      return context.isCancelled?.() ? 0 : success ? 1 : 0;
    },

    /**
     * Get the current count of a resource.
     * Takes 1 second. Adds 1 virtual second.
     * @param resourceName - "A", "B", "C", or "D"
     * @returns Current resource count
     */
    async getResourceCount(resourceName: string): Promise<number> {
      const context: APICallContext = {
        ...executionContext,
        functionName: "getResourceCount",
        lineNumber: executionContext.lineNumber,
      };
      let count = 0;

      await executeWithDelay(1000, context, () => {
        if (context.isCancelled?.()) return;
        const resources = useGameStore.getState().resources;

        if (resourceName === "A") count = resources.A;
        else if (resourceName === "B") count = resources.B;
        else if (resourceName === "C") count = resources.C;
        else if (resourceName === "D") count = resources.D;

        advanceTime(1);
      });

      return context.isCancelled?.() ? 0 : count;
    },

    /**
     * Log a message to the game console.
     * Takes 0.5 seconds. Adds 0.5 virtual seconds.
     * @param args - Values to display
     */
    async log(...args: unknown[]): Promise<void> {
      const context: APICallContext = {
        ...executionContext,
        functionName: "log",
        lineNumber: executionContext.lineNumber,
      };

      await executeWithDelay(500, context, () => {
        advanceTime(0.5);
        executionContext.onLog?.(formatLogMessage(...args));
      });
    },

    /**
     * Convert 3 A and 1 B into 1 C.
     * Takes 3 seconds. Adds 3 virtual seconds.
     * @returns 1 if successful, 0 if insufficient resources or cancelled
     */
    async convertBToC(): Promise<number> {
      const context: APICallContext = {
        ...executionContext,
        functionName: "convertBToC",
        lineNumber: executionContext.lineNumber,
      };
      let produced = 0;

      await executeWithDelay(3000, context, () => {
        if (context.isCancelled?.()) return;

        const store = useGameStore.getState();
        if (
          store.consumeResources([
            { resource: "A", amount: 3 },
            { resource: "B", amount: 1 },
          ])
        ) {
          store.addResource("C", 1);
          advanceTime(3);
          produced = 1;
        } else {
          const availableA = store.resources.A;
          const availableB = store.resources.B;
          const lineInfo =
            context.lineNumber !== undefined
              ? ` (line ${context.lineNumber})`
              : "";
          throw new Error(
            `convertBToC() failed${lineInfo} — not enough resources. Need 3 A + 1 B, have ${availableA} A + ${availableB} B. Use if/getResourceCount to check first!`
          );
        }
      });

      return context.isCancelled?.() ? 0 : produced;
    },

    /** @deprecated Use convertBToC() instead */
    async makeResourceC(): Promise<number> {
      return api.convertBToC();
    },

    /**
     * Get the current market value of a resource.
     * Takes 1 second. Adds 1 virtual second.
     * @param resource - "A", "B", "C", or "D"
     * @returns Current market price
     */
    async getMarketValue(resource: string): Promise<number> {
      const context: APICallContext = {
        ...executionContext,
        functionName: "getMarketValue",
        lineNumber: executionContext.lineNumber,
      };
      let price = 0;

      await executeWithDelay(1000, context, () => {
        if (context.isCancelled?.()) return;
        advanceTime(1);
        price = engineGetMarketValue(resource);
      });

      return context.isCancelled?.() ? 0 : price;
    },

    /**
     * Buy a resource from the market using credits.
     * Takes 2 seconds. Adds 2 virtual seconds.
     * @param resource - "A", "B", "C", or "D"
     * @param amount - How many to buy (default 1)
     * @returns Amount bought, or 0 on failure
     */
    async buy(resource: string, amount: number = 1): Promise<number> {
      const context: APICallContext = {
        ...executionContext,
        functionName: "buy",
        lineNumber: executionContext.lineNumber,
      };
      let bought = 0;

      await executeWithDelay(2000, context, () => {
        if (context.isCancelled?.()) return;
        advanceTime(2);

        const store = useGameStore.getState();
        const r = String(resource).toUpperCase();
        const result = executeBuy(r, amount);
        if (!result.success) {
          const lineInfo = context.lineNumber !== undefined ? ` (line ${context.lineNumber})` : "";
          throw new Error(`buy("${resource}", ${amount}) failed${lineInfo} — invalid resource.`);
        }

        const cost = Math.ceil(result.cost);
        if (!store.spendCredits(cost)) {
          const lineInfo = context.lineNumber !== undefined ? ` (line ${context.lineNumber})` : "";
          throw new Error(
            `buy("${resource}", ${amount}) failed${lineInfo} — not enough credits. Need $${cost}, have $${store.credits}. Sell resources in Shop first!`
          );
        }

        store.addResource(r as any, amount);
        bought = amount;
      });

      return context.isCancelled?.() ? 0 : bought;
    },

    /**
     * Sell a resource on the market for credits.
     * Takes 2 seconds. Adds 2 virtual seconds.
     * @param resource - "A", "B", "C", or "D"
     * @param amount - How many to sell (default 1)
     * @returns Credits received, or 0 on failure
     */
    async sell(resource: string, amount: number = 1): Promise<number> {
      const context: APICallContext = {
        ...executionContext,
        functionName: "sell",
        lineNumber: executionContext.lineNumber,
      };
      let revenue = 0;

      await executeWithDelay(2000, context, () => {
        if (context.isCancelled?.()) return;
        advanceTime(2);

        const store = useGameStore.getState();
        const r = String(resource).toUpperCase();
        if (!store.consumeResource(r as any, amount)) {
          const available = store.resources[r as keyof typeof store.resources] || 0;
          const lineInfo = context.lineNumber !== undefined ? ` (line ${context.lineNumber})` : "";
          throw new Error(
            `sell("${resource}", ${amount}) failed${lineInfo} — not enough ${r}. Need ${amount}, have ${available}.`
          );
        }

        const result = executeSell(r, amount);
        if (!result.success) {
          store.addResource(r as any, amount);
          const lineInfo = context.lineNumber !== undefined ? ` (line ${context.lineNumber})` : "";
          throw new Error(`sell("${resource}", ${amount}) failed${lineInfo} — invalid resource.`);
        }

        const earned = result.revenue;
        store.addCredits(earned);
        addMarketProfit(earned);
        revenue = earned;
      });

      return context.isCancelled?.() ? 0 : revenue;
    },
  };

  return api;
}
