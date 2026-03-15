# Migration Audit: madebymiles.ai to milessowden.au

**Date:** 14 March 2026
**Last updated:** 14 March 2026 (post-remediation)
**Scope:** Comprehensive verification of all services, features, and integrations against the PRD following domain migration.

---

## Executive Summary

Migration from madebymiles.ai to milessowden.au is complete. All critical and high-priority issues identified in the initial audit have been resolved. The site is live, monitored, and protected. Two stretch items remain (security headers A+ and milessowden.com.au defensive registration).

---

## Verified Working

| Item | Status | Evidence |
|---|---|---|
| GitHub Pages hosting | OK | milessowden.au serves correctly, CNAME file = milessowden.au |
| Astro config site URL | OK | `astro.config.mjs` site = `https://milessowden.au` |
| Cloudflare Worker routes | OK | `wrangler.toml` routes to `milessowden.au/api/*` |
| milessowden.com redirect | OK | 301 redirects to milessowden.au |
| madebymiles.ai redirect | FIXED | 301 redirects to milessowden.au via Cloudflare Redirect Rule |
| Homepage canonical URL | OK | `<link rel="canonical" href="https://milessowden.au/">` |
| Homepage OG URL | OK | `og:url` = `https://milessowden.au/` |
| og:site_name | FIXED | Changed from "Made by Miles" to "Miles Sowden" |
| OG image URL | FIXED | Resolves to absolute URL via `new URL(ogImage, Astro.site).href` |
| JSON-LD Person schema | OK | `url` = `https://milessowden.au` |
| Source code domain refs | OK | Zero `madebymiles` references in `src/` directory |
| robots.txt | OK | Sitemap and llms.txt URLs reference milessowden.au |
| llms.txt and llms-full.txt | OK | All URLs point to milessowden.au |
| Cloudflare Web Analytics | OK | Beacon script present on homepage |
| Turnstile widget | OK | Configured for milessowden.au, verified working |
| Turnstile hostnames | OK | Both milessowden.au and madebymiles.ai listed |
| CSP (Cloudflare Transform Rule) | FIXED | Includes Turnstile and Sentry domains |
| CSP (HTML meta tag) | FIXED | Matches Cloudflare Transform Rule |
| AI Crawl Control | OK | Aligned with robots.txt policy |
| Deploy workflow (deploy.yml) | OK | References milessowden.au, posts to Discord |
| Lighthouse CI | OK | Tests 4 milessowden.au URLs |
| Worker deploy in CI | OK | Gated behind `vars.WORKER_ENABLED` |
| Security headers grade | OK | Grade A on securityheaders.com |
| HSTS | OK | max-age 63072000, includeSubDomains, preload |
| package.json name | FIXED | Changed from "madebymiles-site" to "milessowden-site" |
| Worker /api/health HEAD support | FIXED | Responds to both GET and HEAD requests for UptimeRobot |

---

## Resolved Issues

### P1 (Critical) -- All resolved

**1. madebymiles.ai 404 page** -- RESOLVED
Cloudflare Redirect Rule added to 301 all traffic to `https://milessowden.au`.

**2. og:site_name "Made by Miles"** -- RESOLVED
Changed to "Miles Sowden" in `src/layouts/Base.astro`.

### P2 (High) -- All resolved

**3. Sentry error tracking** -- RESOLVED
Sentry browser SDK (v8.49.0) installed on `/fit` page via CDN script tag. DSN configured. CSP updated in both HTML meta tag and Cloudflare Transform Rule to allow `browser.sentry-cdn.com` (script-src) and `*.ingest.us.sentry.io` (connect-src). Sentry Discord and GitHub integrations already configured.

**4. UptimeRobot monitoring** -- RESOLVED
Three monitors configured: homepage (HTTP 200), llms.txt, /api/health. Discord webhook to #alerts channel. Worker updated to handle HEAD requests (UptimeRobot free tier sends HEAD only).

### P3 (Medium) -- All resolved

**5. Google Search Console** -- RESOLVED
milessowden.au property verified. Sitemap (`https://milessowden.au/sitemap-index.xml`) submitted and accepted. Live URL inspection and indexing requested. Change of Address tool not available (madebymiles.ai property not in GSC). Google will consolidate search results over 2-8 weeks; 301 redirect ensures visitors reach the correct site.

**6. OG image relative path** -- RESOLVED
Base.astro now resolves OG image to absolute URL: `new URL(ogImage, Astro.site).href`.

