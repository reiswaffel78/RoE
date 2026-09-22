import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { geminiWhisper, localWhisper } from '../../services/spirit';
import { useGameStore } from '../../store/gameStore';
import { useSettings } from '../../store/settingsStore';

const FIRST_DELAY = 20_000;
const INTERVAL = 55_000;
const VISIBLE = 13_000;

export const Whisper = () => {
    const { t, i18n } = useTranslation();
    const [text, setText] = useState<string | null>(null);
    const [leaving, setLeaving] = useState(false);

    useEffect(() => {
        let hideTimer = 0;
        let removeTimer = 0;
        const show = async () => {
            const { game } = useGameStore.getState();
            if (game.tutorial < 3 || game.activeEvent) return;
            const key = useSettings.getState().geminiKey.trim();
            const line = (key && (await geminiWhisper(key, game, i18n.language))) || localWhisper(t, game);
            setLeaving(false);
            setText(line);
            hideTimer = window.setTimeout(() => setLeaving(true), VISIBLE);
            removeTimer = window.setTimeout(() => setText(null), VISIBLE + 1200);
        };
        const first = window.setTimeout(show, FIRST_DELAY);
        const interval = window.setInterval(show, INTERVAL);
        return () => {
            window.clearTimeout(first);
            window.clearInterval(interval);
            window.clearTimeout(hideTimer);
            window.clearTimeout(removeTimer);
        };
    }, [t, i18n.language]);

    if (!text) return null;
    return (
        <div className={`whisper glass ${leaving ? 'whisper--out' : ''}`} role="status" aria-live="polite">
            <div className="whisper__label">{t('whispers.header')}</div>
            <div className="whisper__text">{text}</div>
        </div>
    );
};
