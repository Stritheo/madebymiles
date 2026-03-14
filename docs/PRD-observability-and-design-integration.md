# PRD: Observability Dashboard and Design Integration

**Project:** milessowden.au
**Date:** 2026-03-10
**Status:** Ingestion notebooks working. Cloudflare and GitHub Actions confirmed ingesting. Ready to finish remaining sources, build dashboard, and schedule jobs.
**Databricks workspace:** `https://dbc-0caa5555-b747.cloud.databricks.com` (mlfsowden@gmail.com)

---

## Overview

Observability dashboard for the milessowden.au project using Databricks Free Edition with GenAI-powered weekly improvement reports.

All services are free tier. No email, no Slack. Alerts and reports flow to Discord.

> **Note:** Penpot design integration was previously planned as Stream 1 but has been removed (2026-03-14). Design workflow is handled directly via Claude Code: layout proposals, reference-based design, and token sync via `tailwind.config.mjs`. No external design tool required.

---

## Databricks Observability Dashboard

### What is done (this session)

- [x] Evaluated Grafana Cloud Free vs Databricks Free Edition
- [x] Selected Databricks (GenAI analysis of data + code is the differentiator)
- [x] Confirmed Free Edition includes: dashboards, Genie, notebooks, Unity Catalog, MCP
- [x] Created 6 ingestion notebook templates in `databricks/notebooks/`
- [x] Created weekly report GitHub Actions workflow `.github/workflows/weekly-report.yml`
- [x] Created step-by-step setup guide `databricks/setup-databricks.md`
- [x] Databricks workspace created: `https://dbc-0caa5555-b747.cloud.databricks.com`
- [x] Account: mlfsowden@gmail.com

### Files built and ready to use

```
databricks/
  setup-databricks.md              # 10-step setup guide with screenshots guidance
  notebooks/
    ingest_github_actions.py        # GitHub Actions workflow runs
    ingest_cloudflare.py            # Cloudflare analytics (GraphQL API)
    ingest_sentry.py                # Sentry issues and error trends
    ingest_gsc.py                   # Google Search Console clicks/impressions
    ingest_lighthouse.py            # Lighthouse scores from CI artifacts
    ingest_supabase.py              # Supabase project health metrics

.github/workflows/
    weekly-report.yml               # Sunday 8am AEST GenAI report to Discord
```

### What to do at home

Follow `databricks/setup-databricks.md` for the full walkthrough. Summary:

#### Phase 1: Account and infrastructure (Day 1)

1. Open your workspace: `https://dbc-0caa5555-b747.cloud.databricks.com` (sign in with mlfsowden@gmail.com)
2. Create catalog and schema:
   ```sql
   CREATE CATALOG IF NOT EXISTS madebymiles;
   CREATE SCHEMA IF NOT EXISTS madebymiles.observability;
   ```
3. Create secret scope `madebymiles` and add API keys (see setup guide for where to get each one)

#### Phase 2: Ingestion notebooks (Day 1-2)

Import notebooks from `databricks/notebooks/` into your workspace. Test in this order (easiest first):

| Order | Notebook | Key needed | Difficulty |
|---|---|---|---|
| 1 | `ingest_github_actions.py` | `GITHUB_TOKEN` | Easy -- you already have a GitHub token |
| 2 | `ingest_cloudflare.py` | `CLOUDFLARE_API_TOKEN` + `ZONE_ID` | Easy -- token already in GitHub Actions secrets |
| 3 | `ingest_sentry.py` | `SENTRY_AUTH_TOKEN` + org/project | Easy -- straightforward REST |
| 4 | `ingest_supabase.py` | `SUPABASE_ACCESS_TOKEN` + project ref | Easy -- simple health check |
| 5 | `ingest_lighthouse.py` | `GITHUB_TOKEN` | Medium -- parses zip artifacts |
| 6 | `ingest_gsc.py` | `GSC_SERVICE_ACCOUNT_JSON` | Harder -- needs Google Cloud service account |

After each notebook succeeds, verify data:
```sql
SELECT * FROM madebymiles.observability.github_actions_runs LIMIT 10;
```

#### Phase 3: Dashboard build (Day 3-4)

Create an AI/BI Dashboard with four tabs:

**Performance tab:**
- Lighthouse scores over time (line chart: performance, accessibility, SEO, best practices)
- FCP and TTI trends (line chart from lighthouse_scores table)
- Total page weight trend (bar chart)

