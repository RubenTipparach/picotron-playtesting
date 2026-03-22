/**
 * Mining Engine
 *
 * Hash-based mining system for Resource E.
 * Players hash strings to find trailing zeros, earning 1 E per unique hash value.
 * Multiple hashes with the same number of trailing zeros are allowed,
 * but the exact same hash output cannot be submitted twice.
 * GPU upgrades allow batch hashing for faster mining.
 */

import { useGameStore } from "../store/gameStore";
import { GPU_TIER_CORES, getEffectiveGpuCores } from "./hardware";

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
 * Rejects duplicate hash values, but allows same suffix pattern multiple times.
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

  // Check for duplicate input
  if (store.foundHashes.includes(input)) {
    throw new Error(`submitHash() failed — input "${input}" already submitted.`);
  }

  const suffix = buildSuffix(zeros);

  // Award 1 E and record the input
  store.addResource("E", 1);
  store.addFoundHash(input);
  store.addFoundSuffix(suffix);

  // Check if all suffix patterns at this level have been seen at least once
  const allSuffixes = getPossibleSuffixes(level);
  const currentSuffixes = store.foundSuffixes.includes(suffix)
    ? store.foundSuffixes
    : [...store.foundSuffixes, suffix];
  if (allSuffixes.every((s) => currentSuffixes.includes(s))) {
    store.advanceMiningLevel();
  }

  return 1;
}

/**
 * Batch hash for GPU mining.
 * Returns array of {input, output} pairs.
 */
export function gpuBatchHash(inputs: string[]): Array<{ input: string; output: string }> {
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
    hashesFound: store.foundHashes.length,
    totalMined: store.totalEMined,
    eMarketActive: store.eMarketActive,
    marketAt: 1000,
    gpuModules: store.gpuModules.length,
    gpuCores: getEffectiveGpuCores(store.gpuModules),
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

  const alreadyFound = store.foundHashes.includes(input);

  return {
    valid: !alreadyFound,
    hash: hex,
    trailingZeros: zeros,
    suffix: "0".repeat(zeros),
    alreadyFound,
    reason: alreadyFound ? `Input "${input}" already submitted` : "Valid — call submitHash() to claim",
  };
}
