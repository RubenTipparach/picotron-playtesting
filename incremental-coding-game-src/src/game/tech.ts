/**
 * Tech Tree Definitions
 *
 * Defines all unlockable technologies, their costs, dependencies,
 * and code validation rules that gate language features.
 */

import { useGameStore } from '../store/gameStore';
import { getMarketState } from './marketEngine';
import type { Resources, TechUnlocks, ResourceKey } from '../store/gameStore';

export interface TechUnlock {
  id: keyof TechUnlocks;
  name: string;
  description: string;
  threshold: (resources: Resources) => boolean;
  unlocked: boolean;
  cost: Array<{ resource: ResourceKey; amount: number }>;
  validationRegex?: RegExp;
  validationErrorMessage?: string;
  icon: string;
  dependencies?: string[];
  position?: { row: number; col: number };
  progressInfo?: () => { current: number; target: number; label: string };
}

/**
 * All tech tree nodes.
 * Each node defines:
 * - id: Matches a key in the game state's `tech` object
 * - name: Display name
 * - description: What the tech unlocks
 * - threshold: Function to check if resources meet the unlock requirement
 * - cost: Resources consumed when unlocking
 * - validationRegex: Pattern that's forbidden in code until this tech is unlocked
 * - validationErrorMessage: Error shown when using a locked feature
 * - icon: Display icon
 * - dependencies: Tech IDs that must be unlocked first
 * - position: Grid position in the tech tree UI { row, col }
 */
