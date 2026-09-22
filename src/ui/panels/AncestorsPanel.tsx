import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PERKS, WISDOM_BONUS, nextWisdomAt, pendingWisdom } from '../../core';
import { useGameStore } from '../../store/gameStore';
import { formatNumber, formatPercent } from '../../utils/format';
import { Icon } from '../components/Icon';
import { Modal } from '../components/Modal';

export const AncestorsPanel = () => {
    const { t } = useTranslation();
    const game = useGameStore((s) => s.game);
    const actions = useGameStore((s) => s.actions);
    const [confirm, setConfirm] = useState(false);
    const pending = pendingWisdom(game);
    const next = nextWisdomAt(game);
    const available = game.prestige.wisdom - game.prestige.spent;
    const progress = Math.min(1, Math.sqrt(game.stats.runChi / next));

    return (
        <section aria-labelledby="ancestors-title">
            <div className="section-head">
                <h2 id="ancestors-title" className="section-title">
                    {t('ancestors.title')}
                </h2>
                <span className="chip">
                    <Icon name="wisdom" size={13} /> {formatNumber(game.prestige.wisdom)}
                </span>
            </div>
            <div className="card wisdom-hero">
                <div className="wisdom-hero__label">{t('ancestors.pending')}</div>
                <div className="wisdom-hero__value num">+{formatNumber(pending)}</div>
                <div className="wisdom-hero__label">{t('hud.wisdom')}</div>
                <div className="progress progress--wisdom" style={{ margin: '12px 0 6px' }}>
                    <span style={{ width: `${progress * 100}%` }} />
                </div>
                <div className="list-note">{t('ancestors.next', { value: formatNumber(next) })}</div>
                <p>{t('ancestors.intro', { bonus: formatPercent(WISDOM_BONUS) })}</p>
                <p className="list-note">
                    {t('ancestors.keeps')}
                    <br />
                    {t('ancestors.loses')}
                </p>
                <button className="btn btn--gold" disabled={pending <= 0} onClick={() => setConfirm(true)} style={{ marginTop: 10 }}>
                    <Icon name="cycle" size={16} /> {pending > 0 ? t('ancestors.begin') : t('ancestors.notYet')}
                </button>
            </div>

            <div className="section-head" style={{ marginTop: 22 }}>
                <h3 className="section-title" style={{ fontSize: 18 }}>
                    {t('ancestors.perksTitle')}
                </h3>
                <span className="chip">{t('ancestors.available', { value: formatNumber(available) })}</span>
            </div>
            <p className="section-sub">
                {t('ancestors.bonus', { value: formatPercent(game.prestige.wisdom * WISDOM_BONUS) })}
            </p>
            <div className="grid-2">
                {PERKS.map((perk) => {
                    const owned = game.prestige.perks.includes(perk.id);
                    const affordable = available >= perk.cost;
                    return (
                        <button
                            key={perk.id}
                            className={`card perk ${owned ? 'perk--owned' : ''}`}
                            disabled={owned || !affordable}
                            onClick={() => actions.buyPerk(perk.id)}
                        >
                            <div className="perk__name">{t(`perks.${perk.id}.name`)}</div>
                            <div className="perk__desc">{t(`perks.${perk.id}.desc`)}</div>
                            {owned ? (
                                <span className="cost cost--wisdom">
                                    <Icon name="check" size={13} /> {t('upgrades.owned')}
                                </span>
                            ) : (
                                <span className={`cost cost--wisdom ${affordable ? '' : 'cost--short'}`}>
                                    <Icon name="wisdom" size={13} /> {perk.cost}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {confirm && (
                <Modal title={t('ancestors.confirmTitle')} onClose={() => setConfirm(false)}>
                    <p className="modal__text">{t('ancestors.confirmBody', { wisdom: formatNumber(pending) })}</p>
                    <p className="list-note">{t('ancestors.loses')}</p>
                    <div className="modal__actions">
                        <button className="btn btn--ghost" onClick={() => setConfirm(false)}>
                            {t('ancestors.cancel')}
                        </button>
                        <button
                            className="btn btn--gold"
                            onClick={() => {
                                actions.startNewCycle();
                                setConfirm(false);
                            }}
                        >
                            {t('ancestors.confirm')}
                        </button>
                    </div>
                </Modal>
            )}
        </section>
    );
};
