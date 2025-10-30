// components/Icons.tsx
import React from 'react';

export const LeafIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
    <path d="M11.964 3.013c.245-.226.586-.25.864-.068l.06.049c.24.195.347.51.272.805l-.03.11-4.99 9.98a.75.75 0 01-1.332.09l-.02-.05-1.996-3.992a.75.75 0 01.326-1.002l.11-.048 7.705-3.853z" />
    <path d="M10.5 17.5c.053 0 .106.002.158.006l.092.006c2.484.204 4.81-1.66 5.014-4.144l.02-.242a5.25 5.25 0 00-9.842-2.126l-2.036 4.072a.75.75 0 00.128.92l.09.088a.75.75 0 00.932.128l.1-.05A5.25 5.25 0 0010.5 17.5z" />
  </svg>
);

export const MapIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252c-.317-.159-.69-.159-1.006 0L4.628 5.186c-.748.374-1.228 1.144-1.228 1.966v9.028c0 .822.48 1.592 1.228 1.966l4.875 2.437c.317.159.69.159 1.006 0z" />
  </svg>
);

export const UpgradeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
  </svg>
);

export const UsersIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m-7.5-2.962c.57-.063 1.14-.095 1.722-.095m-8.122 3.053a9.094 9.094 0 012.741-.479 3 3 0 014.682-2.72m-8.122-2.962c.57.063 1.14.095 1.722.095m12.54 1.682A9.094 9.094 0 0018 18.72m-7.5-2.962a3 3 0 00-3-3H6a3 3 0 00-3 3v.156c0 .533.213.992.553 1.348l1.328 1.328c.34.34.815.553 1.348.553h1.374c.533 0 .992-.213 1.348-.553l1.328-1.328a1.83 1.83 0 00.553-1.348V15.75m-7.5-2.962a3 3 0 00-3-3H6a3 3 0 00-3 3v.156c0 .533.213.992.553 1.348l1.328 1.328c.34.34.815.553 1.348.553h1.374c.533 0 .992-.213 1.348-.553l1.328-1.328a1.83 1.83 0 00.553-1.348V15.75" />
  </svg>
);

export const SunIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
  </svg>
);

export const MoonIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
  </svg>
);
