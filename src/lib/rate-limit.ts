const windowMs = 60 * 1000; // 1 minute
const maxRequests = 60;

const hits = new Map<string, number[]>();

export function rateLimit(key: string): { ok: boolean; remaining: number } {
  const now = Date.now();
  const windowStart = now - windowMs;

  const timestamps = (hits.get(key) ?? []).filter((t) => t > windowStart);
  timestamps.push(now);
  hits.set(key, timestamps);

  const remaining = Math.max(0, maxRequests - timestamps.length);
  return { ok: timestamps.length <= maxRequests, remaining };
}
