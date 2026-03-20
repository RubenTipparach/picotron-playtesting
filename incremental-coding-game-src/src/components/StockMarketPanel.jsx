import React from "react";
import { useGameStore } from "../gameStore.js";
import { useTheme } from "../themes.js";
import { RESOURCE_COLORS } from "../techTree.js";
import {
  getMarketState,
  getMarketEmotion,
  getEmotionLabel,
  getMarketValue,
  getBuyPrice,
  getSellPrice,
} from "../marketEngine.js";

const GREEN = "#22cc44";
const RED = "#ee3333";

/**
 * Candlestick chart — OHLC candles with wicks, grid lines, and price axis.
 */
function CandlestickChart({ candles, color, height = 80 }) {
  const t = useTheme();
  const VB_W = 240;
  const PADDING_R = 40; // right padding for price axis
  const CHART_W = VB_W - PADDING_R;

  if (!candles || candles.length < 2) {
    return (
      <div style={{
        width: "100%",
        height,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "10px",
        color: t.primaryDark,
        backgroundColor: `${t.bg}88`,
        border: `1px solid ${t.border}`,
      }}>
        WAITING FOR DATA...
      </div>
    );
  }

  // Compute price range
  let min = Infinity, max = -Infinity;
  for (const c of candles) {
    if (c.low < min) min = c.low;
    if (c.high > max) max = c.high;
  }
  const pad = (max - min) * 0.1 || 0.5;
  min -= pad;
  max += pad;
  const range = max - min;

  const candleW = Math.min(8, (CHART_W - 4) / candles.length);
  const gap = Math.max(1, candleW * 0.3);
  const bodyW = candleW - gap;

  const toY = (price) => height - ((price - min) / range) * (height - 4) - 2;

  // Grid lines (3 horizontal)
  const gridLines = [];
  for (let i = 0; i <= 3; i++) {
    const price = min + (range * i) / 3;
    gridLines.push({ y: toY(price), label: price.toFixed(2) });
  }

  // Current price line
  const lastCandle = candles[candles.length - 1];
  const currentY = toY(lastCandle.close);

  return (
    <svg
      viewBox={`0 0 ${VB_W} ${height}`}
      preserveAspectRatio="none"
      style={{ display: "block", width: "100%", height, backgroundColor: `${t.bg}88` }}
    >
      {/* Grid lines */}
      {gridLines.map((g, i) => (
        <g key={i}>
          <line
            x1="0" y1={g.y} x2={CHART_W} y2={g.y}
            stroke={t.border} strokeWidth="0.5" strokeDasharray="2,3"
            vectorEffect="non-scaling-stroke"
          />
          <text x={CHART_W + 2} y={g.y + 1} fontSize="7" fill={t.primaryDark} dominantBaseline="middle">
            {g.label}
          </text>
        </g>
      ))}

      {/* Current price horizontal line */}
      <line
        x1="0" y1={currentY} x2={CHART_W} y2={currentY}
        stroke={color} strokeWidth="0.5" strokeDasharray="4,2"
        vectorEffect="non-scaling-stroke" opacity="0.6"
      />

      {/* Candles */}
      {candles.map((c, i) => {
        const x = 2 + i * candleW;
        const isGreen = c.close >= c.open;
        const fill = isGreen ? GREEN : RED;
        const bodyTop = toY(Math.max(c.open, c.close));
        const bodyBot = toY(Math.min(c.open, c.close));
        const bodyH = Math.max(0.5, bodyBot - bodyTop);
        const wickTop = toY(c.high);
        const wickBot = toY(c.low);
        const cx = x + bodyW / 2;

        return (
          <g key={i}>
            {/* Wick */}
            <line
              x1={cx} y1={wickTop} x2={cx} y2={wickBot}
              stroke={fill} strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
            {/* Body */}
            <rect
              x={x} y={bodyTop}
              width={bodyW} height={bodyH}
              fill={isGreen ? fill : fill}
              stroke={fill} strokeWidth="0.5"
              vectorEffect="non-scaling-stroke"
              opacity="0.9"
            />
          </g>
        );
      })}

      {/* Current price label on right */}
      <rect x={CHART_W} y={currentY - 5} width={PADDING_R} height={10} fill={color} rx="1" opacity="0.8" />
      <text x={CHART_W + 2} y={currentY + 1} fontSize="7" fill={t.bg} fontWeight="bold" dominantBaseline="middle">
        {lastCandle.close.toFixed(2)}
      </text>
    </svg>
  );
}

/**
 * Emotions gauge — horizontal bar showing fear/greed spectrum.
 */
