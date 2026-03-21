/**
 * Game State Store
 *
 * Uses Zustand for state management. Manages resources (A, B, C, D),
 * tech tree unlocks, and virtual time. Persists to localStorage.
 */

import { create } from "zustand";
import { getEffectiveRam } from "../game/hardware";

const STORAGE_KEY = "incremental-coding-game-state";

// ─── Types & Interfaces ──────────────────────────────────────────────

export interface Resources {
  A: number;
  B: number;
  C: number;
  D: number;
  E: number;
}

export const RESOURCE_KEYS = ['A', 'B', 'C', 'D', 'E'] as const;
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
  motherboard4Unlocked: boolean;
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
  // Mining
  tryCatchUnlocked: boolean;
  resourceEUnlocked: boolean;
  digitalMiningUnlocked: boolean;
  gpuTier1Unlocked: boolean;
  gpuTier2Unlocked: boolean;
  gpuTier3Unlocked: boolean;
  gpuTier4Unlocked: boolean;
  gpuTier5Unlocked: boolean;
  // Storage
  kvStoreUnlocked: boolean;
  hddTier2Unlocked: boolean;
  hddTier3Unlocked: boolean;
  hddTier4Unlocked: boolean;
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
  // Mining
  miningLevel: number;
  totalEMined: number;
  foundSuffixes: string[];
  gpuTier: number;
  eMarketActive: boolean;
  testMode: boolean;
  // Storage
  kvStore: Record<string, string>;
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
  removeRamModule: (index: number) => number;
  setMotherboardLevel: (level: number) => void;
  setInternetLevel: (level: number) => void;
  addCpuCore: () => void;
  advanceMiningLevel: () => void;
  addFoundSuffix: (suffix: string) => void;
  setGpuTier: (tier: number) => void;
  setEMarketActive: () => void;
  setMarket: (marketData: Record<string, unknown> | null) => void;
  persistMarket: (marketData: Record<string, unknown> | null) => void;
  upgradeCpu: () => void;
  dbSet: (key: string, value: string) => boolean;
  dbGet: (key: string) => string | null;
  dbDelete: (key: string) => boolean;
  getKvStoreSize: () => number;
  getDriveCapacity: () => number;
  syncFromLocalStorage: () => void;
  resetGameState: () => void;
}

