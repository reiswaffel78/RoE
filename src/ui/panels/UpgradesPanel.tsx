import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { UPGRADES, type UpgradeDef } from '../../core';
import { plantImage } from '../../render/scene/flora';
import { useGameStore } from '../../store/gameStore';
import { formatNumber } from '../../utils/format';
import { Icon, type IconName } from '../components/Icon';
import { upgradeDesc, upgradeName } from '../names';

const GROUP_ICON: Record<UpgradeDef['group'], IconName> = {
    plant: 'leaf',
    click: 'hand',
    harmony: 'harmony',
    world: 'earth',
};

const UpgradeIcon = ({ def }: { def: UpgradeDef }) => (
    <div className={`upgrade__icon upgrade__icon--${def.group}`} aria-hidden="true">
        {def.plant ? <img src={plantImage(def.plant)} alt="" /> : <Icon name={GROUP_ICON[def.group]} size={20} />}
    </div>
);

export const UpgradesPanel = () => {
    const { t } = useTranslation();
    const game = useGameStore((s) => s.game);
    const buy = useGameStore((s) => s.actions.buyUpgrade);
    const [showOwned, setShowOwned] = useState(false);

    const available = UPGRADES.filter((u) => !game.upgrades.includes(u.id) && u.visible(game)).sort((a, b) => {
        const wa = a.currency === 'chi' ? a.cost : a.cost * 1e6;
        const wb = b.currency === 'chi' ? b.cost : b.cost * 1e6;
        return wa - wb;
    });
    const owned = UPGRADES.filter((u) => game.upgrades.includes(u.id));

    return (
        <section aria-labelledby="upgrades-title">
            <div className="section-head">
                <h2 id="upgrades-title" className="section-title">
                    {t('tabs.upgrades')}
                </h2>
                <span className="chip">
                    <Icon name="book" size={13} /> {owned.length}/{UPGRADES.length}
                </span>
            </div>
            {available.length === 0 && <p className="empty">{t('upgrades.empty')}</p>}
            <div className="stack">
                {available.map((u) => {
                    const wallet = u.currency === 'chi' ? game.chi : game.harmony;
                    const affordable = wallet >= u.cost;
                    return (
                        <button
                            key={u.id}
                            className={`card upgrade ${affordable ? 'upgrade--affordable' : ''}`}
                            disabled={!affordable}
                            onClick={() => buy(u.id)}
                        >
                            <UpgradeIcon def={u} />
                            <div>
                                <div className="upgrade__name">{upgradeName(t, u.id)}</div>
                                <div className="upgrade__desc">{upgradeDesc(t, u.id)}</div>
                            </div>
                            <span
                                className={`cost ${u.currency === 'harmony' ? 'cost--harmony' : 'cost--chi'} ${
                                    affordable ? '' : 'cost--short'
                                }`}
                            >
                                <Icon name={u.currency === 'harmony' ? 'harmony' : 'chi'} size={13} />
                                {formatNumber(u.cost)}
                            </span>
                        </button>
                    );
                })}
            </div>
            {owned.length > 0 && (
                <>
                    <button className="subhead" onClick={() => setShowOwned((v) => !v)} aria-expanded={showOwned}>
                        {t('upgrades.owned')} ({owned.length}) {showOwned ? '▾' : '▸'}
                    </button>
                    {showOwned && (
                        <div className="stack">
                            {owned.map((u) => (
                                <div key={u.id} className="card upgrade upgrade--owned">
                                    <UpgradeIcon def={u} />
                                    <div>
                                        <div className="upgrade__name">{upgradeName(t, u.id)}</div>
                                        <div className="upgrade__desc">{upgradeDesc(t, u.id)}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </section>
    );
};
