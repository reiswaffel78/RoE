diff --git a/components/BootDiagnostics.tsx b/components/BootDiagnostics.tsx
new file mode 100644
index 0000000000000000000000000000000000000000..a3db0990caf28073210ef319632e77382b5cc408
--- /dev/null
+++ b/components/BootDiagnostics.tsx
@@ -0,0 +1,127 @@
+import React from 'react';
+import { getBootDiagnosticsState, subscribeToBootDiagnostics } from '../utils/bootDiagnostics';
+
+const statusColors: Record<string, string> = {
+    pending: '#facc15',
+    success: '#22c55e',
+    error: '#ef4444',
+};
+
+const formatTimestamp = (timestamp: number | null) => {
+    if (!timestamp) {
+        return '';
+    }
+    const date = new Date(timestamp);
+    return date.toLocaleTimeString();
+};
+
+const BootDiagnostics: React.FC = () => {
+    const state = React.useSyncExternalStore(subscribeToBootDiagnostics, getBootDiagnosticsState, getBootDiagnosticsState);
+
+    const { steps, flags, sw, lastError, warnings, buildVersion } = state;
+
+    return (
+        <aside
+            style={{
+                position: 'fixed',
+                bottom: '1rem',
+                right: '1rem',
+                width: '320px',
+                maxHeight: '80vh',
+                overflowY: 'auto',
+                background: 'rgba(15, 23, 42, 0.85)',
+                color: '#f8fafc',
+                padding: '1rem',
+                borderRadius: '0.75rem',
+                boxShadow: '0 20px 40px rgba(15, 23, 42, 0.35)',
+                fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
+                fontSize: '0.85rem',
+                zIndex: 9999,
+                pointerEvents: 'auto',
+            }}
+        >
+            <header style={{ marginBottom: '0.75rem' }}>
+                <strong style={{ fontSize: '1rem' }}>Boot Diagnostics</strong>
+                <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Build: {buildVersion}</div>
+            </header>
+
+            <section style={{ marginBottom: '0.75rem' }}>
+                <h2 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.7 }}>Boot Steps</h2>
+                <ul style={{ listStyle: 'none', margin: '0.25rem 0 0', padding: 0 }}>
+                    {Object.entries(steps).map(([key, step]) => (
+                        <li key={key} style={{ display: 'flex', alignItems: 'center', marginBottom: '0.35rem', gap: '0.5rem' }}>
+                            <span
+                                style={{
+                                    display: 'inline-flex',
+                                    alignItems: 'center',
+                                    justifyContent: 'center',
+                                    width: '1.5rem',
+                                    height: '1.5rem',
+                                    borderRadius: '9999px',
+                                    background: statusColors[step.status],
+                                    color: '#0f172a',
+                                    fontWeight: 700,
+                                    flexShrink: 0,
+                                }}
+                            >
+                                {key}
+                            </span>
+                            <div style={{ flex: 1 }}>
+                                <div style={{ fontWeight: 600 }}>{step.label}</div>
+                                <div style={{ fontSize: '0.7rem', opacity: 0.75 }}>{step.detail ?? step.status}</div>
+                            </div>
+                            <span style={{ fontSize: '0.65rem', opacity: 0.6 }}>{formatTimestamp(step.timestamp)}</span>
+                        </li>
+                    ))}
+                </ul>
+            </section>
+
+            <section style={{ marginBottom: '0.75rem' }}>
+                <h2 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.7 }}>Flags</h2>
+                <ul style={{ listStyle: 'none', margin: '0.25rem 0 0', padding: 0 }}>
+                    {Object.entries(flags).map(([flag, enabled]) => (
+                        <li key={flag} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
+                            <span>{flag}</span>
+                            <span style={{ fontWeight: 600, color: enabled ? '#f97316' : '#38bdf8' }}>{enabled ? 'on' : 'off'}</span>
+                        </li>
+                    ))}
+                </ul>
+            </section>
+
+            <section style={{ marginBottom: '0.75rem' }}>
+                <h2 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.7 }}>Service Worker</h2>
+                <div style={{ fontSize: '0.75rem' }}>
+                    <div>Status: {sw.bypassed ? 'bypassed' : sw.registered ? 'registered' : 'not registered'}</div>
+                    {sw.version && <div>Version: {sw.version}</div>}
+                    {sw.error && <div style={{ color: '#ef4444' }}>Error: {sw.error}</div>}
+                </div>
+            </section>
+
+            {warnings.length > 0 && (
+                <section style={{ marginBottom: '0.75rem' }}>
+                    <h2 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.7 }}>Warnings</h2>
+                    <ul style={{ listStyle: 'disc', margin: '0.25rem 0 0 1rem', padding: 0 }}>
+                        {warnings.map((warning) => (
+                            <li key={warning}>{warning}</li>
+                        ))}
+                    </ul>
+                </section>
+            )}
+
+            <section>
+                <h2 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.7 }}>Last Error</h2>
+                {lastError ? (
+                    <div>
+                        <div style={{ fontWeight: 600 }}>{lastError.message}</div>
+                        {lastError.stack && <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.7rem', opacity: 0.75 }}>{lastError.stack}</pre>}
+                        <div style={{ fontSize: '0.65rem', opacity: 0.6 }}>at {formatTimestamp(lastError.time)}</div>
+                    </div>
+                ) : (
+                    <div style={{ opacity: 0.65 }}>No errors recorded.</div>
+                )}
+            </section>
+        </aside>
+    );
+};
+
+export default BootDiagnostics;
