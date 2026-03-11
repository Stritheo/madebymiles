# Databricks notebook: Ingest GitHub Actions data
# Schedule: Daily
# Requires: Unity Catalog connection 'github_api' (run setup_connections.py first)

import json
from datetime import datetime, timedelta

# -- Config --
REPO = "Stritheo/madebymiles"

# -- Fetch workflow runs via Unity Catalog connection --
since = (datetime.utcnow() - timedelta(days=7)).strftime("%Y-%m-%dT%H:%M:%SZ")
path = f"/repos/{REPO}/actions/runs?created=>={since}&per_page=100"

result = spark.sql(f"""
SELECT http_request(
  conn => 'github_api',
  method => 'GET',
  path => '{path}',
  headers => map('Accept', 'application/vnd.github+json')
)
""").collect()[0][0]

response_data = json.loads(result.text)

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

# -- Write to Unity Catalog table --
df = spark.createDataFrame(rows)
df.write.mode("overwrite").option("overwriteSchema", "true").saveAsTable("madebymiles.observability.github_actions_runs")

print(f"Ingested {len(rows)} workflow runs")
