/**
 * TechTreePanel Component
 *
 * Interactive tech tree modal with:
 * - Visual node graph with dependency lines
 * - Node selection with detail panel
 * - Unlock button with cost display
 * - "View in Docs" link for unlocked techs
 */

import React, { useState, useEffect } from "react";
import { useGameStore } from "../gameStore.js";
import {
  TECH_TREE,
  getAvailableUpgrades,
  RESOURCE_COLORS,
  TECH_TO_DOCS_SECTION,
} from "../techTree.js";

// ── Resource Cost Badge ──
function ResourceCostBadge({ resource, amount, available }) {
  const hasEnough = available >= amount;
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "24px",
        height: "24px",
        backgroundColor: RESOURCE_COLORS[resource],
        borderRadius: "4px",
        fontSize: "11px",
        fontWeight: "bold",
        color: "#fff",
        marginRight: "4px",
        opacity: hasEnough ? 1 : 0.5,
        border: hasEnough ? "2px solid #fff" : "2px solid transparent",
      }}
      title={`${amount} ${resource} (${available} available)`}
    >
      {amount}
    </div>
  );
}

// ── Tech Node (single node in the graph) ──
function TechNode({ tech, isUnlocked, isAvailable, isSelected, resources, onClick }) {
  const canAfford = tech.cost.every((c) => resources[c.resource] >= c.amount);

  return (
    <div
      onClick={onClick}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.transform = "scale(1.1)";
          e.currentTarget.style.zIndex = "10";
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.zIndex = "1";
        }
      }}
      style={{
        position: "relative",
        width: "80px",
        height: "80px",
        background: isUnlocked
          ? "linear-gradient(135deg, #2d4a5c 0%, #1a3a4a 100%)"
          : isAvailable && canAfford
            ? "linear-gradient(135deg, #3d2d1e 0%, #2a1f15 100%)"
            : "linear-gradient(135deg, #1f1f1f 0%, #151515 100%)",
        border: isSelected
          ? "3px solid #4a9eff"
          : isUnlocked
            ? "2px solid #4a9eff"
            : isAvailable && canAfford
              ? "2px solid #ff6b35"
              : "2px solid #4a4a4a",
        borderRadius: "12px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        boxShadow: isSelected
          ? "0 0 20px rgba(74, 158, 255, 0.8), 0 4px 12px rgba(0, 0, 0, 0.5)"
          : isUnlocked
            ? "0 0 12px rgba(74, 158, 255, 0.4), 0 2px 8px rgba(0, 0, 0, 0.3)"
            : isAvailable && canAfford
              ? "0 0 8px rgba(255, 107, 53, 0.3), 0 2px 6px rgba(0, 0, 0, 0.2)"
              : "0 2px 4px rgba(0, 0, 0, 0.2)",
      }}
      title={tech.name}
    >
      {/* Icon */}
      <div
        style={{
          fontSize: "36px",
          lineHeight: "1",
          marginBottom: "2px",
          filter: isUnlocked ? "none" : isAvailable ? "brightness(0.9)" : "brightness(0.5)",
        }}
      >
        {tech.icon}
      </div>

      {/* Cost indicators at bottom */}
      <div
        style={{
          position: "absolute",
          bottom: "4px",
          left: "50%",
          transform: "translateX(-50%)",
          gap: "2px",
          display: isUnlocked ? "none" : "flex",
        }}
      >
        {tech.cost.slice(0, 2).map((cost, i) => (
          <div
            key={i}
            style={{
              width: "14px",
              height: "14px",
              backgroundColor: RESOURCE_COLORS[cost.resource],
              borderRadius: "3px",
              fontSize: "8px",
              fontWeight: "bold",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: resources[cost.resource] >= cost.amount ? 1 : 0.5,
            }}
            title={`${cost.amount} ${cost.resource}`}
          >
            {cost.amount}
          </div>
        ))}
      </div>

      {/* Unlocked checkmark */}
      {isUnlocked && (
        <div
          style={{
            position: "absolute",
            top: "6px",
            right: "6px",
            width: "16px",
            height: "16px",
            background: "linear-gradient(135deg, #4a9eff 0%, #2d5a8f 100%)",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "10px",
            color: "#fff",
            boxShadow: "0 2px 4px rgba(74, 158, 255, 0.5)",
          }}
        >
          ✓
        </div>
      )}

      {/* Available indicator */}
      {!isUnlocked && isAvailable && canAfford && (
        <div
          style={{
            position: "absolute",
            top: "6px",
            right: "6px",
            width: "16px",
            height: "16px",
            background: "linear-gradient(135deg, #ff6b35 0%, #cc5529 100%)",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "10px",
            color: "#fff",
            boxShadow: "0 2px 4px rgba(255, 107, 53, 0.5)",
            animation: "pulse 2s infinite",
          }}
        >
          !
        </div>
      )}
    </div>
  );
}

