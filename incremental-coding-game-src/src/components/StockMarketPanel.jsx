import React, { useRef, useState, useEffect } from "react";
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

/**
 * Mini SVG line chart for a single resource's price history.
 * Uses viewBox for responsive sizing — fills container width.
 */
function PriceChart({ history, color, height = 50 }) {
  const t = useTheme();
  const VB_W = 200;

  if (history.length < 2) {
    return (
      <div style={{ width: "100%", height, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", color: t.primaryDark }}>
        NO DATA
      </div>
    );
  }

  const prices = history.map((h) => h.price);
  const min = Math.min(...prices) * 0.95;
  const max = Math.max(...prices) * 1.05;
  const range = max - min || 1;

  const points = prices.map((p, i) => {
    const x = (i / (prices.length - 1)) * VB_W;
    const y = height - ((p - min) / range) * height;
    return `${x},${y}`;
  }).join(" ");

  const fillPoints = `0,${height} ${points} ${VB_W},${height}`;

  return (
    <svg viewBox={`0 0 ${VB_W} ${height}`} preserveAspectRatio="none" style={{ display: "block", width: "100%", height }}>
      <polygon points={fillPoints} fill={color} opacity="0.08" />
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      {prices.length > 0 && (() => {
        const lastPrice = prices[prices.length - 1];
        const cx = VB_W;
        const cy = height - ((lastPrice - min) / range) * height;
        return <circle cx={cx} cy={cy} r="3" fill={color} vectorEffect="non-scaling-stroke" />;
      })()}
    </svg>
  );
}

/**
 * Emotions gauge — a horizontal bar showing fear/greed spectrum.
 */
function EmotionsGauge({ emotion }) {
  const t = useTheme();
  const { label, color } = getEmotionLabel(emotion);

  // Normalized 0-1 position
  const position = (emotion + 1) / 2;

  return (
    <div>
      <div style={{ fontSize: "10px", color: t.primaryDark, marginBottom: "6px" }}>MARKET EMOTION</div>
      <div style={{
        position: "relative",
        height: "16px",
        borderRadius: "3px",
        overflow: "hidden",
        background: `linear-gradient(to right, #ff2222, #ff6644, #ffaa44, #888888, #aaff66, #88ff44, #00ff00)`,
        opacity: 0.7,
      }}>
        {/* Indicator */}
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
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
        <span style={{ fontSize: "9px", color: "#ff4444" }}>FEAR</span>
        <span style={{ fontSize: "11px", color, fontWeight: "bold" }}>{label}</span>
        <span style={{ fontSize: "9px", color: "#44ff44" }}>GREED</span>
      </div>
    </div>
  );
}

/**
 * Emotions history chart — shows emotion trend over time as a colored line.
 */
function EmotionsChart({ height = 50 }) {
  const t = useTheme();
  const market = getMarketState();
  const VB_W = 200;

  const historyA = market.priceHistory.A || [];
  if (historyA.length < 5) {
    return (
      <div style={{ width: "100%", height, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", color: t.primaryDark }}>
        COLLECTING DATA...
      </div>
    );
  }

  const emotions = [];
  const resources = market.dUnlocked ? ["A", "B", "C", "D"] : ["A", "B", "C"];
  const basePrices = { A: 1, B: 5, C: 25, D: 50 };

  for (let i = 4; i < historyA.length; i++) {
    let momentum = 0;
    let count = 0;
    for (const r of resources) {
      const h = market.priceHistory[r];
      if (!h || h.length <= i) continue;
      const lookback = Math.min(10, i);
      const first = h[i - lookback].price;
      const last = h[i].price;
      const base = basePrices[r];
      const change = (last - first) / base;
      const deviation = (last - base) / base;
      momentum += change * 0.6 + deviation * 0.4;
      count++;
    }
    if (count > 0) {
      const raw = momentum / count;
      emotions.push(Math.max(-1, Math.min(1, raw * 5)));
    }
  }

  if (emotions.length < 2) return null;

  const midY = height / 2;

  const points = emotions.map((e, i) => {
    const x = (i / (emotions.length - 1)) * VB_W;
    const y = midY - (e * midY * 0.9);
    return `${x},${y}`;
  }).join(" ");

  return (
    <div>
      <div style={{ fontSize: "10px", color: t.primaryDark, marginBottom: "4px" }}>EMOTION TREND</div>
      <svg viewBox={`0 0 ${VB_W} ${height}`} preserveAspectRatio="none" style={{ display: "block", width: "100%", height }}>
        <line x1="0" y1={midY} x2={VB_W} y2={midY} stroke={t.border} strokeWidth="1" strokeDasharray="4,4" vectorEffect="non-scaling-stroke" />
        <rect x="0" y={midY} width={VB_W} height={midY} fill="#ff2222" opacity="0.04" />
        <rect x="0" y="0" width={VB_W} height={midY} fill="#00ff00" opacity="0.04" />
        <polyline points={points} fill="none" stroke="#ffcc00" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "8px", color: t.primaryDark }}>
        <span>FEAR</span>
        <span>GREED</span>
      </div>
    </div>
  );
}

export function StockMarketPanel() {
  const tech = useGameStore((s) => s.tech);
  const resources = useGameStore((s) => s.resources);
  const credits = useGameStore((s) => s.credits);
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

  const tradeableResources = market.dUnlocked ? ["A", "B", "C", "D"] : ["A", "B", "C"];

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

      {/* Emotion Trend Chart */}
      <div style={{ marginBottom: "12px", paddingBottom: "8px", borderBottom: `1px solid ${t.border}` }}>
        <EmotionsChart height={50} />
      </div>

      {/* Price Charts + Info */}
      {tradeableResources.map((r) => {
        const history = market.priceHistory[r] || [];
        const midPrice = getMarketValue(r);
        const buyP = getBuyPrice(r);
        const sellP = getSellPrice(r);
        const color = RESOURCE_COLORS[r] || t.primary;

        // Price change indicator
        let changeText = "";
        let changeColor = t.primaryDark;
        if (history.length >= 2) {
          const prev = history[history.length - 2].price;
          const diff = midPrice - prev;
          const pct = ((diff / prev) * 100).toFixed(1);
          if (diff > 0) { changeText = `+${pct}%`; changeColor = "#44ff44"; }
          else if (diff < 0) { changeText = `${pct}%`; changeColor = "#ff4444"; }
          else { changeText = "0%"; }
        }

        return (
          <div key={r} style={{ marginBottom: "12px", paddingBottom: "8px", borderBottom: `1px solid ${t.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
              <span style={{ fontSize: "13px", fontWeight: "bold", color }}>
                {r} {r === "D" && <span style={{ fontSize: "9px", color: t.primaryDark }}>(VOLATILE)</span>}
              </span>
              <span style={{ fontSize: "12px" }}>
                <span style={{ color: t.primary }}>${midPrice.toFixed(2)}</span>
                {changeText && <span style={{ color: changeColor, marginLeft: "6px", fontSize: "10px" }}>{changeText}</span>}
              </span>
            </div>

            <PriceChart history={history} color={color} height={50} />

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px", fontSize: "10px" }}>
              <span style={{ color: t.primaryDark }}>BUY: ${buyP.toFixed(2)}</span>
              <span style={{ color: t.primaryDark }}>SELL: ${sellP.toFixed(2)}</span>
              <span style={{ color: t.primaryDark }}>HAVE: {resources[r] || 0}</span>
            </div>
          </div>
        );
      })}

      {/* Market Profit Tracker */}
      <div style={{ fontSize: "10px", color: t.primaryDark, marginTop: "4px" }}>
        MARKET PROFIT: ${Math.floor(market.totalMarketProfit)}
        {!market.dUnlocked && (
          <span style={{ marginLeft: "8px" }}>
            (earn ${200 - Math.floor(market.totalMarketProfit)} more to unlock D)
          </span>
        )}
      </div>
    </div>
  );
}
