"use client";

import { useActionState, useEffect, useState } from "react";
import { Modal } from "@/components/modal/Modal";
import { IconPencil } from "@tabler/icons-react";
import { updateExpenseItem, type UpdateExpenseItemState } from "./actions";
import type { ExpenseCategory, ExpenseItem, Payer } from "./queries";

const initialState: UpdateExpenseItemState = { status: "idle" };
const EMPTY_PAYER_VALUE = "";

const fieldClass =
  "rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/20";

export function EditExpenseItemModal({
  roundId,
  item,
  payers,
  categories,
}: {
  roundId: number;
  item: ExpenseItem;
  payers: Payer[];
  categories: ExpenseCategory[];
}) {
  const [open, setOpen] = useState(false);
  const [payerSelection, setPayerSelection] = useState<string>(
    item.payerId ? String(item.payerId) : EMPTY_PAYER_VALUE
  );
  const [state, formAction, pending] = useActionState(
    updateExpenseItem,
    initialState
  );

  useEffect(() => {
    if (state.status === "success") {
      // useActionState's dispatch has no synchronous completion callback — this
      // effect is the only way to sync the modal's open state to the action result.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOpen(false);
    }
  }, [state]);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setPayerSelection(
            item.payerId ? String(item.payerId) : EMPTY_PAYER_VALUE
          );
          setOpen(true);
        }}
        aria-label="แก้ไขรายการนี้"
        className="inline-flex items-center gap-1 rounded-lg p-2 text-muted transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:outline-none"
      >
        <IconPencil aria-hidden className="h-4 w-4" />
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="แก้ไขรายการค่าใช้จ่าย"
      >
        <form action={formAction} className="flex flex-col gap-3">
          <input type="hidden" name="roundId" value={roundId} />
          <input type="hidden" name="itemId" value={item.id} />

          <label className="flex flex-col gap-1 text-sm">
            รายละเอียด
            <input
              name="description"
              required
              defaultValue={item.description}
              className={fieldClass}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            ประเภทค่าใช้จ่าย
            <select
              name="categoryId"
              defaultValue={item.categoryId ? String(item.categoryId) : ""}
              className={fieldClass}
            >
              <option value="">ไม่ระบุประเภท</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            ผู้จ่าย/ผู้สำรอง
            <select
              name="payerId"
              value={payerSelection}
              onChange={(e) => setPayerSelection(e.target.value)}
              className={fieldClass}
            >
              <option value={EMPTY_PAYER_VALUE}>ไม่ระบุผู้จ่าย</option>
              {payers.map((payer) => (
                <option key={payer.id} value={payer.id}>
                  {payer.name}
                </option>
              ))}
            </select>
          </label>

          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="flex flex-1 flex-col gap-1 text-sm">
              จำนวนเงิน (บาท)
              <input
                name="amount"
                type="number"
                step="0.01"
                min="0.01"
                required
                defaultValue={(item.amountSatang / 100).toFixed(2)}
                className={fieldClass}
              />
            </label>
            <label className="flex flex-1 flex-col gap-1 text-sm">
              วันที่จ่าย
              <input
                name="expenseDate"
                type="date"
                required
                defaultValue={item.expenseDate}
                className={fieldClass}
              />
            </label>
          </div>

          {state.status === "error" && (
            <p className="text-sm text-destructive">{state.message}</p>
          )}

          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:outline-none"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:outline-none disabled:opacity-50"
            >
              {pending ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
