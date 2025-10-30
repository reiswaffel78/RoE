
// hooks/useServiceWorker.ts
import { useState, useEffect } from 'react';
import { logger } from '../services/logger';

export const useServiceWorker = () => {
    const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
    const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

    useEffect(() => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').then(registration => {
                logger.info('Service Worker registered with scope:', { scope: registration.scope });

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
                logger.error('Service Worker registration failed:', { error });
            });
        }
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
