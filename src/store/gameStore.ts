// Zustand store wrapping the pure core. Components select narrow slices;
// presentation side effects go through the `fx` bus.

import { create } from 'zustand';
import {
    OFFLINE_MIN_SECONDS,
    advance,
    advanceTutorial,
    buyPerk,
    buyPlant,
    buyUpgrade,
    computeRates,
    createInitialState,
    gather,
    offlineLimits,
    performRitual,
    resolveEvent,
    startNewCycle,
    travel,
    unlockZone,
    type ActionResult,
    type BuyAmount,
    type GameState,
    type OfflineReport,
    type PlantId,
    type Rates,
    type RitualId,
    type ZoneId,
} from '../core';
import { fx, type FxEvent } from './fx';
import { clearSave, loadGame, saveGame } from './persistence';

/** Deltas longer than this (tab suspended, device asleep) count as offline time. */
const ONLINE_GAP_LIMIT = 120;

export interface GameStore {
    game: GameState;
    rates: Rates;
    hydrated: boolean;
    /** performance.now() of the last simulation step, for smooth counters */
    tickedAt: number;
    offlineReport: OfflineReport | null;
    actions: {
        hydrate: () => void;
        tick: () => void;
        gather: (x: number, y: number) => void;
        buyPlant: (id: PlantId, amount: BuyAmount) => boolean;
        buyUpgrade: (id: string) => boolean;
        performRitual: (id: RitualId) => boolean;
        unlockZone: (id: ZoneId) => boolean;
        travel: (id: ZoneId) => boolean;
        resolveEvent: (choice: string) => boolean;
        startNewCycle: () => boolean;
        buyPerk: (id: string) => boolean;
        advanceTutorial: (to: number) => void;
        dismissOffline: () => void;
        importGame: (state: GameState) => void;
        resetGame: () => void;
        save: () => void;
        // dev helpers
        devAddChi: (amount: number) => void;
        devAddHarmony: (amount: number) => void;
        devWarp: (seconds: number) => void;
        devSetBalance: (value: number) => void;
    };
}

const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

const initial = createInitialState();

let saveTimer: ReturnType<typeof setTimeout> | null = null;

