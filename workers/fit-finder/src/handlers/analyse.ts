import type { Env } from '../types';
import { extractText } from '../lib/extract';
import { callClaudeSummary } from '../lib/claude';
import { checkRateLimit } from '../lib/ratelimit';
import { verifyTurnstile } from '../lib/turnstile';
import { postReport, postAlert } from '../lib/discord';
import { corsHeaders } from '../index';

export async function handleAnalyse(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
): Promise<Response> {
  const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';

  // Turnstile bot verification
  const turnstileToken = request.headers.get('X-Turnstile-Token');
  if (!turnstileToken) {
    return json({ error: 'Verification required. Please try again.' }, 403);
  }
  const turnstileValid = await verifyTurnstile(turnstileToken, env.TURNSTILE_SECRET_KEY, ip);
  if (!turnstileValid) {
    ctx.waitUntil(postAlert(env.DISCORD_WEBHOOK_ALERTS, `Turnstile failed for IP: ${ip}`));
    return json({ error: 'Verification failed. Please refresh and try again.' }, 403);
  }

  // Rate limit (per-IP and global daily cap)
  const rateResult = await checkRateLimit(ip, env.RATE_LIMIT_KV);
  if (!rateResult.allowed) {
    const isGlobal = rateResult.reason === 'global';
    ctx.waitUntil(postAlert(env.DISCORD_WEBHOOK_ALERTS, `Rate limit hit: ${rateResult.reason}`));
    const error = isGlobal
      ? 'Due to current interest the Fit Finder has reached its daily limit. Please connect with me directly on LinkedIn or WhatsApp, or try again tomorrow.'
      : 'Rate limit exceeded. Try again tomorrow.';
    return json({ error, limitType: rateResult.reason }, 429);
  }

  // Extract text from PDF or JSON body
  let roleText: string;
  try {
    roleText = await extractText(request);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Extraction failed';
    ctx.waitUntil(postAlert(env.DISCORD_WEBHOOK_ALERTS, `Extraction error: ${msg}`));
    return json({ error: msg }, 400);
  }

  // Phase 1: Executive summary (fast, ~400 tokens)
  let summaryData: Awaited<ReturnType<typeof callClaudeSummary>>;
  try {
    summaryData = await callClaudeSummary(roleText, env.ANTHROPIC_API_KEY);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Analysis failed';
    ctx.waitUntil(postAlert(env.DISCORD_WEBHOOK_ALERTS, `Claude API error: ${msg.slice(0, 100)}`));
    return json({ error: `Analysis failed: ${msg.slice(0, 200)}` }, 502);
  }

  // Store role text + summary for Phase 2 (1-hour TTL)
  const sessionId = crypto.randomUUID();
  const sessionPayload = JSON.stringify({
    roleText,
    summary: summaryData,
  });
  ctx.waitUntil(
    env.RATE_LIMIT_KV.put(`session:${sessionId}`, sessionPayload, { expirationTtl: 3600 }),
  );

  // Discord notification
  ctx.waitUntil(
    postReport(
      env.DISCORD_WEBHOOK_REPORTS,
      `Summary completed. Role: ${summaryData.roleTitle ?? 'unlabelled'}. Top skillset: ${summaryData.topMatches.skillset.skillArea}. Top mindset: ${summaryData.topMatches.mindset.skillArea}.`,
    ),
  );

  return json({ ...summaryData, sessionId }, 200);
}

function json(data: unknown, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
  });
}
