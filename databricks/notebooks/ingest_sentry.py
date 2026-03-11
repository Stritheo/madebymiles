# Databricks notebook: Ingest Sentry issues and events
# Schedule: Daily
# Paste your Sentry auth token into the SENTRY_TOKEN widget at the top

import json
import requests
from datetime import datetime, timezone

# -- Config --
dbutils.widgets.text("SENTRY_ORG", "stritheo", "Sentry Org Slug")
dbutils.widgets.text("SENTRY_PROJECT", "madebymiles", "Sentry Project Slug")
dbutils.widgets.text("SENTRY_TOKEN", "", "Sentry Auth Token")

ORG = dbutils.widgets.get("SENTRY_ORG")
PROJECT = dbutils.widgets.get("SENTRY_PROJECT")
TOKEN = dbutils.widgets.get("SENTRY_TOKEN")

if not ORG or not PROJECT:
    raise ValueError("Please provide SENTRY_ORG and SENTRY_PROJECT via the widgets at the top")
if not TOKEN:
    raise ValueError("Please paste your Sentry auth token into the SENTRY_TOKEN widget at the top of the notebook")

# -- Fetch recent issues --
resp = requests.get(
    f"https://sentry.io/api/0/projects/{ORG}/{PROJECT}/issues/",
    headers={"Authorization": f"Bearer {TOKEN}"},
    params={"statsPeriod": "7d", "sort": "freq"},
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

# -- Write to Unity Catalog table --
if rows:
    df = spark.createDataFrame(rows)
    df.write.mode("overwrite").saveAsTable("madebymiles.observability.sentry_issues")
    print(f"Ingested {len(rows)} Sentry issues")
else:
    print("No Sentry issues found (good news)")
