# PRD: Observability Dashboard and Design Integration

**Project:** madebymiles.ai
**Date:** 2026-03-10
**Status:** Notebooks, workflow, and setup guide built. Databricks workspace created. Ready for local Penpot setup and Databricks configuration.
**Databricks workspace:** `https://dbc-0caa5555-b747.cloud.databricks.com` (mlfsowden@gmail.com)

---

## Overview

Two capability streams to add to the madebymiles.ai project:

1. **Penpot MCP** -- open-source design-to-code loop replacing Figma
2. **Databricks Free Edition** -- aggregated observability dashboard with GenAI-powered weekly improvement reports

All services are free tier. No email, no Slack. Alerts and reports flow to Discord.

---

## Stream 1: Penpot Design Integration

### What is done (this session)

- [x] Signed up for Penpot cloud account (GitHub login) at design.penpot.app
- [x] Removed Figma MCP server config from Claude Code
- [x] Added Penpot MCP server config to Claude Code (`http://localhost:4401/mcp`)
- [x] Created setup script: `scripts/setup-penpot-mcp.sh`

### What to do at home (VS Code)

#### Step 1: Run the setup script (~10 minutes)

```bash
cd ~/madebymiles
bash scripts/setup-penpot-mcp.sh
```

This clones the Penpot MCP server to `~/.penpot-mcp`, builds it, and starts it on port 4401.

#### Step 2: Connect Penpot in your browser

1. Open https://design.penpot.app
2. Create a new project (e.g. "madebymiles design system")
3. Open a design file
4. Go to **Plugins** menu
5. Load plugin from: `http://localhost:4400/manifest.json`
6. Click **"Connect to MCP server"** in the plugin panel
7. Keep the plugin panel open while working

#### Step 3: Verify in Claude Code

```bash
claude mcp list
# Should show: penpot (http://localhost:4401/mcp)
```

Then in a Claude Code session, try:
- "Read my Penpot design file and describe the layout"
- "Create a card component in Penpot matching my Card.astro styles"
- "Pull the colour palette from Penpot into tailwind.config.mjs"

#### Step 4: Create your design system in Penpot

Start with the tokens you already have in `tailwind.config.mjs`:

| Token | Value |
|---|---|
| bg-primary | #FAFAF9 |
| bg-card | #FFFFFF |
| bg-dark | #1A1F2E |
| text-primary | #1A1A1A |
| text-secondary | #525252 |
| text-accent | #C87D5C |
| border-light | #E5E5E5 |
| font-display | DM Serif Display |
| font-body | IBM Plex Sans |

Create these as Penpot colour and typography variables so the MCP can sync them.

### Browser note

Chrome or Firefox recommended. If using Brave, disable Shield for the Penpot domain to allow localhost WebSocket connections.

---

## Stream 2: Databricks Observability Dashboard

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
| Design tool | Penpot (not Figma) | Free, open source, self-hostable, privacy by design, official MCP server |
| Dashboard platform | Databricks Free Edition (not Grafana) | GenAI layer (Genie + Claude MCP) reads both data and code to propose improvements |
| Alert channel | Discord (not Slack, not email) | Already working, unlimited webhooks, unlimited history, free |
| Report delivery | Discord #reports via GitHub Actions | No new tools, fits existing workflow |
| Report model | Claude Sonnet (not Opus) | Keeps weekly API cost under $0.05 |
| Ingestion pattern | Databricks notebooks (not external ETL) | Simplest path, runs on free serverless compute |

---

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| Databricks MCP may not work on Free Edition | Test immediately after signup. Fall back to Genie-only if needed. The weekly report uses direct API calls as a backup path. |
| Fair-use compute quota exceeded | Weekly batch for a solo project is well within 99th percentile. Monitor. |
| No commercial use on Free Edition | madebymiles.ai is a personal site, not a commercial product. Review terms if that changes. |
| Penpot MCP server is relatively new | Official team maintains it. Pin to `mcp-prod` branch for stability. |
| Weekly report Claude API costs | Uses Sonnet, not Opus. Single weekly call is ~$0.01-0.05. Monitor via Anthropic dashboard. |
| Supabase/GSC API changes | Notebooks are simple enough to update. Schema changes caught by `write.mode("overwrite")` failures. |
| Databricks secrets management on Free Edition | `dbutils.secrets` may have limitations. Fall back to environment variables if needed. |

