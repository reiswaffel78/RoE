
# Roots of the Earth - Projektdokumentation

Dieses Dokument dient als zentrale Anlaufstelle für das Entwicklerteam, um die Architektur, die Funktionalität und die technischen Details des Spiels "Roots of the Earth" zu verstehen.

## Inhaltsverzeichnis
1. [Projektbeschreibung](#1-projektbeschreibung)
2. [Hauptfunktionen](#2-hauptfunktionen)
3. [Ordner- und Dateistruktur](#3-ordner--und-dateistruktur)
4. [Code-Struktur und Architektur](#4-code-struktur-und-architektur)
5. [Technische Details](#5-technische-details)
6. [Verwendete Technologien](#6-verwendete-technologien)
7. [System-Interaktionen und Datenflüsse](#7-system-interaktionen-und-datenflüsse)

---

### 1. Projektbeschreibung

"Roots of the Earth" ist ein meditatives Idle-/Clicker-Spiel, das sich um die Themen Tiefenökologie und die spirituelle Wiederverbindung mit der Natur dreht. Anstelle einer traditionellen Währung sammeln die Spieler Lebenskraft (Chi). Das Hauptziel des Spiels ist es, eine "Balance" zwischen der physischen und der ätherischen Welt zu finden und zu halten. Dies wird durch das Pflegen von Pflanzen, das Durchführen von Ritualen und die Interaktion mit der Spielwelt erreicht.

### 2. Hauptfunktionen

- **Idle-Gameplay:** Pflanzen generieren automatisch Chi, auch wenn das Spiel im Hintergrund läuft.
- **Pflanzen-System:** Spieler können verschiedene Pflanzenarten kaufen und aufleveln. Jede Pflanze gehört entweder dem 'physischen' oder 'ätherischen' Typ an, was ihre Effektivität im Balance-System beeinflusst.
- **Balance-System:** Ein Kernmechanismus, der den Zustand des Gartens zwischen 0% (rein physisch) und 100% (rein ätherisch) misst. Die Balance beeinflusst die Produktionsraten der jeweiligen Pflanzentypen.
- **Rituale:** Aktionen, die Chi kosten und es dem Spieler ermöglichen, die Balance aktiv zu steuern.
- **Zonen:** Verschiedene Gebiete, die freigeschaltet werden können und passive Boni oder Mali auf bestimmte Spielmechaniken geben (z.B. eine Zone, die physisches Wachstum begünstigt).
- **Zufällige Events:** Pop-up-Events, die den Spieler vor Entscheidungen mit unterschiedlichen Konsequenzen stellen.
- **Achievements:** Meilensteine, die den Fortschritt des Spielers belohnen.
- **Prestige-System:** Ermöglicht es Spielern, ihren Fortschritt zurückzusetzen, um permanente Boni ("Prestige-Punkte") zu erhalten, die zukünftige Spieldurchläufe beschleunigen.
- **KI-Integration (Google Gemini):** Der "Geist des Gartens" gibt dem Spieler dynamisch generierte, kryptische Ratschläge und Kommentare zum Zustand des Gartens.
- **Offline-Fortschritt:** Das Spiel berechnet den Chi-Gewinn, während der Spieler abwesend war, und präsentiert ihn beim nächsten Start.
- **Visuelle Effekte:** Eine subtile, animierte Hintergrundszene, die mit PixiJS realisiert wurde, um eine meditative Atmosphäre zu schaffen.
- **Einstellungen & Datenmanagement:** Spieler können ihren Spielstand exportieren, importieren und zurücksetzen.
- **Entwicklermenü:** Ein verstecktes Menü (per `Strg` + `` ` ``), um das Debugging zu erleichtern (z.B. durch Hinzufügen von Chi).

### 3. Ordner- und Dateistruktur

Die Projektstruktur ist modular aufgebaut, um eine klare Trennung der Verantwortlichkeiten zu gewährleisten.

```
/
├── components/         # Wiederverwendbare React-UI-Komponenten
├── core/               # Kern-Spiellogik, frei von UI-Code
│   ├── balanceSystem.ts
│   ├── data.ts         # Initiale Spieldaten (Pflanzen, Rituale etc.)
│   └── gameLogic.ts    # Die zentrale "tick"-Funktion der Spielsimulation
├── hooks/              # Benutzerdefinierte React-Hooks (z.B. für Game-Loop, Audio)
├── i18n/               # Internationalisierung (i18n)
│   ├── locales/
│   └── setup.ts
├── render/             # Rendering-Logik für PixiJS
├── services/           # Externe Dienste (AI, Audio, LocalStorage, Logging)
├── store/              # Globaler State-Manager (Zustand)
│   └── gameStore.ts
├── tests/              # Unit- und Integrationstests (Vitest)
│   ├── core/
│   └── store/
├── utils/              # Hilfsfunktionen (Formatierung, Feature-Flags, Boot-Diagnose)
├── index.html          # HTML-Einstiegspunkt
├── index.tsx           # React-Anwendungseinstiegspunkt
├── App.tsx             # Haupt-App-Komponente
├── sw.js               # Service Worker für Caching
├── types.ts            # Globale TypeScript-Typdefinitionen
└── README.md           # Diese Datei
```

### 4. Code-Struktur und Architektur

#### State Management (Zustand)
Das Herz der Anwendung ist der `gameStore` in `store/gameStore.ts`. Er verwendet **Zustand** für ein zentralisiertes, leichtgewichtiges State Management.

- **`GameState`:** Definiert die gesamte Datenstruktur des Spiels (Chi, Pflanzen, Balance, etc.).
- **`GameActions`:** Definiert alle Aktionen, die den State verändern können (`levelUpPlant`, `performRitual`, `tick`).
- **Persistenz:** Die `persist`-Middleware von Zustand wird verwendet, um den `GameState` automatisch im `localStorage` zu speichern und beim Neuladen der Seite wiederherzustellen (Rehydration).
- **Offline-Berechnung:** Während der Rehydration wird die Zeit seit dem letzten Speichern berechnet und die `tick`-Funktion ausgeführt, um den Offline-Fortschritt zu simulieren.

#### Game Loop
Der Haupt-Game-Loop wird durch den `useGameLoop`-Hook (`hooks/useGameLoop.ts`) gesteuert.
- Er ruft in einem festen Intervall (1 Sekunde) die `tick`-Aktion aus dem `gameStore` auf.
- Diese Aktion triggert die zentrale Simulationsfunktion in `core/gameLogic.ts`. Diese Funktion ist **zustandslos (pure)**: Sie erhält den aktuellen State und eine Zeitdifferenz und gibt einen neuen, aktualisierten State zurück. Dies erleichtert das Testen und die Nachvollziehbarkeit.

#### UI (React)
- Die Benutzeroberfläche ist vollständig in React mit funktionalen Komponenten und Hooks implementiert.
- Komponenten beziehen ihre Daten direkt aus dem `useGameStore`.
- Benutzerinteraktionen (z.B. Klick auf einen Button) rufen die entsprechenden Funktionen aus `gameStore.actions` auf, um den Spielzustand zu aktualisieren. React rendert daraufhin die betroffenen Komponenten neu.

### 5. Technische Details

- **Build-Tool:** **Vite** wird für ein schnelles Development-Setup, Hot-Module-Replacement und eine optimierte Build-Erstellung verwendet.
- **Grafik-Engine:** **PixiJS** wird für das Rendering der Hintergrundpartikeleffekte eingesetzt. Dies entlastet das DOM und sorgt für eine flüssige Animation. Die Pixi-Anwendung läuft auf einem separaten `<canvas>`-Element hinter der UI-Ebene.
- **KI-Integration:** Die **Google Gemini API** (`@google/genai`) wird über `services/ai/gemini.ts` angesprochen. Sie generiert kurze, thematische Texte, die als "Flüstern des Geistes" im Spiel erscheinen und auf den aktuellen Spielzustand reagieren.
- **Audio:** **Howler.js** wird in `services/audio.ts` verwendet, um Hintergrundmusik und Soundeffekte zuverlässig zu verwalten.
- **Offline-Fähigkeit:** Ein **Service Worker** (`sw.js`) mit **Workbox** wird eingesetzt, um wichtige Assets (wie JS, CSS, Audio) zu cachen. Dies ermöglicht schnellere Ladezeiten und eine eingeschränkte Offline-Spielbarkeit.
- **Boot-Diagnostik:** Ein benutzerdefiniertes System in `utils/bootDiagnostics.ts` verfolgt die Startschritte der Anwendung (DOM ready, Store init, Pixi init etc.) und zeigt den Status in einem Overlay an. Dies ist entscheidend für die Fehlersuche.
- **Feature-Flags:** `utils/flags.ts` implementiert ein System, um Features über URL-Parameter (`?safe=1`, `?noPixi=1`) oder `localStorage` zu deaktivieren. Dies ist nützlich für das Debugging, Performance-Tests und die Bereitstellung eines "Safe Mode".

### 6. Verwendete Technologien

- **Sprachen:** TypeScript, HTML5, CSS3
- **Frameworks/Bibliotheken:**
  - **UI:** React 19
  - **State Management:** Zustand
  - **Build-Tool:** Vite
  - **2D-Grafik:** PixiJS
  - **Audio:** Howler.js
  - **KI:** Google Gemini API (`@google/genai`)
  - **Testing:** Vitest
  - **i18n:** i18next
  - **Offline Caching:** Workbox

### 7. System-Interaktionen und Datenflüsse

Um das Zusammenspiel der Systeme zu verdeutlichen, hier zwei typische Abläufe:

#### Ablauf 1: Spieler levelt eine Pflanze auf

1.  **UI (`components/PlantPanel.tsx`):** Der Spieler klickt auf den "Lvl Up"-Button für eine Pflanze.
2.  **Aktion:** Die `onClick`-Funktion ruft `actions.levelUpPlant('p1')` aus dem `useGameStore` auf.
3.  **Store (`store/gameStore.ts`):**
    - Die `levelUpPlant`-Funktion wird ausgeführt.
    - Sie prüft, ob genügend Chi vorhanden ist.
    - Sie berechnet die Kosten (`core/gameLogic.ts::calculatePlantCost`).
    - Sie aktualisiert den State: `chi` wird reduziert, das `level` der Pflanze in `state.plants` wird erhöht.
4.  **Re-Render:** Zustand benachrichtigt alle abonnierten Komponenten. React rendert die `TopBar` (um das neue Chi anzuzeigen) und die `PlantPanel` (um das neue Level und die neuen Kosten anzuzeigen) neu.

#### Ablauf 2: Ein Spiel-Tick (Chi-Generierung)

1.  **Hook (`hooks/useGameLoop.ts`):** Der `setInterval` des Hooks wird ausgelöst.
2.  **Aktion:** Er ruft `actions.tick(deltaTime)` aus dem `useGameStore` auf.
3.  **Store (`store/gameStore.ts`):** Die `tick`-Aktion leitet den Aufruf an die zentrale Spiellogik weiter: `core/gameLogic.ts::tick(currentState, deltaTime)`.
4.  **Core-Logik (`core/gameLogic.ts`):**
    - Die `tick`-Funktion berechnet die gesamte Chi-Produktion pro Sekunde (CPS).
    - Sie holt sich Modifikatoren aus dem `balanceSystem` und `environmentalSystem`.
    - Sie multipliziert die CPS mit der `deltaTime` und addiert das Ergebnis zum `chi` und `totalChi`.
    - Sie prüft, ob Achievements freigeschaltet oder Events ausgelöst werden.
    - Sie gibt den **neuen, vollständigen State** an den Store zurück.
5.  **Store-Update:** Der Store überschreibt seinen Zustand mit dem neuen State-Objekt.
6.  **Re-Render:** React aktualisiert alle Komponenten, die von den geänderten Werten (z.B. `chi`) abhängen.