**Security tab:**
- Sentry error count by level (stacked bar: error, warning, info)
- Top 5 issues by frequency (table)
- Threats blocked by Cloudflare (from cloudflare_analytics.threats)

**Deployment tab:**
- GitHub Actions pass/fail rate (pie chart from github_actions_runs.conclusion)
- Deploy frequency per week (bar chart)
- Build duration trend (line chart: updated_at - run_started_at)

**Search and traffic tab:**
- GSC clicks and impressions over time (dual-axis line chart)
- Average position trend (line chart, inverted y-axis)
- Cloudflare unique visitors and cache hit rate (combo chart)
- Top 10 search queries by clicks (table)

**SQL queries for each panel are in the notebooks -- the table schemas match.**

#### Phase 4: Genie and MCP (Day 5)

1. Publish the dashboard -- Genie space is created automatically
2. Test Genie with: "What are the top performance regressions this week?"
3. Connect Claude Code:
   ```bash
   claude mcp add --transport http databricks \
     https://dbc-0caa5555-b747.cloud.databricks.com/api/2.0/mcp/madebymiles/observability
   ```
4. Test in Claude Code: "Query my Databricks observability tables and summarise this week's Lighthouse scores"

#### Phase 5: Weekly GenAI report (Day 6-7)

1. Schedule the ingestion job in Databricks Workflows (daily at midnight UTC)
2. Note the job ID and SQL warehouse ID
3. Add GitHub Actions secrets and variables:

   **Repository secrets:**
   | Secret | Value |
   |---|---|
   | `DATABRICKS_HOST` | `https://dbc-0caa5555-b747.cloud.databricks.com` |
   | `DATABRICKS_TOKEN` | Databricks personal access token (see VS Code steps below) |
   | `ANTHROPIC_API_KEY` | Anthropic API key |

   **Repository variables:**
   | Variable | Value |
   |---|---|
   | `DATABRICKS_REFRESH_JOB_ID` | Job ID from Databricks Workflows |
   | `DATABRICKS_WAREHOUSE_ID` | SQL warehouse ID |

4. Trigger the weekly report manually first:
   - Actions > Weekly Observability Report > Run workflow
   - Check Discord #reports for output
   - Both jobs have `continue-on-error: true` (per CI quality gate protocol)
   - Remove `continue-on-error` only after it passes green

#### Phase 6: Mobile access

Bookmark your published Databricks dashboard URL on iOS Safari. Add to home screen for app-like access.

### How the GenAI report works

The weekly report workflow does three things:

1. **Triggers Databricks** to refresh all ingestion notebooks (fresh data)
2. **Calls the Claude API** with this week's metrics data, asking it to:
   - Summarise key performance, security, and traffic numbers
   - Identify the top 3 risks or regressions
   - Propose the top 5 improvements ranked by impact
   - Reference specific file paths in the repo where changes should be made
3. **Posts to Discord #reports** as a formatted embed

The report uses Claude Sonnet (not Opus) to keep API costs low. A single weekly call is roughly $0.01-0.05 depending on data volume.

### Unity Catalog table schemas

#### `madebymiles.observability.github_actions_runs`
| Column | Type | Description |
|---|---|---|
| run_id | long | Workflow run ID |
| name | string | Workflow name |
| status | string | completed, in_progress, etc. |
| conclusion | string | success, failure, cancelled |
| created_at | string | ISO timestamp |
| updated_at | string | ISO timestamp |
| run_started_at | string | ISO timestamp |
| head_sha | string | Short commit SHA |
| actor | string | GitHub username |
| event | string | push, workflow_dispatch, etc. |
| run_attempt | int | Attempt number |
| html_url | string | Link to run |

#### `madebymiles.observability.cloudflare_analytics`
| Column | Type | Description |
|---|---|---|
| date | string | YYYY-MM-DD |
| requests | long | Total requests |
| cached_requests | long | Cached requests |
| bytes | long | Total bandwidth |
| cached_bytes | long | Cached bandwidth |
| threats | long | Threats blocked |
| page_views | long | Page views |
| unique_visitors | long | Unique visitors |
| cache_hit_rate | double | Cache hit percentage |

