# Databricks notebook: Ingest Lighthouse CI results from GitHub Actions logs
# Schedule: After each deploy (triggered by workflow or daily catch-up)
# Paste your GitHub token into the GITHUB_TOKEN widget at the top
# Note: This notebook reads Lighthouse scores from workflow run check annotations.

import json
import re
import requests
from datetime import datetime, timedelta, timezone

# -- Config --
dbutils.widgets.text("GITHUB_TOKEN", "", "GitHub Personal Access Token")
REPO = "Stritheo/madebymiles"
TOKEN = dbutils.widgets.get("GITHUB_TOKEN")
if not TOKEN:
    raise ValueError("Please paste your GitHub token into the GITHUB_TOKEN widget at the top of the notebook")

headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Accept": "application/vnd.github+json",
}

# -- Fetch recent workflow runs --
since = (datetime.now(timezone.utc) - timedelta(days=7)).strftime("%Y-%m-%dT%H:%M:%SZ")

resp = requests.get(
    f"https://api.github.com/repos/{REPO}/actions/runs",
    headers=headers,
    params={"created": f">={since}", "per_page": "20"},
    timeout=30,
)
resp.raise_for_status()
runs_data = resp.json()

def _extract_score(text, pattern):
    """Extract a numeric score from text using a regex pattern."""
    match = re.search(pattern, text, re.IGNORECASE)
    return int(match.group(1)) if match else None

rows = []
for run in runs_data.get("workflow_runs", []):
    if run["name"] != "Build & Deploy" or run["conclusion"] != "success":
        continue

    # Fetch check runs for this commit to find Lighthouse annotations
    checks_resp = requests.get(
        f"https://api.github.com/repos/{REPO}/commits/{run['head_sha']}/check-runs",
        headers=headers,
        timeout=30,
    )
    checks_resp.raise_for_status()
    checks_data = checks_resp.json()

    for check in checks_data.get("check_runs", []):
        output = check.get("output", {})
        summary = output.get("summary", "") or ""
        text = output.get("text", "") or ""

        combined = summary + " " + text
        if not combined.strip():
            continue

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
