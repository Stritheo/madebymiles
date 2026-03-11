# Databricks notebook: Ingest Supabase project health metrics
# Schedule: Daily
# Requires: Unity Catalog connection 'supabase_api' (run setup_connections.py first)

import json
from datetime import datetime

# -- Config --
dbutils.widgets.text("SUPABASE_PROJECT_REF", "", "Supabase Project Ref")
PROJECT_REF = dbutils.widgets.get("SUPABASE_PROJECT_REF")
if not PROJECT_REF:
    raise ValueError("Please provide SUPABASE_PROJECT_REF via the widget at the top")

# -- Fetch project health --
db_result = spark.sql(f"""
SELECT http_request(
  conn => 'supabase_api',
  method => 'GET',
  path => '/v1/projects/{PROJECT_REF}/database/health'
)
""").collect()[0][0]

usage_result = spark.sql(f"""
SELECT http_request(
  conn => 'supabase_api',
  method => 'GET',
  path => '/v1/projects/{PROJECT_REF}/usage'
)
""").collect()[0][0]

snapshot = {
    "snapshot_date": datetime.utcnow().strftime("%Y-%m-%d"),
    "project_ref": PROJECT_REF,
}

db_data = json.loads(db_result.text)
snapshot["db_healthy"] = db_data.get("healthy", None)
snapshot["db_status"] = db_data.get("status", "unknown")

usage_data = json.loads(usage_result.text)
snapshot["db_size_bytes"] = usage_data.get("db_size", 0)
snapshot["storage_size_bytes"] = usage_data.get("storage_size", 0)
snapshot["bandwidth_bytes"] = usage_data.get("bandwidth", 0)

# -- Write to Unity Catalog table --
df = spark.createDataFrame([snapshot])
df.write.mode("append").saveAsTable("madebymiles.observability.supabase_health")

print(f"Ingested Supabase health snapshot for {snapshot['snapshot_date']}")
