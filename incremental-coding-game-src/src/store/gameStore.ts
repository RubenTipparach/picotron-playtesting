/**
 * Game State Store
 *
 * Uses Zustand for state management. Manages resources (A, B, C, D),
 * tech tree unlocks, and virtual time. Persists to localStorage.
 */

import { create } from "zustand";

const STORAGE_KEY = "incremental-coding-game-state";

// ─── Types & Interfaces ──────────────────────────────────────────────

export interface Resources {
  A: number;
  B: number;
  C: number;
  D: number;
}

export const RESOURCE_KEYS = ['A', 'B', 'C', 'D'] as const;
export type ResourceKey = (typeof RESOURCE_KEYS)[number];

export interface TechUnlocks {
  whileUnlocked: boolean;
  convertAToBUnlocked: boolean;
  varsUnlocked: boolean;
  mathFunctionsUnlocked: boolean;
  resourceCUnlocked: boolean;
  ifStatementsUnlocked: boolean;
  userFunctionsUnlocked: boolean;
  processingSpeed1Unlocked: boolean;
  shopUnlocked: boolean;
  getBalanceUnlocked: boolean;
  stockMarketUnlocked: boolean;
  waitUnlocked: boolean;
  maxTradeUnlocked: boolean;
  resourceDUnlocked: boolean;
  // Hardware
  motherboard2Unlocked: boolean;
  motherboard3Unlocked: boolean;
  ramTier2Unlocked: boolean;
  ramTier3Unlocked: boolean;
  ramTier4Unlocked: boolean;
  ramTier5Unlocked: boolean;
  internet1Unlocked: boolean;
  internet2Unlocked: boolean;
  internet3Unlocked: boolean;
  cpuCore2Unlocked: boolean;
  cpuCore3Unlocked: boolean;
  cpuCore4Unlocked: boolean;
  syncFunctionUnlocked: boolean;
}

export interface GameState {
  resources: Resources;
  tech: TechUnlocks;
  virtualTime: number;
  credits: number;
  ram: number;
  cpuLevel: number;
  market: Record<string, unknown> | null;
  shopBSold: number;
  // Hardware
  ramModules: number[];
  motherboardLevel: number;
  cpuCores: number;
  internetLevel: number;
  testMode: boolean;
}

export interface GameActions {
  setResources: (resources: Resources) => void;
  setTech: (tech: TechUnlocks) => void;
  addResource: (resourceName: ResourceKey, amount: number) => void;
  consumeResource: (resourceName: ResourceKey, amount: number) => boolean;
  consumeResources: (costs: Array<{ resource: ResourceKey; amount: number }>) => boolean;
  unlockTech: (techId: keyof TechUnlocks) => void;
  addVirtualTime: (seconds: number) => void;
  addCredits: (amount: number) => void;
  spendCredits: (amount: number) => boolean;
  addShopBSold: (amount: number) => void;
  upgradeRam: (newRam: number) => void;
  installRamModule: (tier: number) => void;
  setMotherboardLevel: (level: number) => void;
  setInternetLevel: (level: number) => void;
  addCpuCore: () => void;
  setMarket: (marketData: Record<string, unknown> | null) => void;
  persistMarket: (marketData: Record<string, unknown> | null) => void;
  upgradeCpu: () => void;
  syncFromLocalStorage: () => void;
  resetGameState: () => void;
}

// Default initial state
const defaultState: GameState = {
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
    shopUnlocked: false,
    getBalanceUnlocked: false,
    stockMarketUnlocked: false,
    waitUnlocked: false,
    maxTradeUnlocked: false,
    resourceDUnlocked: false,
    // Hardware
    motherboard2Unlocked: false,
    motherboard3Unlocked: false,
    ramTier2Unlocked: false,
    ramTier3Unlocked: false,
    ramTier4Unlocked: false,
    ramTier5Unlocked: false,
    internet1Unlocked: false,
    internet2Unlocked: false,
    internet3Unlocked: false,
    cpuCore2Unlocked: false,
    cpuCore3Unlocked: false,
    cpuCore4Unlocked: false,
    syncFunctionUnlocked: false,
  },
  virtualTime: 0,
  // Shop system
  credits: 0,
  ram: 8,         // base tokens (8 + 8 per RAM module)
  cpuLevel: 0,
  // Market state (persisted separately from live engine)
  market: null,
  shopBSold: 0,
  // Hardware
  ramModules: [],
  motherboardLevel: 1,
  cpuCores: 1,
  internetLevel: 0,
  testMode: false,
};

