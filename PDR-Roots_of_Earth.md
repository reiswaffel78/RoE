# Projekt-Design-Report (PDR)

## 1) Projekttitel & Vision

**Roots of the Earth** ist ein meditatives Idle-/Clicker-Spiel über Tiefenökologie und die spirituelle Wiederverbindung mit der Natur. Statt Währung sammelst du **Lebenskraft (Chi)**. Dein Ziel ist **Balance**: Pflege Pflanzen, vollziehe Rituale, knüpfe Bündnisse mit Naturgeistern und wähle bewusst, wann du nimmst und wann du gibst. Je harmonischer du spielst, desto „tiefer atmet“ der Wald: neue Pflanzen, Tiere und Geister erscheinen.

**Kernwerte**: Achtsamkeit, Nachhaltigkeit, Respekt gegenüber indigenem Wissen, langsame, sinnvolle Progression.

**Plattformen**: Web (Desktop & Mobile, PWA), später optional Desktop (Electron) und Mobile Stores.

---

## 2) Zielgruppe

* Spieler:innen von Idle-/Inkrementellen Spielen mit Fokus auf Atmosphäre
* Fans von Natur-/Ambient-Ästhetik, Minimal UI, sanften Soundscapes
* Altersfreigabe: ab 7+, keine Gewalt, keine Glücksspielmechaniken

---

## 3) Core Loop (hochverdichtet)

1. **Pflegen**: Pflanzen wässern/segnen → stetige Chi-Produktion.
2. **Ritualisieren**: Rituale verstärken Output temporär oder öffnen Ebenen.
3. **Aufwerten**: Altare, Meditationskreise, Trommeln und Pflanzenbündnisse kaufen/verbessern.
4. **Wechseln**: Zwischen **Materieller Welt**, **Traumwelt**, **Ahnenebene** wechseln, um neue Inhalte freizuschalten.
5. **Balancieren**: Zu viel Ernte schwächt den Wald → Balance-Meter sinkt → Erträge drosseln → Heilrituale/Schonzeiten.

---

## 4) Key Features

* **Idle-Erträge**: Pflanzen erzeugen Chi abhängig von Pflege, Wetter, Ritual-Buffs.
* **Nachhaltigkeitssystem**: Balance-Meter koppelt Erträgen Feedback-Loops (Übernutzung senkt Effizienz, Regeneration belohnt Zurückhaltung).
* **Spirituelle Zonen**: Regenwald, Wüste, Gebirge, Polarlicht – jede Zone mit eigenen Energien, Flora, Fauna, Geistern und Ereignissen.
* **Bewusstseinsebenen**: Materiell (Ressourcenaufbau), Traum (Synergien/Combos), Ahnen (Meta-Buffs, Segen, Story-Events).
* **Gemini-gestützte Ereignisse (optional)**: Naturgeist-Dialoge, Omen, Lore-Texte werden dynamisch generiert.
* **Ambient-Audio & visuelles Feedback**: Wetter, Tageszeiten, Partikel, leichte Parallaxen.

---

## 5) Spielerziele & Progression

* **Kurzfristig**: Erste Pflanzen freischalten, kleine Rituale, Balance halten.
* **Mittelfristig**: Zonen öffnen, Bündnisse schließen (z. B. Salbei, Tabak, Ayahuasca), Altare/Meditationskreise synergistisch kombinieren.
* **Langfristig**: Ahnensegen & dauerhafte Meta-Upgrades, Jahreszeiten-Zyklen, Prestige („Neuer Zyklus“) mit Wissenstransfer.

**Pacing**: Sanft ansteigende Kostenkurven (exponentiell mit weichen Caps), zyklische Events, Ruhephasen als Design-Feature (Achtsamkeit statt Grind).

---

## 6) Ökonomie & Ressourcen

