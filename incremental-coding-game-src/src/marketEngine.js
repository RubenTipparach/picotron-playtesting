/**
 * Market Engine
 *
 * Simulates a stock market with fluctuating prices for resources A, B, C, D.
 * Prices change based on supply/demand pressure from player trades
 * and random volatility driven by virtual time progression.
 *
 * D is a special volatile resource with no production — only tradeable.
 */

const BASE_PRICES = { A: 1, B: 5, C: 25, D: 50 };
const VOLATILITY = { A: 0.02, B: 0.03, C: 0.04, D: 0.12 };
const MEAN_REVERSION = { A: 0.05, B: 0.04, C: 0.03, D: 0.01 };

// Spread: buy costs more, sell gives less
const SPREAD = 0.05; // 5% spread

// How much each trade moves the price (per unit)
const TRADE_IMPACT = { A: 0.005, B: 0.01, C: 0.02, D: 0.05 };

// Seeded pseudo-random for deterministic price movement
function seededRandom(seed) {
  let x = Math.sin(seed * 9301 + 49297) * 49297;
  x = Math.sin(x) * 10000;
  return x - Math.floor(x);
}

function gaussianRandom(seed) {
  const u1 = seededRandom(seed);
  const u2 = seededRandom(seed + 0.5);
  return Math.sqrt(-2 * Math.log(Math.max(u1, 0.0001))) * Math.cos(2 * Math.PI * u2);
}

/**
 * Market state — kept in memory and synced to game store.
 * Prices update each time virtual time advances.
 */
// Each candle covers CANDLE_PERIOD virtual seconds
const CANDLE_PERIOD = 5;
const MAX_CANDLES = 60;

let marketState = {
  prices: { ...BASE_PRICES },
  priceHistory: { A: [], B: [], C: [], D: [] },
  candles: { A: [], B: [], C: [], D: [] },
  lastTick: 0,
  demandPressure: { A: 0, B: 0, C: 0, D: 0 },
  totalMarketProfit: 0,
  dUnlocked: false,
};

const MAX_HISTORY = 100;

export function getMarketState() {
  return marketState;
}

/**
 * Set whether resource D is unlocked (called when tech tree node is unlocked).
 */
export function setDUnlocked(unlocked) {
  marketState.dUnlocked = unlocked;
}

export function initMarket(savedState) {
  if (savedState) {
    marketState = {
      prices: { ...BASE_PRICES, ...savedState.prices },
      priceHistory: savedState.priceHistory || { A: [], B: [], C: [], D: [] },
      candles: savedState.candles || { A: [], B: [], C: [], D: [] },
      lastTick: savedState.lastTick || 0,
      demandPressure: savedState.demandPressure || { A: 0, B: 0, C: 0, D: 0 },
      totalMarketProfit: savedState.totalMarketProfit || 0,
      dUnlocked: savedState.dUnlocked || false,
    };
  } else {
    marketState = {
      prices: { ...BASE_PRICES },
      priceHistory: { A: [], B: [], C: [], D: [] },
      candles: { A: [], B: [], C: [], D: [] },
      lastTick: 0,
      demandPressure: { A: 0, B: 0, C: 0, D: 0 },
      totalMarketProfit: 0,
      dUnlocked: false,
    };
  }
}

/**
 * Advance the market by ticking from lastTick to currentVirtualTime.
 * Each integer second is one tick.
 */
