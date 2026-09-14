"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Modal } from "@/components/modal/Modal";
import { IconPlus } from "@tabler/icons-react";
import { addExpenseItem, type AddExpenseItemState } from "./actions";
import type { ExpenseCategory, Payer } from "./queries";

const initialState: AddExpenseItemState = { status: "idle" };
const EMPTY_PAYER_VALUE = "";

const fieldClass =
  "rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/20";

export function AddExpenseItemModal({
  roundId,
  payers,
  categories,
}: {
  roundId: number;
  payers: Payer[];
  categories: ExpenseCategory[];
}) {
  const [open, setOpen] = useState(false);
  const [payerSelection, setPayerSelection] = useState<string>(
    payers[0] ? String(payers[0].id) : EMPTY_PAYER_VALUE
  );
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(
    addExpenseItem,
    initialState
  );

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
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
        onClick={() => setOpen(true)}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:outline-none"
      >
        <IconPlus aria-hidden className="h-4 w-4" />
        เพิ่มรายการ
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="เพิ่มรายการค่าใช้จ่าย">
        <form
          ref={formRef}
          action={formAction}
          encType="multipart/form-data"
          onReset={() =>
            setPayerSelection(payers[0] ? String(payers[0].id) : EMPTY_PAYER_VALUE)
          }
          className="flex flex-col gap-3"
        >
          <input type="hidden" name="roundId" value={roundId} />

          <label className="flex flex-col gap-1 text-sm">
            รายละเอียด
            <input
              name="description"
              required
              placeholder="เช่น ซื้อกระดาษ A4"
              className={fieldClass}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            ประเภทค่าใช้จ่าย
            <select name="categoryId" defaultValue="" className={fieldClass}>
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
                className={fieldClass}
              />
            </label>
            <label className="flex flex-1 flex-col gap-1 text-sm">
              วันที่จ่าย
              <input
                name="expenseDate"
                type="date"
                required
                defaultValue={new Date().toISOString().slice(0, 10)}
                className={fieldClass}
              />
            </label>
          </div>

          <label className="flex flex-col gap-1 text-sm">
            แนบบิล/สลิป (JPG, PNG, WEBP สูงสุด 10 รูป รูปละไม่เกิน 5MB)
            <input
              name="receipts"
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              className="text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-foreground/5 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-foreground hover:file:bg-foreground/10"
            />
          </label>

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
              {pending ? "กำลังบันทึก..." : "บันทึกรายการ"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
