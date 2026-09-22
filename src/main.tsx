import '@fontsource-variable/fraunces';
import '@fontsource-variable/inter';
import './styles/main.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { initI18n } from './i18n';
import { startGameLoop, useGameStore } from './store/gameStore';
import { useSettings } from './store/settingsStore';
import { App } from './ui/App';
import { ErrorBoundary } from './ui/ErrorBoundary';
import { registerServiceWorker } from './pwa';

initI18n(useSettings.getState().language);
const stopLoop = startGameLoop();
if (import.meta.env.DEV) (window as unknown as { __store: typeof useGameStore }).__store = useGameStore;

const root = document.getElementById('root');
if (!root) throw new Error('#root missing');

createRoot(root).render(
    <StrictMode>
        <ErrorBoundary>
            <App />
        </ErrorBoundary>
    </StrictMode>,
);

registerServiceWorker();

if (import.meta.hot) import.meta.hot.dispose(stopLoop);
