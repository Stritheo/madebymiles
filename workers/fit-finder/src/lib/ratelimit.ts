const MAX_PER_IP_PER_DAY = 100;
const MAX_GLOBAL_PER_DAY = 500;
const GLOBAL_KEY_PREFIX = 'rl:global:';

export interface RateLimitResult {
  allowed: boolean;
  reason?: 'ip' | 'global';
}

export async function checkRateLimit(
  ip: string,
  kv: KVNamespace,
): Promise<RateLimitResult> {
  const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  // Check global daily limit first
  const globalKey = `${GLOBAL_KEY_PREFIX}${date}`;
  const globalCount = parseInt((await kv.get(globalKey)) ?? '0');
  if (globalCount >= MAX_GLOBAL_PER_DAY) {
    return { allowed: false, reason: 'global' };
  }

  // Check per-IP limit
  const ipKey = `rl:${ip}:${date}`;
  const ipCount = parseInt((await kv.get(ipKey)) ?? '0');
  if (ipCount >= MAX_PER_IP_PER_DAY) {
    return { allowed: false, reason: 'ip' };
  }

  // Increment both counters
  await Promise.all([
    kv.put(globalKey, String(globalCount + 1), { expirationTtl: 86400 }),
    kv.put(ipKey, String(ipCount + 1), { expirationTtl: 86400 }),
  ]);

  return { allowed: true };
}
