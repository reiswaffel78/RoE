# Graph Report - roe  (2026-10-18)

## Corpus Check
- 66 files · ~17,184 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: (none) 2, .css 1, .webmanifest 1)

## Summary
- 360 nodes · 753 edges · 17 communities (9 shown, 8 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 10 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2eb8570c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- bootDiagnostics.ts
- data.ts
- App.tsx
- Projekt-Design-Report (PDR)
- package.json
- audioService
- compilerOptions
- gemini.ts
- Inhaltsverzeichnis
- SeededRNG
- CLAUDE.md
- graphify
- AGENTS.md
- .claude/CLAUDE.md

## God Nodes (most connected - your core abstractions)
1. `useGameStore` - 39 edges
2. `Projekt-Design-Report (PDR)` - 35 edges
3. `react` - 27 edges
4. `App()` - 21 edges
5. `recordBootWarning()` - 17 edges
6. `compilerOptions` - 16 edges
7. `normalizeState()` - 15 edges
8. `audioService` - 15 edges
9. `formatNumber()` - 15 edges
10. `getInitialState()` - 14 edges

## Surprising Connections (you probably didn't know these)
- `Ablauf 2: Ein Spiel-Tick (Chi-Generierung)` --references--> `tick()`  [INFERRED]
  README.md → core/gameLogic.ts
- `Game Loop` --references--> `useGameLoop()`  [INFERRED]
  README.md → hooks/useGameLoop.ts
- `Ablauf 1: Spieler levelt eine Pflanze auf` --references--> `PlantPanel()`  [INFERRED]
  README.md → components/PlantPanel.tsx
- `Ablauf 1: Spieler levelt eine Pflanze auf` --references--> `TopBar()`  [INFERRED]
  README.md → components/TopBar.tsx
- `Game Loop` --references--> `tick()`  [INFERRED]
  README.md → core/gameLogic.ts

## Import Cycles
- None detected.

## Communities (17 total, 8 thin omitted)

### Community 0 - "bootDiagnostics.ts"
Cohesion: 0.08
Nodes (50): PixiBackground(), requestServiceWorkerVersion(), useServiceWorker(), buildResources(), DEFAULT_TRANSLATIONS, fetchLocale(), initializeI18n(), isPlainObject() (+42 more)

### Community 1 - "data.ts"
Cohesion: 0.07
Nodes (47): EventModalProps, achievements, getBalanceModifiers(), clampNumber(), cloneAchievements(), clonePlants(), clonePrestige(), cloneRecord() (+39 more)

### Community 2 - "App.tsx"
Cohesion: 0.12
Nodes (35): App(), AchievementsPanel(), BalanceMeter(), DevMenu(), DevMenuProps, EventLog(), EventModal(), LeafIcon() (+27 more)

### Community 3 - "Projekt-Design-Report (PDR)"
Cohesion: 0.04
Nodes (45): 10) Technische Architektur, 11) Ordnerstruktur (Vorschlag), 12) Datenmodell (TypeScript), 13) Content-Beispiele (erste 2 Stufen), 14) Balancing-Framework, 15) Test, Debug & Telemetrie, 16) Lokalisierung & Barrierefreiheit, 17) Produktionsplan (MVP → Beta) (+37 more)

### Community 4 - "package.json"
Cohesion: 0.06
Nodes (35): dependencies, @google/genai, howler, i18next, i18next-browser-languagedetector, pixi.js, @pixi/particle-emitter, react (+27 more)

### Community 5 - "audioService"
Cohesion: 0.07
Nodes (15): Settings(), SettingsProps, gameVersion, useAudioController(), howler, audioService, logger, LogLevel (+7 more)

### Community 6 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, allowJs, experimentalDecorators, isolatedModules, jsx, lib, module (+8 more)

### Community 7 - "gemini.ts"
Cohesion: 0.27
Nodes (8): useDynamicText(), usePlantDescriptionGenerator(), @google/genai, ai, aiDisabled, createClient(), generatePlantDescription(), generateSpiritMessage()

### Community 8 - "Inhaltsverzeichnis"
Cohesion: 0.20
Nodes (9): 1. Projektbeschreibung, 2. Hauptfunktionen, 3. Ordner- und Dateistruktur, 5. Technische Details, 6. Verwendete Technologien, 7. System-Interaktionen und Datenflüsse, Ablauf 2: Ein Spiel-Tick (Chi-Generierung), Inhaltsverzeichnis (+1 more)

## Knowledge Gaps
- **8 isolated node(s):** `graphify-mcp`, `@types/node`, `typescript`, `DEBUG`, `INFO` (+3 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 166 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `App.tsx` to `bootDiagnostics.ts`, `package.json`, `audioService`, `gemini.ts`, `Icons.tsx`?**
  _High betweenness centrality (0.125) - this node is a cross-community bridge._
- **What connects `graphify-mcp`, `@types/node`, `typescript` to the rest of the system?**
  _8 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `bootDiagnostics.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07589285714285714 - nodes in this community are weakly interconnected._
- **Should `data.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07231638418079096 - nodes in this community are weakly interconnected._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.12299091544374563 - nodes in this community are weakly interconnected._
- **Should `Projekt-Design-Report (PDR)` be split into smaller, more focused modules?**
  _Cohesion score 0.043478260869565216 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.0553306342780027 - nodes in this community are weakly interconnected._