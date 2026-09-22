import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ACHIEVEMENTS, computeRates } from '../../core';
import { useGameStore } from '../../store/gameStore';
import { formatDuration, formatNumber } from '../../utils/format';
import { Icon, type IconName } from '../components/Icon';
import { Tooltip } from '../components/Tooltip';
import { logText } from '../names';

const ACH_ICON: Record<string, IconName> = {
    leaf: 'leaf',
    chi: 'chi',
    spark: 'spark',
    hand: 'hand',
    balance: 'balance',
    ritual: 'ritual',
    map: 'map',
    aurora: 'aurora',
    eye: 'eye',
    cycle: 'cycle',
    heart: 'heart',
};

type View = 'achievements' | 'stats' | 'log';

export const JournalPanel = () => {
    const { t, i18n } = useTranslation();
    const game = useGameStore((s) => s.game);
    const [view, setView] = useState<View>('achievements');
    const cps = computeRates(game).cps;

    const stats: [string, string][] = [
        ['lifetimeChi', formatNumber(game.stats.lifetimeChi)],
        ['runChi', formatNumber(game.stats.runChi)],
        ['maxCps', `${formatNumber(game.stats.maxCps)}/s`],
        ['clicks', formatNumber(game.stats.clicks)],
        ['rituals', formatNumber(game.stats.rituals)],
        ['eventsResolved', formatNumber(game.stats.eventsResolved)],
        ['bestHarmonyStreak', formatDuration(game.stats.bestHarmonyStreak)],
        ['auroras', formatNumber(game.stats.auroras)],
        ['prestiges', formatNumber(game.stats.prestiges)],
        ['playTime', formatDuration(game.stats.playTime)],
    ];

    return (
        <section aria-labelledby="journal-title">
            <div className="section-head">
                <h2 id="journal-title" className="section-title">
                    {t('tabs.journal')}
                </h2>
                <div className="segmented" role="tablist">
                    {(['achievements', 'stats', 'log'] as View[]).map((v) => (
                        <button key={v} role="tab" aria-pressed={view === v} aria-selected={view === v} onClick={() => setView(v)}>
                            {t(`journal.${v}`)}
                        </button>
                    ))}
                </div>
            </div>

            {view === 'achievements' && (
                <>
                    <p className="section-sub">
                        {game.achievements.length}/{ACHIEVEMENTS.length} · {t('journal.achievementBonus')}
                    </p>
                    <div className="achievements">
                        {ACHIEVEMENTS.map((a) => {
                            const unlocked = game.achievements.includes(a.id);
                            const progress = a.progress ? a.progress({ state: game, cps }) : unlocked ? 1 : 0;
                            return (
                                <Tooltip
                                    key={a.id}
                                    content={
                                        <>
                                            <strong>{t(`achievements.${a.id}.name`)}</strong>
                                            {t(`achievements.${a.id}.desc`)}
                                        </>
                                    }
                                >
                                    <div
                                        className={`card achievement ${unlocked ? '' : 'achievement--locked'}`}
                                        tabIndex={0}
                                        aria-label={`${t(`achievements.${a.id}.name`)}: ${t(`achievements.${a.id}.desc`)}`}
                                    >
                                        <div className="achievement__icon">
                                            <Icon name={unlocked ? ACH_ICON[a.icon] : 'lock'} size={20} />
                                        </div>
                                        <div className="achievement__name">{t(`achievements.${a.id}.name`)}</div>
                                        {!unlocked && a.progress && (
                                            <div className="progress">
                                                <span style={{ width: `${progress * 100}%` }} />
                                            </div>
                                        )}
                                    </div>
                                </Tooltip>
                            );
                        })}
                    </div>
                </>
            )}

            {view === 'stats' && (
                <dl className="card stats">
                    {stats.map(([key, value]) => (
                        <div key={key} style={{ display: 'contents' }}>
                            <dt>{t(`journal.statsLabels.${key}`)}</dt>
                            <dd>{value}</dd>
                        </div>
                    ))}
                </dl>
            )}

            {view === 'log' && (
                <ol className="log" aria-live="polite">
                    {[...game.log].reverse().map((entry, i) => (
                        <li key={`${entry.at}-${i}`}>
                            <time>
                                {new Date(entry.at).toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit' })}
                            </time>
                            <span>{logText(t, entry.key, entry.params)}</span>
                        </li>
                    ))}
                </ol>
            )}
        </section>
    );
};
