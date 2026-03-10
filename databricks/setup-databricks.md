# Databricks Free Edition Setup Guide

Step-by-step instructions to set up the observability dashboard for madebymiles.ai.

## Step 1: Create your account

1. Go to https://login.databricks.com
2. Sign up (no credit card required)
3. You get a serverless workspace immediately
4. Note your workspace URL (e.g. `https://dbc-xxxxx.cloud.databricks.com`)

## Step 2: Create the catalog and schema

In the SQL editor, run:

```sql
CREATE CATALOG IF NOT EXISTS madebymiles;
CREATE SCHEMA IF NOT EXISTS madebymiles.observability;
```

## Step 3: Set up secrets

In a notebook, run:

```python
# Create a secret scope (one-time setup)
# Note: On Free Edition, use Databricks-backed scope
dbutils.secrets.createScope("madebymiles")

# Add each secret (replace with your actual values)
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

**Where to get each key:**

| Secret | Where to get it |
|---|---|
| GITHUB_TOKEN | github.com > Settings > Developer settings > Personal access tokens > Fine-grained. Scopes: `repo`, `actions:read` |
| CLOUDFLARE_API_TOKEN | dash.cloudflare.com > My Profile > API Tokens > Create Token > "Read analytics" template |
| CLOUDFLARE_ZONE_ID | dash.cloudflare.com > your site > Overview (right sidebar) |
| SENTRY_AUTH_TOKEN | sentry.io > Settings > Auth Tokens > Create |
| SENTRY_ORG / SENTRY_PROJECT | From your Sentry project URL: sentry.io/organizations/ORG/issues/?project=PROJECT |
| GSC_SERVICE_ACCOUNT_JSON | console.cloud.google.com > IAM > Service Accounts > Create > Download JSON key. Then add as owner in GSC. |
| SUPABASE_ACCESS_TOKEN | supabase.com > Account > Access Tokens |
| SUPABASE_PROJECT_REF | From your Supabase project URL or Settings > General |

## Step 4: Import the notebooks

1. In your Databricks workspace, go to **Workspace** > your user folder
2. Create a folder called `madebymiles-observability`
3. For each file in `databricks/notebooks/` in this repo:
   - Click **Import** > paste the Python code
   - Or use the Databricks CLI: `databricks workspace import_dir ./databricks/notebooks /Users/you@email/madebymiles-observability`

## Step 5: Test each notebook

Run them one at a time in this order (easiest to hardest):

1. `ingest_github_actions.py` -- only needs a GitHub token (you already have one)
2. `ingest_cloudflare.py` -- uses your existing Cloudflare API token
3. `ingest_sentry.py` -- straightforward REST API
4. `ingest_supabase.py` -- simple health check
5. `ingest_lighthouse.py` -- parses CI artifacts (more complex)
6. `ingest_gsc.py` -- needs Google service account setup (most complex)

After each notebook runs successfully, check the table:

```sql
SELECT * FROM madebymiles.observability.github_actions_runs LIMIT 10;
```

## Step 6: Schedule the notebooks

1. Go to **Workflows** > **Create Job**
2. Name: `madebymiles-daily-ingest`
3. Add a task for each notebook
4. Set schedule: Daily at midnight UTC (10am AEST)
5. Set alert on failure (email or webhook)

## Step 7: Build the dashboard

1. Go to **SQL** > **Dashboards** > **Create Dashboard**
2. Add datasets from each Unity Catalog table
3. Build panels (see PRD for panel specifications)
4. Publish the dashboard
5. Genie is enabled by default on published dashboards

## Step 8: Connect Claude Code via MCP

```bash
# Get your workspace URL and generate a personal access token
# Databricks > User Settings > Developer > Access tokens

claude mcp add --transport http databricks \
  https://YOUR-WORKSPACE.cloud.databricks.com/api/2.0/mcp/madebymiles/observability
```

## Step 9: Add GitHub Actions secrets

For the weekly report workflow to work, add these to your GitHub repo:

**Settings > Secrets and variables > Actions > New repository secret:**

| Secret | Value |
|---|---|
| `DATABRICKS_HOST` | Your workspace URL (e.g. `https://dbc-xxxxx.cloud.databricks.com`) |
| `DATABRICKS_TOKEN` | Your Databricks personal access token |
| `ANTHROPIC_API_KEY` | Your Anthropic API key (for Claude to generate the report) |

**Settings > Secrets and variables > Actions > Variables > New repository variable:**

| Variable | Value |
|---|---|
| `DATABRICKS_REFRESH_JOB_ID` | The job ID from Step 6 |
| `DATABRICKS_WAREHOUSE_ID` | Your SQL warehouse ID (from SQL Warehouses page) |

## Step 10: Test the weekly report

1. Go to **Actions** > **Weekly Observability Report**
2. Click **Run workflow** (manual dispatch)
3. Check Discord #reports for the output
4. If it works, remove `continue-on-error: true` from the workflow