// Default initial state
const defaultState: GameState = {
  resources: { A: 0, B: 0, C: 0, D: 0, E: 0 },
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
    motherboard4Unlocked: false,
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
    // Mining
    tryCatchUnlocked: false,
    resourceEUnlocked: false,
    digitalMiningUnlocked: false,
    gpuTier1Unlocked: false,
    gpuTier2Unlocked: false,
    gpuTier3Unlocked: false,
    gpuTier4Unlocked: false,
    gpuTier5Unlocked: false,
    // Storage
    kvStoreUnlocked: false,
    hddTier2Unlocked: false,
    hddTier3Unlocked: false,
    hddTier4Unlocked: false,
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
  // Mining
  miningLevel: 1,
  totalEMined: 0,
  foundSuffixes: [],
  gpuTier: 0,
  eMarketActive: false,
  testMode: false,
  // Storage
  kvStore: {},
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
      if (!parsed.ramModules && parsed.ram && parsed.ram > 8) {
        const moduleCount = Math.floor((parsed.ram - 8) / 8);
        ramModules = Array(moduleCount).fill(1);
      }
      // Always recompute ram from modules (handles tier token changes)
      const ram = getEffectiveRam(ramModules);

      // Derive hardware levels from tech flags (handles saves from before onUnlock existed)
      const tech = { ...defaultState.tech, ...parsed.tech };
      let internetLevel = parsed.internetLevel ?? defaultState.internetLevel;
      if (tech.internet3Unlocked) internetLevel = Math.max(internetLevel, 3);
      else if (tech.internet2Unlocked) internetLevel = Math.max(internetLevel, 2);
      else if (tech.internet1Unlocked) internetLevel = Math.max(internetLevel, 1);

      let motherboardLevel = parsed.motherboardLevel ?? defaultState.motherboardLevel;
      if (tech.motherboard4Unlocked) motherboardLevel = Math.max(motherboardLevel, 4);
      else if (tech.motherboard3Unlocked) motherboardLevel = Math.max(motherboardLevel, 3);
      else if (tech.motherboard2Unlocked) motherboardLevel = Math.max(motherboardLevel, 2);

      let cpuCores = parsed.cpuCores ?? defaultState.cpuCores;
      if (tech.cpuCore4Unlocked) cpuCores = Math.max(cpuCores, 4);
      else if (tech.cpuCore3Unlocked) cpuCores = Math.max(cpuCores, 3);
      else if (tech.cpuCore2Unlocked) cpuCores = Math.max(cpuCores, 2);

      return {
        resources: { ...defaultState.resources, ...parsed.resources },
        tech,
        virtualTime: parsed.virtualTime ?? defaultState.virtualTime,
        credits: parsed.credits ?? defaultState.credits,
        ram,
        cpuLevel: parsed.cpuLevel ?? defaultState.cpuLevel,
        market: parsed.market ?? defaultState.market,
        shopBSold: parsed.shopBSold ?? defaultState.shopBSold,
        ramModules,
        motherboardLevel,
        cpuCores,
        internetLevel,
        miningLevel: parsed.miningLevel ?? defaultState.miningLevel,
        totalEMined: parsed.totalEMined ?? defaultState.totalEMined,
        foundSuffixes: parsed.foundSuffixes ?? defaultState.foundSuffixes,
        gpuTier: parsed.gpuTier ?? defaultState.gpuTier,
        eMarketActive: parsed.eMarketActive ?? defaultState.eMarketActive,
        testMode: false,
        kvStore: parsed.kvStore ?? defaultState.kvStore,
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

// Flush on Vite HMR so dev reloads don't lose state
if ((import.meta as any).hot) {
  (import.meta as any).hot.dispose(() => flushSave());
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
    miningLevel: initial.miningLevel,
    totalEMined: initial.totalEMined,
    foundSuffixes: initial.foundSuffixes,
    gpuTier: initial.gpuTier,
    eMarketActive: initial.eMarketActive,
    testMode: false,
    kvStore: initial.kvStore,

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
      set({ resources });
      saveGameStateToStorage({ ...get() });
    },

    /** Consume a single resource. Returns true if successful, false if insufficient. */
    consumeResource: (resourceName: ResourceKey, amount: number): boolean => {
      const current = get();
      if (current.resources[resourceName] >= amount) {
        const resources = { ...current.resources };
        resources[resourceName] -= amount;
        set({ resources });
        saveGameStateToStorage({ ...get() });
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
      for (const cost of costs) {
        if (current.resources[cost.resource] < cost.amount) return false;
      }
      const resources = { ...current.resources };
      for (const cost of costs) {
        resources[cost.resource] -= cost.amount;
      }
      set({ resources });
      saveGameStateToStorage({ ...get() });
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
      set({ credits });
      saveGameStateToStorage({ ...get() });
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
      const ram = getEffectiveRam(ramModules);
      const state = { ...current, ramModules, ram };
      saveGameStateToStorage(state);
      set({ ramModules, ram });
    },

    /** Remove a RAM module by index, returns its tier for refund calculation */
    removeRamModule: (index: number): number => {
      const current = get();
      if (index < 0 || index >= current.ramModules.length) return 0;
      const tier = current.ramModules[index];
      const ramModules = current.ramModules.filter((_, i) => i !== index);
      const ram = getEffectiveRam(ramModules);
      const state = { ...current, ramModules, ram };
      saveGameStateToStorage(state);
      set({ ramModules, ram });
      return tier;
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

    /** Advance mining to next difficulty level */
    advanceMiningLevel: () => {
      const current = get();
      const miningLevel = current.miningLevel + 1;
      const state = { ...current, miningLevel, foundSuffixes: [] };
      saveGameStateToStorage(state);
      set({ miningLevel, foundSuffixes: [] });
    },

    /** Record a found mining suffix */
    addFoundSuffix: (suffix: string) => {
      const current = get();
      const foundSuffixes = [...current.foundSuffixes, suffix];
      const totalEMined = current.totalEMined + 1;
      const eMarketActive = totalEMined >= 1000 || current.eMarketActive;
      const state = { ...current, foundSuffixes, totalEMined, eMarketActive };
      saveGameStateToStorage(state);
      set({ foundSuffixes, totalEMined, eMarketActive });
    },

    /** Set GPU tier */
    setGpuTier: (tier: number) => {
      const current = get();
      const state = { ...current, gpuTier: tier };
      saveGameStateToStorage(state);
      set({ gpuTier: tier });
    },

    /** Activate E market (after 1000 E mined) */
    setEMarketActive: () => {
      const current = get();
      const state = { ...current, eMarketActive: true };
      saveGameStateToStorage(state);
      set({ eMarketActive: true });
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

    /** Get the drive capacity in bytes based on unlocked HDD tiers */
    getDriveCapacity: () => {
      const tech = get().tech;
      if (tech.hddTier4Unlocked) return 65536;
      if (tech.hddTier3Unlocked) return 16384;
      if (tech.hddTier2Unlocked) return 4096;
      if (tech.kvStoreUnlocked) return 1024;
      return 0;
    },

    /** Get the current size of the KV store in bytes */
    getKvStoreSize: () => {
      const kvStore = get().kvStore;
      let size = 0;
      for (const key in kvStore) {
        size += key.length + kvStore[key].length;
      }
      return size;
    },

    /** Set a key-value pair in the KV store. Returns false if over capacity. */
    dbSet: (key: string, value: string): boolean => {
      const current = get();
      const capacity = current.getDriveCapacity();
      const kvStore = { ...current.kvStore };
      // Calculate new size: subtract old entry if exists, add new entry
      let size = current.getKvStoreSize();
      if (kvStore[key] !== undefined) {
        size -= key.length + kvStore[key].length;
      }
      size += key.length + value.length;
      if (size > capacity) return false;
      kvStore[key] = value;
      const state = { ...current, kvStore };
      saveGameStateToStorage(state);
      set({ kvStore });
      return true;
    },

    /** Get a value from the KV store. Returns null if not found. */
    dbGet: (key: string): string | null => {
      return get().kvStore[key] ?? null;
    },

    /** Delete a key from the KV store. Returns true if key existed. */
    dbDelete: (key: string): boolean => {
      const current = get();
      if (current.kvStore[key] === undefined) return false;
      const kvStore = { ...current.kvStore };
      delete kvStore[key];
      const state = { ...current, kvStore };
      saveGameStateToStorage(state);
      set({ kvStore });
      return true;
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
        miningLevel: loaded.miningLevel,
        totalEMined: loaded.totalEMined,
        foundSuffixes: loaded.foundSuffixes,
        gpuTier: loaded.gpuTier,
        eMarketActive: loaded.eMarketActive,
        kvStore: loaded.kvStore,
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
        miningLevel: defaultState.miningLevel,
        totalEMined: defaultState.totalEMined,
        foundSuffixes: defaultState.foundSuffixes,
        gpuTier: defaultState.gpuTier,
        eMarketActive: defaultState.eMarketActive,
        kvStore: defaultState.kvStore,
      });
    },
  };
});
