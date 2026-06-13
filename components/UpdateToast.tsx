// components/UpdateToast.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';

interface UpdateToastProps {
    onUpdate: () => void;
}

const UpdateToast: React.FC<UpdateToastProps> = ({ onUpdate }) => {
    const { t } = useTranslation();
    return (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg flex items-center gap-4 z-50">
            <div>
                <p className="font-bold">{t('update.title')}</p>
                <p className="text-sm">{t('update.body')}</p>
            </div>
            <button
                onClick={onUpdate}
                className="bg-white text-blue-600 font-bold py-1 px-3 rounded hover:bg-blue-100"
            >
                {t('update.reload')}
            </button>
        </div>
    );
};

export default UpdateToast;
