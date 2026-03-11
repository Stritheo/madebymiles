# Databricks notebook: Ingest Supabase project health metrics
# Schedule: Daily
# Paste your Supabase access token into the SUPABASE_TOKEN widget at the top

import json
import requests
from datetime import datetime, timezone

# -- Config --
dbutils.widgets.text("SUPABASE_PROJECT_REF", "wmjgvscktxawvfybxoue", "Supabase Project Ref")
dbutils.widgets.text("SUPABASE_TOKEN", "", "Supabase Access Token")

PROJECT_REF = dbutils.widgets.get("SUPABASE_PROJECT_REF")
TOKEN = dbutils.widgets.get("SUPABASE_TOKEN")

if not PROJECT_REF:
    raise ValueError("Please provide SUPABASE_PROJECT_REF via the widget at the top")
if not TOKEN:
    raise ValueError("Please paste your Supabase access token into the SUPABASE_TOKEN widget at the top of the notebook")

headers = {"Authorization": f"Bearer {TOKEN}"}

# -- Fetch project health --
db_resp = requests.get(
    f"https://api.supabase.com/v1/projects/{PROJECT_REF}/database/health",
    headers=headers,
    timeout=30,
)
db_resp.raise_for_status()
db_data = db_resp.json()

usage_resp = requests.get(
    f"https://api.supabase.com/v1/projects/{PROJECT_REF}/usage",
    headers=headers,
    timeout=30,
)
usage_resp.raise_for_status()
usage_data = usage_resp.json()

snapshot = {
    "snapshot_date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
    "project_ref": PROJECT_REF,
    "db_healthy": db_data.get("healthy", None),
    "db_status": db_data.get("status", "unknown"),
    "db_size_bytes": usage_data.get("db_size", 0),
    "storage_size_bytes": usage_data.get("storage_size", 0),
    "bandwidth_bytes": usage_data.get("bandwidth", 0),
}

# -- Write to Unity Catalog table --
df = spark.createDataFrame([snapshot])
df.write.mode("append").saveAsTable("madebymiles.observability.supabase_health")

print(f"Ingested Supabase health snapshot for {snapshot['snapshot_date']}")
