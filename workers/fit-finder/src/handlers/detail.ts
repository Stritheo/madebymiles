import type { Env } from '../types';
import type { SummaryResult } from '../lib/claude';
import { callClaudeDetail } from '../lib/claude';
import { sign } from '../lib/jwt';
import { postAlert } from '../lib/discord';
import { postToDatabricks } from '../lib/databricks';
import { corsHeaders } from '../index';

export async function handleDetail(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
): Promise<Response> {
  const body = (await request.json()) as { sessionId?: string };
  if (!body.sessionId) {
    return json({ error: 'Missing sessionId' }, 400);
  }

  // Retrieve stored role text and summary from Phase 1
  const raw = await env.RATE_LIMIT_KV.get(`session:${body.sessionId}`);
  if (!raw) {
    return json({ error: 'Session expired. Please run the analysis again.' }, 410);
  }

  let sessionData: { roleText: string; summary: SummaryResult };
  try {
    sessionData = JSON.parse(raw);
  } catch {
    return json({ error: 'Invalid session data. Please run the analysis again.' }, 500);
  }

  // Phase 2: Full skill matrix + case studies (thorough, ~1800 tokens)
  let detailData: Awaited<ReturnType<typeof callClaudeDetail>>;
  try {
    detailData = await callClaudeDetail(sessionData.roleText, env.ANTHROPIC_API_KEY);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Detail analysis failed';
    ctx.waitUntil(postAlert(env.DISCORD_WEBHOOK_ALERTS, `Detail API error: ${msg.slice(0, 100)}`));
    return json({ error: `Detail analysis failed: ${msg.slice(0, 200)}` }, 502);
  }

  // Create shareable JWT with combined summary + detail data
  const analysedAt = new Date().toISOString();
  const fullPayload = {
    roleTitle: sessionData.summary.roleTitle,
    summary: sessionData.summary.summary,
    topMatches: sessionData.summary.topMatches,
    skillMatrix: detailData.skillMatrix,
    relevantCaseStudies: detailData.relevantCaseStudies,
    analysedAt,
  };
  const token = await sign(fullPayload, env.JWT_SECRET);

  // Log completion to Databricks (non-critical, historical)
  const primaryCount = detailData.skillMatrix.filter((e) => e.relevance === 'primary').length;
  ctx.waitUntil(
    postToDatabricks(env.DATABRICKS_HOST, env.DATABRICKS_TOKEN, env.DATABRICKS_WAREHOUSE_ID, {
      source: 'fit-finder',
      severity: 'info',
      title: 'Detail completed',
      message: `Primary: ${primaryCount}/${detailData.skillMatrix.length}. Case studies: ${detailData.relevantCaseStudies.length}.`,
      metadata: {
        primarySkills: primaryCount,
        totalSkills: detailData.skillMatrix.length,
        caseStudies: detailData.relevantCaseStudies.length,
      },
    }),
  );

  return json({ ...detailData, token, analysedAt }, 200);
}

function json(data: unknown, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
  });
}
