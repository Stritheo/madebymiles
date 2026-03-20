import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const skills = defineCollection({
  loader: glob({ pattern: '**/*.json', base: 'src/content/skills' }),
  schema: z.object({
    domain: z.string(),
    category: z.string(),
    skillArea: z.string(),
    rating: z.enum(['Expert', 'Practised', 'Awareness']),
    evidence: z.string(),
    headline: z.string(),
    caseStudySlug: z.string().optional(),
  }),
});

const work = defineCollection({
  loader: glob({ pattern: '**/*.md', base: 'src/content/work' }),
  schema: z.object({
    title: z.string(),
    company: z.string(),
    role: z.string(),
    order: z.number(),
    summary: z.string(),
  }),
});

export const collections = { skills, work };
