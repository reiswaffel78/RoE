import { useTranslation } from 'react-i18next';
import { WEATHER, ZONES, getDayInfo, getModifiers, type WeatherKind, type ZoneId } from '../../core';
import { useGameStore } from '../../store/gameStore';
import { formatDuration, formatMultiplier, formatNumber, formatPercent } from '../../utils/format';
import { Icon, type IconName } from '../components/Icon';

export const WEATHER_ICON: Record<WeatherKind, IconName> = {
    clear: 'sun',
    rain: 'rain',
    mist: 'mist',
    aurora: 'aurora',
};

export const timeOfDayKey = (phase: number) => {
    if (phase < 0.08 || phase > 0.95) return 'dawn';
    if (phase < 0.45) return 'day';
    if (phase < 0.58) return 'dusk';
    return 'night';
};

const ZONE_ART: Record<ZoneId, { sky: [string, string]; hills: string[]; peaks?: boolean }> = {
    grove: { sky: ['#2a6a9c', '#cfe8d8'], hills: ['#6f9fa6', '#3f7466', '#244b3d'] },
    meadow: { sky: ['#4b86b8', '#ffe2a6'], hills: ['#c9b27a', '#8aa653', '#56793a'] },
    hollow: { sky: ['#2b2458', '#b79be0'], hills: ['#6b5c9e', '#46407a', '#2a2750'] },
    peaks: { sky: ['#07122e', '#1f5a6a'], hills: ['#8fb7d6', '#4a6f93', '#223a58'], peaks: true },
};

/** Small illustrated vignette for a zone card (inline SVG). */
const ZoneArt = ({ id }: { id: ZoneId }) => {
    const art = ZONE_ART[id];
    const gid = `zg-${id}`;
    const ridge = (y: number, amp: number, seed: number) => {
        let d = `M0 ${y}`;
        for (let x = 0; x <= 400; x += 20) {
            const h = art.peaks && seed === 0 ? Math.abs(Math.sin(x * 0.03 + seed)) * amp * 1.8 : Math.sin(x * 0.02 + seed * 2) * amp;
            d += ` L${x} ${y - h}`;
        }
        return `${d} L400 100 L0 100 Z`;
    };
    return (
        <svg viewBox="0 0 400 100" preserveAspectRatio="none" aria-hidden="true">
            <defs>
                <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor={art.sky[0]} />
                    <stop offset="1" stopColor={art.sky[1]} />
                </linearGradient>
            </defs>
            <rect width="400" height="100" fill={`url(#${gid})`} />
            {id === 'peaks' && (
                <path d="M0 30 C 80 10, 160 45, 240 20 S 360 30, 400 15" stroke="#6fffc8" strokeOpacity="0.55" strokeWidth="6" fill="none" />
            )}
            {id === 'hollow' && <rect y="45" width="400" height="30" fill="#d9c9ff" opacity="0.18" />}
            <circle cx={id === 'peaks' ? 320 : 300} cy="26" r="10" fill={id === 'peaks' || id === 'hollow' ? '#e8efff' : '#fff6d8'} opacity="0.9" />
            <path d={ridge(62, 10, 0)} fill={art.hills[0]} />
            <path d={ridge(78, 7, 1)} fill={art.hills[1]} />
            <path d={ridge(92, 5, 2)} fill={art.hills[2]} />
        </svg>
    );
};

