import React from "react";
import { useGameStore } from "../store/gameStore";
import { useTheme } from "../themes";
import { trackRender } from "../utils/perfMonitor";
import { getSellPrice, getBuyPrice, executeSell, executeBuy, addMarketProfit } from "../game/marketEngine";

const BASE_SELL_PRICES: Record<string, number> = { A: 1, B: 5, C: 25 };
const BASE_BUY_PRICES: Record<string, number> = { A: 2, B: 8, C: 35 };
const SELL_AMOUNTS = [1, 5, 10];
const BUY_AMOUNTS = [1, 5, 10];

const RAM_UPGRADES = [
  { ram: 256, cost: 50 },
  { ram: 512, cost: 200 },
  { ram: 1024, cost: 800 },
  { ram: 2048, cost: 3000 },
  { ram: 4096, cost: 10000 },
];

const CPU_BASE_COST = 30;

export const ShopPanel = React.memo(function ShopPanel() {
  trackRender("ShopPanel")();
  const resources = useGameStore((s) => s.resources);
  const credits = useGameStore((s) => s.credits);
  const ram = useGameStore((s) => s.ram);
  const cpuLevel = useGameStore((s) => s.cpuLevel);
  const tech = useGameStore((s) => s.tech);
  const t = useTheme();

  const marketUnlocked = tech.stockMarketUnlocked;

  const getSellPriceDisplay = (name: string) => {
    if (marketUnlocked) {
      return Math.floor(getSellPrice(name) * 100) / 100;
    }
    return BASE_SELL_PRICES[name];
  };

  const getBuyPriceDisplay = (name: string) => {
    if (marketUnlocked) {
      return Math.ceil(getBuyPrice(name) * 100) / 100;
    }
    return BASE_BUY_PRICES[name];
  };

  const buyResource = (name: string, amount: number) => {
    const price = getBuyPriceDisplay(name);
    const totalCost = price * amount;
    if (credits < totalCost) return;
    if (marketUnlocked) {
      const result = executeBuy(name, amount);
      if (!result.success) return;
      const cost = result.cost;
      if (!useGameStore.getState().spendCredits(cost)) return;
    } else {
      if (!useGameStore.getState().spendCredits(totalCost)) return;
    }
    useGameStore.getState().addResource(name, amount);
  };

  const sellResource = (name: string, amount: number) => {
    const available = resources[name];
    const actual = Math.min(amount, available);
    if (actual <= 0) return;
    useGameStore.getState().consumeResource(name, actual);
    if (marketUnlocked) {
      const result = executeSell(name, actual);
      const earned = result.revenue;
      useGameStore.getState().addCredits(earned);
      addMarketProfit(earned);
    } else {
      const earned = actual * BASE_SELL_PRICES[name];
      useGameStore.getState().addCredits(earned);
      addMarketProfit(earned);
    }
    if (name === "B") {
      useGameStore.getState().addShopBSold(actual);
    }
  };

  const getPrice = getSellPriceDisplay;

  const buyRam = (upgrade: { ram: number; cost: number }) => {
    if (credits >= upgrade.cost && ram < upgrade.ram) {
      if (useGameStore.getState().spendCredits(upgrade.cost)) {
        useGameStore.getState().upgradeRam(upgrade.ram);
      }
    }
  };

  const nextCpuCost = Math.round(CPU_BASE_COST * Math.pow(2, cpuLevel));
  const buyCpu = () => {
    if (credits >= nextCpuCost) {
      if (useGameStore.getState().spendCredits(nextCpuCost)) {
        useGameStore.getState().upgradeCpu();
      }
    }
  };

  const nextRam = RAM_UPGRADES.find((u) => u.ram > ram);
  const BASE_IPS = 10;
  const currentIps = BASE_IPS * Math.pow(1.5, cpuLevel);
  const nextIps = BASE_IPS * Math.pow(1.5, cpuLevel + 1);
  const ipsGain = nextIps - currentIps;

  const btnStyle = (canAfford: boolean): React.CSSProperties => ({
    padding: "2px 8px",
    fontSize: "11px",
    fontFamily: t.font,
    backgroundColor: canAfford ? t.bg3 : t.bg,
    color: canAfford ? t.primary : t.primaryDark,
    border: `1px solid ${canAfford ? t.primary : t.border}`,
    cursor: canAfford ? "pointer" : "default",
  });

  return (
    <div style={{ padding: "12px", fontFamily: t.font, color: t.primary, height: "100%", overflowY: "auto", boxSizing: "border-box" }}>
      {/* Credits display */}
      <div style={{ marginBottom: "16px", borderBottom: `1px solid ${t.border}`, paddingBottom: "8px" }}>
        <span style={{ color: t.primaryDim, fontSize: "11px" }}>BALANCE:</span>
        <span style={{ color: t.primary, fontSize: "16px", marginLeft: "8px", fontWeight: "bold" }}>
          ${credits.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>

      {/* Sell Resources */}
      <div style={{ marginBottom: "16px" }}>
        <div style={{ color: t.primaryDim, fontSize: "11px", marginBottom: "8px", letterSpacing: "2px" }}>
          [ SELL RESOURCES {marketUnlocked ? "— MARKET PRICE" : ""} ]
        </div>
        {["A", "B", "C"].map((name) => {
          if (name === "B" && !tech.convertAToBUnlocked) return null;
          if (name === "C" && !tech.resourceCUnlocked) return null;
          const price = getPrice(name);
          return (
            <div key={name} style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
              <span style={{ color: t.primary, width: "90px", fontSize: "12px" }}>
                {name} (${marketUnlocked ? price.toFixed(2) : price}ea)
              </span>
              {SELL_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  onClick={() => sellResource(name, amt)}
                  disabled={resources[name] < 1}
                  style={btnStyle(resources[name] >= amt)}
                >
                  x{amt}
                </button>
              ))}
            </div>
          );
        })}
      </div>

      {/* Buy Resources */}
      <div style={{ marginBottom: "16px" }}>
        <div style={{ color: t.primaryDim, fontSize: "11px", marginBottom: "8px", letterSpacing: "2px" }}>
          [ BUY RESOURCES {marketUnlocked ? "— MARKET PRICE" : ""} ]
        </div>
        {["A", "B", "C"].map((name) => {
          if (name === "B" && !tech.convertAToBUnlocked) return null;
          if (name === "C" && !tech.resourceCUnlocked) return null;
          const price = getBuyPriceDisplay(name);
          return (
            <div key={name} style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
              <span style={{ color: t.primary, width: "90px", fontSize: "12px" }}>
                {name} (${marketUnlocked ? price.toFixed(2) : price}ea)
              </span>
              {BUY_AMOUNTS.map((amt) => {
                const totalCost = price * amt;
                return (
                  <button
                    key={amt}
                    onClick={() => buyResource(name, amt)}
                    disabled={credits < totalCost}
                    style={btnStyle(credits >= totalCost)}
                  >
                    x{amt}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* RAM Upgrade */}
      <div style={{ marginBottom: "16px" }}>
        <div style={{ color: t.primaryDim, fontSize: "11px", marginBottom: "8px", letterSpacing: "2px" }}>
          [ RAM UPGRADE ]
        </div>
        <div style={{ fontSize: "12px", marginBottom: "6px" }}>
          Current: <span style={{ color: t.primary }}>{ram}</span> tokens
        </div>
        {nextRam ? (
          <button
            onClick={() => buyRam(nextRam)}
            disabled={credits < nextRam.cost}
            style={{
              ...btnStyle(credits >= nextRam.cost),
              padding: "4px 12px",
              fontSize: "12px",
              width: "100%",
              textAlign: "left",
            }}
          >
            Upgrade to {nextRam.ram} tokens — ${nextRam.cost}
          </button>
        ) : (
          <div style={{ color: t.primaryDark, fontSize: "11px" }}>MAX CAPACITY</div>
        )}
      </div>

      {/* CPU Upgrade */}
      <div style={{ marginBottom: "16px" }}>
        <div style={{ color: t.primaryDim, fontSize: "11px", marginBottom: "8px", letterSpacing: "2px" }}>
          [ CPU UPGRADE ]
        </div>
        <div style={{ fontSize: "12px", marginBottom: "6px" }}>
          Level: <span style={{ color: t.primary }}>{cpuLevel}</span>
          <span style={{ color: t.primaryDim }}> — {currentIps.toFixed(1)} IPS</span>
        </div>
        <button
          onClick={buyCpu}
          disabled={credits < nextCpuCost}
          style={{
            ...btnStyle(credits >= nextCpuCost),
            padding: "4px 12px",
            fontSize: "12px",
            width: "100%",
            textAlign: "left",
          }}
        >
          +{ipsGain.toFixed(1)} IPS — ${nextCpuCost}
        </button>
      </div>
    </div>
  );
});