// ── Main TechTreePanel ──
export function TechTreePanel({
  isOpen,
  onClose,
  onFocus,
  onUnlock,
  onOpenDocs,
  initialSelectedTechId,
}) {
  const tech = useGameStore((state) => state.tech);
  const resources = useGameStore((state) => state.resources);
  const [selectedTechId, setSelectedTechId] = useState(initialSelectedTechId);

  // Auto-select first available upgrade when opening
  useEffect(() => {
    if (isOpen) {
      if (initialSelectedTechId) {
        setSelectedTechId(initialSelectedTechId);
        return;
      }
      if (selectedTechId) return;

      const available = getAvailableUpgrades(resources, tech);
      if (available.length > 0) {
        setSelectedTechId(available[0].id);
      } else if (TECH_TREE.length > 0) {
        setSelectedTechId(TECH_TREE[0].id);
      }
    }
  }, [isOpen, selectedTechId, resources, tech, initialSelectedTechId]);

  useEffect(() => {
    if (selectedTechId) onFocus();
  }, [selectedTechId, onFocus]);

  const selectedTech = TECH_TREE.find((t) => t.id === selectedTechId);
  const availableUpgrades = getAvailableUpgrades(resources, tech);
  const canUnlockSelected = selectedTech && availableUpgrades.some((u) => u.id === selectedTechId);

  const handleUnlock = () => {
    if (!selectedTech) return;
    const isUnlocked = tech[selectedTech.id];
    const meetsThreshold = selectedTech.threshold(resources);
    if (!isUnlocked && meetsThreshold) {
      if (useGameStore.getState().consumeResources(selectedTech.cost)) {
        useGameStore.getState().unlockTech(selectedTech.id);
        onUnlock?.(selectedTech.id);
      }
    }
  };

  const getTechStatus = (techNode) => {
    const isUnlocked = tech[techNode.id];
    const meetsThreshold = techNode.threshold(resources);
    const depsMet = !techNode.dependencies || techNode.dependencies.every((d) => tech[d]);
    return isUnlocked ? "unlocked" : meetsThreshold && depsMet ? "available" : "locked";
  };

  // Grid layout calculations
  const maxRow = Math.max(...TECH_TREE.map((t) => t.position?.row || 0));
  const maxCol = Math.max(...TECH_TREE.map((t) => t.position?.col || 0));
  const CELL_SIZE = 140;
  const NODE_SIZE = 80;
  const PADDING = 40;
  const gridWidth = (maxCol + 1) * CELL_SIZE;
  const gridHeight = (maxRow + 1) * CELL_SIZE;

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        zIndex: 10000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "#1e1e1e",
          border: "2px solid #4a9eff",
          borderRadius: "8px",
          padding: "24px",
          width: "90%",
          maxWidth: "1200px",
          maxHeight: "90vh",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.8)",
          display: "grid",
          gridTemplateRows: "auto 1fr",
          gridTemplateColumns: "1fr 1fr",
          gap: "24px",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            gridColumn: "1 / -1",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2 style={{ margin: 0, color: "#cccccc", fontSize: "20px" }}>Tech Tree</h2>
          <button
            onClick={onClose}
            style={{
              padding: "4px 12px", fontSize: "18px",
              backgroundColor: "transparent", color: "#cccccc",
              border: "none", cursor: "pointer", lineHeight: "1",
            }}
          >
            ×
          </button>
        </div>

        {/* Graph Area */}
        <div style={{ display: "flex", flexDirection: "column", minWidth: 0, minHeight: 0, overflow: "hidden" }}>
          <div
            style={{
              position: "relative",
              width: "100%",
              height: "600px",
              overflow: "auto",
              background: "radial-gradient(ellipse at center, #1a1a1a 0%, #0f0f0f 100%)",
              borderRadius: "8px",
              border: "1px solid #2a2a2a",
              padding: "40px",
              boxShadow: "inset 0 2px 8px rgba(0, 0, 0, 0.5)",
            }}
          >
            <div style={{ position: "relative", width: gridWidth, height: gridHeight, zIndex: 1 }}>
              {/* Dependency Lines */}
              {TECH_TREE.map((techNode) => {
                if (!techNode.dependencies?.length || !techNode.position) return null;
                return techNode.dependencies.map((depId) => {
                  const depNode = TECH_TREE.find((t) => t.id === depId);
                  if (!depNode?.position || !techNode.position) return null;

                  const isDepUnlocked = tech[depId];
                  const from = depNode.position;
                  const to = techNode.position;

                  // Calculate line endpoints
                  const x1 = from.col * CELL_SIZE + NODE_SIZE / 2 + PADDING;
                  const y1 = from.row * CELL_SIZE + NODE_SIZE / 2 + PADDING;
                  const x2 = to.col * CELL_SIZE + NODE_SIZE / 2 + PADDING;
                  const y2 = to.row * CELL_SIZE + NODE_SIZE / 2 + PADDING;

                  const dx = x2 - x1;
                  const dy = y2 - y1;
                  const distance = Math.sqrt(dx * dx + dy * dy);
                  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

                  // Shorten line to not overlap nodes
                  const inset = NODE_SIZE / 2 + 2;
                  const startX = x1 + (dx / distance) * inset;
                  const startY = y1 + (dy / distance) * inset;
                  const endX = x2 - (dx / distance) * inset;
                  const endY = y2 - (dy / distance) * inset;
                  const lineLength = Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2);

                  return (
                    <div
                      key={`${depId}-${techNode.id}`}
                      style={{
                        position: "absolute",
                        left: `${startX}px`,
                        top: `${startY}px`,
                        width: `${lineLength}px`,
                        height: `${isDepUnlocked ? 3 : 2.5}px`,
                        backgroundColor: isDepUnlocked ? "#4a9eff" : "#5a5a5a",
                        transformOrigin: "0 50%",
                        transform: `rotate(${angle}deg)`,
                        zIndex: 0,
                        pointerEvents: "none",
                        opacity: isDepUnlocked ? 1 : 0.7,
                      }}
                    />
                  );
                });
              })}

              {/* Tech Nodes */}
              {TECH_TREE.map((techNode) => {
                if (!techNode.position) return null;
                const status = getTechStatus(techNode);
                const isSelected = selectedTechId === techNode.id;

                return (
                  <div
                    key={techNode.id}
                    style={{
                      position: "absolute",
                      left: techNode.position.col * CELL_SIZE + 40,
                      top: techNode.position.row * CELL_SIZE + 40,
                      zIndex: isSelected ? 10 : status === "unlocked" ? 5 : 3,
                    }}
                  >
                    <TechNode
                      tech={techNode}
                      isUnlocked={status === "unlocked"}
                      isAvailable={status === "available"}
                      isSelected={isSelected}
                      resources={resources}
                      onClick={() => setSelectedTechId(techNode.id)}
                    />
                  </div>
                );
              }).filter(Boolean)}
            </div>
          </div>
        </div>

        {/* Detail Panel */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            borderLeft: "1px solid #2a2a2a",
            paddingLeft: "24px",
            overflowY: "auto",
            minWidth: 0,
            minHeight: 0,
          }}
        >
          {selectedTech ? (
            <>
              {/* Tech Info */}
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    marginBottom: "12px",
                    paddingBottom: "16px",
                    borderBottom: "1px solid #2a2a2a",
                  }}
                >
                  <div
                    style={{
                      fontSize: "48px",
                      lineHeight: "1",
                      filter: tech[selectedTech.id] ? "none" : "brightness(0.7)",
                    }}
                  >
                    {selectedTech.icon}
                  </div>
                  <div>
                    <h3
                      style={{
                        margin: 0, color: "#cccccc", fontSize: "20px",
                        fontWeight: "600", marginBottom: "4px",
                      }}
                    >
                      {selectedTech.name}
                    </h3>
                    {tech[selectedTech.id] && (
                      <div
                        style={{
                          display: "inline-block",
                          padding: "2px 8px",
                          backgroundColor: "rgba(74, 158, 255, 0.2)",
                          color: "#4a9eff",
                          fontSize: "11px",
                          fontWeight: "bold",
                          borderRadius: "4px",
                          textTransform: "uppercase",
                        }}
                      >
                        Unlocked
                      </div>
                    )}
                  </div>
                </div>
                <p style={{ margin: 0, color: "#aaaaaa", fontSize: "14px", lineHeight: "1.6" }}>
                  {selectedTech.description}
                </p>
              </div>

              {/* Cost Display (hidden if unlocked) */}
              <div
                hidden={tech[selectedTech.id]}
                style={{
                  padding: "16px",
                  background: "linear-gradient(135deg, #2d2d2d 0%, #1f1f1f 100%)",
                  borderRadius: "8px",
                  border: "1px solid #3c3c3c",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
                }}
              >
                <div
                  style={{
                    color: "#cccccc", fontSize: "13px", fontWeight: "600",
                    marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.5px",
                  }}
                >
                  Unlock Cost
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {selectedTech.cost.map((cost, i) => (
                    <ResourceCostBadge
                      key={i}
                      resource={cost.resource}
                      amount={cost.amount}
                      available={resources[cost.resource]}
                    />
                  ))}
                </div>
                {selectedTech.cost.length > 0 && (
                  <div
                    style={{
                      marginTop: "12px",
                      paddingTop: "12px",
                      borderTop: "1px solid #2a2a2a",
                      fontSize: "12px",
                      color: "#888",
                    }}
                  >
                    {selectedTech.cost.map((cost, i) => (
                      <div key={i} style={{ marginBottom: "4px" }}>
                        You have {resources[cost.resource]} {cost.resource}
                        {resources[cost.resource] >= cost.amount ? (
                          <span style={{ color: "#4a9eff", marginLeft: "8px" }}>✓</span>
                        ) : (
                          <span style={{ color: "#ff6b35", marginLeft: "8px" }}>
                            (need {cost.amount - resources[cost.resource]} more)
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Button */}
              {tech[selectedTech.id] ? (
                <div>
                  <div
                    style={{
                      padding: "12px",
                      backgroundColor: "rgba(74, 158, 255, 0.1)",
                      borderRadius: "4px",
                      border: "1px solid #4a9eff",
                      color: "#4a9eff",
                      fontSize: "13px",
                      textAlign: "center",
                    }}
                  >
                    ✓ UNLOCKED
                  </div>
                  {onOpenDocs && (
                    <button
                      onClick={() => {
                        onOpenDocs(TECH_TO_DOCS_SECTION[selectedTech.id] || "");
                      }}
                      style={{
                        marginTop: "12px",
                        width: "100%",
                        padding: "10px",
                        backgroundColor: "#4a9eff",
                        color: "#fff",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "13px",
                        fontWeight: "bold",
                      }}
                    >
                      View in Docs
                    </button>
                  )}
                </div>
              ) : (
                <button
                  onClick={handleUnlock}
                  disabled={!canUnlockSelected}
                  style={{
                    width: "100%",
                    padding: "12px",
                    backgroundColor: canUnlockSelected ? "#ff6b35" : "#555",
                    color: "#fff",
                    border: "none",
                    borderRadius: "4px",
                    cursor: canUnlockSelected ? "pointer" : "not-allowed",
                    fontSize: "14px",
                    fontWeight: "bold",
                    opacity: canUnlockSelected ? 1 : 0.5,
                  }}
                >
                  {canUnlockSelected ? "Unlock" : "Insufficient Resources"}
                </button>
              )}
            </>
          ) : (
            <div style={{ color: "#888", fontSize: "14px" }}>
              Select a tech to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
