import React, { useState, useEffect } from "react";
import { useGameStore } from "../gameStore.js";
import { TECH_TREE, getAvailableUpgrades, TECH_TO_DOCS_SECTION } from "../techTree.js";
import { useTheme } from "../themes.js";

function ResourceCostBadge({ resource, amount, available, t }) {
  const hasEnough = available >= amount;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      padding: "2px 6px", fontSize: "11px", fontFamily: t.font,
      backgroundColor: hasEnough ? t.bg3 : t.bg,
      color: hasEnough ? t.primary : t.textMuted,
      border: `1px solid ${hasEnough ? t.primary : t.border}`,
      marginRight: "4px",
    }} title={`${amount} ${resource} (${available} available)`}>
      {amount}{resource}
    </span>
  );
}

function TechNode({ tech, isUnlocked, isAvailable, isSelected, resources, onClick, size, t }) {
  const canAfford = tech.cost.every((c) => resources[c.resource] >= c.amount);
  const borderColor = isSelected ? t.borderBright : isUnlocked ? t.primaryDim : isAvailable && canAfford ? t.yellow : t.textMuted;

  return (
    <div
      onClick={onClick}
      style={{
        width: `${size}px`, height: `${size}px`,
        backgroundColor: isUnlocked ? t.bg3 : t.bg,
        border: `${isSelected ? "2px" : "1px"} solid ${borderColor}`,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        cursor: "pointer",
        boxShadow: isSelected ? `0 0 15px ${t.primary}4d` : isUnlocked ? `0 0 8px ${t.primary}1a` : "none",
        transition: "all 0.2s",
        position: "relative",
        flexShrink: 0,
      }}
      title={tech.name}
    >
      <div style={{ fontSize: size > 60 ? "28px" : "20px", lineHeight: "1", filter: isUnlocked ? "none" : "brightness(0.7)" }}>
        {tech.icon}
      </div>
      {!isUnlocked && (
        <div style={{ position: "absolute", bottom: "3px", display: "flex", gap: "2px" }}>
          {tech.cost.length > 0
            ? tech.cost.slice(0, 2).map((cost, i) => (
                <div key={i} style={{
                  fontSize: size > 60 ? "8px" : "7px", fontFamily: t.font,
                  color: resources[cost.resource] >= cost.amount ? t.primary : t.textMuted,
                }}>
                  {cost.amount}{cost.resource}
                </div>
              ))
            : tech.progressInfo && (() => {
                const info = tech.progressInfo();
                const pct = Math.min(100, Math.floor((info.current / info.target) * 100));
                return (
                  <div style={{
                    fontSize: size > 60 ? "8px" : "7px", fontFamily: t.font,
                    color: pct >= 100 ? t.primary : t.yellow,
                  }}>
                    ${info.current}/${info.target}
                  </div>
                );
              })()
          }
        </div>
      )}
      {isUnlocked && (
        <div style={{ position: "absolute", top: "3px", right: "3px", color: t.primary, fontSize: "10px" }}>+</div>
      )}
      {!isUnlocked && isAvailable && canAfford && (
        <div style={{ position: "absolute", top: "3px", right: "3px", color: t.yellow, fontSize: "10px", animation: "pulse 2s infinite" }}>!</div>
      )}
    </div>
  );
}

