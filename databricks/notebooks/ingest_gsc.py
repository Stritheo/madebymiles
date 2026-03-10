# Databricks notebook: Ingest Google Search Console data
# Schedule: Daily (GSC data has 2-3 day lag)
# Secrets required: GSC_SERVICE_ACCOUNT_JSON
# Pip install: google-api-python-client google-auth

# %pip install google-api-python-client google-auth

from google.oauth2 import service_account
from googleapiclient.discovery import build
from datetime import datetime, timedelta
import json

# -- Config --
SITE_URL = "sc-domain:madebymiles.ai"  # or "https://madebymiles.ai/"
sa_json = dbutils.secrets.get(scope="madebymiles", key="GSC_SERVICE_ACCOUNT_JSON")
credentials = service_account.Credentials.from_service_account_info(
    json.loads(sa_json),
    scopes=["https://www.googleapis.com/auth/webmasters.readonly"]
)

# -- Build GSC service --
service = build("searchconsole", "v1", credentials=credentials)

# -- Query last 7 days (with 3-day lag) --
end_date = (datetime.utcnow() - timedelta(days=3)).strftime("%Y-%m-%d")
start_date = (datetime.utcnow() - timedelta(days=10)).strftime("%Y-%m-%d")

response = service.searchanalytics().query(
    siteUrl=SITE_URL,
    body={
        "startDate": start_date,
        "endDate": end_date,
        "dimensions": ["date", "page", "query"],
        "rowLimit": 1000,
    }
).execute()

rows = []
for row in response.get("rows", []):
    rows.append({
        "date": row["keys"][0],
        "page": row["keys"][1],
        "query": row["keys"][2],
        "clicks": row["clicks"],
        "impressions": row["impressions"],
        "ctr": round(row["ctr"] * 100, 2),
        "position": round(row["position"], 1),
    })

# -- Write to Unity Catalog table --
if rows:
    df = spark.createDataFrame(rows)
    df.write.mode("overwrite").saveAsTable("madebymiles.observability.gsc_search_data")
    print(f"Ingested {len(rows)} GSC rows")
else:
    print("No GSC data returned for this period")
