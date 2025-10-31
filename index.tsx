import React, { StrictMode, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import BootDiagnostics from './components/BootDiagnostics';
import AppErrorBoundary from './components/AppErrorBoundary';
import { initializeI18n } from './i18n/setup';
import { refreshFlagsCache } from './utils/flags';
import {
    markBootStepError,
    markBootStepPending,
    markBootStepSuccess,
    patchConsoleError,
    refreshFlags,
    recordLastError,
    setServiceWorkerStatus,
} from './utils/bootDiagnostics';
import { useGameStore } from './store/gameStore';

patchConsoleError();

const ensureDomReady = async () => {
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        return;
    }
    await new Promise<void>((resolve) => {
        document.addEventListener('DOMContentLoaded', () => resolve(), { once: true });
    });
};

const handleServiceWorkerBypass = async (noSW: boolean) => {
    if (!('serviceWorker' in navigator)) {
        setServiceWorkerStatus({ registered: false, bypassed: noSW });
        return;
    }

    if (noSW) {
        try {
            const registrations = await navigator.serviceWorker.getRegistrations();
            await Promise.all(registrations.map((registration) => registration.unregister()));
            setServiceWorkerStatus({ registered: false, bypassed: true, version: null });
        } catch (error) {
            setServiceWorkerStatus({
                registered: false,
                bypassed: true,
                error: error instanceof Error ? error.message : String(error),
            });
            console.warn('Failed to unregister service workers', error);
        }
    } else {
        setServiceWorkerStatus({ registered: false, bypassed: false });
    }
};

const RootShell: React.FC = () => {
    const notifiedRef = React.useRef(false);

    useEffect(() => {
        if (!notifiedRef.current) {
            markBootStepSuccess('F', 'App mounted');
            notifiedRef.current = true;
        }
    }, []);

    return (
        <>
            <AppErrorBoundary>
                <App />
            </AppErrorBoundary>
            <BootDiagnostics />
        </>
    );
};

const bootstrap = async () => {
    try {
        markBootStepPending('A', 'Waiting for DOM');
        await ensureDomReady();
        markBootStepSuccess('A', 'DOM ready');
    } catch (error) {
        markBootStepError('A', 'DOM failed to initialise');
        recordLastError(error);
        throw error;
    }

    const rootElement = document.getElementById('root');
    if (!rootElement) {
        const message = '#root element missing';
        markBootStepError('A', message);
        throw new Error(message);
    }

    const flags = refreshFlagsCache();
    refreshFlags(flags);
    markBootStepSuccess('B', `Flags evaluated (safe=${flags.safe ? 'on' : 'off'})`);

    await handleServiceWorkerBypass(flags.noSW);

    const root = ReactDOM.createRoot(rootElement);
    root.render(
        <StrictMode>
            <BootDiagnostics />
        </StrictMode>,
    );

    try {
        useGameStore.getState();
        markBootStepSuccess('C', 'Zustand store ready');
    } catch (error) {
        markBootStepError('C', 'Store initialisation failed');
        recordLastError(error);
    }

    if (flags.noPixi) {
        markBootStepSuccess('E', 'Pixi disabled via flag');
    } else {
        markBootStepPending('E', 'Awaiting Pixi stage');
    }

    markBootStepPending('D', 'Initialising i18n');
    await initializeI18n();

    root.render(
        <StrictMode>
            <RootShell />
        </StrictMode>,
    );
};

bootstrap().catch((error) => {
    recordLastError(error);
    markBootStepError('F', 'Bootstrap failure');
});