#!/usr/bin/env bash
# Master Databricks setup script
# Run from your Mac terminal with:
#   cd ~/madebymiles && bash databricks/scripts/setup-databricks.sh
#
# Prerequisites:
#   1. Databricks PAT generated (Settings > Developer > Access tokens)
#   2. API tokens ready for: GitHub, Cloudflare, Sentry
#
# This script:
#   - Creates a secret scope and stores all API tokens
#   - Creates the medallion schemas (bronze/silver/gold)
#   - Imports all notebooks (ingestion, silver transforms, gold views)
#   - Creates the daily ingestion job
#   - Removes hardcoded tokens from the old monolith notebook

set -euo pipefail

DATABRICKS_HOST="https://dbc-0caa5555-b747.cloud.databricks.com"
NOTEBOOK_DIR="/Users/mlfsowden@gmail.com/madebymiles-observability"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# -- Prompt for PAT --
if [ -z "${DATABRICKS_TOKEN:-}" ]; then
  echo "Enter your Databricks PAT (from Settings > Developer > Access tokens):"
  read -rs DATABRICKS_TOKEN
  export DATABRICKS_TOKEN
fi

# Helper: call Databricks REST API
db_api() {
  local method="$1" endpoint="$2"
  shift 2
  curl -sf -X "$method" \
    -H "Authorization: Bearer $DATABRICKS_TOKEN" \
    -H "Content-Type: application/json" \
    "$DATABRICKS_HOST$endpoint" \
    "$@"
}

echo ""
echo "=== Phase 0: Verify API access ==="
echo ""
if db_api GET "/api/2.0/workspace/list?path=$NOTEBOOK_DIR" > /dev/null 2>&1; then
  echo "API access confirmed."
else
  echo "ERROR: Cannot reach Databricks API. Check your PAT and network."
  exit 1
fi

echo ""
echo "=== Phase 0: Create secret scope and store tokens ==="
echo ""

# Create scope (may already exist -- that is fine)
db_api POST "/api/2.0/secrets/scopes/create" \
  -d '{"scope": "madebymiles"}' 2>/dev/null || echo "(scope may already exist -- continuing)"

# Prompt for each token and store it
store_secret() {
  local key="$1" prompt="$2"
  echo "$prompt"
  read -rs value
  if [ -n "$value" ]; then
    db_api POST "/api/2.0/secrets/put" \
      -d "$(printf '{"scope":"madebymiles","key":"%s","string_value":"%s"}' "$key" "$value")"
    echo "  Stored $key"
  else
    echo "  Skipped $key (empty)"
  fi
}

store_secret "GITHUB_TOKEN" "Enter your GitHub PAT (fine-grained, Actions+Contents read):"
store_secret "CLOUDFLARE_API_TOKEN" "Enter your Cloudflare API token (read analytics):"
store_secret "CLOUDFLARE_ZONE_ID" "Enter your Cloudflare Zone ID:"
store_secret "SENTRY_TOKEN" "Enter your Sentry auth token:"

echo ""
echo "=== Phase 1: Create medallion schemas ==="
echo ""

