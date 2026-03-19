import React, { useState, useEffect, useRef } from "react";
import { useGameStore } from "../gameStore.js";
import { getAvailableFunctions } from "../techTree.js";

export function DocsPanel({ isOpen, onClose, scrollToSection, inline, onInsertCode }) {
  const tech = useGameStore((state) => state.tech);
  const [availableFunctions, setAvailableFunctions] = useState(getAvailableFunctions());
  const contentRef = useRef(null);

  useEffect(() => {
    if (isOpen) setAvailableFunctions(getAvailableFunctions());
  }, [isOpen, tech]);

  useEffect(() => {
    if (isOpen && scrollToSection && contentRef.current) {
      const el = contentRef.current.querySelector(`[data-section-id="${scrollToSection}"]`);
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
          el.style.backgroundColor = "rgba(0, 255, 65, 0.1)";
          setTimeout(() => { el.style.backgroundColor = ""; }, 2000);
        }, 100);
      }
    }
  }, [isOpen, scrollToSection]);

  if (!isOpen) return null;

  const functionDocs = {
    produceResourceA: { description: "Produces 1 unit of resource A. Takes 2s.", example: "produceResourceA()", returns: "Returns: 1" },
    convertAToB: { description: "Converts 2A into 1B. Takes 3s.", example: "convertAToB()", returns: "Returns: 1 if ok, 0 if not enough A" },
    getResourceCount: { description: "Gets count of a resource. Takes 1s.", example: "getResourceCount('A')", returns: "Returns: resource count" },
    log: { description: "Prints a message. Takes 0.5s.", example: "log('Hello!')", returns: "Returns: nothing" },
    makeResourceC: { description: "Converts 3A+1B into 1C. Takes 3s.", example: "makeResourceC()", returns: "Returns: 1", sectionId: "resource-conversion-2" },
  };

  const content = (
    <div ref={contentRef} style={{ padding: "12px", fontFamily: "var(--hk-font)", color: "#00ff41", overflowY: "auto", height: "100%", boxSizing: "border-box" }}>
      {onInsertCode && (
        <div style={{ color: "#004400", fontSize: "10px", marginBottom: "8px", letterSpacing: "1px" }}>
          [ CLICK CODE TO INSERT AT CURSOR ]
        </div>
      )}

      {/* Syntax */}
      <Section title="SYNTAX">
        <DocCard>
          <DocText>Call functions with parentheses:</DocText>
          <CodeBlock onInsertCode={onInsertCode}>{"produceResourceA()\ngetResourceCount('A')"}</CodeBlock>
        </DocCard>

        {tech.whileUnlocked && (
          <DocCard dataSectionId="while-loops">
            <DocText>While Loops — repeat code:</DocText>
            <CodeBlock onInsertCode={onInsertCode}>{"while (true) {\n  produceResourceA()\n}"}</CodeBlock>
          </DocCard>
        )}

        {tech.convertAToBUnlocked && (
          <DocCard dataSectionId="resource-conversion">
            <DocText>Resource Conversion — 2A to 1B:</DocText>
            <CodeBlock onInsertCode={onInsertCode}>{"convertAToB()"}</CodeBlock>
          </DocCard>
        )}

        {tech.varsUnlocked && (
          <DocCard dataSectionId="variables">
            <DocText>Variables — store values with let/const:</DocText>
            <CodeBlock onInsertCode={onInsertCode}>{"let a = produceResourceA()\nconst count = getResourceCount('A')"}</CodeBlock>
          </DocCard>
        )}

        {tech.mathFunctionsUnlocked && (
          <DocCard dataSectionId="math-operators">
            <DocText>Math — +, -, *, /, %, ++, --:</DocText>
            <CodeBlock onInsertCode={onInsertCode}>{"let x = 5 + 3\ncount += produceResourceA()"}</CodeBlock>
          </DocCard>
        )}

        {tech.ifStatementsUnlocked && (
          <DocCard dataSectionId="if-statements">
            <DocText>If Statements — conditional execution:</DocText>
            <CodeBlock onInsertCode={onInsertCode}>{"if (getResourceCount('A') >= 2) {\n  convertAToB()\n}"}</CodeBlock>
          </DocCard>
        )}

        {tech.userFunctionsUnlocked && (
          <DocCard dataSectionId="user-functions">
            <DocText>Functions — define reusable code:</DocText>
            <CodeBlock onInsertCode={onInsertCode}>{"function harvest(n) {\n  let i = 0\n  while (i < n) {\n    produceResourceA()\n    i++\n  }\n}\nharvest(5)"}</CodeBlock>
          </DocCard>
        )}
      </Section>

      {/* Functions */}
      <Section title="FUNCTIONS">
        {availableFunctions.map((fn) => {
          const doc = functionDocs[fn];
          if (!doc) return null;
          return (
            <DocCard key={fn} dataSectionId={doc.sectionId}>
              <ClickableCode text={doc.example} onInsertCode={onInsertCode}>
                <span style={{ color: "#00ffcc", fontSize: "12px", fontWeight: "bold" }}>{fn}()</span>
              </ClickableCode>
              <div style={{ color: "#00cc33", fontSize: "11px", marginBottom: "4px" }}>{doc.description}</div>
              <CodeBlock onInsertCode={onInsertCode}>{doc.example}</CodeBlock>
              <div style={{ color: "#004400", fontSize: "10px", marginTop: "4px" }}>{doc.returns}</div>
            </DocCard>
          );
        })}
      </Section>

      {/* Tips */}
      <Section title="TIPS">
        <DocCard>
          <ul style={{ color: "#00cc33", fontSize: "11px", margin: 0, paddingLeft: "16px" }}>
            <li style={{ marginBottom: "4px" }}>Each function call takes time — progress bars show execution.</li>
            <li style={{ marginBottom: "4px" }}>Use loops to automate resource gathering.</li>
            <li style={{ marginBottom: "4px" }}>Sell resources in the Shop to buy RAM and CPU upgrades.</li>
            <li style={{ marginBottom: "4px" }}>Check the Tech Tree (Ctrl+U) for new features.</li>
            <li>Code is limited by your RAM — buy more in the Shop.</li>
          </ul>
        </DocCard>
      </Section>
    </div>
  );

  // Inline mode (embedded in right panel)
  if (inline) return content;

  // Modal mode (legacy, used from tech tree)
  return (
    <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.8)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div style={{ backgroundColor: "#0a0a0a", border: "1px solid #00ff41", maxWidth: "700px", maxHeight: "80vh", width: "90%", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 0 30px rgba(0,255,65,0.2)" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: "10px 16px", borderBottom: "1px solid #003300", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "#00ff41", fontSize: "12px", letterSpacing: "2px" }}>[ DOCS ]</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#00ff41", cursor: "pointer", fontSize: "16px" }}>x</button>
        </div>
        <div style={{ flex: 1, overflow: "auto" }}>{content}</div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <div style={{ color: "#00cc33", fontSize: "11px", letterSpacing: "2px", marginBottom: "8px" }}>[ {title} ]</div>
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>{children}</div>
    </div>
  );
}

