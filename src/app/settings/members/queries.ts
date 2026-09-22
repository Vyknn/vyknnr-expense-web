import "server-only";
import { requireRole, requireUser } from "@/features/auth/services/auth";
import { queryRows } from "@/lib/db";
import type { Role } from "@/types/role";

export type MemberSummary = {
  id: number;
  email: string;
  displayName: string;
  role: Role;
  isActive: boolean;
  mustChangePassword: boolean;
  createdAt: string;
};

type MemberRow = {
  id: number;
  email: string;
  displayName: string;
  role: Role;
  isActive: number;
  mustChangePassword: number;
  createdAt: string;
};

export async function getAllMembers(): Promise<MemberSummary[]> {
  requireRole(await requireUser(), "admin");
  const rows = await queryRows<MemberRow>(
    `SELECT
       id,
       email,
       display_name AS "displayName",
       role,
       is_active AS "isActive",
       must_change_password AS "mustChangePassword",
       created_at AS "createdAt"
     FROM users
     ORDER BY LOWER(display_name) ASC`
  );

  return rows.map((row) => ({
    id: row.id,
    email: row.email,
    displayName: row.displayName,
    role: row.role,
    isActive: Boolean(row.isActive),
    mustChangePassword: Boolean(row.mustChangePassword),
    createdAt: row.createdAt,
  }));
}
