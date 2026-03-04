import type { Env } from '../types';
import { verify } from '../lib/jwt';
import { corsHeaders } from '../index';

export async function handleVerify(
  request: Request,
  env: Env,
): Promise<Response> {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');

  if (!token) {
    return json({ error: 'No token provided' }, 400);
  }

  const payload = await verify(token, env.JWT_SECRET);
  if (!payload) {
    return json({ error: 'Invalid or expired token' }, 401);
  }

  return json(payload, 200);
}

function json(data: unknown, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
  });
}
