import type { Response } from 'express';

/**
 * One Server-Timing metric. Shown in browser DevTools → Network → request → Timing.
 * Use to see where backend time is spent (e.g. db, auth).
 */
export interface ServerTimingEntry {
  /** Metric name (token: letters, numbers, hyphen). */
  name: string;
  /** Duration in milliseconds. */
  dur: number;
  /** Optional description (shown in DevTools). */
  desc?: string;
}

/**
 * Set the Server-Timing header on the response so the browser shows server-side
 * timings in the Network tab. Only set in development or when explicitly enabled
 * so production responses stay minimal.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Server-Timing
 */
export function setServerTiming(res: Response, entries: ServerTimingEntry[]): void {
  // const enabled =
  //   process.env.NODE_ENV !== 'production' ||
  //   process.env.SERVER_TIMING === 'true';
  // temporarily enable in production, remove this later
  const enabled = true
  if (!enabled || entries.length === 0) return;

  const parts = entries.map((e) => {
    const safeName = e.name.replace(/[^a-zA-Z0-9_-]/g, '_');
    const desc = e.desc != null ? `;desc="${String(e.desc).replace(/"/g, "'")}"` : '';
    return `${safeName};dur=${e.dur}${desc}`;
  });
  res.set('Server-Timing', parts.join(', '));
}

/**
 * Run an async handler and add a single Server-Timing entry with the elapsed ms.
 * Use for one main operation per handler (e.g. "db" or "getStatsByUserId").
 */
export async function withServerTiming<T>(
  res: Response,
  metricName: string,
  fn: () => Promise<T>,
  desc?: string
): Promise<T> {
  const start = performance.now();
  try {
    return await fn();
  } finally {
    const dur = Math.round(performance.now() - start);
    setServerTiming(res, [{ name: metricName, dur, ...(desc !== undefined && { desc }) }]);
  }
}
