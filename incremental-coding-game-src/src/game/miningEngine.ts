/**
 * Mining Engine
 *
 * Hash-based mining system for Resource E.
 * Players hash strings to find trailing zeros, earning 1 E per unique zero-suffix.
 * GPU upgrades allow batch hashing for faster mining.
 */

import { useGameStore } from "../store/gameStore";
import { GPU_TIER_CORES } from "./hardware";

// ─── Hash Function ───────────────────────────────────────────────────

/**
 * FNV-1a hash — deterministic, fast, non-cryptographic.
 * Same input always produces same output.
 */
function computeHash(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0; // unsigned 32-bit
}

/**
 * Get the number of hex digits for a given mining level.
 * Level 1 = 4 digits, Level 2 = 5 digits, etc.
 */
export function getHashDigits(level: number): number {
  return 3 + level;
}

/**
 * Hash a string and return hex output at the given digit count.
 * Input must be <= 16 characters.
 */
export function gameHash(input: string, digits: number): string {
  if (input.length > 16) {
    throw new Error("Hash input must be <= 16 characters");
  }
  const raw = computeHash(input);
  const maxVal = Math.pow(16, digits);
  const masked = raw % maxVal;
  return masked.toString(16).padStart(digits, "0");
}

/**
 * Count trailing zero characters in a hex string.
 */
export function getTrailingZeros(hex: string): number {
  let count = 0;
  for (let i = hex.length - 1; i >= 0; i--) {
    if (hex[i] === "0") count++;
    else break;
  }
  return count;
}

// ─── Mining Operations ───────────────────────────────────────────────

/**
 * Build the zero-suffix string for a given count.
 * e.g., count=3 → "000"
 */
function buildSuffix(zeros: number): string {
  return "0".repeat(zeros);
}

/**
 * Get all possible suffixes for a given level.
 * Level 1 (4 digits): ["0", "00", "000", "0000"]
 */
export function getPossibleSuffixes(level: number): string[] {
  const digits = getHashDigits(level);
  const suffixes: string[] = [];
  for (let i = 1; i <= digits; i++) {
    suffixes.push(buildSuffix(i));
  }
  return suffixes;
}

/**
 * Validate and submit a hash for mining.
 * Returns 1 if E was earned, throws on invalid submission.
 */
export function submitHashResult(input: string): number {
  const store = useGameStore.getState();
  const level = store.miningLevel;
  const digits = getHashDigits(level);

  if (typeof input !== "string" || input.length === 0 || input.length > 16) {
    throw new Error("submitHash() failed — input must be a string of 1-16 characters.");
  }

  const hex = gameHash(input, digits);
  const zeros = getTrailingZeros(hex);

  if (zeros === 0) {
    throw new Error(`submitHash() failed — hash "${hex}" has no trailing zeros. Keep searching!`);
  }

  const suffix = buildSuffix(zeros);
  const foundSuffixes = store.foundSuffixes;

  if (foundSuffixes.includes(suffix)) {
    throw new Error(`submitHash() failed — suffix "${suffix}" already found at this level.`);
  }

  // Award 1 E
  store.addResource("E", 1);
  store.addFoundSuffix(suffix);

  // Check if all suffixes at this level are found
  const allSuffixes = getPossibleSuffixes(level);
  const newFound = [...foundSuffixes, suffix];
  if (allSuffixes.every((s) => newFound.includes(s))) {
    store.advanceMiningLevel();
  }

  return 1;
}

/**
 * Batch hash for GPU mining.
 * Array length must exactly equal GPU core count.
 * Returns array of {input, output} pairs.
 */
export function gpuBatchHash(inputs: string[], gpuTier: number): Array<{ input: string; output: string }> {
  if (gpuTier <= 0) {
    throw new Error("gpuHash() failed — no GPU installed. Research GPU Tier 1.");
  }

  const requiredCores = GPU_TIER_CORES[gpuTier] || 0;
  if (inputs.length !== requiredCores) {
    throw new Error(`gpuHash() failed — array must have exactly ${requiredCores} elements (GPU T${gpuTier} has ${requiredCores} cores). Got ${inputs.length}.`);
  }

  const level = useGameStore.getState().miningLevel;
  const digits = getHashDigits(level);

  return inputs.map((input) => {
    if (typeof input !== "string" || input.length > 16) {
      return { input: String(input).slice(0, 16), output: "error" };
    }
    return { input, output: gameHash(input, digits) };
  });
}

/**
 * Get a summary of current mining state.
 */
export function getMiningSummary() {
  const store = useGameStore.getState();
  const digits = getHashDigits(store.miningLevel);
  const possibleSuffixes = getPossibleSuffixes(store.miningLevel);
  return {
    level: store.miningLevel,
    inputSize: 16,
    outputSize: digits,
    outputFormat: `${digits} hex digits (0-${"F".repeat(digits)})`,
    suffixesFound: store.foundSuffixes.length,
    suffixesTotal: possibleSuffixes.length,
    totalMined: store.totalEMined,
    eMarketActive: store.eMarketActive,
    marketAt: 1000,
    gpuTier: store.gpuTier,
    gpuCores: GPU_TIER_CORES[store.gpuTier] || 0,
  };
}

/**
 * Test if a string's hash would be a valid submission.
 * Returns { valid, hash, trailingZeros, suffix, alreadyFound } without submitting.
 */
export function testHashResult(input: string) {
  const store = useGameStore.getState();
  const level = store.miningLevel;
  const digits = getHashDigits(level);

  if (typeof input !== "string" || input.length === 0 || input.length > 16) {
    return { valid: false, hash: "", trailingZeros: 0, suffix: "", alreadyFound: false, reason: "Input must be 1-16 characters" };
  }

  const hex = gameHash(input, digits);
  const zeros = getTrailingZeros(hex);

  if (zeros === 0) {
    return { valid: false, hash: hex, trailingZeros: 0, suffix: "", alreadyFound: false, reason: "No trailing zeros" };
  }

  const suffix = "0".repeat(zeros);
  const alreadyFound = store.foundSuffixes.includes(suffix);

  return {
    valid: !alreadyFound,
    hash: hex,
    trailingZeros: zeros,
    suffix,
    alreadyFound,
    reason: alreadyFound ? `Suffix "${suffix}" already found` : "Valid — call submitHash() to claim",
  };
}
