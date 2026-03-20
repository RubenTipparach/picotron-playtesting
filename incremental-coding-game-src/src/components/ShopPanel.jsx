import React from "react";
import { useGameStore } from "../gameStore.js";
import { useTheme } from "../themes.js";

const SELL_PRICES = { A: 1, B: 5, C: 25 };
const SELL_AMOUNTS = [1, 5, 10];

const RAM_UPGRADES = [
  { ram: 256, cost: 50 },
  { ram: 512, cost: 200 },
  { ram: 1024, cost: 800 },
  { ram: 2048, cost: 3000 },
  { ram: 4096, cost: 10000 },
];

const CPU_BASE_COST = 30;

export function ShopPanel() {
  const resources = useGameStore((s) => s.resources);
  const credits = useGameStore((s) => s.credits);
  const ram = useGameStore((s) => s.ram);
  const cpuLevel = useGameStore((s) => s.cpuLevel);
  const tech = useGameStore((s) => s.tech);
  const t = useTheme();

  const sellResource = (name, amount) => {
    const available = resources[name];
    const actual = Math.min(amount, available);
    if (actual <= 0) return;
    useGameStore.getState().consumeResource(name, actual);
    useGameStore.getState().addCredits(actual * SELL_PRICES[name]);
  };

  const buyRam = (upgrade) => {
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

  const btnStyle = (canAfford) => ({
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
          ${credits}
        </span>
      </div>

      {/* Sell Resources */}
      <div style={{ marginBottom: "16px" }}>
        <div style={{ color: t.primaryDim, fontSize: "11px", marginBottom: "8px", letterSpacing: "2px" }}>
          [ SELL RESOURCES ]
        </div>
        {["A", "B", "C"].map((name) => {
          if (name === "B" && !tech.convertAToBUnlocked) return null;
          if (name === "C" && !tech.resourceCUnlocked) return null;
          return (
            <div key={name} style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
              <span style={{ color: t.primary, width: "80px", fontSize: "12px" }}>
                {name} (${SELL_PRICES[name]}ea)
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
}