export const TECH_UNLOCKS: TechUnlock[] = [
  {
    id: "whileUnlocked",
    name: "While Loops",
    description: "You can now use while loops to automate your code",
    threshold: (resources) => resources.A >= 5,
    cost: [{ resource: "A", amount: 5 }],
    unlocked: false,
    validationRegex: /\bwhile\s*\(/,
    validationErrorMessage:
      "While loops are not unlocked yet. Produce 5 A to unlock them.",
    icon: "\u221E",
    dependencies: [],
    position: { row: 0, col: 0 },
  },
  {
    id: "convertAToBUnlocked",
    name: "Resource Conversion",
    description: "Unlock convertAToB() to convert 2 A into 1 B",
    threshold: (resources) => resources.A >= 15,
    cost: [{ resource: "A", amount: 15 }],
    unlocked: false,
    validationRegex: /\bconvertAToB\s*\(/,
    validationErrorMessage:
      "convertAToB() is not unlocked yet. Produce 15 A to unlock it.",
    icon: "\uD83D\uDFEA",
    dependencies: ["whileUnlocked"],
    position: { row: 0, col: 1 },
  },
  {
    id: "shopUnlocked",
    name: "Shop",
    description: "Unlock the Shop tab. Sell resources for credits, then buy RAM and CPU upgrades",
    threshold: (resources) => resources.A >= 10 && resources.B >= 4,
    cost: [
      { resource: "A", amount: 10 },
      { resource: "B", amount: 4 },
    ],
    unlocked: false,
    icon: "\uD83D\uDED2",
    dependencies: ["convertAToBUnlocked"],
    position: { row: 0, col: 2 },
  },
  {
    id: "varsUnlocked",
    name: "Variables",
    description:
      "Functions return values. Try using variables to store results",
    threshold: (resources) => resources.B >= 2,
    cost: [{ resource: "B", amount: 2 }],
    unlocked: false,
    validationRegex: /^\s*(let|const|var)\s+/,
    validationErrorMessage:
      "Variables are not unlocked yet. Produce 2 B to unlock them.",
    icon: "x",
    dependencies: ["convertAToBUnlocked"],
    position: { row: 1, col: 0 },
  },
  {
    id: "mathFunctionsUnlocked",
    name: "Math Operators",
    description:
      "Unlock basic math operators: +, -, *, /, %, +=, -=, *=, /=, %=, ++, --",
    threshold: (resources) => resources.B >= 10,
    cost: [{ resource: "B", amount: 10 }],
    unlocked: false,
    validationRegex:
      /[+\-*/%]=|\+\+|--|[+\*/%]|[a-zA-Z0-9_\)\]\}]\s*-\s*[a-zA-Z0-9_\(\[\{]/,
    validationErrorMessage:
      "Math operators are not unlocked yet. Produce 10 B to unlock them.",
    icon: "\u00B1",
    dependencies: ["varsUnlocked"],
    position: { row: 2, col: 1 },
  },
  {
    id: "resourceCUnlocked",
    name: "Resource Conversion 2",
    description: "Unlock convertBToC()",
    threshold: (resources) => resources.B >= 10,
    cost: [
      { resource: "A", amount: 20 },
      { resource: "B", amount: 10 },
    ],
    unlocked: false,
    validationRegex: /\b(convertBToC|makeResourceC)\s*\(/,
    validationErrorMessage:
      "Resource C is not unlocked yet. Produce 10 B to unlock it.",
    icon: "\uD83D\uDFE7",
    dependencies: ["convertAToBUnlocked"],
    position: { row: 1, col: 2 },
  },
  {
    id: "ifStatementsUnlocked",
    name: "If Statements",
    description: "Use conditional logic with if/else statements. You'll need these \u2014 functions now halt on failure!",
    threshold: (resources) => resources.B >= 5,
    cost: [{ resource: "B", amount: 5 }],
    unlocked: false,
    validationRegex: /\bif\s*\(/,
    validationErrorMessage:
      "If statements are not unlocked yet. Produce 5 B to unlock them.",
    icon: "?",
    dependencies: ["varsUnlocked"],
    position: { row: 1, col: 1 },
  },
  {
    id: "userFunctionsUnlocked",
    name: "User Functions",
    description: "Define your own functions to organize and reuse code",
    threshold: (resources) => resources.C >= 5,
    cost: [{ resource: "C", amount: 5 }],
    unlocked: false,
    validationRegex:
      /\bfunction\s+\w+\s*\(|=\s*(async\s+)?(\([^)]*\)|[a-zA-Z_$][a-zA-Z0-9_$]*)\s*=>/,
    validationErrorMessage:
      "User functions are not unlocked yet. Produce 5 C to unlock them.",
    icon: "\u0192",
    dependencies: ["ifStatementsUnlocked"],
    position: { row: 2, col: 1 },
  },
  {
    id: "processingSpeed1Unlocked",
    name: "Processing Speed I",
    description: "Reduce all function execution times by 20%",
    threshold: (resources) => resources.B >= 20,
    cost: [{ resource: "B", amount: 20 }],
    unlocked: false,
    icon: "\u26A1",
    dependencies: ["mathFunctionsUnlocked"],
    position: { row: 3, col: 1 },
  },
  {
    id: "stockMarketUnlocked",
    name: "Stock Market",
    description: "Unlock the market. Trade resources with fluctuating prices using getMarketValue(), buy(), and sell()",
    threshold: (resources) => resources.C >= 3 && resources.B >= 15,
    cost: [
      { resource: "B", amount: 15 },
      { resource: "C", amount: 3 },
    ],
    unlocked: false,
    validationRegex: /\b(getMarketValue|buy|sell)\s*\(/,
    validationErrorMessage:
      "Market functions are not unlocked yet. Produce 15 B + 3 C to unlock the Stock Market.",
    icon: "$",
    dependencies: ["resourceCUnlocked", "ifStatementsUnlocked"],
    position: { row: 2, col: 2 },
  },
  {
    id: "resourceDUnlocked",
    name: "Resource D",
    description: "Unlock volatile Resource D on the market. Trade the most volatile asset for big profits (or losses)",
    threshold: () => {
      const market = getMarketState();
      return market.totalMarketProfit >= 1000;
    },
    cost: [],
    unlocked: false,
    icon: "D",
    dependencies: ["stockMarketUnlocked"],
    position: { row: 3, col: 2 },
    /** Custom progress display for non-resource thresholds */
    progressInfo: () => {
      const market = getMarketState();
      const profit = market.totalMarketProfit;
      return { current: profit, target: 1000, label: `$${profit.toFixed(2)} / $1000 trade revenue` };
    },
  },
];

/**
 * Get all techs that are currently available to unlock.
 * A tech is available when:
 * 1. The player has enough resources to meet the threshold
 * 2. The tech is not already unlocked
 * 3. All dependency techs are unlocked
 */
export function getAvailableUpgrades(resources?: Resources, tech?: TechUnlocks) {
  const currentResources = resources ?? useGameStore.getState().resources;
  const currentTech = tech ?? useGameStore.getState().tech;
  const available: TechUnlock[] = [];

  TECH_UNLOCKS.forEach((techNode) => {
    const isUnlocked = currentTech[techNode.id];
    const meetsThreshold = techNode.threshold(currentResources);
    const dependenciesMet =
      !techNode.dependencies ||
      techNode.dependencies.every((dep) => currentTech[dep as keyof TechUnlocks]);

    if (meetsThreshold && !isUnlocked && dependenciesMet) {
      available.push(techNode);
    }
  });

  return available;
}

/**
 * Get the list of currently available API function names
 * based on which techs are unlocked.
 */
export function getAvailableFunctions(): string[] {
  const tech = useGameStore.getState().tech;
  const functions = ["produceResourceA", "getResourceCount", "log"];

  if (tech.convertAToBUnlocked) functions.push("convertAToB");
  if (tech.resourceCUnlocked) functions.push("convertBToC", "makeResourceC");
  if (tech.stockMarketUnlocked) functions.push("getMarketValue", "buy", "sell");

  return functions;
}

/**
 * Maps tech IDs to documentation section IDs for the "View in Docs" feature.
 */
export const TECH_TO_DOCS_SECTION: Record<string, string> = {
  whileUnlocked: "while-loops",
  convertAToBUnlocked: "resource-conversion",
  varsUnlocked: "variables",
  mathFunctionsUnlocked: "math-operators",
  resourceCUnlocked: "resource-conversion-2",
  ifStatementsUnlocked: "if-statements",
  userFunctionsUnlocked: "user-functions",
  stockMarketUnlocked: "stock-market",
};

/** Resource colors used throughout the UI */
export const RESOURCE_COLORS: Record<ResourceKey, string> = {
  A: "#4a9eff", // Blue
  B: "#9d4edd", // Purple
  C: "#ff6b35", // Orange
  D: "#ffcc00", // Gold
};
