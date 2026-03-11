# Databricks notebook: One-time setup -- Create Unity Catalog connections
# Run this ONCE to store all API credentials securely.
# After running, the ingestion notebooks can use these connections
# for both manual and scheduled (unattended) runs.

# ----- GitHub API -----
# Token: github.com > Settings > Developer settings > Personal access tokens > Fine-grained
# Repository: Stritheo/madebymiles
# Permissions: Actions (read), Contents (read)
spark.sql("""
CREATE CONNECTION IF NOT EXISTS github_api
TYPE HTTP
OPTIONS (
  host = 'https://api.github.com',
  bearer_token = 'PASTE_YOUR_GITHUB_TOKEN_HERE'
)
""")
print("github_api connection created")

# ----- Cloudflare API -----
# Token: dash.cloudflare.com > My Profile > API Tokens > Create Token > "Read analytics"
# Zone ID: dash.cloudflare.com > madebymiles.ai > Overview > right sidebar
spark.sql("""
CREATE CONNECTION IF NOT EXISTS cloudflare_api
TYPE HTTP
OPTIONS (
  host = 'https://api.cloudflare.com',
  bearer_token = 'PASTE_YOUR_CLOUDFLARE_TOKEN_HERE'
)
""")
print("cloudflare_api connection created")

# ----- Sentry API -----
# Token: sentry.io > Settings > Auth Tokens > Create
spark.sql("""
CREATE CONNECTION IF NOT EXISTS sentry_api
TYPE HTTP
OPTIONS (
  host = 'https://sentry.io',
  bearer_token = 'PASTE_YOUR_SENTRY_TOKEN_HERE'
)
""")
print("sentry_api connection created")

# ----- Supabase Management API -----
# Token: supabase.com > Account > Access Tokens
spark.sql("""
CREATE CONNECTION IF NOT EXISTS supabase_api
TYPE HTTP
OPTIONS (
  host = 'https://api.supabase.com',
  bearer_token = 'PASTE_YOUR_SUPABASE_TOKEN_HERE'
)
""")
print("supabase_api connection created")

print("\nAll connections created. You can now run the ingestion notebooks.")
print("To update a token later, DROP the connection and re-create it:")
print("  DROP CONNECTION github_api;")
print("  CREATE CONNECTION github_api TYPE HTTP OPTIONS (...)")