/**
 * Load saved game state from localStorage, merging with defaults
 * to handle new fields added in updates.
 */
function loadGameState(): GameState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Migrate old RAM to module system
      let ramModules = parsed.ramModules ?? defaultState.ramModules;
      let ram = parsed.ram ?? defaultState.ram;
      if (!parsed.ramModules && parsed.ram && parsed.ram > 8) {
        const moduleCount = Math.floor((parsed.ram - 8) / 8);
        ramModules = Array(moduleCount).fill(1);
        ram = 8 + moduleCount * 8;
      }

      return {
        resources: { ...defaultState.resources, ...parsed.resources },
        tech: { ...defaultState.tech, ...parsed.tech },
        virtualTime: parsed.virtualTime ?? defaultState.virtualTime,
        credits: parsed.credits ?? defaultState.credits,
        ram,
        cpuLevel: parsed.cpuLevel ?? defaultState.cpuLevel,
        market: parsed.market ?? defaultState.market,
        shopBSold: parsed.shopBSold ?? defaultState.shopBSold,
        ramModules,
        motherboardLevel: parsed.motherboardLevel ?? defaultState.motherboardLevel,
        cpuCores: parsed.cpuCores ?? defaultState.cpuCores,
        internetLevel: parsed.internetLevel ?? defaultState.internetLevel,
        testMode: false,
      };
    }
  } catch (error) {
    console.warn("Failed to load game state from localStorage", error);
  }
  return { ...defaultState };
}

/**
 * Save game state to localStorage.
 */
let saveTimeout: ReturnType<typeof setTimeout> | null = null;
let pendingState: Omit<GameState, 'testMode'> | null = null;

function flushSave(): void {
  if (pendingState) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pendingState));
    } catch (error) {
      console.warn("Failed to save game state to localStorage", error);
    }
    pendingState = null;
  }
}

function saveGameStateToStorage(state: Omit<GameState, 'testMode'>): void {
  pendingState = state;
  if (!saveTimeout) {
    saveTimeout = setTimeout(() => {
      saveTimeout = null;
      flushSave();
    }, 500);
  }
}

