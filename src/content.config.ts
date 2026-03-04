import { defineCollection, z } from 'astro:content';

const skills = defineCollection({
  type: 'data',
  schema: z.object({
    domain: z.string(),
    category: z.string(),
    skillArea: z.string(),
    rating: z.enum(['Expert', 'Practised', 'Awareness']),
    evidence: z.string(),
    caseStudySlug: z.string().optional(),
  }),
});

const work = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    company: z.string(),
    role: z.string(),
    order: z.number(),
    summary: z.string(),
  }),
});

export const collections = { skills, work };
