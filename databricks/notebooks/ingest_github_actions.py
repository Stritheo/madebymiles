# Databricks notebook: Ingest GitHub Actions data
# Target: madebymiles.bronze.github_actions_runs
# Schedule: Daily
# Tokens: via Databricks Secrets (scope: madebymiles)

import json
import requests
from datetime import datetime, timedelta, timezone

# -- Config --
try:
    TOKEN = dbutils.secrets.get("madebymiles", "GITHUB_TOKEN")
except Exception:
    dbutils.widgets.text("GITHUB_TOKEN", "", "GitHub Personal Access Token (fallback)")
    TOKEN = dbutils.widgets.get("GITHUB_TOKEN")
    if not TOKEN:
        raise ValueError("No GitHub token found in secrets or widget")

REPO = "Stritheo/madebymiles"

# -- Fetch workflow runs (last 14 days) --
since = (datetime.now(timezone.utc) - timedelta(days=14)).strftime("%Y-%m-%dT%H:%M:%SZ")

resp = requests.get(
    f"https://api.github.com/repos/{REPO}/actions/runs",
    headers={
        "Authorization": f"Bearer {TOKEN}",
        "Accept": "application/vnd.github+json",
    },
    params={"created": f">={since}", "per_page": "100"},
    timeout=30,
)
resp.raise_for_status()
response_data = resp.json()

rows = []
for run in response_data.get("workflow_runs", []):
    rows.append({
        "run_id": run["id"],
        "name": run["name"],
        "status": run["status"],
        "conclusion": run["conclusion"],
        "created_at": run["created_at"],
        "updated_at": run["updated_at"],
        "run_started_at": run.get("run_started_at"),
        "head_sha": run["head_sha"][:7],
        "actor": run["actor"]["login"],
        "event": run["event"],
        "run_attempt": run["run_attempt"],
        "html_url": run["html_url"],
    })

# -- Write to bronze table --
if rows:
    df = spark.createDataFrame(rows)
    df.write.mode("overwrite").option("overwriteSchema", "true").saveAsTable("madebymiles.bronze.github_actions_runs")
    print(f"Ingested {len(rows)} workflow runs into bronze.github_actions_runs")
else:
    print("No workflow runs found in last 14 days")
