import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { audio } from '../audio/audioEngine';
import { fx } from '../store/fx';
import { useGameStore } from '../store/gameStore';
import { useSettings } from '../store/settingsStore';
import { setNumberFormat } from '../utils/format';
import { GatherLayer } from './GatherLayer';
import { BuffBar, Hud } from './Hud';
import { SceneHost } from './SceneHost';
import { SidePanel, TABS, type TabId } from './SidePanel';
import { useIsMobile, useWindowSize } from './hooks';
import { upgradeName } from './names';
import { Coach } from './overlays/Coach';
import { DevMenu } from './overlays/DevMenu';
import { EventCard } from './overlays/EventCard';
import { OfflineModal } from './overlays/OfflineModal';
import { SettingsModal } from './overlays/SettingsModal';
import { Toasts } from './overlays/Toasts';
import { Whisper } from './overlays/Whisper';
import { useToasts } from './toastStore';

const PANEL_W = 440;
const GAP = 16;

/** Presentation reactions to game signals: toasts for the important moments. */
const useSignalToasts = () => {
    const { t } = useTranslation();
    const push = useToasts((s) => s.push);
    useEffect(
        () =>
            fx.on((e) => {
                if (e.type === 'signal') {
                    const s = e.signal;
                    if (s.type === 'achievement') {
                        push({ kind: 'gold', icon: 'star', kicker: t('toast.achievement'), title: t(`achievements.${s.id}.name`) });
                    } else if (s.type === 'weather' && s.kind === 'aurora') {
                        push({ kind: 'info', icon: 'aurora', kicker: t('toast.weather'), title: t('weather.aurora.name') });
                    } else if (s.type === 'buffEnded') {
                        push({ kind: 'info', icon: 'clock', title: t('toast.buffEnded', { name: t(`buffs.${s.id}`) }) }, 2400);
                    }
                } else if (e.type === 'zoneUnlocked') {
                    push({ kind: 'gold', icon: 'map', kicker: t('toast.zone'), title: t(`zones.${e.id}.name`) });
                } else if (e.type === 'newCycle') {
                    push({ kind: 'gold', icon: 'cycle', kicker: t('toast.newCycle'), title: `+${e.wisdom} ${t('hud.wisdom')}` });
                } else if (e.type === 'upgradeBought') {
                    push({ kind: 'info', icon: 'book', kicker: t('upgrades.owned'), title: upgradeName(t, e.id) }, 2200);
                } else if (e.type === 'denied' && e.reason !== 'unknown') {
                    push({ kind: 'warn', icon: 'info', title: t(`denied.${e.reason}`) }, 1800);
                }
            }),
        [t, push],
    );
};

export const App = () => {
    const { t } = useTranslation();
    const mobile = useIsMobile();
    const { w, h } = useWindowSize();
    const [tab, setTab] = useState<TabId>('garden');
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [devOpen, setDevOpen] = useState(() => new URLSearchParams(location.search).has('dev'));
    const [sceneReady, setSceneReady] = useState(false);
    const [bootDone, setBootDone] = useState(false);
    const chiRef = useRef<HTMLDivElement>(null);
    const [chiTarget, setChiTarget] = useState<{ x: number; y: number } | null>(null);
    const hydrated = useGameStore((s) => s.hydrated);
    const tutorial = useGameStore((s) => s.game.tutorial);
    const hasEvent = useGameStore((s) => !!s.game.activeEvent);
    const numberFormat = useSettings((s) => s.numberFormat);
    const language = useSettings((s) => s.language);
    const reducedMotion = useSettings((s) => s.reducedMotion);
    const [, forceFormat] = useState(0);

    useSignalToasts();

    useEffect(() => {
        setNumberFormat(numberFormat, language === 'de' ? 'de-DE' : 'en-US');
        forceFormat((n) => n + 1);
    }, [numberFormat, language]);

    useEffect(() => {
        document.documentElement.classList.toggle('reduce-motion', reducedMotion);
    }, [reducedMotion]);

    // Layout: where the landscape is visible and where taps gather chi.
    const layout = useMemo(() => {
        if (mobile) {
            const sheet = Math.round(h * 0.52);
            const top = 128;
            return {
                viewport: { x: 0, y: 90, w, h: h - sheet - 80 },
                gather: { x: 0, y: top, w, h: Math.max(80, h - sheet - top) },
            };
        }
        const sceneW = w - PANEL_W - GAP * 2;
        const top = GAP + 76 + GAP;
        return {
            viewport: { x: 0, y: 0, w: sceneW + GAP, h },
            gather: { x: GAP, y: top, w: Math.max(100, sceneW - GAP), h: h - top },
        };
    }, [mobile, w, h]);
    const gatherRect = layout.gather;

    useLayoutEffect(() => {
        const r = chiRef.current?.getBoundingClientRect();
        if (r) setChiTarget({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
    }, [w, h, mobile]);

    useEffect(() => {
        if (hydrated && sceneReady) {
            const id = window.setTimeout(() => setBootDone(true), 700);
            return () => window.clearTimeout(id);
        }
    }, [hydrated, sceneReady]);

    // Audio needs a user gesture.
    useEffect(() => {
        const unlock = () => audio.unlock();
        window.addEventListener('pointerdown', unlock, { passive: true });
        window.addEventListener('keydown', unlock);
        return () => {
            window.removeEventListener('pointerdown', unlock);
            window.removeEventListener('keydown', unlock);
        };
    }, []);

    // Keyboard shortcuts.
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.ctrlKey && (e.key === '`' || e.key === 'Dead')) {
                setDevOpen((v) => !v);
                return;
            }
            const target = e.target as HTMLElement;
            if (target.closest('input, textarea, button, [role="dialog"]')) return;
            if (e.key === ' ') {
                e.preventDefault();
                const r = gatherRect;
                useGameStore.getState().actions.gather(r.x + r.w / 2, r.y + r.h * 0.55);
            } else if (/^[1-6]$/.test(e.key)) {
                setTab(TABS[Number(e.key) - 1].id);
            } else if (e.key.toLowerCase() === 'm') {
                const s = useSettings.getState();
                s.set({ muted: !s.muted });
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [gatherRect]);

    return (
        <>
            <SceneHost viewport={layout.viewport} chiTarget={chiTarget} onReady={() => setSceneReady(true)} />
            <div className="vignette" aria-hidden="true" />
            {useSettings.getState().quality !== 'low' && !reducedMotion && <div className="grain" aria-hidden="true" />}
            <GatherLayer rect={gatherRect} showHint={tutorial === 0 && bootDone} />
            <main aria-label={t('app.title')}>
                <Hud ref={chiRef} onSettings={() => setSettingsOpen(true)} />
                <BuffBar />
                <SidePanel tab={tab} onTab={setTab} />
                <div className="dock">
                    {hasEvent ? <EventCard /> : tutorial <= 3 ? <Coach /> : <Whisper />}
                </div>
            </main>
            <Toasts />
            <OfflineModal />
            {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
            {devOpen && <DevMenu onClose={() => setDevOpen(false)} />}
            <div className={`boot ${bootDone ? 'boot--done' : ''}`} aria-hidden={bootDone}>
                <div>
                    <div className="boot__title">{t('app.title')}</div>
                    <div className="boot__sub">{t('app.tagline')}</div>
                    <svg className="boot__sprout" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
                        <path d="M12 21v-9M12 12c0-4 3-7 8-7 0 5-3 8-8 7zM12 14c0-3-2.5-5.5-7-5.5 0 4 2.5 6.5 7 5.5z" />
                    </svg>
                </div>
            </div>
        </>
    );
};
