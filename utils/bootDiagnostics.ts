import { getFlags, FlagSnapshot } from './flags';

export type BootStepKey = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
export type BootStepStatus = 'pending' | 'success' | 'error';

type BootStepDefinition = {
    label: string;
    status: BootStepStatus;
    detail?: string;
    timestamp: number | null;
};

type ServiceWorkerStatus = {
    registered: boolean;
    version?: string | null;
    bypassed?: boolean;
    error?: string | null;
};

type BootDiagnosticsState = {
    steps: Record<BootStepKey, BootStepDefinition>;
    flags: FlagSnapshot;
    sw: ServiceWorkerStatus;
    lastError?: {
        message: string;
        stack?: string;
        time: number;
    };
    warnings: string[];
    buildVersion: string;
};

const STEP_LABELS: Record<BootStepKey, string> = {
    A: 'DOM ready',
    B: 'Flags evaluated',
    C: 'Store initialised',
    D: 'i18n ready',
    E: 'Pixi stage',
    F: 'App mounted',
};

const listeners = new Set<() => void>();

const createInitialSteps = (): Record<BootStepKey, BootStepDefinition> => ({
    A: { label: STEP_LABELS.A, status: 'pending', timestamp: null },
    B: { label: STEP_LABELS.B, status: 'pending', timestamp: null },
    C: { label: STEP_LABELS.C, status: 'pending', timestamp: null },
    D: { label: STEP_LABELS.D, status: 'pending', timestamp: null },
    E: { label: STEP_LABELS.E, status: 'pending', timestamp: null },
    F: { label: STEP_LABELS.F, status: 'pending', timestamp: null },
});

let state: BootDiagnosticsState = {
    steps: createInitialSteps(),
    flags: getFlags(),
    sw: { registered: false, version: null, bypassed: false },
    warnings: [],
    buildVersion: import.meta.env?.VITE_APP_VERSION ?? 'dev',
};

const emit = () => {
    for (const listener of listeners) {
        listener();
    }
};

export const subscribeToBootDiagnostics = (listener: () => void): (() => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
};

export const getBootDiagnosticsState = () => state;

const updateState = (next: Partial<BootDiagnosticsState>) => {
    state = { ...state, ...next };
    emit();
};

const updateStep = (key: BootStepKey, status: BootStepStatus, detail?: string) => {
    const current = state.steps[key];
    state = {
        ...state,
        steps: {
            ...state.steps,
            [key]: {
                ...current,
                status,
                detail,
                timestamp: Date.now(),
            },
        },
    };
    emit();
};

export const markBootStepPending = (key: BootStepKey, detail?: string) => {
    const current = state.steps[key];
    state = {
        ...state,
        steps: {
            ...state.steps,
            [key]: {
                ...current,
                status: 'pending',
                detail,
                timestamp: detail ? Date.now() : current.timestamp,
            },
        },
    };
    emit();
};

export const markBootStepSuccess = (key: BootStepKey, detail?: string) => {
    updateStep(key, 'success', detail);
};

export const markBootStepError = (key: BootStepKey, detail?: string) => {
    updateStep(key, 'error', detail);
};

export const refreshFlags = (flags: FlagSnapshot) => {
    updateState({ flags });
};

export const setServiceWorkerStatus = (status: ServiceWorkerStatus) => {
    updateState({ sw: { ...state.sw, ...status } });
};

export const recordBootWarning = (warning: string) => {
    if (state.warnings.includes(warning)) {
        return;
    }
    updateState({ warnings: [...state.warnings, warning] });
};

export const recordLastError = (error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    updateState({
        lastError: {
            message,
            stack,
            time: Date.now(),
        },
    });
};

let consolePatched = false;

export const patchConsoleError = () => {
    if (consolePatched) {
        return;
    }
    consolePatched = true;
    const originalError = console.error;
    console.error = (...args: unknown[]) => {
        if (args.length > 0) {
            recordLastError(args[0]);
        }
        originalError.apply(console, args as [unknown]);
    };
};

export const resetBootDiagnostics = () => {
    state = {
        steps: createInitialSteps(),
        flags: getFlags(),
        sw: { registered: false, version: null, bypassed: false },
        warnings: [],
        buildVersion: import.meta.env?.VITE_APP_VERSION ?? 'dev',
        lastError: undefined,
    };
    emit();
};