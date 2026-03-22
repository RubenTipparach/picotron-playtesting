import React from "react";
import { useGameStore } from "../store/gameStore";
import { useTheme } from "../themes";
import { trackRender } from "../utils/perfMonitor";
import { formatMoney, formatPrice } from "../utils/format";
import { getSellPrice, getBuyPrice, executeSell, executeBuy, addMarketProfit } from "../game/marketEngine";
import { getEffectiveCpuSpeed, getCpuUpgradeCost, getMotherboardSpec, RAM_TIER_COSTS, RAM_TIER_TOKENS, GPU_TIER_COSTS, GPU_TIER_CORES, getEffectiveGpuCores, getMaxTradeVolume } from "../game/hardware";

const BASE_SELL_PRICES: Record<string, number> = { A: 1, B: 5, C: 25 };
const BASE_BUY_PRICES: Record<string, number> = { A: 2, B: 8, C: 35 };
const SELL_AMOUNTS = [1, 5, 10];
const BUY_AMOUNTS = [1, 5, 10];

export const ShopPanel = React.memo(function ShopPanel() {
  trackRender("ShopPanel")();
  const resources = useGameStore((s) => s.resources);
  const credits = useGameStore((s) => s.credits);
  const ram = useGameStore((s) => s.ram);
  const cpuLevel = useGameStore((s) => s.cpuLevel);
  const tech = useGameStore((s) => s.tech);
  const ramModules = useGameStore((s) => s.ramModules);
  const gpuModules = useGameStore((s) => s.gpuModules);
  const motherboardLevel = useGameStore((s) => s.motherboardLevel);
  const internetLevel = useGameStore((s) => s.internetLevel);
  const cpuCores = useGameStore((s) => s.cpuCores);
  const t = useTheme();

  const marketUnlocked = tech.stockMarketUnlocked;
  const maxVolume = getMaxTradeVolume(internetLevel);
  const availableSellAmounts = SELL_AMOUNTS.filter((a) => a <= maxVolume);
  const availableBuyAmounts = BUY_AMOUNTS.filter((a) => a <= maxVolume);

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
    useGameStore.getState().addResource(name as any, amount);
  };

  const sellResource = (name: string, amount: number) => {
    const available = (resources as any)[name];
    const actual = Math.min(amount, available);
    if (actual <= 0) return;
    useGameStore.getState().consumeResource(name as any, actual);
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

  const mbSpec = getMotherboardSpec(motherboardLevel);
  const slotsUsed = ramModules.length;
  const slotsFull = slotsUsed >= mbSpec.maxRamSlots;

  // Get highest unlocked RAM tier
  const getMaxRamTier = () => {
    if (tech.ramTier5Unlocked) return 5;
    if (tech.ramTier4Unlocked) return 4;
    if (tech.ramTier3Unlocked) return 3;
    if (tech.ramTier2Unlocked) return 2;
    return 1;
  };
  const maxTier = getMaxRamTier();

  const buyRamModule = (tier: number) => {
    const cost = RAM_TIER_COSTS[tier] || 10;
    if (credits >= cost && !slotsFull) {
      if (useGameStore.getState().spendCredits(cost)) {
        useGameStore.getState().installRamModule(tier);
      }
    }
  };

  const sellRamModule = (index: number) => {
    const tier = useGameStore.getState().removeRamModule(index);
    if (tier > 0) {
      const refund = (RAM_TIER_COSTS[tier] || 10) * 0.5;
      useGameStore.getState().addCredits(refund);
    }
  };

  const gpuSlotsUsed = gpuModules.length;
  const gpuSlotsFull = gpuSlotsUsed >= mbSpec.maxGpuSlots;
  const totalGpuCores = getEffectiveGpuCores(gpuModules);
  const getMaxGpuTier = () => {
    if (tech.gpuTier5Unlocked) return 5;
    if (tech.gpuTier4Unlocked) return 4;
    if (tech.gpuTier3Unlocked) return 3;
    if (tech.gpuTier2Unlocked) return 2;
    if (tech.gpuTier1Unlocked) return 1;
    return 0;
  };
  const maxGpuTier = getMaxGpuTier();

  const buyGpuModule = (tier: number) => {
    const cost = GPU_TIER_COSTS[tier] || 500;
    if (credits >= cost && !gpuSlotsFull) {
      if (useGameStore.getState().spendCredits(cost)) {
        useGameStore.getState().installGpuModule(tier);
      }
    }
  };

  const sellGpuModule = (index: number) => {
    const tier = useGameStore.getState().removeGpuModule(index);
    if (tier > 0) {
      const refund = (GPU_TIER_COSTS[tier] || 500) * 0.5;
      useGameStore.getState().addCredits(refund);
    }
  };

  const nextCpuCost = getCpuUpgradeCost(cpuLevel);
  const buyCpu = () => {
    if (credits >= nextCpuCost) {
      if (useGameStore.getState().spendCredits(nextCpuCost)) {
        useGameStore.getState().upgradeCpu();
      }
    }
  };

  const BASE_IPS = 10;
  const currentIps = BASE_IPS * getEffectiveCpuSpeed(cpuLevel);
  const nextIps = BASE_IPS * getEffectiveCpuSpeed(cpuLevel + 1);
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
          {formatMoney(credits)}
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
                {name} (${formatPrice(marketUnlocked ? price : price)}ea)
              </span>
              {availableSellAmounts.map((amt) => (
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
                {name} (${formatPrice(marketUnlocked ? price : price)}ea)
              </span>
              {availableBuyAmounts.map((amt) => {
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

      {/* Motherboard Status */}
      <div style={{ marginBottom: "16px" }}>
        <div style={{ color: t.primaryDim, fontSize: "11px", marginBottom: "8px", letterSpacing: "2px" }}>
          [ MOTHERBOARD: {mbSpec.name} ]
        </div>
        <div style={{ fontSize: "11px", color: t.primaryDim, display: "flex", gap: "12px" }}>
          <span>RAM: {slotsUsed}/{mbSpec.maxRamSlots} slots</span>
          <span>CPU: {cpuCores}/{mbSpec.maxCpuCores} cores</span>
          {mbSpec.maxGpuSlots > 0 && <span>GPU: {gpuSlotsUsed}/{mbSpec.maxGpuSlots} slots</span>}
          <span>NET: Lv{internetLevel}</span>
        </div>
      </div>

      {/* RAM Modules */}
      <div style={{ marginBottom: "16px" }}>
        <div style={{ color: t.primaryDim, fontSize: "11px", marginBottom: "8px", letterSpacing: "2px" }}>
          [ RAM — {ram} TOKENS ]
        </div>
        <div style={{ fontSize: "11px", color: t.primaryDim, marginBottom: "6px" }}>
          {slotsUsed}/{mbSpec.maxRamSlots} modules installed
        </div>

        {/* Installed modules with sell buttons */}
        {ramModules.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "6px" }}>
            {ramModules.map((tier, i) => (
              <div key={i} style={{
                display: "inline-flex", alignItems: "center", gap: "4px",
                padding: "2px 6px", fontSize: "10px", fontFamily: t.font,
                backgroundColor: t.bg3, border: `1px solid ${t.border}`, color: t.primaryDim,
              }}>
                T{tier}
                <span
                  onClick={() => sellRamModule(i)}
                  style={{ color: t.red, cursor: "pointer", fontSize: "9px" }}
                  title={`Sell for ${formatMoney((RAM_TIER_COSTS[tier] || 10) * 0.5)}`}
                >
                  [x]
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Buy buttons */}
        {slotsFull ? (
          <div style={{ color: t.primaryDark, fontSize: "11px" }}>
            {motherboardLevel < 3 ? "SLOTS FULL — Research next motherboard" : "ALL SLOTS FULL"}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {Array.from({ length: maxTier }, (_, i) => i + 1).map((tier) => {
              const cost = RAM_TIER_COSTS[tier];
              const canAfford = credits >= cost;
              return (
                <button
                  key={tier}
                  onClick={() => buyRamModule(tier)}
                  disabled={!canAfford}
                  style={{
                    ...btnStyle(canAfford),
                    padding: "4px 12px",
                    fontSize: "11px",
                    width: "100%",
                    textAlign: "left",
                  }}
                >
                  T{tier} Module (+{RAM_TIER_TOKENS[tier] || 8} tokens) — {formatMoney(cost)}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* GPU Modules */}
      {tech.gpuTier1Unlocked && (
        <div style={{ marginBottom: "16px" }}>
          <div style={{ color: t.primaryDim, fontSize: "11px", marginBottom: "8px", letterSpacing: "2px" }}>
            [ GPU — {totalGpuCores} CORES ]
          </div>
          <div style={{ fontSize: "11px", color: t.primaryDim, marginBottom: "6px" }}>
            {gpuSlotsUsed}/{mbSpec.maxGpuSlots} modules installed
          </div>

          {gpuModules.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "6px" }}>
              {gpuModules.map((tier, i) => (
                <div key={i} style={{
                  display: "inline-flex", alignItems: "center", gap: "4px",
                  padding: "2px 6px", fontSize: "10px", fontFamily: t.font,
                  backgroundColor: t.bg3, border: `1px solid ${t.border}`, color: t.primaryDim,
                }}>
                  T{tier} ({GPU_TIER_CORES[tier]}c)
                  <span
                    onClick={() => sellGpuModule(i)}
                    style={{ color: t.red, cursor: "pointer", fontSize: "9px" }}
                    title={`Sell for ${formatMoney((GPU_TIER_COSTS[tier] || 500) * 0.5)}`}
                  >
                    [x]
                  </span>
                </div>
              ))}
            </div>
          )}

          {gpuSlotsFull ? (
            <div style={{ color: t.primaryDark, fontSize: "11px" }}>
              {mbSpec.maxGpuSlots === 0 ? "NO GPU SLOTS — Research next motherboard" : "GPU SLOTS FULL — Research next motherboard"}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {Array.from({ length: maxGpuTier }, (_, i) => i + 1).map((tier) => {
                const cost = GPU_TIER_COSTS[tier];
                const cores = GPU_TIER_CORES[tier];
                const canAfford = credits >= cost;
                return (
                  <button
                    key={tier}
                    onClick={() => buyGpuModule(tier)}
                    disabled={!canAfford}
                    style={{
                      ...btnStyle(canAfford),
                      padding: "4px 12px",
                      fontSize: "11px",
                      width: "100%",
                      textAlign: "left",
                    }}
                  >
                    T{tier} GPU (+{cores} cores) — {formatMoney(cost)}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

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
