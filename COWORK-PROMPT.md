# Cowork Task: Close Out All Outstanding Items

**Last updated:** 14 March 2026

## Context

This is the canonical handoff for all remaining work on milessowden.au. The domain migration is complete and the site is live. Two workstreams remain open: Databricks observability setup, and a small number of post-migration stretch items.

Read these files first (in this order):
1. `MIGRATION-AUDIT.md` -- full audit of domain migration, shows what was resolved and what remains
2. `docs/PRD-observability-and-design-integration.md` -- Databricks PRD with architecture, table schemas, and hard-won platform lessons
3. `databricks/notebooks/` -- all 6 ingestion notebooks (ready to run, no code changes needed)

## Security boundary

**You do NOT handle API tokens.** When a notebook needs a token pasted into a widget, stop and tell Miles exactly what to paste and where. He will type the token himself. Never ask him to share tokens in chat.

- You build infrastructure, schemas, SQL, dashboards, and job configuration
- Miles pastes tokens into Databricks widget fields and clicks Run
- Miles adds secrets and variables to GitHub repo settings
- Miles does all browser-based configuration (Cloudflare, UptimeRobot, VentraIP)

---

## What is already done

### Site and migration (complete)
- milessowden.au live: GitHub Pages, Cloudflare CDN, CSP, HSTS, Turnstile, Sentry
- madebymiles.ai and milessowden.com both 301 redirect to milessowden.au
- og:site_name, OG image URL, package.json name all updated
- Security headers: Grade A on securityheaders.com
- Sentry: browser SDK v8.49.0 on /fit, DSN configured, Discord and GitHub integrations active
- UptimeRobot: 3 monitors active (homepage, llms.txt, /api/health) with Discord #alerts webhook
- Google Search Console: milessowden.au verified, sitemap submitted
- Worker /api/health: GET and HEAD both supported (UptimeRobot-compatible)
- Duplicate Sentry init block in fit.astro: removed and committed

### GitHub Actions secrets (confirmed added)
`DATABRICKS_HOST`, `DATABRICKS_TOKEN`, `DATABRICKS_WAREHOUSE_ID`, `ANTHROPIC_API_KEY`, `DISCORD_WEBHOOK_REPORTS`

Note: `DATABRICKS_REFRESH_JOB_ID` is still needed -- it will be known after the Databricks job is created in Workstream 1.

### Cloudflare Worker (deployed, confirmed working)
- `WORKER_ENABLED = true` is set in GitHub Actions variables
- Worker deploys automatically on every push to main via the `deploy-worker` CI job
- `/api/health` returns 200 for GET and HEAD (UptimeRobot monitor is green)
- `/api/fit` (Fit Finder) is live at milessowden.au/fit
- Static fallback `public/api/health` also exists as belt-and-suspenders for UptimeRobot

### Databricks (partial)
- Workspace: `https://dbc-0caa5555-b747.cloud.databricks.com` (mlfsowden@gmail.com, Google sign-in)
- Unity Catalog: `madebymiles` catalog and `observability` schema created
- Cloudflare ingestion: confirmed working previously (data in `madebymiles.observability.*`)
- GitHub Actions ingestion: confirmed working previously (data in `madebymiles.observability.*`)
- All 6 notebook templates in repo at `databricks/notebooks/` -- code is correct, no changes needed
- Weekly GenAI report workflow built at `.github/workflows/weekly-report.yml` (soft-fail)

---

## Workstream 1: Databricks (Claude guides, Miles executes in browser)

### Step 1 -- Create schemas

Open any notebook in Databricks, create a scratch cell, and run:

```sql
CREATE SCHEMA IF NOT EXISTS madebymiles.bronze;
CREATE SCHEMA IF NOT EXISTS madebymiles.silver;
CREATE SCHEMA IF NOT EXISTS madebymiles.gold;
```

Note: The previously confirmed data lives in `madebymiles.observability.*`. The new bronze/silver/gold architecture replaces it. The ingestion notebooks write to `bronze.*`, so re-running them will populate the new schema from scratch. The old `observability.*` data can be left as-is.

