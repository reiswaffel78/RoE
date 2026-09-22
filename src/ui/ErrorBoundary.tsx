import { Component, type ReactNode } from 'react';

interface State {
    error: Error | null;
}

/** Last line of defence: never show a black screen. */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
    state: State = { error: null };

    static getDerivedStateFromError(error: Error): State {
        return { error };
    }

    componentDidCatch(error: Error) {
        console.error('UI crashed', error);
    }

    render() {
        if (!this.state.error) return this.props.children;
        return (
            <div className="error-screen" role="alert">
                <div>
                    <h1 className="display">Der Garten hat den Faden verloren</h1>
                    <p style={{ color: 'var(--ink-2)' }}>The garden lost its thread. Your progress is saved.</p>
                    <pre style={{ color: 'var(--ink-3)', whiteSpace: 'pre-wrap', maxWidth: 520 }}>{this.state.error.message}</pre>
                    <button className="btn btn--primary" onClick={() => window.location.reload()}>
                        Neu laden / Reload
                    </button>
                </div>
            </div>
        );
    }
}
