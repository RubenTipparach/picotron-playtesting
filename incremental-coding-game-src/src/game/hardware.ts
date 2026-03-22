/**
 * Hardware System
 *
 * Shared constants and helpers for motherboards, CPU, RAM, and internet.
 */

// ─── Motherboard Specs ───────────────────────────────────────────────

export interface MotherboardSpec {
  maxRamSlots: number;
  maxCpuCores: number;
  maxGpuSlots: number;
  name: string;
}

export function getMotherboardSpec(level: number): MotherboardSpec {
  switch (level) {
    case 1: return { maxRamSlots: 4,   maxCpuCores: 1, maxGpuSlots: 0,  name: "M1" };
    case 2: return { maxRamSlots: 8,   maxCpuCores: 2, maxGpuSlots: 0,  name: "M2" };
    case 3: return { maxRamSlots: 16,  maxCpuCores: 4, maxGpuSlots: 0,  name: "M3" };
    case 4: return { maxRamSlots: 32,  maxCpuCores: 4, maxGpuSlots: 1,  name: "M4" };
    case 5: return { maxRamSlots: 48,  maxCpuCores: 4, maxGpuSlots: 4,  name: "M5" };
    case 6: return { maxRamSlots: 64,  maxCpuCores: 4, maxGpuSlots: 8,  name: "M6" };
    case 7: return { maxRamSlots: 96,  maxCpuCores: 4, maxGpuSlots: 12, name: "M7" };
    case 8: return { maxRamSlots: 128, maxCpuCores: 4, maxGpuSlots: 16, name: "M8" };
    default: return { maxRamSlots: 4,  maxCpuCores: 1, maxGpuSlots: 0,  name: "M1" };
  }
}

// ─── CPU Speed (Diminishing Returns) ─────────────────────────────────

/**
 * Get effective CPU speed multiplier with diminishing returns.
 * Uses logarithmic scaling capped at 11x total.
 *
 * Level 0 → 1x, Level 1 → 2.5x, Level 5 → 4.9x,
 * Level 10 → 6.2x, Level 20 → 7.5x, cap → 11x
 */
export function getEffectiveCpuSpeed(cpuLevel: number): number {
  if (cpuLevel <= 0) return 1;
  const rawSpeedup = Math.log2(cpuLevel + 1) * 1.5;
  const effectiveSpeedup = Math.min(rawSpeedup, 10);
  return 1 + effectiveSpeedup;
}

export const CPU_BASE_COST = 30;

/**
 * Get the cost of the next CPU upgrade.
 */
export function getCpuUpgradeCost(cpuLevel: number): number {
  return Math.round(CPU_BASE_COST * Math.pow(2, cpuLevel));
}

// ─── RAM ─────────────────────────────────────────────────────────────

export const BASE_RAM_TOKENS = 8;
/** Tokens per RAM module by tier */
export const RAM_TIER_TOKENS: Record<number, number> = {
  1: 8,
  2: 16,
  3: 32,
  4: 64,
  5: 128,
};

/** Cost per RAM module by tier */
export const RAM_TIER_COSTS: Record<number, number> = {
  1: 10,
  2: 100,
  3: 1000,
  4: 10000,
  5: 100000,
};

/**
 * Compute total RAM tokens from installed modules.
 */
export function getEffectiveRam(ramModules: number[]): number {
  return BASE_RAM_TOKENS + ramModules.reduce((sum, tier) => sum + (RAM_TIER_TOKENS[tier] || 8), 0);
}

// ─── GPU (Mining) ────────────────────────────────────────────────────

/** GPU cores per module tier */
export const GPU_TIER_CORES: Record<number, number> = {
  0: 0,
  1: 16,
  2: 64,
  3: 256,
  4: 1024,
  5: 4096,
};

/** Credit cost per GPU module by tier */
export const GPU_TIER_COSTS: Record<number, number> = {
  1: 50000,
  2: 250000,
  3: 1000000,
  4: 5000000,
  5: 25000000,
};

/**
 * Compute total GPU cores from installed modules.
 */
export function getEffectiveGpuCores(gpuModules: number[]): number {
  if (!gpuModules || !Array.isArray(gpuModules)) return 0;
  return gpuModules.reduce((sum, tier) => sum + (GPU_TIER_CORES[tier] || 0), 0);
}

// ─── Internet / Trade Volume ─────────────────────────────────────────

/**
 * Get max trade volume per transaction based on internet level.
 */
export function getMaxTradeVolume(internetLevel: number): number {
  switch (internetLevel) {
    case 0: return 1;
    case 1: return 5;
    case 2: return 25;
    case 3: return 100;
    default: return 100;
  }
}
