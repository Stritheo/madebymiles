# Build Roadmap — madebymiles.ai

**Companion to:** `PRD.md`
**Status:** Ready to build

---

## Build Order

Five phases, each shipping a working site. Phase 0 is woven into every phase, not built separately.

```
Phase 1 ─── Foundation & Contact ─── Live site on madebymiles.ai, Astro, CI/CD, Discord ops
  │
Phase 2 ─── Credibility Engine ───── Skill matrix, case studies, analytics beacon, funnel tracking
  │
Phase 3 ─── Discoverability ──────── LLM layer, structured data, SEO, llms.txt
  │
Phase 4 ─── AI Differentiator ────── Fit Finder, security hardening, privacy page
  │
Phase 5 ─── Voice & Depth ────────── Reflections, projects, RSS
```

---

## Phase 1 — Foundation & Contact

**Goal:** Astro site live on `madebymiles.ai`, visually matching the current site, with CI/CD and Discord ops running.

**Dependencies:** None — this is the starting point.

### Steps

#### 1.1 — DNS: Squarespace → Cloudflare
- [ ] Add `madebymiles.ai` to Cloudflare free plan
- [ ] Copy the two assigned Cloudflare nameservers
- [ ] In Squarespace → Domains → DNS Settings → set custom nameservers to Cloudflare
- [ ] In Cloudflare DNS, add GitHub Pages records:
  - `A` records: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
  - `CNAME` for `www` → `Stritheo.github.io` (or the GitHub Pages domain)
