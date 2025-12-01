// src/lib/db.ts
import { Pool } from "pg";

const pool = new Pool({
  user: process.env.DB_USER || "bbimasheep",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "rag_demo",
  port: parseInt(process.env.DB_PORT || "5432"),
  // password: process.env.DB_PASSWORD,
});

export default pool;
