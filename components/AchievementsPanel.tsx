// components/AchievementsPanel.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../store/gameStore';
import type { Achievement } from '../types';

const AchievementsPanel: React.FC = () => {
    const { t } = useTranslation();
    const achievements = useGameStore(state => state.achievements);
    const unlockedCount = Object.values(achievements).filter((a: Achievement) => a.unlocked).length;
    const totalCount = Object.values(achievements).length;

    return (
        <div className="bg-slate-800/50 p-4 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-2 text-yellow-200">{t('achievements.title', { unlocked: unlockedCount, total: totalCount })}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {Object.values(achievements).map((ach: Achievement) => (
                    <div key={ach.id} className={`p-2 rounded text-center ${ach.unlocked ? 'bg-yellow-700/50' : 'bg-slate-700/50'}`} title={t(`achievements.${ach.id}.description`, ach.description)}>
                        <p className={`font-bold ${ach.unlocked ? 'text-yellow-200' : 'text-slate-400'}`}>{t(`achievements.${ach.id}.name`, ach.name)}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AchievementsPanel;
