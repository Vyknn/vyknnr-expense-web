import type { Role } from "@/types/role";

type NavigationChild = {
  href: string;
  label: string;
};

type NavigationItem = {
  href: string;
  label: string;
  roles: readonly Role[];
  children?: readonly NavigationChild[];
};

const navigationItems: readonly NavigationItem[] = [
  { href: "/", label: "หน้าหลัก", roles: ["admin", "editor", "viewer"] },
  {
    href: "/settings",
    label: "ตั้งค่า",
    roles: ["admin"],
    children: [
      { href: "/settings/payers", label: "ผู้จ่าย/ผู้สำรอง" },
      { href: "/settings/categories", label: "ประเภทค่าใช้จ่าย" },
      { href: "/settings/members", label: "สมาชิก" },
    ],
  },
];

export function getNavigationItems(role: Role) {
  return navigationItems.filter((item) => item.roles.includes(role));
}
