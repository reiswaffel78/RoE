
import React from 'react';
import { useGameStore } from './store/gameStore';
import { useGameLoop } from './hooks/useGameLoop';
import { logger } from './services/logger';
import PixiBackground from './components/PixiBackground';
import TopBar from './components/TopBar';
import PlantPanel from './components/PlantPanel';
import { Tooltip } from 'react-tooltip';
import RitualPanel from './components/RitualPanel';
import UpgradeShop from './components/UpgradeShop';
import ZoneMap from './components/ZoneMap';
import SpiritDialog from './components/SpiritDialog';
import EventLog from './components/EventLog';

const App: React.FC = () => {
    const tick = useGameStore(state => state.tick);
    
    // Main game loop, 1 tick per second
    useGameLoop(tick, 1000);

    return (
        <div className="bg-slate-900 font-sans text-slate-200 min-h-screen">
            <PixiBackground />
            
            <div className="relative z-10 flex flex-col min-h-screen">
                <TopBar />
                
                <main className="flex-grow p-4">
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 max-w-7xl mx-auto">
                        {/* Left Column */}
                        <div className="lg:col-span-2 space-y-6">
                            <PlantPanel />
                            <RitualPanel />
                            <UpgradeShop />
                        </div>
                        
                        {/* Right Column */}
                        <div className="lg:col-span-3 space-y-6">
                            <ZoneMap />
                            <SpiritDialog />
                        </div>
                    </div>

                    {/* Event Log at the bottom */}
                    <div className="max-w-7xl mx-auto mt-6">
                        <EventLog />
                    </div>
                </main>
            </div>
            
            <Tooltip id="app-tooltip" />
        </div>
    );
};

export default App;