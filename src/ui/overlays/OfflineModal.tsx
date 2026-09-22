import { useTranslation } from 'react-i18next';
import { useGameStore } from '../../store/gameStore';
import { formatDuration, formatNumber, formatPercent } from '../../utils/format';
import { Icon } from '../components/Icon';
import { Modal } from '../components/Modal';

export const OfflineModal = () => {
    const { t } = useTranslation();
    const report = useGameStore((s) => s.offlineReport);
    const dismiss = useGameStore((s) => s.actions.dismissOffline);
    if (!report) return null;
    return (
        <Modal title={t('offline.title')} onClose={dismiss}>
            <p className="modal__text">{t('offline.body', { time: formatDuration(report.seconds) })}</p>
            <div className="offline-stats">
                <div className="offline-stat">
                    <div className="offline-stat__value num" style={{ color: 'var(--chi)' }}>
                        <Icon name="chi" size={20} /> {formatNumber(report.chi)}
                    </div>
                    <div className="offline-stat__label">{t('offline.chi')}</div>
                </div>
                <div className="offline-stat">
                    <div className="offline-stat__value num" style={{ color: 'var(--harmony)' }}>
                        <Icon name="harmony" size={20} /> {formatNumber(report.harmony, true)}
                    </div>
                    <div className="offline-stat__label">{t('offline.harmony')}</div>
                </div>
            </div>
            <p className="note">{t('offline.efficiency', { value: formatPercent(report.efficiency) })}</p>
            <div className="modal__actions">
                <button className="btn btn--primary" onClick={dismiss}>
                    {t('offline.continue')}
                </button>
            </div>
        </Modal>
    );
};
