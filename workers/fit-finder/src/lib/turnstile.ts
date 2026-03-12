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
  try {
    const response = await fetch(VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: secretKey,
        response: token,
        remoteip: ip,
      }),
    });

    if (!response.ok) {
      return { valid: false, errorCodes: [`http-${response.status}`] };
    }

    const result = (await response.json()) as TurnstileResult;
    return {
      valid: result.success === true,
      errorCodes: result['error-codes'],
    };
  } catch (err) {
    return { valid: false, errorCodes: [`fetch-error: ${err instanceof Error ? err.message : 'unknown'}`] };
  }
}
