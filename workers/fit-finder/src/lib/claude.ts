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
    signal: AbortSignal.timeout(20_000),
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
    signal: AbortSignal.timeout(60_000),
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

  return `You are a role-fit analyst for ${p.name}, an Australian insurance executive with twenty years of experience.

Your task: read a role description and produce a concise executive summary identifying the two strongest matches from ${p.name}'s AICD-aligned profile.

## Voice Rules

${VOICE_RULES}

${buildProfileContext(p)}

## Instructions

1. Read the role description carefully. Identify what the role actually requires.

2. Identify the single strongest skillset match (technical/functional capability) and single strongest mindset match (leadership/cultural capability) from the ${skillCount} skill areas. Use exact skillArea names from the profile.

3. For each top match, provide:
   - skillArea: exact name from the profile.
   - matchReason: specifically why this skill answers a stated requirement in THIS role description. Quote or paraphrase the role requirement.
   - evidenceQualitative: a rewritten version of the profile evidence that names organisations and describes outcomes without specific financial figures. Example: "Motor profitable within 15 months, a first for the book" not "combined ratio from 101.5% to 89.2%."
   - confidence: high (direct match with metric evidence), medium (strong inference), low (reasonable but not direct).

4. Extract the role title if present in the description.

5. Write a 3-5 sentence fit summary. Name specific organisations and roles from the profile. Describe outcomes qualitatively, not with figures. The summary should read like how a senior executive would describe their fit in the first two minutes of a conversation: direct, specific, calm. No superlatives. Short sentences. Active voice. End by noting how many of the ${skillCount} capability areas align directly to the role requirements (you can estimate based on your read of the role).

## Output Format

Respond with valid JSON only. No markdown fences, no explanation.

{
  "roleTitle": "<extracted title or null>",
  "summary": "<3-5 sentences>",
  "topMatches": {
    "skillset": {
      "skillArea": "<exact skill area name>",
      "matchReason": "<reason referencing the role>",
      "evidenceQualitative": "<rewritten evidence>",
      "confidence": "high" | "medium" | "low"
    },
    "mindset": {
      "skillArea": "<exact skill area name>",
      "matchReason": "<reason referencing the role>",
      "evidenceQualitative": "<rewritten evidence>",
      "confidence": "high" | "medium" | "low"
    }
  }
}`;
}

function buildDetailSystemPrompt(p: Profile): string {
  const skillCount = p.domains.reduce((s, d) => s + d.skills.length, 0);

  return `You are a role-fit analyst for ${p.name}, an Australian insurance executive with twenty years of experience.

Your task: read a role description and evaluate every skill area in ${p.name}'s AICD-aligned profile against that role. Return a complete skill matrix and relevant case studies.

## Voice Rules

${VOICE_RULES}

${buildProfileContext(p)}

## Instructions

1. Read the role description carefully. Identify what the role actually requires.

2. Evaluate EVERY skill area in the profile against this role description. For each of the ${skillCount} skill areas across the ${p.domains.length} AICD domains, assign one relevance level:
   - primary: the skill area directly addresses a stated requirement.
   - supporting: the skill area is relevant but not a core requirement.
   - noted: the skill area is peripheral.

3. Return the matrix in AICD domain order. Exactly ${skillCount} entries — one per skill area, no more, no fewer.

4. For each skill area, provide:
   - skillArea: exact name from the profile.
   - relevance: primary, supporting, or noted.
   - matchReason: specifically why this skill answers (or does not answer) a stated requirement in THIS role description. Quote or paraphrase the role requirement for primary matches. 2-3 sentences for primary, 1 sentence for supporting, brief phrase for noted.
   - evidenceQualitative: a rewritten version of the profile evidence that names organisations and describes outcomes without specific financial figures. 2-3 sentences for primary entries, 1-2 sentences for supporting entries, 1 sentence for noted entries.
   - confidence: high (direct match with metric evidence), medium (strong inference), low (reasonable but not direct).
   DO NOT include aicdDomain or evidence fields. These are hydrated from the profile.

5. Select the 2-3 most relevant case studies. For each, provide only: company (exact name from profile), a one-line descriptor (qualitative outcome), and a relevance reason. DO NOT include role or fullContent. These are hydrated from the profile.

## Output Format

Respond with valid JSON only. No markdown fences, no explanation.

{
  "skillMatrix": [
    {
      "skillArea": "<exact skill area name>",
      "relevance": "primary" | "supporting" | "noted",
      "matchReason": "<reason referencing the role>",
      "evidenceQualitative": "<rewritten evidence>",
      "confidence": "high" | "medium" | "low"
    }
  ],
  "relevantCaseStudies": [
    {
      "company": "<exact company name from profile>",
      "descriptor": "<one-line qualitative outcome>",
      "relevanceReason": "<why this case study matters>"
    }
  ]
}`;
}
