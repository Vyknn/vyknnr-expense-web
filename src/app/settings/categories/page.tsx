import { IconInbox } from "@tabler/icons-react";
import { CreateCategoryModal } from "./CreateCategoryModal";
import { DeleteCategoryButton } from "./DeleteCategoryButton";
import { EditCategoryModal } from "./EditCategoryModal";
import { requireRole, requireUser } from "@/features/auth/services/auth";
import { getAllExpenseCategoriesWithUsage, type ExpenseCategoryWithUsage } from "./queries";

export default async function CategoriesSettingsPage() {
  requireRole(await requireUser(), "admin");
  const categories = await getAllExpenseCategoriesWithUsage();

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-7xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[0.12em] text-primary uppercase">Administration</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">ประเภทค่าใช้จ่าย</h1>
          <p className="mt-2 text-sm text-muted">หมวดหมู่ที่ใช้จัดกลุ่มรายการค่าใช้จ่าย</p>
        </div>
        <CreateCategoryModal />
      </header>

      <section aria-label="รายชื่อประเภทค่าใช้จ่าย" className="min-w-0 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b border-border px-3 py-1.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold">ประเภทค่าใช้จ่าย</h2>
            <span className="rounded-full bg-muted-surface px-2 py-0.5 text-xs font-medium text-muted">{categories.length}</span>
          </div>
        </div>
        {categories.length === 0 ? (
          <EmptyState text="ยังไม่มีประเภทค่าใช้จ่าย รายการใหม่จะบันทึกเป็นไม่ระบุประเภท" />
        ) : (
          <CategoryList categories={categories} />
        )}
      </section>
    </div>
  );
}

function CategoryList({ categories }: { categories: ExpenseCategoryWithUsage[] }) {
  return (
    <>
      <ul className="flex flex-col gap-3 p-3 md:hidden">
        {categories.map((category) => (
          <li key={category.id} className="flex items-center justify-between gap-3 rounded-xl border border-border p-4">
            <div>
              <p className="font-semibold">{category.name}</p>
              <p className="mt-1 text-sm text-muted">ใช้ใน {category.itemCount} รายการ</p>
            </div>
            <div className="flex shrink-0 items-center">
              <EditCategoryModal category={category} />
              <DeleteCategoryButton categoryId={category.id} categoryName={category.name} />
            </div>
          </li>
        ))}
      </ul>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="border-b border-border bg-muted-surface text-left text-muted">
              <th className="px-5 py-3 text-xs font-semibold tracking-wide uppercase">ประเภทค่าใช้จ่าย</th>
              <th className="px-5 py-3 text-right text-xs font-semibold tracking-wide uppercase">จำนวนรายการ</th>
              <th className="px-5 py-3 text-xs font-semibold tracking-wide uppercase">เพิ่มเมื่อ</th>
              <th className="w-20 px-4 py-3"><span className="sr-only">จัดการ</span></th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.id} className="border-b border-border last:border-0 hover:bg-muted-surface/70">
                <td className="px-4 py-1.5 font-semibold">{category.name}</td>
                <td className="px-4 py-1.5 text-right tabular-nums">{category.itemCount}</td>
                <td className="px-4 py-1.5 text-muted">{new Date(category.createdAt).toLocaleDateString("th-TH")}</td>
                <td className="px-3 py-1.5">
                  <div className="flex items-center">
                    <EditCategoryModal category={category} />
                    <DeleteCategoryButton categoryId={category.id} categoryName={category.name} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-14 text-center text-muted">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-tint text-primary">
        <IconInbox aria-hidden className="h-7 w-7" />
      </span>
      <p className="text-sm">{text}</p>
    </div>
  );
}
