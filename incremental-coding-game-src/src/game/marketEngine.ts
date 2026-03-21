/**
 * Market Engine
 *
 * Simulates a stock market with fluctuating prices for resources A, B, C, D.
 * Uses an agent-based simulation where virtual traders create organic volatility.
 * The market grows alongside the player, targeting ~1% player market share.
 * D is a special volatile resource with no production — only tradeable.
 */

// ─── Types ────────────────────────────────────────────────────────────

export interface MarketPrices { A: number; B: number; C: number; D: number; }
export interface Candle { period: number; open: number; high: number; low: number; close: number; }
export interface PricePoint { time: number; price: number; }
export interface MarketState {
  prices: MarketPrices;
  priceHistory: Record<string, PricePoint[]>;
  candles: Record<string, Candle[]>;
  marketTime: number;
  demandPressure: Record<string, number>;
  totalMarketProfit: number;
  dUnlocked: boolean;
  marketUnits: Record<string, number>;
  agentCount: number;
  targetMarketUnits: Record<string, number>;
}
export interface TradeResult { success: boolean; cost?: number; revenue?: number; amount: number; price?: number; }
export interface EmotionInfo { label: string; color: string; }

// ─── Constants ────────────────────────────────────────────────────────

const BASE_PRICES: MarketPrices = { A: 1, B: 5, C: 25, D: 50 };
const VOLATILITY: MarketPrices = { A: 0.02, B: 0.03, C: 0.04, D: 0.12 };
const MEAN_REVERSION: MarketPrices = { A: 0.05, B: 0.04, C: 0.03, D: 0.01 };

const SPREAD = 0.05;
const TRADE_IMPACT: MarketPrices = { A: 0.005, B: 0.01, C: 0.02, D: 0.05 };

// Real-time tick interval (ms) — 0.5s for responsive charts
const TICK_INTERVAL_MS = 500;

// Agent simulation constants
const TARGET_PLAYER_SHARE = 0.01; // Target 1% player market share
const MARKET_GROWTH_RATE = 0.02;  // How fast market adjusts per tick (lag)
const INITIAL_MARKET_UNITS: Record<string, number> = { A: 500, B: 100, C: 20, D: 10 };
const AGENT_TRADE_RATE = 0.03;    // Fraction of agents that trade per tick

function seededRandom(seed: number): number {
  let x = Math.sin(seed * 9301 + 49297) * 49297;
  x = Math.sin(x) * 10000;
  return x - Math.floor(x);
}

function gaussianRandom(seed: number): number {
  const u1 = seededRandom(seed);
  const u2 = seededRandom(seed + 0.5);
  return Math.sqrt(-2 * Math.log(Math.max(u1, 0.0001))) * Math.cos(2 * Math.PI * u2);
}

const CANDLE_PERIOD = 20; // 20 ticks = 10s per candle
const MAX_CANDLES = 120; // 10 minutes of candles (6 per minute)
const MAX_HISTORY = 1200; // 10 minutes of tick-level data (2 ticks/sec)

let marketState: MarketState = {
  prices: { ...BASE_PRICES },
  priceHistory: { A: [], B: [], C: [], D: [] },
  candles: { A: [], B: [], C: [], D: [] },
  marketTime: 0, // independent market clock (integer ticks)
  demandPressure: { A: 0, B: 0, C: 0, D: 0 },
  totalMarketProfit: 0,
  dUnlocked: false,
  // Agent-based simulation state
  marketUnits: { ...INITIAL_MARKET_UNITS },  // Total units held by all AI agents
  agentCount: 50,                             // Number of virtual agents
  targetMarketUnits: { ...INITIAL_MARKET_UNITS }, // Target size market is growing toward
};

let timerHandle: ReturnType<typeof setInterval> | null = null;
let saveCallback: ((state: MarketState) => void) | null = null;
let persistCallback: ((state: MarketState) => void) | null = null;
let ticksSinceLastPersist = 0;
const PERSIST_EVERY_N_TICKS = 10; // Save to localStorage every 5s (10 ticks * 500ms)

export function getMarketState(): MarketState {
  return marketState;
}

export function setDUnlocked(unlocked: boolean): void {
  marketState.dUnlocked = unlocked;
}

