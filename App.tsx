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
    const { currentEvent, lastUpdate, actions } = useGameStore(state => ({
        currentEvent: state.currentEvent,
        lastUpdate: state.lastUpdate,
        actions: state.actions,
    }));

    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [showOfflineProgress, setShowOfflineProgress] = useState(false);
    const [offlineSeconds, setOfflineSeconds] = useState(0);
    const [isDevMenuOpen, setIsDevMenuOpen] = useState(false);

    const { isUpdateAvailable, reloadAndUpdate } = useServiceWorker();

    // Game loop
    useGameLoop(() => {
        actions.tick(1); // Tick every second
    }, 1000);

    // Offline progress modal
    useEffect(() => {
        const now = Date.now();
        const secondsOffline = Math.floor((now - lastUpdate) / 1000);
        if (secondsOffline > 10) {
            setOfflineSeconds(secondsOffline);
            setShowOfflineProgress(true);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run only once on mount

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
        <>
            <PixiBackground />
            <div className="bg-slate-950 text-slate-100 min-h-screen font-sans relative z-10">
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
                {showOfflineProgress && <OfflineProgressModal secondsOffline={offlineSeconds} onClose={() => setShowOfflineProgress(false)} />}
                {isUpdateAvailable && <UpdateToast onUpdate={reloadAndUpdate} />}
                {isDevMenuOpen && <DevMenu onClose={() => setIsDevMenuOpen(false)} />}
            </div>
        </>
    );
};

export default App;
