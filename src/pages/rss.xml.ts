import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';

export async function GET(context: APIContext) {
  const work = await getCollection('work');
  const sorted = work.sort((a, b) => a.data.order - b.data.order);

  return rss({
    title: 'Miles Sowden — Work and Impact',
    description: 'Case studies from twenty years leading Australian insurers through growth and transformation.',
    site: context.site!,
    items: sorted.map(entry => ({
      title: `${entry.data.company}: ${entry.data.title}`,
      description: entry.data.summary,
      link: `/work/${entry.id.replace(/\.md$/, '')}/`,
    })),
  });
}
