# Databricks notebook: Ingest Sentry issues and events
# Schedule: Daily
# Requires: Unity Catalog connection 'sentry_api' (run setup_connections.py first)

import json
from datetime import datetime

# -- Config --
dbutils.widgets.text("SENTRY_ORG", "stritheo", "Sentry Org Slug")
dbutils.widgets.text("SENTRY_PROJECT", "madebymiles", "Sentry Project Slug")
ORG = dbutils.widgets.get("SENTRY_ORG")
PROJECT = dbutils.widgets.get("SENTRY_PROJECT")
if not ORG or not PROJECT:
    raise ValueError("Please provide SENTRY_ORG and SENTRY_PROJECT via the widgets at the top")

# -- Fetch recent issues --
path = f"/api/0/projects/{ORG}/{PROJECT}/issues/?statsPeriod=7d&sort=freq"

result = spark.sql(f"""
SELECT http_request(
  conn => 'sentry_api',
  method => 'GET',
  path => '{path}'
)
""").collect()[0][0]

issues = json.loads(result.text)

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
