/**
 * Minimal terminal formatting helpers.
 * No dependencies — uses ANSI escape codes directly.
 */

const NO_COLOR = !!process.env.NO_COLOR;

function wrap(code: number, resetCode: number, text: string): string {
  if (NO_COLOR) return text;
  return `\x1b[${code}m${text}\x1b[${resetCode}m`;
}

export const bold = (t: string) => wrap(1, 22, t);
export const dim = (t: string) => wrap(2, 22, t);
export const green = (t: string) => wrap(32, 39, t);
export const red = (t: string) => wrap(31, 39, t);
export const yellow = (t: string) => wrap(33, 39, t);
export const cyan = (t: string) => wrap(36, 39, t);
export const gray = (t: string) => wrap(90, 39, t);
export const magenta = (t: string) => wrap(35, 39, t);

export function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "just now";
}

export function stateColor(state: string): string {
  switch (state.toUpperCase()) {
    case "OPEN":
      return green(state);
    case "MERGED":
      return magenta(state);
    case "DECLINED":
    case "SUPERSEDED":
      return red(state);
    default:
      return state;
  }
}

export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1) + "…";
}