// Flush on page unload so we don't lose data
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', flushSave);
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
export const useGameStore = create<GameState & GameActions>((set, get) => {
  const initial = loadGameState();

  return {
    resources: initial.resources,
    tech: initial.tech,
    virtualTime: initial.virtualTime,
    credits: initial.credits,
    ram: initial.ram,
    cpuLevel: initial.cpuLevel,
    market: initial.market,
    shopBSold: initial.shopBSold,
    ramModules: initial.ramModules,
    motherboardLevel: initial.motherboardLevel,
    cpuCores: initial.cpuCores,
    internetLevel: initial.internetLevel,
    testMode: false,

    /** Replace all resources */
    setResources: (resources: Resources) => {
      const state = { ...get(), resources };
      saveGameStateToStorage(state);
      set({ resources });
    },

    /** Replace all tech */
    setTech: (tech: TechUnlocks) => {
      const state = { ...get(), tech };
      saveGameStateToStorage(state);
      set({ tech });
    },

    /** Add amount to a single resource */
    addResource: (resourceName: ResourceKey, amount: number) => {
      const current = get();
      const resources = { ...current.resources };
      resources[resourceName] += amount;
      const state = { ...current, resources };
      saveGameStateToStorage(state);
      set({ resources });
    },

    /** Consume a single resource. Returns true if successful, false if insufficient. */
    consumeResource: (resourceName: ResourceKey, amount: number): boolean => {
      const current = get();
      if (current.resources[resourceName] >= amount) {
        const resources = { ...current.resources };
        resources[resourceName] -= amount;
        const state = { ...current, resources };
        saveGameStateToStorage(state);
        set({ resources });
        return true;
      }
      return false;
    },

    /**
     * Consume multiple resources atomically.
     * @returns true if all resources consumed, false if any insufficient
     */
    consumeResources: (costs: Array<{ resource: ResourceKey; amount: number }>): boolean => {
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
      saveGameStateToStorage(state);
      set({ resources });
      return true;
    },

    /** Unlock a tech tree item by ID */
    unlockTech: (techId: keyof TechUnlocks) => {
      const current = get();
      const tech = { ...current.tech };
      tech[techId] = true;
      const state = { ...current, tech };
      saveGameStateToStorage(state);
      set({ tech });
    },

    /** Add seconds to virtual time */
    addVirtualTime: (seconds: number) => {
      const current = get();
      const virtualTime = current.virtualTime + seconds;
      const state = { ...current, virtualTime };
      saveGameStateToStorage(state);
      set({ virtualTime });
    },

    /** Add credits */
    addCredits: (amount: number) => {
      const current = get();
      const credits = current.credits + amount;
      const state = { ...current, credits };
      saveGameStateToStorage(state);
      set({ credits });
    },

    /** Spend credits. Returns true if successful. */
    spendCredits: (amount: number): boolean => {
      const current = get();
      if (current.credits >= amount) {
        const credits = current.credits - amount;
        const state = { ...current, credits };
        saveGameStateToStorage(state);
        set({ credits });
        return true;
      }
      return false;
    },

    /** Track B resources sold in shop */
    addShopBSold: (amount: number) => {
      const current = get();
      const shopBSold = current.shopBSold + amount;
      const state = { ...current, shopBSold };
      saveGameStateToStorage(state);
      set({ shopBSold });
    },

    /** Upgrade RAM capacity */
    upgradeRam: (newRam: number) => {
      const current = get();
      const state = { ...current, ram: newRam };
      saveGameStateToStorage(state);
      set({ ram: newRam });
    },

    /** Install a RAM module of given tier, syncs ram token count */
    installRamModule: (tier: number) => {
      const current = get();
      const ramModules = [...current.ramModules, tier];
      const ram = 8 + ramModules.length * 8;
      const state = { ...current, ramModules, ram };
      saveGameStateToStorage(state);
      set({ ramModules, ram });
    },

    /** Set motherboard level */
    setMotherboardLevel: (level: number) => {
      const current = get();
      const state = { ...current, motherboardLevel: level };
      saveGameStateToStorage(state);
      set({ motherboardLevel: level });
    },

    /** Set internet level */
    setInternetLevel: (level: number) => {
      const current = get();
      const state = { ...current, internetLevel: level };
      saveGameStateToStorage(state);
      set({ internetLevel: level });
    },

    /** Add a CPU core */
    addCpuCore: () => {
      const current = get();
      const cpuCores = current.cpuCores + 1;
      const state = { ...current, cpuCores };
      saveGameStateToStorage(state);
      set({ cpuCores });
    },

    /** Update market state in Zustand (fast, no localStorage) */
    setMarket: (marketData: Record<string, unknown> | null) => {
      set({ market: marketData });
    },

    /** Persist market state to localStorage (called less frequently) */
    persistMarket: (marketData: Record<string, unknown> | null) => {
      const current = get();
      const state = { ...current, market: marketData };
      saveGameStateToStorage(state);
      set({ market: marketData });
    },

    /** Upgrade CPU level */
    upgradeCpu: () => {
      const current = get();
      const cpuLevel = current.cpuLevel + 1;
      const state = { ...current, cpuLevel };
      saveGameStateToStorage(state);
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
        shopBSold: loaded.shopBSold,
        ramModules: loaded.ramModules,
        motherboardLevel: loaded.motherboardLevel,
        cpuCores: loaded.cpuCores,
        internetLevel: loaded.internetLevel,
      });
    },

    /** Reset all game progress */
    resetGameState: () => {
      localStorage.removeItem(STORAGE_KEY);
      set({
        resources: defaultState.resources,
        tech: defaultState.tech,
        virtualTime: defaultState.virtualTime,
        credits: defaultState.credits,
        ram: defaultState.ram,
        cpuLevel: defaultState.cpuLevel,
        market: defaultState.market,
        shopBSold: defaultState.shopBSold,
        ramModules: defaultState.ramModules,
        motherboardLevel: defaultState.motherboardLevel,
        cpuCores: defaultState.cpuCores,
        internetLevel: defaultState.internetLevel,
      });
    },
  };
});
