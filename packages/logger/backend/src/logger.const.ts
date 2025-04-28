export const LOGGER_CONTEXT_SHORTEN = true;

export const hexToAnsi = (hex: string) => {
  const [r, g, b] = hex.match(/\w\w/g)!.map((c) => parseInt(c, 16));
  return `\x1b[38;2;${r};${g};${b}m`;
};
export const ANSI_BOLD = '\x1b[1m';
export const ANSI_FAINT = '\x1b[2m';
export const ANSI_ITALIC = '\x1b[3m';
export const ANSI_UNDERLINE = '\x1b[4m';
export const ANSI_BLINK = '\x1b[5m';
export const ANSI_NORMAL = '\x1b[22m';
export const ANSI_REVERSE = '\x1b[7m';
export const ANSI_HIDDEN = '\x1b[8m';
export const ANSI_STRIKETHROUGH = '\x1b[9m';
export const ANSI_DIM = '\x1b[2m';
export const ANSI_RESET = '\x1b[0m';
export const ANSI_BACKGROUND_RED = '\x1b[41m';
