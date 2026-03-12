const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

interface TurnstileResult {
  success: boolean;
  'error-codes'?: string[];
}

export interface TurnstileVerification {
  valid: boolean;
  errorCodes?: string[];
}

export async function verifyTurnstile(
  token: string,
  secretKey: string,
  ip: string,
): Promise<TurnstileVerification> {
  // Guard: if secret is missing, fail fast with clear message
  if (!secretKey) {
    return { valid: false, errorCodes: ['missing-secret-key'] };
  }
  if (!token) {
    return { valid: false, errorCodes: ['missing-token'] };
  }

  try {
    const body = new URLSearchParams({
      secret: secretKey,
      response: token,
      remoteip: ip,
    });

    const response = await fetch(VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    // Always try to read the body for diagnostics
    const text = await response.text();
    let result: TurnstileResult;
    try {
      result = JSON.parse(text) as TurnstileResult;
    } catch {
      return { valid: false, errorCodes: [`http-${response.status}`, `body: ${text.slice(0, 200)}`] };
    }

    if (!response.ok) {
      return {
        valid: false,
        errorCodes: [`http-${response.status}`, ...(result['error-codes'] ?? [])],
      };
    }

    return {
      valid: result.success === true,
      errorCodes: result['error-codes'],
    };
  } catch (err) {
    return { valid: false, errorCodes: [`fetch-error: ${err instanceof Error ? err.message : 'unknown'}`] };
  }
}
