import React, { useState, useEffect } from "react";
import { useTheme } from "../themes";

const SNIPPETS_KEY = "incremental-coding-game-snippets";

interface Snippet {
  id: string;
  name: string;
  code: string;
  createdAt: number;
}

function loadSnippets(): Snippet[] {
  try {
    const raw = localStorage.getItem(SNIPPETS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSnippets(snippets: Snippet[]) {
  localStorage.setItem(SNIPPETS_KEY, JSON.stringify(snippets));
}

interface SnippetsPanelProps {
  currentCode: string;
  onLoad: (code: string) => void;
  onInsert?: (code: string) => void;
}

/**
 * SnippetsPanel -- save, name, rename, load, edit, and delete code snippets.
 *
 * Props:
 *   currentCode: string -- the code currently in the editor
 *   onLoad: (code: string) => void -- called when user loads a snippet into the editor
 */
export function SnippetsPanel({ currentCode, onLoad, onInsert }: SnippetsPanelProps) {
  const t = useTheme();
  const [snippets, setSnippets] = useState<Snippet[]>(loadSnippets);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [savingNew, setSavingNew] = useState(false);
  const [newName, setNewName] = useState("");

  // Persist whenever snippets change
  useEffect(() => {
    saveSnippets(snippets);
  }, [snippets]);

  const createSnippet = (name: string, code: string) => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    setSnippets((prev) => [...prev, { id, name, code, createdAt: Date.now() }]);
  };

  const deleteSnippet = (id: string) => {
    const snippet = snippets.find((s) => s.id === id);
    if (!snippet) return;
    if (!window.confirm(`Delete snippet "${snippet.name}"?`)) return;
    setSnippets((prev) => prev.filter((s) => s.id !== id));
    if (editingId === id) setEditingId(null);
    if (renamingId === id) setRenamingId(null);
  };

  const renameSnippet = (id: string) => {
    const trimmed = renameValue.trim();
    if (!trimmed) return;
    setSnippets((prev) => prev.map((s) => s.id === id ? { ...s, name: trimmed } : s));
    setRenamingId(null);
  };

  const saveEdit = (id: string) => {
    setSnippets((prev) => prev.map((s) => s.id === id ? { ...s, code: editValue } : s));
    setEditingId(null);
  };

  const handleSaveCurrent = () => {
    if (savingNew) {
      const name = newName.trim() || `Snippet ${snippets.length + 1}`;
      createSnippet(name, currentCode);
      setSavingNew(false);
      setNewName("");
    } else {
      setSavingNew(true);
      setNewName("");
    }
  };

  const handleNewBlank = () => {
    createSnippet(`Snippet ${snippets.length + 1}`, "");
  };

  const btnStyle = (active = true): React.CSSProperties => ({
    padding: "3px 8px",
    fontSize: "10px",
    fontFamily: t.font,
    backgroundColor: active ? t.bg3 : t.bg,
    color: active ? t.primary : t.primaryDark,
    border: `1px solid ${active ? t.primary : t.border}`,
    cursor: active ? "pointer" : "default",
    letterSpacing: "0.5px",
  });

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "4px 6px",
    fontSize: "11px",
    fontFamily: t.font,
    backgroundColor: t.bg,
    color: t.primary,
    border: `1px solid ${t.borderBright}`,
    boxSizing: "border-box",
    outline: "none",
  };

  const RED = "#ee3333";

  return (
    <div style={{
      padding: "12px", fontFamily: t.font, color: t.primary,
      height: "100%", overflowY: "auto", boxSizing: "border-box",
    }}>
      <div style={{ color: t.primaryDim, fontSize: "11px", marginBottom: "12px", letterSpacing: "2px" }}>
        [ SNIPPETS ]
      </div>

      {/* Save current / New blank */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "12px", flexWrap: "wrap" }}>
        <button onClick={handleSaveCurrent} style={btnStyle()}>
          {savingNew ? "CONFIRM" : "SAVE CURRENT"}
        </button>
        {savingNew && (
          <button onClick={() => setSavingNew(false)} style={btnStyle()}>CANCEL</button>
        )}
        {!savingNew && (
          <button onClick={handleNewBlank} style={btnStyle()}>NEW BLANK</button>
        )}
      </div>

      {/* New snippet name input */}
      {savingNew && (
        <div style={{ marginBottom: "12px" }}>
          <input
            type="text"
            placeholder="Snippet name..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSaveCurrent(); if (e.key === "Escape") setSavingNew(false); }}
            autoFocus
            style={inputStyle}
          />
        </div>
      )}

      {/* Snippet list */}
      {snippets.length === 0 && !savingNew && (
        <div style={{ color: t.primaryDark, fontSize: "11px" }}>
          No snippets saved yet. Click "SAVE CURRENT" to save the code in your editor.
        </div>
      )}

      {snippets.map((snippet) => {
        const isRenaming = renamingId === snippet.id;
        const isEditing = editingId === snippet.id;
        const preview = snippet.code.length > 60
          ? snippet.code.slice(0, 60).replace(/\n/g, " ") + "..."
          : snippet.code.replace(/\n/g, " ") || "(empty)";

        return (
          <div key={snippet.id} style={{
            marginBottom: "8px",
            padding: "8px",
            backgroundColor: t.bg2 || t.bg3,
            border: `1px solid ${t.border}`,
          }}>
            {/* Name row */}
            {isRenaming ? (
              <div style={{ display: "flex", gap: "4px", marginBottom: "6px" }}>
                <input
                  type="text"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") renameSnippet(snippet.id); if (e.key === "Escape") setRenamingId(null); }}
                  autoFocus
                  style={{ ...inputStyle, flex: 1 }}
                />
                <button onClick={() => renameSnippet(snippet.id)} style={btnStyle()}>OK</button>
                <button onClick={() => setRenamingId(null)} style={btnStyle()}>X</button>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                <span style={{ fontSize: "12px", fontWeight: "bold", color: t.primary, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {snippet.name}
                </span>
                <span style={{ fontSize: "9px", color: t.primaryDark, flexShrink: 0 }}>
                  {snippet.code.length} chars
                </span>
              </div>
            )}

            {/* Code preview / editor */}
            {isEditing ? (
              <div style={{ marginBottom: "6px" }}>
                <textarea
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  style={{
                    ...inputStyle,
                    height: "100px",
                    resize: "vertical",
                    fontFamily: "'Fira Code', 'Cascadia Code', 'Consolas', monospace",
                    fontSize: "10px",
                    lineHeight: "1.4",
                  }}
                />
                <div style={{ display: "flex", gap: "4px", marginTop: "4px" }}>
                  <button onClick={() => saveEdit(snippet.id)} style={btnStyle()}>SAVE EDIT</button>
                  <button onClick={() => setEditingId(null)} style={btnStyle()}>CANCEL</button>
                </div>
              </div>
            ) : (
              <div style={{
                fontSize: "10px", color: t.primaryDark, marginBottom: "6px",
                fontFamily: "'Fira Code', 'Cascadia Code', 'Consolas', monospace",
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              }}>
                {preview}
              </div>
            )}

            {/* Action buttons */}
            {!isEditing && !isRenaming && (
              <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                <button onClick={() => onLoad(snippet.code)} style={btnStyle()}>LOAD</button>
                <button onClick={() => { setEditingId(snippet.id); setEditValue(snippet.code); }} style={btnStyle()}>EDIT</button>
                {onInsert && (
                  <button onClick={() => onInsert(snippet.code)} style={btnStyle()}>INSERT</button>
                )}
                <button onClick={() => { setRenamingId(snippet.id); setRenameValue(snippet.name); }} style={btnStyle()}>RENAME</button>
                <button
                  onClick={() => deleteSnippet(snippet.id)}
                  style={{ ...btnStyle(), color: RED, borderColor: `${RED}66` }}
                >
                  DELETE
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
