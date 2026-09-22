import "server-only";
import { queryRow } from "@/lib/db";
import { requireUser } from "@/features/auth/services/auth";

export type SettingsOverviewCounts = {
  payerCount: number;
  categoryCount: number;
  memberCount: number;
};

export async function getSettingsOverviewCounts(): Promise<SettingsOverviewCounts> {
  await requireUser();
  const payerCount = (await queryRow<{ count: string }>(`SELECT COUNT(*) AS count FROM payers`))!;
  const categoryCount = (await queryRow<{ count: string }>(
    `SELECT COUNT(*) AS count FROM expense_categories`
  ))!;
  const memberCount = (await queryRow<{ count: string }>(`SELECT COUNT(*) AS count FROM users`))!;
  return {
    payerCount: Number(payerCount.count),
    categoryCount: Number(categoryCount.count),
    memberCount: Number(memberCount.count),
  };
}
