import React, { useState } from "react";
import { useGameStore } from "../store/gameStore";
import { useTheme } from "../themes";
import { RESOURCE_COLORS } from "../game/tech";
import {
  getMarketState,
  getMarketEmotion,
  getEmotionLabel,
  getMarketValue,
  getBuyPrice,
  getSellPrice,
  getMarketCap,
  getMarketUnits,
  executeBuy,
  executeSell,
  addMarketProfit,
} from "../game/marketEngine";
import { trackRender } from "../utils/perfMonitor";

const GREEN = "#22cc44";
const RED = "#ee3333";
const TRADE_AMOUNTS = [1, 5, 10];

// Time windows: label, ticks of history, candles to show
// Each candle = 1s (2 ticks). Tick rate = 2/sec (500ms).
const TIME_WINDOWS = [
  { label: "1m", historyTicks: 120, candles: 60 },
  { label: "5m", historyTicks: 600, candles: 300 },
  { label: "10m", historyTicks: 1200, candles: 600 },
];

// Price axis label width in pixels (HTML overlay)
const PRICE_AXIS_W = 42;

// --- Shared helpers ---

function toYPct(price: number, min: number, range: number) {
  // Returns percentage from top (0% = top, 100% = bottom)
  return 100 - ((price - min) / range) * 100;
}

function makeGrid(min: number, range: number) {
  const lines: { pct: number; label: string }[] = [];
  for (let i = 0; i <= 3; i++) {
    const price = min + (range * i) / 3;
    lines.push({ pct: toYPct(price, min, range), label: price.toFixed(2) });
  }
  return lines;
}

interface PriceAxisProps {
  gridLines: { pct: number; label: string }[];
  currentPct: number;
  currentPrice: number;
  color: string;
  t: any;
  height: number;
}

/** HTML overlay for price axis labels -- not affected by SVG stretching */
function PriceAxis({ gridLines, currentPct, currentPrice, color, t, height }: PriceAxisProps) {
  return (
    <div style={{
      position: "absolute", top: 0, right: 0, bottom: 0,
      width: `${PRICE_AXIS_W}px`, pointerEvents: "none",
    }}>
      {gridLines.map((g, i) => (
        <div key={i} style={{
          position: "absolute", top: `${g.pct}%`, right: "2px", transform: "translateY(-50%)",
          fontSize: "9px", fontFamily: t.font, color: t.primaryDark, whiteSpace: "nowrap",
        }}>
          {g.label}
        </div>
      ))}
      {/* Current price badge */}
      <div style={{
        position: "absolute", top: `${currentPct}%`, right: 0, transform: "translateY(-50%)",
        padding: "1px 4px", fontSize: "9px", fontFamily: t.font, fontWeight: "bold",
        backgroundColor: color, color: t.bg, whiteSpace: "nowrap",
        transition: "top 0.4s ease",
      }}>
        {currentPrice.toFixed(2)}
      </div>
    </div>
  );
}

interface NoDataProps {
  height: number;
  t: any;
}

function NoData({ height, t }: NoDataProps) {
  return (
    <div style={{
      width: "100%", height,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: "10px", color: t.primaryDark,
      backgroundColor: `${t.bg}88`, border: `1px solid ${t.border}`,
    }}>
      WAITING FOR DATA...
    </div>
  );
}

// --- Candlestick Chart ---

interface Candle {
  open: number;
  close: number;
  high: number;
  low: number;
}

interface CandlestickChartProps {
  candles: Candle[];
  color: string;
  height?: number;
  maxCandles?: number;
}

