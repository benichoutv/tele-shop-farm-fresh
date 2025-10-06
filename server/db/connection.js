import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import pg from 'pg';
import path from 'path';

let db = null;

export async function getDb() {
  if (db) return db;

  const dbType = process.env.DB_TYPE || 'sqlite';

  if (dbType === 'postgresql') {
    // PostgreSQL connection
    const pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
    });

    // Wrap pg pool to match sqlite interface
    db = {
      async exec(sql) {
        await pool.query(sql);
      },
      async run(sql, params) {
        const result = await pool.query(sql, params);
        return { lastID: result.rows[0]?.id };
      },
      async get(sql, params) {
        const result = await pool.query(sql, params);
        return result.rows[0];
      },
      async all(sql, params) {
        const result = await pool.query(sql, params);
        return result.rows;
      },
    };
  } else {
    // SQLite connection (default)
    const dbPath = process.env.DB_PATH || path.join(process.cwd(), 'database.sqlite');
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
  }

  return db;
}
