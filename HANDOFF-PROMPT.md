# Handoff Prompt -- madebymiles.ai Observability and Infrastructure

**Date:** 12 March 2026
**Context:** This prompt hands over the remaining back-end and observability work for madebymiles.ai. The front-end site is live, the Fit Finder is deployed and working end-to-end. Read this file first, then read `PRD.md` and `docs/PRD-observability-and-design-integration.md` for full context.

---

## What is madebymiles.ai

A personal executive site for Miles Sowden, an insurance executive targeting CEO, CXO, and NED roles in Australian insurance and financial services. Built on Astro 5 (static, GitHub Pages), with a Cloudflare Worker powering the AI Fit Finder feature.

---

## Current state (what is working)

### Site and Fit Finder -- COMPLETE

- Astro 5 site live on madebymiles.ai via GitHub Pages + Cloudflare CDN
- Pages: Homepage, Experience (/experience), Contact (/contact), Privacy (/privacy), 5 case study pages (/work/*)
- Fit Finder (two-phase AI role matching) deployed on Cloudflare Workers
  - Phase 1: `POST /api/fit` returns executive summary + top match cards (~400 tokens, Claude Haiku)
  - Phase 2: `POST /api/fit/detail` returns complete AICD skill matrix (10 entries) + 2-3 matched case studies (~1800 tokens, Claude Haiku)
- Cloudflare Turnstile bot protection working end-to-end (client + server verification)
- CSP headers delivered via Cloudflare Response Header Transform Rule
- Discord webhook alerts for Fit Finder usage and errors
- Rate limiting via Workers KV (100/IP/day)
- Three-tier results structure with LinkedIn/WhatsApp unlock
- Profile hydration pattern: Claude returns compact JSON, Worker hydrates with full profile data

### Discoverability -- COMPLETE

- `/llms.txt` and `/llms-full.txt` auto-generated from content collections
- Article JSON-LD on each case study page
- RSS feed at `/rss.xml`
- robots.txt with LLM content references
- Person JSON-LD with credentials, occupations, knowsAbout

### CI/CD Pipeline -- COMPLETE

- GitHub Actions: build, deploy to GitHub Pages, Lighthouse CI, Worker deploy
- Lighthouse CI tests 4 URLs with budget file (`.github/lighthouse-budget.json`)
- Worker deploy gated behind `vars.WORKER_ENABLED`
- Discord notifications: build success to #reports, failures to #alerts, Lighthouse scores to #reports
- `npm audit` in CI

### Databricks Observability -- PARTIALLY COMPLETE

- Databricks Free Edition workspace: `https://dbc-0caa5555-b747.cloud.databricks.com` (mlfsowden@gmail.com)
- 6 ingestion notebook templates in `databricks/notebooks/`
- Unity Catalog schemas defined for 6 tables (see PRD-observability doc for full schemas)
- Weekly GenAI report workflow: `.github/workflows/weekly-report.yml` (soft-fail, needs secrets)
- **Confirmed working:** Cloudflare ingestion (7 days), GitHub Actions ingestion, outbound internet from notebooks
- **Confirmed working pattern:** Python `requests` with widget-based tokens (not SQL `http_request()`, not `dbutils.secrets`)
- Setup guide: `databricks/setup-databricks.md`
- Full PRD: `docs/PRD-observability-and-design-integration.md`

### Penpot Design Integration -- READY TO ACTIVATE

- Setup script: `scripts/setup-penpot-mcp.sh`
- MCP server config added to Claude Code (`http://localhost:4401/mcp`)
- Requires running setup script from Mac terminal (not done yet)

---

## Known issues and blockers

### CRITICAL: Supabase free tier pausing

Supabase pauses inactive projects on the free tier after 7 days of inactivity. This is a known limitation of Supabase Free. The PRD (Epic 11, Section 1) specifies Supabase as the analytics beacon database:

```
Browser (sendBeacon) --> Cloudflare Worker (/api/beacon) --> Supabase Postgres
```

**Impact:** If the beacon Worker is built as specified in the PRD, the Supabase project will pause unless:
- The site generates enough beacon traffic to keep it active (unlikely for a personal site in early months)
- Miles manually unpauses it regularly (bad UX, defeats the purpose)
- A keep-alive cron pings the Supabase API daily (adds complexity)

**Decision needed:** The PRD's Supabase beacon architecture may need to be reconsidered. Options:

1. **Keep Supabase, add keep-alive cron** -- A scheduled GitHub Actions job or Cloudflare Worker pings the Supabase REST API daily to prevent pausing. Simplest to implement, but adds a dependency and a failure mode.

2. **Replace Supabase with Cloudflare Analytics Engine** -- Cloudflare's free Analytics Engine (25M data points/month) accepts write events from Workers and supports SQL-like queries. No pausing risk, no external dependency, already in the Cloudflare ecosystem. The beacon Worker writes directly to Analytics Engine instead of Supabase.

3. **Replace Supabase with Databricks directly** -- Since Databricks is already the observability platform, route beacon data there. But Databricks Free Edition may not accept real-time writes from a Worker (needs testing).

4. **Defer the beacon entirely** -- Cloudflare Web Analytics (already active, free, passive) provides page views, top pages, referrers, and Core Web Vitals without any custom code. The custom beacon adds funnel tracking (scroll_50, skill_matrix_view, cta_click_*) which is valuable but not critical yet.

**Recommendation:** Option 4 (defer) for now -- Cloudflare Web Analytics covers the basics. Revisit when the site has enough traffic to justify funnel tracking. If funnel tracking is needed sooner, Option 2 (Cloudflare Analytics Engine) is the cleanest path.

### Databricks Free Edition limitations (hard-won lessons)

These were discovered through painful trial and error (see retro in `docs/PRD-observability-and-design-integration.md`):

| Feature | Status on Free Edition |
|---|---|
| `dbutils.secrets.createScope` | Must use UI, not notebooks |
| `dbutils.secrets.put` | Not available in notebooks |
| Secrets REST API | 404 -- not available |
| `dbutils.secrets.get` | Works (can read if secrets exist in a scope) |
| Outbound internet from notebooks | Works (confirmed) |
| `http_request()` SQL function | Works for simple GETs, corrupts JSON for complex payloads |
| Unity Catalog connections | Works for credential storage |
| Personal access tokens | Not yet tested |
| MCP server | Not yet tested |

**The working pattern:** Python `requests` with widget-based tokens. Each notebook has `dbutils.widgets.text()` at the top. You paste the API token into the widget, then run. For scheduled jobs, tokens need Databricks secrets or environment variables.

**Widget quirk:** Databricks widgets ignore default values if the widget was previously created empty. Fix: run `dbutils.widgets.removeAll()` before first run.

### Supabase ingestion notebook may be moot

`databricks/notebooks/ingest_supabase.py` was written to pull Supabase project health metrics into Databricks. If Supabase is dropped as the beacon database, this notebook has limited value (it only checks db_healthy, db_size, storage, bandwidth). It can be removed or deprioritised.

---

## What needs to be done

### 1. Finish Databricks setup (partially done)

**Reference:** `docs/PRD-observability-and-design-integration.md` and `databricks/setup-databricks.md`

**Already done:**
- Workspace created, catalog/schema defined
- Cloudflare and GitHub Actions ingestion confirmed working
- 6 notebook templates written and in repo
- Weekly report workflow in GitHub Actions (soft-fail mode)

**Still to do:**
- Run remaining ingestion notebooks: Sentry, Lighthouse, GSC (and Supabase if kept)
- Collect API tokens for each service (see Browser Session 3 in the PRD-observability doc for where to get each one)
- Build the AI/BI Dashboard (4 tabs: Performance, Security, Deployment, Search/Traffic -- SQL queries documented in PRD-observability doc)
- Test Genie natural language queries on published dashboard
- Generate Databricks personal access token (if available on Free Edition)
- Add GitHub repo secrets: `DATABRICKS_HOST`, `DATABRICKS_TOKEN`, `ANTHROPIC_API_KEY`
- Add GitHub repo variables: `DATABRICKS_REFRESH_JOB_ID`, `DATABRICKS_WAREHOUSE_ID`
- Schedule daily ingestion job in Databricks Workflows
- Trigger weekly report manually, verify it posts to Discord #reports
- Remove `continue-on-error: true` from weekly-report.yml after it passes green

### 2. Resolve Supabase beacon architecture (decision needed)

**Reference:** PRD.md Epic 11 Section 1

The PRD specifies a custom analytics beacon writing to Supabase. Given the pausing issue, decide whether to:
- Build it as specified with a keep-alive mechanism
- Switch to Cloudflare Analytics Engine
- Defer and rely on Cloudflare Web Analytics for now

If building the beacon:
- New Cloudflare Worker endpoint: `/api/beacon`
- Client-side sendBeacon script in `src/layouts/Base.astro`
- 8 tracked funnel events (page_view through cta_click_whatsapp -- see PRD)
- Update CSP `connect-src` to allow the beacon endpoint
- Update `SECURITY-HEADERS.md` and Cloudflare Transform Rule

### 3. Scheduled Discord reports (partially done)

**Reference:** PRD.md Epic 11 Section 2

The weekly GenAI report is built (`.github/workflows/weekly-report.yml`) but not yet active. It queries Databricks and uses Claude Sonnet to generate improvement proposals.

**Still to do:**
- Daily summary report (08:00 AEST to #site-visitors) -- not built yet. If beacon is deferred, this depends on Cloudflare Web Analytics data instead of Supabase.
- Weekly funnel report (Monday 08:00 to #funnel-tracking) -- depends on beacon data
- Weekly security report (Monday 08:00 to #security-threats) -- not built yet. Needs Cloudflare GraphQL Analytics API query.
- Monthly Fit Finder report (1st of month to #fit-finder) -- not built yet. Data available from existing Worker Discord webhooks.

**Discord channels already created:**
`#site-visitors`, `#funnel-tracking`, `#uptime-alerts`, `#build-deploys`, `#security-threats`, `#fit-finder`, `#dependency-alerts`

### 4. Security and threat monitoring (not started)

**Reference:** PRD.md Epic 11 Section 6

- Scheduled Worker or GitHub Actions job querying Cloudflare GraphQL Analytics API for firewall events, bot scores, threat countries
- Weekly summary posted to `#security-threats`
- Rate limit alerts already in place via Fit Finder Worker

### 5. Uptime monitoring (not started)

**Reference:** PRD.md Epic 11 Section 4

- UptimeRobot free tier: 3 monitors (homepage, llms.txt, /api/health)
- UptimeRobot native Discord webhook to `#uptime-alerts`
- This is a manual configuration task, not code

### 6. Penpot design system setup (ready to activate)

**Reference:** `docs/PRD-observability-and-design-integration.md` Stream 1

- Run `bash scripts/setup-penpot-mcp.sh` from Mac terminal
- Create design system in Penpot with tokens from `tailwind.config.mjs`
- Connect Claude Code MCP
- This is a Mac-only task (needs terminal and VS Code)

---

## Cloudflare Worker secrets (already set)

Set via `npx wrangler secret put`:
- `ANTHROPIC_API_KEY`
- `JWT_SECRET`
- `DISCORD_WEBHOOK_REPORTS`
- `DISCORD_WEBHOOK_ALERTS`
- `TURNSTILE_SECRET_KEY`

KV namespace: `RATE_LIMIT_KV` (238b5712c7fe45dcb0c020aa7850036d)

---

## Key files and locations

| File | Purpose |
|---|---|
| `PRD.md` | Full product requirements (Epic 11 has observability specs) |
| `docs/PRD-observability-and-design-integration.md` | Databricks + Penpot detailed PRD with retro and lessons |
| `databricks/setup-databricks.md` | Step-by-step Databricks setup guide |
| `databricks/notebooks/` | 6 ingestion notebooks + 1 connections setup |
| `.github/workflows/deploy.yml` | Main CI/CD pipeline |
| `.github/workflows/weekly-report.yml` | Weekly GenAI report (soft-fail, needs secrets) |
| `CLAUDE.md` | Project rules and CI/CD quality gate protocol |
| `SECURITY-HEADERS.md` | CSP and header configuration |
| `src/layouts/Base.astro` | Base layout (beacon script would go here) |
| `src/pages/fit.astro` | Fit Finder front-end |
| `workers/fit-finder/` | Fit Finder Worker (index.ts, handlers/, lib/) |
| `workers/fit-finder/wrangler.toml` | Worker config, routes, KV bindings |
| `workers/fit-finder/src/lib/claude.ts` | Prompt engineering, VOICE_RULES, ACCURACY_RULES |
| `workers/fit-finder/src/profile.json` | Structured profile for AI matching |
| `scripts/setup-penpot-mcp.sh` | Penpot MCP setup script |
| `scripts/generate-profile.ts` | Profile JSON generator from content collections |
| `tailwind.config.mjs` | Design tokens (colours, fonts, spacing) |

---

## Architecture decisions already made

| Decision | Choice | Rationale |
|---|---|---|
| Observability platform | Databricks Free Edition (not Grafana) | GenAI layer (Genie + Claude MCP) reads both data and code to propose improvements |
| Design tool | Penpot (not Figma) | Free, open source, official MCP server |
| Alert channel | Discord | Already working, unlimited webhooks, unlimited history, free |
| Report delivery | Discord via GitHub Actions | No new tools, fits existing workflow |
| Report model | Claude Sonnet (not Opus) | Keeps weekly API cost under $0.05 |
| Notebook HTTP pattern | Python `requests` (not SQL `http_request()`) | SQL function corrupts JSON escaping. Learned the hard way. |
| Credential pattern | Widget-based tokens | `dbutils.secrets` API not available on Free Edition |
| Fit Finder architecture | Two-phase (summary then detail) | Keeps Phase 1 under 3 seconds |
| Profile hydration | Claude returns names, Worker hydrates data | Keeps token usage low |
| CSP delivery | Cloudflare Transform Rules | HTTP headers take precedence over meta tags |
| Static-first | No servers, no containers | Supabase free tier is the only database (if kept) |

---

## Design and content rules

- AU/UK spelling throughout (analyse, recognise, organisation)
- No em dashes, en dashes, or ampersands (exception: P&L)
- No "me" in CTAs. No desperate positioning.
- CTA text: direct and confident ("Contact", "Connect on LinkedIn", "Open WhatsApp")
- CEO-first lens: strategy, leadership, people first; AI is a capability not the identity
- Evidence over adjectives, outcomes over technology
- State final position only, never growth trajectories
- Every generated metric names the specific organisation
- Total variable cost under $5/month
- Apple x Tom Ford aesthetic: whitespace, restraint, typography

---

## Priority order for next session

1. **Decide on Supabase/beacon** -- Quick conversation, no code needed yet
2. **Finish Databricks ingestion** -- Run Sentry and Lighthouse notebooks, collect remaining API tokens
3. **Build Databricks dashboard** -- 4 tabs, SQL queries are documented
4. **Activate weekly report** -- Add secrets/variables to GitHub repo, trigger manually
5. **Configure UptimeRobot** -- Manual setup, 10 minutes
6. **Build security report** -- Cloudflare GraphQL query, post to Discord
7. **Build beacon** (if decided to proceed) -- Worker + client script + CSP update
8. **Penpot setup** -- Mac-only, when at home

---

## Lessons learned (carry forward)

### Databricks Free Edition (2026-03-11)

The ingestion notebooks went through 3 complete architectures before finding one that worked. See the full retro in `docs/PRD-observability-and-design-integration.md`. Key takeaway: **test one thing end-to-end before scaling to six.** When integrating with any unfamiliar platform:

1. Smoke test first, code second
2. One notebook fully tested, then clone
3. Pivot on first failure, do not patch
4. Document platform constraints before building on them

### Lighthouse CI thresholds

Thresholds committed without CI baseline testing. GitHub Actions runners are 2x slower than real users. Fixed: FCP 3500ms, interactive 5000ms. Protocol added to `CLAUDE.md`.

### Wrangler secrets UX

`wrangler secret put NAME` prompts for the value interactively. User pasted API keys as the name argument. Two keys were compromised and rotated. Always verify with `wrangler secret list`.

---

## User preferences

- Limited technical knowledge -- explain in plain English
- Values design discipline and brand consistency
- Prefers direct action over lengthy proposals
- Wants persona-based review of significant content changes (board chair, search consultant, CEO peer)
