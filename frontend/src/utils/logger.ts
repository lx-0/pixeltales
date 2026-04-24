import pino, { type LoggerOptions } from 'pino';

export type LogData = Record<string, unknown>;

const isProd = import.meta.env.PROD;
const debugBlacklist = new Set<string>(['ChatMessages:ui']);

const baseOptions: LoggerOptions = {
  level: isProd ? 'info' : 'debug',
  browser: {
    asObject: false,
    formatters: {
      level: (label) => ({ level: label }),
    },
  },
};

const rootLogger = pino(baseOptions);

const emit = (
  level: 'debug' | 'info' | 'warn' | 'error',
  context: string,
  message: string,
  payload?: LogData,
  error?: unknown
) => {
  if (level === 'debug' && debugBlacklist.has(context)) return;
  const bindings = error ? { context, err: error, ...payload } : { context, ...payload };
  rootLogger[level](bindings, message);
};

export const Logger = {
  debug: (context: string, message: string, data?: LogData) =>
    emit('debug', context, message, data),
  info: (context: string, message: string, data?: LogData) => emit('info', context, message, data),
  warn: (context: string, message: string, data?: LogData) => emit('warn', context, message, data),
  error: (context: string, message: string, error?: unknown, data?: LogData) =>
    emit('error', context, message, data, error),
  /** @deprecated Use `info` instead */
  log: (context: string, message: string, data?: LogData) => emit('info', context, message, data),
};