export function initMarket(savedState?: Partial<MarketState> & { lastTick?: number } | null): void {
  if (savedState) {
    marketState = {
      prices: { ...BASE_PRICES, ...savedState.prices } as MarketPrices,
      priceHistory: savedState.priceHistory || { A: [], B: [], C: [], D: [] },
      candles: savedState.candles || { A: [], B: [], C: [], D: [] },
      marketTime: savedState.marketTime ?? (savedState as any).lastTick ?? 0,
      demandPressure: savedState.demandPressure || { A: 0, B: 0, C: 0, D: 0 },
      totalMarketProfit: savedState.totalMarketProfit || 0,
      dUnlocked: savedState.dUnlocked || false,
      marketUnits: savedState.marketUnits || { ...INITIAL_MARKET_UNITS },
      agentCount: savedState.agentCount || 50,
      targetMarketUnits: savedState.targetMarketUnits || { ...INITIAL_MARKET_UNITS },
    };
  } else {
    marketState = {
      prices: { ...BASE_PRICES },
      priceHistory: { A: [], B: [], C: [], D: [] },
      candles: { A: [], B: [], C: [], D: [] },
      marketTime: 0,
      demandPressure: { A: 0, B: 0, C: 0, D: 0 },
      totalMarketProfit: 0,
      dUnlocked: false,
      marketUnits: { ...INITIAL_MARKET_UNITS },
      agentCount: 50,
      targetMarketUnits: { ...INITIAL_MARKET_UNITS },
    };
  }
}

/**
 * Get player resource holdings (reads from game store if available).
 */
let getPlayerResources: (() => Record<string, number>) | null = null;
export function setPlayerResourcesGetter(fn: () => Record<string, number>): void {
  getPlayerResources = fn;
}

/**
 * Simulate agent trades for one tick. Agents buy/sell randomly,
 * creating organic demand pressure that drives price volatility.
 */
function simulateAgents(tick: number): void {
  const resources = marketState.dUnlocked ? ["A", "B", "C", "D"] : ["A", "B", "C"];
  const agents = marketState.agentCount;
  const tradingAgents = Math.max(1, Math.floor(agents * AGENT_TRADE_RATE));

  for (const r of resources) {
    // Each trading agent randomly buys or sells
    let netPressure = 0;
    for (let a = 0; a < tradingAgents; a++) {
      const seed = tick * 137 + a * 31 + r.charCodeAt(0) * 7;
      const rand = seededRandom(seed);
      const direction = rand > 0.52 ? 1 : rand < 0.48 ? -1 : 0; // Slight bias varies
      const intensity = seededRandom(seed + 0.3) * 0.5 + 0.5; // 0.5-1.0
      netPressure += direction * intensity * (TRADE_IMPACT as any)[r] * 0.3;

      // Agents adjust market units (they produce/consume)
      const unitChange = direction * intensity * 0.1;
      marketState.marketUnits[r] = Math.max(1, marketState.marketUnits[r] + unitChange);
    }

    marketState.demandPressure[r] += netPressure;
  }

  // Adjust market size based on player share
  if (getPlayerResources) {
    const playerRes = getPlayerResources();
    for (const r of resources) {
      const playerHolding = playerRes[r] || 0;
      const totalUnits = marketState.marketUnits[r] + playerHolding;
      const playerShare = totalUnits > 0 ? playerHolding / totalUnits : 0;

      // If player owns too much, grow the market to dilute their share
      if (playerShare > TARGET_PLAYER_SHARE && playerHolding > 0) {
        const targetTotal = playerHolding / TARGET_PLAYER_SHARE;
        marketState.targetMarketUnits[r] = Math.max(
          marketState.targetMarketUnits[r],
          targetTotal - playerHolding
        );
      }

      // Gradually move market units toward target (lag)
      const diff = marketState.targetMarketUnits[r] - marketState.marketUnits[r];
      if (Math.abs(diff) > 0.1) {
        marketState.marketUnits[r] += diff * MARKET_GROWTH_RATE;
      }
    }

    // Scale agent count with market size
    const avgUnits = resources.reduce((sum, r) => sum + marketState.marketUnits[r], 0) / resources.length;
    const baseAvg = resources.reduce((sum, r) => sum + INITIAL_MARKET_UNITS[r], 0) / resources.length;
    marketState.agentCount = Math.max(50, Math.floor(50 * (avgUnits / baseAvg)));
  }
}

