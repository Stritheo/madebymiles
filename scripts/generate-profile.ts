/**
 * Generate profile.json for the Fit Finder Worker.
 * Reads skill JSON and work markdown from content collections using Node fs.
 * Outputs structured profile to workers/fit-finder/src/profile.json.
 *
 * Run: npx tsx scripts/generate-profile.ts
 */

import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const SKILLS_DIR = join(ROOT, 'src/content/skills');
const WORK_DIR = join(ROOT, 'src/content/work');
const OUTPUT = join(ROOT, 'workers/fit-finder/src/profile.json');

interface Skill {
  domain: string;
  category: string;
  skillArea: string;
  rating: string;
  evidence: string;
  caseStudySlug?: string;
}

interface WorkEntry {
  title: string;
  company: string;
  role: string;
  order: number;
  summary: string;
  outcomes: string[];
}

// Read all skill JSON files
const skillFiles = readdirSync(SKILLS_DIR).filter(f => f.endsWith('.json'));
const skills: Skill[] = skillFiles.map(f =>
  JSON.parse(readFileSync(join(SKILLS_DIR, f), 'utf-8'))
);

// Group skills by domain
const domains = [
  'Governance and Accountability',
  'Strategy and Risk',
  'Finance and Operations',
  'People and Culture',
];

const groupedSkills = domains.map(domain => ({
  domain,
  skills: skills
    .filter(s => s.domain === domain)
    .sort((a, b) => a.category.localeCompare(b.category))
    .map(s => ({
      skillArea: s.skillArea,
      category: s.category,
      rating: s.rating,
      evidence: s.evidence,
    })),
}));

// Read work markdown files — extract frontmatter and results section
const workFiles = readdirSync(WORK_DIR).filter(f => f.endsWith('.md'));
const workEntries: WorkEntry[] = workFiles.map(f => {
  const content = readFileSync(join(WORK_DIR, f), 'utf-8');

  // Parse YAML frontmatter
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
  const fm: Record<string, string> = {};
  if (fmMatch) {
    for (const line of fmMatch[1].split('\n')) {
      const colonIdx = line.indexOf(':');
      if (colonIdx > 0) {
        const key = line.slice(0, colonIdx).trim();
        let val = line.slice(colonIdx + 1).trim();
        // Strip surrounding quotes
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        fm[key] = val;
      }
    }
  }

  // Extract outcomes from ## Results section
  const resultsMatch = content.match(/## Results\n([\s\S]*?)(?=\n##|$)/);
  const outcomes: string[] = [];
  if (resultsMatch) {
    for (const line of resultsMatch[1].split('\n')) {
      const trimmed = line.trim();
      if (trimmed.startsWith('- ')) {
        outcomes.push(trimmed.slice(2));
      }
    }
  }

  return {
    title: fm.title || '',
    company: fm.company || '',
    role: fm.role || '',
    order: parseInt(fm.order || '0'),
    summary: fm.summary || '',
    outcomes,
  };
}).sort((a, b) => a.order - b.order);

const profile = {
  name: 'Miles Sowden',
  title: 'Insurance Executive, Growth and Transformation',
  credentials: [
    'Graduate, Australian Institute of Company Directors (GAICD)',
    'Graduate Diploma of Applied Finance (GDipAppFin)',
    'Bachelor of Business (BBus)',
  ],
  contact: {
    website: 'https://madebymiles.ai',
    linkedin: 'https://www.linkedin.com/in/milessowden',
    whatsapp: 'https://wa.me/61414185721',
  },
  domains: groupedSkills,
  caseStudies: workEntries,
  philosophy: 'Pragmatic outcomes for users come first. Technology sits safely and securely in the background, powering the experience without being the experience. Build the strategy, teams and culture that deliver lasting performance. Evidence over adjectives.',
};

// Ensure output directory exists
const outputDir = join(OUTPUT, '..');
if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true });
}

writeFileSync(OUTPUT, JSON.stringify(profile, null, 2));
console.log(`Profile generated: ${OUTPUT}`);
console.log(`  Skills: ${skills.length} across ${domains.length} domains`);
console.log(`  Case studies: ${workEntries.length}`);
