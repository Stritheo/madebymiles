import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const GET: APIRoute = async () => {
  const allSkills = await getCollection('skills');
  const allWork = await getCollection('work');
  const sorted = allWork.sort((a, b) => a.data.order - b.data.order);

  const domains = [
    'Governance and Accountability',
    'Strategy and Risk',
    'Finance and Operations',
    'People and Culture',
  ];

  let text = `# Miles Sowden - Full Profile

> Twenty years leading Australian insurers through growth and transformation.
> Strategy, teams and culture that deliver lasting performance.

## About

Miles Sowden leads insurers to compete better, build trust and create lasting value. More than $1 billion in premium, teams of 700, five major financial institutions: Suncorp, Westpac, Commonwealth Bank, Hollard and Strata Community Insurance. Every role follows the same discipline: find the root causes, design a phased strategy, build the teams to execute.

## Contact

- Website: https://milessowden.au
- LinkedIn: https://www.linkedin.com/in/milessowden
- WhatsApp: https://wa.me/61414185721

## Credentials

- Graduate, Australian Institute of Company Directors (GAICD)
- Graduate Diploma of Applied Finance (GDipAppFin), FINSIA (Kaplan)
- Bachelor of Business (BBus), University of Technology Sydney

## Skills (AICD governance framework)

`;

  for (const domain of domains) {
    const skills = allSkills
      .filter(s => s.data.domain === domain)
      .sort((a, b) => a.data.category.localeCompare(b.data.category));

    text += `### ${domain}\n\n`;
    for (const skill of skills) {
      text += `**${skill.data.skillArea}** [${skill.data.rating}]\n`;
      text += `${skill.data.evidence}\n\n`;
    }
  }

  text += `## Career and case studies\n\n`;
  for (const entry of sorted) {
    text += `---\n\n`;
    text += `### ${entry.data.company}\n`;
    text += `**${entry.data.role}**\n\n`;
    text += `${entry.data.summary}\n\n`;
    // Include the raw markdown body
    if (entry.body) {
      text += entry.body + '\n\n';
    }
  }

  text += `---

## How I lead

Four patterns that hold across twenty years and five institutions. Not principles I aspire to. This is how we work together.

### Diagnose before acting
Every role starts the same way. Map the root causes, not the symptoms. Design a strategy that sequences for impact and build capability in layers to compete better.

### Organise everything around customer outcomes
Strategy, product, technology and measurement designed backward from what customers actually need. Not as a statement of values. As a design principle that every person in the team can see, follow and be measured against to earn trust.

### Build teams and systems that last
Good leadership compounds. I build operating models, develop people and embed ways of working that grow stronger over time. Structured delegation, coaching and operating rhythms that spread capability across the organisation rather than concentrate it.

### Operate like a founder inside institutions
Bold mandate. Refusal to accept inherited dysfunction. Then back it with cost discipline, bias to action and personal accountability for outcomes to create shareholder and stakeholder value.

---

## Fit Finder

The Fit Finder is a tool at https://milessowden.au/fit that accepts a role description and evaluates all 10 AICD skill areas against the role's requirements. It produces a structured fit assessment with:
- Complete AICD skill matrix evaluation (10 skill areas across 4 governance domains)
- Relevance classification for each skill area (primary, supporting, or noted)
- Matched case studies selected for relevance to the specific role
- Evidence drawn from career outcomes across five financial institutions

The analysis is powered by Claude (Anthropic) and returns results in 15 to 25 seconds. Documents are sent encrypted, not used for training, and deleted within 30 days.

---

Source: https://milessowden.au
Generated from content collections at build time.
`;

  return new Response(text, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
