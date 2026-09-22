import { useTranslation } from 'react-i18next';
import { EVENT_BY_ID } from '../../core';
import { useGameStore } from '../../store/gameStore';
import { formatNumber } from '../../utils/format';
import { Icon, type IconName } from '../components/Icon';

const EVENT_ICON: Record<string, IconName> = {
    sprite: 'sprite',
    deer: 'deer',
    traveler: 'traveler',
    star: 'star',
    voice: 'voice',
    moon: 'moon',
    rain: 'rain',
};

export const EventCard = () => {
    const { t } = useTranslation();
    const id = useGameStore((s) => s.game.activeEvent);
    const cps = useGameStore((s) => s.rates.cps);
    const resolve = useGameStore((s) => s.actions.resolveEvent);
    if (!id) return null;
    const def = EVENT_BY_ID[id];
    if (!def) return null;

    return (
        <section className="event glass" role="dialog" aria-labelledby="event-title" aria-describedby="event-text">
            <div className="event__head">
                <div className="event__icon">
                    <Icon name={EVENT_ICON[def.icon] ?? 'sprite'} size={22} />
                </div>
                <div>
                    <div className="event__kicker">{t('events.visitor')}</div>
                    <div className="event__title" id="event-title">
                        {t(`events.${id}.title`)}
                    </div>
                </div>
            </div>
            <p className="event__text" id="event-text">
                {t(`events.${id}.text`)}
            </p>
            <div className="event__choices">
                {def.choices.map((choice) => {
                    const o = choice.outcome;
                    const chi = o.chiSeconds ? Math.max(o.chiMin ?? 0, cps * o.chiSeconds) : 0;
                    const harmony = (o.harmonyFlat ?? 0) + (o.harmonyPerLog ?? 0) * Math.log10(1 + cps);
                    return (
                        <button key={choice.id} className="choice" onClick={() => resolve(choice.id)}>
                            <span className="choice__label">{t(`events.${id}.choices.${choice.id}.label`)}</span>
                            <span className="choice__hint">
                                {t(`events.${id}.choices.${choice.id}.hint`, {
                                    chi: formatNumber(chi),
                                    harmony: formatNumber(harmony, true),
                                })}
                            </span>
                        </button>
                    );
                })}
            </div>
        </section>
    );
};
