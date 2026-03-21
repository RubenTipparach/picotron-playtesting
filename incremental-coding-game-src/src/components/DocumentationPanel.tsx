import React, { useState, useEffect, useRef } from "react";
import { useGameStore } from "../store/gameStore";
import { getAvailableFunctions } from "../game/tech";
import { useTheme } from "../themes";

interface DocumentationPanelProps {
  isOpen: boolean;
  onClose?: () => void;
  scrollToSection?: string;
  inline?: boolean;
  onInsertCode?: (code: string) => void;
}

export function DocumentationPanel({ isOpen, onClose, scrollToSection, inline, onInsertCode }: DocumentationPanelProps) {
  const tech = useGameStore((state) => state.tech);
  const [availableFunctions, setAvailableFunctions] = useState(getAvailableFunctions());
  const contentRef = useRef<HTMLDivElement>(null);
  const t = useTheme();

  useEffect(() => {
    if (isOpen) setAvailableFunctions(getAvailableFunctions());
  }, [isOpen, tech]);

  useEffect(() => {
    if (isOpen && scrollToSection && contentRef.current) {
      const el = contentRef.current.querySelector(`[data-section-id="${scrollToSection}"]`) as HTMLElement | null;
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
          el.style.backgroundColor = `${t.primary}18`;
          setTimeout(() => { el.style.backgroundColor = ""; }, 2000);
        }, 100);
      }
    }
  }, [isOpen, scrollToSection, t.primary]);

  if (!isOpen) return null;

  const functionDocs: Record<string, { description: string; example: string; returns: string; sectionId?: string }> = {
    produceResourceA: { description: "Produces 1 unit of resource A. Takes 2s.", example: "produceResourceA()", returns: "Returns: 1" },
    convertAToB: { description: "Converts 2A into 1B. Takes 3s.", example: "convertAToB()", returns: "Returns: 1 if ok, 0 if not enough A" },
    getResourceCount: { description: "Gets count of a resource. Takes 1s.", example: "getResourceCount('A')", returns: "Returns: resource count" },
    getBalance: { description: "Gets your current credit balance. Takes 1s.", example: "getBalance()", returns: "Returns: credits (e.g. 42.50)" },
    log: { description: "Prints a message. Takes 0.5s.", example: "log('Hello!')", returns: "Returns: nothing" },
    convertABToC: { description: "Converts 3 A + 1 B into 1 C. Takes 3s.", example: "convertABToC()", returns: "Returns: 1 if ok, 0 if not enough A or B", sectionId: "resource-conversion-2" },
    getMarketValue: { description: "Gets the current market price of a resource. Takes 1s.", example: "getMarketValue('A')", returns: "Returns: current price (e.g. 1.05)", sectionId: "stock-market" },
    buy: { description: "Buys resource from market using credits. Takes 2s.", example: "buy('A', 5)", returns: "Returns: amount bought", sectionId: "stock-market" },
    sell: { description: "Sells resource on market for credits. Takes 2s.", example: "sell('A', 5)", returns: "Returns: credits received", sectionId: "stock-market" },
    wait: { description: "Sleeps for ms milliseconds. wait() or wait(0) sleeps for 1 CPU cycle.", example: "wait(1000)", returns: "Returns: nothing" },
    send: { description: "Queue a message at a named sync point.", example: "send('data', 42)", returns: "Returns: nothing", sectionId: "sync" },
    sync: { description: "Block until n messages arrive at syncId. Returns all messages.", example: "sync('data', 2)", returns: "Returns: array of messages", sectionId: "sync" },
    hash: { description: "Hash a string (up to 16 chars) into hex digits. Takes 0.5s.", example: "hash('test')", returns: "Returns: { hashValue: 'a3f0', hashTest: true if trailing zeros, hashFound: true if this hash was already submitted }", sectionId: "mining" },
    submitHash: { description: "Submit a string whose hash ends in zeros to mine 1 E. Crashes if invalid.", example: "submitHash('mystring')", returns: "Returns: 1 on success", sectionId: "mining" },
    gpuHash: { description: "Batch hash using GPU cores. Array size must equal GPU core count.", example: "gpuHash(['str1', 'str2', ...])", returns: "Returns: [{input, output}, ...]", sectionId: "mining" },
    getMiningInfo: { description: "Get mining stats: input/output sizes, suffixes found, total mined, GPU info.", example: "let info = getMiningInfo()\nlog(info)", returns: "Returns: { level, inputSize, outputSize, suffixesFound, suffixesTotal, totalMined, gpuCores, ... }", sectionId: "mining" },
    dbGet: { description: "Get a value from the persistent key-value store. Takes 0.5s.", example: "dbGet('mykey')", returns: "Returns: string value or null", sectionId: "storage" },
    dbSet: { description: "Store a key-value pair on the hard drive. Takes 0.5s.", example: "dbSet('mykey', 'myvalue')", returns: "Returns: true if stored, false if drive full", sectionId: "storage" },
    dbDelete: { description: "Delete a key from the store. Takes 0.5s.", example: "dbDelete('mykey')", returns: "Returns: true if key existed", sectionId: "storage" },
    dbExists: { description: "Check if a key exists in the store. Takes 0.5s.", example: "dbExists('mykey')", returns: "Returns: true if key exists", sectionId: "storage" },
    dbSize: { description: "Get current storage usage and capacity. Takes 0.5s.", example: "dbSize()", returns: "Returns: { used: 42, capacity: 1024 }", sectionId: "storage" },
  };

  const scrollToTop = () => {
    contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const content = (
    <div ref={contentRef} style={{ padding: "12px", fontFamily: t.font, color: t.primary, overflowY: "auto", height: "100%", boxSizing: "border-box", position: "relative" }}>
      {onInsertCode && (
        <div style={{ color: t.primaryDark, fontSize: "10px", marginBottom: "8px", letterSpacing: "1px" }}>
          [ CLICK CODE TO INSERT AT CURSOR ]
        </div>
      )}

      {/* Table of Contents */}
      <div style={{ marginBottom: "12px", padding: "8px", backgroundColor: t.bg3, border: `1px solid ${t.border}` }}>
        <div style={{ color: t.primaryDim, fontSize: "10px", letterSpacing: "2px", marginBottom: "6px" }}>[ CONTENTS ]</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
          {[
            { label: "Syntax", id: "syntax" },
            { label: "Functions", id: "functions" },
            ...(tech.stockMarketUnlocked ? [{ label: "Trading", id: "stock-market" }] : []),
            ...(tech.syncFunctionUnlocked ? [{ label: "Sync", id: "sync" }] : []),
            ...(tech.resourceEUnlocked ? [{ label: "Mining", id: "mining" }] : []),
            ...(tech.kvStoreUnlocked ? [{ label: "Storage", id: "storage" }] : []),
            { label: "Tips", id: "tips" },
          ].map((item) => (
            <span
              key={item.id}
              onClick={() => {
                const el = contentRef.current?.querySelector(`[data-section-id="${item.id}"]`) as HTMLElement | null;
                if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              style={{ color: t.accent, fontSize: "11px", cursor: "pointer" }}
            >
              &gt; {item.label}
            </span>
          ))}
        </div>
      </div>

      {/* Syntax */}
      <Section title="SYNTAX" t={t} sectionId="syntax">
        <DocCard t={t}>
          <DocText t={t}>Call functions with parentheses:</DocText>
          <CodeBlock t={t} onInsertCode={onInsertCode}>{"produceResourceA()\ngetResourceCount('A')"}</CodeBlock>
        </DocCard>

        {tech.whileUnlocked && (
          <DocCard dataSectionId="while-loops" t={t}>
            <DocText t={t}>While Loops — repeat code:</DocText>
            <CodeBlock t={t} onInsertCode={onInsertCode}>{"while (true) {\n  produceResourceA()\n}"}</CodeBlock>
          </DocCard>
        )}

        {tech.convertAToBUnlocked && (
          <DocCard dataSectionId="resource-conversion" t={t}>
            <DocText t={t}>Resource Conversion — 2A to 1B:</DocText>
            <CodeBlock t={t} onInsertCode={onInsertCode}>{"convertAToB()"}</CodeBlock>
          </DocCard>
        )}

        {tech.varsUnlocked && (
          <DocCard dataSectionId="variables" t={t}>
            <DocText t={t}>Variables — store values with let/const:</DocText>
            <CodeBlock t={t} onInsertCode={onInsertCode}>{"let a = produceResourceA()\nconst count = getResourceCount('A')"}</CodeBlock>
          </DocCard>
        )}

        {tech.mathFunctionsUnlocked && (
          <DocCard dataSectionId="math-operators" t={t}>
            <DocText t={t}>Math — +, -, *, /, %, ++, --:</DocText>
            <CodeBlock t={t} onInsertCode={onInsertCode}>{"let x = 5 + 3\ncount += produceResourceA()"}</CodeBlock>
          </DocCard>
        )}

        {tech.ifStatementsUnlocked && (
          <DocCard dataSectionId="if-statements" t={t}>
            <DocText t={t}>If Statements — conditional execution:</DocText>
            <CodeBlock t={t} onInsertCode={onInsertCode}>{"if (getResourceCount('A') >= 2) {\n  convertAToB()\n}"}</CodeBlock>
          </DocCard>
        )}

        {tech.userFunctionsUnlocked && (
          <DocCard dataSectionId="user-functions" t={t}>
            <DocText t={t}>Functions — define reusable code:</DocText>
            <CodeBlock t={t} onInsertCode={onInsertCode}>{"function harvest(n) {\n  let i = 0\n  while (i < n) {\n    produceResourceA()\n    i++\n  }\n}\nharvest(5)"}</CodeBlock>
          </DocCard>
        )}

        {tech.tryCatchUnlocked && (
          <DocCard dataSectionId="try-catch" t={t}>
            <DocText t={t}>Try/Catch — handle errors without crashing:</DocText>
            <CodeBlock t={t} onInsertCode={onInsertCode}>{"try {\n  convertAToB()\n} catch (e) {\n  log('Error: ' + e)\n}"}</CodeBlock>
          </DocCard>
        )}

      </Section>

      {/* Trading */}
      {tech.stockMarketUnlocked && (
        <Section title="TRADING" t={t} sectionId="stock-market">
          <DocCard t={t}>
            <DocText t={t}>Stock Market — prices fluctuate based on supply and demand:</DocText>
            <CodeBlock t={t} onInsertCode={onInsertCode}>{"// Check price before trading\nlet price = getMarketValue('A')\nif (price > 1.5) {\n  sell('A', 10)\n}\n// Buy low\nif (price < 0.8) {\n  buy('A', 5)\n}"}</CodeBlock>
          </DocCard>
        </Section>
      )}

      {/* Sync */}
      {tech.syncFunctionUnlocked && (
        <Section title="SYNC" t={t} sectionId="sync">
          <DocCard t={t}>
            <DocText t={t}>Sync — coordinate between CPU cores:</DocText>
            <CodeBlock t={t} onInsertCode={onInsertCode}>{"// Core 1:\nsend('data', 42)\n\n// Core 2:\nlet msgs = sync('data', 1)\nlog(msgs[0]) // 42"}</CodeBlock>
          </DocCard>
        </Section>
      )}

      {/* Mining */}
      {tech.resourceEUnlocked && (
        <Section title="MINING" t={t} sectionId="mining">
          <DocCard t={t}>
            <DocText t={t}>Mining — hash strings to find trailing zeros and earn E. Same trailing zero pattern can be found multiple times, but each unique hash value can only be submitted once:</DocText>
            <CodeBlock t={t} onInsertCode={onInsertCode}>{"// Try different strings\nlet h = hash('test123')\nlog(h.hashValue) // e.g. 'a3f0'\nlog(h.hashTest)  // true if ends in zeros\nlog(h.hashFound) // true if this hash already submitted\n// If hashTest && !hashFound, submit it!\nsubmitHash('test123') // earns 1 E"}</CodeBlock>
          </DocCard>
          <DocCard t={t}>
            <DocText t={t}>Auto-mine — brute force search for hashes:</DocText>
            <CodeBlock t={t} onInsertCode={onInsertCode}>{"let i = 0\nwhile (true) {\n  let s = 'mine' + i\n  let result = hash(s)\n  log(result, 'i', i)\n  if (result.hashTest && !result.hashFound) {\n    log('FOUND: ' + s + ' -> ' + result.hashValue)\n    submitHash(s)\n  }\n  i++\n}"}</CodeBlock>
          </DocCard>
          <DocCard t={t}>
            <DocText t={t}>Check mining stats:</DocText>
            <CodeBlock t={t} onInsertCode={onInsertCode}>{"let info = getMiningInfo()\nlog(info)"}</CodeBlock>
          </DocCard>
        </Section>
      )}

      {/* Storage */}
      {tech.kvStoreUnlocked && (
        <Section title="STORAGE" t={t} sectionId="storage">
          <DocCard t={t}>
            <DocText t={t}>Persistent key-value store — data survives across script runs:</DocText>
            <CodeBlock t={t} onInsertCode={onInsertCode}>{"// Store data\ndbSet('counter', '0')\n\n// Read it back (even after restart)\nlet val = dbGet('counter')\nlog(val) // '0'\n\n// Check if key exists\nlet exists = dbExists('counter')\nlog(exists) // true\n\n// Check drive space\nlet size = dbSize()\nlog(size) // { used: 10, capacity: 1024 }"}</CodeBlock>
          </DocCard>
        </Section>
      )}

      {/* Functions */}
      <Section title="FUNCTIONS" t={t} sectionId="functions">
        {availableFunctions.map((fn) => {
          const doc = functionDocs[fn];
          if (!doc) return null;
          return (
            <DocCard key={fn} dataSectionId={doc.sectionId} t={t}>
              <ClickableCode text={doc.example} onInsertCode={onInsertCode} t={t}>
                <span style={{ color: t.accent, fontSize: "12px", fontWeight: "bold" }}>{fn}()</span>
              </ClickableCode>
              <div style={{ color: t.primaryDim, fontSize: "11px", marginBottom: "4px" }}>{doc.description}</div>
              <CodeBlock t={t} onInsertCode={onInsertCode}>{doc.example}</CodeBlock>
              <div style={{ color: t.primaryDark, fontSize: "10px", marginTop: "4px" }}>{doc.returns}</div>
            </DocCard>
          );
        })}
      </Section>

      {/* Tips */}
      <Section title="TIPS" t={t} sectionId="tips">
        <DocCard t={t}>
          <ul style={{ color: t.primaryDim, fontSize: "11px", margin: 0, paddingLeft: "16px" }}>
            <li style={{ marginBottom: "4px" }}>Each function call takes time — progress bars show execution.</li>
            <li style={{ marginBottom: "4px" }}>Use loops to automate resource gathering.</li>
            <li style={{ marginBottom: "4px" }}>Sell resources in the Shop to buy RAM and CPU upgrades.</li>
            <li style={{ marginBottom: "4px" }}>Check the Tech Tree (Ctrl+U) for new features.</li>
            <li>Code is limited by your RAM — buy more in the Shop.</li>
          </ul>
        </DocCard>
      </Section>

      <div
        onClick={scrollToTop}
        style={{
          position: "sticky", bottom: 8, alignSelf: "flex-end",
          padding: "4px 10px", cursor: "pointer",
          color: t.primaryDim, fontSize: "10px", letterSpacing: "1px",
          backgroundColor: t.bg3, border: `1px solid ${t.border}`,
          textAlign: "center", marginTop: "8px",
        }}
      >
        [ TOP ]
      </div>
    </div>
  );

  // Inline mode (embedded in right panel)
  if (inline) return content;

  // Modal mode (legacy, used from tech tree)
  return (
    <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.8)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div style={{ backgroundColor: t.bg, border: `1px solid ${t.borderBright}`, maxWidth: "700px", maxHeight: "80vh", width: "90%", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: `0 0 30px ${t.primary}33` }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: "10px 16px", borderBottom: `1px solid ${t.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: t.primary, fontSize: "12px", letterSpacing: "2px" }}>[ DOCS ]</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: t.primary, cursor: "pointer", fontSize: "16px" }}>x</button>
        </div>
        <div style={{ flex: 1, overflow: "auto" }}>{content}</div>
      </div>
    </div>
  );
}

interface SectionProps {
  title: string;
  children: React.ReactNode;
  t: any;
  sectionId?: string;
}

function Section({ title, children, t, sectionId }: SectionProps) {
  return (
    <div style={{ marginBottom: "16px" }} data-section-id={sectionId}>
      <div style={{ color: t.primaryDim, fontSize: "11px", letterSpacing: "2px", marginBottom: "8px" }}>[ {title} ]</div>
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>{children}</div>
    </div>
  );
}

interface DocCardProps {
  children: React.ReactNode;
  dataSectionId?: string;
  t: any;
}

function DocCard({ children, dataSectionId, t }: DocCardProps) {
  return (
    <div data-section-id={dataSectionId} style={{ padding: "8px", backgroundColor: t.bg3, border: `1px solid ${t.border}`, transition: "background-color 0.3s" }}>
      {children}
    </div>
  );
}

interface DocTextProps {
  children: React.ReactNode;
  t: any;
}

function DocText({ children, t }: DocTextProps) {
  return <div style={{ color: t.primaryDim, fontSize: "11px", marginBottom: "4px" }}>{children}</div>;
}

interface ClickableCodeProps {
  text: string;
  onInsertCode?: (code: string) => void;
  children: React.ReactNode;
  t: any;
}

function ClickableCode({ text, onInsertCode, children, t }: ClickableCodeProps) {
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
        backgroundColor: `${t.accent}0d`,
        transition: "background-color 0.15s",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = `${t.accent}26`; }}
      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = `${t.accent}0d`; }}
    >
      {children}
    </div>
  );
}

interface CodeBlockProps {
  children: React.ReactNode;
  onInsertCode?: (code: string) => void;
  t: any;
}

function CodeBlock({ children, onInsertCode, t }: CodeBlockProps) {
  const text = typeof children === "string" ? children : "";
  const lines = text.split("\n");

  if (!onInsertCode || !text) {
    return (
      <pre style={{ color: t.accent, fontFamily: t.font, fontSize: "11px", backgroundColor: t.bg, padding: "4px 8px", margin: "4px 0 0 0", whiteSpace: "pre-wrap", border: `1px solid ${t.border}` }}>
        {children}
      </pre>
    );
  }

  const isMultiLine = lines.length > 1;

  return (
    <div style={{ fontFamily: t.font, fontSize: "11px", backgroundColor: t.bg, margin: "4px 0 0 0", border: `1px solid ${t.border}` }}>
      <div style={{ padding: "4px 0" }}>
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
                color: isComment ? t.primaryDark : t.accent,
                padding: "1px 8px",
                cursor: isClickable ? "pointer" : "default",
                transition: "background-color 0.15s",
                whiteSpace: "pre-wrap",
              }}
              onMouseEnter={isClickable ? (e) => { e.currentTarget.style.backgroundColor = `${t.accent}1a`; } : undefined}
              onMouseLeave={isClickable ? (e) => { e.currentTarget.style.backgroundColor = "transparent"; } : undefined}
            >
              {line || "\u00A0"}
            </div>
          );
        })}
      </div>
      {isMultiLine && (
        <div
          onClick={(e) => { e.stopPropagation(); onInsertCode(text); }}
          style={{
            padding: "3px 8px", cursor: "pointer", fontSize: "9px",
            color: t.primary, backgroundColor: t.bg3,
            borderTop: `1px solid ${t.border}`,
            textAlign: "center", letterSpacing: "1px",
            transition: "background-color 0.15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = `${t.accent}26`; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = t.bg3; }}
        >
          [ PASTE ALL ]
        </div>
      )}
    </div>
  );
}
