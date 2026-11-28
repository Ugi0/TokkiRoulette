import pg from "pg";

const { Pool } = pg;

if (!process.env.POSTGRES_USER) {
  throw new Error("POSTGRES_USER environment variable is not set");
}

if (!process.env.POSTGRES_PASSWORD) {
  throw new Error("POSTGRES_PASSWORD environment variable is not set");
}

if (!process.env.POSTGRES_DB) {
  throw new Error("POSTGRES_DB environment variable is not set");
}

const host = process.env.POSTGRES_HOST ?? "database";

const db = new Pool({
  connectionString: `postgresql://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@${host}:5432/${process.env.POSTGRES_DB}`,
});

/** Anything that can run a query: the pool itself, or a client checked out for a transaction. */
export type Queryable = Pick<pg.PoolClient, "query">;

/**
 * Runs `fn` inside a transaction on a single pooled client.
 * (Running BEGIN/COMMIT through `db.query` does not work: each call may use a different connection.)
 */
export async function withTransaction<T>(fn: (client: pg.PoolClient) => Promise<T>): Promise<T> {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

export default db;