export function TechTreePanel({ isOpen, onClose, onFocus, onUnlock, onOpenDocs, initialSelectedTechId }) {
  const techState = useGameStore((s) => s.tech);
  const resources = useGameStore((s) => s.resources);
  const [selectedTechId, setSelectedTechId] = useState(initialSelectedTechId);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const t = useTheme();

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (initialSelectedTechId) { setSelectedTechId(initialSelectedTechId); return; }
      if (selectedTechId) return;
      const available = getAvailableUpgrades(resources, techState);
      if (available.length > 0) setSelectedTechId(available[0].id);
      else if (TECH_TREE.length > 0) setSelectedTechId(TECH_TREE[0].id);
    }
  }, [isOpen, selectedTechId, resources, techState, initialSelectedTechId]);

  useEffect(() => { if (selectedTechId) onFocus(); }, [selectedTechId, onFocus]);

  const selectedTech = TECH_TREE.find((tt) => tt.id === selectedTechId);
  const availableUpgrades = getAvailableUpgrades(resources, techState);
  const canUnlockSelected = selectedTech && availableUpgrades.some((u) => u.id === selectedTechId);

  const handleUnlock = () => {
    if (!selectedTech) return;
    if (!techState[selectedTech.id] && selectedTech.threshold(resources)) {
      if (useGameStore.getState().consumeResources(selectedTech.cost)) {
        useGameStore.getState().unlockTech(selectedTech.id);
        onUnlock?.(selectedTech.id);
      }
    }
  };

  const getTechStatus = (node) => {
    if (techState[node.id]) return "unlocked";
    const depsMet = !node.dependencies || node.dependencies.every((d) => techState[d]);
    return node.threshold(resources) && depsMet ? "available" : "locked";
  };

  if (!isOpen) return null;

  // ── Detail panel content (shared) ──
  const detailContent = selectedTech ? (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", borderBottom: `1px solid ${t.border}`, paddingBottom: "10px" }}>
        <div style={{ fontSize: "28px", filter: techState[selectedTech.id] ? "none" : "brightness(0.7)" }}>{selectedTech.icon}</div>
        <div>
          <div style={{ color: t.primary, fontSize: "13px", fontWeight: "bold" }}>{selectedTech.name}</div>
          {techState[selectedTech.id] && <div style={{ color: t.primaryDim, fontSize: "10px" }}>UNLOCKED</div>}
        </div>
      </div>
      <p style={{ margin: 0, color: t.primaryDim, fontSize: "11px", lineHeight: 1.5 }}>{selectedTech.description}</p>

      {!techState[selectedTech.id] && selectedTech.cost.length > 0 && (
        <div style={{ padding: "8px", backgroundColor: t.bg3, border: `1px solid ${t.border}` }}>
          <div style={{ color: t.textDim, fontSize: "10px", marginBottom: "6px", letterSpacing: "1px" }}>COST</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
            {selectedTech.cost.map((c, i) => (
              <ResourceCostBadge key={i} resource={c.resource} amount={c.amount} available={resources[c.resource]} t={t} />
            ))}
          </div>
        </div>
      )}

      {!techState[selectedTech.id] && selectedTech.progressInfo && (() => {
        const info = selectedTech.progressInfo();
        const pct = Math.min(100, (info.current / info.target) * 100);
        return (
          <div style={{ padding: "8px", backgroundColor: t.bg3, border: `1px solid ${t.border}` }}>
            <div style={{ color: t.textDim, fontSize: "10px", marginBottom: "6px", letterSpacing: "1px" }}>OBJECTIVE</div>
            <div style={{ fontSize: "11px", color: pct >= 100 ? t.primary : t.primaryDim, marginBottom: "4px" }}>
              {info.label}
            </div>
            <div style={{ height: "6px", backgroundColor: t.bg, border: `1px solid ${t.border}`, overflow: "hidden" }}>
              <div style={{
                height: "100%",
                width: `${pct}%`,
                backgroundColor: pct >= 100 ? t.primary : t.yellow,
                transition: "width 0.3s",
              }} />
            </div>
          </div>
        );
      })()}

      {techState[selectedTech.id] ? (
        <div>
          <div style={{ padding: "8px", backgroundColor: t.bg3, border: `1px solid ${t.borderBright}`, color: t.primary, fontSize: "11px", textAlign: "center" }}>
            + UNLOCKED
          </div>
          {onOpenDocs && (
            <button
              onClick={() => onOpenDocs(TECH_TO_DOCS_SECTION[selectedTech.id] || "")}
              style={{
                marginTop: "8px", width: "100%", padding: "10px",
                backgroundColor: t.bg3, color: t.primary,
                border: `1px solid ${t.borderBright}`, cursor: "pointer",
                fontSize: "11px", fontFamily: t.font,
              }}
            >
              [VIEW DOCS]
            </button>
          )}
        </div>
      ) : (
        <button
          onClick={handleUnlock}
          disabled={!canUnlockSelected}
          style={{
            width: "100%", padding: "12px",
            backgroundColor: canUnlockSelected ? t.bg3 : t.bg,
            color: canUnlockSelected ? t.primary : t.textMuted,
            border: `1px solid ${canUnlockSelected ? t.borderBright : t.border}`,
            cursor: canUnlockSelected ? "pointer" : "not-allowed",
            fontSize: "12px", fontFamily: t.font,
            letterSpacing: "1px",
          }}
        >
          {canUnlockSelected ? "[UNLOCK]" : "INSUFFICIENT"}
        </button>
      )}
    </div>
  ) : (
    <div style={{ color: t.textMuted, fontSize: "11px" }}>Select a node...</div>
  );

  // ── MOBILE TECH TREE: full screen, vertical list ──
  if (isMobile) {
    return (
      <div
        style={{ position: "fixed", inset: 0, backgroundColor: t.bg, zIndex: 10000, display: "flex", flexDirection: "column", fontFamily: t.font }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: `1px solid ${t.border}`, flexShrink: 0 }}>
          <span style={{ color: t.primary, fontSize: "12px", letterSpacing: "2px" }}>[ TECH TREE ]</span>
          <button onClick={onClose} style={{ background: "none", border: `1px solid ${t.borderBright}`, color: t.primary, cursor: "pointer", fontSize: "12px", fontFamily: t.font, padding: "6px 12px" }}>[CLOSE]</button>
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflow: "auto", padding: "12px" }}>
          {/* Tech nodes as a vertical list */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {TECH_TREE.map((node) => {
              const status = getTechStatus(node);
              const isSelected = selectedTechId === node.id;
              const canAfford = node.cost.every((c) => resources[c.resource] >= c.amount);
              const borderColor = isSelected ? t.borderBright : status === "unlocked" ? t.primaryDim : status === "available" && canAfford ? t.yellow : t.textMuted;

              return (
                <div
                  key={node.id}
                  onClick={() => setSelectedTechId(node.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "10px 12px",
                    backgroundColor: isSelected ? t.bg3 : t.bg,
                    border: `1px solid ${borderColor}`,
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  <div style={{ fontSize: "24px", width: "36px", textAlign: "center", flexShrink: 0, filter: status === "unlocked" ? "none" : "brightness(0.7)" }}>
                    {node.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: status === "unlocked" ? t.primaryDim : t.primary, fontSize: "12px", fontWeight: "bold" }}>
                      {node.name}
                    </div>
                    <div style={{ color: t.primaryDark, fontSize: "10px", marginTop: "2px" }}>
                      {status === "unlocked"
                        ? "UNLOCKED"
                        : node.cost.length > 0
                          ? node.cost.map((c) => `${c.amount}${c.resource}`).join(" + ")
                          : node.progressInfo
                            ? node.progressInfo().label
                            : ""}
                    </div>
                  </div>
                  {status === "unlocked" && <span style={{ color: t.primaryDim, fontSize: "12px" }}>+</span>}
                  {status === "available" && canAfford && <span style={{ color: t.yellow, fontSize: "12px", animation: "pulse 2s infinite" }}>!</span>}
                </div>
              );
            })}
          </div>

          {/* Selected detail */}
          {selectedTech && (
            <div style={{ marginTop: "16px", padding: "12px", backgroundColor: t.bg3, border: `1px solid ${t.border}` }}>
              {detailContent}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── DESKTOP TECH TREE: grid layout with side panel ──
  const maxRow = Math.max(...TECH_TREE.map((tt) => tt.position?.row || 0));
  const maxCol = Math.max(...TECH_TREE.map((tt) => tt.position?.col || 0));
  const CELL_SIZE = 130;
  const NODE_SIZE = 80;
  const gridWidth = (maxCol + 1) * CELL_SIZE;
  const gridHeight = (maxRow + 1) * CELL_SIZE;

  return (
    <div
      style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.85)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: t.bg, border: `1px solid ${t.borderBright}`,
          padding: "20px", width: "90%", maxWidth: "1100px", maxHeight: "85vh",
          boxShadow: `0 0 40px ${t.primary}26`,
          display: "grid", gridTemplateRows: "auto 1fr", gridTemplateColumns: "1fr 300px",
          gap: "16px", overflow: "hidden", fontFamily: t.font,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: t.primary, fontSize: "12px", letterSpacing: "2px" }}>[ TECH TREE ]</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: t.primary, cursor: "pointer", fontSize: "14px", fontFamily: t.font }}>[X]</button>
        </div>

        {/* Graph */}
        <div style={{ overflow: "auto", backgroundColor: t.bgAlt, border: `1px solid ${t.border}`, padding: "30px" }}>
          <div style={{ position: "relative", width: gridWidth, height: gridHeight }}>
            {/* Lines */}
            {TECH_TREE.map((node) => {
              if (!node.dependencies?.length || !node.position) return null;
              return node.dependencies.map((depId) => {
                const dep = TECH_TREE.find((tt) => tt.id === depId);
                if (!dep?.position) return null;
                const isDepUnlocked = techState[depId];
                const x1 = dep.position.col * CELL_SIZE + NODE_SIZE / 2;
                const y1 = dep.position.row * CELL_SIZE + NODE_SIZE / 2;
                const x2 = node.position.col * CELL_SIZE + NODE_SIZE / 2;
                const y2 = node.position.row * CELL_SIZE + NODE_SIZE / 2;
                const dx = x2 - x1, dy = y2 - y1;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const angle = Math.atan2(dy, dx) * (180 / Math.PI);
                const inset = NODE_SIZE / 2 + 2;
                const sx = x1 + (dx / dist) * inset, sy = y1 + (dy / dist) * inset;
                const len = dist - inset * 2;

                return (
                  <div key={`${depId}-${node.id}`} style={{
                    position: "absolute", left: sx, top: sy,
                    width: `${len}px`, height: isDepUnlocked ? "2px" : "1px",
                    backgroundColor: isDepUnlocked ? t.primary : t.textMuted,
                    transformOrigin: "0 50%", transform: `rotate(${angle}deg)`,
                    opacity: isDepUnlocked ? 0.8 : 0.6,
                  }} />
                );
              });
            })}

            {/* Nodes */}
            {TECH_TREE.map((node) => {
              if (!node.position) return null;
              const status = getTechStatus(node);
              return (
                <div key={node.id} style={{ position: "absolute", left: node.position.col * CELL_SIZE, top: node.position.row * CELL_SIZE }}>
                  <TechNode
                    tech={node}
                    isUnlocked={status === "unlocked"}
                    isAvailable={status === "available"}
                    isSelected={selectedTechId === node.id}
                    resources={resources}
                    onClick={() => setSelectedTechId(node.id)}
                    size={NODE_SIZE}
                    t={t}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Detail Panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", borderLeft: `1px solid ${t.border}`, paddingLeft: "16px", overflowY: "auto" }}>
          {detailContent}
        </div>
      </div>
    </div>
  );
}