- [ ] Enable Cloudflare proxy (orange cloud) on all records
- [ ] Enable Cloudflare Web Analytics (free, no JS snippet needed with proxy)
- [ ] Wait for DNS propagation (24-48 hours — start this first so it's ready when the site ships)

#### 1.2 — Astro project setup
- [ ] Initialise Astro project with TypeScript (`npm create astro@latest`)
- [ ] Configure Tailwind CSS with existing design tokens from `index.html` (colours, fonts, spacing)
- [ ] Install and configure `@astrojs/tailwind`
- [ ] Set up base layout (`src/layouts/Base.astro`) with `<head>`, meta tags, fonts
- [ ] Create component library:
  - `Header.astro` — nav with CTA
  - `Footer.astro` — links, privacy signal, "No cookies. No tracking. No storage."
  - `Card.astro` — reusable project/case study card
  - `CTA.astro` — LinkedIn and WhatsApp buttons
  - `Tag.astro` — skill/technology tags
- [ ] Configure `astro.config.mjs` for GitHub Pages deployment (set `site` and `base`)

#### 1.3 — Migrate homepage content
- [ ] Extract all content from current `index.html` into Astro components
- [ ] Build homepage (`src/pages/index.astro`) using the new components
- [ ] Verify visual parity with current site (screenshot comparison)
- [ ] Replace all `mailto:` links with LinkedIn message deep-link
- [ ] Add WhatsApp CTA with pre-filled greeting

#### 1.4 — Contact page
- [ ] Create `/contact` page with LinkedIn + WhatsApp channels
- [ ] "How I prefer to connect" section
- [ ] Ensure CTAs appear in header and footer on every page

#### 1.5 — CI/CD pipeline
- [ ] Create `.github/workflows/deploy.yml`:
  - Trigger: push to `main`
  - Steps: checkout → install → lint → `npm audit` → build → deploy to GitHub Pages
- [ ] Add `CNAME` file for custom domain
- [ ] Verify deploy works end-to-end
- [ ] Add build status badge to README

#### 1.6 — Discord ops (Phase 1 signals)
- [ ] Create Discord server (or use existing) with channels:
  - `#uptime-alerts`
  - `#build-deploys`
  - `#security-threats`
  - `#site-visitors`
  - `#funnel-tracking`
  - `#fit-finder`
  - `#dependency-alerts`
- [ ] Create Discord webhooks for each channel
- [ ] Configure UptimeRobot:
  - Monitor `https://madebymiles.ai` (HTTP 200)
  - Alert → Discord webhook to `#uptime-alerts`
- [ ] Add Discord notification step to GitHub Actions:
  - Post to `#build-deploys` on deploy success/failure
  - Include commit message, author, and build status
- [ ] Enable Dependabot on the repo → GitHub webhook to `#dependency-alerts`

#### 1.7 — Security headers (Phase 0 embed)
- [ ] Configure Cloudflare Transform Rules or `_headers` file:
  - `Content-Security-Policy`
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
  - `Strict-Transport-Security` with `includeSubDomains` and `preload`
- [ ] Verify A+ on securityheaders.com

**Phase 1 deliverable:** Astro site live at `madebymiles.ai` with all current content, LinkedIn/WhatsApp CTAs, CI/CD deploying on push, Discord receiving uptime and build notifications, security headers scoring A+.

---

## Phase 2 — Credibility Engine

**Goal:** Skill matrix (AICD-aligned), case studies, analytics beacon with funnel tracking, all reporting to Discord.

**Dependencies:** Phase 1 (site is live, CI/CD works, Discord channels exist).

### Steps

#### 2.1 — Skill matrix data model
- [ ] Create Astro Content Collection `src/content/skills/` with JSON schema:
  ```
  { domain, category, skillArea, rating, evidence, caseStudyLink }
  ```
- [ ] Populate all 14 skill areas across 4 AICD domains with:
  - Rating (Expert / Practised / Awareness)
  - 1-2 sentence evidence statement
  - Link to relevant case study (where available)
- [ ] This JSON becomes the single source of truth for:
  - The `/experience` page (HTML rendering)
  - The Fit Finder prompt (Epic 8)
  - JSON-LD structured data (Epic 5)

#### 2.2 — Experience page (`/experience`)
- [ ] Build the skill matrix grid component:
  - Desktop: full grid grouped by AICD domain, hover tooltips for evidence
  - Tablet: horizontally scrollable with sticky first column
  - Mobile: stacked cards per domain with rating badge + evidence
- [ ] Build career timeline component:
  - Reverse chronological
  - Each role: title, company, reporting line, team size, tenure, one-line scope
- [ ] Add `Person` schema with `hasOccupationExperience` (JSON-LD)

#### 2.3 — Case studies
- [ ] Create Content Collection `src/content/work/` (Markdown/MDX)
- [ ] Build case study page template (`src/pages/work/[slug].astro`):
  - Role & context → Challenge → Approach → Outcomes → Reflection
- [ ] Write 4 case studies:
  - [ ] SCI (Strata Community Insurance)
  - [ ] CBA (Commonwealth Bank)
  - [ ] Hollard Insurance
  - [ ] Westpac
- [ ] Update homepage cards to link to full case study pages
- [ ] Add prev/next navigation between case studies

#### 2.4 — Supabase analytics setup
- [ ] Create Supabase project (free tier)
- [ ] Run schema migration:
  ```sql
  CREATE TABLE events (
    id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    page       text NOT NULL,
    referrer   text,
    event_type text NOT NULL,
    created_at timestamptz DEFAULT now()
  );
  ALTER TABLE events ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "anon_insert" ON events FOR INSERT TO anon WITH CHECK (true);
  CREATE POLICY "service_read" ON events FOR SELECT TO service_role USING (true);
  ```
- [ ] Create reporting views (`daily_summary`, `top_pages`, `funnel_steps`)
- [ ] Note the `anon` key (for beacon Worker) and `service_role` key (for cron Worker)
- [ ] Store both keys as Cloudflare Worker secrets

#### 2.5 — Analytics beacon Worker
- [ ] Create Cloudflare Worker for `/api/beacon`:
  - Accept POST with `{ page, referrer, event_type, timestamp }`
  - Validate and sanitise input (allowlisted event types, URL-safe page paths)
  - INSERT into Supabase via REST API using `anon` key
  - Return 204 No Content
  - No PII, no IP logging, no cookies
- [ ] Add `navigator.sendBeacon('/api/beacon', ...)` to every page via Astro layout:
  - `page_view` on page load
  - `scroll_50` on scroll past 50%
  - `cta_click_linkedin` / `cta_click_whatsapp` on CTA clicks
  - `skill_matrix_view` on `/experience` page
  - `case_study_click` on case study link clicks
- [ ] Deploy Worker and verify events appear in Supabase

#### 2.6 — Discord reporting cron Worker
- [ ] Create Cloudflare Worker with cron trigger:
  - **Daily at 08:00 AEST (22:00 UTC):** Query `daily_summary` view from Supabase → post rich embed to `#site-visitors`
  - **Weekly Monday 08:00 AEST:** Query funnel steps → calculate drop-off → post to `#funnel-tracking`
- [ ] Use `service_role` key to read from Supabase
- [ ] Format as Discord embeds (colour-coded, with fields)
- [ ] Store Discord webhook URLs as Worker secrets
- [ ] Deploy and verify first daily report posts correctly

#### 2.7 — Lighthouse CI
- [ ] Add Lighthouse CI to GitHub Actions workflow:
  - Run after deploy
  - Thresholds: Performance ≥ 95, Accessibility ≥ 100, Best Practices ≥ 95, SEO ≥ 95
  - Fail build if scores drop below thresholds
- [ ] Post Lighthouse scores to `#build-deploys` Discord channel after each deploy

**Phase 2 deliverable:** AICD-aligned skill matrix live on `/experience`, 4 case studies on `/work/*`, analytics beacon tracking 7 funnel steps into Supabase, daily visitor report and weekly funnel report posting to Discord.

---

## Phase 3 — Discoverability

**Goal:** LLMs can find, read, and accurately represent Miles without ever touching the HTML.

**Dependencies:** Phase 2 (content collections exist for skills, case studies).

### Steps

#### 3.1 — Machine-readable content layer
- [ ] Create build-time script to auto-generate from Content Collections:
  - `/llms.txt` — concise structured summary (name, title, skills, experience, contact)
  - `/llms-full.txt` — comprehensive Markdown of all site content in one file
- [ ] Both files regenerate on every build (never out of sync)
- [ ] Expose case studies as clean Markdown at `/work/sci.md`, `/work/cba.md`, etc.

#### 3.2 — Structured data (JSON-LD)
- [ ] Homepage: `Person` schema (name, title, `hasOccupationExperience`, skills, `sameAs` for LinkedIn)
- [ ] Case studies: `Article` schema (author, datePublished, headline, description)
- [ ] Experience page: Enhanced `Person` schema with full role history
- [ ] Add `<link rel="alternate" type="text/markdown">` on HTML pages pointing to Markdown equivalent

#### 3.3 — SEO & discoverability
- [ ] Write natural-language `<meta name="description">` for every page
- [ ] Add Open Graph and Twitter Card tags to every page
- [ ] Generate `sitemap.xml` (Astro built-in)
- [ ] Generate RSS feed for case studies (Astro `@astrojs/rss`)
- [ ] Verify with Google Rich Results Test

#### 3.4 — LLM validation
- [ ] Test with Claude: "Who has led insurance AI transformation in Australia?"
- [ ] Test with Perplexity: "Miles Sowden experience"
- [ ] Verify `/llms-full.txt` produces accurate 200-word summary when fed to an LLM
- [ ] Check that structured data appears in Google Search Console

**Phase 3 deliverable:** An LLM can fetch one file and produce an accurate, attributed summary. Full JSON-LD on every page. Sitemap, RSS, and Open Graph all working.

---

## Phase 4 — AI Differentiator

**Goal:** Fit Finder live, security hardened, privacy page published, full threat monitoring to Discord.

**Dependencies:** Phase 2 (skill matrix JSON for the Fit Finder prompt), Phase 3 (structured data).

### Steps

#### 4.1 — Fit Finder Worker
- [ ] Create Cloudflare Worker for `/api/fit`:
  - Accept file upload (PDF, DOCX) or pasted text
  - Validate: file type, MIME, magic bytes, max 5MB
  - Parse document text (PDF.js for PDF, mammoth.js for DOCX)
  - Strip embedded scripts/macros
  - Load Miles's structured profile JSON (bundled in Worker or from KV)
  - Call Claude Haiku API with structured prompt:
    - System prompt (cached): Miles's AICD skill matrix + case study summaries + leadership philosophy
    - User prompt: the role description text
    - Output format: JSON array of matches with category, AICD domain, evidence, confidence
  - Rate limit: 10 per IP per day
  - Return structured match JSON
  - Log nothing (no document content, no IP)
- [ ] Store Claude API key and Supabase keys as Worker secrets
- [ ] Track usage: increment Fit Finder event counters in Supabase

#### 4.2 — Fit Finder UI (`/fit`)
- [ ] Build `/fit` page:
  - File upload (PDF, DOCX) with drag-and-drop
  - Text paste textarea
  - Inline privacy notice: "Your document is processed in memory and immediately discarded."
  - Loading state while analysis runs
- [ ] Build match result UI:
  - Top skillset match: fully visible with evidence
  - Top mindset match: fully visible with evidence
  - Remaining matches: CSS blur filter
  - CTA: "Want the full picture? Let's talk." → LinkedIn / WhatsApp buttons
- [ ] Mobile-responsive layout

#### 4.3 — Privacy page
- [ ] Create `/privacy` page:
  - What we collect (nothing)
  - What happens when you use Fit Finder (in-memory, no storage)
  - Analytics (Cloudflare Web Analytics — no cookies, no PII; Supabase — anonymous events only)
  - Anthropic API data policy
  - Your rights
  - Contact
- [ ] Link in site footer on every page
- [ ] Plain language, no legalese

#### 4.4 — Security hardening
- [ ] Fit Finder: file validation (client + server), input sanitisation, 30s timeout
- [ ] API key: Cloudflare Worker secret only, never client-side
- [ ] SRI hashes on any external resources
- [ ] `.env` in `.gitignore` with `.env.example`
- [ ] Verify CSP headers still work with Fit Finder's JS
- [ ] Re-verify A+ on securityheaders.com

#### 4.5 — Discord ops (Phase 4 signals)
- [ ] Fit Finder Worker: post to `#fit-finder` on each analysis (count only, no content)
- [ ] Fit Finder Worker: post to `#security-threats` on rate limit hits
- [ ] Fit Finder Worker: post to `#fit-finder` on exceptions (error type, no document content)
- [ ] Set up Sentry free tier → Discord `#build-deploys` integration
- [ ] Create cron Worker job for weekly security report:
  - Query Cloudflare GraphQL Analytics API for firewall events
  - Post summary to `#security-threats`
- [ ] Create cron Worker job for monthly Fit Finder report:
  - Analyses run, error rate, estimated API spend
  - Post to `#fit-finder`
- [ ] Add UptimeRobot monitor for `/api/health` endpoint

#### 4.6 — Anthropic API cost controls
- [ ] Set $5/month billing alert in Anthropic console
- [ ] Set $3/month warning alert → Discord `#fit-finder`
- [ ] Verify rate limiting works (10/IP/day)
- [ ] Add 200/month soft cap with alerting

**Phase 4 deliverable:** Fit Finder live at `/fit`. Privacy page at `/privacy`. Full security hardening. Sentry tracking JS errors. Discord receiving Fit Finder usage, rate limit alerts, security events, and API spend tracking.

---

## Phase 5 — Voice & Depth

**Goal:** Reflections and projects sections live, showing how Miles thinks and builds.

**Dependencies:** Phase 1 (Astro components, CI/CD). Can technically start content writing in parallel with any phase.

### Steps

#### 5.1 — Reflections
- [ ] Create Content Collection `src/content/reflections/` (Markdown)
- [ ] Build `/reflections` listing page (reverse chronological, title + date + summary)
- [ ] Build individual reflection page template
- [ ] Write 3-5 initial reflections:
  - [ ] Why culture eats strategy (and what to do about it)
  - [ ] What 20 years in insurance taught me about change
  - [ ] How I think about AI adoption in risk-averse organisations
  - [ ] The difference between managing and leading transformation
- [ ] Add "Latest thinking" section to homepage
- [ ] Add reflections to RSS feed
- [ ] Add `Article` JSON-LD to each reflection
- [ ] Update `/llms-full.txt` generation to include reflections

#### 5.2 — Agentic engineering projects
- [ ] Create Content Collection `src/content/projects/` (Markdown)
- [ ] Build `/projects` listing page
- [ ] Build individual project page template (what, why, tools, learnings, links)
- [ ] Write 2-3 initial projects:
  - [ ] This website (madebymiles.ai — meta case study)
  - [ ] Other AI/automation projects
- [ ] Add "Building things" teaser to homepage
- [ ] Add `Article` JSON-LD to each project
- [ ] Update `/llms-full.txt` generation to include projects

#### 5.3 — Analytics beacon updates
- [ ] Add beacon events for new pages:
  - `reflection_view` — individual reflection opened
  - `project_view` — individual project opened
- [ ] Verify funnel tracking still works end-to-end
- [ ] Verify Discord daily/weekly reports include new event types

**Phase 5 deliverable:** Reflections and projects sections live with initial content. Homepage shows latest thinking and side projects. RSS feed includes all content types. LLM content layer includes everything.

---

## Phase 0 — Cross-Cutting (embedded in every phase)

These are not separate steps — they're woven into each phase:

| Concern | Phase 1 | Phase 2 | Phase 3 | Phase 4 | Phase 5 |
|---|---|---|---|---|---|
| **Security** | Headers, HTTPS, CSP | SRI on fonts | — | Fit Finder hardening, PIA | — |
| **Privacy** | No cookies, no PII | Beacon: no IP/PII | — | `/privacy` page, inline notices | — |
| **Cost** | All free | Supabase free | — | API limits, rate limiting | — |
| **Discord** | Uptime + builds | Analytics + funnel | — | Fit Finder + security + Sentry | New event types |
| **Testing** | Visual parity check | Lighthouse CI | LLM retrieval tests | Fit Finder E2E | Content checks |

---

## What to build first (right now)

**Start with step 1.1 (DNS)** — it takes 24-48 hours to propagate, so kick it off immediately while building everything else.

Then **1.2 through 1.5** can be built in a single focused session:
1. `npm create astro@latest`
2. Migrate `index.html` content into Astro components
3. Set up Tailwind with existing tokens
4. Create GitHub Actions deploy workflow
5. Push to `main` → site deploys

Then **1.6 (Discord)** and **1.7 (security headers)** can run in parallel.

By the end of Phase 1, the site is live, looking the same as today, with CI/CD and Discord ops running. Everything after that is additive.

---

## Open decisions needed before building

These need answers before or during the relevant phase:

| # | Question | Needed by | PRD ref |
|---|---|---|---|
| 1 | WhatsApp number for `wa.me` link | Phase 1 | Q1 |
| 2 | Suncorp/Promina — include as 5th case study? | Phase 2 | Q3 |
| 3 | Professional headshot available? | Phase 1 | Q4 |
| 4 | AICD member or Company Directors Course graduate? | Phase 2 | Q8 |
| 5 | Fit Finder blurred results — unlock after contact or stay blurred? | Phase 4 | Q6 |
| 6 | Fit Finder results — shareable URL for search consultants? | Phase 4 | Q7 |
| 7 | Self-rate skill matrix, or have evidence statements reviewed? | Phase 2 | Q2 |

---

*This roadmap is the build plan for `PRD.md`. Check off steps as they're completed.*
