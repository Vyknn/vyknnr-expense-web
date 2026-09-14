import { redirect } from "next/navigation";
import { getCurrentUser, isSafeInternalPath } from "@/features/auth/services/auth";
import { LoginForm } from "./LoginForm";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const user = await getCurrentUser();
  if (user) redirect(user.mustChangePassword ? "/change-password" : "/");

  const { next: nextParam } = await searchParams;
  const next = typeof nextParam === "string" && isSafeInternalPath(nextParam) ? nextParam : "/";

  return (
    <section className="mx-auto flex w-full max-w-md flex-1 items-center px-4 py-8">
      <div className="w-full rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <p className="text-xs font-semibold tracking-[0.12em] text-primary uppercase">Expense Desk</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">เข้าสู่ระบบ</h1>
        <p className="mt-2 text-sm text-muted">ใช้บัญชีที่ผู้ดูแลระบบสร้างให้</p>
        <LoginForm next={next} />
      </div>
    </section>
  );
}
