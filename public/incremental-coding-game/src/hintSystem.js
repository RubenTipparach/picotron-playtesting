/**
 * Hint / Tutorial System
 *
 * Manages tutorial hints that guide the player through the game.
 * Tracks which hints have been seen via localStorage.
 */

const HINT_SEEN_PREFIX = "hint-seen-";
const ERROR_RUN_ATTEMPTS_KEY = "error-run-attempts";
const ERROR_RUN_HINT_SEEN_KEY = "error-run-hint-seen";

/**
 * Check if a hint has been seen/dismissed by the player.
 * @param {string} hintId
 * @returns {boolean}
 */
export function hasSeenHint(hintId) {
  try {
    const data = localStorage.getItem(`${HINT_SEEN_PREFIX}${hintId}`);
    return data ? JSON.parse(data).hasSeen : false;
  } catch {
    return false;
  }
}

/**
 * Mark a hint as seen/dismissed.
 * @param {string} hintId
 */
export function markHintSeen(hintId) {
  try {
    const data = { hasSeen: true, lastShown: Date.now() };
    localStorage.setItem(`${HINT_SEEN_PREFIX}${hintId}`, JSON.stringify(data));
  } catch (error) {
    console.warn("Failed to save hint state", error);
  }
}

/**
 * Reset all hint states (used when resetting the game).
 */
export function resetAllHints() {
  try {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith(HINT_SEEN_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
    localStorage.removeItem(ERROR_RUN_ATTEMPTS_KEY);
    localStorage.removeItem(ERROR_RUN_HINT_SEEN_KEY);
  } catch (error) {
    console.warn("Failed to reset all hints", error);
  }
}

// ─── Error Run Tracking ───────────────────────────────────────────────
// Tracks how many times the player tries to run code with errors,
// so we can show progressively more helpful hints.

/**
 * Get the number of times the player has tried to run code with a given hash.
 * @param {string} codeHash
 * @returns {number}
 */
export function getErrorRunAttempts(codeHash) {
  try {
    const data = localStorage.getItem(ERROR_RUN_ATTEMPTS_KEY);
    return (data && JSON.parse(data)[codeHash]?.count) || 0;
  } catch {
    return 0;
  }
}

/**
 * Increment the error run attempt counter for a code hash.
 * @param {string} codeHash
 */
export function incrementErrorRunAttempts(codeHash) {
  try {
    const data = localStorage.getItem(ERROR_RUN_ATTEMPTS_KEY);
    const attempts = data ? JSON.parse(data) : {};
    attempts[codeHash] = {
      count: (attempts[codeHash]?.count || 0) + 1,
      lastAttempt: Date.now(),
    };
    localStorage.setItem(ERROR_RUN_ATTEMPTS_KEY, JSON.stringify(attempts));
  } catch (error) {
    console.warn("Failed to save error run attempts", error);
  }
}

/**
 * Clear error run attempts for a code hash (called when code is fixed).
 * @param {string} codeHash
 */
export function clearErrorRunAttempts(codeHash) {
  try {
    const data = localStorage.getItem(ERROR_RUN_ATTEMPTS_KEY);
    if (!data) return;
    const attempts = JSON.parse(data);
    delete attempts[codeHash];
    localStorage.setItem(ERROR_RUN_ATTEMPTS_KEY, JSON.stringify(attempts));
  } catch (error) {
    console.warn("Failed to clear error run attempts", error);
  }
}

/**
 * Simple string hash for identifying code versions.
 * Used to track error run attempts per code version.
 * @param {string} str
 * @returns {string}
 */
export function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(36);
}

// ─── Hint Definitions ─────────────────────────────────────────────────

/**
 * Pre-defined tutorial hints shown at various game stages.
 */
export const HINT_DEFINITIONS = {
  "first-tutorial": {
    id: "first-tutorial",
    title: "Welcome Tutorial",
    message:
      "Welcome! Write code in the editor above and press Run to execute it. Start by calling `produceResourceA()` to gather resources.",
    isTutorial: true,
  },
  "loop-unlock": {
    id: "loop-unlock",
    title: "Loops Unlocked",
    message: "Loops unlocked! Try automating your code with a while loop:",
    codeExample: `while (true) {\n  produceResourceA()\n}`,
    isTutorial: true,
  },
  "error-run": {
    id: "error-run",
    title: "Code Has Errors",
    message:
      "Your code has errors. Check the red markers in the editor and fix them before running.",
    isTutorial: true,
  },
  "upgrades-available": {
    id: "upgrades-available",
    title: "Upgrades Available",
    message:
      "You have upgrades available! Open the Tech Tree (Ctrl+U) to unlock new features.",
    isTutorial: true,
  },
};
