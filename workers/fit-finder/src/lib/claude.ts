import type { SkillMatrixEntry, CaseStudyMatch, Profile } from '../types';
import profile from '../profile.json';

const typedProfile = profile as Profile;

/* ------------------------------------------------------------------ */
/*  Phase 1 — Executive Summary (fast, ~400 tokens output)            */
/* ------------------------------------------------------------------ */

interface ClaudeSummaryTopMatch {
  skillArea: string;
  matchReason: string;
  evidenceQualitative: string;
  confidence: 'high' | 'medium' | 'low';
}

interface ClaudeSummaryResponse {
  roleTitle: string | null;
  summary: string;
  topMatches: {
    skillset: ClaudeSummaryTopMatch;
    mindset: ClaudeSummaryTopMatch;
  };
}

export interface HydratedTopMatch {
  skillArea: string;
  aicdDomain: string;
  matchReason: string;
  evidenceQualitative: string;
  evidence: string;
  headline: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface SummaryResult {
  roleTitle: string | null;
  summary: string;
  topMatches: {
    skillset: HydratedTopMatch;
    mindset: HydratedTopMatch;
  };
}

/* ------------------------------------------------------------------ */
/*  Phase 2 — Full Detail (thorough, ~1800 tokens output)             */
/* ------------------------------------------------------------------ */

interface ClaudeDetailEntry {
  skillArea: string;
  relevance: 'primary' | 'supporting' | 'noted';
  matchReason: string;
  evidenceQualitative: string;
  confidence: 'high' | 'medium' | 'low';
}

interface ClaudeDetailCaseStudy {
  company: string;
  descriptor: string;
  relevanceReason: string;
}

interface ClaudeDetailResponse {
  skillMatrix: ClaudeDetailEntry[];
  relevantCaseStudies: ClaudeDetailCaseStudy[];
}

export interface DetailResult {
  skillMatrix: SkillMatrixEntry[];
  relevantCaseStudies: CaseStudyMatch[];
}

/* ------------------------------------------------------------------ */
/*  Public API                                                        */
/* ------------------------------------------------------------------ */

export async function callClaudeSummary(
  roleText: string,
  apiKey: string,
): Promise<SummaryResult> {
  const systemPrompt = buildSummarySystemPrompt(typedProfile);

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'prompt-caching-2024-07-31',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: `Role description:\n\n${roleText}` }],
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Claude API error ${response.status}: ${err.slice(0, 200)}`);
  }

  const data = (await response.json()) as {
    content: { type: string; text: string }[];
    stop_reason?: string;
  };

  if (data.stop_reason === 'max_tokens') {
    throw new Error('Response was truncated. Try a shorter role description.');
  }

  const textBlock = data.content.find((b) => b.type === 'text');
  if (!textBlock) throw new Error('No text in Claude response');

  let jsonText = textBlock.text.trim();
  if (jsonText.startsWith('```')) {
    jsonText = jsonText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }

  let parsed: ClaudeSummaryResponse;
  try {
    parsed = JSON.parse(jsonText) as ClaudeSummaryResponse;
  } catch {
    throw new Error('Could not parse summary results. Please try again.');
  }

  if (
    !parsed.summary ||
    !parsed.topMatches?.skillset?.skillArea ||
    !parsed.topMatches?.mindset?.skillArea
  ) {
    throw new Error('Incomplete summary response. Please try again.');
  }

  return hydrateSummary(parsed, typedProfile);
}

export async function callClaudeDetail(
  roleText: string,
  apiKey: string,
): Promise<DetailResult> {
  const systemPrompt = buildDetailSystemPrompt(typedProfile);

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'prompt-caching-2024-07-31',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: `Role description:\n\n${roleText}` }],
    }),
    signal: AbortSignal.timeout(120_000),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Claude API error ${response.status}: ${err.slice(0, 200)}`);
  }

  const data = (await response.json()) as {
    content: { type: string; text: string }[];
    stop_reason?: string;
  };

  if (data.stop_reason === 'max_tokens') {
    throw new Error('Response was truncated. Try a shorter role description.');
  }

  const textBlock = data.content.find((b) => b.type === 'text');
  if (!textBlock) throw new Error('No text in Claude response');

  let jsonText = textBlock.text.trim();
  if (jsonText.startsWith('```')) {
    jsonText = jsonText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }

  let parsed: ClaudeDetailResponse;
  try {
    parsed = JSON.parse(jsonText) as ClaudeDetailResponse;
  } catch {
    throw new Error('Could not parse detail results. Please try again.');
  }

  const expectedCount = typedProfile.domains.reduce((sum, d) => sum + d.skills.length, 0);
  if (!Array.isArray(parsed.skillMatrix) || parsed.skillMatrix.length !== expectedCount) {
    throw new Error(
      `Incomplete skill matrix (got ${parsed.skillMatrix?.length ?? 0}, expected ${expectedCount}). Please try again.`,
    );
  }

  return hydrateDetail(parsed, typedProfile);
}

