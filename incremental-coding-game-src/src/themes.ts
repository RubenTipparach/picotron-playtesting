/**
 * Theme definitions for the incremental coding game.
 * Three themes: Hacker (default), Treasure Map, Architecture Blueprint.
 * Persisted to localStorage.
 */

import { createContext, useContext } from "react";

export interface MonacoRule {
  token: string;
  foreground: string;
  fontStyle?: string;
}

export interface Theme {
  id: string;
  name: string;
  bg: string;
  bg2: string;
  bg3: string;
  bgAlt: string;
  border: string;
  borderBright: string;
  primary: string;
  primaryDim: string;
  primaryDark: string;
  text: string;
  textDim: string;
  textMuted: string;
  accent: string;
  red: string;
  yellow: string;
  cyan: string;
  resourceA: string;
  resourceB: string;
  resourceC: string;
  resourceD: string;
  crt: boolean;
  overlay: string | null;
  font: string;
  monacoBase: string;
  monacoRules: MonacoRule[];
  monacoColors: Record<string, string>;
}

const THEME_STORAGE_KEY = "incremental-coding-game-theme";

export const THEMES: Record<string, Theme> = {
  hacker: {
    id: "hacker",
    name: "Hackerman",
    bg: "#0a0a0a",
    bg2: "#0d1a0d",
    bg3: "#001a00",
    bgAlt: "#050505",
    border: "#003300",
    borderBright: "#00ff41",
    primary: "#00ff41",
    primaryDim: "#00cc33",
    primaryDark: "#00cc33",
    text: "#00ff41",
    textDim: "#00cc33",
    textMuted: "#00cc33",
    accent: "#00ffcc",
    red: "#ff0040",
    yellow: "#ccff00",
    cyan: "#00ffcc",
    resourceA: "#00aaff",
    resourceB: "#aa44ff",
    resourceC: "#ff6b35",
    resourceD: "#ffcc00",
    crt: true,
    overlay: null,
    font: "'Fira Code', 'Courier New', monospace",
    monacoBase: "vs-dark",
    monacoRules: [
      { token: "api-function", foreground: "00ffcc", fontStyle: "bold" },
      { token: "keyword", foreground: "00ff41" },
      { token: "comment", foreground: "004400" },
      { token: "string", foreground: "ccff00" },
      { token: "number", foreground: "00aaff" },
      { token: "identifier", foreground: "00cc33" },
      { token: "delimiter", foreground: "006600" },
      { token: "type.identifier", foreground: "00ffcc" },
    ],
    monacoColors: {
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
  },

  treasure: {
    id: "treasure",
    name: "Treasure Map",
    bg: "#f5e6c8",
    bg2: "#ede0c0",
    bg3: "#e8d5a8",
    bgAlt: "#f0dbb5",
    border: "#c4a265",
    borderBright: "#8b6914",
    primary: "#5c3a0a",
    primaryDim: "#7a5526",
    primaryDark: "#c4a265",
    text: "#3d2506",
    textDim: "#7a5526",
    textMuted: "#b89a6a",
    accent: "#2e7d32",
    red: "#b71c1c",
    yellow: "#b8860b",
    cyan: "#2e7d32",
    resourceA: "#1565c0",
    resourceB: "#6a1b9a",
    resourceC: "#e65100",
    resourceD: "#f9a825",
    crt: false,
    overlay: null,
    font: "'Fira Code', 'Courier New', monospace",
    monacoBase: "vs",
    monacoRules: [
      { token: "api-function", foreground: "2e7d32", fontStyle: "bold" },
      { token: "keyword", foreground: "8b6914" },
      { token: "comment", foreground: "b89a6a" },
      { token: "string", foreground: "b71c1c" },
      { token: "number", foreground: "1565c0" },
      { token: "identifier", foreground: "5c3a0a" },
      { token: "delimiter", foreground: "c4a265" },
      { token: "type.identifier", foreground: "2e7d32" },
    ],
    monacoColors: {
      "editor.background": "#f5e6c8",
      "editor.foreground": "#5c3a0a",
      "editor.lineHighlightBackground": "#ede0c0",
      "editor.selectionBackground": "#d4b87a",
      "editorCursor.foreground": "#5c3a0a",
      "editorLineNumber.foreground": "#c4a265",
      "editorLineNumber.activeForeground": "#8b6914",
      "editor.selectionHighlightBackground": "#e0d0a8",
      "editorWidget.background": "#f5e6c8",
      "editorWidget.border": "#c4a265",
      "editorSuggestWidget.background": "#f5e6c8",
      "editorSuggestWidget.border": "#c4a265",
      "editorSuggestWidget.selectedBackground": "#ede0c0",
      "editorGutter.background": "#f0dbb5",
    },
  },

  blueprint: {
    id: "blueprint",
    name: "Blueprint",
    bg: "#0a1628",
    bg2: "#0e1e38",
    bg3: "#132848",
    bgAlt: "#081220",
    border: "#1e3a6e",
    borderBright: "#4d8cff",
    primary: "#4d8cff",
    primaryDim: "#6ba3ff",
    primaryDark: "#1e3a6e",
    text: "#c8d8f0",
    textDim: "#7a9cc8",
    textMuted: "#3a5a80",
    accent: "#64dfdf",
    red: "#ff6b6b",
    yellow: "#ffd700",
    cyan: "#64dfdf",
    resourceA: "#4dc9f6",
    resourceB: "#a78bfa",
    resourceC: "#fb923c",
    resourceD: "#fbbf24",
    crt: false,
    overlay: "grid",
    font: "'Fira Code', 'Courier New', monospace",
    monacoBase: "vs-dark",
    monacoRules: [
      { token: "api-function", foreground: "64dfdf", fontStyle: "bold" },
      { token: "keyword", foreground: "4d8cff" },
      { token: "comment", foreground: "3a5a80" },
      { token: "string", foreground: "ffd700" },
      { token: "number", foreground: "4dc9f6" },
      { token: "identifier", foreground: "c8d8f0" },
      { token: "delimiter", foreground: "5a7aa0" },
      { token: "type.identifier", foreground: "64dfdf" },
    ],
    monacoColors: {
      "editor.background": "#0a1628",
      "editor.foreground": "#c8d8f0",
      "editor.lineHighlightBackground": "#0e1e38",
      "editor.selectionBackground": "#1e3a6e",
      "editorCursor.foreground": "#4d8cff",
      "editorLineNumber.foreground": "#1e3a6e",
      "editorLineNumber.activeForeground": "#4d8cff",
      "editor.selectionHighlightBackground": "#152a50",
      "editorWidget.background": "#0a1628",
      "editorWidget.border": "#1e3a6e",
      "editorSuggestWidget.background": "#0a1628",
      "editorSuggestWidget.border": "#1e3a6e",
      "editorSuggestWidget.selectedBackground": "#0e1e38",
      "editorGutter.background": "#081220",
    },
  },
};

export const ThemeContext = createContext<Theme>(THEMES.hacker);

export function useTheme(): Theme {
  return useContext(ThemeContext);
}

export function loadThemeId(): string {
  try {
    const id = localStorage.getItem(THEME_STORAGE_KEY);
    if (id && THEMES[id]) return id;
  } catch {}
  return "hacker";
}

export function saveThemeId(id: string): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, id);
  } catch {}
}

export const THEME_LIST: Theme[] = Object.values(THEMES);
