export const stringify = (obj: any) => JSON.stringify(obj, null, 2);

/**
 * Convert a string to a boolean
 * @param value - The string to convert
 * @returns The boolean value
 */
export const toBoolean = (value: string | boolean | number | undefined | null): boolean => {
  if (typeof value === 'string') {
    const lower = value.toLowerCase();
    if (lower === 'true' || lower === '1') return true;
    if (lower === 'false' || lower === '0') return false;
  }
  return Boolean(value);
};

/**
 * Get the message from an unknown error
 * @param error - The error to get the message from
 * @returns The message from the error
 */
export const getMessageFromUnknownError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
};
