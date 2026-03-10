# Databricks notebook: Ingest Supabase project health metrics
# Schedule: Daily
# Secrets required: SUPABASE_ACCESS_TOKEN, SUPABASE_PROJECT_REF
# Note: Supabase Management API is used (not the client API)

import requests
from datetime import datetime

# -- Config --
TOKEN = dbutils.secrets.get(scope="madebymiles", key="SUPABASE_ACCESS_TOKEN")
PROJECT_REF = dbutils.secrets.get(scope="madebymiles", key="SUPABASE_PROJECT_REF")
HEADERS = {"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"}
BASE_URL = "https://api.supabase.com/v1"

# -- Fetch project health --
# Database health
db_response = requests.get(
    f"{BASE_URL}/projects/{PROJECT_REF}/database/health",
    headers=HEADERS
)

# API usage stats
usage_response = requests.get(
    f"{BASE_URL}/projects/{PROJECT_REF}/usage",
    headers=HEADERS
)

rows = []
snapshot = {
    "snapshot_date": datetime.utcnow().strftime("%Y-%m-%d"),
    "project_ref": PROJECT_REF,
}

# Parse database health if available
if db_response.status_code == 200:
    db_data = db_response.json()
    snapshot["db_healthy"] = db_data.get("healthy", None)
    snapshot["db_status"] = db_data.get("status", "unknown")

# Parse usage if available
if usage_response.status_code == 200:
    usage_data = usage_response.json()
    # Structure varies by Supabase version -- adapt as needed
    snapshot["db_size_bytes"] = usage_data.get("db_size", 0)
    snapshot["storage_size_bytes"] = usage_data.get("storage_size", 0)
    snapshot["bandwidth_bytes"] = usage_data.get("bandwidth", 0)

rows.append(snapshot)

# -- Write to Unity Catalog table --
df = spark.createDataFrame(rows)
df.write.mode("append").saveAsTable("madebymiles.observability.supabase_health")

print(f"Ingested Supabase health snapshot for {snapshot['snapshot_date']}")
