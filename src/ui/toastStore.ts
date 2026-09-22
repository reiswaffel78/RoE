import { create } from 'zustand';
import type { IconName } from './components/Icon';

export interface Toast {
    id: number;
    kind: 'gold' | 'info' | 'warn';
    icon: IconName;
    kicker?: string;
    title: string;
    leaving?: boolean;
}

interface ToastStore {
    toasts: Toast[];
    push: (toast: Omit<Toast, 'id'>, duration?: number) => void;
}

let nextId = 1;

export const useToasts = create<ToastStore>()((set, get) => ({
    toasts: [],
    push: (toast, duration = 3600) => {
        // Collapse identical warnings (e.g. repeated "not enough chi").
        if (toast.kind === 'warn' && get().toasts.some((t) => t.title === toast.title && !t.leaving)) return;
        const id = nextId++;
        set((s) => ({ toasts: [...s.toasts.slice(-3), { ...toast, id }] }));
        window.setTimeout(() => {
            set((s) => ({ toasts: s.toasts.map((t) => (t.id === id ? { ...t, leaving: true } : t)) }));
            window.setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 420);
        }, duration);
    },
}));
