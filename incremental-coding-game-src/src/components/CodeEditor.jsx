/**
 * CodeEditor Component
 *
 * Monaco editor wrapper with:
 * - Custom "game-script" language with syntax highlighting
 * - Autocomplete for game API functions
 * - Code validation markers for locked tech features
 * - Execution progress visualization (line highlighting, progress bars)
 * - Quick-fix actions to open the tech tree
 */

import React, {
  forwardRef,
  useRef,
  useEffect,
  useImperativeHandle,
} from "react";
import Editor from "@monaco-editor/react";
import { API_FUNCTION_NAMES } from "../gameApi.js";
import { getAvailableFunctions, validateCode } from "../techTree.js";

export const CodeEditor = forwardRef(
  ({ code, onCodeChange, executionEvents, onOpenTechTree, scrollToLineNumber }, ref) => {
    const editorRef = useRef(null);
    const monacoRef = useRef(null);
    const decorationsRef = useRef([]);
    const markersRef = useRef([]);
    const onOpenTechTreeRef = useRef(onOpenTechTree);
    const validationInfoRef = useRef([]);

    // Expose scrollToLine to parent
    useImperativeHandle(ref, () => ({
      scrollToLine: (line) => {
        if (editorRef.current) {
          editorRef.current.revealLineInCenter(line);
          editorRef.current.setPosition({ lineNumber: line, column: 1 });
        }
      },
    }));

    // Handle external scroll requests
    useEffect(() => {
      if (scrollToLineNumber != null && editorRef.current) {
        const editor = editorRef.current;
        const visibleRanges = editor.getVisibleRanges();
        const isVisible = visibleRanges.some(
          (range) =>
            scrollToLineNumber >= range.startLineNumber &&
            scrollToLineNumber <= range.endLineNumber
        );
        if (!isVisible) {
          editor.revealLineInCenter(scrollToLineNumber);
        }
        editor.setPosition({ lineNumber: scrollToLineNumber, column: 1 });
      }
    }, [scrollToLineNumber]);

    // Keep onOpenTechTree ref current
    useEffect(() => {
      onOpenTechTreeRef.current = onOpenTechTree;
    }, [onOpenTechTree]);

    // ── Handle execution events (line highlighting, progress) ──
    useEffect(() => {
      if (!editorRef.current) return;
      const editor = editorRef.current;
      if (!editor.getModel()) return;

      // Clear existing decorations
      decorationsRef.current = editor.deltaDecorations(decorationsRef.current, []);

      let currentLine = null;
      let completedDecorations = [];

      executionEvents.forEach((event) => {
        if (event.type === "lineChange") {
          // Clear old decorations on line change
          if (currentLine !== null) {
            decorationsRef.current = editor.deltaDecorations(decorationsRef.current, []);
            completedDecorations = [];
          }
          currentLine = event.lineNumber;

          // Highlight the executing line
          decorationsRef.current = editor.deltaDecorations(decorationsRef.current, [
            {
              range: {
                startLineNumber: event.lineNumber,
                startColumn: 1,
                endLineNumber: event.lineNumber,
                endColumn: 1,
              },
              options: { isWholeLine: true, className: "executing-line" },
            },
          ]);
        } else if (event.type === "functionProgress" && currentLine === event.lineNumber) {
          // Update progress bar
          const progress = event.progress;
          const element = document.querySelector(".executing-line");
          if (element) {
            element.style.setProperty("--progress", `${progress}%`);
          }

          decorationsRef.current = editor.deltaDecorations(decorationsRef.current, [
            {
              range: {
                startLineNumber: event.lineNumber,
                startColumn: 1,
                endLineNumber: event.lineNumber,
                endColumn: 1,
              },
              options: {
                isWholeLine: true,
                className: "executing-line",
                after: {
                  content: ` ${Math.round(progress)}%`,
                  inlineClassName: "progress-text",
                },
              },
            },
          ]);
        } else if (event.type === "functionComplete" || event.type === "complete") {
          // Clear all decorations on completion
          decorationsRef.current = editor.deltaDecorations(decorationsRef.current, []);
          completedDecorations = editor.deltaDecorations(completedDecorations, []);
          currentLine = null;
        }
      });
    }, [executionEvents]);

    // ── Editor mount handler ──
    const handleEditorMount = (editor, monaco) => {
      editorRef.current = editor;
      monacoRef.current = monaco;

      // Register custom language
      monaco.languages.register({ id: "game-script" });

      monaco.languages.setLanguageConfiguration("game-script", {
        comments: { lineComment: "//", blockComment: ["/*", "*/"] },
        brackets: [
          ["{", "}"],
          ["[", "]"],
          ["(", ")"],
        ],
        autoClosingPairs: [
          { open: "{", close: "}" },
          { open: "[", close: "]" },
          { open: "(", close: ")" },
          { open: '"', close: '"' },
          { open: "'", close: "'" },
          { open: "`", close: "`" },
        ],
        surroundingPairs: [
          { open: "{", close: "}" },
          { open: "[", close: "]" },
          { open: "(", close: ")" },
          { open: '"', close: '"' },
          { open: "'", close: "'" },
          { open: "`", close: "`" },
        ],
      });

      // Syntax highlighting with Monarch tokenizer
      const apiFunctionPattern = new RegExp(`\\b(${API_FUNCTION_NAMES.join("|")})\\b`);

      monaco.languages.setMonarchTokensProvider("game-script", {
        tokenizer: {
          root: [
            [/\/\/.*$/, "comment"],
            [/\/\*[\s\S]*?\*\//, "comment"],
            [/"([^"\\]|\\.)*$/, "string.invalid"],
            [/'([^'\\]|\\.)*$/, "string.invalid"],
            [/"/, "string", "@string_double"],
            [/'/, "string", "@string_single"],
            [/`/, "string", "@string_backtick"],
            [/\d*\.\d+([eE][-+]?\d+)?/, "number.float"],
            [/0[xX][0-9a-fA-F]+/, "number.hex"],
            [/\d+/, "number"],
            [/[;,.]/, "delimiter"],
            [/[{}()\[\]]/, "@brackets"],
            [apiFunctionPattern, "api-function"],
            [
              /[a-z_$][\w$]*/,
              { cases: { "@keywords": "keyword", "@default": "identifier" } },
            ],
            [/[A-Z][\w$]*/, "type.identifier"],
          ],
          string_double: [
            [/[^\\"]+/, "string"],
            [/"/, "string", "@pop"],
          ],
          string_single: [
            [/[^\\']+/, "string"],
            [/'/, "string", "@pop"],
          ],
          string_backtick: [
            [/[^\\`]+/, "string"],
            [/`/, "string", "@pop"],
          ],
        },
        keywords: [
          "while", "if", "else", "let", "const", "var",
          "function", "async", "await", "return",
          "switch", "case", "break",
          "true", "false", "null", "undefined",
        ],
      });

      // ── Autocomplete provider ──
      const completionProvider = {
        provideCompletionItems: (model, position) => {
          const availableFunctions = getAvailableFunctions();
          const word = model.getWordUntilPosition(position);
          const range = {
            startLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endLineNumber: position.lineNumber,
            endColumn: word.endColumn,
          };

          const functionDocs = {
            produceResourceA: {
              signature: "produceResourceA(): Promise<number>",
              description: "Produces 1 unit of resource A. Takes 2 seconds.",
            },
            convertAToB: {
              signature: "convertAToB(): Promise<number>",
              description:
                "Converts 2 A into 1 B. Takes 3 seconds. Returns 1 if successful, 0 if not enough A.",
            },
            getResourceCount: {
              signature: "getResourceCount(name: string): Promise<number>",
              description:
                "Gets the current count of a resource. Pass 'A' or 'B' as the name. Takes 1 second.",
            },
            log: {
              signature: "log(msg: string): Promise<void>",
              description: "Logs a message to the console. Takes 0.5 seconds.",
            },
          };

          return {
            suggestions: availableFunctions.map((funcName) => {
              const doc = functionDocs[funcName];
              return {
                label: funcName,
                kind: monaco.languages.CompletionItemKind.Function,
                documentation: doc?.description || "",
                insertText: funcName + "()",
                detail: doc?.signature || funcName + "()",
                range,
              };
            }),
          };
        },
        triggerCharacters: [],
      };

      monaco.languages.registerCompletionItemProvider("game-script", completionProvider);

      // ── Code action provider (quick-fix to open tech tree) ──
      monaco.languages.registerCodeActionProvider("game-script", {
        provideCodeActions: (model, range, context) => {
          const actions = [];

          context.markers.forEach((marker) => {
            if (
              marker.source === "Validation" &&
              marker.message.includes("not unlocked yet")
            ) {
              const info = validationInfoRef.current.find(
                (v) => v.lineNumber === marker.startLineNumber
              );
              const feature = info?.feature || "";

              actions.push({
                title: "Open Tech Tree to unlock",
                diagnostics: [marker],
                kind: "quickfix",
                isPreferred: true,
                edit: {
                  edits: [
                    {
                      resource: model.uri,
                      versionId: model.getVersionId(),
                      textEdit: {
                        range: {
                          startLineNumber: 1,
                          startColumn: 1,
                          endLineNumber: 1,
                          endColumn: 1,
                        },
                        text: `/* __OPEN_TECH_TREE__:${feature} */`,
                      },
                    },
                  ],
                },
              });
            }
          });

          return { actions, dispose: () => {} };
        },
      });

      // ── Listen for tech tree quick-fix trigger ──
      editor.onDidChangeModelContent((changeEvent) => {
        const model = editor.getModel();
        if (!model) return;

        changeEvent.changes.forEach((change) => {
          if (change.text.includes("__OPEN_TECH_TREE__")) {
            setTimeout(() => {
              const content = model.getValue();
              const pattern = /\/\* __OPEN_TECH_TREE__:(\w+) \*\//;
              const match = content.match(pattern);
              if (match) {
                const techId = match[1];
                model.setValue(content.replace(pattern, ""));
                if (onOpenTechTreeRef.current) {
                  onOpenTechTreeRef.current(techId);
                }
              }
            }, 0);
          }
        });
      });

      // ── Custom hackerman theme ──
      monaco.editor.defineTheme("game-script-theme", {
        base: "vs-dark",
        inherit: true,
        rules: [
          { token: "api-function", foreground: "00ffcc", fontStyle: "bold" },
          { token: "keyword", foreground: "00ff41" },
          { token: "comment", foreground: "004400" },
          { token: "string", foreground: "ccff00" },
          { token: "number", foreground: "00aaff" },
          { token: "identifier", foreground: "00cc33" },
          { token: "delimiter", foreground: "006600" },
          { token: "type.identifier", foreground: "00ffcc" },
        ],
        colors: {
          "editor.background": "#0a0a0a",
          "editor.foreground": "#00cc33",
          "editor.lineHighlightBackground": "#001a00",
          "editor.selectionBackground": "#003300",
          "editorCursor.foreground": "#00ff41",
          "editorLineNumber.foreground": "#004400",
          "editorLineNumber.activeForeground": "#00ff41",
          "editor.selectionHighlightBackground": "#002200",
          "editorWidget.background": "#0a0a0a",
          "editorWidget.border": "#003300",
          "editorSuggestWidget.background": "#0a0a0a",
          "editorSuggestWidget.border": "#003300",
          "editorSuggestWidget.selectedBackground": "#001a00",
          "editorGutter.background": "#050505",
        },
      });

      // Apply language and theme
      const model = editor.getModel();
      if (model) {
        monaco.editor.setModelLanguage(model, "game-script");
        monaco.editor.setTheme("game-script-theme");

        // Initial validation
        setTimeout(() => {
          const errors = validateCode(code);
          validationInfoRef.current = errors.map((e) => ({
            lineNumber: e.lineNumber,
            feature: e.feature,
          }));

          const markers = errors.map((e) => {
            const lineLength = model.getLineContent(e.lineNumber).length;
            return {
              severity: monaco.MarkerSeverity.Error,
              startLineNumber: e.lineNumber,
              startColumn: 1,
              endLineNumber: e.lineNumber,
              endColumn: Math.max(1, lineLength + 1),
              message: e.message,
              source: "Validation",
            };
          });

          monaco.editor.setModelMarkers(model, "validation", markers);
          markersRef.current = markers;
        }, 200);
      }
    };

    // ── Re-validate on code changes ──
    useEffect(() => {
      if (!editorRef.current || !monacoRef.current) return;
      const model = editorRef.current.getModel();
      if (!model) return;

      const timeout = setTimeout(() => {
        const errors = validateCode(code);
        validationInfoRef.current = errors.map((e) => ({
          lineNumber: e.lineNumber,
          feature: e.feature,
        }));

        const markers = errors.map((e) => {
          const lineLength = model.getLineContent(e.lineNumber).length;
          return {
            severity: monacoRef.current.MarkerSeverity.Error,
            startLineNumber: e.lineNumber,
            startColumn: 1,
            endLineNumber: e.lineNumber,
            endColumn: Math.max(1, lineLength + 1),
            message: e.message,
            source: "Validation",
          };
        });

        monacoRef.current.editor.setModelMarkers(model, "validation", markers);
        markersRef.current = markers;
      }, 100);

      return () => clearTimeout(timeout);
    }, [code]);

    return (
      <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <Editor
          height="100%"
          defaultLanguage="game-script"
          value={code}
          onChange={(value) => onCodeChange(value || "")}
          onMount={handleEditorMount}
          theme="game-script-theme"
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            fontFamily: "'Fira Code', 'Courier New', monospace",
            fontLigatures: true,
            wordWrap: "on",
            hover: { enabled: true, delay: 200 },
            quickSuggestions: true,
            suggestOnTriggerCharacters: true,
            wordBasedSuggestions: "matchingDocuments",
            renderValidationDecorations: "on",
            fixedOverflowWidgets: true,
            cursorBlinking: "phase",
            cursorStyle: "block",
            scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
          }}
        />
      </div>
    );
  }
);
