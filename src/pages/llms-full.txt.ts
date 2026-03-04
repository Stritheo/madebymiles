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

  let text = `# Miles Sowden — Full Profile

> Twenty years leading Australian insurers through growth and transformation.
> Strategy, teams and culture that deliver lasting performance.

## About

Miles Sowden is an insurance executive with two decades of experience leading end-to-end insurance functions, subsidiaries and divisions for institutions that include Suncorp, Westpac, Commonwealth Bank, Hollard and Strata Community Insurance. He has led teams of up to 700 staff through business transformations from M&A transactions and regulatory reforms to changes to operating model and technology platforms. These changes occurred while responding to a Royal Commission, record natural catastrophes and a pandemic.

## Contact

- Website: https://madebymiles.ai
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

## What I bring

### Strategic Leadership
Setting direction for boards and executive teams. Defining where to compete, how to win and what to stop doing.

### Business Transformation
Turning around underperforming businesses through pricing, product modernisation, digital channels and operational discipline.

### People and Culture
Building high-performing, accountable teams through clear strategy, capability development and cultural alignment.

### Technology and AI
Deploying data, digital and artificial intelligence as strategic assets to drive customer outcomes and competitive advantage.

---

Source: https://madebymiles.ai
Generated from content collections at build time.
`;

  return new Response(text, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
