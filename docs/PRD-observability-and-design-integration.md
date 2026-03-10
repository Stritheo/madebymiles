# PRD: Observability Dashboard and Design Integration

**Project:** madebymiles.ai
**Date:** 2026-03-10
**Status:** Notebooks, workflow, and setup guide built. Ready for Databricks account creation and local Penpot setup.

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

1. Sign up at https://login.databricks.com (free, no card)
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
     https://YOUR-WORKSPACE.cloud.databricks.com/api/2.0/mcp/madebymiles/observability
   ```
4. Test in Claude Code: "Query my Databricks observability tables and summarise this week's Lighthouse scores"

#### Phase 5: Weekly GenAI report (Day 6-7)

1. Schedule the ingestion job in Databricks Workflows (daily at midnight UTC)
2. Note the job ID and SQL warehouse ID
3. Add GitHub Actions secrets and variables:

   **Repository secrets:**
   | Secret | Value |
   |---|---|
   | `DATABRICKS_HOST` | Your workspace URL |
   | `DATABRICKS_TOKEN` | Databricks personal access token |
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

## Order of operations

### Week 1
1. **At home today:** Run `bash scripts/setup-penpot-mcp.sh` and verify the design loop works
2. **Same session:** Sign up for Databricks Free Edition at https://login.databricks.com
3. **Same session:** Create catalog/schema, add `GITHUB_TOKEN` secret, run `ingest_github_actions.py`

### Week 2
4. Add `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ZONE_ID` secrets, run `ingest_cloudflare.py`
5. Add Sentry secrets, run `ingest_sentry.py`
6. Add Supabase secrets, run `ingest_supabase.py`
7. Run `ingest_lighthouse.py` (uses same GitHub token)

### Week 3
8. Set up Google Cloud service account for GSC, run `ingest_gsc.py`
9. Build the AI/BI Dashboard (4 tabs, panels as specified above)
10. Publish dashboard, test Genie
11. Test Databricks MCP with Claude Code

### Week 4
12. Schedule daily ingestion job in Databricks Workflows
13. Add GitHub Actions secrets (DATABRICKS_HOST, DATABRICKS_TOKEN, ANTHROPIC_API_KEY)
14. Add repo variables (DATABRICKS_REFRESH_JOB_ID, DATABRICKS_WAREHOUSE_ID)
15. Trigger weekly report via `workflow_dispatch` -- verify in Discord #reports
16. Remove `continue-on-error` after green pass
17. Bookmark dashboard on iOS Safari home screen