function CandlestickChart({ candles, color, height = 80, maxCandles }: CandlestickChartProps) {
  const t = useTheme();

  if (!candles || candles.length < 2) return <NoData height={height} t={t} />;

  let min = Infinity, max = -Infinity;
  for (const c of candles) {
    if (c.low < min) min = c.low;
    if (c.high > max) max = c.high;
  }
  const pad = (max - min) * 0.1 || 0.5;
  min -= pad; max += pad;
  const range = max - min;

  const VB_W = 200;
  const VB_H = 100;
  const toY = (price: number) => VB_H - ((price - min) / range) * VB_H;

  // Always allocate slots for maxCandles so sizing stays consistent
  const slots = maxCandles || candles.length;
  const candleW = (VB_W - 4) / slots;
  const gap = Math.min(candleW * 0.25, candleW * 0.5);
  const bodyW = Math.max(0.1, candleW - gap);
  // Offset so candles are right-aligned in the chart
  const offset = (slots - candles.length) * candleW;
  const lastCandle = candles[candles.length - 1];

  const gridLines = makeGrid(min, range);
  const currentPct = toYPct(lastCandle.close, min, range);

  return (
    <div style={{ position: "relative", width: "100%", height, backgroundColor: `${t.bg}88` }}>
      {/* SVG chart area -- stretched, no text */}
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        preserveAspectRatio="none"
        style={{ display: "block", width: `calc(100% - ${PRICE_AXIS_W}px)`, height: "100%" }}
      >
        {/* Grid lines */}
        {gridLines.map((g, i) => {
          const y = VB_H - (g.pct / 100) * VB_H;
          return (
            <line key={i} x1="0" y1={y} x2={VB_W} y2={y}
              stroke={t.border} strokeWidth="0.5" strokeDasharray="2,3"
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
        {/* Current price line */}
        <line
          x1="0" y1={toY(lastCandle.close)} x2={VB_W} y2={toY(lastCandle.close)}
          stroke={color} strokeWidth="0.5" strokeDasharray="4,2"
          vectorEffect="non-scaling-stroke" opacity="0.6"
        />
        {/* Candles */}
        {candles.map((c, i) => {
          const x = 2 + offset + i * candleW;
          const isGreen = c.close >= c.open;
          const fill = isGreen ? GREEN : RED;
          const bodyTop = toY(Math.max(c.open, c.close));
          const bodyBot = toY(Math.min(c.open, c.close));
          const bodyH = Math.max(0.5, bodyBot - bodyTop);
          const cx = x + bodyW / 2;
          const isLast = i === candles.length - 1;
          return (
            <g key={i}>
              <line x1={cx} y1={toY(c.high)} x2={cx} y2={toY(c.low)}
                stroke={fill} strokeWidth="1" vectorEffect="non-scaling-stroke"
                style={isLast ? { transition: "y1 0.4s ease, y2 0.4s ease" } : undefined}
              />
              <rect x={x} y={bodyTop} width={bodyW} height={bodyH}
                fill={fill} stroke={fill} strokeWidth="0.5"
                vectorEffect="non-scaling-stroke" opacity="0.9"
                style={isLast ? { transition: "y 0.4s ease, height 0.4s ease" } : undefined}
              />
            </g>
          );
        })}
      </svg>

      {/* HTML price labels */}
      <PriceAxis
        gridLines={gridLines} currentPct={currentPct}
        currentPrice={lastCandle.close} color={color} t={t} height={height}
      />
    </div>
  );
}

// --- Line Chart ---

interface HistoryPoint {
  price: number;
}

interface LineChartProps {
  history: HistoryPoint[];
  color: string;
  height?: number;
}

function LineChart({ history, color, height = 80 }: LineChartProps) {
  const t = useTheme();

  if (!history || history.length < 2) return <NoData height={height} t={t} />;

  const prices = history.map((h) => h.price);
  let min = Math.min(...prices);
  let max = Math.max(...prices);
  const pad = (max - min) * 0.1 || 0.5;
  min -= pad; max += pad;
  const range = max - min;

  const VB_W = 200;
  const VB_H = 100;
  const toY = (price: number) => VB_H - ((price - min) / range) * VB_H;

  const points = prices.map((p, i) => {
    const x = (i / (prices.length - 1)) * VB_W;
    const y = toY(p);
    return `${x},${y}`;
  }).join(" ");

  const fillPoints = `0,${VB_H} ${points} ${VB_W},${VB_H}`;
  const lastPrice = prices[prices.length - 1];

  const gridLines = makeGrid(min, range);
  const currentPct = toYPct(lastPrice, min, range);

  return (
    <div style={{ position: "relative", width: "100%", height, backgroundColor: `${t.bg}88` }}>
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        preserveAspectRatio="none"
        style={{ display: "block", width: `calc(100% - ${PRICE_AXIS_W}px)`, height: "100%" }}
      >
        {/* Grid lines */}
        {gridLines.map((g, i) => {
          const y = VB_H - (g.pct / 100) * VB_H;
          return (
            <line key={i} x1="0" y1={y} x2={VB_W} y2={y}
              stroke={t.border} strokeWidth="0.5" strokeDasharray="2,3"
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
        {/* Current price line */}
        <line
          x1="0" y1={toY(lastPrice)} x2={VB_W} y2={toY(lastPrice)}
          stroke={color} strokeWidth="0.5" strokeDasharray="4,2"
          vectorEffect="non-scaling-stroke" opacity="0.6"
        />
        {/* Area fill + line */}
        <polygon points={fillPoints} fill={color} opacity="0.08" />
        <polyline points={points} fill="none" stroke={color} strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />
        {/* Trailing dot */}
        <circle cx={VB_W} cy={toY(lastPrice)} r="2" fill={color}
          vectorEffect="non-scaling-stroke"
        >
          <animate attributeName="r" values="2;3;2" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="1;0.6;1" dur="2s" repeatCount="indefinite" />
        </circle>
      </svg>

      {/* HTML price labels */}
      <PriceAxis
        gridLines={gridLines} currentPct={currentPct}
        currentPrice={lastPrice} color={color} t={t} height={height}
      />
    </div>
  );
}

// --- Emotions Gauge ---

interface EmotionsGaugeProps {
  emotion: number;
}

function EmotionsGauge({ emotion }: EmotionsGaugeProps) {
  const t = useTheme();
  const { label, color } = getEmotionLabel(emotion);
  const position = (emotion + 1) / 2;

  return (
    <div>
      <div style={{ fontSize: "10px", color: t.primaryDark, marginBottom: "6px" }}>MARKET EMOTION</div>
      <div style={{
        position: "relative", height: "14px", borderRadius: "3px", overflow: "hidden",
        background: `linear-gradient(to right, #ff2222, #ff6644, #ffaa44, #888888, #aaff66, #88ff44, #00ff00)`,
        opacity: 0.7,
      }}>
        <div style={{
          position: "absolute", left: `${position * 100}%`, top: 0, bottom: 0,
          width: "3px", backgroundColor: "#fff", transform: "translateX(-50%)",
          boxShadow: "0 0 4px rgba(255,255,255,0.8)",
          transition: "left 0.5s ease",
        }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "3px" }}>
        <span style={{ fontSize: "9px", color: "#ff4444" }}>FEAR</span>
        <span style={{ fontSize: "10px", color, fontWeight: "bold", transition: "color 0.5s ease" }}>{label}</span>
        <span style={{ fontSize: "9px", color: "#44ff44" }}>GREED</span>
      </div>
    </div>
  );
}

// --- Time Window Selector ---

interface TimeWindowSelectorProps {
  value: string;
  onChange: (label: string) => void;
  t: any;
}

function TimeWindowSelector({ value, onChange, t }: TimeWindowSelectorProps) {
  return (
    <div style={{ display: "flex", gap: "2px" }}>
      {TIME_WINDOWS.map((tw) => {
        const active = value === tw.label;
        return (
          <button
            key={tw.label}
            onClick={() => onChange(tw.label)}
            style={{
              padding: "1px 6px",
              fontSize: "9px",
              fontFamily: t.font,
              backgroundColor: active ? t.primary : t.bg3,
              color: active ? t.bg : t.primaryDark,
              border: `1px solid ${active ? t.primary : t.border}`,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {tw.label}
          </button>
        );
      })}
    </div>
  );
}

// --- Main Panel ---

export const StockMarketPanel = React.memo(function StockMarketPanel() {
  trackRender("StockMarketPanel")();
  const tech = useGameStore((s) => s.tech);
  const resources = useGameStore((s) => s.resources);
  const credits = useGameStore((s) => s.credits);
  useGameStore((s) => s.market);
  const t = useTheme();

  const [chartType, setChartType] = useState<"candle" | "line">("candle");
  const [timeWindow, setTimeWindow] = useState("1m");
  const [tradeAmounts, setTradeAmounts] = useState<Record<string, number>>({});

  const getTradeAmount = (r: string) => tradeAmounts[r] || 1;
  const setTradeAmount = (r: string, amt: number) => setTradeAmounts((prev) => ({ ...prev, [r]: amt }));

  const handleBuy = (r: string, amount: number) => {
    const result = executeBuy(r, amount);
    if (!result.success) return;
    const cost = result.cost;
    if (!useGameStore.getState().spendCredits(cost)) return;
    useGameStore.getState().addResource(r, amount);
  };

  const handleSell = (r: string, amount: number) => {
    const store = useGameStore.getState();
    const available = store.resources[r] || 0;
    const actual = Math.min(amount, available);
    if (actual <= 0) return;
    if (!store.consumeResource(r, actual)) return;
    const result = executeSell(r, actual);
    if (!result.success) {
      store.addResource(r, actual);
      return;
    }
    const earned = result.revenue;
    store.addCredits(earned);
    addMarketProfit(earned);
  };

  const market = getMarketState();
  const emotion = getMarketEmotion();
  const marketCap = getMarketCap();
  const marketUnits = getMarketUnits();

  const tw = TIME_WINDOWS.find((w) => w.label === timeWindow) || TIME_WINDOWS[0];

  if (!tech.stockMarketUnlocked) {
    return (
      <div style={{ padding: "12px", fontFamily: t.font, color: t.primaryDark, fontSize: "12px" }}>
        <div style={{ color: t.primaryDim, fontSize: "11px", marginBottom: "12px", letterSpacing: "2px" }}>
          [ MARKET ]
        </div>
        <div>Unlock the Stock Market in the tech tree to access trading.</div>
      </div>
    );
  }

  const tradeableResources = tech.resourceDUnlocked ? ["A", "B", "C", "D"] : ["A", "B", "C"];

  return (
    <div style={{
      padding: "12px", fontFamily: t.font, color: t.primary,
      height: "100%", overflowY: "auto", boxSizing: "border-box",
    }}>
      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", gap: "6px" }}>
        <span style={{ color: t.primaryDim, fontSize: "11px", letterSpacing: "2px", flexShrink: 0 }}>[ MARKET ]</span>
        <TimeWindowSelector value={timeWindow} onChange={setTimeWindow} t={t} />
        <button
          onClick={() => setChartType((prev) => prev === "candle" ? "line" : "candle")}
          style={{
            padding: "2px 8px", fontSize: "10px", fontFamily: t.font, letterSpacing: "1px",
            backgroundColor: t.bg3, color: t.primary, border: `1px solid ${t.border}`,
            cursor: "pointer", flexShrink: 0,
          }}
        >
          {chartType === "candle" ? "LINE" : "CANDLE"}
        </button>
      </div>

      {/* Market Emotion Gauge */}
      <div style={{ marginBottom: "12px", paddingBottom: "8px", borderBottom: `1px solid ${t.border}` }}>
        <EmotionsGauge emotion={emotion} />
      </div>

      {/* Market Overview */}
      <div style={{ marginBottom: "12px", paddingBottom: "8px", borderBottom: `1px solid ${t.border}` }}>
        <div style={{ fontSize: "10px", color: t.primaryDark, marginBottom: "6px" }}>MARKET OVERVIEW</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <span style={{ fontSize: "12px", fontWeight: "bold", color: t.primary }}>
              MKTCAP ${Math.floor(marketCap).toLocaleString()}
            </span>
          </div>
          <div style={{ fontSize: "10px", color: t.primaryDark }}>
            {market.agentCount} AGENTS
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px", marginTop: "4px", flexWrap: "wrap" }}>
          {tradeableResources.map((r) => {
            const units = Math.floor(marketUnits[r] || 0);
            const clr = RESOURCE_COLORS[r] || t.primary;
            const playerHold = resources[r] || 0;
            const total = units + playerHold;
            const playerPct = total > 0 ? ((playerHold / total) * 100).toFixed(1) : "0.0";
            return (
              <div key={r} style={{ fontSize: "10px", color: clr }}>
                {r}: {units} units
                {playerHold > 0 && (
                  <span style={{ color: t.primaryDark }}> ({playerPct}%)</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Resource Cards */}
      {tradeableResources.map((r) => {
        const allCandles = market.candles[r] || [];
        const allHistory = market.priceHistory[r] || [];
        const candles = allCandles.slice(-tw.candles);
        const history = allHistory.slice(-tw.historyTicks);

        const midPrice = getMarketValue(r);
        const buyP = getBuyPrice(r);
        const sellP = getSellPrice(r);
        const clr = RESOURCE_COLORS[r] || t.primary;

        let changeText = "";
        let changeColor = t.primaryDark;
        if (history.length >= 2) {
          const firstInWindow = history[0].price;
          const diff = midPrice - firstInWindow;
          const pct = ((diff / firstInWindow) * 100).toFixed(1);
          if (diff > 0) { changeText = `+${pct}%`; changeColor = GREEN; }
          else if (diff < 0) { changeText = `${pct}%`; changeColor = RED; }
        }

        return (
          <div key={r} style={{ marginBottom: "12px", paddingBottom: "8px", borderBottom: `1px solid ${t.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
              <span style={{ fontSize: "13px", fontWeight: "bold", color: clr }}>
                {r} {r === "D" && <span style={{ fontSize: "9px", color: t.primaryDark }}>VOLATILE</span>}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ color: t.primary, fontSize: "13px", fontWeight: "bold", transition: "color 0.3s" }}>
                  ${midPrice.toFixed(2)}
                </span>
                {changeText && (
                  <span style={{ color: changeColor, fontSize: "10px", transition: "color 0.3s" }}>
                    {changeText}
                  </span>
                )}
              </div>
            </div>

            {chartType === "candle"
              ? <CandlestickChart candles={candles} color={clr} height={80} maxCandles={tw.candles} />
              : <LineChart history={history} color={clr} height={80} />
            }

            {/* Trade controls */}
            {(() => {
              const selectedAmt = getTradeAmount(r);
              const maxBuyAmt = buyP > 0 ? Math.floor(credits / buyP) : 0;
              const maxSellAmt = resources[r] || 0;
              const isMax = selectedAmt === -1;
              const buyAmt = isMax ? maxBuyAmt : selectedAmt;
              const sellAmt = isMax ? maxSellAmt : Math.min(selectedAmt, maxSellAmt);
              const buyCost = buyP * buyAmt;
              const sellRevenue = sellP * sellAmt;
              const canBuy = buyAmt > 0 && credits >= buyCost;
              const canSell = sellAmt >= 1;
              return (
                <div style={{ marginTop: "6px" }}>
                  {/* Amount selector */}
                  <div style={{ display: "flex", gap: "2px", marginBottom: "4px", alignItems: "center" }}>
                    <span style={{ fontSize: "9px", color: t.primaryDark, marginRight: "4px" }}>QTY</span>
                    {TRADE_AMOUNTS.map((a) => (
                      <button
                        key={a}
                        onClick={() => setTradeAmount(r, a)}
                        style={{
                          padding: "1px 6px", fontSize: "9px", fontFamily: t.font,
                          backgroundColor: selectedAmt === a ? t.primary : t.bg3,
                          color: selectedAmt === a ? t.bg : t.primaryDark,
                          border: `1px solid ${selectedAmt === a ? t.primary : t.border}`,
                          cursor: "pointer",
                        }}
                      >
                        {a}x
                      </button>
                    ))}
                    {tech.maxTradeUnlocked && (
                      <button
                        onClick={() => setTradeAmount(r, -1)}
                        style={{
                          padding: "1px 6px", fontSize: "9px", fontFamily: t.font,
                          backgroundColor: isMax ? t.primary : t.bg3,
                          color: isMax ? t.bg : t.primaryDark,
                          border: `1px solid ${isMax ? t.primary : t.border}`,
                          cursor: "pointer",
                        }}
                      >
                        MAX
                      </button>
                    )}
                    <span style={{ marginLeft: "auto", fontSize: "10px", color: t.primaryDim }}>
                      HOLD: {resources[r] || 0}
                    </span>
                  </div>
                  {/* Buy / Sell buttons with cost preview */}
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      onClick={() => handleBuy(r, buyAmt)}
                      disabled={!canBuy}
                      style={{
                        flex: 1, padding: "4px 6px", fontSize: "10px", fontWeight: "bold",
                        fontFamily: t.font,
                        backgroundColor: canBuy ? `${GREEN}22` : `${GREEN}0a`,
                        color: canBuy ? GREEN : `${GREEN}66`,
                        border: `1px solid ${canBuy ? `${GREEN}66` : `${GREEN}22`}`,
                        cursor: canBuy ? "pointer" : "default",
                        textAlign: "center",
                      }}
                    >
                      BUY {buyAmt}x — ${buyCost.toFixed(2)}
                    </button>
                    <button
                      onClick={() => handleSell(r, sellAmt)}
                      disabled={!canSell}
                      style={{
                        flex: 1, padding: "4px 6px", fontSize: "10px", fontWeight: "bold",
                        fontFamily: t.font,
                        backgroundColor: canSell ? `${RED}22` : `${RED}0a`,
                        color: canSell ? RED : `${RED}66`,
                        border: `1px solid ${canSell ? `${RED}66` : `${RED}22`}`,
                        cursor: canSell ? "pointer" : "default",
                        textAlign: "center",
                      }}
                    >
                      SELL {sellAmt}x — ${sellRevenue.toFixed(2)}
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        );
      })}

      <div style={{ fontSize: "10px", color: t.primaryDark, marginTop: "4px" }}>
        TRADE REVENUE: ${market.totalMarketProfit.toFixed(2)}
        {!tech.resourceDUnlocked && (
          <span style={{ marginLeft: "8px" }}>
            (${Math.max(0, 1000 - market.totalMarketProfit).toFixed(2)} more to unlock D)
          </span>
        )}
      </div>
    </div>
  );
});