* **Primärressource**: **Chi** (Lebenskraft). Erzeugt durch Pflanzen & Rituale.
* **Sekundär**: **Harmonie** (langsam wachsender, schwer zu gewinnender Wert, beeinflusst Multiplikatoren), **Segen** (zeitlich begrenzte Buffs).
* **Balance-Meter** *(0–100)*: Steuert globalen Effizienz-Multiplikator **M_balance**. Übernutzung → sinkt; Schonung/Heilung → steigt.

**Ressourcen-Sinks**: Altare/Upgrades, Rituale, Zonenfreischaltungen, Heilungsaktionen, Forschung in der Ahnenebene.

---

## 7) Systeme im Detail

### 7.1 Idle-Erträge

* **Basisertrag** pro Pflanze *p*:
  [ chi_p = base_p \times (1 + care_p) \times M_{weather} \times M_{zone} \times M_{balance} \times M_{rituals} \times M_{synergy} ]
* **Takt**: 1 s Tick (simuliert), UI-Aktualisierung 10×/s gedrosselt.
* **Offline-Gewinn**: Kappt nach z. B. 8–12 h; reduzierter Multiplikator, um Balance-Gedanken zu fördern.

### 7.2 Upgrades & Bündnisse

* **Strukturen**: Meditationskreise (passive Multiplikatoren), Altare (Schlüssel für Ebenen/Geister), Trommeln (Burst-Buffs, aktive Klicker-Verstärkung).
* **Pflanzenbündnisse**: Freischalten spezieller Synergien (z. B. Salbei + Wacholder = Reinigungs-Combo → erhöht Regeneration des Balance-Meters in Ruhephasen).
* **Kostenkurve**: Exponentiell mit Soft-Caps; *k_{n} = k_0 · r^{n}*.

### 7.3 Zonen

* **Regenwald, Wüste, Gebirge, Polarlicht** – jeweils mit eigenem **M_zone**, Wettertabellen, Pflanzenlisten, Geistern, Ereignissen.
* **Freischaltung**: via Altare + Chi + Harmonie-Schwellen.
* **Zonen-Tooltips**: Anzeigen von Energien (feucht, arid, hoch, magnetisch) & empfohlene Pflanzen.

### 7.4 Bewusstseinsebenen

* **Materiell**: Ressourcenaufbau, Pflege.
* **Traumwelt**: Kombos, seltene Rituale, temporäre Portale, Treffen mit Geistern.
* **Ahnenebene**: Meta-Forschung, dauerhafte Segen (Account-weit), Story-Beat-Ereignisse.

### 7.5 Nachhaltigkeit & Balance

* **M_balance** als Funktion von **Entnahme / Regeneration**:

  * Tagesfenster berechnet **Entnahmequote q**. Wenn **q > 1**, Balance sinkt proportional; **q < 1** steigert.
  * **Puffer**: Schonzeiten (z. B. Mondnächte) regenerieren schneller.
* **Negative Feedback-Loops**: Sinkende Balance drosselt Erträge, erhöht Ritualkosten → natürlicher „Slow-Down“ statt harten Gates.
* **Heilrituale**: Kosten Chi/Harmonie, heben Balance in Schritten an, haben Cooldown.

### 7.6 Wetter, Tages-/Mondzyklen

* **Wetterstates**: Klar, Regen, Sturm, Nebel, Aurora; je Zone andere Häufigkeiten.
* **Zyklen**: Tageszeit (Hell/Dämmerung/Nacht), Mondphasen (8 Phasen) beeinflussen Rituale & Spawn-Chancen von Geistern.

### 7.7 Ereignisse & Quests

* **Mini-Events**: „Wald flüstert“, „Tierbegegnung“ – wähle Achtsamkeit vs. Nutzen.
* **Questlinien**: „Heile die Quelle“, „Finde den Ahnenbaum“ – liefern Segen/Story.
* **Konsequenzsystem**: Entscheidungen wirken auf Balance und Geisterbeziehungen.

### 7.8 Achievements & Prestige

