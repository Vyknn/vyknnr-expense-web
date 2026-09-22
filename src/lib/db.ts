import "server-only";
import fs from "node:fs";
import path from "node:path";
import { Pool, types, type PoolClient, type QueryResult, type QueryResultRow } from "pg";
import { hashPassword } from "@/features/auth/services/password";

const MIGRATIONS_PATH = path.join(process.cwd(), "src/db/migrations");
const DEFAULT_EXPENSE_CATEGORIES = [
  "อาหาร",
  "การเดินทาง",
  "ที่พัก",
  "อุปกรณ์",
  "สำรองจ่าย",
  "อื่นๆ",
];

// เก็บ timestamptz/timestamp เป็น ISO string ดิบแทนการ parse เป็น JS Date — ให้ตรงกับ
// TypeScript types (`string`) เดิมที่โค้ดทั้งระบบใช้อยู่ ในขณะที่ column ยังเป็น native
// timestamptz จริงใน Postgres (index/เทียบกับ now() ได้ตรง ๆ)
types.setTypeParser(types.builtins.TIMESTAMPTZ, (value) => value);
types.setTypeParser(types.builtins.TIMESTAMP, (value) => value);

declare global {
  var __pgPool: Pool | undefined;
  var __pgInit: Promise<void> | undefined;
}

async function runMigrations(client: PoolClient) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  const { rows: appliedRows } = await client.query<{ filename: string }>(
    `SELECT filename FROM schema_migrations`
  );
  const applied = new Set(appliedRows.map((row) => row.filename));
  const migrations = fs
    .readdirSync(MIGRATIONS_PATH)
    .filter((filename) => filename.endsWith(".sql"))
    .sort();

  for (const filename of migrations) {
    if (applied.has(filename)) continue;

    const sql = fs.readFileSync(path.join(MIGRATIONS_PATH, filename), "utf8");
    await client.query("BEGIN");
    try {
      await client.query(sql);
      await client.query(`INSERT INTO schema_migrations (filename) VALUES ($1)`, [filename]);
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  }
}

async function seedDefaultExpenseCategories(client: PoolClient) {
  for (const category of DEFAULT_EXPENSE_CATEGORIES) {
    await client.query(
      `INSERT INTO expense_categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`,
      [category]
    );
  }
}

async function ensureInitialAdmin(client: PoolClient) {
  const { rows } = await client.query<{ count: string }>(`SELECT COUNT(*) AS count FROM users`);
  if (Number(rows[0].count) > 0) return;

  const email = process.env.INITIAL_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.INITIAL_ADMIN_PASSWORD;
  if (!email || !password) {
    console.warn(
      "[db] ยังไม่ได้กำหนด INITIAL_ADMIN_EMAIL และ INITIAL_ADMIN_PASSWORD — ข้ามการสร้างบัญชี admin เริ่มต้น (จะไม่มีใคร login ได้จนกว่าจะตั้งค่าตัวแปรนี้และรีสตาร์ท)"
    );
    return;
  }

  await client.query(
    `INSERT INTO users (email, display_name, password_hash, role, must_change_password)
     VALUES ($1, $2, $3, 'admin', 0)`,
    [email, email, hashPassword(password)]
  );
}

function createPool(): Pool {
  return new Pool({ connectionString: process.env.DB_PRIMARY_DSN });
}

async function initDb(): Promise<void> {
  const client = await getPool().connect();
  try {
    await runMigrations(client);
    await seedDefaultExpenseCategories(client);
    await ensureInitialAdmin(client);
  } finally {
    client.release();
  }
}

function getPool(): Pool {
  if (!globalThis.__pgPool) {
    globalThis.__pgPool = createPool();
  }
  return globalThis.__pgPool;
}

async function ready(): Promise<void> {
  if (!globalThis.__pgInit) {
    globalThis.__pgInit = initDb();
  }
  await globalThis.__pgInit;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  await ready();
  return getPool().query<T>(text, params);
}

export async function queryRows<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  return (await query<T>(text, params)).rows;
}

export async function queryRow<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<T | undefined> {
  return (await query<T>(text, params)).rows[0];
}

// ตัวขั้นต่ำที่ต้องมีเพื่อ "รัน query ผ่าน connection ที่กำหนด" — ทั้ง top-level `query`
// (pool) และ `Transaction.query` (checked-out client ระหว่าง `withTransaction`) มีชนิดตรงกัน
// จุดนี้ ใช้เป็น default parameter ให้ฟังก์ชันใน session.ts เลือกได้ว่าจะรันบน pool เฉย ๆ
// หรือรันร่วม transaction เดียวกับผู้เรียก (สำคัญเพราะ pg ใช้ connection pool — ต่างจาก
// better-sqlite3 ที่มี connection เดียว ทำให้ทุกอย่างอยู่ใน transaction เดียวกันโดยอัตโนมัติ)
export type Executor = {
  query: <T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: unknown[]
  ) => Promise<QueryResult<T>>;
};

export type Transaction = Executor & {
  queryRows: <T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: unknown[]
  ) => Promise<T[]>;
  queryRow: <T extends QueryResultRow = QueryResultRow>(
    text: string,
    params?: unknown[]
  ) => Promise<T | undefined>;
};

export async function withTransaction<T>(fn: (tx: Transaction) => Promise<T>): Promise<T> {
  await ready();
  const client = await getPool().connect();
  const tx: Transaction = {
    query: (text, params) => client.query(text, params),
    queryRows: async (text, params) => (await client.query(text, params)).rows,
    queryRow: async (text, params) => (await client.query(text, params)).rows[0],
  };

  try {
    await client.query("BEGIN");
    const result = await fn(tx);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
