import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import {
    PLANTS,
    PLANT_MILESTONES,
    isPlantRevealed,
    plantMilestones,
    plantPurchase,
    type BuyAmount,
    type PlantId,
} from '../../core';
import { useGameStore } from '../../store/gameStore';
import { useSettings } from '../../store/settingsStore';
import { formatDuration, formatNumber, formatPercent } from '../../utils/format';
import { plantImage } from '../../render/scene/flora';
import { Icon } from '../components/Icon';
import { Tooltip } from '../components/Tooltip';

const AMOUNTS: BuyAmount[] = [1, 10, 25, 'max'];

export const BuyAmountPicker = () => {
    const { t } = useTranslation();
    const amount = useSettings((s) => s.buyAmount);
    const set = useSettings((s) => s.set);
    return (
        <div className="segmented" role="group" aria-label={t('buy.amount')}>
            {AMOUNTS.map((a) => (
                <button key={String(a)} aria-pressed={amount === a} onClick={() => set({ buyAmount: a })}>
                    {a === 'max' ? t('buy.max') : `×${a}`}
                </button>
            ))}
        </div>
    );
};

const PlantCard = memo(({ id }: { id: PlantId }) => {
    const { t } = useTranslation();
    const def = PLANTS.find((p) => p.id === id)!;
    const level = useGameStore((s) => s.game.plants[id]);
    const chi = useGameStore((s) => s.game.chi);
    const cps = useGameStore((s) => s.rates.cps);
    const output = useGameStore((s) => s.rates.perPlant[id]);
    const tutorial = useGameStore((s) => s.game.tutorial);
    const buy = useGameStore((s) => s.actions.buyPlant);
    const amount = useSettings((s) => s.buyAmount);
    const purchase = plantPurchase(useGameStore.getState().game, id, amount);
    const affordable = chi >= purchase.cost;
    const share = cps > 0 ? output / cps : 0;
    const milestones = plantMilestones(level);
    const nextMilestone = PLANT_MILESTONES[milestones];
    const prevMilestone = milestones > 0 ? PLANT_MILESTONES[milestones - 1] : 0;
    const eta = !affordable && cps > 0 ? (purchase.cost - chi) / cps : null;
    const highlight =
        (tutorial === 1 && id === 'lotus') || (tutorial === 2 && id === 'fern' && level === 0);

    return (
        <div className={`card plant plant--${def.essence}`} data-highlight={highlight}>
            <Tooltip
                placement="left"
                content={
                    <>
                        <strong>{t(`plants.${id}.name`)}</strong>
                        {t(`plants.${id}.desc`)}
                        <dl>
                            <dt>{t('essence.' + def.essence)}</dt>
                            <dd>{t('buy.level', { level })}</dd>
                            <dt>{t('buy.perPlant')}</dt>
                            <dd>{formatNumber(level > 0 ? output / level : 0)}/s</dd>
                            <dt>{t('buy.totalLabel')}</dt>
                            <dd>{formatNumber(output)}/s</dd>
                            <dt>{t('buy.multiplier')}</dt>
                            <dd>×{Math.pow(2, milestones)}</dd>
                        </dl>
                    </>
                }
            >
                <div className="plant__thumb" tabIndex={0}>
                    <img src={plantImage(id)} alt="" draggable={false} />
                </div>
            </Tooltip>
            <div className="plant__info">
                <div className="plant__name">
                    <span className={`essence-dot essence-dot--${def.essence}`} title={t('essence.' + def.essence)} />
                    <span className="display">{t(`plants.${id}.name`)}</span>
                    {level > 0 && <span className="plant__level">{level}</span>}
                </div>
                <div className="plant__stats">
                    {level > 0 ? (
                        <>
                            <b className="num">{formatNumber(output)}/s</b> · {t('buy.share', { value: formatPercent(share) })}
                        </>
                    ) : (
                        <span>{t(`plants.${id}.desc`)}</span>
                    )}
                </div>
                {level > 0 && nextMilestone && (
                    <div className="plant__milestone">
                        <div className="progress progress--gold" aria-hidden="true">
                            <span style={{ width: `${((level - prevMilestone) / (nextMilestone - prevMilestone)) * 100}%` }} />
                        </div>
                        <span>{t('buy.nextMilestone', { level: nextMilestone })}</span>
                    </div>
                )}
            </div>
            <button
                className={`btn buy ${affordable ? 'btn--primary' : ''}`}
                disabled={!affordable}
                onClick={() => buy(id, amount)}
                aria-label={`${t('buy.button')} ${t(`plants.${id}.name`)} ×${purchase.count}, ${formatNumber(purchase.cost)} ${t('hud.chi')}`}
            >
                {!affordable && (
                    <span className="buy__fill" style={{ transform: `scaleX(${Math.min(1, chi / purchase.cost)})` }} />
                )}
                <span className="buy__label">
                    {t('buy.button')} ×{purchase.count}
                </span>
                <span className="buy__cost num">
                    <Icon name="chi" size={13} />
                    {formatNumber(purchase.cost)}
                </span>
                {eta !== null && eta < 86400 * 7 && (
                    <span className="buy__eta">{t('buy.timeTo', { time: formatDuration(eta) })}</span>
                )}
            </button>
        </div>
    );
});

const LockedCard = ({ id }: { id: PlantId }) => {
    const { t } = useTranslation();
    return (
        <div className="card plant plant--locked" aria-label={t('buy.locked')}>
            <div className="plant__thumb">
                <img src={plantImage(id)} alt="" draggable={false} />
            </div>
            <div className="plant__info">
                <div className="plant__name">
                    <Icon name="lock" size={14} />
                    <span className="display">{t('buy.locked')}</span>
                </div>
                <div className="plant__stats">{t('buy.lockedHint')}</div>
            </div>
        </div>
    );
};

export const GardenPanel = () => {
    const { t } = useTranslation();
    // Re-evaluate reveals when chi milestones or plants change.
    const revealKey = useGameStore((s) =>
        PLANTS.map((p) => (isPlantRevealed(s.game, p.id) ? '1' : '0')).join(''),
    );
    const revealed = PLANTS.filter((_, i) => revealKey[i] === '1');
    const nextLocked = PLANTS.find((_, i) => revealKey[i] === '0');

    return (
        <section aria-labelledby="garden-title">
            <div className="section-head">
                <h2 id="garden-title" className="section-title">
                    {t('tabs.garden')}
                </h2>
                <BuyAmountPicker />
            </div>
            <div className="stack">
                {revealed.map((p) => (
                    <PlantCard key={p.id} id={p.id} />
                ))}
                {nextLocked && <LockedCard id={nextLocked.id} />}
            </div>
        </section>
    );
};
