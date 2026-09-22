// i18n lookups for content ids.
import type { TFunction } from 'i18next';
import { UPGRADE_BY_ID } from '../core';

export const plantName = (t: TFunction, id: string) => t(`plants.${id}.name`);

export const upgradeName = (t: TFunction, id: string) => {
    const def = UPGRADE_BY_ID[id];
    if (def?.plant && def.tier) {
        const tiers = t('upgrades.tiers', { returnObjects: true }) as string[];
        return t('upgrades.tierName', { tier: tiers[def.tier - 1], plant: plantName(t, def.plant) });
    }
    return t(`upgrades.${id}.name`);
};

export const upgradeDesc = (t: TFunction, id: string) => {
    const def = UPGRADE_BY_ID[id];
    if (def?.plant) return t('upgrades.tierDesc', { plant: plantName(t, def.plant) });
    return t(`upgrades.${id}.desc`);
};

/** Resolves the display name used inside log entries. */
export const logText = (t: TFunction, key: string, params: Record<string, string | number> = {}) => {
    const p: Record<string, string | number> = { ...params };
    const id = String(params.id ?? '');
    switch (key) {
        case 'achievement':
            p.name = t(`achievements.${id}.name`);
            break;
        case 'eventResolved':
            p.name = t(`events.${id}.title`);
            break;
        case 'ritual':
            p.name = t(`rituals.${id}.name`);
            break;
        case 'upgrade':
            p.name = upgradeName(t, id);
            break;
        case 'zoneUnlocked':
        case 'travel':
            p.name = t(`zones.${id}.name`);
            break;
        case 'perk':
            p.name = t(`perks.${id}.name`);
            break;
    }
    return t(`log.${key}`, p);
};
