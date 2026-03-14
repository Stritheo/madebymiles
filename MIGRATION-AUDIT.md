# Migration Audit: madebymiles.ai to milessowden.au

**Date:** 14 March 2026
**Scope:** Comprehensive verification of all services, features, and integrations against the PRD following domain migration.

---

## Executive Summary

The core migration is solid. The live site at milessowden.au is correctly configured with proper canonical URLs, structured data, security headers, and Cloudflare CDN. The Fit Finder Worker routes to the new domain. milessowden.com redirects correctly.

However, several backend services were never set up or were lost in the migration. The most visible issue is that madebymiles.ai (the old domain still indexed by Google) shows a broken GitHub Pages 404 page. Below is the full audit.

---

## Verified Working (no action needed)

| Item | Status | Evidence |
|---|---|---|
| GitHub Pages hosting | OK | milessowden.au serves correctly, CNAME file = milessowden.au |
| Astro config site URL | OK | `astro.config.mjs` site = `https://milessowden.au` |
| Cloudflare Worker routes | OK | `wrangler.toml` routes to `milessowden.au/api/*` |
| milessowden.com redirect | OK | 301 redirects to milessowden.au (verified in browser) |
| Homepage canonical URL | OK | `<link rel="canonical" href="https://milessowden.au/">` |
| Homepage OG URL | OK | `og:url` = `https://milessowden.au/` |
| JSON-LD Person schema | OK | `url` = `https://milessowden.au` |
| Source code domain refs | OK | Zero `madebymiles` references in `src/` directory |
| robots.txt | OK | Sitemap and llms.txt URLs all reference milessowden.au |
| llms.txt and llms-full.txt | OK | All URLs point to milessowden.au |
| Cloudflare Web Analytics | OK | Beacon script present on homepage |
| Turnstile widget | OK | Configured for milessowden.au, verified working with green tick |
| Turnstile hostnames | OK | Both milessowden.au and madebymiles.ai listed |
| CSP headers (Cloudflare Transform Rule) | OK | Includes challenges.cloudflare.com for Turnstile |
| CSP meta tag (HTML) | OK | Matches Cloudflare Transform Rule |
| AI Crawl Control | OK | Aligned with robots.txt policy (verified this session) |
| Deploy workflow (deploy.yml) | OK | References milessowden.au, posts to Discord |
| Lighthouse CI | OK | Tests 4 milessowden.au URLs, budgets defined |
| Worker deploy in CI | OK | Gated behind `vars.WORKER_ENABLED` |
| Security headers grade | OK | Grade A on securityheaders.com |
| HSTS | OK | max-age 63072000, includeSubDomains, preload |

---

## Issues Found: Action Required

### P1 (Critical) -- Visitor-facing impact

**1. madebymiles.ai shows broken 404 page**

- Current state: `https://madebymiles.ai/` returns "Site not found - GitHub Pages" (HTTP 404)
- Impact: Anyone finding the old domain via Google sees a broken page. This damages credibility.
- Root cause: GitHub Pages CNAME changed from madebymiles.ai to milessowden.au. Cloudflare DNS for madebymiles.ai still points to GitHub Pages, but Pages no longer recognises it.
- PRD says: madebymiles.ai is for "personal projects (separate)" and should remain live independently.
- Fix options:
  - **Quick fix (recommended now):** Add a Cloudflare Redirect Rule on the madebymiles.ai zone to 301 redirect all traffic to `https://milessowden.au`. Same pattern as milessowden.com.
  - **Later:** When the personal projects site is built, point madebymiles.ai to its own hosting.

**2. og:site_name still says "Made by Miles"**

- Location: `src/layouts/Base.astro` line 37
- Current: `<meta property="og:site_name" content="Made by Miles" />`
- Should be: `<meta property="og:site_name" content="Miles Sowden" />`
- Impact: Social sharing previews and search results show old branding.

### P2 (High) -- Monitoring and security gaps

**3. Sentry error tracking not installed**

