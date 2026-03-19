# Incremental Coding Game - Source Code Overview

This directory contains the reverse-engineered, human-readable source code
extracted from the minified production bundle (`assets/index-fB6Soy1T.js`).

> **Note**: These files are for **reading/reference only**. The actual game runs
> from the minified bundle. These files cannot be compiled directly as they
> reference libraries (React, Zustand, Monaco Editor) that are bundled in the
> production build.

## Architecture

The game is a React app built with Vite. Players write JavaScript-like code in a
Monaco editor to produce and convert resources, unlocking new language features
through a tech tree.

## File Structure

```
src/
├── gameStore.js          # Zustand state store (resources, tech, virtual time)
├── techTree.js           # Tech tree definitions, validation rules, costs
├── gameApi.js            # API functions exposed to player code
│                         #   (produceResourceA, convertAToB, etc.)
├── executionEngine.js    # Code transformer, executor, cancellation logic
├── hintSystem.js         # Tutorial hint tracking (localStorage persistence)
│
├── components/
│   ├── ResourceBar.jsx   # Top bar showing resource counts + virtual time
│   ├── FloatingWindow.jsx# Draggable/resizable window container
│   ├── LogPanel.jsx      # Log output with color-coded messages
│   ├── CpuStats.jsx      # Execution timing stats overlay
│   └── HintOverlay.jsx   # Tutorial hint modal + hint list panel
│
└── SOURCE_CODE_OVERVIEW.md  (this file)
```

### Additional components in the bundle (not extracted as separate files):
- **CodeEditor** - Monaco editor wrapper with custom "game-script" language,
  syntax highlighting, autocomplete, and execution progress visualization
- **DocsPanel** - Modal showing available functions, syntax examples, and tips
- **TechTreePanel** - Interactive tech tree with node graph, unlock buttons,
  and cost display
- **App** - Main component wiring everything together: window management,
  keyboard shortcuts (Ctrl+U, Ctrl+L, Ctrl+D, F5, Esc), execution lifecycle

## Key Concepts

### Resources
- **A** (blue) - Basic resource, produced by `produceResourceA()`
- **B** (purple) - Converted from A via `convertAToB()` (2A → 1B)
- **C** (orange) - Converted via `makeResourceC()` (3A + 1B → 1C)

### Tech Tree Progression
1. Start with just `produceResourceA()`
2. Unlock `while` loops (5A)
3. Unlock `convertAToB()` (15A)
4. Unlock variables (5B)
5. Unlock math operators (10B)
6. Unlock `makeResourceC()` (20A + 10B)
7. Unlock `if` statements (5C)
8. Unlock user functions (10C)
9. Unlock Processing Speed I (20B) - 20% faster execution

### Code Execution Pipeline
1. **Validation** - Check for locked features (tech tree) and syntax errors
2. **Transformation** - Insert `await step()` calls, add `await` to API calls,
   auto-detect `async` functions
3. **Sandboxed Execution** - Run via `new Function()` with API proxy for
   line tracking and progress reporting
4. **Progress Tracking** - Real-time line highlighting, per-function progress
   bars, timing stats

### Vendor Libraries (bundled, ~9000 lines)
- React 18.3.1
- ReactDOM
- React Scheduler
- react-hotkeys-hook (keyboard shortcuts)
- @monaco-editor/react + loader (code editor)
- Zustand (state management)
- state-local (used by Monaco loader)