### Step 2 -- Import notebooks into Databricks

1. Navigate to Workspace in Databricks
2. Find or create the `madebymiles-observability` folder
3. Import each file from `databricks/notebooks/` (drag-and-drop or File > Import)
4. Notebooks to import: `ingest_cloudflare.py`, `ingest_github_actions.py`, `ingest_sentry.py`, `ingest_lighthouse.py`, `silver/transforms.py`, `gold/views.py`

### Step 3 -- Run ingestion notebooks

Run each notebook in this order. Before the first run of any notebook, run `dbutils.widgets.removeAll()` in a scratch cell (clears stale widget defaults).

**`ingest_cloudflare.py`**
Tell Miles: "Paste your Cloudflare API token into the CLOUDFLARE_API_TOKEN widget, paste your Zone ID into the CLOUDFLARE_ZONE_ID widget, then click Run All"
Verify: `SELECT * FROM madebymiles.bronze.cloudflare_analytics LIMIT 5`

**`ingest_github_actions.py`**
Tell Miles: "Paste your GitHub token into the GITHUB_TOKEN widget, then click Run All"
Verify: `SELECT * FROM madebymiles.bronze.github_actions_runs LIMIT 5`

**`ingest_sentry.py`** (now unblocked -- Sentry is live)
Tell Miles: "Paste your Sentry auth token into the SENTRY_TOKEN widget, set SENTRY_ORG to `stritheo`, set SENTRY_PROJECT to `madebymiles`, then click Run All"
Verify: `SELECT * FROM madebymiles.bronze.sentry_issues LIMIT 5`

**`ingest_lighthouse.py`**
Tell Miles: "Paste your GitHub token into the GITHUB_TOKEN widget, then click Run All"
Verify: `SELECT * FROM madebymiles.bronze.lighthouse_scores LIMIT 5`

**Skip** `ingest_gsc.py` -- needs Google Cloud service account JSON (too long for a widget). Park it.

**Skip** `ingest_supabase.py` -- Supabase removed from architecture (15 Mar 2026). Notebook no longer needed.

### Step 4 -- Run silver and gold notebooks

Run in order:
1. `silver/transforms.py` -- cleans and types all bronze tables into silver
2. `gold/views.py` -- creates aggregated views for the dashboard

Each handles missing source tables gracefully (try/except), so partial data is fine.

Verify gold layer:
```sql
SELECT * FROM madebymiles.gold.weekly_metrics ORDER BY metric_date DESC LIMIT 10;
SELECT * FROM madebymiles.gold.lighthouse_trend LIMIT 5;
```

### Step 5 -- Schedule daily ingestion job

1. Workflows > Create Job
2. Name: `madebymiles-daily-ingest`
3. Add tasks in this order (each as a separate notebook task):
   - `ingest_cloudflare` -- parameters: CLOUDFLARE_API_TOKEN, CLOUDFLARE_ZONE_ID
   - `ingest_github_actions` -- parameter: GITHUB_TOKEN
   - `ingest_sentry` -- parameters: SENTRY_TOKEN, SENTRY_ORG (stritheo), SENTRY_PROJECT (madebymiles)
   - `ingest_lighthouse` -- parameter: GITHUB_TOKEN
   - `silver/transforms` -- no parameters
   - `gold/views` -- no parameters
4. Tell Miles which parameter fields to fill in for each task -- he will type token values himself
5. Set schedule: daily at 00:00 UTC (10:00 AEST)
6. Save and note the **Job ID** -- Miles will add it as a GitHub Actions variable

After creating the job, tell Miles:
"Go to github.com/Stritheo/madebymiles/settings/variables/actions and add a variable named `DATABRICKS_REFRESH_JOB_ID` with the value [job ID]"

### Step 6 -- Build the AI/BI Dashboard

1. SQL > Dashboards > Create Dashboard
2. Name: `milessowden.au Observability`
3. Build 4 tabs (all queries use gold layer tables):

