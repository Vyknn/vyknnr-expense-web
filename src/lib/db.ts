import "server-only";
import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { hashPassword } from "@/features/auth/services/password";

const DB_PATH = process.env.DATABASE_PATH
  ? path.resolve(process.env.DATABASE_PATH)
  : path.join(process.cwd(), "src/db/database.sqlite3");
const MIGRATIONS_PATH = path.join(process.cwd(), "src/db/migrations");
const DEFAULT_EXPENSE_CATEGORIES = [
  "อาหาร",
  "การเดินทาง",
  "ที่พัก",
  "อุปกรณ์",
  "สำรองจ่าย",
  "อื่นๆ",
];

function runMigrations(database: Database.Database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  const applied = new Set(
    (database.prepare(`SELECT filename FROM schema_migrations`).all() as {
      filename: string;
    }[]).map((migration) => migration.filename)
  );
  const migrations = fs
    .readdirSync(MIGRATIONS_PATH)
    .filter((filename) => filename.endsWith(".sql"))
    .sort();

  for (const filename of migrations) {
    if (applied.has(filename)) continue;

    const sql = fs.readFileSync(path.join(MIGRATIONS_PATH, filename), "utf8");
    database.transaction(() => {
      database.exec(sql);
      database
        .prepare(`INSERT INTO schema_migrations (filename) VALUES (?)`)
        .run(filename);
    })();
  }
}

function ensureInitialAdmin(database: Database.Database) {
  const userCount = (
    database.prepare(`SELECT COUNT(*) AS count FROM users`).get() as { count: number }
  ).count;
  if (userCount > 0) return;

  const email = process.env.INITIAL_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.INITIAL_ADMIN_PASSWORD;
  if (!email || !password) {
    console.warn(
      "[db] ยังไม่ได้กำหนด INITIAL_ADMIN_EMAIL และ INITIAL_ADMIN_PASSWORD — ข้ามการสร้างบัญชี admin เริ่มต้น (จะไม่มีใคร login ได้จนกว่าจะตั้งค่าตัวแปรนี้และรีสตาร์ท)"
    );
    return;
  }

  database
    .prepare(
      `INSERT INTO users (email, display_name, password_hash, role, must_change_password)
       VALUES (?, ?, ?, 'admin', 0)`
    )
    .run(email, email, hashPassword(password));
}

function migrateExpenseItemCategoryColumn(database: Database.Database) {
  const expenseItemColumns = database
    .prepare(`PRAGMA table_info(expense_items)`)
    .all() as { name: string }[];
  const hasLegacyCategory = expenseItemColumns.some((column) => column.name === "category");
  const hasCategoryId = expenseItemColumns.some((column) => column.name === "category_id");

  if (!hasCategoryId) {
    const legacyCategoryIdExpression = hasLegacyCategory
      ? `(SELECT id FROM expense_categories WHERE name = CASE category
          WHEN 'food' THEN 'อาหาร'
          WHEN 'travel' THEN 'การเดินทาง'
          WHEN 'accommodation' THEN 'ที่พัก'
          WHEN 'supplies' THEN 'อุปกรณ์'
          WHEN 'advance' THEN 'สำรองจ่าย'
          ELSE 'อื่นๆ'
        END)`
      : "NULL";

    database.exec(`
      PRAGMA foreign_keys = OFF;
      BEGIN;
      CREATE TABLE expense_items_replacement (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        round_id INTEGER NOT NULL REFERENCES expense_rounds(id) ON DELETE CASCADE,
        payer_id INTEGER REFERENCES payers(id) ON DELETE SET NULL,
        category_id INTEGER REFERENCES expense_categories(id) ON DELETE SET NULL,
        description TEXT NOT NULL,
        amount_satang INTEGER NOT NULL CHECK (amount_satang > 0),
        expense_date TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      INSERT INTO expense_items_replacement (
        id, round_id, payer_id, category_id, description, amount_satang, expense_date, created_at
      )
      SELECT id, round_id, payer_id, ${legacyCategoryIdExpression}, description, amount_satang, expense_date, created_at
      FROM expense_items;
      DROP TABLE expense_items;
      ALTER TABLE expense_items_replacement RENAME TO expense_items;
      CREATE INDEX idx_expense_items_round ON expense_items(round_id);
      CREATE INDEX idx_expense_items_payer ON expense_items(payer_id);
      COMMIT;
      PRAGMA foreign_keys = ON;
    `);
  }
  database.exec(
    `CREATE INDEX IF NOT EXISTS idx_expense_items_category ON expense_items(category_id)`
  );
}

declare global {
  var __db: Database.Database | undefined;
}

function initDb(): Database.Database {
  if (globalThis.__db) return globalThis.__db;

  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

  const database = new Database(DB_PATH);
  database.pragma("journal_mode = WAL");
  database.pragma("busy_timeout = 5000");
  database.pragma("foreign_keys = ON");
  runMigrations(database);

  database.transaction(() => {
    const insertCategory = database.prepare(
      `INSERT OR IGNORE INTO expense_categories (name) VALUES (?)`
    );
    for (const category of DEFAULT_EXPENSE_CATEGORIES) insertCategory.run(category);
  })();

  migrateExpenseItemCategoryColumn(database);
  ensureInitialAdmin(database);

  globalThis.__db = database;
  return database;
}

export const db: Database.Database = new Proxy({} as Database.Database, {
  get(_target, prop) {
    const instance = initDb();
    const value = Reflect.get(instance, prop, instance);
    return typeof value === "function" ? value.bind(instance) : value;
  },
});
