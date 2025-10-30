// services/logger.ts

// A simple logger to avoid complex dependencies.
// In a real production app, you might use a more robust library like Winston or Pino.

enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3,
    NONE = 4,
}

// Set the current log level. For development, DEBUG is fine.
// For production, you might want to set this to INFO or WARN.
const CURRENT_LOG_LEVEL = LogLevel.INFO;

const log = (level: LogLevel, message: string, context?: object) => {
    if (level < CURRENT_LOG_LEVEL) {
        return;
    }

    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp} [${LogLevel[level]}] ${message}`;

    switch (level) {
        case LogLevel.DEBUG:
            if (context) {
                console.debug(logMessage, context);
            } else {
                console.debug(logMessage);
            }
            break;
        case LogLevel.INFO:
             if (context) {
                console.info(logMessage, context);
            } else {
                console.info(logMessage);
            }
            break;
        case LogLevel.WARN:
             if (context) {
                console.warn(logMessage, context);
            } else {
                console.warn(logMessage);
            }
            break;
        case LogLevel.ERROR:
             if (context) {
                console.error(logMessage, context);
            } else {
                console.error(logMessage);
            }
            break;
    }
};

export const logger = {
    debug: (message: string, context?: object) => log(LogLevel.DEBUG, message, context),
    info: (message: string, context?: object) => log(LogLevel.INFO, message, context),
    warn: (message: string, context?: object) => log(LogLevel.WARN, message, context),
    error: (message: string, context?: object) => log(LogLevel.ERROR, message, context),
};