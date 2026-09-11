import type { Metadata } from "next";
import { RootLayout } from "@/components/layouts/RootLayout";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "ระบบเบิก-จ่ายค่าใช้จ่าย",
  description: "บันทึกและสรุปยอดค่าใช้จ่ายรายรอบ พร้อมแนบบิล/สลิป",
};

export default function Layout({ children }: LayoutProps<"/">) {
  return <RootLayout>{children}</RootLayout>;
}
