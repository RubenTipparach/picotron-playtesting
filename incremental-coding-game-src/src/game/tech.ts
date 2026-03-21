/**
 * Tech Tree Definitions
 *
 * Defines all unlockable technologies, their costs, dependencies,
 * and code validation rules that gate language features.
 */

import { useGameStore } from '../store/gameStore';
import { getMarketState } from './marketEngine';
import { RAM_TIER_TOKENS, RAM_TIER_COSTS } from './hardware';
import type { Resources, TechUnlocks, ResourceKey } from '../store/gameStore';

export interface TechUnlock {
  id: keyof TechUnlocks;
  name: string;
  description: string;
  threshold: (resources: Resources) => boolean;
  unlocked: boolean;
  cost: Array<{ resource: ResourceKey; amount: number }>;
  creditCost?: number;
  validationRegex?: RegExp;
  validationErrorMessage?: string;
  icon: string;
  dependencies?: string[];
  position?: { row: number; col: number };
  progressInfo?: () => { current: number; target: number; label: string };
  /** Called after unlock — use for side effects like upgrading motherboard level */
  onUnlock?: () => void;
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
    position: { row: 0, col: 4 },
  },
  {
    id: "getBalanceUnlocked",
    name: "Balance Check",
    description: "Unlock getBalance() to check your credit balance from code",
    threshold: () => useGameStore.getState().shopBSold >= 10,
    cost: [],
    unlocked: false,
    validationRegex: /\bgetBalance\s*\(/,
    validationErrorMessage:
      "getBalance() is not unlocked yet. Sell 10 B in the Shop to unlock it.",
    icon: "$",
    dependencies: ["shopUnlocked"],
    position: { row: 1, col: 3 },
    progressInfo: () => {
      const sold = useGameStore.getState().shopBSold;
      return { current: sold, target: 10, label: `${sold} / 10 B sold in Shop` };
    },
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
    position: { row: 2, col: 0 },
  },
  {
    id: "resourceCUnlocked",
    name: "Resource Conversion 2",
    description: "Unlock convertABToC()",
    threshold: (resources) => resources.B >= 10,
    cost: [
      { resource: "A", amount: 20 },
      { resource: "B", amount: 10 },
    ],
    unlocked: false,
    validationRegex: /\b(convertABToC|makeResourceC)\s*\(/,
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
    id: "tryCatchUnlocked",
    name: "Try/Catch",
    description: "Handle errors gracefully with try/catch/throw. Caught errors are logged automatically.",
    threshold: (resources) => resources.C >= 10,
    cost: [{ resource: "C", amount: 10 }],
    unlocked: false,
    validationRegex: /\b(try\s*\{|catch\s*\(|throw\s+)/,
    validationErrorMessage:
      "Try/catch is not unlocked yet. Produce 10 C to unlock error handling.",
    icon: "!",
    dependencies: ["userFunctionsUnlocked"],
    position: { row: 3, col: 1 },
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
    position: { row: 3, col: 0 },
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
  {
    id: "waitUnlocked",
    name: "Wait",
    description: "Unlock wait(ms) to sleep for a given time. wait() or wait(0) sleeps for 1 CPU cycle.",
    threshold: (resources) => resources.C >= 5,
    cost: [{ resource: "C", amount: 5 }],
    unlocked: false,
    validationRegex: /\bwait\s*\(/,
    validationErrorMessage:
      "wait() is not unlocked yet. Produce 5 C to unlock it.",
    icon: "\u23F3",
    dependencies: ["stockMarketUnlocked"],
    position: { row: 2, col: 3 },

  },
  {
    id: "maxTradeUnlocked",
    name: "Max Trade",
    description: "Unlock MAX buy/sell on the stock market",
    threshold: () => false, // TODO: unlock condition TBD
    cost: [],
    unlocked: false,
    icon: "\u21C5",
    dependencies: ["stockMarketUnlocked"],
    position: { row: 3, col: 3 },

  },
  // ─── Hardware: Internet ────────────────────────────────────────────
  {
    id: "internet1Unlocked",
    name: "Internet I",
    description: "Basic internet connection. Trade up to 5 units per transaction.",
    threshold: () => useGameStore.getState().credits >= 50,
    cost: [],
    creditCost: 50,
    unlocked: false,
    icon: "\uD83D\uDCE1",
    dependencies: ["shopUnlocked"],
    position: { row: 0, col: 8 },
    onUnlock: () => useGameStore.getState().setInternetLevel(1),
  },
  {
    id: "internet2Unlocked",
    name: "Internet II",
    description: "Faster connection. Trade up to 25 units per transaction.",
    threshold: (resources) => useGameStore.getState().credits >= 500 && resources.B >= 50,
    cost: [{ resource: "B", amount: 50 }],
    creditCost: 500,
    unlocked: false,
    icon: "\uD83D\uDCE1",
    dependencies: ["internet1Unlocked"],
    position: { row: 0, col: 9 },
    onUnlock: () => useGameStore.getState().setInternetLevel(2),
  },
  {
    id: "internet3Unlocked",
    name: "Internet III",
    description: "Fiber optic. Trade up to 100 units per transaction.",
    threshold: (resources) => useGameStore.getState().credits >= 5000 && resources.C >= 500,
    cost: [{ resource: "C", amount: 500 }],
    creditCost: 5000,
    unlocked: false,
    icon: "\uD83D\uDCE1",
    dependencies: ["internet2Unlocked"],
    position: { row: 0, col: 10 },
    onUnlock: () => useGameStore.getState().setInternetLevel(3),
  },
  // ─── Hardware: Motherboard ─────────────────────────────────────────
  {
    id: "motherboard2Unlocked",
    name: "Motherboard II",
    description: "M2 board: 8 RAM slots, 2 CPU cores.",
    threshold: (resources) => useGameStore.getState().credits >= 200 && resources.B >= 20,
    cost: [{ resource: "B", amount: 20 }],
    creditCost: 200,
    unlocked: false,
    icon: "\uD83D\uDCBB",
    dependencies: ["shopUnlocked"],
    position: { row: 1, col: 4 },
    onUnlock: () => useGameStore.getState().setMotherboardLevel(2),
  },
  {
    id: "motherboard3Unlocked",
    name: "Motherboard III",
    description: "M3 board: 16 RAM slots, 4 CPU cores.",
    threshold: (resources) => useGameStore.getState().credits >= 1000 && resources.C >= 1000,
    cost: [{ resource: "C", amount: 1000 }],
    creditCost: 1000,
    unlocked: false,
    icon: "\uD83D\uDCBB",
    dependencies: ["motherboard2Unlocked", "resourceDUnlocked"],
    position: { row: 4, col: 4 },
    onUnlock: () => useGameStore.getState().setMotherboardLevel(3),
  },
  {
    id: "motherboard4Unlocked",
    name: "Motherboard IV",
    description: "M4 board: 32 RAM slots, 4 CPU cores, GPU slot.",
    threshold: (resources) => useGameStore.getState().credits >= 10000 && resources.E >= 10,
    cost: [{ resource: "E", amount: 10 }],
    creditCost: 10000,
    unlocked: false,
    icon: "\uD83D\uDCBB",
    dependencies: ["motherboard3Unlocked"],
    position: { row: 5, col: 4 },
    onUnlock: () => useGameStore.getState().setMotherboardLevel(4),
  },
  // ─── Hardware: RAM Tiers ───────────────────────────────────────────
  {
    id: "ramTier2Unlocked",
    name: "RAM Tier 2",
    description: `Research faster RAM. Modules cost $${RAM_TIER_COSTS[2].toLocaleString()} each (+${RAM_TIER_TOKENS[2]} tokens).`,
    threshold: (resources) => useGameStore.getState().credits >= 100 && resources.A >= 100,
    cost: [{ resource: "A", amount: 100 }],
    creditCost: 100,
    unlocked: false,
    icon: "\uD83D\uDCE6",
    dependencies: ["shopUnlocked"],
    position: { row: 1, col: 7 },

  },
  {
    id: "ramTier3Unlocked",
    name: "RAM Tier 3",
    description: `Research DDR3 RAM. Modules cost $${RAM_TIER_COSTS[3].toLocaleString()} each (+${RAM_TIER_TOKENS[3]} tokens).`,
    threshold: (resources) => useGameStore.getState().credits >= 1000 && resources.B >= 1000,
    cost: [{ resource: "B", amount: 1000 }],
    creditCost: 1000,
    unlocked: false,
    icon: "\uD83D\uDCE6",
    dependencies: ["ramTier2Unlocked"],
    position: { row: 2, col: 7 },

  },
  {
    id: "ramTier4Unlocked",
    name: "RAM Tier 4",
    description: `Research DDR4 RAM. Modules cost $${RAM_TIER_COSTS[4].toLocaleString()} each (+${RAM_TIER_TOKENS[4]} tokens).`,
    threshold: (resources) => useGameStore.getState().credits >= 10000 && resources.C >= 10000,
    cost: [{ resource: "C", amount: 10000 }],
    creditCost: 10000,
    unlocked: false,
    icon: "\uD83D\uDCE6",
    dependencies: ["ramTier3Unlocked"],
    position: { row: 3, col: 7 },
  },
  {
    id: "ramTier5Unlocked",
    name: "RAM Tier 5",
    description: `Research DDR5 RAM. Modules cost $${RAM_TIER_COSTS[5].toLocaleString()} each (+${RAM_TIER_TOKENS[5]} tokens).`,
    threshold: (resources) => useGameStore.getState().credits >= 100000 && resources.D >= 100000,
    cost: [{ resource: "D", amount: 100000 }],
    creditCost: 100000,
    unlocked: false,
    icon: "\uD83D\uDCE6",
    dependencies: ["ramTier4Unlocked"],
    position: { row: 4, col: 7 },

  },
  // ─── Hardware: CPU Cores ───────────────────────────────────────────
  {
    id: "cpuCore2Unlocked",
    name: "CPU Core 2",
    description: "Install a 2nd CPU core. Enables parallel code execution.",
    threshold: (resources) => useGameStore.getState().credits >= 1000 && resources.B >= 100,
    cost: [{ resource: "B", amount: 100 }],
    creditCost: 1000,
    unlocked: false,
    icon: "\u2699",
    dependencies: ["motherboard2Unlocked"],
    position: { row: 2, col: 6 },
    onUnlock: () => useGameStore.getState().addCpuCore(),
  },
  {
    id: "cpuCore3Unlocked",
    name: "CPU Core 3",
    description: "Install a 3rd CPU core.",
    threshold: (resources) => useGameStore.getState().credits >= 5000 && resources.C >= 1000,
    cost: [{ resource: "C", amount: 1000 }],
    creditCost: 5000,
    unlocked: false,
    icon: "\u2699",
    dependencies: ["cpuCore2Unlocked", "motherboard3Unlocked"],
    position: { row: 4, col: 6 },
    onUnlock: () => useGameStore.getState().addCpuCore(),
  },
  {
    id: "cpuCore4Unlocked",
    name: "CPU Core 4",
    description: "Install a 4th CPU core. Maximum parallelism.",
    threshold: (resources) => useGameStore.getState().credits >= 20000 && resources.D >= 10000,
    cost: [{ resource: "D", amount: 10000 }],
    creditCost: 20000,
    unlocked: false,
    icon: "\u2699",
    dependencies: ["cpuCore3Unlocked"],
    position: { row: 5, col: 6 },
    onUnlock: () => useGameStore.getState().addCpuCore(),
  },
  // ─── Hardware: Sync ────────────────────────────────────────────────
  {
    id: "syncFunctionUnlocked",
    name: "Sync",
    description: "Unlock sync() to synchronize and pass data between CPU cores.",
    threshold: (resources) => useGameStore.getState().credits >= 2000 && resources.C >= 500,
    cost: [{ resource: "C", amount: 500 }],
    creditCost: 2000,
    unlocked: false,
    validationRegex: /\b(sync|send)\s*\(/,
    validationErrorMessage: "sync()/send() are not unlocked yet. Research Sync to unlock them.",
    icon: "\uD83D\uDD04",
    dependencies: ["cpuCore2Unlocked"],
    position: { row: 3, col: 6 },
  },
  // ─── Mining: Resource E ────────────────────────────────────────────
  {
    id: "resourceEUnlocked",
    name: "Resource E",
    description: "Unlock Resource E — a scarce digital asset. Use hash() and submitHash() to mine it.",
    threshold: (resources) => useGameStore.getState().credits >= 10000 && resources.D >= 1000,
    cost: [{ resource: "D", amount: 1000 }],
    creditCost: 10000,
    unlocked: false,
    validationRegex: /\b(hash|submitHash|testHash|gpuHash|getMiningInfo)\s*\(/,
    validationErrorMessage: "Mining functions are not unlocked yet. Research Resource E.",
    icon: "E",
    dependencies: ["resourceDUnlocked"],
    position: { row: 5, col: 2 },
  },
  {
    id: "digitalMiningUnlocked",
    name: "Accelerated Mining",
    description: "Advanced mining documentation and techniques. Unlocks getMiningInfo() for tracking progress.",
    threshold: (resources) => useGameStore.getState().credits >= 5000 && resources.E >= 100,
    cost: [{ resource: "E", amount: 100 }],
    creditCost: 5000,
    unlocked: false,
    icon: "\u26CF",
    dependencies: ["resourceEUnlocked"],
    position: { row: 6, col: 2 },
  },
  {
    id: "eMarketUnlocked",
    name: "E Trading",
    description: "Mine 1000 E to unlock E on the stock market.",
    threshold: () => useGameStore.getState().totalEMined >= 1000,
    cost: [],
    unlocked: false,
    icon: "E",
    dependencies: ["resourceEUnlocked"],
    position: { row: 6, col: 4 },
    progressInfo: () => {
      const total = useGameStore.getState().totalEMined;
      return { current: Math.min(total, 1000), target: 1000, label: "E mined" };
    },
    onUnlock: () => useGameStore.getState().setEMarketActive(),
  },
  // ─── Storage: Hard Drive ───────────────────────────────────────────
  {
    id: "kvStoreUnlocked",
    name: "Hard Drive",
    description: "1 KB persistent key-value store. Use dbSet(), dbGet(), dbDelete() to store data across runs.",
    threshold: (resources) => useGameStore.getState().credits >= 5000 && resources.D >= 50,
    cost: [{ resource: "D", amount: 50 }],
    creditCost: 5000,
    unlocked: false,
    validationRegex: /\b(dbSet|dbGet|dbDelete|dbExists|dbSize)\s*\(/,
    validationErrorMessage: "Storage functions are not unlocked yet. Research Hard Drive.",
    icon: "\uD83D\uDDB4",
    dependencies: ["resourceEUnlocked"],
    position: { row: 6, col: 1 },
  },
  {
    id: "hddTier2Unlocked",
    name: "HDD Tier 2",
    description: "Upgrade drive to 4 KB storage.",
    threshold: (resources) => useGameStore.getState().credits >= 20000 && resources.D >= 200,
    cost: [{ resource: "D", amount: 200 }],
    creditCost: 20000,
    unlocked: false,
    icon: "\uD83D\uDDB4",
    dependencies: ["kvStoreUnlocked"],
    position: { row: 7, col: 1 },
  },
  {
    id: "hddTier3Unlocked",
    name: "HDD Tier 3",
    description: "Upgrade drive to 16 KB storage.",
    threshold: (resources) => useGameStore.getState().credits >= 100000 && resources.D >= 1000,
    cost: [{ resource: "D", amount: 1000 }],
    creditCost: 100000,
    unlocked: false,
    icon: "\uD83D\uDDB4",
    dependencies: ["hddTier2Unlocked"],
    position: { row: 8, col: 1 },
  },
  {
    id: "hddTier4Unlocked",
    name: "HDD Tier 4",
    description: "Upgrade drive to 64 KB storage.",
    threshold: (resources) => useGameStore.getState().credits >= 500000 && resources.D >= 5000,
    cost: [{ resource: "D", amount: 5000 }],
    creditCost: 500000,
    unlocked: false,
    icon: "\uD83D\uDDB4",
    dependencies: ["hddTier3Unlocked"],
    position: { row: 9, col: 1 },
  },
  // ─── Mining: GPU Tiers ─────────────────────────────────────────────
  {
    id: "gpuTier1Unlocked",
    name: "GPU Tier 1",
    description: "16-core GPU. Call gpuHash(array) to hash 16 strings at once.",
    threshold: (resources) => useGameStore.getState().credits >= 500 && resources.E >= 10,
    cost: [{ resource: "E", amount: 10 }],
    creditCost: 500,
    unlocked: false,
    icon: "\uD83C\uDFAE",
    dependencies: ["digitalMiningUnlocked", "motherboard4Unlocked"],
    position: { row: 6, col: 3 },
    onUnlock: () => useGameStore.getState().setGpuTier(1),
  },
  {
    id: "gpuTier2Unlocked",
    name: "GPU Tier 2",
    description: "64-core GPU. Hash 64 strings per gpuHash() call.",
    threshold: (resources) => useGameStore.getState().credits >= 5000 && resources.E >= 50,
    cost: [{ resource: "E", amount: 50 }],
    creditCost: 5000,
    unlocked: false,
    icon: "\uD83C\uDFAE",
    dependencies: ["gpuTier1Unlocked"],
    position: { row: 7, col: 3 },
    onUnlock: () => useGameStore.getState().setGpuTier(2),
  },
  {
    id: "gpuTier3Unlocked",
    name: "GPU Tier 3",
    description: "256-core GPU. Hash 256 strings per gpuHash() call.",
    threshold: (resources) => useGameStore.getState().credits >= 50000 && resources.E >= 200,
    cost: [{ resource: "E", amount: 200 }],
    creditCost: 50000,
    unlocked: false,
    icon: "\uD83C\uDFAE",
    dependencies: ["gpuTier2Unlocked"],
    position: { row: 8, col: 3 },
    onUnlock: () => useGameStore.getState().setGpuTier(3),
  },
  {
    id: "gpuTier4Unlocked",
    name: "GPU Tier 4",
    description: "1024-core GPU. Hash 1024 strings per gpuHash() call.",
    threshold: (resources) => useGameStore.getState().credits >= 500000 && resources.E >= 1000,
    cost: [{ resource: "E", amount: 1000 }],
    creditCost: 500000,
    unlocked: false,
    icon: "\uD83C\uDFAE",
    dependencies: ["gpuTier3Unlocked"],
    position: { row: 9, col: 3 },
    onUnlock: () => useGameStore.getState().setGpuTier(4),
  },
  {
    id: "gpuTier5Unlocked",
    name: "GPU Tier 5",
    description: "4096-core GPU. Hash 4096 strings per gpuHash() call.",
    threshold: (resources) => useGameStore.getState().credits >= 5000000 && resources.E >= 5000,
    cost: [{ resource: "E", amount: 5000 }],
    creditCost: 5000000,
    unlocked: false,
    icon: "\uD83C\uDFAE",
    dependencies: ["gpuTier4Unlocked"],
    position: { row: 10, col: 3 },
    onUnlock: () => useGameStore.getState().setGpuTier(5),
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
  if (tech.getBalanceUnlocked) functions.push("getBalance");
  if (tech.resourceCUnlocked) functions.push("convertABToC", "makeResourceC");
  if (tech.stockMarketUnlocked) functions.push("getMarketValue", "buy", "sell");
  if (tech.waitUnlocked) functions.push("wait");
  if (tech.syncFunctionUnlocked) functions.push("sync", "send");
  if (tech.resourceEUnlocked) functions.push("hash", "submitHash", "testHash");
  if (tech.digitalMiningUnlocked) functions.push("getMiningInfo");
  if (tech.gpuTier1Unlocked) functions.push("gpuHash");
  if (tech.kvStoreUnlocked) functions.push("dbGet", "dbSet", "dbDelete", "dbExists", "dbSize");

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
  tryCatchUnlocked: "try-catch",
  stockMarketUnlocked: "stock-market",
  syncFunctionUnlocked: "sync",
  kvStoreUnlocked: "storage",
};

/** Resource colors used throughout the UI */
export const RESOURCE_COLORS: Record<ResourceKey, string> = {
  A: "#4a9eff", // Blue
  B: "#9d4edd", // Purple
  C: "#ff6b35", // Orange
  D: "#ffcc00", // Gold
  E: "#00e5ff", // Cyan
};
