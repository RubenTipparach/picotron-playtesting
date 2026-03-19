/**
 * DocsPanel Component
 *
 * Modal dialog showing game documentation:
 * - Basic syntax (calling functions)
 * - Unlocked features with code examples (while loops, variables, etc.)
 * - Available function reference
 * - Tips
 */

import React, { useState, useEffect, useRef } from "react";
import { useGameStore } from "../gameStore.js";
import { getAvailableFunctions } from "../techTree.js";

export function DocsPanel({ isOpen, onClose, scrollToSection }) {
  const tech = useGameStore((state) => state.tech);
  const [availableFunctions, setAvailableFunctions] = useState(getAvailableFunctions());
  const contentRef = useRef(null);

  // Refresh available functions when panel opens or tech changes
  useEffect(() => {
    if (isOpen) {
      setAvailableFunctions(getAvailableFunctions());
    }
  }, [isOpen, tech]);

  // Scroll to a specific section when requested
  useEffect(() => {
    if (isOpen && scrollToSection && contentRef.current) {
      const element = contentRef.current.querySelector(
        `[data-section-id="${scrollToSection}"]`
      );
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
          element.style.backgroundColor = "rgba(74, 158, 255, 0.2)";
          setTimeout(() => {
            element.style.backgroundColor = "";
          }, 2000);
        }, 100);
      }
    }
  }, [isOpen, scrollToSection]);

  if (!isOpen) return null;

  const functionDocs = {
    produceResourceA: {
      description: "Produces 1 unit of resource A. Takes 2 seconds to complete.",
      example: "produceResourceA()",
      returns: "Returns: 1 (the amount produced)",
    },
    convertAToB: {
      description:
        "Converts 2 units of A into 1 unit of B. Takes 3 seconds to complete. Only works if you have at least 2 A.",
      example: "convertAToB()",
      returns: "Returns: 1 if successful, 0 if you don't have enough A",
    },
    getResourceCount: {
      description:
        "Gets the current amount of a resource. Takes 1 second to complete.",
      example: "getResourceCount('A')",
      returns: "Returns: the number of that resource you have",
    },
    log: {
      description: "Prints a message to the log. Takes 0.5 seconds to complete.",
      example: "log('Hello!')",
      returns: "Returns: nothing",
    },
    makeResourceC: {
      description:
        "Converts 3 A and 1 B into 1 C. Takes 3 seconds to complete.",
      example: "makeResourceC()",
      returns: "Returns: 1 (the amount produced)",
      sectionId: "resource-conversion-2",
    },
  };

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
          maxWidth: "800px",
          maxHeight: "80vh",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.8)",
          width: "90%",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            backgroundColor: "#2d2d2d",
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid #3c3c3c",
            flexShrink: 0,
          }}
        >
          <h2 style={{ margin: 0, color: "#cccccc", fontSize: "20px", fontWeight: 500 }}>
            Documentation
          </h2>
          <button
            onClick={onClose}
            style={{
              padding: "2px 8px", fontSize: "16px",
              backgroundColor: "transparent", color: "#cccccc",
              border: "none", cursor: "pointer", lineHeight: "1",
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div ref={contentRef} style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Basic Syntax Section */}
            <section>
              <h3 style={{ color: "#4a9eff", fontSize: "18px", marginBottom: "12px" }}>
                Basic Syntax
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <DocCard>
                  <DocText>
                    <strong>Calling Functions:</strong> Type the function name followed by
                    parentheses. If the function needs information, put it inside the
                    parentheses.
                  </DocText>
                  <CodeBlock>
                    {"// Produce 1 A\nproduceResourceA()\ngetResourceCount('A')"}
                  </CodeBlock>
                </DocCard>

                {tech.whileUnlocked && (
                  <DocCard dataSectionId="while-loops">
                    <DocText>
                      <strong>While Loops:</strong> Repeat code while a condition is true. Use{" "}
                      <InlineCode>while(true)</InlineCode> to loop forever (until you click Stop).
                    </DocText>
                    <CodeBlock>
                      {"// Loop forever to produce A\nwhile (true) {\n  produceResourceA()\n}"}
                    </CodeBlock>
                  </DocCard>
                )}

                {tech.convertAToBUnlocked && (
                  <DocCard dataSectionId="resource-conversion">
                    <div style={{ color: "#4a9eff", fontSize: "14px", fontWeight: "bold", marginBottom: "8px" }}>
                      Resource Conversion
                    </div>
                    <DocText>
                      You can now convert resources using <InlineCode>convertAToB()</InlineCode>.
                    </DocText>
                    <CodeBlock>{"// Convert 2 A into 1 B \n convertAToB()"}</CodeBlock>
                  </DocCard>
                )}

                {tech.varsUnlocked && (
                  <DocCard dataSectionId="variables">
                    <DocText>
                      <strong>Variables:</strong> Store values using <InlineCode>let</InlineCode>{" "}
                      or <InlineCode>const</InlineCode>. Functions return values that you can store.
                      <br />
                      <InlineCode>let</InlineCode> is used to declare a variable that can be changed.
                      <br />
                      <InlineCode>const</InlineCode> is used to declare a variable that cannot be changed.
                    </DocText>
                    <CodeBlock>
                      {"// Store the amount produced in a variable\nlet amount = produceResourceA()\n// Store the total count of A\nconst count = getResourceCount('A')"}
                    </CodeBlock>
                  </DocCard>
                )}

                {tech.mathFunctionsUnlocked && (
                  <DocCard dataSectionId="math-operators">
                    <DocText>
                      <strong>Math Operators:</strong> Perform calculations using standard operators.
                    </DocText>
                    <CodeBlock>
                      {"// Basic operators: +, -, *, /, %\nlet sum = 5 + 3\nlet diff = 10 - 2\nlet product = 4 * 5\nlet quotient = 20 / 4\nlet remainder = 10 % 3\n\n// Compound assignment: +=, -=, *=, /=, %=\nlet count = 0\ncount += produceResourceA()\n\n// Increment/decrement: ++, --\nlet i = 0\ni++\ni--"}
                    </CodeBlock>
                  </DocCard>
                )}

                {tech.ifStatementsUnlocked && (
                  <DocCard dataSectionId="if-statements">
                    <DocText>
                      <strong>If Statements:</strong> Make decisions in your code. Execute code
                      only when a condition is true.
                    </DocText>
                    <CodeBlock>
                      {"// Only convert if we have enough A\nlet a = getResourceCount('A')\nif (a >= 2) {\n  convertAToB()\n}"}
                    </CodeBlock>
                  </DocCard>
                )}

                {tech.userFunctionsUnlocked && (
                  <DocCard dataSectionId="user-functions">
                    <DocText>
                      <strong>User Functions:</strong> Define your own functions to organize and
                      reuse code. Functions can take parameters and return values.
                    </DocText>
                    <CodeBlock>
                      {"// Define a function to produce multiple A\nfunction produceMultiple(count) {\n  let i = 0\n  while (i < count) {\n    produceResourceA()\n    i++\n  }\n}\n\n// Call the function\nproduceMultiple(5)"}
                    </CodeBlock>
                  </DocCard>
                )}
              </div>
            </section>

            {/* Available Functions Section */}
            <section>
              <h3 style={{ color: "#4a9eff", fontSize: "18px", marginBottom: "12px" }}>
                Available Functions
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {availableFunctions.map((funcName) => {
                  const doc = functionDocs[funcName];
                  if (!doc) return null;

                  return (
                    <DocCard key={funcName} dataSectionId={doc.sectionId}>
                      <div
                        style={{
                          color: "#4a9eff",
                          fontFamily: "monospace",
                          fontSize: "14px",
                          fontWeight: "bold",
                          marginBottom: "4px",
                        }}
                      >
                        {funcName}()
                      </div>
                      <div style={{ color: "#cccccc", fontSize: "13px", marginBottom: "8px" }}>
                        {doc.description}
                      </div>
                      <div style={{ marginBottom: "4px" }}>
                        <span style={{ color: "#888", fontSize: "12px" }}>Example: </span>
                        <code
                          style={{
                            color: "#9d4edd",
                            fontFamily: "monospace",
                            fontSize: "12px",
                            backgroundColor: "#1e1e1e",
                            padding: "2px 6px",
                            borderRadius: "3px",
                          }}
                        >
                          {doc.example}
                        </code>
                      </div>
                      <div style={{ color: "#888", fontSize: "12px" }}>{doc.returns}</div>
                    </DocCard>
                  );
                })}
              </div>
            </section>

            {/* Tips Section */}
            <section>
              <h3 style={{ color: "#4a9eff", fontSize: "18px", marginBottom: "12px" }}>
                Tips
              </h3>
              <DocCard>
                <ul
                  style={{
                    color: "#cccccc",
                    fontSize: "13px",
                    margin: 0,
                    paddingLeft: "20px",
                  }}
                >
                  <li style={{ marginBottom: "8px" }}>
                    Each function call takes time to complete. You'll see a progress bar while it runs.
                  </li>
                  <li style={{ marginBottom: "8px" }}>
                    Functions that return values can be used in calculations or stored in variables.
                  </li>
                  <li style={{ marginBottom: "8px" }}>
                    Use loops to automate repetitive tasks and generate resources faster.
                  </li>
                  <li style={{ marginBottom: "8px" }}>
                    Check the Tech Tree to see what features you can unlock next.
                  </li>
                  <li>
                    If you get an error, check the Log window for details about what went wrong.
                  </li>
                </ul>
              </DocCard>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Helper Components ──

function DocCard({ children, dataSectionId }) {
  return (
    <div
      data-section-id={dataSectionId}
      style={{
        padding: "12px",
        backgroundColor: "#2d2d2d",
        border: "1px solid #3c3c3c",
        borderRadius: "4px",
        transition: "background-color 0.3s",
      }}
    >
      {children}
    </div>
  );
}

function DocText({ children }) {
  return (
    <div style={{ color: "#cccccc", fontSize: "13px", marginBottom: "8px" }}>
      {children}
    </div>
  );
}

function InlineCode({ children }) {
  return (
    <code style={{ color: "#4a9eff", fontFamily: "monospace" }}>{children}</code>
  );
}

function CodeBlock({ children }) {
  return (
    <div style={{ marginTop: "8px" }}>
      <pre
        style={{
          color: "#9d4edd",
          fontFamily: "monospace",
          fontSize: "12px",
          backgroundColor: "#1e1e1e",
          padding: "4px 8px",
          borderRadius: "3px",
          margin: 0,
          whiteSpace: "pre-wrap",
        }}
      >
        {children}
      </pre>
    </div>
  );
}
