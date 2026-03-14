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

Four defining patterns across twenty years and five roles.

### Systemic diagnosis and phased transformation
Every role starts the same way. Understand the root causes, not the symptoms. Design a strategy that sequences for impact. Build capability in layers. Combined ratio from 101.5% to 89.2% at CBA. From 105% to 98% at Suncorp. Digital availability from less than 5% to 60% at SCI.

### Customer outcomes as the organising principle
Strategy, pricing, operations, technology, and culture designed backward from customer outcomes. Not as a statement of values. As an operating discipline. NPS from +15 to +45 at CBA. From +25 to +44 at Westpac. CANSTAR Outstanding Value five consecutive years.

### Building capability that outlasts the leader
The test of leadership is not what happens while you are there. It is what happens after you leave. Designed a 10-person executive team at CBA that stayed in place after divestment. Built succession at SCI with internal promotion now leading national operations.

### Designing the CEO operating model
The CEO role has three value streams: strategic direction, external connection, and internal execution discipline. No single person excels at all three simultaneously. The CEOs who perform design their office and their leadership team to cover all three.

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
