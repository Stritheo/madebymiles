# Databricks notebook: Silver layer transformations
# Reads from bronze, writes cleaned/typed data to silver
# Schedule: Daily (runs after all ingestion notebooks)

from pyspark.sql import functions as F
from pyspark.sql.types import TimestampType, DateType, IntegerType, LongType, DoubleType

ingested_at = F.current_timestamp()

# ============================================================
# 1. GitHub Actions runs
# ============================================================
try:
    gh = spark.table("madebymiles.bronze.github_actions_runs")
    gh_silver = (
        gh
        .dropDuplicates(["run_id"])
        .withColumn("created_ts", F.to_timestamp("created_at"))
        .withColumn("updated_ts", F.to_timestamp("updated_at"))
        .withColumn("started_ts", F.to_timestamp("run_started_at"))
        .withColumn("duration_seconds",
            F.unix_timestamp("updated_ts") - F.unix_timestamp("started_ts"))
        .withColumn("ingested_at", ingested_at)
        .select(
            F.col("run_id").cast(LongType()),
            "name", "status", "conclusion",
            "created_ts", "updated_ts", "started_ts",
            "duration_seconds",
            "head_sha", "actor", "event",
            F.col("run_attempt").cast(IntegerType()),
            "html_url", "ingested_at"
        )
    )
    gh_silver.write.mode("overwrite").option("overwriteSchema", "true").saveAsTable("madebymiles.silver.github_actions_runs")
    print(f"Silver: {gh_silver.count()} GitHub Actions runs")
except Exception as e:
    print(f"Silver github_actions_runs skipped: {e}")

# ============================================================
# 2. Cloudflare analytics
# ============================================================
try:
    cf = spark.table("madebymiles.bronze.cloudflare_analytics")
    cf_silver = (
        cf
        .dropDuplicates(["date"])
        .withColumn("date", F.to_date("date"))
        .withColumn("requests", F.col("requests").cast(LongType()))
        .withColumn("cached_requests", F.col("cached_requests").cast(LongType()))
        .withColumn("bytes", F.col("bytes").cast(LongType()))
        .withColumn("cached_bytes", F.col("cached_bytes").cast(LongType()))
        .withColumn("threats", F.col("threats").cast(LongType()))
        .withColumn("page_views", F.col("page_views").cast(LongType()))
        .withColumn("unique_visitors", F.col("unique_visitors").cast(LongType()))
        .withColumn("cache_hit_rate", F.col("cache_hit_rate").cast(DoubleType()))
        .withColumn("ingested_at", ingested_at)
    )
    cf_silver.write.mode("overwrite").option("overwriteSchema", "true").saveAsTable("madebymiles.silver.cloudflare_analytics")
    print(f"Silver: {cf_silver.count()} Cloudflare analytics days")
except Exception as e:
    print(f"Silver cloudflare_analytics skipped: {e}")

# ============================================================
# 3. Sentry issues
# ============================================================
try:
    sn = spark.table("madebymiles.bronze.sentry_issues")
    sn_silver = (
        sn
        .dropDuplicates(["issue_id"])
        .withColumn("first_seen_ts", F.to_timestamp("first_seen"))
        .withColumn("last_seen_ts", F.to_timestamp("last_seen"))
        .withColumn("count", F.col("count").cast(IntegerType()))
        .withColumn("ingested_at", ingested_at)
        .select(
            "issue_id", "title", "culprit", "level", "status",
            "count", "first_seen_ts", "last_seen_ts",
            "type", "platform", "permalink", "ingested_at"
        )
    )
    sn_silver.write.mode("overwrite").option("overwriteSchema", "true").saveAsTable("madebymiles.silver.sentry_issues")
    print(f"Silver: {sn_silver.count()} Sentry issues")
except Exception as e:
    print(f"Silver sentry_issues skipped: {e}")

# ============================================================
# 4. Lighthouse scores
# ============================================================
try:
    lh = spark.table("madebymiles.bronze.lighthouse_scores")
    lh_silver = (
        lh
        .dropDuplicates(["run_id", "url"])
        .withColumn("run_date_ts", F.to_timestamp("run_date"))
        .withColumn("run_date", F.to_date("run_date"))
        .withColumn("run_id", F.col("run_id").cast(LongType()))
        .withColumn("performance", F.col("performance").cast(IntegerType()))
        .withColumn("accessibility", F.col("accessibility").cast(IntegerType()))
        .withColumn("best_practices", F.col("best_practices").cast(IntegerType()))
        .withColumn("seo", F.col("seo").cast(IntegerType()))
        .withColumn("fcp_ms", F.col("fcp_ms").cast(DoubleType()))
        .withColumn("tti_ms", F.col("tti_ms").cast(DoubleType()))
        .withColumn("total_bytes", F.col("total_bytes").cast(DoubleType()))
        .withColumn("ingested_at", ingested_at)
        .select(
            "run_id", "run_date", "run_date_ts", "url",
            "performance", "accessibility", "best_practices", "seo",
            "fcp_ms", "tti_ms", "total_bytes", "ingested_at"
        )
    )
    lh_silver.write.mode("overwrite").option("overwriteSchema", "true").saveAsTable("madebymiles.silver.lighthouse_scores")
    print(f"Silver: {lh_silver.count()} Lighthouse scores")
except Exception as e:
    print(f"Silver lighthouse_scores skipped: {e}")

print("Silver transforms complete")
