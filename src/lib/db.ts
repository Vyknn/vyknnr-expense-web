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
    throw new Error(
      "กรุณากำหนด INITIAL_ADMIN_EMAIL และ INITIAL_ADMIN_PASSWORD ก่อนเริ่มระบบครั้งแรก"
    );
  }

  database
    .prepare(
      `INSERT INTO users (email, display_name, password_hash, role, must_change_password)
       VALUES (?, ?, ?, 'admin', 0)`
    )
    .run(email, email, hashPassword(password));
}

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

export const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("busy_timeout = 5000");
db.pragma("foreign_keys = ON");
runMigrations(db);

db.transaction(() => {
  const insertCategory = db.prepare(
    `INSERT OR IGNORE INTO expense_categories (name) VALUES (?)`
  );
  for (const category of DEFAULT_EXPENSE_CATEGORIES) insertCategory.run(category);
})();

const expenseItemColumns = db
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

  db.exec(`
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
db.exec(`CREATE INDEX IF NOT EXISTS idx_expense_items_category ON expense_items(category_id)`);

ensureInitialAdmin(db);