* **Achievements**: „Erste Reinigung“, „Balance-Hüter 7 Tage“, „Aurora-Meister“.
* **Prestige („Neuer Zyklus“)**: Setzt Fortschritt zurück, konvertiert einen Teil von Harmonie in **Ahnenwissen** (permanent +1% auf M_synergy o. Ä.).

---

## 8) UX & UI

* **Layout**:

  * **Top-Bar**: Chi, Harmonie, Balance-Meter, Wetter/Mondphase, Ebenenwechsel.
  * **Tabs**: Pflanzen • Rituale • Zonen • Geister • Journal (Lore/Log) • Upgrades • Ahnen.
  * **Event-Log** mit subtilen Popups.
* **Interaktionen**:

  * Kurze, ruhige Mikroanimationen (CSS/Canvas), Tooltips mit Klartext & Zahlen.
  * Mobile-first: große Touch-Ziele, gedrosselte Effekte.
* **Accessibility**: Skalierbare Fonts, Farbschwäche-Support (alternative Palette), Screenreader-Labels.

---

## 9) Art Direction & Audio

**Stil**: 8–16‑Bit Pixelart, handgedithert, natürliche Paletten (Erde, Moos, Himmel), sanfte Parallaxen.

**Technik**:

* **Rendering**: React DOM für UI + **PixiJS (Canvas/WebGL)** für animierte Hintergrundszenen & Partikel (Blätter, Pollen, Aurora). Alternativ rein CSS für Low‑End.
* **Tilegröße**: 16×16 oder 32×32; Figuren minimalistisch (Totems, Geisterschemen).
* **Animation**: Spritesheets (Aseprite), 6–8 Frames Idle, 10–12 Frames Ritual.
* **Effekte**: additive Partikel für spirituelle Aktionen, dezente Bloom (wenn WebGL aktiv).

**Audio**:

* **Ambient-Loops** pro Zone; Wetter-Cues (Regen, Wind, Trommelpulse bei Ritualen).
* **WebAudio** für generative Drones/Chimes abhängig von Balance/Mondphase.
* Lautstärke-Ducking bei UI-Sounds.

---

## 10) Technische Architektur

**Stack**: React + TypeScript (SPA), Vite, TailwindCSS, Zustand (oder RTK) für State, PixiJS für Canvas, i18next, PWA (Workbox), Vitest/Jest + React Testing Library.

**Architekturprinzipien**:

* **Game-Core entkoppelt von UI**: Reine TypeScript-Simulation (pure functions), UI konsumiert State nur über Store-Selectoren.
* **Event-Bus** (mitt/Emittery) für GameEvents (Tick, WeatherChange, RitualStart/End, ZoneUnlock, BalanceUpdate).
* **Deterministische RNG** per Seed (seedrandom), damit Offline-Berechnung/Nachsim möglich.
* **Takt**: `simulation.tick(dt)` mit 1 s Steps; Accumulator für verspätete Frames.

**Persistenz**: Zustand `persist`-Middleware → localStorage; Export/Import (JSON), optional Cloud-Sync später.

**AI-Integration (optional)**: Gemini API als **Lore-/Dialog-Generator** und **dynamischer Event-Beschreiber**. Spiellogik (Drop-Rates, Erträge) bleibt deterministisch lokal; AI steuert nur Texte/Flavor. Fallback: lokale Vorlagen.

**PWA**: Offline-first Caching der Assets & Daten; Background Sync für Cloud-Import/Export (später).

**Leistungsbudget**: <2 MB initial, <60 FPS Ziel; Pixi-Layer capped; Partikelanzahl adaptiv.

---

## 11) Ordnerstruktur (Vorschlag)

