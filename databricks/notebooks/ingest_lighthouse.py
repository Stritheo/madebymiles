# Databricks notebook: Ingest Lighthouse CI scores from GitHub Actions
# Target: madebymiles.bronze.lighthouse_scores
# Schedule: Daily (after ingest_github_actions)
# Tokens: via Databricks Secrets (scope: madebymiles)
#
# Strategy: Download Lighthouse artifacts from GitHub Actions runs.
# The deploy.yml workflow uploads lighthouse-results as an artifact.

import json
import io
import zipfile
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
headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Accept": "application/vnd.github+json",
}

# -- Fetch recent successful deploy runs --
since = (datetime.now(timezone.utc) - timedelta(days=14)).strftime("%Y-%m-%dT%H:%M:%SZ")

resp = requests.get(
    f"https://api.github.com/repos/{REPO}/actions/runs",
    headers=headers,
    params={"created": f">={since}", "per_page": "30", "status": "completed"},
    timeout=30,
)
resp.raise_for_status()
runs_data = resp.json()

rows = []
for run in runs_data.get("workflow_runs", []):
    if run["conclusion"] != "success":
        continue

    # Check for Lighthouse artifacts
    artifacts_resp = requests.get(
        f"https://api.github.com/repos/{REPO}/actions/runs/{run['id']}/artifacts",
        headers=headers,
        timeout=30,
    )
    artifacts_resp.raise_for_status()
    artifacts = artifacts_resp.json().get("artifacts", [])

    for artifact in artifacts:
        if "lighthouse" not in artifact["name"].lower():
            continue

        if artifact.get("expired", False):
            print(f"  Skipping expired artifact: {artifact['name']} (run {run['id']})")
            continue

        # Download the artifact zip
        dl_resp = requests.get(
            artifact["archive_download_url"],
            headers=headers,
            timeout=60,
            allow_redirects=True,
        )
        if dl_resp.status_code != 200:
            print(f"  Could not download artifact {artifact['name']}: HTTP {dl_resp.status_code}")
            continue

        # Extract JSON from zip
        try:
            with zipfile.ZipFile(io.BytesIO(dl_resp.content)) as zf:
                for fname in zf.namelist():
                    if fname.endswith(".json"):
                        report = json.loads(zf.read(fname))

                        # Handle both lhci manifest and raw Lighthouse JSON
                        if isinstance(report, list):
                            # LHCI manifest format
                            for entry in report:
                                cats = entry.get("summary", {})
                                rows.append({
                                    "run_id": run["id"],
                                    "run_date": run["created_at"],
                                    "url": entry.get("url", "unknown"),
                                    "performance": int(cats.get("performance", 0) * 100),
                                    "accessibility": int(cats.get("accessibility", 0) * 100),
                                    "best_practices": int(cats.get("best-practices", 0) * 100),
                                    "seo": int(cats.get("seo", 0) * 100),
                                    "fcp_ms": None,
                                    "tti_ms": None,
                                    "total_bytes": None,
                                })
                        elif "categories" in report:
                            # Raw Lighthouse JSON
                            cats = report["categories"]
                            audits = report.get("audits", {})
                            rows.append({
                                "run_id": run["id"],
                                "run_date": run["created_at"],
                                "url": report.get("finalUrl", report.get("requestedUrl", "unknown")),
                                "performance": int((cats.get("performance", {}).get("score") or 0) * 100),
                                "accessibility": int((cats.get("accessibility", {}).get("score") or 0) * 100),
                                "best_practices": int((cats.get("best-practices", {}).get("score") or 0) * 100),
                                "seo": int((cats.get("seo", {}).get("score") or 0) * 100),
                                "fcp_ms": audits.get("first-contentful-paint", {}).get("numericValue"),
                                "tti_ms": audits.get("interactive", {}).get("numericValue"),
                                "total_bytes": audits.get("total-byte-weight", {}).get("numericValue"),
                            })
        except Exception as e:
            print(f"  Error parsing artifact from run {run['id']}: {e}")
            continue

# -- Write to bronze table --
if rows:
    df = spark.createDataFrame(rows)
    df.write.mode("overwrite").option("overwriteSchema", "true").saveAsTable("madebymiles.bronze.lighthouse_scores")
    print(f"Ingested {len(rows)} Lighthouse scores into bronze.lighthouse_scores")
else:
    print("No Lighthouse artifacts found in recent runs")
    print("This is normal if the deploy workflow does not upload lighthouse-results artifacts")
    # Create empty table so downstream transforms do not fail
    from pyspark.sql.types import StructType, StructField, LongType, StringType, IntegerType, DoubleType
    schema = StructType([
        StructField("run_id", LongType()), StructField("run_date", StringType()),
        StructField("url", StringType()), StructField("performance", IntegerType()),
        StructField("accessibility", IntegerType()), StructField("best_practices", IntegerType()),
        StructField("seo", IntegerType()), StructField("fcp_ms", DoubleType()),
        StructField("tti_ms", DoubleType()), StructField("total_bytes", DoubleType()),
    ])
    spark.createDataFrame([], schema).write.mode("overwrite").option("overwriteSchema", "true").saveAsTable("madebymiles.bronze.lighthouse_scores")
    print("Created empty bronze.lighthouse_scores table")
