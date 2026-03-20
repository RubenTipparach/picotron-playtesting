/**
 * Game State Store
 *
 * Uses Zustand for state management. Manages resources (A, B, C),
 * tech tree unlocks, and virtual time. Persists to localStorage.
 */

import { create } from "zustand";

const LOCAL_STORAGE_KEY = "incremental-coding-game-state";

// Default initial state
const DEFAULT_STATE = {
  resources: { A: 0, B: 0, C: 0, D: 0 },
  tech: {
    whileUnlocked: false,
    convertAToBUnlocked: false,
    varsUnlocked: false,
    mathFunctionsUnlocked: false,
    resourceCUnlocked: false,
    ifStatementsUnlocked: false,
    userFunctionsUnlocked: false,
    processingSpeed1Unlocked: false,
    stockMarketUnlocked: false,
  },
  virtualTime: 0,
  // Shop system
  credits: 0,
  ram: 256,       // max characters allowed in editor
  cpuLevel: 0,    // each level = 50% faster, cost doubles each level
  // Market state (persisted separately from live engine)
  market: null,
};

/**
 * Load saved game state from localStorage, merging with defaults
 * to handle new fields added in updates.
 */
function loadGameState() {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        resources: { ...DEFAULT_STATE.resources, ...parsed.resources },
        tech: { ...DEFAULT_STATE.tech, ...parsed.tech },
        virtualTime: parsed.virtualTime ?? DEFAULT_STATE.virtualTime,
        credits: parsed.credits ?? DEFAULT_STATE.credits,
        ram: parsed.ram ?? DEFAULT_STATE.ram,
        cpuLevel: parsed.cpuLevel ?? DEFAULT_STATE.cpuLevel,
        market: parsed.market ?? DEFAULT_STATE.market,
      };
    }
  } catch (error) {
    console.warn("Failed to load game state from localStorage", error);
  }
  return { ...DEFAULT_STATE };
}

/**
 * Save game state to localStorage.
 */
function saveGameState(state) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn("Failed to save game state to localStorage", error);
  }
}

/**
 * Zustand store for the game state.
 *
 * Provides methods to:
 * - Add/consume resources
 * - Unlock tech tree items
 * - Track virtual time
 * - Sync with localStorage
 * - Reset progress
 */
export const useGameStore = create((set, get) => {
  const initial = loadGameState();

  return {
    resources: initial.resources,
    tech: initial.tech,
    virtualTime: initial.virtualTime,
    credits: initial.credits,
    ram: initial.ram,
    cpuLevel: initial.cpuLevel,
    market: initial.market,

    /** Replace all resources */
    setResources: (resources) => {
      const state = { ...get(), resources };
      saveGameState(state);
      set({ resources });
    },

    /** Replace all tech */
    setTech: (tech) => {
      const state = { ...get(), tech };
      saveGameState(state);
      set({ tech });
    },

    /** Add amount to a single resource */
    addResource: (resourceName, amount) => {
      const current = get();
      const resources = { ...current.resources };
      resources[resourceName] += amount;
      const state = { ...current, resources };
      saveGameState(state);
      set({ resources });
    },

    /** Consume a single resource. Returns true if successful, false if insufficient. */
    consumeResource: (resourceName, amount) => {
      const current = get();
      if (current.resources[resourceName] >= amount) {
        const resources = { ...current.resources };
        resources[resourceName] -= amount;
        const state = { ...current, resources };
        saveGameState(state);
        set({ resources });
        return true;
      }
      return false;
    },

    /**
     * Consume multiple resources atomically.
     * @param {Array<{resource: string, amount: number}>} costs
     * @returns {boolean} true if all resources consumed, false if any insufficient
     */
    consumeResources: (costs) => {
      const current = get();
      // Check all resources are available first
      for (const cost of costs) {
        if (current.resources[cost.resource] < cost.amount) return false;
      }
      // Deduct all resources
      const resources = { ...current.resources };
      for (const cost of costs) {
        resources[cost.resource] -= cost.amount;
      }
      const state = { ...current, resources };
      saveGameState(state);
      set({ resources });
      return true;
    },

    /** Unlock a tech tree item by ID */
    unlockTech: (techId) => {
      const current = get();
      const tech = { ...current.tech };
      tech[techId] = true;
      const state = { ...current, tech };
      saveGameState(state);
      set({ tech });
    },

    /** Add seconds to virtual time */
    addVirtualTime: (seconds) => {
      const current = get();
      const virtualTime = current.virtualTime + seconds;
      const state = { ...current, virtualTime };
      saveGameState(state);
      set({ virtualTime });
    },

    /** Add credits */
    addCredits: (amount) => {
      const current = get();
      const credits = current.credits + amount;
      const state = { ...current, credits };
      saveGameState(state);
      set({ credits });
    },

    /** Spend credits. Returns true if successful. */
    spendCredits: (amount) => {
      const current = get();
      if (current.credits >= amount) {
        const credits = current.credits - amount;
        const state = { ...current, credits };
        saveGameState(state);
        set({ credits });
        return true;
      }
      return false;
    },

    /** Upgrade RAM capacity */
    upgradeRam: (newRam) => {
      const current = get();
      const state = { ...current, ram: newRam };
      saveGameState(state);
      set({ ram: newRam });
    },

    /** Save market state */
    saveMarket: (marketData) => {
      const current = get();
      const state = { ...current, market: marketData };
      saveGameState(state);
      set({ market: marketData });
    },

    /** Upgrade CPU level */
    upgradeCpu: () => {
      const current = get();
      const cpuLevel = current.cpuLevel + 1;
      const state = { ...current, cpuLevel };
      saveGameState(state);
      set({ cpuLevel });
    },

    /** Reload state from localStorage (for cross-tab sync) */
    syncFromLocalStorage: () => {
      const loaded = loadGameState();
      set({
        resources: loaded.resources,
        tech: loaded.tech,
        virtualTime: loaded.virtualTime,
        credits: loaded.credits,
        ram: loaded.ram,
        cpuLevel: loaded.cpuLevel,
        market: loaded.market,
      });
    },

    /** Reset all game progress */
    resetGameState: () => {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      set({
        resources: DEFAULT_STATE.resources,
        tech: DEFAULT_STATE.tech,
        virtualTime: DEFAULT_STATE.virtualTime,
        credits: DEFAULT_STATE.credits,
        ram: DEFAULT_STATE.ram,
        cpuLevel: DEFAULT_STATE.cpuLevel,
        market: DEFAULT_STATE.market,
      });
    },
  };
});
