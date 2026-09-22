import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { setLanguage } from '../../i18n';
import { useGameStore } from '../../store/gameStore';
import { decodeSave, encodeSave } from '../../store/persistence';
import { useSettings, type Language, type Quality } from '../../store/settingsStore';
import { Icon } from '../components/Icon';
import { Modal } from '../components/Modal';

const Switch = ({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) => (
    <button className="switch" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)} />
);

const Slider = ({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) => (
    <input
        className="slider"
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={value}
        aria-label={label}
        style={{ ['--v' as string]: `${value * 100}%` }}
        onChange={(e) => onChange(Number(e.target.value))}
    />
);

export const SettingsModal = ({ onClose }: { onClose: () => void }) => {
    const { t } = useTranslation();
    const settings = useSettings();
    const actions = useGameStore((s) => s.actions);
    const [importText, setImportText] = useState('');
    const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
    const [confirmReset, setConfirmReset] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    const exportSave = async () => {
        const code = encodeSave(useGameStore.getState().game);
        try {
            await navigator.clipboard.writeText(code);
            setNote({ ok: true, text: t('settings.exportCopied') });
        } catch {
            setImportText(code);
        }
    };

    const download = () => {
        const code = encodeSave(useGameStore.getState().game);
        const blob = new Blob([code], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `roots-of-the-earth-${new Date().toISOString().slice(0, 10)}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const applyImport = (text: string) => {
        try {
            actions.importGame(decodeSave(text));
            setNote({ ok: true, text: t('settings.importDone') });
            setImportText('');
        } catch {
            setNote({ ok: false, text: t('settings.importError') });
        }
    };

    const setLang = (language: Language) => {
        settings.set({ language });
        setLanguage(language);
    };

    return (
        <Modal title={t('settings.title')} onClose={onClose}>
            <div className="settings-group">
                <h3>{t('settings.general')}</h3>
                <div className="setting">
                    <label>{t('settings.language')}</label>
                    <div className="segmented">
                        {(['de', 'en'] as Language[]).map((l) => (
                            <button key={l} aria-pressed={settings.language === l} onClick={() => setLang(l)}>
                                {l === 'de' ? 'Deutsch' : 'English'}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="setting">
                    <label>{t('settings.numbers')}</label>
                    <div className="segmented">
                        <button
                            aria-pressed={settings.numberFormat === 'short'}
                            onClick={() => settings.set({ numberFormat: 'short' })}
                        >
                            1.2M
                        </button>
                        <button
                            aria-pressed={settings.numberFormat === 'scientific'}
                            onClick={() => settings.set({ numberFormat: 'scientific' })}
                        >
                            1.2e6
                        </button>
                    </div>
                </div>
            </div>

            <div className="settings-group">
                <h3>{t('settings.graphics')}</h3>
                <div className="setting">
                    <label>{t('settings.quality')}</label>
                    <div className="segmented">
                        {(['low', 'medium', 'high'] as Quality[]).map((q) => (
                            <button key={q} aria-pressed={settings.quality === q} onClick={() => settings.set({ quality: q })}>
                                {t(`settings.quality${q[0].toUpperCase()}${q.slice(1)}`)}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="setting">
                    <label>{t('settings.reducedMotion')}</label>
                    <Switch
                        checked={settings.reducedMotion}
                        label={t('settings.reducedMotion')}
                        onChange={(v) => settings.set({ reducedMotion: v })}
                    />
                </div>
            </div>

            <div className="settings-group">
                <h3>{t('settings.audio')}</h3>
                <div className="setting">
                    <label>{t('settings.music')}</label>
                    <Slider value={settings.musicVolume} label={t('settings.music')} onChange={(v) => settings.set({ musicVolume: v })} />
                </div>
                <div className="setting">
                    <label>{t('settings.sfx')}</label>
                    <Slider value={settings.sfxVolume} label={t('settings.sfx')} onChange={(v) => settings.set({ sfxVolume: v })} />
                </div>
                <div className="setting">
                    <label>{t('settings.mute')}</label>
                    <Switch checked={settings.muted} label={t('settings.mute')} onChange={(v) => settings.set({ muted: v })} />
                </div>
            </div>

            <div className="settings-group">
                <h3>{t('settings.spirit')}</h3>
                <p className="note" style={{ marginTop: 0 }}>
                    {t('settings.spiritHint')}
                </p>
                <input
                    className="input"
                    type="password"
                    autoComplete="off"
                    placeholder={t('settings.spiritKey')}
                    aria-label={t('settings.spiritKey')}
                    value={settings.geminiKey}
                    onChange={(e) => settings.set({ geminiKey: e.target.value })}
                    style={{ marginTop: 8 }}
                />
            </div>

            <div className="settings-group">
                <h3>{t('settings.data')}</h3>
                <div className="row">
                    <button className="btn btn--ghost" onClick={exportSave}>
                        <Icon name="copy" size={15} /> {t('settings.export')}
                    </button>
                    <button className="btn btn--ghost" onClick={download}>
                        <Icon name="download" size={15} /> {t('settings.download')}
                    </button>
                    <button className="btn btn--ghost" onClick={() => fileRef.current?.click()}>
                        <Icon name="upload" size={15} /> {t('settings.importFile')}
                    </button>
                    <input
                        ref={fileRef}
                        type="file"
                        accept=".txt,.json"
                        hidden
                        onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) applyImport(await file.text());
                            e.target.value = '';
                        }}
                    />
                </div>
                <textarea
                    className="textarea"
                    style={{ marginTop: 10 }}
                    placeholder={t('settings.importPlaceholder')}
                    aria-label={t('settings.import')}
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                />
                <div className="row" style={{ marginTop: 8 }}>
                    <button className="btn btn--ghost" disabled={!importText.trim()} onClick={() => applyImport(importText)}>
                        {t('settings.importApply')}
                    </button>
                </div>
                {note && <p className={`note ${note.ok ? 'note--ok' : 'note--bad'}`}>{note.text}</p>}
            </div>

            <div className="settings-group">
                <h3>{t('settings.shortcuts')}</h3>
                <p className="note" style={{ marginTop: 0 }}>
                    {t('settings.shortcutList')}
                </p>
            </div>

            <div className="modal__actions" style={{ justifyContent: 'space-between' }}>
                <button
                    className="btn btn--danger"
                    onClick={() => {
                        if (!confirmReset) {
                            setConfirmReset(true);
                            return;
                        }
                        actions.resetGame();
                        setConfirmReset(false);
                        onClose();
                    }}
                >
                    {confirmReset ? t('settings.resetConfirm') : t('settings.reset')}
                </button>
                <button className="btn btn--primary" onClick={onClose}>
                    {t('settings.close')}
                </button>
            </div>
            <p className="note" style={{ textAlign: 'right' }}>
                {t('settings.version', { value: __APP_VERSION__ })}
            </p>
        </Modal>
    );
};
