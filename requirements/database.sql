-- Schema source: requirements/database.dbml
-- Applied idempotently by src/lib/db.ts on every connection open.

CREATE TABLE IF NOT EXISTS payers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS expense_rounds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'in_progress'
    CHECK (status IN ('in_progress', 'completed', 'cancelled')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS expense_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  round_id INTEGER NOT NULL REFERENCES expense_rounds(id) ON DELETE CASCADE,
  payer_id INTEGER NOT NULL REFERENCES payers(id),
  description TEXT NOT NULL,
  amount_satang INTEGER NOT NULL CHECK (amount_satang > 0),
  expense_date TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS expense_item_receipts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id INTEGER NOT NULL REFERENCES expense_items(id) ON DELETE CASCADE,
  blob BLOB NOT NULL,
  mime_type TEXT NOT NULL,
  filename TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_expense_items_round ON expense_items(round_id);
CREATE INDEX IF NOT EXISTS idx_expense_items_payer ON expense_items(payer_id);
CREATE INDEX IF NOT EXISTS idx_expense_item_receipts_item ON expense_item_receipts(item_id);