```
root
├─ public/
│  ├─ icons/              # PWA Icons
│  └─ manifest.webmanifest
├─ src/
│  ├─ app/
│  │  ├─ App.tsx
│  │  └─ routes.tsx
│  ├─ core/               # UI‑unabhängiger Game‑Core
│  │  ├─ simulation/
│  │  │  ├─ engine.ts     # tick loop, time accumulator
│  │  │  ├─ rng.ts        # seeded RNG
│  │  │  ├─ balance.ts    # sustainability model
│  │  │  ├─ weather.ts    # cycles & states
│  │  │  ├─ economy.ts    # resource calc
│  │  │  ├─ events.ts     # event system (quests, random)
│  │  │  └─ systems/      # extensible systems (rituals, zones)
│  │  ├─ data/
│  │  │  ├─ plants.json
│  │  │  ├─ zones.json
│  │  │  ├─ rituals.json
│  │  │  ├─ spirits.json
│  │  │  └─ achievements.json
│  │  ├─ types/
│  │  │  └─ index.ts      # shared TS types
│  │  └─ index.ts         # public API for UI layer
│  ├─ store/
│  │  ├─ index.ts         # Zustand/RTK config
│  │  ├─ selectors.ts
│  │  └─ slices/          # if RTK used
│  ├─ ui/
│  │  ├─ components/
│  │  │  ├─ TopBar.tsx
│  │  │  ├─ BalanceMeter.tsx
│  │  │  ├─ Tabs.tsx
│  │  │  ├─ PlantList.tsx
│  │  │  ├─ RitualPanel.tsx
│  │  │  ├─ ZoneMap.tsx
│  │  │  ├─ SpiritDialog.tsx
│  │  │  ├─ UpgradeShop.tsx
│  │  │  └─ EventLog.tsx
│  │  ├─ pages/
│  │  │  └─ GameScreen.tsx
│  │  └─ hooks/
│  ├─ render/
│  │  ├─ pixi/
│  │  │  ├─ stage.ts      # Pixi app, layers
│  │  │  └─ particles.ts
│  │  └─ css/
│  │     └─ animations.css
│  ├─ assets/
│  │  ├─ sprites/
│  │  ├─ tilesets/
│  │  ├─ audio/
│  │  └─ fonts/
│  ├─ services/
│  │  ├─ ai/gemini.ts
│  │  └─ storage.ts
│  ├─ i18n/
│  │  ├─ de.json
│  │  └─ en.json
│  ├─ utils/
│  ├─ styles/
│  │  └─ tailwind.css
│  └─ index.tsx
├─ tests/
│  ├─ core/
│  └─ ui/
└─ vite.config.ts
```

---

## 12) Datenmodell (TypeScript)

```ts
export type Awareness = 'material' | 'dream' | 'ancestral';

export interface Plant {
  id: string;
  nameKey: string;            // i18n key
  zoneIds: string[];          // where it thrives
  baseChi: number;            // per tick
  careBonusMax: number;       // cap from care actions
  synergyTags: string[];      // e.g. 'cleansing', 'grounding'
}

export interface Ritual {
  id: string;
  nameKey: string;
  costChi: number;
  costHarmony?: number;
  durationSec: number;
  effects: Array<{ kind: 'mult'|'add'|'balance'|'weather'|'portal'; target: string; value: number }>;
  cooldownSec: number;
}

export interface Zone {
  id: string;
  nameKey: string;
  energyTags: string[];       // 'humid','arid','highland','aurora'
  weatherWeights: Record<string, number>; // rain, clear, storm...
  zoneMultiplier: number;     // M_zone
}

export interface Spirit {
  id: string;
  nameKey: string;
  affinityTags: string[];     // likes certain plants/rituals
  blessing: { key: string; value: number; };
  relationship: number;       // -100..+100
}

export interface GameState {
  chi: number;
  harmony: number;
  awareness: Awareness;
  balance: number;            // 0..100
  unlocked: { plants: string[]; zones: string[]; rituals: string[]; spirits: string[] };
  inventory: Record<string, number>; // plant instances/charges
  effects: Array<{ id: string; expiresAt: number }>; // active ritual buffs
  weather: { state: string; dayTime: 'day'|'dusk'|'night'; moonPhase: number };
  rngSeed: string;
  stats: { playtimeSec: number; totalChi: number };
}
```

---

## 13) Content-Beispiele (erste 2 Stufen)

**Pflanzen**

