"use client";

import { useActionState } from "react";
import { IconTrash } from "@tabler/icons-react";
import { confirmDelete } from "@/lib/confirm";
import {
  deleteExpenseCategory,
  type ExpenseCategoryActionState,
} from "./actions";

const initialState: ExpenseCategoryActionState = { status: "idle" };

export function DeleteCategoryButton({
  categoryId,
  categoryName,
}: {
  categoryId: number;
  categoryName: string;
}) {
  const [state, formAction, pending] = useActionState(
    deleteExpenseCategory,
    initialState
  );

  return (
    <form
      action={formAction}
      onSubmit={async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const confirmed = await confirmDelete({
          title: `ลบประเภทค่าใช้จ่าย "${categoryName}" ใช่หรือไม่?`,
          text: "รายการเดิมจะยังอยู่ แต่จะแสดงเป็นไม่ระบุประเภท",
        });
        if (confirmed) formAction(new FormData(form));
      }}
    >
      <input type="hidden" name="categoryId" value={categoryId} />
      {state.status === "error" && (
        <p role="alert" className="sr-only">
          {state.message}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        aria-label={`ลบประเภท ${categoryName}`}
        className="inline-flex items-center gap-1 rounded-lg p-2 text-destructive transition-colors hover:bg-destructive-tint focus-visible:ring-2 focus-visible:ring-destructive/25 focus-visible:outline-none disabled:opacity-50"
      >
        <IconTrash aria-hidden className="h-4 w-4" />
      </button>
    </form>
  );
}
