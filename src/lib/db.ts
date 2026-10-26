import { Pool, types } from "pg";
import { env } from "../config/env";

const pool = new Pool({
  connectionString: env.databaseUrl,
  ssl: env.nodeEnv === "production" ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

types.setTypeParser(types.builtins.NUMERIC, (value) => parseFloat(value));

// Test connection on startup
pool.connect((err, client, release) => {
  if (err) {
    console.error("Database connection failed:", err.message);
    process.exit(1);
  }
  console.log("Connected to PostgreSQL");
  release();
});

export default pool;