* *Salbei* – baseChi 1.2, synergy: cleansing (Balance-Regen +2% bei Inaktivität)
* *Tabak* – baseChi 1.4, synergy: offering (Geister-Beziehungsgewinn +10%)
* *Wacholder* – baseChi 1.0, synergy: grounding (Wettereffekt -10%)

**Rituale**

* *Reinigungsrauch* – Kosten 50 Chi, 60 s: +10% M_balance-Regen, CD 5 min
* *Trommelkreis* – Kosten 120 Chi, 30 s: +25% M_rituals (alle), CD 8 min

**Zonen**

* *Regenwald* – M_zone 1.2, Regen häufig, Spirits: „Flusswächter“, „Kolibri“
* *Wüste* – M_zone 1.1, Klar häufig, Spirits: „Sandweiser“, „Koyote“

---

## 14) Balancing-Framework

* **Kosten**: `cost(n) = base * rate^n`, *rate* je Kategorie unterschiedlich (Pflanzen 1.12–1.18, Strukturen 1.15–1.25).
* **Synergie**: Tag-basierte additive Stacks, Soft-Cap via `M_synergy = 1 + s/(k+s)`.
* **Balance**:

  * Berechne `q = harvest / regen` im Gleitfenster (z. B. 10 min).
  * Update: `balance' = clamp(balance + f(q,weather,moon), 0,100)`.
  * `M_balance = 0.5 + 0.5*(balance/100)` → 50–100% Effizienz.
* **Offline-Erträge**: `chi_offline = clamp(t_offline, 0, Tcap) * chi_per_sec * M_offline`.

---

## 15) Test, Debug & Telemetrie

* **Dev-Menü**: Toggle Balance, Spawn Geister, Wetter erzwingen, Zeit vorspulen, Unlock-All.
* **Unit-Tests**: Ökonomie, Balance-Funktion, RNG-Determinismus, Offline-Berechnung.
* **Playtests**: 5‑Min-Loop, 30‑Min-Session, 24‑h‑Idle.
* **Telemetrie (opt-in)**: anonyme Events (Tutorial-Abbruch, häufige Rituale); DSGVO-konform, keine personenbezogenen Daten.

---

## 16) Lokalisierung & Barrierefreiheit

* i18next, Keys in Content-JSONs, Right-to-Left vorbereitet.
* Barrierefreiheit: Alternativ-Paletten, statische UI-Redundanz für Farbhinweise, Screenreader-Labels für Buttons.

---

## 17) Produktionsplan (MVP → Beta)

**MVP (2–4 Wochen)**

* Core-Simulation (Plants, Ticks, Balance, Wetter), 1 Zone, 4 Pflanzen, 2 Rituale, 1 Geist, Offline-Ertrag, Persistenz.
* Minimal-UI (Top-Bar, Pflanzenliste, Ritualpanel, Event-Log), PWA-Grundlage.

**Alpha (4–8 Wochen)**

* 2 weitere Zonen, Traumwelt-Mechanik, 6 Rituale total, 6–8 Geister, Achievements, Debug-Menü, Audio-Ambient, Pixi-Hintergrund.

**Beta (8–12 Wochen)**

* Ahnenebene, Prestige, Mondphasen-Events, Lore/Journal, i18n, Accessibility-Polish, Balancing-Pass.

---

## 18) Risiken & Gegenmaßnahmen

* **Überkomplexe Systeme** → Iteratives Freischalten, klare Tooltips, geführtes Tutorial.
* **Leistung auf Low-End** → „Effekt-Drosselung“-Schalter, Canvas-Layer deaktivierbar.
* **AI-Abhängigkeit** → AI nur Flavor; Offline-Templates als Fallback.
* **Cultural Sensitivity** → Beratung/Disclaimer, keine Vereinnahmung; Fokus auf universelle Werte (Achtsamkeit, Respekt).

---

## 19) Drittabhängigkeiten & Lizenzen (Beispiele)

