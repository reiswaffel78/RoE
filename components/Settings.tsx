// components/Settings.tsx
import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { exportGameData, importGameData } from '../services/storage';
import { useGameStore } from '../store/gameStore';
import useAudioController from '../hooks/useAudioController';

interface SettingsProps {
    onClose: () => void;
}

const LANGUAGES: { code: string; label: string }[] = [
    { code: 'en', label: 'English' },
    { code: 'de', label: 'Deutsch' },
];

const Settings: React.FC<SettingsProps> = ({ onClose }) => {
    const { t, i18n } = useTranslation();
    const { importState, reset } = useGameStore(state => state.actions);
    const importInputRef = useRef<HTMLInputElement>(null);

    const {
        musicVolume,
        sfxVolume,
        isMusicMuted,
        isSfxMuted,
        setMusicVolume,
        setSfxVolume,
        toggleMusic,
        toggleSfx,
    } = useAudioController();

    const handleImportClick = () => {
        importInputRef.current?.click();
    };

    const activeLanguage = (i18n.resolvedLanguage ?? i18n.language ?? 'en').split('-')[0];

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-slate-800 p-6 rounded-lg shadow-xl max-w-lg w-full" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold mb-4">{t('settings.title')}</h2>

                <div className="mb-4">
                    <h3 className="text-lg font-semibold mb-2">{t('settings.audio')}</h3>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <label className="w-28 text-sm text-slate-300">{t('settings.music')}</label>
                            <input
                                type="range"
                                min={0}
                                max={1}
                                step={0.05}
                                value={musicVolume}
                                onChange={e => setMusicVolume(Number(e.target.value))}
                                className="flex-1 accent-emerald-500"
                            />
                            <button
                                onClick={toggleMusic}
                                className="bg-slate-700 hover:bg-slate-600 text-white text-sm py-1 px-3 rounded w-20"
                            >
                                {isMusicMuted ? t('settings.unmute') : t('settings.mute')}
                            </button>
                        </div>
                        <div className="flex items-center gap-3">
                            <label className="w-28 text-sm text-slate-300">{t('settings.sfx')}</label>
                            <input
                                type="range"
                                min={0}
                                max={1}
                                step={0.05}
                                value={sfxVolume}
                                onChange={e => setSfxVolume(Number(e.target.value))}
                                className="flex-1 accent-emerald-500"
                            />
                            <button
                                onClick={toggleSfx}
                                className="bg-slate-700 hover:bg-slate-600 text-white text-sm py-1 px-3 rounded w-20"
                            >
                                {isSfxMuted ? t('settings.unmute') : t('settings.mute')}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mb-4">
                    <h3 className="text-lg font-semibold mb-2">{t('settings.language')}</h3>
                    <div className="flex gap-2">
                        {LANGUAGES.map(lang => (
                            <button
                                key={lang.code}
                                onClick={() => i18n.changeLanguage(lang.code)}
                                className={`py-1 px-4 rounded text-sm font-bold ${
                                    activeLanguage === lang.code
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                                }`}
                            >
                                {lang.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mb-4">
                    <h3 className="text-lg font-semibold mb-2">{t('settings.data')}</h3>
                    <div className="flex gap-2">
                        <button onClick={exportGameData} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded">
                            {t('settings.export')}
                        </button>
                        <button onClick={handleImportClick} className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded">
                            {t('settings.import')}
                        </button>
                        <input
                            type="file"
                            accept=".json"
                            ref={importInputRef}
                            className="hidden"
                            onChange={(e) => importGameData(e, importState)}
                        />
                    </div>
                </div>
                 <div className="mt-4 border-t border-slate-700 pt-4">
                     <button onClick={reset} className="bg-red-700 hover:bg-red-600 text-white font-bold py-2 px-4 rounded w-full">
                        {t('settings.reset')}
                    </button>
                </div>


                <button onClick={onClose} className="mt-6 bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded w-full">
                    {t('settings.close')}
                </button>
            </div>
        </div>
    );
};

export default Settings;
