# Databricks notebook: Ingest Lighthouse CI results from GitHub Actions logs
# Schedule: After each deploy (triggered by workflow or daily catch-up)
# Requires: Unity Catalog connection 'github_api' (run setup_connections.py first)
# Note: Artifact binary downloads are not supported via Unity Catalog HTTP connections.
# Instead, this notebook reads Lighthouse scores from the workflow run annotations/checks.

import json
import re
from datetime import datetime, timedelta

# -- Config --
REPO = "Stritheo/madebymiles"

# -- Fetch recent workflow runs --
since = (datetime.utcnow() - timedelta(days=7)).strftime("%Y-%m-%dT%H:%M:%SZ")
path = f"/repos/{REPO}/actions/runs?created=>={since}&per_page=20"

result = spark.sql(f"""
SELECT http_request(
  conn => 'github_api',
  method => 'GET',
  path => '{path}',
  headers => map('Accept', 'application/vnd.github+json')
)
""").collect()[0][0]

runs_data = json.loads(result.text)

def _extract_score(text, pattern):
    """Extract a numeric score from text using a regex pattern."""
    match = re.search(pattern, text, re.IGNORECASE)
    return int(match.group(1)) if match else None

rows = []
for run in runs_data.get("workflow_runs", []):
    if run["name"] != "Build & Deploy" or run["conclusion"] != "success":
        continue

    # Fetch check runs for this commit to find Lighthouse annotations
    checks_path = f"/repos/{REPO}/commits/{run['head_sha']}/check-runs"
    checks_result = spark.sql(f"""
    SELECT http_request(
      conn => 'github_api',
      method => 'GET',
      path => '{checks_path}',
      headers => map('Accept', 'application/vnd.github+json')
    )
    """).collect()[0][0]

    checks_data = json.loads(checks_result.text)

    for check in checks_data.get("check_runs", []):
        output = check.get("output", {})
        summary = output.get("summary", "") or ""
        text = output.get("text", "") or ""
        name = check.get("name", "").lower()

        # Look for Lighthouse-related check runs or annotations with scores
        combined = summary + " " + text
        if not combined.strip():
            continue

        # Try to extract scores from common Lighthouse CI output patterns
        perf = _extract_score(combined, r"performance[:\s]+(\d+)")
        a11y = _extract_score(combined, r"accessibility[:\s]+(\d+)")
        bp = _extract_score(combined, r"best.practices[:\s]+(\d+)")
        seo = _extract_score(combined, r"seo[:\s]+(\d+)")

        if perf is not None:
            rows.append({
                "run_id": run["id"],
                "run_date": run["created_at"],
                "url": "https://madebymiles.ai",
                "performance": perf,
                "accessibility": a11y or 0,
                "best_practices": bp or 0,
                "seo": seo or 0,
            })
            break  # One row per run

# -- Write to Unity Catalog table --
if rows:
    df = spark.createDataFrame(rows)
    df.write.mode("append").option("mergeSchema", "true").saveAsTable("madebymiles.observability.lighthouse_scores")
    print(f"Ingested {len(rows)} Lighthouse reports")
else:
    print("No Lighthouse scores found in recent runs (this is normal if scores aren't in check annotations)")