/**
 * Advance the market by N ticks from current marketTime.
 */
export function tickMarket(numTicks: number): void {
  if (numTicks <= 0) return;

  const startTick = marketState.marketTime;
  const resources = ["A", "B", "C", "D"];

  for (let i = 1; i <= numTicks; i++) {
    const t = startTick + i;

    // Run agent simulation first to generate organic pressure
    simulateAgents(t);

    for (const r of resources) {
      if (r === "D" && !marketState.dUnlocked) continue;

      const price = (marketState.prices as any)[r] as number;
      const base = (BASE_PRICES as any)[r] as number;
      const vol = (VOLATILITY as any)[r] as number;
      const revert = (MEAN_REVERSION as any)[r] as number;

      const noise = gaussianRandom(t * 7 + r.charCodeAt(0)) * vol * base;
      const reversion = (base - price) * revert;
      const pressure = marketState.demandPressure[r] * base;
      marketState.demandPressure[r] *= 0.9;

      const newPrice = Math.max(base * 0.1, price + noise + reversion + pressure);
      (marketState.prices as any)[r] = Math.round(newPrice * 100) / 100;

      const currentPrice = (marketState.prices as any)[r] as number;
      marketState.priceHistory[r].push({ time: t, price: currentPrice });
      if (marketState.priceHistory[r].length > MAX_HISTORY) {
        marketState.priceHistory[r] = marketState.priceHistory[r].slice(-MAX_HISTORY);
      }

      const candlePeriod = Math.floor(t / CANDLE_PERIOD);
      const candles = marketState.candles[r];
      const lastCandle = candles.length > 0 ? candles[candles.length - 1] : null;

      if (lastCandle && lastCandle.period === candlePeriod) {
        lastCandle.high = Math.max(lastCandle.high, currentPrice);
        lastCandle.low = Math.min(lastCandle.low, currentPrice);
        lastCandle.close = currentPrice;
      } else {
        candles.push({
          period: candlePeriod,
          open: currentPrice,
          high: currentPrice,
          low: currentPrice,
          close: currentPrice,
        });
        if (candles.length > MAX_CANDLES) {
          marketState.candles[r] = candles.slice(-MAX_CANDLES);
        }
      }
    }
  }

  marketState.marketTime = startTick + numTicks;
}

/**
 * Get market capitalization (total value of all units in the market).
 */
export function getMarketCap(): number {
  const resources = marketState.dUnlocked ? ["A", "B", "C", "D"] : ["A", "B", "C"];
  let totalCap = 0;
  for (const r of resources) {
    totalCap += marketState.marketUnits[r] * (marketState.prices as any)[r];
  }
  return Math.floor(totalCap);
}

/**
 * Get total units in the market (AI agents only).
 */
export function getMarketUnits(): Record<string, number> {
  return { ...marketState.marketUnits };
}

/**
 * Start the real-time market timer. Ticks once every TICK_INTERVAL_MS.
 * @param onTick - Called every tick to update React state (Zustand set only, no localStorage)
 * @param onPersist - Called periodically to persist to localStorage
 */
export function startMarketTimer(onTick: (state: MarketState) => void, onPersist: (state: MarketState) => void): void {
  stopMarketTimer();
  saveCallback = onTick;
  persistCallback = onPersist;
  ticksSinceLastPersist = 0;
  timerHandle = setInterval(() => {
    tickMarket(1);
    // Spread to create a new object reference so Zustand detects the change
    if (saveCallback) saveCallback({ ...marketState });

    // Persist to localStorage less frequently
    ticksSinceLastPersist++;
    if (ticksSinceLastPersist >= PERSIST_EVERY_N_TICKS && persistCallback) {
      ticksSinceLastPersist = 0;
      persistCallback({ ...marketState });
    }
  }, TICK_INTERVAL_MS);
}

/**
 * Stop the real-time market timer.
 */
export function stopMarketTimer(): void {
  if (timerHandle) {
    clearInterval(timerHandle);
    timerHandle = null;
  }
  // Persist on stop so we don't lose recent ticks
  if (persistCallback && marketState.marketTime > 0) {
    persistCallback({ ...marketState });
  }
  saveCallback = null;
  persistCallback = null;
}

