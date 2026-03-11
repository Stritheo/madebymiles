# Databricks notebook: Ingest Cloudflare Analytics data
# Schedule: Daily
# Requires: Unity Catalog connection 'cloudflare_api' (run setup_connections.py first)
# Also requires: CLOUDFLARE_ZONE_ID stored as a notebook widget (not secret, just config)

import json
import requests
from datetime import datetime, timedelta, timezone

# -- Config --
dbutils.widgets.text("CLOUDFLARE_ZONE_ID", "fd6f6b524d5d40110ebb65d504ae827b", "Cloudflare Zone ID")
ZONE_ID = dbutils.widgets.get("CLOUDFLARE_ZONE_ID")
if not ZONE_ID:
    raise ValueError("Please provide CLOUDFLARE_ZONE_ID via the widget at the top of the notebook")

# Retrieve the bearer token from the Unity Catalog connection
conn_info = spark.sql("DESCRIBE CONNECTION cloudflare_api").collect()
token = None
for row in conn_info:
    opts = row.asDict()
    if "options" in opts:
        import ast
        options = ast.literal_eval(opts["options"]) if isinstance(opts["options"], str) else opts["options"]
        token = options.get("bearer_token")
        break

if not token:
    dbutils.widgets.text("CLOUDFLARE_API_TOKEN", "", "Cloudflare API Token (if connection unavailable)")
    token = dbutils.widgets.get("CLOUDFLARE_API_TOKEN")

if not token:
    raise ValueError("No Cloudflare API token found. Either set up the 'cloudflare_api' connection or provide the token via the widget.")

# -- Fetch zone analytics (last 7 days) --
since = (datetime.now(timezone.utc) - timedelta(days=7)).strftime("%Y-%m-%dT%H:%M:%SZ")
until = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

gql_query = (
    'query { viewer { zones(filter: {zoneTag: "%s"}) { '
    'httpRequests1dGroups(limit: 7, filter: {date_geq: "%s", date_lt: "%s"}) { '
    'dimensions { date } '
    'sum { requests cachedRequests bytes cachedBytes threats pageViews } '
    'uniq { uniques } } } } }'
) % (ZONE_ID, since[:10], until[:10])

resp = requests.post(
    "https://api.cloudflare.com/client/v4/graphql",
    headers={
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    },
    json={"query": gql_query},
    timeout=30,
)
resp.raise_for_status()
data = resp.json()

# Surface API errors before processing
if data.get("errors"):
    for err in data["errors"]:
        print(f"Cloudflare API error: {err.get('message', err)}")
    raise RuntimeError("Cloudflare GraphQL returned errors (check your API token permissions)")

viewer = (data.get("data") or {}).get("viewer")
if viewer is None:
    print(f"Full API response: {json.dumps(data, indent=2)[:500]}")
    raise RuntimeError("Cloudflare returned viewer=null. The API token likely lacks analytics read permission for this zone.")

rows = []
zones = viewer.get("zones", [])
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
