# Handoff Prompt — Continue in Claude Code

Read this file first, then read `PRD.md` and `ROADMAP.md` for full context.

---

## Current state

**Branch:** `claude/review-website-roadmap-rst4k`
**Phase 1:** Complete and live at madebymiles.ai.
**Phase 2 (Credibility Engine):** Complete (core). Skill matrix, experience page, case study pages, prev/next nav, Lighthouse CI all shipped.
**Phase 3 (Discoverability):** Complete (core). llms.txt, llms-full.txt, RSS feed, Article JSON-LD, robots.txt LLM refs all shipped.
**PVT:** All checks passed. Site live, HTTPS, DNS, sitemap, Discord notifications all working.
**Security headers:** A+ on securityheaders.com. Cloudflare Transform Rules configured.

### What is live

**Pages:** Homepage, Experience (/experience), Contact (/contact), Privacy (/privacy), 5 case study pages (/work/sci, /work/cba, /work/hollard, /work/suncorp, /work/westpac)
**Infrastructure:** Cloudflare DNS (proxied), GitHub Pages, Discord (#alerts, #reports), UptimeRobot, Supabase, Sentry, Google Search Console, Dependabot.

### Homepage features
- Hero with headshot (desktop: right column, mobile: above CTAs)
- "What I bring" section: 4 capability blocks (Strategic Leadership, Business Transformation, People and Culture, Technology and AI)
- "Work and impact" section: 6 cards in 3x2 grid (SCI, CBA, Hollard, Suncorp, Westpac, Agentic Engineering). First 5 cards link to /work/ case study pages.
- Role cards standardised: company name, role/scope subtitle, outcomes paragraph
- Closing section with Contact CTA
- Person JSON-LD with credentials, occupations, knowsAbout
- OG image set to headshot

### Contact page
- LinkedIn and WhatsApp cards with buttons pinned to bottom (flex/mt-auto)
- "Role fit" section: CEO/CXO, NED, Advisory

### Footer
- "Growth and Transformation. GAICD. GDipAppFin."
- LinkedIn, WhatsApp, Privacy links
- "Built for humans. Readable by AI." → links to /llms.txt

### Discoverability (Phase 3)
- `/llms.txt` — concise LLM-readable profile (auto-generated from content collections)
- `/llms-full.txt` — comprehensive LLM-readable profile with full case study bodies
- `/rss.xml` — RSS feed for case studies
- Article JSON-LD on each case study page
- `link rel="alternate"` for llms.txt and RSS in `<head>`
- robots.txt references LLM content files

### Technical
- CSP includes `script-src 'self' 'unsafe-inline'` (needed for Astro inline module scripts)
- Cloudflare Transform Rule CSP must match (user action: update the CSP value in Cloudflare dashboard)
- Title tag: "Miles Sowden | Insurance Executive, Growth and Transformation"
- Sitemap at /sitemap-index.xml, robots.txt references it
- Favicon: SVG "M" in brand colours

---

## Pending user action

- **Update Cloudflare Transform Rule:** Change the Content-Security-Policy header value to add `script-src 'self' 'unsafe-inline'` so the hamburger menu works. See SECURITY-HEADERS.md for the exact value.

---

### Phase 2 progress (Credibility Engine) — COMPLETE (core)

**Done:**
- AICD-aligned skill matrix: 13 skill JSON files across 4 domains in `src/content/skills/`
- Experience page (`/experience`): skill matrix grid with rating badges, career timeline, credentials
- 5 case study pages (`/work/[slug]`): SCI, CBA, Hollard, Suncorp, Westpac with Context/What I did/Results
- Prev/next navigation between case studies
- Homepage cards linked to case study pages (first 5 are clickable)
- Skill cards with `caseStudySlug` link through to case studies
- Header nav updated: Experience link points to `/experience`
- @tailwindcss/typography installed for prose styling on case study pages
- Credentials: GAICD, GDipAppFin, BBus on experience page and JSON-LD
- Lighthouse CI added to GitHub Actions (`.github/lighthouse-budget.json`)
- Skill ratings: 8 Expert, 5 Practised

**Deferred (requires infrastructure setup):**
1. **Supabase analytics beacon** — Cloudflare Worker `/api/beacon`, sendBeacon on page_view, scroll_50, CTA clicks.
2. **Discord reporting cron Worker** — Daily visitor summary to #reports, weekly funnel to #reports.

### Phase 3 progress (Discoverability) — COMPLETE (core)

**Done:**
- `/llms.txt` and `/llms-full.txt` — Astro API routes auto-generated from content collections
- Article JSON-LD on each case study page (schema.org Article)
- RSS feed at `/rss.xml` via @astrojs/rss
- `link rel="alternate"` for llms.txt and RSS in Base.astro `<head>`
- robots.txt updated with LLM content references
- Footer: "Built for humans. Readable by AI." linked to /llms.txt
- LLM validation: fetched /llms.txt, produced accurate 200-word summary

**Deferred (manual Cloudflare step):**
- **Cloudflare AI Crawl Control** — Allow Google, Anthropic, OpenAI; block unwanted scrapers. Configure in Cloudflare dashboard.

---

### Phase 4 progress (Fit Finder) — DEPLOYED

**Done:**
- `/fit` page: drag-and-drop PDF upload, text paste, loading state, results with blur/honour-system unlock, shareable signed URLs
- Cloudflare Worker (`fit-finder`): PDF extraction (unpdf), Claude Haiku analysis, HMAC-signed JWT tokens, KV rate limiting (10/IP/day), Discord notifications
- Profile JSON generator (`scripts/generate-profile.ts`): reads content collections, builds structured profile for Claude prompt
- Worker route: `madebymiles.ai/api/*` → fit-finder Worker
- Worker secrets: ANTHROPIC_API_KEY, JWT_SECRET, DISCORD_WEBHOOK_REPORTS, DISCORD_WEBHOOK_ALERTS
- KV namespace: RATE_LIMIT_KV (238b5712c7fe45dcb0c020aa7850036d)
- Privacy page updated with Fit Finder data handling section
- Header nav updated with Fit Finder link (desktop + mobile)
- Lighthouse CI tests /fit page
- Worker deploy in GitHub Actions gated behind `vars.WORKER_ENABLED` variable
- `CLAUDE.md` created with CI/CD quality gate protocol

**To enable CI Worker deploy:**
1. Add `CLOUDFLARE_API_TOKEN` to GitHub repo secrets
2. Set repo variable `WORKER_ENABLED` = `true`

**Remaining Phase 4:**
- Sentry SDK integration (optional)
- SRI hashes on external resources
- Cloudflare AI Crawl Control (manual dashboard step)

### Next: Phase 5 — Voice and Depth

See ROADMAP.md. Reflections (short-form writing), projects section, RSS expansion.

---

## Lessons learned

### Lighthouse CI thresholds (Phase 2)
**Issue:** Lighthouse CI was added with FCP budget of 1500ms and interactive budget of 3000ms. These passed locally but failed on every GitHub Actions run (actual FCP ~2700ms, interactive ~3368ms). Google Fonts are render-blocking, and CI runners are ~2x slower than real users.

**Root cause:** Untested quality gate. Thresholds were committed without running them in the target CI environment first.

**Fix:** Relaxed to FCP 3500ms, interactive 5000ms (2x real-world baseline accounts for CI runner overhead).

**Protocol added:** See `CLAUDE.md` "CI/CD quality gate protocol" section. Key rules: baseline before budget, soft-fail first, CI environment awareness, test the test.

---

## Design and content rules

- No emdashes, en-dashes, or ampersands
- No "me" in CTAs
- CTA text: direct and confident ("Contact", "Connect on LinkedIn", "Open WhatsApp")
- No desperate positioning ("Open to opportunities")
- "Growth" is contextualised: structural/strategic growth (alliances, channels, pricing), not pure revenue growth
- CEO-first lens: strategy, leadership, people first; AI is a capability not the identity
- Apple x Tom Ford aesthetic: whitespace, restraint, typography
- All text content must be responsive (no hard max-w that breaks alignment with card grids)
- Footer tagline: post-nominals in abbreviated form (GAICD, GDipAppFin)
- Scannable in 10 seconds, expandable to 1 minute

## User preferences
- Limited technical knowledge, explain in plain English
- Values design discipline and brand consistency
- LinkedIn: "Led $1bn insurer | Growth and Transformation | MIT | GAICD"
- Profile data: `.claude/projects/-Users-milessowden-Projects-madebymiles/memory/miles-profile.md`
