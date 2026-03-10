# Databricks notebook: Ingest GitHub Actions data
# Schedule: Daily
# Secrets required: GITHUB_TOKEN (personal access token with repo, actions:read)

import requests
import json
from datetime import datetime, timedelta

# -- Config --
REPO = "Stritheo/madebymiles"
TOKEN = dbutils.secrets.get(scope="madebymiles", key="GITHUB_TOKEN")
HEADERS = {"Authorization": f"Bearer {TOKEN}", "Accept": "application/vnd.github+json"}
BASE_URL = f"https://api.github.com/repos/{REPO}"

# -- Fetch workflow runs (last 7 days) --
since = (datetime.utcnow() - timedelta(days=7)).strftime("%Y-%m-%dT%H:%M:%SZ")
runs_url = f"{BASE_URL}/actions/runs?created=>={since}&per_page=100"
response = requests.get(runs_url, headers=HEADERS)
response.raise_for_status()
runs_data = response.json()

rows = []
for run in runs_data.get("workflow_runs", []):
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

# -- Write to Unity Catalog table --
df = spark.createDataFrame(rows)
df.write.mode("overwrite").saveAsTable("madebymiles.observability.github_actions_runs")

print(f"Ingested {len(rows)} workflow runs")
