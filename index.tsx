import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { logger } from './services/logger';

logger.info("index.tsx: Script execution started.");

try {
    const rootElement = document.getElementById('root');
    if (!rootElement) {
        logger.error("Could not find root element to mount to.");
        throw new Error("Could not find root element to mount to");
    }

    logger.info("index.tsx: Creating React root.");
    const root = ReactDOM.createRoot(rootElement);

    logger.info("index.tsx: Rendering App into root.");
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    logger.info("index.tsx: App render command issued.");

} catch (error) {
    logger.error("index.tsx: Uncaught error during application initialization.", { error });
    const body = document.querySelector('body');
    if (body) {
        body.innerHTML = `<div style="color: red; padding: 20px; font-family: monospace;">
            <h1>Fatal Error</h1>
            <p>Application failed to start. See console for details.</p>
            <pre>${error instanceof Error ? error.stack : String(error)}</pre>
        </div>`;
    }
}
