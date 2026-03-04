import type { MatchResult, Profile } from '../types';
import profile from '../profile.json';

const typedProfile = profile as Profile;

interface ClaudeResponse {
  matches: MatchResult[];
  roleTitle: string | null;
  summary: string;
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
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: 'user', content: `Role description:\n\n${roleText}` }],
    }),
    signal: AbortSignal.timeout(28_000), // 28s, 2s buffer under Worker 30s limit
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
  if (!Array.isArray(parsed.matches) || parsed.matches.length === 0) {
    throw new Error('Could not identify role requirements. Try pasting a more complete role description.');
  }

  return parsed;
}

function buildSystemPrompt(p: Profile): string {
  let prompt = `You are a role-fit analyst for ${p.name}, an Australian insurance executive with twenty years of experience.

Your task: read a role description and identify the 6 strongest alignments between what the role requires and what ${p.name} offers. Return 3 skillset matches (technical, strategic, operational capabilities) and 3 mindset matches (leadership philosophy, cultural approach, character traits implied by the evidence).

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
2. Map those requirements to ${p.name}'s skills and career evidence.
3. Select the 3 strongest skillset alignments and 3 strongest mindset alignments.
4. For each match:
   - Write matchReason: specifically why this skill answers a stated requirement in THIS role description. Quote or paraphrase the role requirement.
   - Copy evidence verbatim from the profile above.
   - Assign confidence: high (direct match with metric evidence), medium (strong inference), low (reasonable but not direct).
5. Extract the role title if it appears in the document.
6. Write a 1-2 sentence summary of overall fit.

## Output Format

Respond with valid JSON only. No markdown fences, no explanation, no preamble.

{
  "matches": [
    {
      "rank": 1,
      "category": "skillset",
      "aicdDomain": "<one of the four AICD domains>",
      "skillArea": "<exact skill area from profile>",
      "matchReason": "<specific reason referencing the role>",
      "evidence": "<exact evidence text from profile>",
      "confidence": "high" | "medium" | "low"
    }
  ],
  "roleTitle": "<extracted title or null>",
  "summary": "<1-2 sentences>"
}`;

  return prompt;
}