* **PixiJS** (MIT), **Zustand** (MIT) oder **Redux Toolkit** (MIT), **i18next** (MIT), **seedrandom** (MIT), **Aseprite** (EULA), optionale **Kenney**‑Assets (CC0) als Platzhalter.

---

## 20) Anhänge

### 20.1 Beispiel-JSON: `plants.json`

```json
[
  {"id":"sage","nameKey":"plant.sage","zoneIds":["rainforest","mountain"],"baseChi":1.2,"careBonusMax":0.25,"synergyTags":["cleansing"]},
  {"id":"tobacco","nameKey":"plant.tobacco","zoneIds":["desert"],"baseChi":1.4,"careBonusMax":0.2,"synergyTags":["offering"]}
]
```

### 20.2 Beispiel-Pseudocode: Tick

```ts
function tick(state: GameState, dtSec: number): GameState {
  const M = computeMultipliers(state); // weather, zone, balance, rituals, synergy
  const chiGain = sumPlants(state, M) * dtSec;
  const next = { ...state, chi: state.chi + chiGain };
  return applyBalanceDynamics(next, dtSec);
}
```

---

## 21) Abschluss

**Roots of the Earth** verbindet die Ruhe eines Idle-Games mit einer sinnstiftenden Ökonomie rund um Achtsamkeit und Balance. Die Technik trennt Simulation und UI für Stabilität, erlaubt PWA‑Offline, und bietet genug Haken für spätere Erweiterungen – ohne Grind oder manipulative Loops. Dieses PDR dient als gemeinsame Referenz für Umsetzung, Tests und Content‑Erweiterungen.

---

## 22) Langzeitprogression & Mehrfach‑Prestige

**Ziel:** 100+ Stunden Spielzeit ohne „Hard Grind“, durch mehrere Meta‑Schichten, horizontale Freischaltungen und zyklische Inhalte.

**Prestige‑Leitern (Schichten):**

* **Zyklus (Prestige I):** Reset der Ressourcen/Pflanzen; Umwandlung eines Teils von **Harmony → Ahnenwissen** (permanenter +% Synergie oder Balance‑Regen). Skalierbarer Soft‑Cap, um Run‑Dauer auf 1–3 h zu kalibrieren.
* **Pilgerfahrt (Prestige II):** Nach X Zyklen freischalten; schaltet **Spezialisierungen** frei (s. Abschnitt 25), erhöht Run‑Varianz; gibt „Ahnentalente“ (passive Knoten, z. B. +Ritualdauer, -Kosten).
* **Weltensaat (Prestige III):** Spätes Endgame; generiert **Weltmodifikatoren** (globaler Seed, +1 zufälliger Zonenmod, -1 Komfort). Dient als New‑Game‑Plus und öffnet neue Sammel- und Set‑Bonussysteme.

**Horizontale Progression:**

* **Zonen‑Meisterschaften:** Jede Zone besitzt 5‑10 „Meisterprüfungen“ (z. B. „Regenwald bei Sturm: halte Balance >80% für 10 min“), die permanente kosmetische und leichte QoL‑Boni gewähren.
* **Geister‑Pfadbindungen:** Pro Geist 3 Pfadlinien (Hüter/Weiser/Trickster) mit exklusiven Blessings (mutual exclusive) → Build‑Diversität über Runs hinweg.

**Run‑Ziele & Meilensteine:** Zeitbasierte Meilensteine (30/60/90 min) aktivieren neue Ereignispools; verhindert frühe Content‑Wiederholung.

---

## 23) Vielfaltssysteme (Emergenz statt Grind)

**Synergie‑Matrix:** Tag‑basierte Kombinationen (cleansing/grounding/offering/aurora/bloom/drought). **Matrix‑Regeln** legen Kombi‑Effekte deklarativ fest (z. B. `cleansing + aurora → -25% Ritual‑CD in Nachtphasen`).

