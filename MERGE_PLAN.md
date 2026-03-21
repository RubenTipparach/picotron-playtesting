# Merge Plan: Restructured Codebase for Upstream Compatibility

## Status: COMPLETED

Our codebase (`incremental-coding-game-src/`) has been restructured to match the original upstream (`incremental-coding-game/` from Archimagus/incremental-coding-game) file structure, naming conventions, and TypeScript types — while preserving ALL our features and functionality.

## What Changed

### Language: JavaScript → TypeScript
- All `.js` files converted to `.ts`
- All `.jsx` files converted to `.tsx`
- TypeScript interfaces and types added matching original's naming conventions
- `tsconfig.json` and `tsconfig.node.json` added

### Directory Structure: Flat → Organized (matching original)
```
src/
  App.tsx                          # Main app component
  main.tsx                         # Entry point
  index.css                        # Global styles
  themes.ts                        # Theme system (NEW — not in original)
  store/
    gameStore.ts                   # Zustand state store
  game/
    api.ts                         # Game API functions
    codeValidator.ts               # Code validation (extracted from old techTree.js)
    tech.ts                        # Tech tree definitions
    executionEngine.ts             # Eval-style code executor (our approach, not AST)
    marketEngine.ts                # Stock market simulation (NEW)
  utils/
    hintManager.ts                 # Hint/tutorial system
  components/
    CodeEditor.tsx                 # Monaco editor wrapper
    CPUPanel.tsx                   # CPU/profiler stats (was CpuStats)
    DocumentationPanel.tsx         # Docs panel (was DocsPanel)
    HintPopover.tsx                # Hint modal + panel (was HintOverlay)
    LogPanel.tsx                   # Console log output
    ResourcePanel.tsx              # Resource bar + controls (was ResourceBar)
    ShopPanel.tsx                  # Shop UI (NEW)
    SnippetsPanel.tsx              # Code snippets (NEW)
    StockMarketPanel.tsx           # Market UI (NEW)
    TechTreeModal.tsx              # Tech tree overlay (was TechTreePanel)
    Window.tsx                     # Draggable window (was FloatingWindow)
```

### Variable/Export Name Changes (matching original upstream)

| Our Old Name              | New Name (matching original) | File                    |
|---------------------------|------------------------------|-------------------------|
| `LOCAL_STORAGE_KEY`       | `STORAGE_KEY`                | store/gameStore.ts      |
| `DEFAULT_STATE`           | `defaultState`               | store/gameStore.ts      |
| `saveGameState()`         | `saveGameStateToStorage()`   | store/gameStore.ts      |
| `API_FUNCTION_NAMES`      | `ALL_API_FUNCTIONS`          | game/api.ts             |
| `createGameApi()`         | `createAPI()`                | game/api.ts             |
| `TECH_TREE`               | `TECH_UNLOCKS`               | game/tech.ts            |
| `markHintSeen()`          | `markHintAsSeen()`           | utils/hintManager.ts    |
| `ResourceBar` component   | `ResourcePanel`              | components/ResourcePanel|
| `CpuStats` component      | `CPUPanel`                   | components/CPUPanel     |
| `DocsPanel` component     | `DocumentationPanel`         | components/DocumentationPanel |
| `TechTreePanel` component | `TechTreeModal`              | components/TechTreeModal|
| `HintModal` component     | `HintPopover`                | components/HintPopover  |
| `HintPanel` component     | `HintsPanel`                 | components/HintPopover  |
| `FloatingWindow` component| `Window`                     | components/Window       |

### TypeScript Types Added (matching original)
- `Resources`, `ResourceKey`, `RESOURCE_KEYS` in gameStore.ts
- `TechUnlocks`, `GameState`, `GameActions` interfaces in gameStore.ts
- `API`, `APICallContext` interfaces in api.ts
- `TechUnlock` interface in tech.ts
- `ExecutionEvent`, `ExecutionCallbacks` types in executionEngine.ts
- `MarketState`, `MarketPrices`, `Candle`, `PricePoint`, `TradeResult`, `EmotionInfo` in marketEngine.ts
- `HintDefinition` interface in hintManager.ts
- `Theme`, `MonacoRule` interfaces in themes.ts
- Props interfaces for all components

### What We Keep (not in original)
- **Eval-style execution engine** (original uses AST executor with acorn)
- **Resource D** and `resourceDUnlocked` tech
- **Shop system** — credits, RAM (token limit), CPU upgrades
- **Stock market** — agent-based market simulation
- **Themes** — 3 selectable themes
- **Snippets panel** — code snippet library
- **Token counting** — PICO-8 style RAM system
- **Mobile responsive layout**

## File Mapping: Original ↔ Ours (for diffing)

| Original File                        | Our File                          | Notes                                |
|--------------------------------------|-----------------------------------|--------------------------------------|
| `src/store/gameStore.ts`             | `src/store/gameStore.ts`          | Same path, extended with D/shop/market |
| `src/game/api.ts`                    | `src/game/api.ts`                 | Same path, extended with market API  |
| `src/game/tech.ts`                   | `src/game/tech.ts`                | Same path, extended with new techs   |
| `src/game/codeValidator.ts`          | `src/game/codeValidator.ts`       | Same path, same logic                |
| `src/game/astExecutor.ts`            | `src/game/executionEngine.ts`     | Different approach (eval vs AST)     |
| `src/utils/hintManager.ts`           | `src/utils/hintManager.ts`        | Same path, same logic                |
| `src/components/CodeEditor.tsx`      | `src/components/CodeEditor.tsx`    | Same path                            |
| `src/components/CPUPanel.tsx`        | `src/components/CPUPanel.tsx`      | Same path                            |
| `src/components/DocumentationPanel.tsx` | `src/components/DocumentationPanel.tsx` | Same path                      |
| `src/components/HintPopover.tsx`     | `src/components/HintPopover.tsx`   | Same path (includes HintsPanel)      |
| `src/components/LogPanel.tsx`        | `src/components/LogPanel.tsx`      | Same path                            |
| `src/components/ResourcePanel.tsx`   | `src/components/ResourcePanel.tsx` | Same path                            |
| `src/components/TechTreeModal.tsx`   | `src/components/TechTreeModal.tsx` | Same path                            |
| `src/components/Window.tsx`          | `src/components/Window.tsx`        | Same path                            |
| *(none)*                             | `src/game/marketEngine.ts`        | NEW: market simulation               |
| *(none)*                             | `src/themes.ts`                   | NEW: theme system                    |
| *(none)*                             | `src/components/ShopPanel.tsx`    | NEW: shop UI                         |
| *(none)*                             | `src/components/StockMarketPanel.tsx` | NEW: market UI                    |
| *(none)*                             | `src/components/SnippetsPanel.tsx` | NEW: snippets UI                     |

## How to Diff

Now that paths match, you can directly compare:
```bash
# Compare individual files
diff incremental-coding-game/src/store/gameStore.ts incremental-coding-game-src/src/store/gameStore.ts
diff incremental-coding-game/src/game/api.ts incremental-coding-game-src/src/game/api.ts
diff incremental-coding-game/src/game/tech.ts incremental-coding-game-src/src/game/tech.ts

# Compare all matching files
for f in src/store/gameStore.ts src/game/api.ts src/game/tech.ts src/game/codeValidator.ts src/utils/hintManager.ts; do
  echo "=== $f ==="
  diff "incremental-coding-game/$f" "incremental-coding-game-src/$f" | head -20
done
```
