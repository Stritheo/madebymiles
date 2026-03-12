# Databricks Free Edition Setup Guide

Step-by-step instructions to set up the observability dashboard for madebymiles.ai.

All steps except Step 8 (Claude Code MCP) can be done from any browser, including your work laptop.

## Step 1: Open your workspace

Your Databricks workspace is already created:

**Workspace URL:** `https://dbc-0caa5555-b747.cloud.databricks.com`
**Login:** mlfsowden@gmail.com

1. Open the workspace URL in Chrome or Firefox
2. Sign in with your Google account (mlfsowden@gmail.com)

## Step 2: Smoke test -- what works on Free Edition?

Before doing anything else, run these quick tests. Click **+** > **Notebook**, set language to Python.

**Test 1: Do secrets work?**
```python
dbutils.secrets.createScope("madebymiles")
```
- If it works: you are on the "secrets path" (ideal).
- If you get "not enabled for this workspace": you are on the "widget path". The notebooks handle both -- they will show text input boxes at the top for you to paste API keys each run.

**Test 2: Can notebooks reach the internet?**
```python
import requests
r = requests.get("https://api.github.com/repos/Stritheo/madebymiles")
print(r.status_code, r.json().get("full_name"))
```
- If it prints `200 Stritheo/madebymiles`: outbound works. Notebooks can fetch API data.
- If it fails: outbound is restricted. You will need to collect data via GitHub Actions instead and push it to Databricks. Ask Claude Code for help adapting the approach.

**Test 3: Can you generate a personal access token?**
1. Click your profile icon (top right) > **Settings**
2. Look for **Developer** in the left sidebar
3. If it exists, you can generate PATs (needed for the weekly report workflow)
4. If it does not exist, PATs are not available. The weekly report will need to work without triggering Databricks directly.

Note the results of all three tests -- they determine which path you follow.

## Step 3: Create the catalog and schema

In the SQL editor, run:

```sql
CREATE CATALOG IF NOT EXISTS madebymiles;
CREATE SCHEMA IF NOT EXISTS madebymiles.observability;
```

## Step 4: Set up secrets (if available)

**If secrets worked in Step 2**, add your API keys in a notebook:

```python
dbutils.secrets.put(scope="madebymiles", key="GITHUB_TOKEN", string_value="ghp_xxx")
dbutils.secrets.put(scope="madebymiles", key="CLOUDFLARE_API_TOKEN", string_value="xxx")
dbutils.secrets.put(scope="madebymiles", key="CLOUDFLARE_ZONE_ID", string_value="xxx")
dbutils.secrets.put(scope="madebymiles", key="SENTRY_AUTH_TOKEN", string_value="xxx")
dbutils.secrets.put(scope="madebymiles", key="SENTRY_ORG", string_value="xxx")
dbutils.secrets.put(scope="madebymiles", key="SENTRY_PROJECT", string_value="xxx")
dbutils.secrets.put(scope="madebymiles", key="GSC_SERVICE_ACCOUNT_JSON", string_value='{"type":"service_account",...}')
dbutils.secrets.put(scope="madebymiles", key="SUPABASE_ACCESS_TOKEN", string_value="xxx")
dbutils.secrets.put(scope="madebymiles", key="SUPABASE_PROJECT_REF", string_value="xxx")
```

**If secrets did not work**, skip this step. The notebooks will prompt you for keys via widget text boxes each time you run them.

**Where to get each key:**

| Secret | Where to get it (all from browser) |
|---|---|
| GITHUB_TOKEN | github.com > Settings > Developer settings > Personal access tokens > Fine-grained. Scopes: `repo`, `actions:read` |
| CLOUDFLARE_API_TOKEN | dash.cloudflare.com > My Profile > API Tokens > Create Token > "Read analytics" template |
| CLOUDFLARE_ZONE_ID | dash.cloudflare.com > your site > Overview (right sidebar) |
| SENTRY_AUTH_TOKEN | sentry.io > Settings > Auth Tokens > Create |
| SENTRY_ORG / SENTRY_PROJECT | From your Sentry project URL: sentry.io/organizations/ORG/issues/?project=PROJECT |
| GSC_SERVICE_ACCOUNT_JSON | console.cloud.google.com > IAM > Service Accounts > Create > Download JSON key. Then add as owner in GSC. |
| SUPABASE_ACCESS_TOKEN | supabase.com > Account > Access Tokens |
| SUPABASE_PROJECT_REF | From your Supabase project URL or Settings > General |

