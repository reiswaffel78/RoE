import { useEffect, useState, useSyncExternalStore } from 'react';

const MOBILE_QUERY = '(max-width: 1023px), (max-aspect-ratio: 4/5)';

const subscribeMedia = (cb: () => void) => {
    const mq = window.matchMedia(MOBILE_QUERY);
    mq.addEventListener('change', cb);
    return () => mq.removeEventListener('change', cb);
};

export const useIsMobile = () =>
    useSyncExternalStore(subscribeMedia, () => window.matchMedia(MOBILE_QUERY).matches, () => false);

/** Re-renders the component every `ms` milliseconds. */
export const useNow = (ms = 1000) => {
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        const id = window.setInterval(() => setNow(Date.now()), ms);
        return () => window.clearInterval(id);
    }, [ms]);
    return now;
};

export const useWindowSize = () => {
    const [size, setSize] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }));
    useEffect(() => {
        const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight });
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);
    return size;
};
