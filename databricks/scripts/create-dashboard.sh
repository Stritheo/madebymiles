#!/usr/bin/env bash
# Create the AI/BI Dashboard via Databricks REST API
# Run after the gold layer notebooks have been executed at least once.
#
# Usage: bash databricks/scripts/create-dashboard.sh

set -euo pipefail

DATABRICKS_HOST="https://dbc-0caa5555-b747.cloud.databricks.com"

if [ -z "${DATABRICKS_TOKEN:-}" ]; then
  echo "Enter your Databricks PAT:"
  read -rs DATABRICKS_TOKEN
  export DATABRICKS_TOKEN
fi

db_api() {
  local method="$1" endpoint="$2"
  shift 2
  curl -sf -X "$method" \
    -H "Authorization: Bearer $DATABRICKS_TOKEN" \
    -H "Content-Type: application/json" \
    "$DATABRICKS_HOST$endpoint" \
    "$@"
}

# Find the SQL warehouse
WAREHOUSE_ID=$(db_api GET "/api/2.0/sql/warehouses" | python3 -c "
import json, sys
data = json.load(sys.stdin)
for wh in data.get('warehouses', []):
    print(wh['id'])
    break
" 2>/dev/null)

if [ -z "$WAREHOUSE_ID" ]; then
  echo "ERROR: No SQL warehouse found."
  exit 1
fi
echo "Using warehouse: $WAREHOUSE_ID"

# Create the dashboard
echo "Creating dashboard..."
DASHBOARD_JSON=$(cat <<'DEOF'
{
  "display_name": "madebymiles.ai Observability"
}
DEOF
)

DASH_RESULT=$(db_api POST "/api/2.0/lakeview/dashboards" -d "$DASHBOARD_JSON" 2>/dev/null || echo '{}')
DASH_ID=$(echo "$DASH_RESULT" | python3 -c "import json,sys; print(json.load(sys.stdin).get('dashboard_id',''))" 2>/dev/null || echo "")

if [ -n "$DASH_ID" ]; then
  echo "Dashboard created: $DASH_ID"
  echo "Open it at: $DATABRICKS_HOST/sql/dashboardsv3/$DASH_ID"
  echo ""
  echo "The dashboard is empty. Add visualisations manually in the UI using these queries:"
else
  echo "Dashboard creation via API may not be fully supported on Free Edition."
  echo "Create it manually: SQL > Dashboards > Create Dashboard"
  echo ""
  echo "Use these queries for your panels:"
fi

echo ""
echo "=== PERFORMANCE TAB ==="
echo ""
echo "-- Lighthouse scores over time"
echo "SELECT run_date, url, performance, accessibility, best_practices, seo"
echo "FROM madebymiles.gold.lighthouse_trend"
echo "ORDER BY run_date, url"
echo ""
echo "-- FCP and TTI trends"
echo "SELECT run_date, url, fcp_ms, tti_ms, total_kb"
echo "FROM madebymiles.gold.lighthouse_trend"
echo "WHERE fcp_ms IS NOT NULL"
echo "ORDER BY run_date"
echo ""
echo "=== SECURITY TAB ==="
echo ""
echo "-- Sentry errors by level"
echo "SELECT level, status, issue_count, total_events"
echo "FROM madebymiles.gold.sentry_summary"
echo ""
echo "-- Top issues"
echo "SELECT title, level, count, last_seen_ts"
echo "FROM madebymiles.gold.sentry_top_issues"
echo ""
echo "-- Threats blocked"
echo "SELECT date, threats FROM madebymiles.gold.traffic_daily"
echo "WHERE threats > 0 ORDER BY date"
echo ""
echo "=== DEPLOYMENT TAB ==="
echo ""
echo "-- Pass/fail rate by week"
echo "SELECT week, succeeded, failed, cancelled, success_rate_pct"
echo "FROM madebymiles.gold.deploy_summary"
echo ""
echo "-- Build duration trend"
echo "SELECT week, avg_duration_seconds, avg_success_duration_seconds"
echo "FROM madebymiles.gold.deploy_summary"
echo ""
echo "=== SEARCH AND TRAFFIC TAB ==="
echo ""
echo "-- Visitors and page views"
echo "SELECT date, unique_visitors, page_views, cache_hit_rate"
echo "FROM madebymiles.gold.traffic_daily"
echo "ORDER BY date"
echo ""
echo "-- Weekly metrics snapshot (for GenAI report)"
echo "SELECT source, metric_name, metric_value"
echo "FROM madebymiles.gold.weekly_metrics"