**7. Weekly report secrets** -- RESOLVED
GitHub Actions secrets added: `DATABRICKS_HOST`, `DATABRICKS_TOKEN`, `DATABRICKS_WAREHOUSE_ID`, `ANTHROPIC_API_KEY`, `DISCORD_WEBHOOK_REPORTS`.

**8. package.json name** -- RESOLVED
Changed from "madebymiles-site" to "milessowden-site".

---

## Remaining Items (Stretch)

| Item | Priority | Status | Notes |
|---|---|---|---|
| Security headers A+ | P2 | OPEN | Currently Grade A. Needs expanded Permissions-Policy header in Cloudflare Transform Rule. |
| Register milessowden.com.au | P4 | OPEN | Defensive registration. Requires AU-accredited registrar (e.g. VentraIP). |
| Internal docs domain refs | P4 | OPEN | COWORK-PROMPT.md, SETUP-CHECKLIST.md, databricks/setup-databricks.md reference old domain. Cosmetic only. |
| ~~Supabase keepalive workflow~~ | -- | REMOVED | Supabase removed from architecture 15 Mar 2026. Workflow deleted. |
| Databricks Sentry ingestion | P3 | READY | Notebook exists, needs Sentry data flowing (now resolved) to produce results. |
| Databricks Lighthouse ingestion | P3 | READY | Notebook exists, ready to run. |

---

## Services Migration Status

| Service | PRD Role | Status | Notes |
|---|---|---|---|
| GitHub Pages | Static hosting | MIGRATED | CNAME = milessowden.au |
| Cloudflare (milessowden.au) | DNS, CDN, headers, analytics | MIGRATED | All headers, Turnstile, Web Analytics, CSP working |
| Cloudflare (milessowden.com) | 301 redirect | MIGRATED | Redirects to milessowden.au |
| Cloudflare (madebymiles.ai) | 301 redirect (interim) | MIGRATED | Redirects to milessowden.au |
| Cloudflare Workers (Fit Finder) | Serverless API | MIGRATED | Routes to milessowden.au/api/*, HEAD support added |
| Cloudflare Turnstile | Bot protection | MIGRATED | Both hostnames configured |
| Cloudflare AI Crawl Control | Crawler policy | MIGRATED | Aligned with robots.txt |
| Discord server | Ops dashboard | COMPLETE | Deploy notifications, UptimeRobot alerts, Sentry alerts all configured |
| UptimeRobot | Uptime monitoring | COMPLETE | 3 monitors, Discord webhook to #alerts |
| Sentry | JS error tracking | COMPLETE | SDK on /fit, Discord and GitHub integrations active |
| Databricks | Observability platform | PARTIAL | Workspace exists. Cloudflare and GitHub ingestion done. Sentry/Lighthouse ingestion ready to run. |
| Google Search Console | SEO monitoring | COMPLETE | Property verified, sitemap submitted, indexing requested |
| Claude API (Anthropic) | Fit Finder LLM | NO CHANGE NEEDED | Domain-agnostic, Worker secrets |
| Squarespace | Domain registration | NO CHANGE NEEDED | Registrar only, DNS delegated to Cloudflare |

---

## Security and Compliance Summary

| Check | Result | Notes |
|---|---|---|
| securityheaders.com grade | A | Target A+ (needs expanded Permissions-Policy) |
| HSTS | Present | max-age 63072000, includeSubDomains, preload |
| CSP | Present | Meta tag and Cloudflare Transform Rule, includes Sentry and Turnstile domains |
| X-Content-Type-Options | Present | nosniff |
| X-Frame-Options | Present | DENY |
| Referrer-Policy | Present | strict-origin-when-cross-origin |
| Permissions-Policy | Present | camera, microphone, geolocation denied |
| Cookies | None | Privacy by design |
| Third-party tracking | None | Cloudflare Web Analytics only (cookie-free) |
| PII collection | None | No forms capture personal data |
| Turnstile bot protection | Working | Verified on /fit |
| Rate limiting | Configured | KV-based in Worker |
| API key exposure | Protected | Server-side only (Worker secrets) |
| Sentry error tracking | Active | Browser SDK on /fit, DSN configured |
| UptimeRobot monitoring | Active | 3 monitors with Discord alerts |
| npm audit in CI | Present | continue-on-error: true |
| Dependabot | Active | GitHub default configuration |
