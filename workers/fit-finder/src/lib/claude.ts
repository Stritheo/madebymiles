import type { SkillMatrixEntry, CaseStudyMatch, Profile } from '../types';
import profile from '../profile.json';

const typedProfile = profile as Profile;

/** What Claude returns (lightweight, no verbatim evidence copying). */
interface ClaudeCompactEntry {
  skillArea: string;
  relevance: 'primary' | 'supporting' | 'noted';
  matchReason: string;
  evidenceQualitative?: string; // Only returned for primary matches
  confidence: 'high' | 'medium' | 'low';
}

interface ClaudeCompactCaseStudy {
  company: string;
  descriptor: string;
  relevanceReason: string;
}

interface ClaudeCompactResponse {
  skillMatrix: ClaudeCompactEntry[];
  topMatches: { skillset: string; mindset: string };
  roleTitle: string | null;
  summary: string;
  relevantCaseStudies: ClaudeCompactCaseStudy[];
}

/** What callClaude returns after hydration. */
export interface HydratedResponse {
  skillMatrix: SkillMatrixEntry[];
  topMatches: { skillset: string; mindset: string };
  roleTitle: string | null;
  summary: string;
  relevantCaseStudies: CaseStudyMatch[];
}

export async function callClaude(
  roleText: string,
  apiKey: string,
): Promise<HydratedResponse> {
  const systemPrompt = buildSystemPrompt(typedProfile);

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: 'user', content: `Role description:\n\n${roleText}` }],
    }),
    signal: AbortSignal.timeout(45_000),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Claude API error ${response.status}: ${err.slice(0, 200)}`);
  }

  const data = (await response.json()) as {
    content: { type: string; text: string }[];
    stop_reason?: string;
  };

  // Detect truncation before attempting parse
  if (data.stop_reason === 'max_tokens') {
    throw new Error('Response was truncated. Try a shorter role description.');
  }

  const textBlock = data.content.find((b) => b.type === 'text');
  if (!textBlock) throw new Error('No text in Claude response');

  // Strip markdown fences if Claude wraps in ```json
  let jsonText = textBlock.text.trim();
  if (jsonText.startsWith('```')) {
    jsonText = jsonText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }

  let parsed: ClaudeCompactResponse;
  try {
    parsed = JSON.parse(jsonText) as ClaudeCompactResponse;
  } catch (parseErr) {
    // Provide a user-friendly error instead of raw JSON parse details
    throw new Error('Could not parse analysis results. Please try again with a different role description.');
  }

  // Validate structure — count must match actual profile skills
  const expectedCount = typedProfile.domains.reduce((sum, d) => sum + d.skills.length, 0);
  if (!Array.isArray(parsed.skillMatrix) || parsed.skillMatrix.length !== expectedCount) {
    throw new Error(
      `Incomplete skill matrix (got ${parsed.skillMatrix?.length ?? 0}, expected ${expectedCount}). Please try again.`,
    );
  }

  // Hydrate from profile data
  return hydrate(parsed, typedProfile);
}

/** Merge Claude's analysis with static profile data. */
function hydrate(compact: ClaudeCompactResponse, p: Profile): HydratedResponse {
  // Build lookup maps
  const skillMap = new Map<string, { domain: string; evidence: string; rating: string; headline: string }>();
  for (const domain of p.domains) {
    for (const skill of domain.skills) {
      skillMap.set(skill.skillArea, {
        domain: domain.domain,
        evidence: skill.evidence,
        rating: skill.rating,
        headline: skill.headline,
      });
    }
  }

  const caseStudyMap = new Map<string, { role: string; summary: string; outcomes: string[] }>();
  for (const cs of p.caseStudies) {
    caseStudyMap.set(cs.company, {
      role: cs.role,
      summary: cs.summary,
      outcomes: cs.outcomes,
    });
  }

  // Hydrate skill matrix — use Claude's evidenceQualitative for primary,
  // fall back to curated headline for supporting/noted
  const skillMatrix: SkillMatrixEntry[] = compact.skillMatrix.map((entry) => {
    const profileData = skillMap.get(entry.skillArea);
    return {
      aicdDomain: profileData?.domain ?? 'Unknown',
      skillArea: entry.skillArea,
      relevance: entry.relevance,
      matchReason: entry.matchReason,
      evidence: profileData?.evidence ?? '',
      evidenceQualitative: entry.evidenceQualitative ?? profileData?.headline ?? '',
      headline: profileData?.headline ?? '',
      confidence: entry.confidence,
    };
  });

  // Hydrate case studies
  const relevantCaseStudies: CaseStudyMatch[] = compact.relevantCaseStudies.map((cs) => {
    const profileData = caseStudyMap.get(cs.company);
    const fullContent = profileData
      ? `${profileData.summary}\n\nKey outcomes:\n${profileData.outcomes.map((o) => `- ${o}`).join('\n')}`
      : '';
    return {
      company: cs.company,
      role: profileData?.role ?? '',
      descriptor: cs.descriptor,
      relevanceReason: cs.relevanceReason,
      fullContent,
    };
  });

  return {
    skillMatrix,
    topMatches: compact.topMatches,
    roleTitle: compact.roleTitle,
    summary: compact.summary,
    relevantCaseStudies,
  };
}