#### `madebymiles.observability.sentry_issues`
| Column | Type | Description |
|---|---|---|
| issue_id | string | Sentry issue ID |
| title | string | Issue title |
| culprit | string | Source location |
| level | string | error, warning, info |
| status | string | unresolved, resolved, ignored |
| count | int | Event count |
| first_seen | string | ISO timestamp |
| last_seen | string | ISO timestamp |
| type | string | Error type |
| platform | string | Platform |
| permalink | string | Link to issue |

#### `madebymiles.observability.gsc_search_data`
| Column | Type | Description |
|---|---|---|
| date | string | YYYY-MM-DD |
| page | string | Page URL |
| query | string | Search query |
| clicks | int | Click count |
| impressions | int | Impression count |
| ctr | double | Click-through rate (%) |
| position | double | Average position |

#### `madebymiles.observability.lighthouse_scores`
| Column | Type | Description |
|---|---|---|
| run_id | long | GitHub Actions run ID |
| run_date | string | ISO timestamp |
| url | string | Page URL tested |
| performance | int | Score 0-100 |
| accessibility | int | Score 0-100 |
| best_practices | int | Score 0-100 |
| seo | int | Score 0-100 |
| fcp_ms | double | First Contentful Paint (ms) |
| tti_ms | double | Time to Interactive (ms) |
| total_bytes | double | Total page weight (bytes) |

#### `madebymiles.observability.supabase_health`
| Column | Type | Description |
|---|---|---|
| snapshot_date | string | YYYY-MM-DD |
| project_ref | string | Supabase project reference |
| db_healthy | boolean | Database health status |
| db_status | string | Status string |
| db_size_bytes | long | Database size |
| storage_size_bytes | long | Storage size |
| bandwidth_bytes | long | Bandwidth used |

---

## Architecture summary

```
Data Sources
  Cloudflare, Supabase, Sentry, GitHub Actions, GSC
          |
          v
  Databricks Free Edition
  [Python notebooks - scheduled daily ingestion]
          |
          v
  Unity Catalog tables (6 tables)
          |
    +-----+-----+
    |             |
    v             v
  AI/BI         Genie
  Dashboards    (natural language queries)
    |
    +---> Desktop browser + iOS Safari (home screen bookmark)
    |
    v
  Claude API (Sonnet) via GitHub Actions
  [Reads metrics data + references repo code]
          |
          v
  Weekly improvement report --> Discord #reports
  Failures --> Discord #alerts
```

---

## Decisions made

| Decision | Choice | Rationale |
|---|---|---|
| Design tool | ~~Penpot~~ Removed | Dropped 2026-03-14. Design workflow via Claude Code directly. |
| Dashboard platform | Databricks Free Edition (not Grafana) | GenAI layer (Genie + Claude MCP) reads both data and code to propose improvements |
| Alert channel | Discord (not Slack, not email) | Already working, unlimited webhooks, unlimited history, free |
| Report delivery | Discord #reports via GitHub Actions | No new tools, fits existing workflow |
| Report model | Claude Sonnet (not Opus) | Keeps weekly API cost under $0.05 |
| Ingestion pattern | Databricks notebooks (not external ETL) | Simplest path, runs on free serverless compute |

---

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| `dbutils.secrets` not available on Free Edition | Notebooks updated with widget fallback (text input prompts). You paste keys each run. Not ideal for scheduled jobs -- if secrets are blocked, we move data collection into GitHub Actions instead. |
| Outbound internet restricted from notebooks | Test on Day 1. If blocked, GitHub Actions collects data and pushes to Databricks via REST API. Dashboards still work. |
| Personal access tokens not available on Free Edition | Test on Day 1. If unavailable, weekly report workflow cannot trigger Databricks jobs. Fall back to GitHub Actions doing all work independently. |
| Databricks MCP may not work on Free Edition | Test after setup. Fall back to Genie-only (browser). Weekly report uses direct Claude API calls as backup. |
| Fair-use compute quota exceeded | Weekly batch for a solo project is well within 99th percentile. Monitor. |
| No commercial use on Free Edition | milessowden.au is a personal site, not a commercial product. Review terms if that changes. |
| Weekly report Claude API costs | Uses Sonnet, not Opus. Single weekly call is ~$0.01-0.05. Monitor via Anthropic dashboard. |
| Supabase/GSC API changes | Notebooks are simple enough to update. Schema changes caught by `write.mode("overwrite")` failures. |

---

## Important: Free Edition limitations

Tested on 2026-03-11. Results:

