# Cowork Task: Complete Databricks Observability Setup

## Context

Read these files first (in this order):
1. `HANDOFF-PROMPT.md` -- current state summary and known blockers
2. `docs/PRD-observability-and-design-integration.md` -- detailed Databricks PRD with retro and hard-won platform lessons
3. `databricks/setup-databricks.md` -- step-by-step setup guide
4. `databricks/notebooks/` -- all 6 ingestion notebook templates

## Security boundary

**You do NOT handle API tokens.** When a notebook needs a token pasted into a widget, stop and tell Miles exactly what to paste and where. He will type the token himself. Never ask him to share tokens in chat.

Specifically:
- You build the infrastructure, schemas, SQL, dashboards, and job configuration
- Miles pastes tokens into Databricks widget fields and clicks Run
- Miles generates the Databricks personal access token
- Miles adds secrets to GitHub repo settings

## What is already done

- Databricks workspace: `https://dbc-0caa5555-b747.cloud.databricks.com` (mlfsowden@gmail.com, Google sign-in)
- Unity Catalog: `madebymiles` catalog and `observability` schema created
- Cloudflare ingestion: confirmed working (7 days of analytics ingested)
- GitHub Actions ingestion: confirmed working (workflow runs ingested)
- All 6 notebook templates written and in the repo at `databricks/notebooks/`
- Weekly GenAI report GitHub Actions workflow built (`.github/workflows/weekly-report.yml`, soft-fail mode)

## What you need to do (in Chrome)

### Phase 1: Import and run remaining notebooks

1. Open Databricks workspace in Chrome
2. Navigate to Workspace, find or create the `madebymiles-observability` folder
3. Import notebooks from the repo (`databricks/notebooks/`)
4. Run `dbutils.widgets.removeAll()` in a scratch cell first (clears stale widget defaults)
5. For `ingest_sentry.py`:
   - Tell Miles: "Paste your Sentry auth token into the SENTRY_TOKEN widget, set SENTRY_ORG to `stritheo`, set SENTRY_PROJECT to `madebymiles`, then click Run All"
   - Wait for him to confirm success
   - Verify: `SELECT * FROM madebymiles.observability.sentry_issues LIMIT 5`
6. For `ingest_lighthouse.py`:
   - Tell Miles: "Paste your GitHub token into the GITHUB_TOKEN widget, then click Run All"
   - Wait for him to confirm success
   - Verify: `SELECT * FROM madebymiles.observability.lighthouse_scores LIMIT 5`
7. **Skip** `ingest_gsc.py` -- needs Google Cloud service account JSON which is too long for a widget. Park it.
8. **Skip** `ingest_supabase.py` -- Supabase is on hold (free tier pauses after 7 days inactivity)

### Phase 2: Medallion architecture

Set up bronze/silver/gold layers in Unity Catalog.

**Create schemas:**
```sql
CREATE SCHEMA IF NOT EXISTS madebymiles.bronze;
CREATE SCHEMA IF NOT EXISTS madebymiles.silver;
CREATE SCHEMA IF NOT EXISTS madebymiles.gold;
```

**Bronze layer** -- raw ingestion (move existing tables):
- The existing `madebymiles.observability.*` tables are the bronze layer
- Either rename the schema to bronze, or create views in bronze pointing to observability tables
- Going forward, notebooks should write to `madebymiles.bronze.*`

**Silver layer** -- cleaned and typed:
Create transformation notebooks/queries that:
- Deduplicate rows (some notebooks use overwrite mode, some append)
- Cast string dates to proper DATE/TIMESTAMP types
- Standardise column naming (snake_case throughout)
- Add `_ingested_at TIMESTAMP` metadata column
- One silver table per bronze table

**Gold layer** -- aggregated views for dashboard panels:
Create SQL views optimised for each dashboard panel. The SQL queries for each panel are documented in the PRD-observability doc under "Phase 3: Dashboard build" and the table schemas are in the "Unity Catalog table schemas" section.

Key gold views:
- `gold.lighthouse_trend` -- scores by URL over time (for Performance tab line chart)
- `gold.deploy_summary` -- pass/fail rate, frequency, duration (for Deployment tab)
- `gold.traffic_daily` -- visitors, page views, cache hit rate (for Traffic tab)
- `gold.sentry_summary` -- error count by level, top issues (for Security tab)
- `gold.weekly_metrics` -- combined weekly snapshot for the GenAI report