- Current state: No Sentry SDK script found anywhere in the site source (`src/`) or the live page HTML.
- PRD requires: Sentry free tier (5k events/month) for client-side JS errors, with Discord integration posting to #build-deploys.
- The Databricks weekly report workflow references `madebymiles.observability.sentry_issues`, but no data is flowing because Sentry is not instrumented.
- Fix: Install `@sentry/browser` in the Fit Finder page (the primary JS-heavy page). Configure DSN. Set up Sentry Discord integration.

**4. UptimeRobot not configured**

- PRD status: "NOT STARTED"
- PRD requires 3 monitors: homepage (HTTP 200), llms.txt, Fit Finder health endpoint (`/api/health`).
- Alert channel: #uptime-alerts via native Discord webhook.
- Fix: Manual setup at dashboard.uptimerobot.com. Add 3 monitors pointing to milessowden.au. Configure Discord webhook to #uptime-alerts channel.

**5. Security headers: Grade A, target is A+**

- Missing for A+: Likely needs Permissions-Policy header to be more comprehensive in the Cloudflare Transform Rule. Current Permissions-Policy in the Transform Rule covers camera, microphone, geolocation. May need to add more restrictive policies or verify the header is being delivered correctly alongside the meta tag.
- The PRD exit criteria is: "The site scores A+ on securityheaders.com."

### P3 (Medium) -- Internal/operational

**6. Google Search Console: migration verification needed**

- GSC was set up for milessowden.au in the previous session, but the following needs confirming:
  - Change of Address tool used (from madebymiles.ai to milessowden.au) if the old property exists in GSC
  - Sitemap submitted for milessowden.au
  - madebymiles.ai property still exists and shows the redirect
- Impact: Until Google processes the domain change, madebymiles.ai will continue appearing in search results.

**7. Databricks references old domain in queries**

- `weekly-report.yml` line 72 references `madebymiles.observability.sentry_issues`
- This is the Databricks Unity Catalog name, not a domain reference, so it is functionally correct. The catalog name `madebymiles` does not need to change as it is an internal database identifier.
- However, Databricks notebooks and setup docs reference the old domain in places. Low impact since these are internal tooling.

**8. Weekly report workflow needs secrets**

- `weekly-report.yml` requires GitHub Actions secrets: `DATABRICKS_HOST`, `DATABRICKS_TOKEN`, `DATABRICKS_WAREHOUSE_ID`, `ANTHROPIC_API_KEY`, `DISCORD_WEBHOOK_REPORTS`.
- Current state: Workflow exists, set to `continue-on-error: true` (soft-fail), but likely missing secrets.
- Fix: Add the required secrets to GitHub repo settings.

**9. OG image uses relative path**

- `src/pages/index.astro` passes `ogImage="/images/miles-sowden-headshot.jpeg"` (relative path)
- Some social platforms require absolute URLs for OG images to render previews.
- Fix: Change to `ogImage="https://milessowden.au/images/miles-sowden-headshot.jpeg"` or resolve in Base.astro.

**10. package.json name is still "madebymiles-site"**

- Location: `package.json` line 2
- Cosmetic, zero functional impact. Update to `milessowden-site` for consistency.

### P4 (Low) -- Documentation and future

**11. Internal docs reference old domain**

- Files: COWORK-PROMPT.md, SETUP-CHECKLIST.md, databricks/setup-databricks.md
- These are internal setup guides and prompts, not deployed content.
- Low priority but should be updated when next editing these files.

**12. Supabase keepalive workflow exists but Supabase is ON HOLD**

- `supabase-keepalive.yml` is a workflow that runs daily, but Supabase is flagged ON HOLD in the PRD.
- If Supabase secrets are not configured, this workflow silently fails. No harm, but adds noise.
- Fix: Either configure Supabase or disable the workflow.

**13. Fit Finder health endpoint (/api/health) not confirmed**

- PRD specifies UptimeRobot should monitor `/api/health`.
- Needs verification that this endpoint exists in the Worker code and returns 200.

---

## Services Migration Status