| Feature | Status on Free Edition | Test result |
|---|---|---|
| `dbutils.secrets.createScope` | Not available in notebooks | Scope must be created via UI: `workspace-url#secrets/createScope` (this worked) |
| `dbutils.secrets.put` | Not available in notebooks | Cannot write secrets from notebooks at all |
| Secrets REST API (`/api/2.0/secrets/put`) | 404 -- endpoint not found | REST API not available on Free Edition |
| `dbutils.secrets.get` | Available (confirmed by Genie) | Can read secrets if they exist in a scope |
| Outbound internet from notebooks | Works | `200 Stritheo/madebymiles` -- notebooks can reach GitHub, Cloudflare, Sentry APIs |
| Unity Catalog connections (`CREATE CONNECTION TYPE HTTP`) | Works | Credentials stored securely, persist across sessions, usable by scheduled jobs |
| Personal access tokens | **Not yet tested** | Check Settings > Developer |
| MCP server | **Not yet tested** | Test after data is loaded |

**Confirmed path: Python `requests` with widget-based tokens.** Unity Catalog connections work for storing tokens, but the `http_request()` SQL function corrupts JSON escaping for complex payloads (like Cloudflare GraphQL). All notebooks now use Python `requests` directly with tokens pasted into Databricks widgets.

**How it works:**
1. Each notebook has `dbutils.widgets.text("TOKEN_NAME", "", "description")` at the top
2. You paste the API token into the widget, then run the notebook
3. Python `requests` makes the HTTP call directly -- no SQL string escaping issues
4. For scheduled jobs, tokens will need to be stored in Databricks secrets or environment variables

**Widget quirk discovered:** Databricks widgets ignore default values if the widget was previously created with an empty value. Fix: run `dbutils.widgets.removeAll()` before running the notebook, or manually type the default value into the widget.

---

## Retro: 2026-03-11 session

### The commit timeline tells the story

15 commits on this branch. The Databricks notebooks went through **3 complete architectures**:

| Version | Approach | Why it failed |
|---|---|---|
| v1 (`0410a19`) | `dbutils.secrets` for tokens, SQL `http_request()` for API calls | Secrets API not available on Free Edition |
| v2 (`7a27113`) | Unity Catalog connections with SQL `http_request(conn => ...)` | Spark SQL string literals mangle JSON escaping |
| v3 (`b0345ad`) | Python `requests` with widget-based tokens | **This one worked** |

Then 5 bug-fix commits on top of v2 before finally pivoting to v3:
- `8dded67` fix deprecation warnings
- `eb8df81` collapse GraphQL to single line (escaping workaround)
- `fbc20b5` double-backslash escaping (another workaround)
- `7203001` give up on SQL for Cloudflare, switch to Python requests
- `1b85519` refine the Python requests approach

Two full rewrites and five patches. That is why the session felt rough.

### What worked
- Cloudflare ingestion: 7 days of analytics successfully ingested
- GitHub Actions ingestion: workflow runs successfully ingested
- Lighthouse notebook ran clean (no scores yet -- needs Lighthouse CI in deploy workflow)
- Outbound internet from Databricks Free Edition notebooks: confirmed working
- Unity Catalog catalog/schema creation: worked first time

### What went wrong (symptoms)
- **`http_request()` SQL function corrupts JSON.** Spark SQL string literals interpret backslash escapes, mangling the `\"` sequences inside JSON payloads.
- **Widget defaults do not persist.** `dbutils.widgets.text("key", "default_value", "label")` ignores the default if the widget was previously created empty.
- **`DESCRIBE CONNECTION` does not expose bearer tokens.** Cannot programmatically read stored tokens from Unity Catalog connections.
- **GSC service account JSON too long for widget.** The JSON string gets truncated by the widget text box character limit.
- **Databricks notebook sync friction.** Code changes pushed to GitHub were not reflected in Databricks. Had to manually copy/paste updated code into Databricks cells each time.

### Root causes (why it was avoidable)

**1. Built 6 notebooks before testing 1.**
All 6 ingestion notebooks were written in the first commit before confirming that `dbutils.secrets` or `http_request()` actually worked on Free Edition. When the platform behaved differently, all 6 had to be rewritten. Twice. Should have written 1 notebook (GitHub Actions, the simplest), tested it end-to-end in Databricks, confirmed the credential and HTTP patterns worked, THEN templated the other 5.

