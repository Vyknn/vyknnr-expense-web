"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole, requireUser } from "@/features/auth/services/auth";
import { hashPassword } from "@/features/auth/services/password";
import { revokeUserSessions } from "@/features/auth/services/session";
import { isRole, type Role } from "@/types/role";

type MemberRoleRow = {
  role: Role;
  isActive: number;
};

export type MemberActionState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success" };

const MIN_TEMP_PASSWORD_LENGTH = 12;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseMemberId(formData: FormData): number | null {
  const id = Number(formData.get("memberId"));
  return Number.isInteger(id) && id > 0 ? id : null;
}

function parseDisplayName(formData: FormData): string | null {
  const name = String(formData.get("displayName") ?? "").trim();
  return name || null;
}

function parseEmail(formData: FormData): string | null {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  return EMAIL_PATTERN.test(email) ? email : null;
}

function parseRole(formData: FormData): Role | null {
  const role = String(formData.get("role") ?? "");
  return isRole(role) ? role : null;
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Error &&
    "code" in error &&
    error.code === "SQLITE_CONSTRAINT_UNIQUE"
  );
}

function revalidateMemberRoutes() {
  revalidatePath("/settings/members");
}

function hasAnotherActiveAdmin(memberId: number) {
  const result = db
    .prepare(
      `SELECT COUNT(*) AS count
       FROM users
       WHERE role = 'admin' AND is_active = 1 AND id != ?`
    )
    .get(memberId) as { count: number };

  return result.count > 0;
}

function getMemberRole(memberId: number): MemberRoleRow | undefined {
  return db
    .prepare(`SELECT role, is_active AS isActive FROM users WHERE id = ?`)
    .get(memberId) as MemberRoleRow | undefined;
}

export async function createMember(
  _prevState: MemberActionState,
  formData: FormData
): Promise<MemberActionState> {
  requireRole(await requireUser(), "admin");

  const displayName = parseDisplayName(formData);
  const email = parseEmail(formData);
  const role = parseRole(formData);
  const tempPassword = String(formData.get("tempPassword") ?? "");

  if (!displayName) {
    return { status: "error", message: "กรุณาระบุชื่อสมาชิก" };
  }
  if (!email) {
    return { status: "error", message: "กรุณาระบุอีเมลให้ถูกต้อง" };
  }
  if (!role) {
    return { status: "error", message: "กรุณาเลือกสิทธิ์การใช้งาน" };
  }
  if (tempPassword.length < MIN_TEMP_PASSWORD_LENGTH) {
    return {
      status: "error",
      message: `รหัสผ่านชั่วคราวต้องมีอย่างน้อย ${MIN_TEMP_PASSWORD_LENGTH} ตัวอักษร`,
    };
  }

  try {
    db.prepare(
      `INSERT INTO users (email, display_name, password_hash, role, must_change_password, is_active)
       VALUES (?, ?, ?, ?, 1, 1)`
    ).run(email, displayName, hashPassword(tempPassword), role);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { status: "error", message: "มีอีเมลนี้ในระบบแล้ว" };
    }
    throw error;
  }

  revalidateMemberRoutes();
  return { status: "success" };
}

export async function updateMemberRole(
  _prevState: MemberActionState,
  formData: FormData
): Promise<MemberActionState> {
  const currentUser = await requireUser();
  requireRole(currentUser, "admin");

  const memberId = parseMemberId(formData);
  const role = parseRole(formData);

  if (!memberId) {
    return { status: "error", message: "ไม่พบสมาชิกที่ต้องการแก้ไข" };
  }
  if (!role) {
    return { status: "error", message: "กรุณาเลือกสิทธิ์การใช้งาน" };
  }
  if (memberId === currentUser.id) {
    return { status: "error", message: "ไม่สามารถเปลี่ยนสิทธิ์ของตนเองได้" };
  }

  const state = db.transaction((): MemberActionState => {
    const member = getMemberRole(memberId);
    if (!member) {
      return { status: "error", message: "ไม่พบสมาชิกที่ต้องการแก้ไข" };
    }
    if (
      member.role === "admin" &&
      member.isActive === 1 &&
      role !== "admin" &&
      !hasAnotherActiveAdmin(memberId)
    ) {
      return {
        status: "error",
        message: "ต้องมีผู้ดูแลระบบที่ใช้งานอยู่เสมออย่างน้อยหนึ่งบัญชี",
      };
    }

    db.prepare(`UPDATE users SET role = ?, updated_at = datetime('now') WHERE id = ?`).run(
      role,
      memberId
    );
    revokeUserSessions(memberId);
    return { status: "success" };
  })();

  if (state.status === "success") revalidateMemberRoutes();
  return state;
}

export async function updateMemberStatus(
  _prevState: MemberActionState,
  formData: FormData
): Promise<MemberActionState> {
  const currentUser = await requireUser();
  requireRole(currentUser, "admin");

  const memberId = parseMemberId(formData);
  const isActiveValue = String(formData.get("isActive") ?? "");
  if (isActiveValue !== "0" && isActiveValue !== "1") {
    return { status: "error", message: "สถานะสมาชิกไม่ถูกต้อง" };
  }
  const nextIsActive = isActiveValue === "1";

  if (!memberId) {
    return { status: "error", message: "ไม่พบสมาชิกที่ต้องการแก้ไข" };
  }
  if (memberId === currentUser.id && !nextIsActive) {
    return { status: "error", message: "ไม่สามารถปิดใช้งานบัญชีของตนเองได้" };
  }

  const state = db.transaction((): MemberActionState => {
    const member = getMemberRole(memberId);
    if (!member) {
      return { status: "error", message: "ไม่พบสมาชิกที่ต้องการแก้ไข" };
    }
    if (
      !nextIsActive &&
      member.role === "admin" &&
      member.isActive === 1 &&
      !hasAnotherActiveAdmin(memberId)
    ) {
      return {
        status: "error",
        message: "ต้องมีผู้ดูแลระบบที่ใช้งานอยู่เสมออย่างน้อยหนึ่งบัญชี",
      };
    }

    db.prepare(`UPDATE users SET is_active = ?, updated_at = datetime('now') WHERE id = ?`).run(
      nextIsActive ? 1 : 0,
      memberId
    );
    revokeUserSessions(memberId);
    return { status: "success" };
  })();

  if (state.status === "success") revalidateMemberRoutes();
  return state;
}
