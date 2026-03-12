# Databricks notebook: Ingest Sentry issues
# Target: madebymiles.bronze.sentry_issues
# Schedule: Daily
# Tokens: via Databricks Secrets (scope: madebymiles)

import json
import requests
from datetime import datetime, timezone

# -- Config --
try:
    TOKEN = dbutils.secrets.get("madebymiles", "SENTRY_TOKEN")
except Exception:
    dbutils.widgets.text("SENTRY_TOKEN", "", "Sentry Auth Token (fallback)")
    TOKEN = dbutils.widgets.get("SENTRY_TOKEN")
    if not TOKEN:
        raise ValueError("No Sentry token found in secrets or widget")

ORG = "stritheo"
PROJECT = "madebymiles"

# -- Fetch recent issues --
resp = requests.get(
    f"https://sentry.io/api/0/projects/{ORG}/{PROJECT}/issues/",
    headers={"Authorization": f"Bearer {TOKEN}"},
    params={"statsPeriod": "14d", "sort": "freq"},
    timeout=30,
)
resp.raise_for_status()
issues = resp.json()

rows = []
for issue in issues:
    rows.append({
        "issue_id": issue["id"],
        "title": issue["title"],
        "culprit": issue.get("culprit", ""),
        "level": issue["level"],
        "status": issue["status"],
        "count": int(issue["count"]),
        "first_seen": issue["firstSeen"],
        "last_seen": issue["lastSeen"],
        "type": issue.get("type", ""),
        "platform": issue.get("platform", ""),
        "permalink": issue["permalink"],
    })

# -- Write to bronze table --
if rows:
    df = spark.createDataFrame(rows)
    df.write.mode("overwrite").saveAsTable("madebymiles.bronze.sentry_issues")
    print(f"Ingested {len(rows)} Sentry issues into bronze.sentry_issues")
else:
    print("No Sentry issues found in last 14 days (this is good news)")
    # Create empty table so downstream transforms do not fail
    schema = "issue_id STRING, title STRING, culprit STRING, level STRING, status STRING, count INT, first_seen STRING, last_seen STRING, type STRING, platform STRING, permalink STRING"
    spark.createDataFrame([], schema).write.mode("overwrite").saveAsTable("madebymiles.bronze.sentry_issues")
    print("Created empty bronze.sentry_issues table")