**2. Assumed Databricks Free Edition = paid Databricks.**
The code was written assuming standard Databricks features (secrets API, REST endpoints, `http_request()` SQL function behaving like a proper HTTP client). Free Edition has undocumented limitations that only surface at runtime. Should have run a 5-minute smoke test (create scope, store secret, make an HTTP call) before writing any production code. The PRD even had a "smoke test" section, but it was written after the notebooks, not before.

**3. Tried to patch SQL escaping instead of pivoting immediately.**
When `http_request()` mangled JSON, the response was 3 successive workaround attempts (single-line queries, double backslashes, etc.) before accepting that Spark SQL string escaping is fundamentally incompatible with embedded JSON payloads. Python `requests` was the obvious answer from the start. At the first sign of string escaping issues, should have pivoted immediately instead of layering workarounds on a broken abstraction.

### The anti-pattern

**"Write everything, then test"** instead of **"Test one thing, then scale."**

This is the classic integration anti-pattern. When working with an unfamiliar platform, the correct approach is:

1. **Spike:** build the smallest possible thing that touches all the integration points
2. **Confirm:** verify it works in the actual target environment
3. **Scale:** template the pattern across all use cases

This session did steps 1-3 in reverse order: wrote all 6 notebooks (scale), discovered the platform was different (confirm failed), then rewrote everything twice (forced re-spike).

### Process fix for next time

When integrating with any unfamiliar platform or free tier:

1. **Smoke test first, code second.** Before writing any production logic, run the smallest possible test that exercises the credential storage, HTTP call mechanism, and data write path. 5 minutes of testing saves hours of rewriting.
2. **One notebook, fully tested, then clone.** Do not write 6 variations of untested code. Get one working end-to-end, then replicate the proven pattern.
3. **Pivot on first failure, do not patch.** If an approach requires more than one workaround, it is the wrong approach. Switch to a fundamentally different method instead of layering fixes.
4. **Document platform constraints before building on them.** The "Free Edition limitations" table in this PRD was filled in during debugging. It should have been filled in first, from the docs and a quick smoke test, before any notebook code was written.

### Tactical lessons
1. Always use Python `requests` for HTTP calls in Databricks notebooks -- avoid `http_request()` SQL function for anything beyond trivial GET requests
2. Test widget defaults by running `dbutils.widgets.removeAll()` before first run
3. For long credential strings (like service account JSON), use Databricks secrets, not widgets
4. Keep notebook code in a single cell where possible to avoid partial-update confusion

---

## Manual steps: what you can do from any browser (work laptop) vs Mac only

### From any browser (work laptop included)

Everything marked "Browser" below works from Chrome on your work laptop. No terminal, no VS Code, no local files needed.

#### Browser Session 1: Databricks first look and smoke test (~15 mins)

1. **Open Databricks:** `https://dbc-0caa5555-b747.cloud.databricks.com`
   - Sign in with mlfsowden@gmail.com (Google sign-in)

2. **Create catalog and schema.** Click **SQL Editor** in the left sidebar, paste and run:
   ```sql
   CREATE CATALOG IF NOT EXISTS madebymiles;
   CREATE SCHEMA IF NOT EXISTS madebymiles.observability;
   ```

3. **Test if secrets work.** Click **+** > **Notebook**, set language to Python, paste and run:
   ```python
   dbutils.secrets.createScope("madebymiles")
   ```
   - **If it works:** secrets are available. Follow the "Secrets path" below.
   - **If it fails with "not enabled":** you are on the widget path. The notebooks are already set up to handle this. Note the result so you know which path you are on.

4. **Test outbound internet.** In the same notebook, paste and run:
   ```python
   import requests
   r = requests.get("https://api.github.com/repos/Stritheo/madebymiles")
   print(r.status_code, r.json().get("full_name"))
   ```
   - **If it prints `200 Stritheo/madebymiles`:** outbound works. Notebooks can fetch API data directly.
   - **If it fails or times out:** outbound is blocked. We will need the GitHub Actions fallback (see Risks section).

#### Browser Session 2: Import and run the first notebook (~10 mins)

1. In the left sidebar, click **Workspace** > your email folder
2. Click **Create** > **Folder** > name it `madebymiles-observability`
3. Click into the folder > **Import** > **URL** > paste this raw GitHub URL for the first notebook:
   `https://raw.githubusercontent.com/Stritheo/madebymiles/claude/figma-mcp-integration-6pINb/databricks/notebooks/ingest_github_actions.py`
   (Or paste the Python code directly if raw URL does not work)

