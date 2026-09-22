import { useTranslation } from 'react-i18next';
import {
    BUFFS,
    RAIN_DANCE_DURATION,
    RITUALS,
    RITUAL_BALANCE_SHIFT,
    offeringHarmony,
    ritualCooldown,
    ritualStatus,
    type RitualId,
} from '../../core';
import { useGameStore } from '../../store/gameStore';
import { formatClock, formatNumber, formatPercent } from '../../utils/format';
import { Icon, type IconName } from '../components/Icon';

export const RITUAL_ICON: Record<RitualId, IconName> = {
    meditation: 'eye',
    grounding: 'mountain',
    drums: 'voice',
    offering: 'heart',
    rainDance: 'rain',
    vigil: 'moon',
    spiritCall: 'sprite',
};

export const RITUAL_COLOR: Record<RitualId, string> = {
    meditation: 'var(--dream)',
    grounding: 'var(--earth)',
    drums: '#ff9a72',
    offering: 'var(--harmony)',
    rainDance: '#8fc8ff',
    vigil: '#d6e4ff',
    spiritCall: '#bfffe9',
};

const ritualValue = (id: RitualId) => {
    switch (id) {
        case 'meditation':
        case 'grounding':
            return RITUAL_BALANCE_SHIFT;
        case 'drums':
            return BUFFS.drums.duration;
        case 'vigil':
            return BUFFS.vigil.duration;
        case 'rainDance':
            return RAIN_DANCE_DURATION;
        default:
            return 0;
    }
};

const RitualCard = ({ id }: { id: RitualId }) => {
    const { t } = useTranslation();
    const game = useGameStore((s) => s.game);
    const cps = useGameStore((s) => s.rates.cps);
    const perform = useGameStore((s) => s.actions.performRitual);
    const def = RITUALS.find((r) => r.id === id)!;
    const status = ritualStatus(game, id, cps);
    const cooldown = ritualCooldown(game, id);
    const progress = status.remaining > 0 ? 1 - status.remaining / cooldown : 1;

    let state = t('rituals.ready');
    if (status.reason === 'cooldown') state = t('rituals.cooldown', { time: formatClock(status.remaining) });
    else if (status.reason === 'notNight') state = t('rituals.nightOnly');
    else if (status.reason) state = t(`denied.${status.reason}`);

    const costNode =
        def.currency === 'share' ? (
            <span className="cost cost--chi">
                <Icon name="chi" size={13} />
                {formatNumber(status.cost)}
                <span style={{ color: 'var(--harmony)', marginLeft: 6 }}>
                    → <Icon name="harmony" size={12} /> +{formatNumber(offeringHarmony(status.cost))}
                </span>
            </span>
        ) : (
            <span
                className={`cost ${def.currency === 'harmony' ? 'cost--harmony' : 'cost--chi'} ${
                    status.reason === 'insufficientChi' || status.reason === 'insufficientHarmony' ? 'cost--short' : ''
                }`}
            >
                <Icon name={def.currency === 'harmony' ? 'harmony' : 'chi'} size={13} />
                {formatNumber(status.cost)}
            </span>
        );

    return (
        <button
            className={`card ritual ${status.ready ? 'ritual--ready' : ''}`}
            disabled={!status.ready}
            onClick={() => perform(id)}
            aria-label={`${t(`rituals.${id}.name`)} – ${state}`}
        >
            <div className="ritual__head">
                <div
                    className="ritual__icon"
                    style={{ ['--p' as string]: progress, ['--c' as string]: RITUAL_COLOR[id] }}
                    aria-hidden="true"
                >
                    <span>
                        <Icon name={RITUAL_ICON[id]} size={18} />
                    </span>
                </div>
                <div>
                    <div className="ritual__name">{t(`rituals.${id}.name`)}</div>
                    <div className={`ritual__state ${status.ready ? 'ritual__state--ready' : ''}`}>{state}</div>
                </div>
            </div>
            <div className="ritual__desc">
                {t(`rituals.${id}.desc`, { value: ritualValue(id) })}
                {def.currency === 'share' && ` (${formatPercent(def.baseCost)})`}
            </div>
            <div className="ritual__foot">{costNode}</div>
        </button>
    );
};

export const RitualsPanel = () => {
    const { t } = useTranslation();
    const unlockedKey = useGameStore((s) => RITUALS.map((r) => (r.unlocked(s.game) ? '1' : '0')).join(''));
    const unlocked = RITUALS.filter((_, i) => unlockedKey[i] === '1');
    const lockedCount = RITUALS.length - unlocked.length;

    return (
        <section aria-labelledby="rituals-title">
            <div className="section-head">
                <h2 id="rituals-title" className="section-title">
                    {t('tabs.rituals')}
                </h2>
            </div>
            {unlocked.length === 0 ? (
                <p className="empty">{t('rituals.locked')}</p>
            ) : (
                <div className="grid-2">
                    {unlocked.map((r) => (
                        <RitualCard key={r.id} id={r.id} />
                    ))}
                </div>
            )}
            {lockedCount > 0 && unlocked.length > 0 && (
                <p className="list-note">
                    <Icon name="lock" size={12} /> {lockedCount} × {t('rituals.locked')}
                </p>
            )}
        </section>
    );
};