function EmotionsGauge({ emotion }) {
  const t = useTheme();
  const { label, color } = getEmotionLabel(emotion);
  const position = (emotion + 1) / 2;

  return (
    <div>
      <div style={{ fontSize: "10px", color: t.primaryDark, marginBottom: "6px" }}>MARKET EMOTION</div>
      <div style={{
        position: "relative",
        height: "14px",
        borderRadius: "3px",
        overflow: "hidden",
        background: `linear-gradient(to right, #ff2222, #ff6644, #ffaa44, #888888, #aaff66, #88ff44, #00ff00)`,
        opacity: 0.7,
      }}>
        <div style={{
          position: "absolute",
          left: `${position * 100}%`,
          top: 0,
          bottom: 0,
          width: "3px",
          backgroundColor: "#fff",
          transform: "translateX(-50%)",
          boxShadow: "0 0 4px rgba(255,255,255,0.8)",
        }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "3px" }}>
        <span style={{ fontSize: "9px", color: "#ff4444" }}>FEAR</span>
        <span style={{ fontSize: "10px", color, fontWeight: "bold" }}>{label}</span>
        <span style={{ fontSize: "9px", color: "#44ff44" }}>GREED</span>
      </div>
    </div>
  );
}

export function StockMarketPanel() {
  const tech = useGameStore((s) => s.tech);
  const resources = useGameStore((s) => s.resources);
  const credits = useGameStore((s) => s.credits);
  // Subscribe to market state changes
  useGameStore((s) => s.market);
  const t = useTheme();

  const market = getMarketState();
  const emotion = getMarketEmotion();

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
      padding: "12px",
      fontFamily: t.font,
      color: t.primary,
      height: "100%",
      overflowY: "auto",
      boxSizing: "border-box",
    }}>
      <div style={{ color: t.primaryDim, fontSize: "11px", marginBottom: "12px", letterSpacing: "2px" }}>
        [ MARKET ]
      </div>

      {/* Market Emotion Gauge */}
      <div style={{ marginBottom: "12px", paddingBottom: "8px", borderBottom: `1px solid ${t.border}` }}>
        <EmotionsGauge emotion={emotion} />
      </div>

      {/* Resource Cards */}
      {tradeableResources.map((r) => {
        const candles = market.candles[r] || [];
        const midPrice = getMarketValue(r);
        const buyP = getBuyPrice(r);
        const sellP = getSellPrice(r);
        const color = RESOURCE_COLORS[r] || t.primary;
        const history = market.priceHistory[r] || [];

        // Price change from last tick
        let changeText = "";
        let changeColor = t.primaryDark;
        if (history.length >= 2) {
          const prev = history[history.length - 2].price;
          const diff = midPrice - prev;
          const pct = ((diff / prev) * 100).toFixed(1);
          if (diff > 0) { changeText = `+${pct}%`; changeColor = GREEN; }
          else if (diff < 0) { changeText = `${pct}%`; changeColor = RED; }
        }

        return (
          <div key={r} style={{ marginBottom: "12px", paddingBottom: "8px", borderBottom: `1px solid ${t.border}` }}>
            {/* Header: name + price */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
              <span style={{ fontSize: "13px", fontWeight: "bold", color }}>
                {r} {r === "D" && <span style={{ fontSize: "9px", color: t.primaryDark }}>VOLATILE</span>}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ color: t.primary, fontSize: "13px", fontWeight: "bold" }}>${midPrice.toFixed(2)}</span>
                {changeText && <span style={{ color: changeColor, fontSize: "10px" }}>{changeText}</span>}
              </div>
            </div>

            {/* Candlestick Chart */}
            <CandlestickChart candles={candles} color={color} height={80} />

            {/* Buy / Sell labels + holdings */}
            <div style={{ display: "flex", gap: "6px", marginTop: "6px", alignItems: "center" }}>
              <span style={{
                padding: "2px 6px",
                fontSize: "10px",
                fontWeight: "bold",
                backgroundColor: `${GREEN}22`,
                color: GREEN,
                border: `1px solid ${GREEN}44`,
              }}>
                BUY ${buyP.toFixed(2)}
              </span>
              <span style={{
                padding: "2px 6px",
                fontSize: "10px",
                fontWeight: "bold",
                backgroundColor: `${RED}22`,
                color: RED,
                border: `1px solid ${RED}44`,
              }}>
                SELL ${sellP.toFixed(2)}
              </span>
              <span style={{ marginLeft: "auto", fontSize: "10px", color: t.primaryDim }}>
                HOLD: {resources[r] || 0}
              </span>
            </div>
          </div>
        );
      })}

      {/* Market Profit Tracker */}
      <div style={{ fontSize: "10px", color: t.primaryDark, marginTop: "4px" }}>
        TOTAL PROFIT: ${Math.floor(market.totalMarketProfit)}
        {!tech.resourceDUnlocked && (
          <span style={{ marginLeft: "8px" }}>
            (${Math.max(0, 200 - Math.floor(market.totalMarketProfit))} more to unlock D)
          </span>
        )}
      </div>
    </div>
  );
}
