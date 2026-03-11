# Handoff Prompt — Continue in Claude Code

Read this file first, then read `PRD.md` and `ROADMAP.md` for full context.

---

## Current state

**Branch:** `claude/fit-finder-redesign`
**Phase 1:** Complete and live at madebymiles.ai.
**Phase 2 (Credibility Engine):** Complete (core). Skill matrix, experience page, case study pages, prev/next nav, Lighthouse CI all shipped.
**Phase 3 (Discoverability):** Complete (core). llms.txt, llms-full.txt, RSS feed, Article JSON-LD, robots.txt LLM refs all shipped.
**Phase 4 (Fit Finder):** Complete. Redesigned with three-tier structure, complete AICD skill matrix, case study matching, brand voice enforcement.
**PVT:** All checks passed. Site live, HTTPS, DNS, sitemap, Discord notifications all working.
**Security headers:** A+ on securityheaders.com. Cloudflare Transform Rules configured.

### What is live

**Pages:** Homepage, Experience (/experience), Contact (/contact), Privacy (/privacy), 5 case study pages (/work/sci, /work/cba, /work/hollard, /work/suncorp, /work/westpac)
**Infrastructure:** Cloudflare DNS (proxied), GitHub Pages, Discord (#alerts, #reports), UptimeRobot, Supabase, Sentry, Google Search Console, Dependabot.

### Homepage features
- Hero with headshot (desktop: right column, mobile: above CTAs)
- "What I bring" section: 4 capability blocks (Strategic Leadership, Business Transformation, People and Culture, Technology and AI)
- "Work and impact" section: 6 cards in 3x2 grid (SCI, CBA, Hollard, Suncorp, Westpac, Agentic Engineering). Cards are non-linking divs (case study detail is surfaced through the Fit Finder instead).
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

### Phase 4 progress (Fit Finder) — COMPLETE (redesigned)

**Original build (shipped earlier):**
- `/fit` page: drag-and-drop PDF upload, text paste, loading state, results with blur/unlock, shareable signed URLs
- Cloudflare Worker (`fit-finder`): PDF extraction (unpdf), Claude Haiku 4.5 analysis, HMAC-signed JWT tokens, KV rate limiting (100/IP/day), Discord notifications
- Profile JSON generator (`scripts/generate-profile.ts`): reads content collections, builds structured profile for Claude prompt
- Worker route: `madebymiles.ai/api/*` → fit-finder Worker
- Worker secrets: ANTHROPIC_API_KEY, JWT_SECRET, DISCORD_WEBHOOK_REPORTS, DISCORD_WEBHOOK_ALERTS
- KV namespace: RATE_LIMIT_KV (238b5712c7fe45dcb0c020aa7850036d)
- Privacy page updated with comprehensive Fit Finder data handling
- Header nav updated with Fit Finder link (desktop + mobile)
- Lighthouse CI tests /fit page
- Worker deploy in GitHub Actions gated behind `vars.WORKER_ENABLED` variable
- `CLAUDE.md` created with CI/CD quality gate protocol

**Fit Finder Redesign (2026-03-11):**

The Fit Finder was redesigned from a ranked-matches model to a complete AICD skill matrix evaluation with case study matching. Key changes:

*Backend (`workers/fit-finder/`):*
- `types.ts`: New interfaces (SkillMatrixEntry, CaseStudyMatch, FitResponse). Old MatchResult kept for backwards compatibility with existing shared URL tokens (30-day expiry).
- `claude.ts`: Complete rewrite. System prompt now evaluates all 10 AICD skill areas (was top-6 matches). Includes brand voice rules, qualitative evidence field, case study selection (2-3 most relevant). max_tokens increased from 2048 to 6144, timeout from 28s to 55s. Model remains claude-haiku-4-5-20251001.
- `analyse.ts`: Discord notification updated from match count to primary alignment count.
- Estimated cost per analysis: ~$0.006 (was ~$0.002).

*Frontend (`src/pages/fit.astro`):*
- Three-tier results structure:
  - Tier 1 (visible): Summary, top matches (skillset + mindset cards), skill matrix with qualitative evidence
  - Tier 2 (blurred): Complete AICD skill matrix with full quantitative evidence
  - Tier 3 (blurred): Matched case studies (2-3 most relevant)
- Dual unlock path: reader clicks LinkedIn or WhatsApp, then chooses "Show the full skill evaluation" or "Show the matched case studies". Second section available via "also" button.
- Evidence swapping: qualitative evidence shown while blurred, full evidence with figures revealed on unlock (via data attributes).
- Backwards compatibility: old JWT tokens with `matches[]` format render via legacy path.
- Loading time updated to "15 to 25 seconds" (was "10 to 15 seconds"). Progress bar slowed accordingly.

*Site consolidation:*
- Homepage role cards converted from `<a>` links to `<div>` elements (case study detail surfaced through Fit Finder instead).
- `astro.config.mjs`: Sitemap filter excludes `/work/*` pages.
- `/llms.txt`: Removed links to case study pages, added Fit Finder section.
- `/llms-full.txt`: Added Fit Finder section describing capabilities.

**CI Worker deploy:**
1. Add `CLOUDFLARE_API_TOKEN` to GitHub repo secrets (can use existing `madebymiles-deploy` token)
2. Set repo variable `WORKER_ENABLED` = `true`

---

### Phase 4 QA Report (2026-03-04, pre-redesign)

**E2E Testing — All passed:**
- Text paste (>100 chars): 6 matches returned, high confidence, role title extracted
- XSS test: HTML stripped by sanitiser, valid results returned
- Error paths: short text (400), empty text (400), invalid token (400), unsupported content type (400)
- All pages return 200 (with expected trailing-slash 301 redirects)
- Machine-readable files: `/llms.txt`, `/llms-full.txt`, `/rss.xml`, `/sitemap-index.xml` all 200
- `/api/health` returns `{"status":"ok"}` with 200

**Security (still current):**
- Security headers: A+ on securityheaders.com
- CORS: locked to `https://madebymiles.ai` only
- No `.env` files or API keys in git history
- No `any` types or `console.log` in Worker code

**Known issues (low risk):**
1. JWT signature comparison uses `!==` (not constant-time). Low risk: tokens are for sharing results, not authentication.
2. CSP `connect-src 'self'` may need updating if Cloudflare Web Analytics JS beacon is added.
3. `@astrojs/check` not installed.

---

### UAT (for Miles, post-redesign)

- [ ] Visit madebymiles.ai/fit on iPhone and Mac
- [ ] Paste a real role description
- [ ] Upload a real PDF
- [ ] Review complete 10-skill AICD matrix for accuracy
- [ ] Verify three-tier structure: summary visible, matrix and case studies blurred
- [ ] Test LinkedIn unlock: opens messaging, choice appears, section unblurs
- [ ] Test WhatsApp unlock: opens WhatsApp, choice appears, section unblurs
- [ ] Test "also available" button reveals second section
- [ ] Verify evidence swaps from qualitative to full on unlock
- [ ] Share a result link — verify it works for recipients
- [ ] Test an old shared link (if any exist) — verify legacy rendering works
- [ ] Check Discord for notifications (should show primary alignment count)
- [ ] Verify homepage role cards are not clickable
- [ ] Verify /llms.txt includes Fit Finder section and no broken links
- [ ] Check /sitemap-index.xml excludes /work/* pages

---

### Carry forward

**Should do (low effort):**
- JWT constant-time comparison fix
- Verify Anthropic retention policy (privacy page says "up to 30 days", may have changed)
- Post-redesign QA: re-run full E2E test suite with new response format

**Nice to have:**
- Sentry SDK integration (JS error tracking)
- SRI hashes on Google Fonts
- Cloudflare AI Crawl Control (dashboard config)
- Supabase analytics beacon (deferred from Phase 2)
- Anthropic billing alert ($5/month, budget ~$0.006/analysis)
- Install `@astrojs/check` for Astro type checking
- Update Worker dev deps to clear npm audit findings

### Next: Phase 5 — Voice and Depth

See ROADMAP.md. Reflections (short-form writing), projects section, RSS expansion.

**Phase 5.1 — Reflections:**
- Content collection `src/content/reflections/` (Markdown)
- `/reflections` listing page + individual pages
- 3-5 initial pieces (culture, transformation lessons, AI adoption, leadership)
- "Latest thinking" section on homepage
- Add to RSS feed and `/llms-full.txt`

**Phase 5.2 — Projects:**
- Content collection `src/content/projects/` (Markdown)
- `/projects` listing page + individual pages
- 2-3 initial pieces (this website as meta case study, other AI/automation projects)
- "Building things" teaser on homepage

---

## Lessons learned

### Lighthouse CI thresholds (Phase 2)
**Issue:** Lighthouse CI was added with FCP budget of 1500ms and interactive budget of 3000ms. These passed locally but failed on every GitHub Actions run (actual FCP ~2700ms, interactive ~3368ms). Google Fonts are render-blocking, and CI runners are ~2x slower than real users.

**Root cause:** Untested quality gate. Thresholds were committed without running them in the target CI environment first.

**Fix:** Relaxed to FCP 3500ms, interactive 5000ms (2x real-world baseline accounts for CI runner overhead).

**Protocol added:** See `CLAUDE.md` "CI/CD quality gate protocol" section. Key rules: baseline before budget, soft-fail first, CI environment awareness, test the test.

### Wrangler secrets stored as names (Phase 4)
**Issue:** `wrangler secret put` prompts for the secret value interactively. User pasted API keys as the secret **name** (command argument) instead of the **value** (interactive prompt). Result: `wrangler secret list` showed `sk-ant-api03-...` as a secret name, and the actual value was empty/wrong. Two API keys were compromised (visible in terminal history/logs) and needed rotation.

**Root cause:** Confusing UX of `wrangler secret put NAME` where NAME is the variable name, not the value. The value is entered at the "Enter a secret value:" prompt.

**Fix:** Deleted all malformed secrets, created new API key (`madebymiles-fit-finder`), re-set all 4 secrets correctly. Rotated compromised keys on Anthropic console.

**Lesson:** Always verify secrets with `wrangler secret list` after setting them. If a secret name looks like a key value, it was set wrong.

### Rate limiting for executive tools (Phase 4)
**Issue:** Initial rate limit of 10/IP/day hit during development testing. User correctly challenged: "why limit enquiries? this is for a CEO role."

**Fix:** Math-based limit: $0.01/request, $50/month budget = ~5,000 requests. 100/IP/day is invisible to legitimate users and still prevents abuse.

**Lesson:** Rate limits should be based on cost math and user experience, not arbitrary low numbers.

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
