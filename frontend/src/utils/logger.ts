/* eslint-disable no-console */
import chalk from 'chalk';

export type LogData = Record<string, unknown> | { [key: string]: unknown };

/**
 * Utility class for structured logging with color-coded output.
 * Supports both browser and server-side styling.
 */
export class Logger {
  /** Contexts that should be excluded from debug logging */
  private static debugBlacklist: Set<string> = new Set(['ChatMessages:ui']);

  /** Check if we're running in a browser environment */
  private static isBrowser = typeof window !== 'undefined';

  /** Styling configurations for different log levels */
  private static styles = {
    debug: {
      browser:
        'background: #666; color: white; padding: 1px 4px; border-radius: 3px',
      server: chalk.gray,
    },
    info: {
      browser:
        'background: #666; color: white; padding: 1px 4px; border-radius: 3px',
      server: chalk.white,
    },
    warn: {
      browser:
        'background: #f0ad4e; color: black; padding: 1px 4px; border-radius: 3px',
      server: chalk.yellow,
    },
    error: {
      browser:
        'background: #d9534f; color: white; padding: 1px 4px; border-radius: 3px',
      server: chalk.red,
    },
  } as const;

  /**
   * Format the context string with appropriate styling
   */
  private static formatContext(
    context: string,
    type: keyof typeof Logger.styles,
  ): [string, ...string[]] {
    if (Logger.isBrowser) {
      return [
        `%c${type.toUpperCase()}%c [${context}] %c%s`,
        `${Logger.styles[type].browser}; font-weight: normal; font-size: 10px`,
        'font-weight: normal; font-size: 10px',
        'color: #666; font-weight: normal; font-size: 10px',
      ];
    }
    return [Logger.styles[type].server(`${type.toUpperCase()} [${context}]`)];
  }

  /**
   * Format the data object for logging
   */
  private static formatData(data?: LogData): string | undefined {
    if (!data) return undefined;
    return Logger.isBrowser
      ? undefined
      : chalk.gray(JSON.stringify(data, null, 2));
  }

  /**
   * Get a clean stack trace without logger internals
   */
  private static getCleanStack(): string[] {
    const stack = new Error().stack?.split('\n') || [];
    // Remove first two lines (Error and logger internal)
    return stack
      .slice(2)
      .map((line) => line.trim())
      .filter((line) => !line.includes('logger.ts'));
  }

  /**
   * Log with optional data in browser console
   */
  private static logWithData(
    method: 'log' | 'warn' | 'error',
    context: string[],
    message: string,
    data?: LogData,
    error?: unknown,
  ) {
    if (Logger.isBrowser) {
      // Always use info to avoid Next.js error overlay, but keep our custom styling
      console.groupCollapsed(...context, message);

      if (error) {
        if (method === 'error') {
          console.info(
            '%c⛔ Error%c',
            'color: #d9534f; font-weight: bold; font-size: 10px',
            'font-weight: normal; font-size: 10px',
            error,
          );
        } else if (method === 'warn') {
          console.info(
            '%c⚠️ Warning%c',
            'color: #f0ad4e; font-weight: bold; font-size: 10px',
            'font-weight: normal; font-size: 10px',
            error,
          );
        } else {
          console.info(
            '%cError',
            'font-weight: normal; font-size: 10px',
            error,
          );
        }
      }

      if (data) {
        console.info('%cData', 'font-weight: normal; font-size: 10px', data);
      }

      console.groupCollapsed(
        '%cStack',
        'color: #888; font-weight: normal; font-size: 10px',
      );
      Logger.getCleanStack().forEach((line) =>
        console.info(
          '%c' + line,
          'color: #888; font-weight: normal; font-size: 10px',
        ),
      );
      console.groupEnd();
      console.groupEnd();
    } else {
      const formattedData = Logger.formatData(data);
      const errorStr = error
        ? chalk.red(JSON.stringify(error, Object.getOwnPropertyNames(error), 2))
        : '';
      console[method](...context, message, errorStr, formattedData || '');
    }
  }

  /**
   * Log debug messages with magenta/purple styling
   */
  static debug(context: string, message: string, data?: LogData) {
    if (!Logger.debugBlacklist.has(context)) {
      const [formattedContext, ...styles] = Logger.formatContext(
        context,
        'debug',
      );
      Logger.logWithData('log', [formattedContext, ...styles], message, data);
    }
  }

  /**
   * Log general information with blue styling
   */
  static info(context: string, message: string, data?: LogData) {
    const [formattedContext, ...styles] = Logger.formatContext(context, 'info');
    Logger.logWithData('log', [formattedContext, ...styles], message, data);
  }

  /**
   * Log warnings with yellow styling
   */
  static warn(context: string, message: string, data?: LogData) {
    const [formattedContext, ...styles] = Logger.formatContext(context, 'warn');
    Logger.logWithData('warn', [formattedContext, ...styles], message, data);
  }

  /**
   * Log errors with red styling
   */
  static error(
    context: string,
    message: string,
    error?: unknown,
    data?: LogData,
  ) {
    const [formattedContext, ...styles] = Logger.formatContext(
      context,
      'error',
    );
    Logger.logWithData(
      'error',
      [formattedContext, ...styles],
      message,
      data,
      error,
    );
  }

  /**
   * @deprecated Use `info` instead
   */
  static log = Logger.info;
}