/**
 * Get the current market value (mid price) for a resource.
 */
export function getMarketValue(resource: string): number {
  const r = String(resource).toUpperCase();
  if (!(BASE_PRICES as any)[r]) return 0;
  if (r === "D" && !marketState.dUnlocked) return 0;
  return (marketState.prices as any)[r];
}

/**
 * Get the buy price (slightly above market).
 */
export function getBuyPrice(resource: string): number {
  const mid = getMarketValue(resource);
  return Math.round(mid * (1 + SPREAD) * 100) / 100;
}

/**
 * Get the sell price (slightly below market).
 */
export function getSellPrice(resource: string): number {
  const mid = getMarketValue(resource);
  return Math.round(mid * (1 - SPREAD) * 100) / 100;
}

/**
 * Execute a buy trade. Returns { success, cost, amount }.
 * Buying pushes price up.
 */
export function executeBuy(resource: string, amount: number): TradeResult {
  const r = String(resource).toUpperCase();
  if (!(BASE_PRICES as any)[r]) return { success: false, cost: 0, amount: 0 };
  if (r === "D" && !marketState.dUnlocked) return { success: false, cost: 0, amount: 0 };

  const price = getBuyPrice(r);
  const cost = Math.round(price * amount * 100) / 100;

  // Push price up
  marketState.demandPressure[r] += (TRADE_IMPACT as any)[r] * amount;

  return { success: true, cost, amount, price: (marketState.prices as any)[r] };
}

/**
 * Execute a sell trade. Returns { success, revenue, amount }.
 * Selling pushes price down.
 */
export function executeSell(resource: string, amount: number): TradeResult {
  const r = String(resource).toUpperCase();
  if (!(BASE_PRICES as any)[r]) return { success: false, revenue: 0, amount: 0 };
  if (r === "D" && !marketState.dUnlocked) return { success: false, revenue: 0, amount: 0 };

  const price = getSellPrice(r);
  const revenue = Math.round(price * amount * 100) / 100;

  // Push price down
  marketState.demandPressure[r] -= (TRADE_IMPACT as any)[r] * amount;

  return { success: true, revenue, amount, price: (marketState.prices as any)[r] };
}

/**
 * Track profit from market trades.
 */
export function addMarketProfit(amount: number): void {
  marketState.totalMarketProfit += amount;
}

/**
 * Compute market "emotion" — a fear/greed index from -1 (extreme fear) to +1 (extreme greed).
 * Based on recent price trends across all resources.
 */
export function getMarketEmotion(): number {
  const resources = marketState.dUnlocked ? ["A", "B", "C", "D"] : ["A", "B", "C"];
  let totalMomentum = 0;
  let count = 0;

  for (const r of resources) {
    const history = marketState.priceHistory[r];
    if (history.length < 5) continue;

    const recent = history.slice(-10);
    const base = (BASE_PRICES as any)[r] as number;

    // Short-term momentum
    const firstPrice = recent[0].price;
    const lastPrice = recent[recent.length - 1].price;
    const change = (lastPrice - firstPrice) / base;

    // Deviation from base
    const deviation = (lastPrice - base) / base;

    totalMomentum += change * 0.6 + deviation * 0.4;
    count++;
  }

  if (count === 0) return 0;
  const raw = totalMomentum / count;
  // Clamp to [-1, 1] with sigmoid-like mapping
  return Math.max(-1, Math.min(1, raw * 5));
}

/**
 * Get emotion label and color.
 */
export function getEmotionLabel(emotion: number): EmotionInfo {
  if (emotion > 0.6) return { label: "EXTREME GREED", color: "#00ff00" };
  if (emotion > 0.3) return { label: "GREED", color: "#88ff44" };
  if (emotion > 0.1) return { label: "OPTIMISM", color: "#aaff66" };
  if (emotion > -0.1) return { label: "NEUTRAL", color: "#888888" };
  if (emotion > -0.3) return { label: "CAUTION", color: "#ffaa44" };
  if (emotion > -0.6) return { label: "FEAR", color: "#ff6644" };
  return { label: "EXTREME FEAR", color: "#ff2222" };
}
