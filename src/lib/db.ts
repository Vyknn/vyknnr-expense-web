import "server-only";
import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

const DB_PATH = path.join(process.cwd(), "src/db/database.sqlite3");
const SCHEMA_PATH = path.join(process.cwd(), "requirements/database.sql");

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

export const db = new Database(DB_PATH);
db.pragma("foreign_keys = ON");
db.exec(fs.readFileSync(SCHEMA_PATH, "utf-8"));