### Phase 3: Schedule daily ingestion

1. Go to Workflows > Create Job
2. Name: `madebymiles-daily-ingest`
3. Add a task for each working notebook: GitHub Actions, Cloudflare, Sentry, Lighthouse
4. For each task, the notebook will need widget values -- configure default parameter values in the job task settings so tokens are pre-filled
   - **Important:** Tell Miles which widget parameters each task needs. He will type the token values into the job task parameter fields himself.
5. Set schedule: daily at 00:00 UTC (10:00 AEST)
6. Note the **Job ID** -- Miles needs this for the GitHub Actions weekly report
7. Add a downstream task that runs the silver transformations after ingestion completes

### Phase 4: Build the AI/BI Dashboard

1. Go to SQL > Dashboards > Create Dashboard
2. Name: `madebymiles.ai Observability`
3. Build 4 tabs querying gold views/tables:

**Performance tab:**
- Lighthouse scores over time (line chart: performance, accessibility, SEO, best practices)
- FCP and TTI trends (line chart)
- Total page weight trend (bar chart)

**Security tab:**
- Sentry error count by level (stacked bar: error, warning, info)
- Top 5 issues by frequency (table)
- Threats blocked by Cloudflare (from cloudflare_analytics.threats)

**Deployment tab:**
- GitHub Actions pass/fail rate (pie chart)
- Deploy frequency per week (bar chart)
- Build duration trend (line chart)

**Search and Traffic tab:**
- Cloudflare unique visitors and page views over time (line chart)
- Cache hit rate trend (line chart)
- Top referrer domains (table)

4. Publish the dashboard
5. Test Genie: ask "What are the Lighthouse scores this week?" and "How many deploys succeeded this week?"

### Phase 5: Personal access token and GitHub secrets

1. Click profile icon (top right) > Settings > Developer
2. If "Access tokens" option appears:
   - Tell Miles: "Click Generate new token, set description to `github-actions-weekly-report`, set lifetime to 90 days, copy the token immediately"
   - Then tell him to add these to GitHub repo settings (github.com/Stritheo/madebymiles/settings/secrets/actions):
     - Secret `DATABRICKS_HOST` = `https://dbc-0caa5555-b747.cloud.databricks.com`
     - Secret `DATABRICKS_TOKEN` = the token he just generated
     - Variable `DATABRICKS_REFRESH_JOB_ID` = the job ID from Phase 3
     - Variable `DATABRICKS_WAREHOUSE_ID` = the SQL warehouse ID (found in SQL Warehouses page)
3. If "Access tokens" does not appear: note that PATs are not available on Free Edition and we need an alternative auth method for the weekly report workflow

### Phase 6: Test the weekly report

1. Tell Miles: "Go to github.com/Stritheo/madebymiles/actions/workflows/weekly-report.yml, click Run workflow"
2. Check Discord #reports for output
3. If it passes green, the `continue-on-error: true` lines in the workflow can be removed in a future commit

## Critical platform constraints

These were learned the hard way (see retro in `docs/PRD-observability-and-design-integration.md`):

1. **ALWAYS use Python `requests` for HTTP calls** -- never SQL `http_request()`. The SQL function corrupts JSON payloads via Spark string literal escaping. This caused two full notebook rewrites.
2. **Widget defaults are ignored** if the widget was previously created with an empty value. Always run `dbutils.widgets.removeAll()` before first run of any notebook.
3. **GSC service account JSON is too long for widgets.** Skip GSC ingestion for now.
4. **`dbutils.secrets.put` does not work on Free Edition.** Secrets must be created via UI or stored as job parameters.
5. **Test one thing end-to-end before scaling.** Do not write multiple notebooks before confirming the pattern works. Run one notebook, verify the data, then proceed to the next.
6. **Notebook code pushed to GitHub is not auto-synced to Databricks.** If you update notebook code, you need to re-import or copy/paste into Databricks.

## Miles has these tokens ready

- GitHub token (fine-grained, `Stritheo/madebymiles`, Actions + Contents read)
- Cloudflare API token (read analytics) + Zone ID
- Sentry auth token + org slug (`stritheo`) + project slug (`madebymiles`)

He will paste them when you tell him where. Never ask him to share them in chat.
