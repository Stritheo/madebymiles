# Databricks notebook: Ingest Lighthouse CI results from GitHub Actions artifacts
# Schedule: After each deploy (triggered by workflow or daily catch-up)
# Secrets required: GITHUB_TOKEN

import requests
import json
import zipfile
import io
from datetime import datetime, timedelta

# -- Config --
REPO = "Stritheo/madebymiles"
TOKEN = dbutils.secrets.get(scope="madebymiles", key="GITHUB_TOKEN")
HEADERS = {"Authorization": f"Bearer {TOKEN}", "Accept": "application/vnd.github+json"}
BASE_URL = f"https://api.github.com/repos/{REPO}"

# -- Find recent Lighthouse workflow runs --
since = (datetime.utcnow() - timedelta(days=7)).strftime("%Y-%m-%dT%H:%M:%SZ")
runs_url = f"{BASE_URL}/actions/runs?created=>={since}&per_page=20"
response = requests.get(runs_url, headers=HEADERS)
response.raise_for_status()

rows = []
for run in response.json().get("workflow_runs", []):
    if run["name"] != "Build & Deploy" or run["conclusion"] != "success":
        continue

    # Fetch artifacts for this run
    artifacts_url = f"{BASE_URL}/actions/runs/{run['id']}/artifacts"
    art_response = requests.get(artifacts_url, headers=HEADERS)
    art_response.raise_for_status()

    for artifact in art_response.json().get("artifacts", []):
        if "lighthouse" not in artifact["name"].lower():
            continue

        # Download and parse the Lighthouse JSON
        dl_url = artifact["archive_download_url"]
        dl_response = requests.get(dl_url, headers=HEADERS)
        dl_response.raise_for_status()

        with zipfile.ZipFile(io.BytesIO(dl_response.content)) as z:
            for filename in z.namelist():
                if filename.endswith(".json"):
                    with z.open(filename) as f:
                        try:
                            report = json.loads(f.read())
                            categories = report.get("categories", {})
                            rows.append({
                                "run_id": run["id"],
                                "run_date": run["created_at"],
                                "url": report.get("finalUrl", report.get("requestedUrl", "")),
                                "performance": int(categories.get("performance", {}).get("score", 0) * 100),
                                "accessibility": int(categories.get("accessibility", {}).get("score", 0) * 100),
                                "best_practices": int(categories.get("best-practices", {}).get("score", 0) * 100),
                                "seo": int(categories.get("seo", {}).get("score", 0) * 100),
                                "fcp_ms": report.get("audits", {}).get("first-contentful-paint", {}).get("numericValue", 0),
                                "tti_ms": report.get("audits", {}).get("interactive", {}).get("numericValue", 0),
                                "total_bytes": report.get("audits", {}).get("total-byte-weight", {}).get("numericValue", 0),
                            })
                        except (json.JSONDecodeError, KeyError):
                            continue

# -- Write to Unity Catalog table --
if rows:
    df = spark.createDataFrame(rows)
    df.write.mode("append").saveAsTable("madebymiles.observability.lighthouse_scores")
    print(f"Ingested {len(rows)} Lighthouse reports")
else:
    print("No new Lighthouse artifacts found")