4. **If secrets work:** First add the token:
   ```python
   dbutils.secrets.put(scope="madebymiles", key="GITHUB_TOKEN", string_value="ghp_YOUR_TOKEN")
   ```
   To get a token: github.com > Settings > Developer settings > Personal access tokens > Fine-grained > Generate. Select `Stritheo/madebymiles`. Permissions: Actions (read), Contents (read).

5. **If secrets do not work:** The notebook has a widget at the top. When you click **Run All**, a text box will appear asking for the token. Paste it there.

6. Click **Run All**
7. Verify: go to SQL Editor, run:
   ```sql
   SELECT * FROM madebymiles.observability.github_actions_runs LIMIT 5;
   ```

#### Browser Session 3: Generate API tokens from other services (~15 mins)

You can collect all the API keys from your browser at work and save them somewhere safe (password manager, secure note). You will paste them into Databricks later.

| Service | Where to go | What to create |
|---|---|---|
| GitHub | github.com > Settings > Developer settings > Personal access tokens > Fine-grained | Token for `Stritheo/madebymiles` with Actions (read), Contents (read) |
| Cloudflare | dash.cloudflare.com > My Profile > API Tokens > Create Token | Use "Read analytics" template. Also note your Zone ID from the milessowden.au Overview page (right sidebar) |
| Sentry | sentry.io > Settings > Auth Tokens > Create | Read-only token. Note your org slug and project slug from the URL |
| Supabase | supabase.com > Account > Access Tokens | Generate token. Note project ref from Settings > General |
| GSC | console.cloud.google.com > APIs > Search Console API > Enable | Create service account, download JSON key, add email as owner in GSC |

#### Browser Session 4: Import remaining notebooks and add keys (~10 mins each)

Repeat the import process for each notebook. If using widgets, you will paste API keys when prompted on each run.

Import order (same as before):