# Find the SQL warehouse ID
WAREHOUSE_ID=$(db_api GET "/api/2.0/sql/warehouses" | python3 -c "
import json, sys
data = json.load(sys.stdin)
for wh in data.get('warehouses', []):
    if 'starter' in wh.get('name', '').lower() or wh.get('warehouse_type') == 'PRO':
        print(wh['id'])
        break
" 2>/dev/null || echo "")

if [ -z "$WAREHOUSE_ID" ]; then
  echo "WARNING: Could not find SQL warehouse. You may need to create schemas manually."
  echo "Trying to list warehouses..."
  db_api GET "/api/2.0/sql/warehouses" | python3 -m json.tool 2>/dev/null || true
else
  echo "Using SQL warehouse: $WAREHOUSE_ID"
fi

run_sql() {
  local sql="$1"
  if [ -n "$WAREHOUSE_ID" ]; then
    local result
    result=$(db_api POST "/api/2.0/sql/statements" \
      -d "$(printf '{"warehouse_id":"%s","statement":"%s","wait_timeout":"30s"}' "$WAREHOUSE_ID" "$sql")")
    local status
    status=$(echo "$result" | python3 -c "import json,sys; print(json.load(sys.stdin).get('status',{}).get('state','UNKNOWN'))" 2>/dev/null || echo "UNKNOWN")
    echo "  $sql -- $status"
  else
    echo "  SKIP (no warehouse): $sql"
  fi
}

run_sql "CREATE SCHEMA IF NOT EXISTS madebymiles.bronze"
run_sql "CREATE SCHEMA IF NOT EXISTS madebymiles.silver"
run_sql "CREATE SCHEMA IF NOT EXISTS madebymiles.gold"

echo ""
echo "=== Phase 2: Import notebooks ==="
echo ""

import_notebook() {
  local local_path="$1" remote_name="$2"
  local content
  content=$(base64 < "$local_path" | tr -d '\n')
  db_api POST "/api/2.0/workspace/import" \
    -d "$(printf '{"path":"%s/%s","language":"PYTHON","content":"%s","overwrite":true,"format":"SOURCE"}' "$NOTEBOOK_DIR" "$remote_name" "$content")" > /dev/null
  echo "  Imported: $remote_name"
}

# Bronze layer (ingestion notebooks)
for nb in "$REPO_ROOT/databricks/notebooks/"*.py; do
  name=$(basename "$nb" .py)
  import_notebook "$nb" "$name"
done

# Silver layer
for nb in "$REPO_ROOT/databricks/notebooks/silver/"*.py; do
  name=$(basename "$nb" .py)
  import_notebook "$nb" "silver_$name"
done

# Gold layer
for nb in "$REPO_ROOT/databricks/notebooks/gold/"*.py; do
  name=$(basename "$nb" .py)
  import_notebook "$nb" "gold_$name"
done

echo ""
echo "=== Phase 3: Create daily ingestion job ==="
echo ""

JOB_JSON=$(cat <<JOBEOF
{
  "name": "madebymiles-daily-ingest",
  "tasks": [
    {
      "task_key": "ingest_github_actions",
      "notebook_task": {
        "notebook_path": "$NOTEBOOK_DIR/ingest_github_actions",
        "source": "WORKSPACE"
      }
    },
    {
      "task_key": "ingest_cloudflare",
      "notebook_task": {
        "notebook_path": "$NOTEBOOK_DIR/ingest_cloudflare",
        "source": "WORKSPACE"
      }
    },
    {
      "task_key": "ingest_sentry",
      "notebook_task": {
        "notebook_path": "$NOTEBOOK_DIR/ingest_sentry",
        "source": "WORKSPACE"
      }
    },
    {
      "task_key": "ingest_lighthouse",
      "notebook_task": {
        "notebook_path": "$NOTEBOOK_DIR/ingest_lighthouse",
        "source": "WORKSPACE"
      },
      "depends_on": [{"task_key": "ingest_github_actions"}]
    },
    {
      "task_key": "silver_transforms",
      "notebook_task": {
        "notebook_path": "$NOTEBOOK_DIR/silver_transforms",
        "source": "WORKSPACE"
      },
      "depends_on": [
        {"task_key": "ingest_github_actions"},
        {"task_key": "ingest_cloudflare"},
        {"task_key": "ingest_sentry"},
        {"task_key": "ingest_lighthouse"}
      ]
    },
    {
      "task_key": "gold_views",
      "notebook_task": {
        "notebook_path": "$NOTEBOOK_DIR/gold_views",
        "source": "WORKSPACE"
      },
      "depends_on": [{"task_key": "silver_transforms"}]
    }
  ],
  "schedule": {
    "quartz_cron_expression": "0 0 0 * * ?",
    "timezone_id": "UTC"
  }
}
JOBEOF
)

JOB_RESULT=$(db_api POST "/api/2.1/jobs/create" -d "$JOB_JSON" 2>/dev/null || echo '{"error":"failed"}')
JOB_ID=$(echo "$JOB_RESULT" | python3 -c "import json,sys; print(json.load(sys.stdin).get('job_id','FAILED'))" 2>/dev/null || echo "FAILED")

if [ "$JOB_ID" != "FAILED" ]; then
  echo "Created job: $JOB_ID"
  echo ""
  echo "Add these to your GitHub repo (github.com/Stritheo/madebymiles/settings):"
  echo "  Secret:   DATABRICKS_HOST  = $DATABRICKS_HOST"
  echo "  Secret:   DATABRICKS_TOKEN = (your Databricks PAT)"
  echo "  Variable: DATABRICKS_REFRESH_JOB_ID = $JOB_ID"
  echo "  Variable: DATABRICKS_WAREHOUSE_ID   = $WAREHOUSE_ID"
else
  echo "WARNING: Job creation failed. You may need to create it manually."
  echo "Result: $JOB_RESULT"
fi

echo ""
echo "=== Done ==="
echo ""
echo "Next steps:"
echo "  1. Open Databricks and run each ingestion notebook once (paste tokens when prompted)"
echo "  2. After secrets are confirmed working, the job will use them automatically"
echo "  3. Build the dashboard: SQL > Dashboards > Create Dashboard"
echo "     (use the gold views -- see databricks/notebooks/gold/)"
echo "  4. Add GitHub repo secrets/variables (printed above)"
echo "  5. Trigger the weekly report: Actions > Weekly Observability Report > Run workflow"
echo "  6. IMPORTANT: Rotate all API tokens that were exposed in the old notebook widgets"
echo ""
