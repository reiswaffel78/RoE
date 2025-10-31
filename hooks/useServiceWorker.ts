
// hooks/useServiceWorker.ts
import { useState, useEffect } from 'react';
import { logger } from '../services/logger';
import { getFlag } from '../utils/flags';
import { recordBootWarning, setServiceWorkerStatus } from '../utils/bootDiagnostics';

const requestServiceWorkerVersion = async (registration: ServiceWorkerRegistration): Promise<string | null> => {
    const worker = registration.active ?? registration.waiting ?? registration.installing;
    if (!worker) {
        return null;
    }

    return new Promise<string | null>((resolve) => {
        const channel = new MessageChannel();
        const timeout = window.setTimeout(() => {
            resolve(null);
        }, 1500);
        channel.port1.onmessage = (event) => {
            window.clearTimeout(timeout);
            resolve(typeof event.data?.version === 'string' ? event.data.version : null);
        };
        try {
            worker.postMessage({ type: 'GET_VERSION' }, [channel.port2]);
        } catch (error) {
            window.clearTimeout(timeout);
            console.warn('Failed to request SW version', error);
            resolve(null);
        }
    });
};

export const useServiceWorker = () => {
    const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
    const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

    useEffect(() => {
           if (!('serviceWorker' in navigator)) {
            setServiceWorkerStatus({ registered: false, bypassed: getFlag('noSW') });
            return;
        }

        if (getFlag('noSW')) {
            logger.info('Service worker registration skipped by flag.');
            setServiceWorkerStatus({ registered: false, bypassed: true });
            return;
        }

        setServiceWorkerStatus({ registered: false, bypassed: false });

        const register = async () => {
            navigator.serviceWorker.register('/sw.js').then(registration => {
                logger.info('Service Worker registered with scope:', { scope: registration.scope });
                                setServiceWorkerStatus({ registered: true, bypassed: false });

                requestServiceWorkerVersion(registration).then((version) => {
                    if (version) {
                        setServiceWorkerStatus({ registered: true, version });
                    }
                });

                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    if (newWorker) {
                        logger.info('New service worker found, installing.');
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                logger.info('New service worker installed and waiting.');
                                setWaitingWorker(newWorker);
                                setIsUpdateAvailable(true);
                            }
                        });
                    }
                });
            }).catch(error => {
                setServiceWorkerStatus({ registered: false, bypassed: false, error: error instanceof Error ? error.message : 'registration failed' });
                recordBootWarning('Service worker registration failed');
                logger.error('Service Worker registration failed:', { error });
            });
        };

        register();
    }, []);

    const reloadAndUpdate = () => {
        if (waitingWorker) {
            logger.info('Sending SKIP_WAITING to new service worker.');
            waitingWorker.postMessage({ type: 'SKIP_WAITING' });
            // The page will reload once the new worker takes control.
            // A brief delay ensures the message is sent before the reload.
            setTimeout(() => {
                window.location.reload();
            }, 100);
        }
    };

    return { isUpdateAvailable, reloadAndUpdate };
};