| Order | Notebook | Keys needed |
|---|---|---|
| 1 | `ingest_github_actions.py` | GitHub token |
| 2 | `ingest_cloudflare.py` | Cloudflare API token + zone ID |
| 3 | `ingest_sentry.py` | Sentry auth token + org + project |
| 4 | `ingest_supabase.py` | Supabase access token + project ref |
| 5 | `ingest_lighthouse.py` | GitHub token (same as #1) |
| 6 | `ingest_gsc.py` | GSC service account JSON |

#### Browser Session 5: Build the dashboard (~30 mins)

1. In Databricks, go to **SQL** > **Dashboards** > **Create Dashboard**
2. Name it `milessowden.au Observability`
3. For each panel, click **Add** > **Visualization** > write a SQL query against your Unity Catalog tables
4. The table schemas are documented in this PRD -- use them to write your queries
5. Arrange into 4 tabs: Performance, Security, Deployment, Search and Traffic
6. Click **Publish** when done
7. Genie is enabled automatically on published dashboards

#### Browser Session 6: Schedule notebooks and test Genie (~10 mins)

1. Go to **Workflows** > **Create Job**
2. Name: `madebymiles-daily-ingest`
3. Add a task for each notebook
4. Set schedule: Daily at midnight UTC (10am AEST)
5. Note the **Job ID** (you will need this for GitHub Actions later)
6. Test Genie: open your published dashboard, click the Genie icon, ask "What are the Lighthouse scores this week?"

#### Browser Session 7: Add GitHub repo secrets (~5 mins)

1. Go to `https://github.com/Stritheo/madebymiles/settings/secrets/actions`
2. Click **New repository secret** for each:

   | Name | Value |
   |---|---|
   | `DATABRICKS_HOST` | `https://dbc-0caa5555-b747.cloud.databricks.com` |
   | `DATABRICKS_TOKEN` | Databricks personal access token (see Mac Session 2 below, or skip if PATs are not available on Free Edition) |
   | `ANTHROPIC_API_KEY` | Your Anthropic API key (from console.anthropic.com > API Keys) |

3. Click **Variables** tab, then **New repository variable** for each:

   | Name | Value |
   |---|---|
   | `DATABRICKS_REFRESH_JOB_ID` | The job ID from Browser Session 6 |
   | `DATABRICKS_WAREHOUSE_ID` | Found in Databricks > SQL Warehouses > click your warehouse > copy the ID from the URL |

#### Browser Session 8: Trigger and verify the weekly report (~5 mins)

1. Go to `https://github.com/Stritheo/madebymiles/actions/workflows/weekly-report.yml`
2. Click **Run workflow**
3. Check Discord #reports for the output
4. If it passes, remove `continue-on-error: true` from the workflow (can do via GitHub web editor)

---

### Mac only (needs terminal/VS Code)

These steps need your local dev environment.

#### Mac Session 1: Generate a Databricks personal access token (~5 mins)

**Try this in the browser first** -- it may work from your work laptop:

1. In Databricks, click your profile icon (top right) > **Settings**
2. Click **Developer** in the left sidebar
3. Click **Manage** next to Access tokens
4. Click **Generate new token**
5. Description: `github-actions-weekly-report`
6. Lifetime: 90 days (set a calendar reminder to rotate it)
7. Copy the token immediately (you will not see it again)

If the Developer/Access tokens option does not appear, PATs are not available on Free Edition. In that case, the weekly report workflow will need to use OAuth or a different auth method -- ask Claude Code for help adapting it.

#### Mac Session 2: Connect Claude Code MCP (~10 mins)

In VS Code terminal:

```bash
claude mcp add --transport http databricks \
  https://dbc-0caa5555-b747.cloud.databricks.com/api/2.0/mcp/madebymiles/observability
```

Test it works:
```bash
claude "Query my Databricks observability tables and summarise this week's data"
```

If MCP is not available on Free Edition, skip this step. Genie (in the browser) provides the same natural-language query capability.

---

## Tomorrow morning: finish in under 1 hour

### Pre-flight (2 mins)
- Open Databricks workspace
- Run `dbutils.widgets.removeAll()` in a scratch cell (clears stale widget defaults)

### Step 1: Finish Sentry ingestion (10 mins)
- Create a Sentry auth token if you have not already: sentry.io > Settings > Auth Tokens
- Paste the complete notebook code into a single Databricks cell
- Fill in widgets: `SENTRY_ORG` = `stritheo`, `SENTRY_PROJECT` = `madebymiles`, `SENTRY_TOKEN` = your token
- Run. Verify: `SELECT * FROM madebymiles.observability.sentry_issues LIMIT 5;`

### Step 2: Finish Supabase ingestion (10 mins)
- Create a Supabase access token if you have not already: supabase.com > Account > Access Tokens
- Paste the complete notebook code into a single Databricks cell
- Fill in widgets: `SUPABASE_PROJECT_REF` = `wmjgvscktxawvfybxoue`, `SUPABASE_TOKEN` = your token
- Run. Verify: `SELECT * FROM madebymiles.observability.supabase_health LIMIT 5;`

### Step 3: GSC ingestion (15 mins)
- GSC needs a Google Cloud service account JSON key, which is too long for a widget
- Option A (recommended): Set up Databricks CLI and store via `databricks secrets put-secret madebymiles gsc-sa-json`
- Option B: Skip GSC for now -- it is the least critical source. Come back when Databricks CLI is set up.
- If you do not have a Google Cloud service account yet:
  1. console.cloud.google.com > Create project or use existing
  2. Enable Search Console API
  3. Create service account > download JSON key
  4. In Google Search Console, add the service account email as a property owner for milessowden.au

### Step 4: Build the dashboard (20 mins)
- Go to SQL > Dashboards > Create Dashboard
- Name: `milessowden.au Observability`
- Add panels using SQL queries against your tables (schemas documented below in this PRD)
- Start with 2 tabs that have data now:
  - **Deployment tab:** GitHub Actions pass/fail rate, deploy frequency
  - **Traffic tab:** Cloudflare unique visitors, page views, cache hit rate, threats
- Add Sentry and Supabase panels as those tables come online
- Click Publish

### Step 5: Test Genie (5 mins)
- Open the published dashboard
- Click the Genie icon
- Ask: "How many deploys succeeded this week?" or "What is the cache hit rate trend?"

### Parking lot (do later, not tomorrow)
- Schedule daily ingestion job in Databricks Workflows
- Generate Databricks personal access token for GitHub Actions
- Set up weekly GenAI report workflow
- Connect Databricks MCP to Claude Code
- GSC ingestion (if skipped above)
- Add Lighthouse CI step to deploy workflow so lighthouse_scores table populates