**Ritual‑Crafting:** Rituale besitzen Mod‑Slots (Rune/Resonanz/Fokus). Drop‑Tabelle mit Gewichten je Zone/Wetter. Mods verändern Ziel, Dauer, Kosten oder Nebenwirkung (z. B. +Dauer, aber –M_balance kurzfristig).

**Pflanzen‑Genetik (spät):** Seltene **Varianten** (z. B. Albino‑Salbei) mit leicht verschobenen Basestats/Tags. Zucht miniert Wiederholung, erzeugt Langzeit‑Optimierung, bleibt rein kosmetisch‑leicht leistungserhöhend.

**Ereignis‑Komposition:** Events bestehen aus **Konditionen** (Zone/Wetter/Mond/Balance/Geist‑Laune) + **Micromodifikatoren** (±5% M_weather etc.). Dadurch hohe Varianz bei wenig Content.

---

## 24) Jahreszeiten, Epochen & Rotationen

**Jahreszeiten (30 reale Tage pro Season, optional kürzer):**

* Saisonale **Zonenmodifikatoren** (z. B. „Monsoon“ → Sturm Häufigkeit↑, Regenpflanzen profitieren).
* **Season‑Pfad** mit 20–30 Aufgaben (freundlich, ohne FOMO): reine Cosmetics, Titel, Journaleinträge.
* **Legacy‑Konvertierung:** Saisonale Punkte konvertieren am Ende zu kleinen Account‑weiten Kosmetika/QoL.

**Welt‑Epochen (Endgame‑Rotation):** Alle X Seasons rotiert ein **Epochen‑Mod** (z. B. „Schlafende Riesenwurzeln“ → Traumwelt verstärkt Synergien, Ahnenebene schwächer). Sorgt für Meta‑Shift.

---

## 25) Spezialisierungen & Buildcraft

**Spezialisierungen (Pilgerfahrt freischaltet):**

* **Hüter**: Defensive Balance‑Ökonomie, hohe Regeneration, geringe Peaks.
* **Schamane**: Ritual‑Zentriert, Burst‑Fenster, Cooldown‑Manipulation.
* **Gärtner**: Pflanzen‑Genetik, Synergie‑Dichte, nachhaltige Erträge.

Jede Spezialisierung hat einen **Talentschrein** (10–15 Knoten, flache Boni), exklusive Rituale und eine exklusive Meisterprüfung. Respec via seltenem Item „Traumsamen“.

---

## 26) Herausforderungen & Spielmodi

**Wöchentliche Pfade:** Drei **Mutatoren** rollen wöchentlich (z. B. „Dauer‑Dämmerung“, „Sturmintensität +50%“, „Ritualkosten +20%“). Ziel: Punkte‑Run (Leaderboard optional lokal/offline), Belohnung: Cosmetics/Journal‑Einträge.

**Traumexpedition (Rogue‑Light‑Modus):** 20–30 min kompakte Runs in der Traumwelt mit Draft‑Ritualen und Zufallskarten („Knoten“). Belohnungen: Run‑gebundene Essenzen, die in die Hauptwelt als **einmalige Segen** übertragbar sind.

**Schutzaufträge (Aufgabenketten):** Tägliche/zweitägige Auftragsreihen mit 2–3 Schritten (Zone→Ritual→Balanceziel). Kein hartes Daily‑Login, Aufgaben stapeln sich bis N=3.

---

## 27) Sammelmetas & Compendium

**Herbarium & Bestiarium:** Komplettierbare Einträge (Fundort, Wetter, Top‑Synergien, „Lehre des Geistes“). **Set‑Bonusse:** Abschließen thematischer Sets gewährt kosmetische Auren oder +kleine QoL‑Perks.

**Relikte & Totems:** Seltene, langlebige Items mit 1–2 affixen, die **Build‑Weichen** stellen (z. B. „Totem der stillen Nacht“ → Nacht‑Erträge↑, Tag↓). Erhalt über Meisterprüfungen/Traumexpedition.

---

## 28) Content‑Pipeline & Datenarchitektur (für lange Laufzeit)

