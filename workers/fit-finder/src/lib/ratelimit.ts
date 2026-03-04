const MAX_PER_DAY = 100;

export async function checkRateLimit(
  ip: string,
  kv: KVNamespace,
): Promise<boolean> {
  const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const key = `rl:${ip}:${date}`;

  const current = parseInt((await kv.get(key)) ?? '0');
  if (current >= MAX_PER_DAY) return false;

  await kv.put(key, String(current + 1), { expirationTtl: 86400 });
  return true;
}
