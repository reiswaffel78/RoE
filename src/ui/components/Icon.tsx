// Hand-drawn stroke icon set (24×24, currentColor).
import type { SVGProps } from 'react';

const PATHS = {
    leaf: 'M5 19c2-9 7-13 15-14-1 8-5 13-14 15M5 19l7-7',
    chi: 'M12 3c3 4 6 7 6 11a6 6 0 0 1-12 0c0-4 3-7 6-11zM9.5 14.5a2.5 2.5 0 0 0 2.5 2.5',
    harmony: 'M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.5-7 10-7 10z',
    wisdom: 'M12 3l2.4 5 5.6.8-4 3.9 1 5.5L12 15.6 7 18.2l1-5.5-4-3.9 5.6-.8z',
    sun: 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
    moon: 'M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z',
    rain: 'M7 15a4 4 0 0 1 .5-8A5.5 5.5 0 0 1 18 8a3.5 3.5 0 0 1-.5 7zM8 18l-1 3M12 18l-1 3M16 18l-1 3',
    mist: 'M4 9h16M3 13h18M5 17h14M8 5h8',
    aurora: 'M3 17c3-8 5-8 6-3s3 5 5-3 4-5 7 2M3 21h18',
    clear: 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
    settings:
        'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
    volume: 'M11 5L6 9H2v6h4l5 4zM15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14',
    mute: 'M11 5L6 9H2v6h4l5 4zM22 9l-6 6M16 9l6 6',
    close: 'M18 6L6 18M6 6l12 12',
    ritual: 'M12 22c4.5 0 7-3 7-7 0-3-2-5.5-4-7 0 2.5-1.5 4-3 4 1-3 0-6-3-8 0 4-4 6-4 11 0 4 2.5 7 7 7z',
    book: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5zM4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5',
    map: 'M9 4L3 6v14l6-2 6 2 6-2V4l-6 2zM9 4v14M15 6v14',
    cycle: 'M21 12a9 9 0 0 1-15.5 6.2M3 12A9 9 0 0 1 18.5 5.8M18 2v4h-4M6 22v-4h4',
    scroll: 'M8 21h10a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H8M8 21a2 2 0 0 1-2-2V5a2 2 0 1 0-4 0v2h4M8 21a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2M11 8h6M11 12h6M11 16h4',
    lock: 'M6 11h12v10H6zM8 11V7a4 4 0 0 1 8 0v4',
    check: 'M20 6L9 17l-5-5',
    clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2',
    hand: 'M18 11V6a2 2 0 0 0-4 0v5M14 10V4a2 2 0 0 0-4 0v6M10 10.5V6a2 2 0 0 0-4 0v8a8 8 0 0 0 16 0v-3a2 2 0 0 0-4 0',
    eye: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
    spark: 'M12 2v6M12 16v6M2 12h6M16 12h6M5 5l3.5 3.5M15.5 15.5L19 19M5 19l3.5-3.5M15.5 8.5L19 5',
    balance: 'M12 3v18M5 7h14M5 7l-3 7a3 3 0 0 0 6 0zM19 7l-3 7a3 3 0 0 0 6 0zM8 21h8',
    heart: 'M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.5-7 10-7 10z',
    tree: 'M12 22v-6M8 16h8a4 4 0 0 0 1-7.9A5 5 0 0 0 7 8.1 4 4 0 0 0 8 16z',
    mountain: 'M3 20l6-11 4 7 3-4 5 8z',
    info: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 16v-4M12 8h.01',
    download: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3',
    upload: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12',
    copy: 'M9 9h11v11H9zM5 15H4V4h11v1',
    sprite: 'M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5zM18 16l.8 2.2L21 19l-2.2.8L18 22l-.8-2.2L15 19l2.2-.8z',
    deer: 'M8 3v4l-3-2M16 3v4l3-2M8 7c0 3 1 4 4 4s4-1 4-4M12 11v4M9 21l3-6 3 6',
    traveler: 'M13 4a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM9 22l2-7 3 3v6M11 15l1-6 4 3 3 1M8 10l4-1',
    star: 'M12 3l2.4 5 5.6.8-4 3.9 1 5.5L12 15.6 7 18.2l1-5.5-4-3.9 5.6-.8z',
    voice: 'M3 12h2M7 8v8M11 5v14M15 8v8M19 11v2',
    chevron: 'M9 6l6 6-6 6',
    earth: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20',
} as const;

export type IconName = keyof typeof PATHS;

interface IconProps extends SVGProps<SVGSVGElement> {
    name: IconName;
    size?: number;
}

export const Icon = ({ name, size = 18, ...rest }: IconProps) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
        {...rest}
    >
        <path d={PATHS[name]} />
    </svg>
);
