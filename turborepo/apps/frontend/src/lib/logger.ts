import chalk from 'chalk'; // For coloring
import log from 'loglevel';

// Define log levels mapping to emojis and colors
const levelConfig = {
  TRACE: { emoji: '🔍', color: chalk.gray },
  DEBUG: { emoji: '🐛', color: chalk.blue },
  INFO: { emoji: 'ℹ️', color: chalk.green },
  WARN: { emoji: '⚠️', color: chalk.yellow },
  ERROR: { emoji: '🔥', color: chalk.red },
};

// Get log level from environment variables (Vite uses import.meta.env)
// Default to 'info' in production, 'trace' in development
const defaultLevel = import.meta.env.PROD ? 'info' : 'trace';
const currentLevel = (
  import.meta.env.VITE_LOG_LEVEL || defaultLevel
).toUpperCase() as log.LogLevelDesc;

// Enhance the logger factory
const originalFactory = log.methodFactory;
log.methodFactory = (methodName, logLevel, loggerName) => {
  const rawMethod = originalFactory(methodName, logLevel, loggerName);
  const config = levelConfig[methodName.toUpperCase() as keyof typeof levelConfig] || {
    emoji: '🪵', // Default emoji
    color: chalk.white, // Default color
  };

  // Use unknown[] for better type safety
  return (...args: unknown[]) => {
    // Handle loggerName being a symbol or string
    const contextString =
      typeof loggerName === 'string' ? loggerName : (loggerName?.toString() ?? '');
    const context = contextString ? `[${contextString}]` : '';

    const formattedArgs = args.map((arg) => (typeof arg === 'string' ? arg : JSON.stringify(arg)));
    const message = `${config.emoji} ${chalk.dim(context)} ${formattedArgs.join(' ')}`;
    rawMethod(config.color(message));
  };
};

// Set the level
log.setLevel(currentLevel);

// Export the configured logger instance
// You can create named loggers using log.getLogger("MyComponent")
export default log;

// Example usage:
// import logger from '@/lib/logger';
// logger.info('Component loaded');
// const compLogger = logger.getLogger('MyComponent');
// compLogger.debug('State changed:', { count: 1 });
