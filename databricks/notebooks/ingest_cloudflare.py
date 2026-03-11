# Databricks notebook: Ingest Cloudflare Analytics data
# Schedule: Daily
# Requires: Unity Catalog connection 'cloudflare_api' (run setup_connections.py first)
# Also requires: CLOUDFLARE_ZONE_ID stored as a notebook widget (not secret, just config)

import json
from datetime import datetime, timedelta

# -- Config --
dbutils.widgets.text("CLOUDFLARE_ZONE_ID", "", "Cloudflare Zone ID")
ZONE_ID = dbutils.widgets.get("CLOUDFLARE_ZONE_ID")
if not ZONE_ID:
    raise ValueError("Please provide CLOUDFLARE_ZONE_ID via the widget at the top of the notebook")

# -- Fetch zone analytics (last 7 days) --
since = (datetime.utcnow() - timedelta(days=7)).strftime("%Y-%m-%dT%H:%M:%SZ")
until = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")

query_body = json.dumps({"query": """
query {
  viewer {
    zones(filter: {zoneTag: "%s"}) {
      httpRequests1dGroups(
        limit: 7,
        filter: {date_geq: "%s", date_lt: "%s"}
      ) {
        dimensions { date }
        sum {
          requests
          cachedRequests
          bytes
          cachedBytes
          threats
          pageViews
        }
        uniq { uniques }
      }
    }
  }
}
""" % (ZONE_ID, since[:10], until[:10])})

result = spark.sql(f"""
SELECT http_request(
  conn => 'cloudflare_api',
  method => 'POST',
  path => '/client/v4/graphql',
  json => '{query_body.replace("'", "''")}'
)
""").collect()[0][0]

data = json.loads(result.text)

rows = []
zones = data.get("data", {}).get("viewer", {}).get("zones", [])
for zone in zones:
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

# -- Write to Unity Catalog table --
df = spark.createDataFrame(rows)
df.write.mode("overwrite").saveAsTable("madebymiles.observability.cloudflare_analytics")

print(f"Ingested {len(rows)} days of Cloudflare analytics")
