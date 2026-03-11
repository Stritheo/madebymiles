# Databricks notebook: Ingest Google Search Console data
# Schedule: Daily (GSC data has 2-3 day lag)
# Note: GSC uses OAuth service accounts, not bearer tokens.
# The service account JSON is provided via a Databricks secret or widget.

# %pip install google-api-python-client google-auth

from google.oauth2 import service_account
from googleapiclient.discovery import build
from datetime import datetime, timedelta, timezone
import json

# -- Config --
# Option 1: Store the GSC service account JSON as a Databricks Secret (recommended)
#   databricks secrets create-scope madebymiles
#   databricks secrets put-secret madebymiles gsc-sa-json --string-value '{"type":"service_account",...}'
# Option 2: Paste JSON into the widget text box at the top of the notebook
try:
    sa_json = dbutils.secrets.get(scope="madebymiles", key="gsc-sa-json")
except Exception:
    dbutils.widgets.text("GSC_SERVICE_ACCOUNT_JSON", "", "GSC Service Account JSON (paste full JSON)")
    sa_json = dbutils.widgets.get("GSC_SERVICE_ACCOUNT_JSON")

if not sa_json:
    raise ValueError(
        "Please either:\n"
        "  1. Store the service account JSON as a Databricks secret: "
        "scope='madebymiles', key='gsc-sa-json'\n"
        "  2. Paste the JSON into the widget at the top of this notebook"
    )

SITE_URL = "sc-domain:madebymiles.ai"
credentials = service_account.Credentials.from_service_account_info(
    json.loads(sa_json),
    scopes=["https://www.googleapis.com/auth/webmasters.readonly"]
)

# -- Build GSC service --
service = build("searchconsole", "v1", credentials=credentials)

# -- Query last 7 days (with 3-day lag) --
end_date = (datetime.now(timezone.utc) - timedelta(days=3)).strftime("%Y-%m-%d")
start_date = (datetime.now(timezone.utc) - timedelta(days=10)).strftime("%Y-%m-%d")

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
