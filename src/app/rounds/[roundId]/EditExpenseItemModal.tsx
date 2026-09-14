"use client";

import { useActionState, useEffect, useState } from "react";
import { Modal } from "@/components/modal/Modal";
import { PencilIcon } from "@/components/icons/icons";
import { expenseCategories } from "@/lib/expense-category";
import { updateExpenseItem, type UpdateExpenseItemState } from "./actions";
import type { ExpenseItem, Payer } from "./queries";

const initialState: UpdateExpenseItemState = { status: "idle" };
const NEW_PAYER_VALUE = "__new__";

const fieldClass =
  "rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary";

export function EditExpenseItemModal({
  roundId,
  item,
  payers,
}: {
  roundId: number;
  item: ExpenseItem;
  payers: Payer[];
}) {
  const [open, setOpen] = useState(false);
  const [payerSelection, setPayerSelection] = useState<string>(
    String(item.payerId)
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
          setPayerSelection(String(item.payerId));
          setOpen(true);
        }}
        aria-label="แก้ไขรายการนี้"
        className="inline-flex items-center gap-1 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
      >
        <PencilIcon className="h-4 w-4" />
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
              name="category"
              defaultValue={item.category}
              required
              className={fieldClass}
            >
              {expenseCategories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
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
              {payers.map((payer) => (
                <option key={payer.id} value={payer.id}>
                  {payer.name}
                </option>
              ))}
              <option value={NEW_PAYER_VALUE}>+ เพิ่มชื่อใหม่</option>
            </select>
          </label>

          {payerSelection === NEW_PAYER_VALUE && (
            <label className="flex flex-col gap-1 text-sm">
              ชื่อผู้จ่ายใหม่
              <input
                name="newPayerName"
                required
                placeholder="ชื่อ-นามสกุล"
                className={fieldClass}
              />
            </label>
          )}

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
              className="rounded-md px-3 py-1.5 text-sm hover:bg-foreground/5"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={pending}
              className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {pending ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