function DocCard({ children, dataSectionId }) {
  return (
    <div data-section-id={dataSectionId} style={{ padding: "8px", backgroundColor: "#001a00", border: "1px solid #003300", transition: "background-color 0.3s" }}>
      {children}
    </div>
  );
}

function DocText({ children }) {
  return <div style={{ color: "#00cc33", fontSize: "11px", marginBottom: "4px" }}>{children}</div>;
}

function ClickableCode({ text, onInsertCode, children }) {
  if (!onInsertCode || !text) return <div style={{ marginBottom: "4px" }}>{children}</div>;
  return (
    <div
      onClick={(e) => { e.stopPropagation(); onInsertCode(text); }}
      title={`Click to insert: ${text}`}
      style={{
        marginBottom: "4px",
        cursor: "pointer",
        display: "inline-block",
        padding: "1px 4px",
        borderRadius: "2px",
        backgroundColor: "rgba(0, 255, 204, 0.05)",
        transition: "background-color 0.15s",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(0, 255, 204, 0.15)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "rgba(0, 255, 204, 0.05)"; }}
    >
      {children}
    </div>
  );
}

function CodeBlock({ children, onInsertCode }) {
  const text = typeof children === "string" ? children : "";
  const lines = text.split("\n");

  if (!onInsertCode || !text) {
    return (
      <pre style={{ color: "#00ffcc", fontFamily: "var(--hk-font)", fontSize: "11px", backgroundColor: "#0a0a0a", padding: "4px 8px", margin: "4px 0 0 0", whiteSpace: "pre-wrap", border: "1px solid #002200" }}>
        {children}
      </pre>
    );
  }

  return (
    <div style={{ fontFamily: "var(--hk-font)", fontSize: "11px", backgroundColor: "#0a0a0a", padding: "4px 0", margin: "4px 0 0 0", border: "1px solid #002200" }}>
      {lines.map((line, i) => {
        const trimmed = line.trim();
        const isComment = trimmed.startsWith("//");
        const isEmpty = !trimmed;
        const isClickable = !isComment && !isEmpty;

        return (
          <div
            key={i}
            onClick={isClickable ? (e) => { e.stopPropagation(); onInsertCode(trimmed); } : undefined}
            title={isClickable ? `Click to insert: ${trimmed}` : undefined}
            style={{
              color: isComment ? "#004400" : "#00ffcc",
              padding: "1px 8px",
              cursor: isClickable ? "pointer" : "default",
              transition: "background-color 0.15s",
              whiteSpace: "pre-wrap",
            }}
            onMouseEnter={isClickable ? (e) => { e.currentTarget.style.backgroundColor = "rgba(0, 255, 204, 0.1)"; } : undefined}
            onMouseLeave={isClickable ? (e) => { e.currentTarget.style.backgroundColor = "transparent"; } : undefined}
          >
            {line || "\u00A0"}
          </div>
        );
      })}
    </div>
  );
}
