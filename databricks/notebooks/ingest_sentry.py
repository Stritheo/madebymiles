# Databricks notebook: Ingest Sentry issues and events
# Schedule: Daily
# Secrets required: SENTRY_AUTH_TOKEN, SENTRY_ORG, SENTRY_PROJECT

import requests
from datetime import datetime

# -- Config --
TOKEN = dbutils.secrets.get(scope="madebymiles", key="SENTRY_AUTH_TOKEN")
ORG = dbutils.secrets.get(scope="madebymiles", key="SENTRY_ORG")
PROJECT = dbutils.secrets.get(scope="madebymiles", key="SENTRY_PROJECT")
HEADERS = {"Authorization": f"Bearer {TOKEN}"}
BASE_URL = f"https://sentry.io/api/0/projects/{ORG}/{PROJECT}"

# -- Fetch recent issues --
response = requests.get(
    f"{BASE_URL}/issues/?statsPeriod=7d&sort=freq",
    headers=HEADERS
)
response.raise_for_status()
issues = response.json()

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
