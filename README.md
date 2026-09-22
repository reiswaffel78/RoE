# Roots of the Earth · Wurzeln der Erde

Ein meditatives Idle-Spiel über Balance zwischen **Erde** und **Traum**. Pflege einen lebendigen Garten, halte ihn im Gleichgewicht, vollziehe Rituale, begegne Naturwesen und beginne neue Zyklen mit dem Wissen der Ahnen.

- **Grafik:** flache, atmosphärische Illustration, vollständig prozedural (kein einziges Bild-Asset). Jede der 6 Zonen hat eine eigene, gedeckte Farbwelt für Tag und Nacht, mehrere Silhouetten-Ebenen mit Dunstperspektive, dunkle Rahmen-Silhouetten im Vordergrund und ein eigenes Motiv (See mit Menhiren, Tafelberge und Felsbogen, Wasserfall, Schneegipfel mit Schrein, Steinkreis mit Leuchtrune, schwebende Inseln). Dazu kommen ein Shader-Himmel mit großer Sonnen- bzw. Mondscheibe, Sternen, Wolkenbändern und Polarlicht sowie Papierkörnung und ruhige Partikel.
- **Audio:** meditative WebAudio-Klangwelt ohne Audiodateien: atmender Grundton in der Tonart der Zone, Klangschalen mit den unharmonischen Obertönen und der Schwebung echter tibetischer Schalen, Wind, Wasser bzw. Wasserfall, Regen, Grillen und Vögel. Feedback ist bewusst leise: Wassertropfen beim Sammeln, kleine Klangschalen bei Käufen, Windspiele bei Errungenschaften.
- **UI/UX:** Glass-UI, Pflanzen-Schilder beim Überfahren in der Szene, Desktop-Seitenpanel oder Mobile-Bottom-Sheet, Tooltips mit Zahlen, Kaufmengen (×1/×10/×25/Max) mit Fortschrittsanzeige und Restzeit, Toasts, Tutorial, Tastenkürzel, reduzierte Bewegung, Deutsch und Englisch.
- **PWA:** offlinefähig (Workbox), Offline-Fortschritt, Export und Import des Spielstands.

## Schnellstart

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # Unit-, Simulations- und Pacing-Tests (Vitest)
npm run build      # Typecheck + Produktions-Build nach dist/
npm run preview    # Build lokal testen (inkl. Service Worker)
```

Nützliche URL-Parameter: `?dev` öffnet das Entwicklermenü (alternativ `Strg` + `` ` ``), `?noSW` überspringt den Service Worker.

## Spielsysteme und Mathematik

Alle Formeln stehen in `src/core/economy.ts`, alle Stellschrauben in `src/core/constants.ts` und `src/core/content/*`.

| System | Formel / Regel |
| --- | --- |
| Pflanzenertrag | `cps_p = base_p · level_p · 2^Meilensteine · M_upgrades · M_essenz · M_zone · M_wetter · M_tageszeit · Neigung` |
| Harmonie (Glocke) | `h(b) = exp(-((b − 50) / σ)²)`, σ = 18 (Upgrades verbreitern) |
| Balance-Multiplikator | `M_balance = 0,55 + 0,55 · h` (55 % bis 110 %) |
| Balance-Drift | `db/dt = (Ziel − b) · k`; Ziel = Traum-Anteil der Rohproduktion ± Tag/Nacht. Exakt gelöst: `b(t) = Ziel + (b₀ − Ziel) · e^(−k·t)` |
| Harmonie-Gewinn | `h² · 0,04 · (1 + log₁₀(1 + cps)) · M_zone · M_wetter · Buffs` |
| Kosten (Bulk) | `Σ = base · rᴸ · (rⁿ − 1)/(r − 1)`; Max-Kauf: `n = ⌊log_r(Budget·(r−1)/(base·rᴸ) + 1)⌋` |
| Ahnenwissen | `⌊√(Zyklus-Chi / 10¹⁰) · (1 + √Zyklus-Harmonie / 20)⌋`, jeder Punkt +2 % dauerhaft |
| Offline | 8 h Cap, 50 % Effizienz (per Upgrades und Perks bis 36 h und 100 %) |