## Step 5: Import the notebooks

1. In your Databricks workspace, go to **Workspace** > your user folder
2. Create a folder called `madebymiles-observability`
3. For each file in `databricks/notebooks/` in this repo, either:
   - Click **Import** > paste the Python code from the file
   - Or **Import** > **URL** > paste the raw GitHub URL, e.g.:
     `https://raw.githubusercontent.com/Stritheo/madebymiles/claude/figma-mcp-integration-6pINb/databricks/notebooks/ingest_github_actions.py`

## Step 6: Test each notebook

Run them one at a time in this order (easiest to hardest):

1. `ingest_github_actions.py` -- only needs a GitHub token (you already have one)
2. `ingest_cloudflare.py` -- uses your existing Cloudflare API token
3. `ingest_sentry.py` -- straightforward REST API
4. `ingest_supabase.py` -- simple health check
5. `ingest_lighthouse.py` -- parses CI artifacts (more complex)
6. `ingest_gsc.py` -- needs Google service account setup (most complex)

**If using widgets (no secrets):** When you click **Run All**, text boxes will appear at the top of the notebook. Paste your API key(s) there, then click **Run All** again.

After each notebook runs successfully, check the table:

```sql
SELECT * FROM madebymiles.observability.github_actions_runs LIMIT 10;
```

## Step 7: Schedule the notebooks

**Note:** Scheduling only works well if secrets are available, because widgets cannot be filled in automatically. If you are on the widget path, run notebooks manually when you want fresh data, or ask Claude Code about moving data collection into GitHub Actions.

1. Go to **Workflows** > **Create Job**
2. Name: `madebymiles-daily-ingest`
3. Add a task for each notebook
4. Set schedule: Daily at midnight UTC (10am AEST)
5. Set alert on failure (email or webhook)

## Step 8: Build the dashboard

1. Go to **SQL** > **Dashboards** > **Create Dashboard**
2. Add datasets from each Unity Catalog table
3. Build panels (see PRD for panel specifications)
4. Publish the dashboard
5. Genie is enabled by default on published dashboards

## Step 9: Connect Claude Code via MCP (Mac only)

This step requires your Mac with VS Code and Claude Code installed.

```bash
# Generate a personal access token in Databricks first (Step 2, Test 3)
# Databricks > User Settings > Developer > Access tokens

claude mcp add --transport http databricks \
  https://dbc-0caa5555-b747.cloud.databricks.com/api/2.0/mcp/madebymiles/observability
```

If MCP or PATs are not available on Free Edition, skip this. Genie (in the browser) gives you the same natural-language query capability.

## Step 10: Add GitHub Actions secrets (from any browser)

For the weekly report workflow to work, add these to your GitHub repo:

Go to `https://github.com/Stritheo/madebymiles/settings/secrets/actions`

**New repository secret:**

| Secret | Value |
|---|---|
| `DATABRICKS_HOST` | `https://dbc-0caa5555-b747.cloud.databricks.com` |
| `DATABRICKS_TOKEN` | Your Databricks personal access token (if available) |
| `ANTHROPIC_API_KEY` | Your Anthropic API key (for Claude to generate the report) |

**Settings > Variables > New repository variable:**

| Variable | Value |
|---|---|
| `DATABRICKS_REFRESH_JOB_ID` | The job ID from Step 7 |
| `DATABRICKS_WAREHOUSE_ID` | Your SQL warehouse ID (from SQL Warehouses page) |

## Step 11: Test the weekly report (from any browser)

1. Go to `https://github.com/Stritheo/madebymiles/actions/workflows/weekly-report.yml`
2. Click **Run workflow** (manual dispatch)
3. Check Discord #reports for the output
4. If it works, remove `continue-on-error: true` from the workflow (can edit via GitHub web editor)
