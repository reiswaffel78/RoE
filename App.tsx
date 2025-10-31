// App.tsx
import React, { useState, useEffect } from 'react';
import { useGameStore } from './store/gameStore';
import { useGameLoop } from './hooks/useGameLoop';
import TopBar from './components/TopBar';
import PlantPanel from './components/PlantPanel';
import RitualPanel from './components/RitualPanel';
import EventLog from './components/EventLog';
import ZoneMap from './components/ZoneMap';
import UpgradeShop from './components/UpgradeShop';
import EventModal from './components/EventModal';
import Settings from './components/Settings';
import SpiritDialog from './components/SpiritDialog';
import PixiBackground from './components/PixiBackground';
import OfflineProgressModal from './components/OfflineProgressModal';
import AchievementsPanel from './components/AchievementsPanel';
import PrestigePanel from './components/PrestigePanel';
import UpdateToast from './components/UpdateToast';
import { useServiceWorker } from './hooks/useServiceWorker';
import DevMenu from './components/DevMenu';

const App: React.FC = () => {
    const { currentEvent, offlineReport, actions, hydrated } = useGameStore(state => ({
        currentEvent: state.currentEvent,
        offlineReport: state.offlineReport,
        actions: state.actions,
        hydrated: state.hydrated,
    }));

    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isDevMenuOpen, setIsDevMenuOpen] = useState(false);

    const { isUpdateAvailable, reloadAndUpdate } = useServiceWorker();

    // Game loop
    useGameLoop(actions.tick, 1000, { enabled: hydrated });

    // Dev menu listener
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === '`' && e.ctrlKey) {
                setIsDevMenuOpen(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <React.Suspense fallback="Loading...">
            <PixiBackground />
            <div className="bg-slate-950 text-slate-100 min-h-screen font-sans relative z-10">
                            {!hydrated && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 z-20">
                        <div className="text-sm tracking-wide uppercase text-slate-400">Restoring the garden…</div>
                    </div>
                )}
                <TopBar onSettingsClick={() => setIsSettingsOpen(true)} />
                <main className="container mx-auto p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2 space-y-4">
                        <PlantPanel />
                        <UpgradeShop />
                        <AchievementsPanel />
                    </div>
                    <div className="space-y-4">
                        <RitualPanel />
                        <ZoneMap />
                        <PrestigePanel />
                        <SpiritDialog />
                        <EventLog />
                    </div>
                </main>
                {currentEvent && <EventModal event={currentEvent} />}
                {isSettingsOpen && <Settings onClose={() => setIsSettingsOpen(false)} />}
                {offlineReport && <OfflineProgressModal report={offlineReport} onClose={actions.clearOfflineReport} />}
                {isUpdateAvailable && <UpdateToast onUpdate={reloadAndUpdate} />}
                {isDevMenuOpen && <DevMenu onClose={() => setIsDevMenuOpen(false)} />}
            </div>
        </React.Suspense>
    );
};

export default App;
