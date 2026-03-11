# Databricks notebook: Ingest Lighthouse CI results from GitHub Actions artifacts
# Schedule: After each deploy (triggered by workflow or daily catch-up)
# Requires: Unity Catalog connection 'github_api' (run setup_connections.py first)

import json
import zipfile
import io
import requests
from datetime import datetime, timedelta

# -- Config --
REPO = "Stritheo/madebymiles"

# -- Fetch recent workflow runs via connection --
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

# -- For artifact downloads, we need the token from the connection --
# Use direct requests with the connection for artifact listing,
# but artifact download requires following redirects which http_request may not handle.
# Fall back to direct requests for the download step.

rows = []
for run in runs_data.get("workflow_runs", []):
    if run["name"] != "Build & Deploy" or run["conclusion"] != "success":
        continue

    # Fetch artifacts via connection
    art_path = f"/repos/{REPO}/actions/runs/{run['id']}/artifacts"
    art_result = spark.sql(f"""
    SELECT http_request(
      conn => 'github_api',
      method => 'GET',
      path => '{art_path}',
      headers => map('Accept', 'application/vnd.github+json')
    )
    """).collect()[0][0]

    artifacts = json.loads(art_result.text)

    for artifact in artifacts.get("artifacts", []):
        if "lighthouse" not in artifact["name"].lower():
            continue

        # Note: artifact download requires redirect handling.
        # If this fails, Lighthouse data can be parsed from the deploy workflow logs instead.
        try:
            dl_path = f"/repos/{REPO}/actions/artifacts/{artifact['id']}/zip"
            dl_result = spark.sql(f"""
            SELECT http_request(
              conn => 'github_api',
              method => 'GET',
              path => '{dl_path}',
              headers => map('Accept', 'application/vnd.github+json')
            )
            """).collect()[0][0]

            with zipfile.ZipFile(io.BytesIO(dl_result.content)) as z:
                for filename in z.namelist():
                    if filename.endswith(".json"):
                        with z.open(filename) as f:
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
        except Exception as e:
            print(f"Could not download artifact {artifact['name']}: {e}")
            continue

# -- Write to Unity Catalog table --
if rows:
    df = spark.createDataFrame(rows)
    df.write.mode("append").saveAsTable("madebymiles.observability.lighthouse_scores")
    print(f"Ingested {len(rows)} Lighthouse reports")
else:
    print("No new Lighthouse artifacts found")
