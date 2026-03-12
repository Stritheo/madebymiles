# Databricks notebook: Gold layer views for the dashboard
# Reads from silver, creates aggregated views/tables for dashboard panels
# Schedule: Daily (runs after silver transforms)

# ============================================================
# 1. Deploy summary (Deployment tab)
# ============================================================
spark.sql("""
CREATE OR REPLACE TABLE madebymiles.gold.deploy_summary AS
SELECT
  date_trunc('week', created_ts) AS week,
  COUNT(*) AS total_runs,
  SUM(CASE WHEN conclusion = 'success' THEN 1 ELSE 0 END) AS succeeded,
  SUM(CASE WHEN conclusion = 'failure' THEN 1 ELSE 0 END) AS failed,
  SUM(CASE WHEN conclusion = 'cancelled' THEN 1 ELSE 0 END) AS cancelled,
  ROUND(SUM(CASE WHEN conclusion = 'success' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) AS success_rate_pct,
  ROUND(AVG(duration_seconds), 0) AS avg_duration_seconds,
  ROUND(AVG(CASE WHEN conclusion = 'success' THEN duration_seconds END), 0) AS avg_success_duration_seconds
FROM madebymiles.silver.github_actions_runs
WHERE conclusion IS NOT NULL
GROUP BY date_trunc('week', created_ts)
ORDER BY week DESC
""")
print("Gold: deploy_summary created")

# ============================================================
# 2. Traffic daily (Search/Traffic tab)
# ============================================================
spark.sql("""
CREATE OR REPLACE TABLE madebymiles.gold.traffic_daily AS
SELECT
  date,
  unique_visitors,
  page_views,
  requests,
  cached_requests,
  cache_hit_rate,
  threats,
  bytes,
  ROUND(bytes / 1024.0 / 1024.0, 2) AS bandwidth_mb
FROM madebymiles.silver.cloudflare_analytics
ORDER BY date DESC
""")
print("Gold: traffic_daily created")

# ============================================================
# 3. Sentry summary (Security tab)
# ============================================================
spark.sql("""
CREATE OR REPLACE TABLE madebymiles.gold.sentry_summary AS
SELECT
  level,
  status,
  COUNT(*) AS issue_count,
  SUM(count) AS total_events,
  MIN(first_seen_ts) AS earliest_issue,
  MAX(last_seen_ts) AS latest_issue
FROM madebymiles.silver.sentry_issues
GROUP BY level, status
ORDER BY total_events DESC
""")
print("Gold: sentry_summary created")

# Top issues detail
spark.sql("""
CREATE OR REPLACE TABLE madebymiles.gold.sentry_top_issues AS
SELECT
  issue_id, title, culprit, level, status, count,
  first_seen_ts, last_seen_ts, permalink
FROM madebymiles.silver.sentry_issues
ORDER BY count DESC
LIMIT 20
""")
print("Gold: sentry_top_issues created")

# ============================================================
# 4. Lighthouse trend (Performance tab)
# ============================================================
spark.sql("""
CREATE OR REPLACE TABLE madebymiles.gold.lighthouse_trend AS
SELECT
  run_date,
  url,
  performance,
  accessibility,
  best_practices,
  seo,
  fcp_ms,
  tti_ms,
  ROUND(total_bytes / 1024.0, 1) AS total_kb
FROM madebymiles.silver.lighthouse_scores
ORDER BY run_date DESC, url
""")
print("Gold: lighthouse_trend created")

# ============================================================
# 5. Weekly metrics snapshot (for GenAI report)
# ============================================================
spark.sql("""
CREATE OR REPLACE TABLE madebymiles.gold.weekly_metrics AS
SELECT
  'deploy' AS source,
  CAST(COUNT(*) AS STRING) AS metric_value,
  'total_runs_14d' AS metric_name
FROM madebymiles.silver.github_actions_runs

UNION ALL

SELECT
  'deploy',
  CAST(ROUND(SUM(CASE WHEN conclusion = 'success' THEN 1 ELSE 0 END) * 100.0 / GREATEST(COUNT(*), 1), 1) AS STRING),
  'success_rate_pct'
FROM madebymiles.silver.github_actions_runs
WHERE conclusion IS NOT NULL

UNION ALL

SELECT
  'traffic',
  CAST(SUM(unique_visitors) AS STRING),
  'total_visitors_14d'
FROM madebymiles.silver.cloudflare_analytics

UNION ALL

SELECT
  'traffic',
  CAST(SUM(page_views) AS STRING),
  'total_page_views_14d'
FROM madebymiles.silver.cloudflare_analytics

UNION ALL

SELECT
  'traffic',
  CAST(ROUND(AVG(cache_hit_rate), 1) AS STRING),
  'avg_cache_hit_rate'
FROM madebymiles.silver.cloudflare_analytics

UNION ALL

SELECT
  'security',
  CAST(SUM(threats) AS STRING),
  'threats_blocked_14d'
FROM madebymiles.silver.cloudflare_analytics

UNION ALL

SELECT
  'security',
  CAST(COUNT(*) AS STRING),
  'sentry_issues_count'
FROM madebymiles.silver.sentry_issues
""")
print("Gold: weekly_metrics created")

print("Gold layer complete. Dashboard views ready.")
