export const millisecondsToReadableDuration = (ms: number): string => {
  const hours = Math.floor(ms / 1000 / 60 / 60);
  const minutes = Math.floor(ms / 1000 / 60) % 60;
  const seconds = Math.floor(ms / 1000) % 60;

  const result = [];

  if (hours > 0) {
    result.push(`${hours} hours`);
  }

  if (minutes > 0) {
    result.push(`${minutes} minutes`);
  }

  if (seconds > 0) {
    result.push(`${seconds} seconds`);
  }

  return result.join(' ');
};
