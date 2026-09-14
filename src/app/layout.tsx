import type { Metadata } from "next";
import { getCurrentUser } from "@/features/auth/services/auth";
import { RootLayout } from "@/components/layouts/RootLayout";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "ระบบเบิก-จ่ายค่าใช้จ่าย",
  description: "บันทึกและสรุปยอดค่าใช้จ่ายรายรอบ พร้อมแนบบิล/สลิป",
};

export default async function Layout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();
  return <RootLayout user={user}>{children}</RootLayout>;
}