Die alte Formel `1,5 − b/200` belohnte Extreme. Die neue Glockenkurve belohnt echte Balance, und ein einseitiger Garten driftet messbar aus dem Einklang (siehe Tests).

**Inhalte:** 9 Pflanzen (Erde, Traum, Gleichklang), 6 Zonen (Stiller Hain, Wüste, Regenwald, Gebirge, Polarlichtfelder, Traumwelt) mit eigener Landschaft, Klangwelt und Wettertabelle, 4 Wetterlagen, Tag/Nacht-Zyklus (10 min), 7 Rituale mit Cooldowns, 51 Upgrades, 7 Naturwesen-Begegnungen mit Wahlmöglichkeiten, 29 Errungenschaften (je +1 %), 9 Ahnen-Pfade, Prestige-Zyklen.

**Pacing** (Headless-Bot, `tests/pacing.test.ts`): zweite Pflanze nach etwa 1 min, erste neue Zone nach 10 bis 15 min, erster Zyklus nach 70 bis 85 min. Ein reiner Idle-Spieler ist nur rund 20 % langsamer als ein aktiver.

## Architektur

```
src/
├─ core/            Reine, deterministische Simulation (kein DOM, keine Seiteneffekte)
│  ├─ content/      Pflanzen, Zonen, Wetter, Rituale, Upgrades, Events, Achievements, Perks
│  ├─ economy.ts    Raten, Multiplikatoren, Kosten
│  ├─ simulation.ts Fixed-Step-Simulation (1 s online, 5 s offline), Wetter, Events, Achievements
│  ├─ actions.ts    Spieleraktionen als pure Reducer
│  ├─ state.ts      Initialzustand, Validierung, Migration alter Spielstände (v1 → v2)
│  └─ rng.ts        Serialisierbarer Mulberry32-RNG (deterministische Offline-Simulation)
├─ store/           Zustand-Store, Persistenz (Autosave + beim Verlassen), fx-Event-Bus, Einstellungen
├─ render/scene/    PixiJS-v8-Szene: Himmel-Shader, Landschaft, Flora, Partikel, Paletten
├─ audio/           Prozedurale WebAudio-Engine
├─ ui/              React-UI: HUD, Panels, Overlays, Komponenten
├─ i18n/            Deutsch und Englisch (gebündelt, offlinefähig)
└─ styles/          Design-System (CSS-Tokens, Glass-Komponenten, responsive Layouts)
```

Der Spielzustand enthält ausschließlich serialisierbare Daten (IDs statt Funktionen). Inhalte mit Logik liegen in `content/` und werden über IDs referenziert. Die UI liest schmale Store-Slices; Renderer und Audio lesen den Store pro Frame bzw. über den `fx`-Bus, ohne React-Re-Renders.

## Qualitätsstufen

In den Einstellungen wählbar (Standard nach Gerätestärke): **Niedrig** (Auflösung 1×, wenige Partikel, kein Film-Grain), **Mittel** (1,5×), **Hoch** (2×, mehr Partikel). „Bewegung reduzieren“ folgt automatisch der Systemeinstellung.

## Geisterstimme (optional)

Standardmäßig flüstert der Gartengeist lokale, kontextabhängige Texte. Mit einem eigenen Gemini-API-Schlüssel (Einstellungen) formuliert er frei. Der Schlüssel bleibt im Browser; im Build ist **kein** Schlüssel enthalten.

## Entwicklungswerkzeuge

- `scripts/icons.mjs` rendert `public/icons/icon.svg` zu PNG (benötigt Playwright).
- `scripts/shot.mjs <url> <out.png>` erstellt Screenshots für visuelle Kontrollen.

Das ursprüngliche Design-Dokument liegt in `PDR-Roots_of_Earth.md`.
