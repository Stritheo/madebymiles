/**
 * Post non-critical events to Databricks for historical analysis.
 * Uses the SQL Statement API to INSERT into madebymiles.observability.alert_events.
 *
 * You must create this table in Databricks first:
 *   CREATE TABLE IF NOT EXISTS madebymiles.observability.alert_events (
 *     source STRING,
 *     severity STRING,
 *     title STRING,
 *     message STRING,
 *     metadata STRING,
 *     created_at STRING
 *   );
 */
export async function postToDatabricks(
  host: string,
  token: string,
  warehouseId: string,
  event: {
    source: string;
    severity: string;
    title: string;
    message: string;
    metadata?: Record<string, unknown>;
  },
): Promise<void> {
  if (!host || !token || !warehouseId) return;

  const now = new Date().toISOString();
  const metadataJson = event.metadata ? JSON.stringify(event.metadata) : '{}';

  // Escape single quotes for SQL
  const esc = (s: string) => s.replace(/'/g, "''");

  const sql = `INSERT INTO madebymiles.observability.alert_events (source, severity, title, message, metadata, created_at) VALUES ('${esc(event.source)}', '${esc(event.severity)}', '${esc(event.title)}', '${esc(event.message.slice(0, 4000))}', '${esc(metadataJson)}', '${now}')`;

  try {
    await fetch(`${host}/api/2.0/sql/statements`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        statement: sql,
        warehouse_id: warehouseId,
        wait_timeout: '10s',
      }),
    });
  } catch {
    // Databricks ingestion failure should not break the response
  }
}
