// components/OfflineProgressModal.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatTime } from '../utils/format';
import { formatNumber } from '../utils/format';
import { OfflineReport } from '../types';

interface OfflineProgressModalProps {
    report: OfflineReport;
    onClose: () => void;
}

const OfflineProgressModal: React.FC<OfflineProgressModalProps> = ({ report, onClose }) => {
    const { t } = useTranslation();
    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="bg-slate-800 p-6 rounded-lg shadow-xl max-w-md w-full text-center">
                <h2 className="text-2xl font-bold mb-2 text-emerald-300">{t('offline.title')}</h2>
                <p className="text-slate-300 mb-4">
                    {t('offline.body', { time: formatTime(report.secondsOffline) })}
                </p>
                <div className="bg-slate-900/50 p-3 rounded-md">
                    <p className="text-lg font-bold text-emerald-400">
                        {t('offline.gathered', { chi: formatNumber(report.chiGained) })}
                    </p>
                </div>
                <button
                    onClick={onClose}
                    className="mt-6 w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded"
                >
                    {t('offline.continue')}
                </button>
            </div>
        </div>
    );
};

export default OfflineProgressModal;