function buildSystemPrompt(p: Profile): string {
  let prompt = `You are a role-fit analyst for ${p.name}, an Australian insurance executive with twenty years of experience.

Your task: read a role description and evaluate every skill area in ${p.name}'s AICD-aligned profile against that role. Return a compact skill matrix, fit summary, top matches, and relevant case studies.

## Voice Rules

All output text must follow these rules: short sentences, active voice, AU/UK spelling (analyse, recognise, organisation). No em dashes. No superlatives or empty adjectives. No corporate jargon (leveraged, best-in-class, synergies). Evidence over assertion: name the organisation, name the outcome. Calm authority: state what was done, not how impressive it was. Write flowing prose, not bullet points strung into sentences. Use "by delivering", "through", "across" to connect clauses.

## ${p.name}'s Profile

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

  prompt += `## Leadership Philosophy

${p.philosophy}

## Instructions

1. Read the role description carefully. Identify what the role actually requires.

2. Evaluate EVERY skill area in the profile against this role description. For each of the ${p.domains.reduce((s, d) => s + d.skills.length, 0)} skill areas across the ${p.domains.length} AICD domains, assign one relevance level:
   - primary: the skill area directly addresses a stated requirement. Provide a detailed matchReason.
   - supporting: the skill area is relevant but not a core requirement. Provide a concise matchReason.
   - noted: the skill area is peripheral. Provide a brief matchReason.

3. Return the matrix in AICD domain order. Exactly ${p.domains.reduce((s, d) => s + d.skills.length, 0)} entries — one per skill area, no more, no fewer.

4. For each skill area, provide:
   - skillArea: exact name from the profile.
   - matchReason: specifically why this skill answers (or does not answer) a stated requirement in THIS role description. Quote or paraphrase the role requirement for primary matches. Keep supporting/noted matchReasons to one sentence.
   - evidenceQualitative: ONLY for primary relevance entries. A rewritten version of the profile evidence that names organisations and describes outcomes without specific financial figures. Example: "Motor profitable within 15 months, a first for the book" not "combined ratio from 101.5% to 89.2%." OMIT this field entirely for supporting and noted entries.
   - confidence: high (direct match with metric evidence), medium (strong inference), low (reasonable but not direct).
   DO NOT include aicdDomain or evidence fields. These are hydrated from the profile.

5. Identify the single strongest skillset match and single strongest mindset match. Return as topMatches using exact skillArea names.

6. Extract the role title if present.

7. Write a 3-5 sentence fit summary. Name specific organisations and roles from the profile. Describe outcomes qualitatively, not with figures. The summary should read like how a senior executive would describe their fit in the first two minutes of a conversation: direct, specific, calm. No superlatives. Short sentences. Active voice. End by noting how many primary capability areas are covered in the full evaluation.

8. Select the 2-3 most relevant case studies. For each, provide only: company (exact name from profile), a one-line descriptor (qualitative outcome), and a relevance reason. DO NOT include role or fullContent. These are hydrated from the profile.

## Output Format

Respond with valid JSON only. No markdown fences, no explanation.

{
  "skillMatrix": [
    {
      "skillArea": "<exact skill area name>",
      "relevance": "primary" | "supporting" | "noted",
      "matchReason": "<reason referencing the role>",
      "evidenceQualitative": "<ONLY for primary. Omit for supporting/noted>",
      "confidence": "high" | "medium" | "low"
    }
  ],
  "topMatches": {
    "skillset": "<skillArea name>",
    "mindset": "<skillArea name>"
  },
  "roleTitle": "<extracted title or null>",
  "summary": "<3-5 sentences>",
  "relevantCaseStudies": [
    {
      "company": "<exact company name from profile>",
      "descriptor": "<one-line qualitative outcome>",
      "relevanceReason": "<why this case study matters>"
    }
  ]
}`;

  return prompt;
}
