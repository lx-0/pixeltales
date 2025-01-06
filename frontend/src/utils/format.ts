/**
 * Convert a string to kebab case.
 * @param str - The string to convert.
 * @returns The kebab case string.
 */
export function kebabCase(str: string) {
  return str.toLowerCase().replace(/\s+/g, '-');
}

export function formatTime(
  timestamp: number,
  options?: Intl.DateTimeFormatOptions,
  locales?: Intl.LocalesArgument,
): string {
  return new Date(timestamp * 1000).toLocaleString(locales, options);
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0 || hours > 0) parts.push(`${minutes}m`);
  parts.push(`${remainingSeconds}s`);

  return parts.join(' ');
}
