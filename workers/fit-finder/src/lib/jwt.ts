const EXPIRY_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export async function sign(payload: object, secret: string): Promise<string> {
  const key = await importKey(secret);
  const data = JSON.stringify({ ...payload, exp: Date.now() + EXPIRY_MS });
  const encoded = btoa(unescape(encodeURIComponent(data)));
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(encoded),
  );
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(signature)));
  return `${encoded}.${sigB64}`;
}

export async function verify(
  token: string,
  secret: string,
): Promise<Record<string, unknown> | null> {
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [encoded, sigB64] = parts;

  const key = await importKey(secret);

  // Verify signature using constant-time comparison
  const expectedSig = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(encoded),
  );
  const actualSig = Uint8Array.from(atob(sigB64), c => c.charCodeAt(0));
  const expectedArr = new Uint8Array(expectedSig);

  if (actualSig.length !== expectedArr.length) return null;
  // Constant-time comparison to prevent timing attacks
  let diff = 0;
  for (let i = 0; i < expectedArr.length; i++) {
    diff |= expectedArr[i] ^ actualSig[i];
  }
  if (diff !== 0) return null;

  try {
    const json = decodeURIComponent(escape(atob(encoded)));
    const payload = JSON.parse(json) as Record<string, unknown>;

    // Check expiry
    if (typeof payload.exp === 'number' && payload.exp < Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

async function importKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
}
