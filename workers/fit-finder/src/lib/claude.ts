import type { SkillMatrixEntry, CaseStudyMatch, Profile } from '../types';
import profile from '../profile.json';

const typedProfile = profile as Profile;

interface ClaudeResponse {
  skillMatrix: SkillMatrixEntry[];
  topMatches: {
    skillset: string;
    mindset: string;
  };
  roleTitle: string | null;
  summary: string;
  relevantCaseStudies: CaseStudyMatch[];
}

export async function callClaude(
  roleText: string,
  apiKey: string,
): Promise<ClaudeResponse> {
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
      max_tokens: 6144,
      system: systemPrompt,
      messages: [{ role: 'user', content: `Role description:\n\n${roleText}` }],
    }),
    signal: AbortSignal.timeout(55_000),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Claude API error ${response.status}: ${err.slice(0, 200)}`);
  }

  const data = (await response.json()) as {
    content: { type: string; text: string }[];
  };

  const textBlock = data.content.find((b) => b.type === 'text');
  if (!textBlock) throw new Error('No text in Claude response');

  // Strip markdown fences if Claude wraps in ```json
  let jsonText = textBlock.text.trim();
  if (jsonText.startsWith('```')) {
    jsonText = jsonText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }

  const parsed = JSON.parse(jsonText) as ClaudeResponse;

  // Validate structure
  if (!Array.isArray(parsed.skillMatrix) || parsed.skillMatrix.length !== 10) {
    throw new Error('Incomplete skill matrix. Try a more detailed role description.');
  }

  return parsed;
}

function buildSystemPrompt(p: Profile): string {
  let prompt = `You are a role-fit analyst for ${p.name}, an Australian insurance executive with twenty years of experience.

Your task: read a role description and evaluate every skill area in ${p.name}'s AICD-aligned profile against that role. Return a complete skill matrix, fit summary, top matches, and relevant case studies.

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

2. Evaluate EVERY skill area in the profile against this role description. For each of the 10 skill areas across the 4 AICD domains, assess relevance to this specific role. Assign one of three relevance levels:
   - primary: the skill area directly addresses a stated requirement in the role description. Provide detailed matchReason and full evidence.
   - supporting: the skill area is relevant to the role but not a core requirement. Provide a concise matchReason and full evidence.
   - noted: the skill area exists in the profile but is not central to this role. Provide a brief matchReason explaining why it is peripheral. Still include evidence.

3. Return the complete matrix in AICD domain order (Governance and Accountability, Strategy and Risk, Finance and Operations, People and Culture). Do not omit any skill area. The output must contain exactly 10 entries in the skillMatrix array.

4. For each skill area, provide:
   - matchReason: specifically why this skill answers (or does not directly answer) a stated requirement in THIS role description. Quote or paraphrase the role requirement for primary matches.
   - evidence: copied verbatim from the profile above.
   - evidenceQualitative: a rewritten version of the evidence that names organisations and describes outcomes without specific financial figures. Figures like combined ratios, NPS scores, premium volumes, and headcount numbers belong only in the evidence field. Example: "Motor profitable within 15 months, a first for the book" not "combined ratio from 101.5% to 89.2%."
   - confidence: high (direct match with metric evidence), medium (strong inference), low (reasonable but not direct).

5. Identify the single strongest skillset match (technical, strategic, operational capability) and single strongest mindset match (leadership philosophy, cultural approach, character traits implied by the evidence). Return these as topMatches using the exact skillArea name.

6. Extract the role title if it appears in the document.

7. Write a 3-5 sentence fit summary. Name specific organisations and roles from the profile. Describe outcomes qualitatively, not with figures. The summary should read like how a senior executive would describe their fit in the first two minutes of a conversation: direct, specific, calm. No superlatives. No "exceptional" or "outstanding." Short sentences. Active voice. Evidence over assertion. End the summary by noting how many primary capability areas are covered in the full evaluation.

8. Select the 2-3 case studies from the profile that are most relevant to this role's requirements. For each, provide: company, role title, a one-line descriptor (company, title, and one qualitative outcome), a relevance reason (why this case study matters for this role), and the full case study content from the profile. Order by relevance, most relevant first.

## Output Format

Respond with valid JSON only. No markdown fences, no explanation, no preamble.

{
  "skillMatrix": [
    {
      "aicdDomain": "<AICD domain>",
      "skillArea": "<exact skill area from profile>",
      "relevance": "primary" | "supporting" | "noted",
      "matchReason": "<specific reason referencing the role>",
      "evidence": "<exact evidence text from profile>",
      "evidenceQualitative": "<rewritten evidence without figures>",
      "confidence": "high" | "medium" | "low"
    }
  ],
  "topMatches": {
    "skillset": "<skillArea name of strongest technical match>",
    "mindset": "<skillArea name of strongest leadership/culture match>"
  },
  "roleTitle": "<extracted title or null>",
  "summary": "<3-5 sentences>",
  "relevantCaseStudies": [
    {
      "company": "<company name>",
      "role": "<role title>",
      "descriptor": "<one-line descriptor with qualitative outcome>",
      "relevanceReason": "<why this case study matters for this role>",
      "fullContent": "<full case study content from profile>"
    }
  ]
}`;

  return prompt;
}
