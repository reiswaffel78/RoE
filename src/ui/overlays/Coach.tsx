import { useTranslation } from 'react-i18next';
import { useGameStore } from '../../store/gameStore';

/** Lightweight onboarding: four contextual steps, skippable at any time. */
export const Coach = () => {
    const { t } = useTranslation();
    const step = useGameStore((s) => s.game.tutorial);
    const advance = useGameStore((s) => s.actions.advanceTutorial);
    if (step > 3) return null;

    return (
        <section className="coach glass" role="status" aria-live="polite">
            <div className="coach__step">
                {step + 1} / 4
            </div>
            <div className="coach__title">{t(`tutorial.step${step}.title`)}</div>
            <p className="coach__body">{t(`tutorial.step${step}.body`)}</p>
            <div className="coach__actions">
                <button className="btn btn--ghost" onClick={() => advance(99)}>
                    {t('tutorial.skip')}
                </button>
                {step === 3 && (
                    <button className="btn btn--primary" onClick={() => advance(4)}>
                        {t('tutorial.next')}
                    </button>
                )}
            </div>
        </section>
    );
};
