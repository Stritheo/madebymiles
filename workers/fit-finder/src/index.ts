import type { Env } from './types';
import { handleAnalyse } from './handlers/analyse';
import { handleDetail } from './handlers/detail';
import { handleVerify } from './handlers/verify';

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() });
    }

    // Phase 1: Executive summary (fast)
    if (url.pathname === '/api/fit' && request.method === 'POST') {
      return handleAnalyse(request, env, ctx);
    }

    // Phase 2: Full skill matrix + case studies (on-demand)
    if (url.pathname === '/api/fit/detail' && request.method === 'POST') {
      return handleDetail(request, env, ctx);
    }

    // Shared URL verification
    if (url.pathname === '/api/fit/verify' && request.method === 'GET') {
      return handleVerify(request, env);
    }

    if (url.pathname === '/api/health' && (request.method === 'GET' || request.method === 'HEAD')) {
      return new Response(request.method === 'HEAD' ? null : JSON.stringify({ status: 'ok' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response('Not Found', { status: 404 });
  },
} satisfies ExportedHandler<Env>;

export function corsHeaders(): HeadersInit {
  return {
    'Access-Control-Allow-Origin': 'https://milessowden.au',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Turnstile-Token',
    'Access-Control-Max-Age': '86400',
  };
}
