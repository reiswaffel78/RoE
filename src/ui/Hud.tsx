import { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';
import { BUFFS, getDayInfo, getModifiers } from '../core';
import { useGameStore } from '../store/gameStore';
import { useSettings } from '../store/settingsStore';
import { formatClock, formatNumber, formatPercent } from '../utils/format';
import { Icon } from './components/Icon';
import { LiveNumber } from './components/LiveNumber';
import { Tooltip } from './components/Tooltip';
import { WEATHER_ICON, timeOfDayKey } from './panels/WorldPanel';

const BalanceMeter = () => {
    const { t } = useTranslation();
    const balance = useGameStore((s) => s.game.balance);
    const rates = useGameStore((s) => s.rates);
    const tutorial = useGameStore((s) => s.game.tutorial);
    const width = useGameStore((s) => getModifiers(s.game).harmonyWidth);
    const harmony = rates.harmony;
    const stateClass = harmony >= 0.9 ? 'good' : harmony < 0.4 ? 'bad' : '';
    const stateText = harmony >= 0.9 ? t('hud.inHarmony') : harmony < 0.4 ? t('hud.outOfBalance') : t('hud.drifting');
    // Visualise the zone where harmony >= 0.9 (|b-50| <= σ·sqrt(ln(1/0.9))).
    const half = width * Math.sqrt(Math.log(1 / 0.9));
    const glow = balance < 50 ? 'rgba(242,189,107,0.8)' : 'rgba(176,155,255,0.8)';
    const targetLabel = rates.balanceTarget < 45 ? t('hud.physical') : rates.balanceTarget > 55 ? t('hud.ethereal') : t('hud.balance');

    return (
        <Tooltip
            placement="bottom"
            content={
                <>
                    <strong>{t('balanceTip.title')}</strong>
                    {t('balanceTip.body')}
                    <dl>
                        <dt>{t('balanceTip.efficiency')}</dt>
                        <dd>{formatPercent(rates.balanceMult)}</dd>
                        <dt>{t('balanceTip.target')}</dt>
                        <dd>
                            {targetLabel} ({Math.round(rates.balanceTarget)})
                        </dd>
                        <dt>{t('balanceTip.harmony')}</dt>
                        <dd>+{formatNumber(rates.harmonyPerSecond, true)}</dd>
                    </dl>
                </>
            }
        >
            <div
                className="balance"
                tabIndex={0}
                role="meter"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(balance)}
                aria-label={`${t('hud.balance')}: ${stateText}`}
                data-highlight={tutorial === 3}
            >
                <div className="balance__labels">
                    <span className="earth">{t('hud.physical')}</span>
                    <span className={`balance__state balance__state--${stateClass}`}>
                        {stateText} · {formatPercent(rates.balanceMult)}
                    </span>
                    <span className="dream">{t('hud.ethereal')}</span>
                </div>
                <div className="balance__track">
                    <div className="balance__zone" style={{ left: `${50 - half}%`, width: `${half * 2}%` }} />
                    <div className="balance__target" style={{ left: `${rates.balanceTarget}%` }} />
                    <div className="balance__marker" style={{ left: `${balance}%`, ['--marker-glow' as string]: glow }} />
                </div>
            </div>
        </Tooltip>
    );
};

const Environment = () => {
    const { t } = useTranslation();
    const worldTime = useGameStore((s) => Math.floor(s.game.worldTime / 5));
    const weather = useGameStore((s) => s.game.weather.kind);
    const day = getDayInfo(worldTime * 5);
    const tod = timeOfDayKey(day.phase);
    return (
        <div className="env" aria-label={`${t(`time.${tod}`)}, ${t(`weather.${weather}.name`)}`}>
            <span className="chip">
                <Icon name={day.night ? 'moon' : 'sun'} size={13} /> {t(`time.${tod}`)}
            </span>
            <span className="chip">
                <Icon name={WEATHER_ICON[weather]} size={13} /> {t(`weather.${weather}.name`)}
            </span>
        </div>
    );
};

interface HudProps {
    onSettings: () => void;
}

export const Hud = forwardRef<HTMLDivElement, HudProps>(({ onSettings }, chiRef) => {
    const { t } = useTranslation();
    const cps = useGameStore((s) => s.rates.cps);
    const hps = useGameStore((s) => s.rates.harmonyPerSecond);
    const muted = useSettings((s) => s.muted);
    const setSettings = useSettings((s) => s.set);

    return (
        <header className="hud glass" role="banner">
            <div className="hud__brand" aria-hidden="true">
                <span className="hud__brand-title">{t('app.title')}</span>
                <span className="hud__brand-sub">{t('app.tagline').split(' ').slice(0, 3).join(' ')}</span>
            </div>
            <div className="resource" aria-live="off">
                <div className="resource__icon resource__icon--chi" ref={chiRef}>
                    <Icon name="chi" size={20} />
                </div>
                <div>
                    <LiveNumber className="resource__value num" pick={(s) => s.game.chi} rate={(s) => s.rates.cps} />
                    <div className="resource__rate">
                        <b className="num">{formatNumber(cps)}</b>/s
                    </div>
                </div>
            </div>
            <div className="resource resource--harmony">
                <div className="resource__icon resource__icon--harmony">
                    <Icon name="harmony" size={18} />
                </div>
                <div>
                    <LiveNumber
                        className="resource__value resource__value--sm num"
                        pick={(s) => s.game.harmony}
                        rate={(s) => s.rates.harmonyPerSecond}
                    />
                    <div className="resource__rate">
                        <b className="num">+{formatNumber(hps, true)}</b>/s
                    </div>
                </div>
            </div>
            <BalanceMeter />
            <Environment />
            <div className="hud__spacer" />
            <div className="hud__actions">
                <button
                    className="icon-btn"
                    onClick={() => setSettings({ muted: !muted })}
                    aria-label={t('settings.mute')}
                    aria-pressed={muted}
                >
                    <Icon name={muted ? 'mute' : 'volume'} />
                </button>
                <button className="icon-btn" onClick={onSettings} aria-label={t('hud.settings')}>
                    <Icon name="settings" />
                </button>
            </div>
        </header>
    );
});

export const BuffBar = () => {
    const { t } = useTranslation();
    const buffs = useGameStore((s) => s.game.buffs);
    const worldTime = useGameStore((s) => s.game.worldTime);
    const active = buffs.filter((b) => b.until > worldTime);
    if (active.length === 0) return null;
    return (
        <div className="buffs" aria-label="Buffs">
            {active.map((b) => {
                const remaining = b.until - worldTime;
                const p = Math.max(0, Math.min(1, remaining / BUFFS[b.id].duration));
                return (
                    <div key={b.id} className="buff glass">
                        <div className="buff__ring" style={{ ['--p' as string]: p }}>
                            <span>
                                <Icon name={b.id === 'vigil' ? 'moon' : b.id === 'insight' ? 'hand' : 'spark'} size={12} />
                            </span>
                        </div>
                        <span>
                            <b>{t(`buffs.${b.id}`)}</b> · {t(`buffs.effect.${b.id}`)} · <span className="num">{formatClock(remaining)}</span>
                        </span>
                    </div>
                );
            })}
        </div>
    );
};
