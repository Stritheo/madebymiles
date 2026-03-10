# PRD: Observability Dashboard and Design Integration

**Project:** madebymiles.ai
**Date:** 2026-03-10
**Status:** Ready for local setup

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

### What to do at home

#### Step 1: Sign up for Databricks Free Edition

1. Go to https://login.databricks.com/
2. Sign up (no credit card required)
3. You will get a serverless workspace immediately

#### Step 2: Create the data ingestion notebooks

Create one Python notebook per data source. Each pulls from the service API and writes to a Unity Catalog table.

| Notebook | Data source | API | Schedule |
|---|---|---|---|
| `ingest_cloudflare.py` | Cloudflare Analytics | Cloudflare API v4 (API token) | Daily |
| `ingest_github_actions.py` | GitHub Actions runs | GitHub REST API (`/repos/.../actions/runs`) | Daily |
| `ingest_lighthouse.py` | Lighthouse CI results | Parse from GitHub Actions artifacts | After each deploy |
| `ingest_sentry.py` | Sentry errors | Sentry API (`/api/0/projects/.../issues/`) | Daily |
| `ingest_gsc.py` | Google Search Console | GSC API via `google-api-python-client` | Daily |
| `ingest_supabase.py` | Supabase metrics | Supabase Management API | Daily |

**API keys needed (store as Databricks secrets):**
- `CLOUDFLARE_API_TOKEN` (already have this in GitHub Actions)
- `GITHUB_TOKEN` (personal access token with `repo` and `actions:read`)
- `SENTRY_AUTH_TOKEN`
- `GSC_SERVICE_ACCOUNT_JSON`
- `SUPABASE_ACCESS_TOKEN`

#### Step 3: Build the dashboards

Create an AI/BI Dashboard with these panels:

**Performance tab:**
- Lighthouse scores over time (performance, accessibility, SEO, best practices)
- Page load time trends
- Core Web Vitals (from Cloudflare)

**Security tab:**
- Sentry error count and trend
- Dependency audit results (from `npm audit` in CI)
- CSP/header compliance status

**Deployment tab:**
- GitHub Actions success/fail rate
- Deploy frequency and duration
- Build size trend

**Search and traffic tab:**
- GSC impressions, clicks, CTR, position
- Cloudflare request volume and cache hit rate
- Top pages by traffic

#### Step 4: Enable Genie

Each published dashboard gets a Genie space by default. Use it to ask:
- "What were the top 3 performance regressions this week?"
- "Show me the error trend for the last 30 days"
- "Which pages have the worst Lighthouse scores?"

#### Step 5: Connect Databricks MCP to Claude Code

```bash
claude mcp add --transport http databricks \
  https://YOUR-WORKSPACE.cloud.databricks.com/api/2.0/mcp/...
```

Replace with your actual workspace URL. Authentication via personal access token or OAuth.

#### Step 6: Create the weekly GenAI report (GitHub Actions)

Add this workflow to `.github/workflows/weekly-report.yml`:

```yaml
name: Weekly Observability Report

on:
  schedule:
    - cron: '0 22 * * 0'   # Sunday 8am AEST (UTC+10)
  workflow_dispatch:

jobs:
  report:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6

      - name: Generate report via Claude Code
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          DATABRICKS_HOST: ${{ secrets.DATABRICKS_HOST }}
          DATABRICKS_TOKEN: ${{ secrets.DATABRICKS_TOKEN }}
        run: |
          # Install Claude Code CLI
          npm install -g @anthropic-ai/claude-code

          # Run analysis
          claude -p "You have access to the Databricks MCP server.
          Query this week's performance, security, and error data.
          Read the repo codebase.
          Produce a weekly report with:
          1. Key metrics summary (Lighthouse, errors, traffic)
          2. Top 3 risks or regressions
          3. Top 5 proposed improvements ranked by impact
          Format as a Discord embed JSON." > report.json

      - name: Post to Discord
        run: |
          curl -s -H "Content-Type: application/json" \
            -d @report.json \
            "${{ secrets.DISCORD_WEBHOOK_REPORTS }}"
```

**Note:** This workflow pattern needs testing. Follow the CI/CD quality gate protocol:
- Use `continue-on-error: true` on the first run
- Trigger via `workflow_dispatch` first to verify
- Only enforce after it passes green

#### Step 7: Mobile access

Databricks dashboards are responsive. Bookmark your dashboard URL on iOS Safari and add to home screen for app-like access.

---

## Architecture summary

```
Data Sources
  Cloudflare, Supabase, Sentry, GitHub Actions, GSC
          |
          v
  Databricks Free Edition
  [Python notebooks - scheduled ingestion]
          |
          v
  Unity Catalog tables
          |
    +-----+-----+
    |             |
    v             v
  AI/BI         Genie
  Dashboards    (natural language)
    |
    +---> Desktop browser + iOS Safari
    |
    v
  Claude Code + Databricks MCP
  (reads data + reads repo code)
          |
          v
  Weekly improvement report --> Discord #reports

  Alert rules --> Discord #alerts (existing webhooks)
```

---

## Decisions made

| Decision | Choice | Rationale |
|---|---|---|
| Design tool | Penpot (not Figma) | Free, open source, self-hostable, privacy by design, official MCP server |
| Dashboard platform | Databricks Free Edition (not Grafana) | GenAI layer (Genie + Claude MCP) reads both data and code to propose improvements |
| Alert channel | Discord (not Slack, not email) | Already working, unlimited webhooks, unlimited history, free |
| Report delivery | Discord #reports via GitHub Actions | No new tools, fits existing workflow |

---

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| Databricks MCP may not work on Free Edition | Test immediately after signup. Fall back to Genie-only if needed. |
| Fair-use compute quota exceeded | Weekly batch for a solo project is well within 99th percentile. Monitor. |
| No commercial use on Free Edition | madebymiles.ai is a personal site, not a commercial product. Review terms if that changes. |
| Penpot MCP server is relatively new | Official team maintains it. Pin to `mcp-prod` branch for stability. |
| Weekly report Claude Code call costs | Uses Anthropic API credits. Monitor usage. Consider running less frequently if costs rise. |

---

## Order of operations

1. **Today at home:** Run `bash scripts/setup-penpot-mcp.sh` and verify the design loop works
2. **This week:** Sign up for Databricks Free Edition, create first notebook (start with GitHub Actions data -- easiest API)
3. **Next week:** Add remaining data sources one at a time
4. **Week 3:** Build dashboard panels, enable Genie, test Databricks MCP with Claude Code
5. **Week 4:** Create the weekly report GitHub Action (soft-fail first)
