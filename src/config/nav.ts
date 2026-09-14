import type { Role } from "@/types/role";

type NavigationItem = {
  href: string;
  label: string;
  roles: readonly Role[];
};

const navigationItems: readonly NavigationItem[] = [
  { href: "/", label: "หน้าหลัก", roles: ["admin", "editor", "viewer"] },
  { href: "/settings", label: "ตั้งค่า", roles: ["admin"] },
  { href: "/settings/members", label: "สมาชิก", roles: ["admin"] },
];

export function getNavigationItems(role: Role) {
  return navigationItems.filter((item) => item.roles.includes(role));
}