/* ------------------------------------------------------------------ */
/*  Hydration                                                         */
/* ------------------------------------------------------------------ */

function hydrateSummary(compact: ClaudeSummaryResponse, p: Profile): SummaryResult {
  const skillMap = buildSkillMap(p);

  function hydrateTopMatch(tm: ClaudeSummaryTopMatch): HydratedTopMatch {
    const pd = skillMap.get(tm.skillArea);
    return {
      skillArea: tm.skillArea,
      aicdDomain: pd?.domain ?? 'Unknown',
      matchReason: tm.matchReason,
      evidenceQualitative: tm.evidenceQualitative,
      evidence: pd?.evidence ?? '',
      headline: pd?.headline ?? '',
      confidence: tm.confidence,
    };
  }

  return {
    roleTitle: compact.roleTitle,
    summary: compact.summary,
    topMatches: {
      skillset: hydrateTopMatch(compact.topMatches.skillset),
      mindset: hydrateTopMatch(compact.topMatches.mindset),
    },
  };
}

function hydrateDetail(compact: ClaudeDetailResponse, p: Profile): DetailResult {
  const skillMap = buildSkillMap(p);
  const caseStudyMap = buildCaseStudyMap(p);

  const skillMatrix: SkillMatrixEntry[] = compact.skillMatrix.map((entry) => {
    const pd = skillMap.get(entry.skillArea);
    return {
      aicdDomain: pd?.domain ?? 'Unknown',
      skillArea: entry.skillArea,
      relevance: entry.relevance,
      matchReason: entry.matchReason,
      evidence: pd?.evidence ?? '',
      evidenceQualitative: entry.evidenceQualitative,
      headline: pd?.headline ?? '',
      confidence: entry.confidence,
    };
  });

  const relevantCaseStudies: CaseStudyMatch[] = compact.relevantCaseStudies.map((cs) => {
    const pd = caseStudyMap.get(cs.company);
    const fullContent = pd
      ? `${pd.summary}\n\nKey outcomes:\n${pd.outcomes.map((o) => `- ${o}`).join('\n')}`
      : '';
    return {
      company: cs.company,
      role: pd?.role ?? '',
      descriptor: cs.descriptor,
      relevanceReason: cs.relevanceReason,
      fullContent,
    };
  });

  return { skillMatrix, relevantCaseStudies };
}

/* ------------------------------------------------------------------ */
/*  Lookup helpers                                                    */
/* ------------------------------------------------------------------ */

function buildSkillMap(p: Profile) {
  const map = new Map<string, { domain: string; evidence: string; rating: string; headline: string }>();
  for (const domain of p.domains) {
    for (const skill of domain.skills) {
      map.set(skill.skillArea, {
        domain: domain.domain,
        evidence: skill.evidence,
        rating: skill.rating,
        headline: skill.headline,
      });
    }
  }
  return map;
}

function buildCaseStudyMap(p: Profile) {
  const map = new Map<string, { role: string; summary: string; outcomes: string[] }>();
  for (const cs of p.caseStudies) {
    map.set(cs.company, { role: cs.role, summary: cs.summary, outcomes: cs.outcomes });
  }
  return map;
}

/* ------------------------------------------------------------------ */
/*  Prompts                                                           */
/* ------------------------------------------------------------------ */

const VOICE_RULES = `All output text must follow these rules: short sentences, active voice, AU/UK spelling (analyse, recognise, organisation). No em dashes. No superlatives or empty adjectives. No corporate jargon (leveraged, best-in-class, synergies). Evidence over assertion: name the organisation, name the outcome. Calm authority: state what was done, not how impressive it was. Write flowing prose, not bullet points strung into sentences. Use "by delivering", "through", "across" to connect clauses. Never describe growth trajectories or before/after progressions (e.g. "from $X to $Y", "growing from", "increased from"). State the final position only (e.g. "placement up to $1.9bn", "combined ratio of 89.2%"). The signal is capability, not growth.`;

