import { useTranslation } from 'react-i18next';
import { useGameStore } from '../../store/gameStore';
import { Modal } from '../components/Modal';

/** Ctrl + ` (or ?dev=1): tools for testing progression quickly. */
export const DevMenu = ({ onClose }: { onClose: () => void }) => {
    const { t } = useTranslation();
    const actions = useGameStore((s) => s.actions);
    const game = useGameStore((s) => s.game);

    const setWeather = (kind: 'clear' | 'rain' | 'mist' | 'aurora') =>
        useGameStore.setState((s) => ({ game: { ...s.game, weather: { kind, until: s.game.worldTime + 180 } } }));

    return (
        <Modal title={t('dev.title')} onClose={onClose} className="dev">
            <div className="settings-group">
                <h3>Chi</h3>
                <div className="row">
                    {[1e3, 1e6, 1e9, 1e12].map((v) => (
                        <button key={v} className="btn btn--ghost" onClick={() => actions.devAddChi(v)}>
                            +{v.toExponential(0)}
                        </button>
                    ))}
                    <button className="btn btn--ghost" onClick={() => actions.devAddHarmony(100)}>
                        +100 H
                    </button>
                </div>
            </div>
            <div className="settings-group">
                <h3>Time</h3>
                <div className="row">
                    {[60, 300, 3600].map((s) => (
                        <button key={s} className="btn btn--ghost" onClick={() => actions.devWarp(s)}>
                            +{s}s
                        </button>
                    ))}
                </div>
            </div>
            <div className="settings-group">
                <h3>Weather</h3>
                <div className="row">
                    {(['clear', 'rain', 'mist', 'aurora'] as const).map((w) => (
                        <button key={w} className="btn btn--ghost" onClick={() => setWeather(w)}>
                            {w}
                        </button>
                    ))}
                </div>
            </div>
            <div className="settings-group">
                <h3>Balance {Math.round(game.balance)}</h3>
                <div className="row">
                    {[0, 25, 50, 75, 100].map((b) => (
                        <button key={b} className="btn btn--ghost" onClick={() => actions.devSetBalance(b)}>
                            {b}
                        </button>
                    ))}
                </div>
            </div>
            <div className="settings-group">
                <h3>Event</h3>
                <div className="row">
                    <button
                        className="btn btn--ghost"
                        onClick={() => useGameStore.setState((s) => ({ game: { ...s.game, nextEventAt: s.game.worldTime, tutorial: 99 } }))}
                    >
                        Spawn event
                    </button>
                </div>
            </div>
        </Modal>
    );
};
