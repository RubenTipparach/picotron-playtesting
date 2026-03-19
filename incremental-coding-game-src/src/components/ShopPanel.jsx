import React from "react";
import { useGameStore } from "../gameStore.js";

const SELL_PRICES = { A: 1, B: 5, C: 25 };
const SELL_AMOUNTS = [1, 5, 10];

const RAM_UPGRADES = [
  { ram: 512, cost: 50 },
  { ram: 1024, cost: 200 },
  { ram: 2048, cost: 800 },
  { ram: 4096, cost: 3000 },
  { ram: 8192, cost: 10000 },
];

const CPU_BASE_COST = 30;

export function ShopPanel() {
  const resources = useGameStore((s) => s.resources);
  const credits = useGameStore((s) => s.credits);
  const ram = useGameStore((s) => s.ram);
  const cpuLevel = useGameStore((s) => s.cpuLevel);
  const tech = useGameStore((s) => s.tech);

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
  const cpuSpeedPercent = Math.round((1 - Math.pow(0.5, cpuLevel)) * 100);

  return (
    <div style={{ padding: "12px", fontFamily: "'Courier New', monospace", color: "#00ff41", height: "100%", overflowY: "auto", boxSizing: "border-box" }}>
      {/* Credits display */}
      <div style={{ marginBottom: "16px", borderBottom: "1px solid #003300", paddingBottom: "8px" }}>
        <span style={{ color: "#00cc33", fontSize: "11px" }}>BALANCE:</span>
        <span style={{ color: "#00ff41", fontSize: "16px", marginLeft: "8px", fontWeight: "bold" }}>
          ${credits}
        </span>
      </div>

      {/* Sell Resources */}
      <div style={{ marginBottom: "16px" }}>
        <div style={{ color: "#00cc33", fontSize: "11px", marginBottom: "8px", letterSpacing: "2px" }}>
          [ SELL RESOURCES ]
        </div>
        {["A", "B", "C"].map((name) => {
          if (name === "B" && !tech.convertAToBUnlocked) return null;
          if (name === "C" && !tech.resourceCUnlocked) return null;
          return (
            <div key={name} style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
              <span style={{ color: "#00ff41", width: "80px", fontSize: "12px" }}>
                {name} (${SELL_PRICES[name]}ea)
              </span>
              {SELL_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  onClick={() => sellResource(name, amt)}
                  disabled={resources[name] < 1}
                  style={{
                    padding: "2px 8px",
                    fontSize: "11px",
                    fontFamily: "'Courier New', monospace",
                    backgroundColor: resources[name] >= amt ? "#001a00" : "#0a0a0a",
                    color: resources[name] >= amt ? "#00ff41" : "#004400",
                    border: `1px solid ${resources[name] >= amt ? "#00ff41" : "#003300"}`,
                    cursor: resources[name] >= amt ? "pointer" : "default",
                  }}
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
        <div style={{ color: "#00cc33", fontSize: "11px", marginBottom: "8px", letterSpacing: "2px" }}>
          [ RAM UPGRADE ]
        </div>
        <div style={{ fontSize: "12px", marginBottom: "6px" }}>
          Current: <span style={{ color: "#00ff41" }}>{ram}</span> chars
        </div>
        {nextRam ? (
          <button
            onClick={() => buyRam(nextRam)}
            disabled={credits < nextRam.cost}
            style={{
              padding: "4px 12px",
              fontSize: "12px",
              fontFamily: "'Courier New', monospace",
              backgroundColor: credits >= nextRam.cost ? "#001a00" : "#0a0a0a",
              color: credits >= nextRam.cost ? "#00ff41" : "#004400",
              border: `1px solid ${credits >= nextRam.cost ? "#00ff41" : "#003300"}`,
              cursor: credits >= nextRam.cost ? "pointer" : "default",
              width: "100%",
              textAlign: "left",
            }}
          >
            Upgrade to {nextRam.ram} chars — ${nextRam.cost}
          </button>
        ) : (
          <div style={{ color: "#004400", fontSize: "11px" }}>MAX CAPACITY</div>
        )}
      </div>

      {/* CPU Upgrade */}
      <div style={{ marginBottom: "16px" }}>
        <div style={{ color: "#00cc33", fontSize: "11px", marginBottom: "8px", letterSpacing: "2px" }}>
          [ CPU UPGRADE ]
        </div>
        <div style={{ fontSize: "12px", marginBottom: "6px" }}>
          Level: <span style={{ color: "#00ff41" }}>{cpuLevel}</span>
          {cpuLevel > 0 && <span style={{ color: "#00cc33" }}> (+{cpuSpeedPercent}% speed)</span>}
        </div>
        <button
          onClick={buyCpu}
          disabled={credits < nextCpuCost}
          style={{
            padding: "4px 12px",
            fontSize: "12px",
            fontFamily: "'Courier New', monospace",
            backgroundColor: credits >= nextCpuCost ? "#001a00" : "#0a0a0a",
            color: credits >= nextCpuCost ? "#00ff41" : "#004400",
            border: `1px solid ${credits >= nextCpuCost ? "#00ff41" : "#003300"}`,
            cursor: credits >= nextCpuCost ? "pointer" : "default",
            width: "100%",
            textAlign: "left",
          }}
        >
          Level {cpuLevel + 1} — ${nextCpuCost}
        </button>
      </div>
    </div>
  );
}