* **Datengesteuert**: Content als JSON/TS‑Objekte (Pflanzen/Zonen/Rituale/Events/Synergien), Versionierung + Migration.
* **Event‑DSL**: Kleine deklarative Sprache: `when { zone:"desert" & weather:"storm" } then { addMod:"ritual_cd:-10%" for:120s }` → lädt zur Authoring‑Schnelligkeit.
* **Weights & Buckets**: Standardisierte Gewichtungstabellen, getrennt nach Early/Mid/Late.
* **Seed‑Konfiguration**: Saison‑Seed, Wochen‑Seed; deterministische Rotation ohne Server.

---

## 29) Anti‑Grind‑Design & Catch‑Up

* **Dynamische Softcaps**: Multiplikatoren nähern sich asymptotisch (keine harten Wände).
* **Ermüdungs‑Regler**: Wiederholte identische Aktion senkt marginalen Nutzen, alternative Pfade werden attraktiver.
* **Catch‑Up**: Rückkehrbooster nach längerer Pause (Harmony‑Startbonus), Offline‑Cap großzügig aber nicht ausbeutbar.

---

## 30) Balancing & Simulationen (Langzeit)

* **Szenarien‑Sim**: Headless‑Sim mit Seeds, die 7/14/30‑Tage‑Verläufe rechnen (CSV‑Export). KPI: mediane Balance, Stalls, durchschnittliche Run‑Dauer.
* **Zielkorridore**: Early <45 min erste Zone; Mid 3–5 h erste Pilgerfahrt; Endgame 20–40 h bis Weltensaat.
* **Tuning‑Hebel**: globale Drop‑Scaler, Mutator‑Gewichte, Synergie‑k, Ritual‑CD‑Baselines.

---

## 31) Audio/Visuelle Langzeit‑Varianz

* **Procedurale Ambients**: Zufalls‑Layer (Wind/Glockenspiel) mit Seed pro Season/Zone.
* **Cosmetics**: Auren/Spuren/Partikel‑Colourways als langfristige Ziele; niemals Pay‑Gate.
* **Parallax‑Themes**: Pro Season 1 neues Layer‑Theme (Low‑Cost hoher Effekt).

---

## 32) KPI & Telemetrie (Opt‑in, DSGVO)

* **Engagement‑Marker**: Zeit bis 1. Ritual, 1. Zone, 1. Prestige, Abbruchpunkte je Panel.
* **Varianz‑Marker**: Anzahl unterschiedlicher Rituale pro Run, genutzte Tags/Synergien, Wiederholung identischer Builds.
* **Qualitätsmarker**: Balance‑Buckets über Zeit; Prozent Runs mit Stalls >10 min.

---

## 33) Roadmap – Content‑Kadenz (12 Monate)

* **Monat 1–2**: 2 Zonen, 10 Pflanzen, 8 Rituale, Traumexpedition Beta, 1 Spezialisierung.
* **Monat 3–4**: Jahreszeiten‑System, 1 neue Zone, 5 Events, 1 Spezialisierung, Relikte.
* **Monat 5–6**: Pilgerfahrt (Prestige II), Herbarium‑Sets, Weekly‑Mutatoren.
* **Monat 7–9**: Weltensaat (Prestige III), Epochen‑Mod, 2 Zonen, Genetik‑Varianten.
* **Monat 10–12**: Content‑Polish, neue Synergie‑Matrix‑Kombis, Compendium‑Erweiterungen, QoL‑Rounds.

---

## 34) Qualitätsbarrieren (Go/No‑Go für Releases)

* **Stabilität**: Kein Black‑Screen, ErrorBoundary fängt alles; SW‑Bypass funktioniert.
* **Performance**: 60 FPS Ziel; Low‑Spec Mode <30% CPU.
* **Varianz**: 10+ spielbare Builds in Midgame; Weekly‑Mutatoren erzeugen spürbar neue Entscheidungen.
* **Fairness**: Keine harten Gates; stets mindestens 2 sinnvolle Fortschrittsoptionen.

