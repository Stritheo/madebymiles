import type { Env, FitResponse } from '../types';
import { extractText } from '../lib/extract';
import { callClaude } from '../lib/claude';
import { sign } from '../lib/jwt';
import { checkRateLimit } from '../lib/ratelimit';
import { postReport, postAlert } from '../lib/discord';
import { corsHeaders } from '../index';

export async function handleAnalyse(
  request: Request,
  env: Env,
): Promise<Response> {
  const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';

  // Rate limit
  const allowed = await checkRateLimit(ip, env.RATE_LIMIT_KV);
  if (!allowed) {
    await postAlert(env.DISCORD_WEBHOOK_ALERTS, 'Rate limit hit');
    return json({ error: 'Rate limit exceeded. Try again tomorrow.' }, 429);
  }

  // Extract text
  let roleText: string;
  try {
    roleText = await extractText(request);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Extraction failed';
    await postAlert(env.DISCORD_WEBHOOK_ALERTS, `Extraction error: ${msg}`);
    return json({ error: msg }, 400);
  }

  // Call Claude
  let fitData: Awaited<ReturnType<typeof callClaude>>;
  try {
    fitData = await callClaude(roleText, env.ANTHROPIC_API_KEY);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Analysis failed';
    await postAlert(env.DISCORD_WEBHOOK_ALERTS, `Claude API error: ${msg.slice(0, 100)}`);
    return json({ error: `Analysis failed: ${msg.slice(0, 200)}` }, 502);
  }

  // Sign results for shareable URL
  const analysedAt = new Date().toISOString();
  const payload = { ...fitData, analysedAt };
  const token = await sign(payload, env.JWT_SECRET);

  // Notify Discord (count only, no document content)
  const primaryCount = fitData.skillMatrix.filter(e => e.relevance === 'primary').length;
  await postReport(
    env.DISCORD_WEBHOOK_REPORTS,
    `Analysis completed. Role: ${fitData.roleTitle ?? 'unlabelled'}. Primary alignments: ${primaryCount}/10. Case studies: ${fitData.relevantCaseStudies.length}.`,
  );

  const response: FitResponse = { ...payload, token };
  return json(response, 200);
}

function json(data: unknown, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
  });
}
