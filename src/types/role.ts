export const ROLES = ["admin", "editor", "viewer"] as const;

export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  admin: "ผู้ดูแลระบบ",
  editor: "ผู้แก้ไข",
  viewer: "ผู้ดูข้อมูล",
};

export function isRole(value: string): value is Role {
  return ROLES.includes(value as Role);
}

export function canManageExpenses(role: Role) {
  return role === "admin" || role === "editor";
}

export function canManageSettings(role: Role) {
  return role === "admin";
}