export function tickMarket(currentVirtualTime) {
  const startTick = Math.floor(marketState.lastTick);
  const endTick = Math.floor(currentVirtualTime);

  if (endTick <= startTick) return;

  const resources = ["A", "B", "C", "D"];

  for (let t = startTick + 1; t <= endTick; t++) {
    for (const r of resources) {
      if (r === "D" && !marketState.dUnlocked) continue;

      const price = marketState.prices[r];
      const base = BASE_PRICES[r];
      const vol = VOLATILITY[r];
      const revert = MEAN_REVERSION[r];

      // Random component
      const noise = gaussianRandom(t * 7 + r.charCodeAt(0)) * vol * base;

      // Mean reversion toward base price
      const reversion = (base - price) * revert;

      // Demand pressure decays
      const pressure = marketState.demandPressure[r] * base;
      marketState.demandPressure[r] *= 0.9;

      // New price
      const newPrice = Math.max(base * 0.1, price + noise + reversion + pressure);
      marketState.prices[r] = Math.round(newPrice * 100) / 100;

      // Record history every tick
      const currentPrice = marketState.prices[r];
      marketState.priceHistory[r].push({ time: t, price: currentPrice });
      if (marketState.priceHistory[r].length > MAX_HISTORY) {
        marketState.priceHistory[r] = marketState.priceHistory[r].slice(-MAX_HISTORY);
      }

      // Build OHLC candles
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

  marketState.lastTick = currentVirtualTime;
}

/**
 * Get the current market value (mid price) for a resource.
 */
export function getMarketValue(resource) {
  const r = String(resource).toUpperCase();
  if (!BASE_PRICES[r]) return 0;
  if (r === "D" && !marketState.dUnlocked) return 0;
  return marketState.prices[r];
}

/**
 * Get the buy price (slightly above market).
 */
export function getBuyPrice(resource) {
  const mid = getMarketValue(resource);
  return Math.round(mid * (1 + SPREAD) * 100) / 100;
}

/**
 * Get the sell price (slightly below market).
 */
export function getSellPrice(resource) {
  const mid = getMarketValue(resource);
  return Math.round(mid * (1 - SPREAD) * 100) / 100;
}

/**
 * Execute a buy trade. Returns { success, cost, amount }.
 * Buying pushes price up.
 */
export function executeBuy(resource, amount) {
  const r = String(resource).toUpperCase();
  if (!BASE_PRICES[r]) return { success: false, cost: 0, amount: 0 };
  if (r === "D" && !marketState.dUnlocked) return { success: false, cost: 0, amount: 0 };

  const price = getBuyPrice(r);
  const cost = Math.round(price * amount * 100) / 100;

  // Push price up
  marketState.demandPressure[r] += TRADE_IMPACT[r] * amount;

  return { success: true, cost, amount, price: marketState.prices[r] };
}

/**
 * Execute a sell trade. Returns { success, revenue, amount }.
 * Selling pushes price down.
 */
export function executeSell(resource, amount) {
  const r = String(resource).toUpperCase();
  if (!BASE_PRICES[r]) return { success: false, revenue: 0, amount: 0 };
  if (r === "D" && !marketState.dUnlocked) return { success: false, revenue: 0, amount: 0 };

  const price = getSellPrice(r);
  const revenue = Math.round(price * amount * 100) / 100;

  // Push price down
  marketState.demandPressure[r] -= TRADE_IMPACT[r] * amount;

  return { success: true, revenue, amount, price: marketState.prices[r] };
}

/**
 * Track profit from market trades.
 */
export function addMarketProfit(amount) {
  marketState.totalMarketProfit += amount;
}

/**
 * Compute market "emotion" — a fear/greed index from -1 (extreme fear) to +1 (extreme greed).
 * Based on recent price trends across all resources.
 */
export function getMarketEmotion() {
  const resources = marketState.dUnlocked ? ["A", "B", "C", "D"] : ["A", "B", "C"];
  let totalMomentum = 0;
  let count = 0;

  for (const r of resources) {
    const history = marketState.priceHistory[r];
    if (history.length < 5) continue;

    const recent = history.slice(-10);
    const base = BASE_PRICES[r];

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
export function getEmotionLabel(emotion) {
  if (emotion > 0.6) return { label: "EXTREME GREED", color: "#00ff00" };
  if (emotion > 0.3) return { label: "GREED", color: "#88ff44" };
  if (emotion > 0.1) return { label: "OPTIMISM", color: "#aaff66" };
  if (emotion > -0.1) return { label: "NEUTRAL", color: "#888888" };
  if (emotion > -0.3) return { label: "CAUTION", color: "#ffaa44" };
  if (emotion > -0.6) return { label: "FEAR", color: "#ff6644" };
  return { label: "EXTREME FEAR", color: "#ff2222" };
}
