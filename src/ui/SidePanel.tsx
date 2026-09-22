import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { RITUALS, UPGRADES, ZONES, pendingWisdom, ritualStatus } from '../core';
import { useGameStore } from '../store/gameStore';
import { Icon, type IconName } from './components/Icon';
import { AncestorsPanel } from './panels/AncestorsPanel';
import { GardenPanel } from './panels/GardenPanel';
import { JournalPanel } from './panels/JournalPanel';
import { RitualsPanel } from './panels/RitualsPanel';
import { UpgradesPanel } from './panels/UpgradesPanel';
import { WorldPanel } from './panels/WorldPanel';

export type TabId = 'garden' | 'rituals' | 'upgrades' | 'world' | 'ancestors' | 'journal';

export const TABS: { id: TabId; icon: IconName }[] = [
    { id: 'garden', icon: 'leaf' },
    { id: 'rituals', icon: 'ritual' },
    { id: 'upgrades', icon: 'book' },
    { id: 'world', icon: 'map' },
    { id: 'ancestors', icon: 'cycle' },
    { id: 'journal', icon: 'scroll' },
];

/** Badge dots tell the player where something new can be done. */
const useBadges = (): Record<TabId, boolean> => {
    // Select a compact string so the component only re-renders when a badge flips.
    const key = useGameStore((s) => {
        const g = s.game;
        const rituals = RITUALS.some((r) => r.unlocked(g) && ritualStatus(g, r.id, s.rates.cps).ready);
        const upgrades = UPGRADES.some(
            (u) => !g.upgrades.includes(u.id) && u.visible(g) && (u.currency === 'chi' ? g.chi : g.harmony) >= u.cost,
        );
        const world = ZONES.some((z) => !g.zones.includes(z.id) && g.chi >= z.cost);
        const ancestors = pendingWisdom(g) > 0 && g.stats.prestiges === 0;
        return [rituals, upgrades, world, ancestors].map((b) => (b ? '1' : '0')).join('');
    });
    return {
        garden: false,
        rituals: key[0] === '1',
        upgrades: key[1] === '1',
        world: key[2] === '1',
        ancestors: key[3] === '1',
        journal: false,
    };
};

interface SidePanelProps {
    tab: TabId;
    onTab: (tab: TabId) => void;
}

export const SidePanel = ({ tab, onTab }: SidePanelProps) => {
    const { t } = useTranslation();
    const badges = useBadges();
    const bodyRef = useRef<HTMLDivElement>(null);

    const select = (id: TabId) => {
        onTab(id);
        bodyRef.current?.scrollTo({ top: 0 });
    };

    return (
        <aside className="panel glass" aria-label={t('hud.menu')}>
            <nav className="tabs" role="tablist" aria-label={t('hud.menu')}>
                {TABS.map((item, index) => (
                    <button
                        key={item.id}
                        role="tab"
                        id={`tab-${item.id}`}
                        aria-selected={tab === item.id}
                        aria-controls="panel-body"
                        className="tab"
                        onClick={() => select(item.id)}
                        title={`${t(`tabs.${item.id}`)} (${index + 1})`}
                    >
                        <Icon name={item.icon} size={20} />
                        <span>{t(`tabs.${item.id}`)}</span>
                        {badges[item.id] && tab !== item.id && <span className="tab__badge" aria-hidden="true" />}
                    </button>
                ))}
            </nav>
            <div className="panel__body" id="panel-body" role="tabpanel" aria-labelledby={`tab-${tab}`} ref={bodyRef} key={tab}>
                {tab === 'garden' && <GardenPanel />}
                {tab === 'rituals' && <RitualsPanel />}
                {tab === 'upgrades' && <UpgradesPanel />}
                {tab === 'world' && <WorldPanel />}
                {tab === 'ancestors' && <AncestorsPanel />}
                {tab === 'journal' && <JournalPanel />}
            </div>
        </aside>
    );
};
