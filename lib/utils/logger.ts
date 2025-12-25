/**
 * 🪵 STRUCTURED LOGGER NODE
 * Goal: Emit filterable JSON logs for Google Cloud Logging.
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

function log(level: LogLevel, message: string, meta?: any) {
  const logEntry = {
    severity: level.toUpperCase(), // Cloud Logging uses 'severity'
    message,
    ...meta,
    timestamp: new Date().toISOString(),
    node: process.env.K_REVISION || 'local-dev',
    service: 'sher-neural-core'
  };

  if (level === 'error') {
    console.error(JSON.stringify(logEntry));
  } else {
    console.log(JSON.stringify(logEntry));
  }
}

export const logger = {
  info: (msg: string, meta?: any) => log('info', msg, meta),
  warn: (msg: string, meta?: any) => log('warn', msg, meta),
  error: (msg: string, error?: any) => {
    const meta = error instanceof Error 
      ? { stack: error.stack, error_msg: error.message }
      : { error };
    log('error', msg, meta);
  },
  debug: (msg: string, meta?: any) => log('debug', msg, meta)
};
