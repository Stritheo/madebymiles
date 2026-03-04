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

  let text = `# Miles Sowden

> Twenty years leading Australian insurers through growth and transformation.

## Title
Insurance Executive, Growth and Transformation

## Credentials
- Graduate, Australian Institute of Company Directors (GAICD)
- Graduate Diploma of Applied Finance (GDipAppFin)
- Bachelor of Business (BBus)

## Contact
- Website: https://madebymiles.ai
- LinkedIn: https://www.linkedin.com/in/milessowden
- WhatsApp: https://wa.me/61414185721

## Skills (AICD framework)

`;

  for (const domain of domains) {
    const skills = allSkills
      .filter(s => s.data.domain === domain)
      .sort((a, b) => a.data.category.localeCompare(b.data.category));

    text += `### ${domain}\n`;
    for (const skill of skills) {
      text += `- ${skill.data.skillArea} [${skill.data.rating}]\n`;
    }
    text += '\n';
  }

  text += `## Career\n\n`;
  for (const entry of sorted) {
    text += `### ${entry.data.company}\n`;
    text += `${entry.data.role}\n`;
    text += `${entry.data.summary}\n`;
    text += `Read more: https://madebymiles.ai/work/${entry.id.replace(/\.md$/, '')}\n\n`;
  }

  text += `## More information
- Full content: https://madebymiles.ai/llms-full.txt
- Experience page: https://madebymiles.ai/experience
- Contact: https://madebymiles.ai/contact
`;

  return new Response(text, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