function buildProfileContext(p: Profile): string {
  let prompt = `## ${p.name}'s Profile

**Name:** ${p.name}
**Title:** ${p.title}
**Credentials:** ${p.credentials.join('; ')}

## Skills (AICD Framework)

`;

  for (const domain of p.domains) {
    prompt += `### ${domain.domain}\n\n`;
    for (const skill of domain.skills) {
      prompt += `**${skill.skillArea}** [${skill.rating}]\n${skill.evidence}\n\n`;
    }
  }

  prompt += `## Career Evidence\n\n`;
  for (const cs of p.caseStudies) {
    prompt += `### ${cs.company}\n**${cs.role}**\n${cs.summary}\n`;
    if (cs.outcomes.length > 0) {
      prompt += `Key outcomes:\n`;
      for (const o of cs.outcomes) {
        prompt += `- ${o}\n`;
      }
    }
    prompt += '\n';
  }

  prompt += `## Leadership Philosophy\n\n${p.philosophy}`;
  return prompt;
}

function buildSummarySystemPrompt(p: Profile): string {
  const skillCount = p.domains.reduce((s, d) => s + d.skills.length, 0);

  return `Role-fit analyst for ${p.name}, Australian insurance executive, twenty years experience. Read the role description, return JSON with the two strongest matches.

## Voice

${VOICE_RULES}

${buildProfileContext(p)}

## Task

1. Extract the role title if present.
2. Pick the single strongest skillset match (technical/functional) and mindset match (leadership/cultural) from the ${skillCount} skill areas. Use exact skillArea names.
3. For each: matchReason (why this skill answers a stated requirement, quoting/paraphrasing the role), evidenceQualitative (rewritten evidence naming organisations and qualitative outcomes, no financial figures), confidence (high/medium/low).
4. Write a 3-5 sentence summary: name organisations and roles, qualitative outcomes only, calm executive tone, end by noting how many of the ${skillCount} areas align.

## Output — valid JSON only, no fences

{"roleTitle":"<title or null>","summary":"<3-5 sentences>","topMatches":{"skillset":{"skillArea":"<exact>","matchReason":"<reason>","evidenceQualitative":"<evidence>","confidence":"high|medium|low"},"mindset":{"skillArea":"<exact>","matchReason":"<reason>","evidenceQualitative":"<evidence>","confidence":"high|medium|low"}}}`;
}

function buildDetailSystemPrompt(p: Profile): string {
  const skillCount = p.domains.reduce((s, d) => s + d.skills.length, 0);

  return `Role-fit analyst for ${p.name}, Australian insurance executive, twenty years experience. Evaluate every skill area against the role description.

## Voice

${VOICE_RULES}

${buildProfileContext(p)}

## Task

Evaluate ALL ${skillCount} skill areas across ${p.domains.length} AICD domains. Return exactly ${skillCount} entries in domain order.

For each skill area:
- skillArea: exact name from profile
- relevance: primary (directly addresses a stated requirement), supporting (relevant, not core), noted (peripheral)
- matchReason: why this skill answers the role. Primary: 2-3 sentences quoting the role. Supporting: 1 sentence. Noted: brief phrase.
- evidenceQualitative: rewritten evidence naming organisations, qualitative outcomes, no financial figures. Primary: 2-3 sentences. Supporting: 1-2. Noted: 1.
- confidence: high (direct match with metric evidence), medium (strong inference), low (reasonable)
- Do NOT include aicdDomain or evidence fields.

Select 2-3 most relevant case studies: company (exact name), descriptor (one-line qualitative outcome), relevanceReason. Do NOT include role or fullContent.

## Output — valid JSON only, no fences

{"skillMatrix":[{"skillArea":"<exact>","relevance":"primary|supporting|noted","matchReason":"<reason>","evidenceQualitative":"<evidence>","confidence":"high|medium|low"}],"relevantCaseStudies":[{"company":"<exact>","descriptor":"<outcome>","relevanceReason":"<why>"}]}`;
}