export const useGameStore = create<GameStore>()((set, get) => {
    const commit = (game: GameState) => set({ game, rates: computeRates(game), tickedAt: now() });

    /** Player actions are saved shortly after they happen (debounced). */
    const scheduleSave = () => {
        if (saveTimer) clearTimeout(saveTimer);
        saveTimer = setTimeout(() => {
            saveTimer = null;
            get().actions.save();
        }, 1500);
    };

    const runAction = (result: ActionResult, success?: FxEvent): boolean => {
        if (!result.ok) {
            if (result.reason) fx.emit({ type: 'denied', reason: result.reason });
            return false;
        }
        commit(result.state);
        scheduleSave();
        if (success) fx.emit(success);
        for (const signal of result.signals) fx.emit({ type: 'signal', signal });
        return true;
    };

    const catchUp = (game: GameState, seconds: number): { game: GameState; report: OfflineReport | null } => {
        const limits = offlineLimits(game);
        const capped = Math.min(seconds, limits.cap);
        const result = advance(game, capped, { offline: true, efficiency: limits.efficiency });
        for (const signal of result.signals) fx.emit({ type: 'signal', signal });
        const report =
            capped >= OFFLINE_MIN_SECONDS && result.chiGained > 0
                ? {
                      seconds: capped,
                      chi: result.chiGained,
                      harmony: result.harmonyGained,
                      efficiency: limits.efficiency,
                  }
                : null;
        return { game: result.state, report };
    };

    return {
        game: initial,
        rates: computeRates(initial),
        hydrated: false,
        tickedAt: now(),
        offlineReport: null,
        actions: {
            hydrate: () => {
                if (get().hydrated) return;
                const wall = Date.now();
                const loaded = loadGame(wall);
                let game = loaded.state ?? createInitialState(undefined, wall);
                let report: OfflineReport | null = null;
                const away = (wall - game.lastSeen) / 1000;
                if (loaded.state && away > 1) {
                    const result = catchUp(game, away);
                    game = result.game;
                    report = result.report;
                }
                game = { ...game, lastSeen: wall };
                set({ game, rates: computeRates(game), hydrated: true, tickedAt: now(), offlineReport: report });
                saveGame(game);
            },
            tick: () => {
                const state = get();
                if (!state.hydrated) return;
                const wall = Date.now();
                const delta = (wall - state.game.lastSeen) / 1000;
                if (delta <= 0) return;
                if (delta > ONLINE_GAP_LIMIT) {
                    const result = catchUp(state.game, delta);
                    const game = { ...result.game, lastSeen: wall };
                    set({
                        game,
                        rates: computeRates(game),
                        tickedAt: now(),
                        offlineReport: result.report ?? state.offlineReport,
                    });
                    return;
                }
                const result = advance(state.game, delta);
                const game = { ...result.state, lastSeen: wall };
                commit(game);
                for (const signal of result.signals) fx.emit({ type: 'signal', signal });
            },
            gather: (x, y) => {
                const result = gather(get().game);
                runAction(result, { type: 'gather', x, y, amount: result.amount ?? 0 });
            },
            buyPlant: (id, amount) => {
                const result = buyPlant(get().game, id, amount);
                return runAction(result, { type: 'plantBought', id, count: result.count ?? 1 });
            },
            buyUpgrade: (id) => runAction(buyUpgrade(get().game, id), { type: 'upgradeBought', id }),
            performRitual: (id) => {
                const result = performRitual(get().game, id);
                return runAction(result, { type: 'ritual', id, amount: result.amount });
            },
            unlockZone: (id) => runAction(unlockZone(get().game, id), { type: 'zoneUnlocked', id }),
            travel: (id) => runAction(travel(get().game, id), { type: 'travel', id }),
            resolveEvent: (choice) => {
                const id = get().game.activeEvent ?? '';
                return runAction(resolveEvent(get().game, choice), { type: 'eventResolved', id, choice });
            },
            startNewCycle: () => {
                const result = startNewCycle(get().game);
                const ok = runAction(result, { type: 'newCycle', wisdom: result.amount ?? 0 });
                if (ok) saveGame(get().game);
                return ok;
            },
            buyPerk: (id) => runAction(buyPerk(get().game, id), { type: 'perkBought', id }),
            advanceTutorial: (to) => commit(advanceTutorial(get().game, to)),
            dismissOffline: () => set({ offlineReport: null }),
            importGame: (game) => {
                const fresh = { ...game, lastSeen: Date.now() };
                commit(fresh);
                saveGame(fresh);
            },
            resetGame: () => {
                clearSave();
                const game = createInitialState();
                commit(game);
                set({ offlineReport: null });
                saveGame(game);
            },
            save: () => {
                const { game, hydrated } = get();
                if (hydrated) saveGame({ ...game, lastSeen: Date.now() });
            },
            devAddChi: (amount) => {
                const g = get().game;
                commit({
                    ...g,
                    chi: g.chi + amount,
                    stats: { ...g.stats, runChi: g.stats.runChi + amount, lifetimeChi: g.stats.lifetimeChi + amount },
                });
            },
            devAddHarmony: (amount) => {
                const g = get().game;
                commit({ ...g, harmony: g.harmony + amount, stats: { ...g.stats, runHarmony: g.stats.runHarmony + amount } });
            },
            devWarp: (seconds) => {
                const result = advance(get().game, seconds);
                commit(result.state);
                for (const signal of result.signals) fx.emit({ type: 'signal', signal });
            },
            devSetBalance: (value) => commit({ ...get().game, balance: value }),
        },
    };
});

export const useActions = () => useGameStore((s) => s.actions);

// ------------------------------------------------------------- loop & autosave

const TICK_MS = 200;
const SAVE_MS = 10_000;

export const startGameLoop = (): (() => void) => {
    const { actions } = useGameStore.getState();
    actions.hydrate();
    const tickTimer = window.setInterval(() => actions.tick(), TICK_MS);
    const saveTimer = window.setInterval(() => actions.save(), SAVE_MS);
    const onHide = () => {
        if (document.visibilityState === 'hidden') actions.save();
        else actions.tick();
    };
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', actions.save);
    return () => {
        window.clearInterval(tickTimer);
        window.clearInterval(saveTimer);
        document.removeEventListener('visibilitychange', onHide);
        window.removeEventListener('pagehide', actions.save);
        actions.save();
    };
};
