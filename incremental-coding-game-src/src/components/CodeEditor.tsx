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
  useContext,
} from "react";
import Editor from "@monaco-editor/react";
import { ALL_API_FUNCTIONS } from "../game/api";
import { getAvailableFunctions } from "../game/tech";
import { validateCode } from "../game/codeValidator";
import { ThemeContext, THEMES } from "../themes";

interface ExecutionEvent {
  type: string;
  lineNumber?: number;
  progress?: number;
  [key: string]: any;
}

const CORE_COLORS = ["#22cc44", "#4499ff", "#aa55ff", "#ff8833"];

interface CodeEditorProps {
  code: string;
  onCodeChange: (code: string) => void;
  onOpenTechTree?: (techId?: string) => void;
  coreId?: number;
}

export interface CodeEditorHandle {
  scrollToLine: (line: number) => void;
  insertText: (text: string) => void;
  pushEvent: (event: ExecutionEvent) => void;
  clearDecorations: () => void;
}

export const CodeEditor = forwardRef<CodeEditorHandle, CodeEditorProps>(
  ({ code, onCodeChange, onOpenTechTree, coreId = 0 }, ref) => {
    const theme = useContext(ThemeContext);
    const editorRef = useRef<any>(null);
    const monacoRef = useRef<any>(null);
    const decorationsRef = useRef<string[]>([]);
    const markersRef = useRef<any[]>([]);
    const onOpenTechTreeRef = useRef(onOpenTechTree);
    const validationInfoRef = useRef<Array<{ lineNumber: number; feature: string }>>([]);

    const applyEvent = (event: ExecutionEvent) => {
      if (!editorRef.current) return;
      const editor = editorRef.current;
      if (!editor.getModel()) return;

      if (event.type === "lineChange") {
        decorationsRef.current = editor.deltaDecorations(decorationsRef.current, [
          {
            range: { startLineNumber: event.lineNumber, startColumn: 1, endLineNumber: event.lineNumber, endColumn: 1 },
            options: { isWholeLine: true, className: "executing-line" },
          },
        ]);
        // Auto-scroll if line not visible
        const visibleRanges = editor.getVisibleRanges();
        const isVisible = visibleRanges.some(
          (range: any) => event.lineNumber >= range.startLineNumber && event.lineNumber <= range.endLineNumber
        );
        if (!isVisible) {
          editor.revealLineInCenter(event.lineNumber);
        }
      } else if (event.type === "functionProgress") {
        const progress = event.progress!;
        const element = document.querySelector(".executing-line") as HTMLElement | null;
        if (element) {
          element.style.setProperty("--progress", `${progress}%`);
        }
        decorationsRef.current = editor.deltaDecorations(decorationsRef.current, [
          {
            range: { startLineNumber: event.lineNumber, startColumn: 1, endLineNumber: event.lineNumber, endColumn: 1 },
            options: {
              isWholeLine: true, className: "executing-line",
              after: { content: ` ${Math.round(progress)}%`, inlineClassName: "progress-text" },
            },
          },
        ]);
      } else if (event.type === "functionComplete" || event.type === "complete") {
        decorationsRef.current = editor.deltaDecorations(decorationsRef.current, []);
      }
    };

    // Expose imperative methods to parent
    useImperativeHandle(ref, () => ({
      scrollToLine: (line: number) => {
        if (editorRef.current) {
          editorRef.current.revealLineInCenter(line);
        }
      },
      insertText: (text: string) => {
        if (editorRef.current) {
          const editor = editorRef.current;
          editor.focus();
          const position = editor.getPosition();
          if (position) {
            const model = editor.getModel();
            const currentLineContent = model?.getLineContent(position.lineNumber) || "";
            const isLineEmpty = currentLineContent.trim() === "";
            const insertText = isLineEmpty ? text : "\n" + text;
            const range = {
              startLineNumber: position.lineNumber,
              startColumn: isLineEmpty ? 1 : currentLineContent.length + 1,
              endLineNumber: position.lineNumber,
              endColumn: isLineEmpty ? 1 : currentLineContent.length + 1,
            };
            editor.executeEdits("docs-insert", [{ range, text: insertText }]);
            const lines = insertText.split("\n");
            const lastLine = lines[lines.length - 1];
            const newLineNumber = position.lineNumber + lines.length - 1;
            editor.setPosition({ lineNumber: newLineNumber, column: lastLine.length + 1 });
          }
        }
      },
      pushEvent: applyEvent,
      clearDecorations: () => {
        if (editorRef.current) {
          decorationsRef.current = editorRef.current.deltaDecorations(decorationsRef.current, []);
        }
      },
    }));

    // Keep onOpenTechTree ref current
    useEffect(() => {
      onOpenTechTreeRef.current = onOpenTechTree;
    }, [onOpenTechTree]);

    // -- Editor mount handler --
    const handleEditorMount = (editor: any, monaco: any) => {
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
      const apiFunctionPattern = new RegExp(`\\b(${ALL_API_FUNCTIONS.join("|")})\\b`);

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

      // -- Autocomplete provider --
      const functionDocs: Record<string, { signature: string; description: string; insert: string; isSnippet?: boolean }> = {
        produceResourceA: {
          signature: "produceResourceA(): Promise<number>",
          description: "Produces 1 unit of resource A. Takes 2 seconds.",
          insert: "produceResourceA()",
        },
        convertAToB: {
          signature: "convertAToB(): Promise<number>",
          description: "Converts 2 A into 1 B. Takes 3 seconds. Returns 1 if successful, 0 if not enough A.",
          insert: "convertAToB()",
        },
        getResourceCount: {
          signature: "getResourceCount(name: string): Promise<number>",
          description: "Gets the current count of a resource. Pass 'A', 'B', or 'C'. Takes 1 second.",
          insert: "getResourceCount('${1:A}')",
          isSnippet: true,
        },
        log: {
          signature: "log(msg: string): Promise<void>",
          description: "Logs a message to the console. Takes 0.5 seconds.",
          insert: "log('${1:message}')",
          isSnippet: true,
        },
        convertABToC: {
          signature: "convertABToC(): Promise<number>",
          description: "Converts 3 A + 1 B into 1 C. Takes 3 seconds.",
          insert: "convertABToC()",
        },
      };

      // Extract user-defined variables and functions from code
      function extractUserSymbols(model: any) {
        const text = model.getValue();
        const symbols: Array<{ label: string; kind: number; detail: string; insert?: string }> = [];
        const seen = new Set<string>();

        // Variables: let/const/var name
        const varRegex = /\b(?:let|const|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
        let m;
        while ((m = varRegex.exec(text)) !== null) {
          if (!seen.has(m[1])) {
            seen.add(m[1]);
            symbols.push({ label: m[1], kind: monaco.languages.CompletionItemKind.Variable, detail: "variable" });
          }
        }

        // User functions: function name(
        const fnRegex = /\bfunction\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g;
        while ((m = fnRegex.exec(text)) !== null) {
          if (!seen.has(m[1])) {
            seen.add(m[1]);
            symbols.push({ label: m[1], kind: monaco.languages.CompletionItemKind.Function, detail: "user function", insert: m[1] + "()" });
          }
        }

        return symbols;
      }

      const keywordCompletions = [
        { label: "while", insert: "while (${1:true}) {\n  ${2}\n}", detail: "while loop", description: "Loop while condition is true" },
        { label: "if", insert: "if (${1:condition}) {\n  ${2}\n}", detail: "if statement", description: "Conditional execution" },
        { label: "else", insert: "else {\n  ${1}\n}", detail: "else block", description: "Else branch" },
        { label: "let", insert: "let ${1:name} = ${2:value}", detail: "variable", description: "Declare a mutable variable" },
        { label: "const", insert: "const ${1:name} = ${2:value}", detail: "constant", description: "Declare a constant" },
        { label: "function", insert: "function ${1:name}(${2}) {\n  ${3}\n}", detail: "function", description: "Define a function" },
        { label: "true", insert: "true", detail: "boolean", description: "" },
        { label: "false", insert: "false", detail: "boolean", description: "" },
        { label: "return", insert: "return ${1}", detail: "keyword", description: "Return a value" },
      ];

      const completionProvider = {
        provideCompletionItems: (model: any, position: any) => {
          const availableFunctions = getAvailableFunctions();
          const word = model.getWordUntilPosition(position);
          const range = {
            startLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endLineNumber: position.lineNumber,
            endColumn: word.endColumn,
          };

          const suggestions: any[] = [];
          let sortIndex = 0;

          // API functions (highest priority)
          availableFunctions.forEach((funcName: string) => {
            const doc = functionDocs[funcName];
            if (!doc) return;
            suggestions.push({
              label: funcName,
              kind: monaco.languages.CompletionItemKind.Function,
              documentation: doc.description,
              insertText: doc.insert,
              insertTextRules: doc.isSnippet ? monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet : undefined,
              detail: doc.signature,
              range,
              sortText: `0_${String(sortIndex++).padStart(3, "0")}`,
            });
          });

          // User-defined symbols
          const userSymbols = extractUserSymbols(model);
          userSymbols.forEach((sym) => {
            suggestions.push({
              label: sym.label,
              kind: sym.kind,
              detail: sym.detail,
              insertText: sym.insert || sym.label,
              range,
              sortText: `1_${sym.label}`,
            });
          });

          // Keywords
          keywordCompletions.forEach((kw) => {
            suggestions.push({
              label: kw.label,
              kind: monaco.languages.CompletionItemKind.Keyword,
              detail: kw.detail,
              documentation: kw.description,
              insertText: kw.insert,
              insertTextRules: kw.insert.includes("${") ? monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet : undefined,
              range,
              sortText: `2_${kw.label}`,
            });
          });

          return { suggestions };
        },
        triggerCharacters: [] as string[],
      };

      monaco.languages.registerCompletionItemProvider("game-script", completionProvider);

      // -- Code action provider (quick-fix to open tech tree) --
      monaco.languages.registerCodeActionProvider("game-script", {
        provideCodeActions: (model: any, range: any, context: any) => {
          const actions: any[] = [];

          context.markers.forEach((marker: any) => {
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

      // -- Listen for tech tree quick-fix trigger --
      editor.onDidChangeModelContent((changeEvent: any) => {
        const model = editor.getModel();
        if (!model) return;

        changeEvent.changes.forEach((change: any) => {
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

      // -- Register all themes --
      Object.values(THEMES).forEach((t: any) => {
        monaco.editor.defineTheme(`game-script-${t.id}`, {
          base: t.monacoBase,
          inherit: true,
          rules: t.monacoRules,
          colors: t.monacoColors,
        });
      });

      // Apply language and theme
      const model = editor.getModel();
      if (model) {
        monaco.editor.setModelLanguage(model, "game-script");
        monaco.editor.setTheme(`game-script-${theme.id}`);

        // Initial validation
        setTimeout(() => {
          const errors = validateCode(code);
          validationInfoRef.current = errors.map((e: any) => ({
            lineNumber: e.lineNumber,
            feature: e.feature,
          }));

          const markers = errors.map((e: any) => {
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

    // -- Re-validate on code changes --
    useEffect(() => {
      if (!editorRef.current || !monacoRef.current) return;
      const model = editorRef.current.getModel();
      if (!model) return;

      const timeout = setTimeout(() => {
        const errors = validateCode(code);
        validationInfoRef.current = errors.map((e: any) => ({
          lineNumber: e.lineNumber,
          feature: e.feature,
        }));

        const markers = errors.map((e: any) => {
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

    // Switch Monaco theme when app theme changes
    useEffect(() => {
      if (monacoRef.current) {
        monacoRef.current.editor.setTheme(`game-script-${theme.id}`);
      }
    }, [theme.id]);

    return (
      <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <Editor
          height="100%"
          defaultLanguage="game-script"
          value={code}
          onChange={(value) => onCodeChange(value || "")}
          onMount={handleEditorMount}
          theme={`game-script-${theme.id}`}
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
            cursorBlinking: "smooth",
            cursorStyle: "line",
            scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
          }}
        />
      </div>
    );
  }
);
