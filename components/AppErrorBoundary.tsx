diff --git a/components/AppErrorBoundary.tsx b/components/AppErrorBoundary.tsx
new file mode 100644
index 0000000000000000000000000000000000000000..8966434fd3a9d2a881c135887c4dbdc9e5c3d0e8
--- /dev/null
+++ b/components/AppErrorBoundary.tsx
@@ -0,0 +1,76 @@
+import React from 'react';
+import { markBootStepError, markBootStepPending, recordLastError } from '../utils/bootDiagnostics';
+
+interface AppErrorBoundaryProps {
+    children: React.ReactNode;
+}
+
+interface AppErrorBoundaryState {
+    hasError: boolean;
+    error?: Error;
+}
+
+class AppErrorBoundary extends React.Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
+    state: AppErrorBoundaryState = { hasError: false };
+
+    static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
+        return { hasError: true, error };
+    }
+
+    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
+        recordLastError(error);
+        markBootStepError('F', error.message ?? 'App crashed');
+        console.error('App rendering error', error, errorInfo);
+    }
+
+    private handleRetry = () => {
+        this.setState({ hasError: false, error: undefined });
+        markBootStepPending('F', 'Retrying render');
+        requestAnimationFrame(() => {
+            markBootStepPending('F');
+        });
+    };
+
+    render() {
+        if (this.state.hasError) {
+            return (
+                <div
+                    style={{
+                        display: 'flex',
+                        flexDirection: 'column',
+                        alignItems: 'center',
+                        justifyContent: 'center',
+                        minHeight: '100vh',
+                        background: '#020617',
+                        color: '#f8fafc',
+                        textAlign: 'center',
+                        padding: '2rem',
+                    }}
+                >
+                    <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Something went wrong</h1>
+                    <p style={{ maxWidth: '420px', marginBottom: '1.5rem', opacity: 0.8 }}>
+                        The garden lost its focus. Review the diagnostics overlay for details, then try again.
+                    </p>
+                    <button
+                        onClick={this.handleRetry}
+                        style={{
+                            padding: '0.75rem 1.5rem',
+                            borderRadius: '9999px',
+                            border: 'none',
+                            background: '#22c55e',
+                            color: '#0f172a',
+                            fontWeight: 600,
+                            cursor: 'pointer',
+                        }}
+                    >
+                        Retry
+                    </button>
+                </div>
+            );
+        }
+
+        return this.props.children;
+    }
+}
+
+export default AppErrorBoundary;
