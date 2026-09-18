import "server-only";
import { db } from "@/lib/db";
import { requireUser } from "@/features/auth/services/auth";

export type SettingsOverviewCounts = {
  payerCount: number;
  categoryCount: number;
  memberCount: number;
};

export async function getSettingsOverviewCounts(): Promise<SettingsOverviewCounts> {
  await requireUser();
  const payerCount = (db.prepare(`SELECT COUNT(*) AS count FROM payers`).get() as { count: number }).count;
  const categoryCount = (db.prepare(`SELECT COUNT(*) AS count FROM expense_categories`).get() as { count: number }).count;
  const memberCount = (db.prepare(`SELECT COUNT(*) AS count FROM users`).get() as { count: number }).count;
  return { payerCount, categoryCount, memberCount };
}
