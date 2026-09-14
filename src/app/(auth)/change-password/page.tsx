import { ChangePasswordForm } from "./ChangePasswordForm";
import { requireUser } from "@/features/auth/services/auth";

export default async function ChangePasswordPage() {
  const user = await requireUser({ allowPasswordChange: true });

  return (
    <section className="mx-auto flex w-full max-w-md flex-1 items-center px-4 py-8">
      <div className="w-full rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <p className="text-xs font-semibold tracking-[0.12em] text-primary uppercase">Expense Desk</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">เปลี่ยนรหัสผ่าน</h1>
        <p className="mt-2 text-sm text-muted">{user.mustChangePassword ? "กรุณาเปลี่ยนรหัสผ่านชั่วคราวก่อนใช้งาน" : "ตั้งรหัสผ่านใหม่เพื่อความปลอดภัย"}</p>
        <ChangePasswordForm />
      </div>
    </section>
  );
}
