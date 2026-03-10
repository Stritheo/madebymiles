# Databricks notebook: Ingest Cloudflare Analytics data
# Schedule: Daily
# Secrets required: CLOUDFLARE_API_TOKEN, CLOUDFLARE_ZONE_ID

import requests
from datetime import datetime, timedelta

# -- Helper: get secret with widget fallback for Free Edition --
def get_secret(key, label=None):
    """Try dbutils.secrets first. If unavailable, fall back to widget input."""
    try:
        return dbutils.secrets.get(scope="madebymiles", key=key)
    except Exception:
        if label is None:
            label = key
        dbutils.widgets.text(key, "", label)
        val = dbutils.widgets.get(key)
        if not val:
            raise ValueError(f"Please provide {label} via the widget at the top of the notebook")
        return val

# -- Config --
TOKEN = get_secret("CLOUDFLARE_API_TOKEN", "Cloudflare API Token")
ZONE_ID = get_secret("CLOUDFLARE_ZONE_ID", "Cloudflare Zone ID")
HEADERS = {"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"}

# -- Fetch zone analytics (last 7 days) --
since = (datetime.utcnow() - timedelta(days=7)).strftime("%Y-%m-%dT%H:%M:%SZ")
until = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")

# GraphQL analytics query
query = """
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
""" % (ZONE_ID, since[:10], until[:10])

response = requests.post(
    "https://api.cloudflare.com/client/v4/graphql",
    headers=HEADERS,
    json={"query": query}
)
response.raise_for_status()
data = response.json()

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
