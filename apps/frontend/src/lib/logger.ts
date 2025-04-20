import chalk from 'chalk'; // For coloring
import log from 'loglevel';

export const LOGGER_CONTEXT_SHORTEN = true;

// Define log levels mapping to emojis and colors
const levelConfig = {
  TRACE: { emoji: '🔍', color: chalk.gray },
  DEBUG: { emoji: '🐛', color: chalk.blue },
  INFO: { emoji: 'ℹ️', color: chalk.green },
  WARN: { emoji: '⚠️', color: chalk.yellow },
  ERROR: { emoji: '🔥', color: chalk.red },
  FATAL: { emoji: '💀', color: chalk.bgRed },
};

// Get log level from environment variables (Vite uses import.meta.env)
// Default to 'info' in production, 'trace' in development
const defaultLevel = import.meta.env.PROD ? 'info' : 'trace';
const currentLevel = (
  import.meta.env.VITE_LOG_LEVEL || defaultLevel
).toUpperCase() as log.LogLevelDesc;

// Map log levels to prefix strings (level name + emoji)
const levelPrefixes: Record<keyof typeof levelConfig, string> = {
  TRACE: 'TRACE 🔍',
  DEBUG: 'DEBUG 🐛',
  INFO: 'INFO  ℹ️',
  WARN: 'WARN  ⚠️',
  ERROR: 'ERROR 🔥',
  FATAL: 'FATAL 💀',
};

// Enhance the logger factory
const originalFactory = log.methodFactory;
log.methodFactory = (methodName, logLevel, loggerName) => {
  const rawMethod = originalFactory(methodName, logLevel, loggerName);
  const levelKey = methodName.toUpperCase() as keyof typeof levelConfig;
  const config = levelConfig[levelKey] || { emoji: '🪵', color: chalk.white };

  return (...args: unknown[]) => {
    // Determine prefix: use levelPrefixes if available, else fallback to name + emoji
    const prefix = levelPrefixes[levelKey] || `${methodName.toUpperCase()} ${config.emoji}`;
    // Coerce loggerName to string, default to empty string
    const rawContext: string = loggerName != null ? String(loggerName) : '';
    let contextStr = rawContext;
    if (LOGGER_CONTEXT_SHORTEN && rawContext) {
      // Shorten to last segment after '.', '/', or '\'
      const parts = rawContext.split(/[./\\]/);
      // Use non-null assertion since rawContext is non-empty
      contextStr = parts.pop()!;
    }
    const context = contextStr ? `[${contextStr}]` : '';

    // Format message arguments
    const formattedArgs = args.map((arg) => (typeof arg === 'string' ? arg : JSON.stringify(arg)));
    // Build final message: prefix (colored), context (dim), and payload
    const coloredPrefix = config.color(prefix);
    const message = `${coloredPrefix} ${chalk.dim(context)} ${formattedArgs.join(' ')}`;
    rawMethod(message);
  };
};

// Set the level
log.setLevel(currentLevel);

// Export named Logger for consistency with app code
/**
 * @deprecated Use `@/utils/logger` instead
 */
export const Logger = log;

// Export default for compatibility
/**
 * @deprecated Use `@/utils/logger` instead
 */
export default log;

// Example usage:
// import logger from '@/lib/logger';
// logger.info('Component loaded');
// const compLogger = logger.getLogger('MyComponent');
// compLogger.debug('State changed:', { count: 1 });