---

## VS Code manual steps (what you need to do yourself)

These are the steps that require your browser, your credentials, or your hands in VS Code. Everything else is already scripted or automated.

### Session 1: Pull the branch and start Penpot (~15 mins)

Open VS Code terminal:

```bash
cd ~/madebymiles
git pull origin claude/figma-mcp-integration-6pINb
bash scripts/setup-penpot-mcp.sh
```

Then open Chrome and connect Penpot (see Stream 1 steps above).

### Session 2: Databricks first notebook (~20 mins)

1. **Open Databricks** in Chrome: `https://dbc-0caa5555-b747.cloud.databricks.com`
   - Sign in with mlfsowden@gmail.com

2. **Create catalog and schema.** Click **SQL Editor** in the left sidebar, paste and run:
   ```sql
   CREATE CATALOG IF NOT EXISTS madebymiles;
   CREATE SCHEMA IF NOT EXISTS madebymiles.observability;
   ```

3. **Create a secret scope.** Click **+** > **Notebook**, set language to Python, paste and run:
   ```python
   dbutils.secrets.createScope("madebymiles")
   ```
   If this fails on Free Edition, the notebooks will need editing to use hardcoded values or environment variables instead. Ask Claude Code for help.

4. **Add your GitHub token.** In the same notebook:
   ```python
   dbutils.secrets.put(scope="madebymiles", key="GITHUB_TOKEN", string_value="ghp_YOUR_TOKEN")
   ```
   To get a token: github.com > Settings > Developer settings > Personal access tokens > Fine-grained > Generate. Select the `Stritheo/madebymiles` repo. Permissions: Actions (read), Contents (read).

5. **Import and run the first notebook.** In the left sidebar:
   - Click **Workspace** > your email folder > **Create** > **Folder** > name it `madebymiles-observability`
   - Click into the folder > **Import** > select **File** > choose `databricks/notebooks/ingest_github_actions.py` from your local repo
   - Click **Run All**
   - Verify: go to SQL Editor, run `SELECT * FROM madebymiles.observability.github_actions_runs LIMIT 5;`

6. **Repeat** for each notebook as you add more API keys (see the table in Phase 2 above for the order).

### Session 3: Generate a Databricks personal access token (~5 mins)

You need this for the weekly report workflow.

1. In Databricks, click your profile icon (top right) > **Settings**
2. Click **Developer** in the left sidebar
3. Click **Manage** next to Access tokens
4. Click **Generate new token**
5. Description: `github-actions-weekly-report`
6. Lifetime: 90 days (set a calendar reminder to rotate it)
7. Copy the token immediately (you will not see it again)

### Session 4: Add GitHub repo secrets (~5 mins)

1. Go to `https://github.com/Stritheo/madebymiles/settings/secrets/actions`
2. Click **New repository secret** for each:

   | Name | Value |
   |---|---|
   | `DATABRICKS_HOST` | `https://dbc-0caa5555-b747.cloud.databricks.com` |
   | `DATABRICKS_TOKEN` | The token from Session 3 |
   | `ANTHROPIC_API_KEY` | Your Anthropic API key (from console.anthropic.com > API Keys) |

3. Click **Variables** tab, then **New repository variable** for each:

   | Name | Value |
   |---|---|
   | `DATABRICKS_REFRESH_JOB_ID` | The job ID after you schedule notebooks in Databricks Workflows |
   | `DATABRICKS_WAREHOUSE_ID` | Found in Databricks > SQL Warehouses > click your warehouse > copy the ID from the URL |

### Session 5: Add remaining API keys to Databricks (~10 mins per source)

In a Databricks notebook, add each secret one at a time as you are ready:

