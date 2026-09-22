# lib

Infra/domain code เฉพาะระบบนี้: `auth.ts`, `api-client.ts`, `format.ts`, `db.ts`

ต่างจาก `utils/` ตรงที่ผูกกับ business rule/infra ของระบบนี้โดยตรง (auth, เรียก backend API,
ฟอร์แมตเงิน/เปอร์เซ็นต์ตาม business rule) — ถ้าแยกไม่ออกว่าควรอยู่ `lib/` หรือ `utils/`
ให้เริ่มที่ `lib/` ก่อน

`db.ts` opens a singleton `pg` connection Pool to the PostgreSQL database at `DB_PRIMARY_DSN`
(guarded by `server-only` — importing it from a Client Component fails the build). Import
`query`/`queryRows`/`queryRow`/`withTransaction` from here in `queries.ts`/`actions.ts`, never
open a second Pool.

`storage.ts` opens a singleton `@google-cloud/storage` client (service-account key file at
`GOOGLE_CERT_PATH` if set, else Application Default Credentials) pointed at the
`GOOGLE_BUCKET_PATH` bucket, also guarded by `server-only`. Receipt images live there; Postgres
only stores the object key (`expense_item_receipts.storage_key`). Import
`uploadReceipt`/`downloadReceipt`/`deleteReceipts` from here, never call `@google-cloud/storage`
directly from route/action code.