const EnvironmentCard = () => {
    const { t } = useTranslation();
    const game = useGameStore((s) => s.game);
    const day = getDayInfo(game.worldTime);
    const weather = WEATHER[game.weather.kind];
    const mods = getModifiers(game);
    const scale = (m: number) => 1 + (m - 1) * mods.weatherMult;
    const effect =
        game.weather.kind === 'rain'
            ? formatPercent(scale(weather.physical) - 1)
            : game.weather.kind === 'mist'
              ? formatPercent(scale(weather.ethereal) - 1)
              : formatPercent(scale(weather.physical) - 1);
    const dayBonus = 0.1 * mods.dayNightMult;
    const tod = timeOfDayKey(day.phase);
    return (
        <div className="card env-card">
            <div className="env-card__item">
                <div className="env-card__icon">
                    <Icon name={day.night ? 'moon' : 'sun'} />
                </div>
                <div>
                    <div className="env-card__label">{t(`time.${tod}`)}</div>
                    <div className="env-card__effect">
                        {day.night
                            ? `${t('essence.ethereal')} +${formatPercent(dayBonus * (1 - day.daylight))}`
                            : `${t('essence.physical')} +${formatPercent(dayBonus * day.daylight)}`}
                    </div>
                </div>
            </div>
            <div className="env-card__item">
                <div className="env-card__icon">
                    <Icon name={WEATHER_ICON[game.weather.kind]} />
                </div>
                <div>
                    <div className="env-card__value">{t(`weather.${game.weather.kind}.name`)}</div>
                    <div className="env-card__effect">
                        {t(`weather.${game.weather.kind}.desc`, { value: effect })} ·{' '}
                        {formatDuration(Math.max(0, game.weather.until - game.worldTime))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export const WorldPanel = () => {
    const { t } = useTranslation();
    const game = useGameStore((s) => s.game);
    const unlock = useGameStore((s) => s.actions.unlockZone);
    const travel = useGameStore((s) => s.actions.travel);

    return (
        <section aria-labelledby="world-title">
            <div className="section-head">
                <h2 id="world-title" className="section-title">
                    {t('tabs.world')}
                </h2>
            </div>
            <EnvironmentCard />
            <div className="subhead">{t('zones.modifiers')}</div>
            <div className="stack">
                {ZONES.map((zone) => {
                    const unlocked = game.zones.includes(zone.id);
                    const current = game.zone === zone.id;
                    const affordable = game.chi >= zone.cost;
                    return (
                        <article key={zone.id} className={`card zone ${current ? 'zone--current' : ''}`}>
                            <div className="zone__art">
                                <ZoneArt id={zone.id} />
                            </div>
                            <div className="zone__body">
                                <div className="zone__title">
                                    <span className="zone__name">{t(`zones.${zone.id}.name`)}</span>
                                    {current && <span className="chip chip--neutral">{t('zones.current')}</span>}
                                </div>
                                <div className="zone__desc">{t(`zones.${zone.id}.desc`)}</div>
                                <div className="zone__mods">
                                    <span className="chip chip--earth">
                                        {t('essence.physical')} {formatMultiplier(zone.physical)}
                                    </span>
                                    <span className="chip chip--dream">
                                        {t('essence.ethereal')} {formatMultiplier(zone.ethereal)}
                                    </span>
                                    {zone.harmony !== 1 && (
                                        <span className="chip chip--harmony">
                                            {t('hud.harmony')} {formatMultiplier(zone.harmony)}
                                        </span>
                                    )}
                                    {(Object.entries(zone.weather) as [WeatherKind, number][])
                                        .sort((a, b) => b[1] - a[1])
                                        .slice(0, 2)
                                        .map(([kind]) => (
                                            <span key={kind} className="chip">
                                                <Icon name={WEATHER_ICON[kind]} size={12} /> {t(`weather.${kind}.name`)}
                                            </span>
                                        ))}
                                </div>
                                {!current && (
                                    <div className="row">
                                        {unlocked ? (
                                            <button className="btn btn--ghost" onClick={() => travel(zone.id)}>
                                                <Icon name="map" size={15} /> {t('zones.travel')}
                                            </button>
                                        ) : (
                                            <button
                                                className={`btn ${affordable ? 'btn--gold' : ''}`}
                                                disabled={!affordable}
                                                onClick={() => unlock(zone.id)}
                                            >
                                                <Icon name={affordable ? 'map' : 'lock'} size={15} /> {t('zones.unlock')} ·{' '}
                                                <span className="num">{formatNumber(zone.cost)}</span>
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </article>
                    );
                })}
            </div>
        </section>
    );
};
