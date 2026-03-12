# Databricks notebook: Ingest Cloudflare Analytics data
# Target: madebymiles.bronze.cloudflare_analytics
# Schedule: Daily
# Tokens: via Databricks Secrets (scope: madebymiles)

import json
import requests
from datetime import datetime, timedelta, timezone

# -- Config --
try:
    TOKEN = dbutils.secrets.get("madebymiles", "CLOUDFLARE_API_TOKEN")
    ZONE_ID = dbutils.secrets.get("madebymiles", "CLOUDFLARE_ZONE_ID")
except Exception:
    dbutils.widgets.text("CLOUDFLARE_API_TOKEN", "", "Cloudflare API Token (fallback)")
    dbutils.widgets.text("CLOUDFLARE_ZONE_ID", "", "Cloudflare Zone ID (fallback)")
    TOKEN = dbutils.widgets.get("CLOUDFLARE_API_TOKEN")
    ZONE_ID = dbutils.widgets.get("CLOUDFLARE_ZONE_ID")
    if not TOKEN or not ZONE_ID:
        raise ValueError("No Cloudflare credentials found in secrets or widgets")

# -- Fetch zone analytics (last 14 days) --
since = (datetime.now(timezone.utc) - timedelta(days=14)).strftime("%Y-%m-%d")
until = datetime.now(timezone.utc).strftime("%Y-%m-%d")

gql_query = (
    'query { viewer { zones(filter: {zoneTag: "%s"}) { '
    'httpRequests1dGroups(limit: 14, filter: {date_geq: "%s", date_lt: "%s"}) { '
    'dimensions { date } '
    'sum { requests cachedRequests bytes cachedBytes threats pageViews } '
    'uniq { uniques } } } } }'
) % (ZONE_ID, since, until)

resp = requests.post(
    "https://api.cloudflare.com/client/v4/graphql",
    headers={
        "Authorization": f"Bearer {TOKEN}",
        "Content-Type": "application/json",
    },
    json={"query": gql_query},
    timeout=30,
)
resp.raise_for_status()
data = resp.json()

if data.get("errors"):
    for err in data["errors"]:
        print(f"Cloudflare API error: {err.get('message', err)}")
    raise RuntimeError("Cloudflare GraphQL returned errors")

viewer = (data.get("data") or {}).get("viewer")
if viewer is None:
    raise RuntimeError("Cloudflare returned viewer=null. Check API token permissions.")

rows = []
for zone in viewer.get("zones", []):
    for group in zone.get("httpRequests1dGroups", []):
        s = group["sum"]
        rows.append({
            "date": group["dimensions"]["date"],
            "requests": s["requests"],
            "cached_requests": s["cachedRequests"],
            "bytes": s["bytes"],
            "cached_bytes": s["cachedBytes"],
            "threats": s["threats"],
            "page_views": s["pageViews"],
            "unique_visitors": group["uniq"]["uniques"],
            "cache_hit_rate": round(s["cachedRequests"] / max(s["requests"], 1) * 100, 2),
        })

# -- Write to bronze table --
if rows:
    df = spark.createDataFrame(rows)
    df.write.mode("overwrite").saveAsTable("madebymiles.bronze.cloudflare_analytics")
    print(f"Ingested {len(rows)} days of Cloudflare analytics into bronze.cloudflare_analytics")
else:
    print("No Cloudflare analytics data found")