| Service | PRD Role | Migration Status | Notes |
|---|---|---|---|
| GitHub Pages | Static hosting | MIGRATED | CNAME = milessowden.au |
| Cloudflare (milessowden.au zone) | DNS, CDN, headers, analytics | MIGRATED | All headers, Turnstile, Web Analytics working |
| Cloudflare (milessowden.com zone) | 301 redirect | MIGRATED | Redirects to milessowden.au |
| Cloudflare (madebymiles.ai zone) | Personal projects | BROKEN | Shows GitHub Pages 404. Needs redirect rule. |
| Cloudflare Workers (Fit Finder) | Serverless API | MIGRATED | Routes to milessowden.au/api/* |
| Cloudflare Turnstile | Bot protection | MIGRATED | Both hostnames configured, verified working |
| Cloudflare AI Crawl Control | Crawler policy | MIGRATED | Aligned with robots.txt (verified this session) |
| Discord server | Ops dashboard | PARTIAL | Server exists, webhooks in deploy.yml. No UptimeRobot or Sentry integration. |
| UptimeRobot | Uptime monitoring | NOT STARTED | Needs manual setup with 3 monitors |
| Sentry | JS error tracking | NOT STARTED | No SDK installed on the site |
| Databricks | Observability platform | PARTIAL | Workspace exists, Cloudflare and GitHub ingestion done. Sentry/Lighthouse/GSC ingestion not yet run. |
| Google Search Console | SEO monitoring | NEEDS VERIFICATION | Set up in previous session, needs Change of Address and sitemap verification |
| Claude API (Anthropic) | Fit Finder LLM | NO CHANGE NEEDED | API key stored as Worker secret, domain-agnostic |
| Squarespace | Domain registration | NO CHANGE NEEDED | Registrar only, DNS delegated to Cloudflare |

---

## Recommended Action Plan (Priority Order)

1. **Add madebymiles.ai redirect rule in Cloudflare** (5 min, you do this)
   - Go to Cloudflare dashboard, select madebymiles.ai zone
   - Rules, Redirect Rules, create rule: all traffic 301 to `https://milessowden.au`
   - Same pattern as milessowden.com

2. **Fix og:site_name** (2 min, I can do this)
   - Change "Made by Miles" to "Miles Sowden" in Base.astro

3. **Set up UptimeRobot monitors** (10 min, you do this)
   - 3 monitors: homepage, llms.txt, /api/health (if it exists)
   - Discord webhook to #uptime-alerts

4. **Install Sentry on the site** (30 min, I can do this)
   - Add @sentry/browser to the Fit Finder page
   - Configure DSN from your Sentry project
   - Set up Sentry Discord integration to #build-deploys

5. **Verify Google Search Console** (10 min, you do this)
   - Confirm milessowden.au property is verified
   - Submit sitemap: https://milessowden.au/sitemap-index.xml
   - Use Change of Address tool if madebymiles.ai property exists

6. **Fix OG image to absolute URL** (2 min, I can do this)

7. **Add weekly report secrets to GitHub** (5 min, you do this)
   - DATABRICKS_HOST, DATABRICKS_TOKEN, ANTHROPIC_API_KEY, DISCORD_WEBHOOK_REPORTS

8. **Update package.json name** (1 min, I can do this)

---

## Security and Compliance Summary

| Check | Result | Notes |
|---|---|---|
| securityheaders.com grade | A | Target A+ (likely needs expanded Permissions-Policy) |
| HSTS | Present | max-age 63072000, includeSubDomains, preload |
| CSP | Present | Both meta tag and Cloudflare Transform Rule |
| X-Content-Type-Options | Present | nosniff |
| X-Frame-Options | Present | DENY |
| Referrer-Policy | Present | strict-origin-when-cross-origin |
| Permissions-Policy | Present | camera, microphone, geolocation denied |
| Cookies | None | Privacy by design |
| Third-party tracking | None | Cloudflare Web Analytics only (cookie-free) |
| PII collection | None | No forms capture personal data |
| Turnstile bot protection | Working | Verified with green tick on /fit |
| Rate limiting | Configured | KV-based in Worker |
| API key exposure | Protected | Server-side only (Worker secrets) |
| npm audit in CI | Present | continue-on-error: true |
| Dependabot | Active | GitHub default configuration |
