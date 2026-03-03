I'm continuing work on madebymiles.ai — a personal executive site for Miles Sowden (insurance/digital/AI executive targeting CEO, CXO, and NED roles).

## Key files in this repo (read these first)

- `PRD.md` — Full product requirements (11 epics, 6 phases, AICD skill matrix, AI Fit Finder, Discord ops dashboard, Supabase analytics)
- `ROADMAP.md` — Step-by-step build plan with checkboxes for each phase
- `SETUP-CHECKLIST.md` — All accounts, API keys, and manual steps I need to complete, organised by phase

## Current state

Branch: `claude/review-website-roadmap-rst4k`

Phase 1 is partially built:
- [x] Astro 5 + TypeScript + Tailwind CSS scaffolded
- [x] Homepage migrated from index.html into Astro components
- [x] /contact page with LinkedIn + WhatsApp CTAs (+61414185721)
- [x] GitHub Actions CI/CD workflow (deploy.yml)
- [x] Security headers (_headers file)
- [x] 5 components: Header, Footer, CTA, Card, Tag
- [x] Base layout with SEO meta, Open Graph, Twitter Cards
- [ ] DNS: Squarespace → Cloudflare (manual step, instructions in SETUP-CHECKLIST.md)
- [ ] Discord ops dashboard (7 channels + webhooks — manual step, instructions in SETUP-CHECKLIST.md)
- [ ] UptimeRobot monitoring (manual step)
- [ ] Headshot image needs saving to assets/images/miles-sowden-headshot.jpg

All open questions are resolved (see PRD.md Section 11):
- WhatsApp: +61414185721
- AICD: member/graduate
- Suncorp: yes, 5th case study
- Skill matrix: self-rate + evidence statements
- Fit Finder: honour-system blur unlock + shareable signed URL

Original site is archived as git tag `v0-pre-rebuild`.

## What to do next

Read PRD.md, ROADMAP.md, and SETUP-CHECKLIST.md to get full context. Then continue building from where Phase 1 left off. The next code work is Phase 2: AICD skill matrix data model, /experience page, 5 case study pages, Supabase analytics beacon, and Discord reporting cron workers.

For the manual setup steps (DNS, Discord webhooks, Supabase keys, etc.) — guide me through them interactively as they become relevant.