**Performance tab**
```sql
-- Lighthouse scores over time
SELECT run_date, url, performance, accessibility, best_practices, seo
FROM madebymiles.gold.lighthouse_trend
ORDER BY run_date DESC;

-- FCP and TTI trend
SELECT run_date, url, ROUND(fcp_ms, 0) AS fcp_ms, ROUND(tti_ms, 0) AS tti_ms
FROM madebymiles.gold.lighthouse_trend
ORDER BY run_date DESC;

-- Page weight trend
SELECT run_date, url, ROUND(total_kb, 1) AS total_kb
FROM madebymiles.gold.lighthouse_trend
ORDER BY run_date DESC;
```

**Security tab**
```sql
-- Error count by level
SELECT level, status, issue_count, total_events
FROM madebymiles.gold.sentry_summary;

-- Top issues by frequency
SELECT title, culprit, level, event_count, last_seen_ts
FROM madebymiles.gold.sentry_top_issues
ORDER BY event_count DESC
LIMIT 10;

-- Threats blocked by Cloudflare
SELECT date, threats
FROM madebymiles.silver.cloudflare_analytics
ORDER BY date DESC
LIMIT 14;
```

**Deployment tab**
```sql
-- Weekly pass/fail summary
SELECT week_start, total_runs, successful_runs, failed_runs,
       ROUND(success_rate_pct, 1) AS success_rate_pct,
       ROUND(avg_duration_seconds / 60, 1) AS avg_duration_min
FROM madebymiles.gold.deploy_summary
ORDER BY week_start DESC;

-- Deploy frequency (bar chart)
SELECT week_start, total_runs
FROM madebymiles.gold.deploy_summary
ORDER BY week_start DESC;
```

**Search and Traffic tab**
```sql
-- Daily visitors and page views
SELECT date, unique_visitors, page_views, bandwidth_mb
FROM madebymiles.gold.traffic_daily
ORDER BY date DESC
LIMIT 30;

-- Cache hit rate
SELECT date, cache_hit_rate
FROM madebymiles.silver.cloudflare_analytics
ORDER BY date DESC
LIMIT 30;
```

4. Publish the dashboard
5. Test Genie: "What are the Lighthouse scores this week?" and "How many deploys succeeded this week?"

### Step 7 -- Test the weekly report

Tell Miles: "Go to github.com/Stritheo/madebymiles/actions/workflows/weekly-report.yml and click Run workflow"

Check Discord #reports for the AI-generated report. If it posts successfully, the `continue-on-error: true` lines in the workflow can be removed in a follow-up commit.

---

## Workstream 2: Stretch items (Miles does these manually)

These do not require Claude. Listed for completeness.

| Item | Action | Notes |
|---|---|---|
| Security headers A+ | Cloudflare > milessowden.au > Transform Rules > find the headers rule > add more Permissions-Policy directives | Check securityheaders.com for the exact gap after updating |
| Register milessowden.com.au | VentraIP (AU-accredited registrar) | Defensive registration only |
| Internal docs cleanup | Update SETUP-CHECKLIST.md and databricks/setup-databricks.md when next editing those files | Cosmetic, references old domain |

---

## Critical platform constraints

1. **ALWAYS use Python `requests` for HTTP calls** -- never SQL `http_request()`. The SQL function corrupts JSON payloads via Spark string literal escaping. This caused two full notebook rewrites.
2. **Widget defaults are ignored** if the widget was previously created with an empty value. Always run `dbutils.widgets.removeAll()` before first run of any notebook.
3. **GSC service account JSON is too long for widgets.** Skip GSC ingestion entirely.
4. **`dbutils.secrets.put` does not work on Free Edition.** Secrets must be created via UI or stored as job parameters.
5. **Test one notebook end-to-end before proceeding to the next.** Verify data in the table before moving on.
6. **Notebook code pushed to GitHub is not auto-synced to Databricks.** If notebook code is updated, re-import or copy/paste into Databricks manually.

## Miles has these tokens ready

- GitHub token (fine-grained, `Stritheo/madebymiles`, Actions + Contents read)
- Cloudflare API token (read analytics) + Zone ID
- Sentry auth token + org slug (`stritheo`) + project slug (`madebymiles`)

He will paste them when told where. Never ask him to share tokens in chat.
