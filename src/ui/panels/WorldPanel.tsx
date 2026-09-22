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

/** Flat mini illustrations matching each zone's palette and motif. */
const ZONE_ART: Record<ZoneId, { sky: [string, string]; sun: string; layers: string[]; motif: string }> = {
    grove: { sky: ['#a3b38c', '#dcd8a8'], sun: '#f3e8bb', layers: ['#8fa07a', '#5b7454', '#2c4632', '#1c3123'], motif: 'lake' },
    desert: { sky: ['#c46a40', '#eaa465'], sun: '#f7d79c', layers: ['#d48853', '#a9562f', '#7e3f24', '#461e15'], motif: 'mesa' },
    rainforest: { sky: ['#244c52', '#6c9a92'], sun: '#cfe3d6', layers: ['#5c8a83', '#3d6b66', '#1f4643', '#0b2224'], motif: 'waterfall' },
    mountains: { sky: ['#6b82a5', '#b8c6d6'], sun: '#f3ecd4', layers: ['#93a8c0', '#6a809e', '#3a4e6a', '#152336'], motif: 'peaks' },
    aurora: { sky: ['#0c1030', '#3b2c6e'], sun: '#e8ecfb', layers: ['#3d3a78', '#2a2a5c', '#1a1c40', '#0a0d24'], motif: 'stones' },
    dreamworld: { sky: ['#48337a', '#cf93c6'], sun: '#fbe4f1', layers: ['#a37abb', '#7d5a9e', '#553c7d', '#281644'], motif: 'islands' },
};

const ZoneArt = ({ id }: { id: ZoneId }) => {
    const art = ZONE_ART[id];
    const gid = `zg-${id}`;
    const wave = (y: number, amp: number, freq: number, seed: number) => {
        let d = `M0 ${y}`;
        for (let x = 0; x <= 400; x += 10) d += ` L${x} ${(y - Math.sin(x * freq + seed) * amp - Math.sin(x * freq * 2.3 + seed) * amp * 0.4).toFixed(1)}`;
        return `${d} L400 100 L0 100 Z`;
    };
    const peaks = (y: number, h: number, seed: number) => {
        let d = `M0 ${y}`;
        for (let i = 0; i <= 8; i++) {
            const x = i * 50;
            d += ` L${x + 25} ${y - h * (0.5 + 0.5 * Math.abs(Math.sin(i * 1.7 + seed)))} L${x + 50} ${y}`;
        }
        return `${d} L400 100 L0 100 Z`;
    };
    const night = id === 'aurora';
    return (
        <svg viewBox="0 0 400 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <defs>
                <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor={art.sky[0]} />
                    <stop offset="1" stopColor={art.sky[1]} />
                </linearGradient>
            </defs>
            <rect width="400" height="100" fill={`url(#${gid})`} />
            {night && <path d="M40 40 C 120 10, 180 50, 260 18 S 360 30, 400 12" stroke="#62f0b5" strokeOpacity="0.45" strokeWidth="10" fill="none" />}
            <circle cx={id === 'desert' ? 300 : 290} cy="34" r={id === 'desert' ? 20 : 14} fill={art.sun} opacity="0.95" />
            {art.motif === 'peaks' ? (
                <>
                    <path d={peaks(70, 48, 0)} fill={art.layers[0]} />
                    <path d={peaks(82, 24, 2)} fill={art.layers[1]} />
                </>
            ) : (
                <path d={wave(62, 6, 0.02, 1)} fill={art.layers[0]} />
            )}
            {art.motif === 'mesa' && (
                <>
                    <path d="M40 72 L52 40 L96 40 L106 72 Z M300 72 L306 30 L318 22 L326 72 Z" fill={art.layers[1]} />
                    <path d="M230 80 L236 44 L292 42 L300 80 L286 80 L270 58 L252 58 L244 80 Z" fill={art.layers[2]} />
                </>
            )}
            {art.motif === 'waterfall' && (
                <>
                    <path d="M230 90 L240 30 L400 24 L400 90 Z" fill={art.layers[1]} />
                    <rect x="290" y="28" width="16" height="58" fill="#a4d2c9" opacity="0.9" />
                </>
            )}
            {art.motif === 'stones' && (
                <path d="M60 74 L64 50 L72 48 L76 74 Z M120 74 L123 58 L130 57 L133 74 Z M250 74 L254 42 L264 40 L268 74 Z M330 74 L333 56 L340 55 L343 74 Z" fill={art.layers[1]} />
            )}
            {art.motif === 'islands' && (
                <path d="M60 40 L110 40 L92 62 L80 70 Z M260 30 L300 30 L286 48 L276 54 Z M170 52 L196 52 L186 64 Z" fill={art.layers[1]} />
            )}
            {(art.motif === 'lake' || art.motif === 'stones') && <rect y="74" width="400" height="10" fill={art.layers[0]} opacity="0.45" />}
            <path d={wave(86, 3, 0.03, 3)} fill={art.layers[2]} />
            <path d={wave(96, 2, 0.05, 5)} fill={art.layers[3]} />
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
                                <div className="zone__tagline">{t(`zones.${zone.id}.tagline`)}</div>
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
