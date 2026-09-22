ALTER TABLE expense_item_receipts
  ADD COLUMN storage_key TEXT NOT NULL DEFAULT '',
  DROP COLUMN blob;

ALTER TABLE expense_item_receipts ALTER COLUMN storage_key DROP DEFAULT;
