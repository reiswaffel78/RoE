# Graph Report - roe  (2026-10-18)

## Corpus Check
- 61 files · ~16,407 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: (none) 3, .css 1, .webmanifest 1)

## Summary
- 350 nodes · 747 edges · 15 communities (10 shown, 5 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 10 edges (avg confidence: 0.93)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9bf6657c`
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
- Settings.tsx
- LogLevel

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
- `Game Loop` --references--> `tick()`  [INFERRED]
  README.md → core/gameLogic.ts
- `Ablauf 1: Spieler levelt eine Pflanze auf` --references--> `PlantPanel()`  [INFERRED]
  README.md → components/PlantPanel.tsx
- `Ablauf 1: Spieler levelt eine Pflanze auf` --references--> `TopBar()`  [INFERRED]
  README.md → components/TopBar.tsx
- `State Management (Zustand)` --references--> `tick()`  [INFERRED]
  README.md → core/gameLogic.ts

## Import Cycles
- None detected.

## Communities (15 total, 5 thin omitted)

### Community 0 - "bootDiagnostics.ts"
Cohesion: 0.08
Nodes (47): PixiBackground(), requestServiceWorkerVersion(), useServiceWorker(), initializeI18n(), bootstrap(), ensureDomReady(), handleServiceWorkerBypass(), RootShell() (+39 more)

### Community 1 - "data.ts"
Cohesion: 0.08
Nodes (44): EventModalProps, achievements, getBalanceModifiers(), clampNumber(), cloneAchievements(), clonePlants(), clonePrestige(), cloneRecord() (+36 more)

### Community 2 - "App.tsx"
Cohesion: 0.13
Nodes (33): App(), AchievementsPanel(), BalanceMeter(), DevMenu(), DevMenuProps, EventLog(), EventModal(), LeafIcon() (+25 more)

### Community 3 - "Projekt-Design-Report (PDR)"
Cohesion: 0.04
Nodes (45): 10) Technische Architektur, 11) Ordnerstruktur (Vorschlag), 12) Datenmodell (TypeScript), 13) Content-Beispiele (erste 2 Stufen), 14) Balancing-Framework, 15) Test, Debug & Telemetrie, 16) Lokalisierung & Barrierefreiheit, 17) Produktionsplan (MVP → Beta) (+37 more)

### Community 4 - "package.json"
Cohesion: 0.05
Nodes (40): buildResources(), DEFAULT_TRANSLATIONS, fetchLocale(), isPlainObject(), LocaleResource, localeUrls, dependencies, @google/genai (+32 more)

### Community 6 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, allowJs, experimentalDecorators, isolatedModules, jsx, lib, module (+8 more)

### Community 7 - "gemini.ts"
Cohesion: 0.31
Nodes (7): useDynamicText(), usePlantDescriptionGenerator(), @google/genai, ai, aiDisabled, createClient(), generatePlantDescription()

### Community 8 - "Inhaltsverzeichnis"
Cohesion: 0.12
Nodes (15): clampDelta(), GameLoopOptions, useGameLoop(), 1. Projektbeschreibung, 2. Hauptfunktionen, 3. Ordner- und Dateistruktur, 4. Code-Struktur und Architektur, 5. Technische Details (+7 more)

### Community 11 - "Settings.tsx"
Cohesion: 0.36
Nodes (6): Settings(), SettingsProps, gameVersion, useAudioController(), exportGameData(), importGameData()

### Community 12 - "LogLevel"
Cohesion: 0.33
Nodes (6): LogLevel, DEBUG, ERROR, INFO, NONE, WARN

## Knowledge Gaps
- **7 isolated node(s):** `@types/node`, `typescript`, `DEBUG`, `INFO`, `WARN` (+2 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 158 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `App.tsx` to `bootDiagnostics.ts`, `package.json`, `audioService`, `gemini.ts`, `Inhaltsverzeichnis`, `Icons.tsx`, `Settings.tsx`?**
  _High betweenness centrality (0.133) - this node is a cross-community bridge._
- **What connects `@types/node`, `typescript`, `DEBUG` to the rest of the system?**
  _7 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `bootDiagnostics.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07787698412698413 - nodes in this community are weakly interconnected._
- **Why does `audioService` connect `audioService` to `bootDiagnostics.ts`, `Settings.tsx`?**
  _High betweenness centrality (0.047) - this node is a cross-community bridge._
- **Should `data.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07769423558897243 - nodes in this community are weakly interconnected._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._
- **Should `Projekt-Design-Report (PDR)` be split into smaller, more focused modules?**
  _Cohesion score 0.043478260869565216 - nodes in this community are weakly interconnected._