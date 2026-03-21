/**
 * Code Validator
 *
 * Validates user code against locked tech features.
 * Returns validation errors for features used before being unlocked.
 */

import { useGameStore } from '../store/gameStore';
import { TECH_UNLOCKS } from './tech';

/**
 * Validate user code against locked tech features.
 * Returns an array of validation errors for features used before being unlocked.
 *
 * @param code - The user's source code
 */
export function validateCode(
  code: string
): Array<{ lineNumber: number; message: string; feature: string }> {
  const tech = useGameStore.getState().tech;
  const errors: Array<{ lineNumber: number; message: string; feature: string }> = [];

  code.split(/\r?\n/).forEach((line, index) => {
    const lineNumber = index + 1;
    const trimmed = line.trim();

    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith("//")) return;

    TECH_UNLOCKS.forEach((techNode) => {
      // Skip if already unlocked or has no validation rule
      if (tech[techNode.id] || !techNode.validationRegex || !techNode.validationErrorMessage) {
        return;
      }

      // Test the line against the locked feature's regex
      const regex = new RegExp(
        techNode.validationRegex.source,
        techNode.validationRegex.flags
      );

      if (regex.test(line)) {
        errors.push({
          lineNumber,
          message: techNode.validationErrorMessage,
          feature: techNode.id,
        });
      }
    });
  });

  return errors;
}
