# lib

Infra/domain code เฉพาะระบบนี้: `auth.ts`, `api-client.ts`, `format.ts`, `db.ts`

ต่างจาก `utils/` ตรงที่ผูกกับ business rule/infra ของระบบนี้โดยตรง (auth, เรียก backend API,
ฟอร์แมตเงิน/เปอร์เซ็นต์ตาม business rule) — ถ้าแยกไม่ออกว่าควรอยู่ `lib/` หรือ `utils/`
ให้เริ่มที่ `lib/` ก่อน

`db.ts` opens a singleton `better-sqlite3` connection to `src/db/database.sqlite3` (guarded by
`server-only` — importing it from a Client Component fails the build instead of shipping the
native binding to the browser). Import `{ db }` from here in `queries.ts`/`actions.ts`, never
open a second connection.