**Cloudflare (you already have these):**
```python
# Get zone ID: dash.cloudflare.com > madebymiles.ai > Overview > right sidebar
dbutils.secrets.put(scope="madebymiles", key="CLOUDFLARE_API_TOKEN", string_value="YOUR_TOKEN")
dbutils.secrets.put(scope="madebymiles", key="CLOUDFLARE_ZONE_ID", string_value="YOUR_ZONE_ID")
```
Then import and run `ingest_cloudflare.py`.

**Sentry:**
```python
# Get token: sentry.io > Settings > Auth Tokens > Create
dbutils.secrets.put(scope="madebymiles", key="SENTRY_AUTH_TOKEN", string_value="YOUR_TOKEN")
dbutils.secrets.put(scope="madebymiles", key="SENTRY_ORG", string_value="YOUR_ORG")
dbutils.secrets.put(scope="madebymiles", key="SENTRY_PROJECT", string_value="YOUR_PROJECT")
```
Then import and run `ingest_sentry.py`.

**Supabase:**
```python
# Get token: supabase.com > Account > Access Tokens
# Get project ref: from your project URL or Settings > General
dbutils.secrets.put(scope="madebymiles", key="SUPABASE_ACCESS_TOKEN", string_value="YOUR_TOKEN")
dbutils.secrets.put(scope="madebymiles", key="SUPABASE_PROJECT_REF", string_value="YOUR_REF")
```
Then import and run `ingest_supabase.py`.

**Google Search Console (most involved):**
1. Go to console.cloud.google.com
2. Create a project (or use existing)
3. Enable the Search Console API
4. Go to IAM > Service Accounts > Create
5. Download the JSON key file
6. In Google Search Console, add the service account email as an owner
7. In Databricks:
```python
import json
with open("/path/to/downloaded-key.json") as f:
    sa_json = f.read()
dbutils.secrets.put(scope="madebymiles", key="GSC_SERVICE_ACCOUNT_JSON", string_value=sa_json)
```
Then import and run `ingest_gsc.py`.

### Session 6: Build the dashboard (~30 mins)

1. In Databricks, go to **SQL** > **Dashboards** > **Create Dashboard**
2. Name it `madebymiles.ai Observability`
3. For each panel, click **Add** > **Visualization** > write a SQL query against your Unity Catalog tables
4. The table schemas are documented above -- use them to write your queries
5. Arrange into 4 tabs: Performance, Security, Deployment, Search and Traffic
6. Click **Publish** when done
7. Genie is enabled automatically on published dashboards

### Session 7: Connect Claude Code MCP and test weekly report (~10 mins)

In VS Code terminal:

```bash
# Generate a personal access token in Databricks first (see Session 3)
claude mcp add --transport http databricks \
  https://dbc-0caa5555-b747.cloud.databricks.com/api/2.0/mcp/madebymiles/observability
```

Test it works:
```bash
claude "Query my Databricks observability tables and summarise this week's data"
```

Then trigger the weekly report:
1. Go to `https://github.com/Stritheo/madebymiles/actions/workflows/weekly-report.yml`
2. Click **Run workflow**
3. Check Discord #reports for the output

---

## Order of operations

### Week 1
1. **At home today:** Pull branch, run `bash scripts/setup-penpot-mcp.sh`, verify the design loop works (VS Code Session 1)
2. **Same evening:** Open Databricks workspace, create catalog/schema, add `GITHUB_TOKEN` secret, run `ingest_github_actions.py` (VS Code Session 2)
3. **Same evening:** Generate Databricks personal access token (VS Code Session 3)

### Week 2
4. Add Cloudflare, Sentry, Supabase secrets and run their notebooks (VS Code Session 5)
5. Run `ingest_lighthouse.py` (uses same GitHub token, no new secrets needed)
6. Add GitHub repo secrets and variables (VS Code Session 4)

### Week 3
7. Set up Google Cloud service account for GSC, run `ingest_gsc.py` (VS Code Session 5, GSC section)
8. Build the AI/BI Dashboard (VS Code Session 6)
9. Publish dashboard, test Genie

### Week 4
10. Schedule daily ingestion job in Databricks Workflows
11. Connect Claude Code MCP, test weekly report (VS Code Session 7)
12. Remove `continue-on-error` after green pass
13. Bookmark dashboard on iOS Safari home screen
