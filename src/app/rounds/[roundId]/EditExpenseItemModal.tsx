"use client";

import { useActionState, useEffect, useState } from "react";
import { Modal } from "@/components/modal/Modal";
import { Select } from "@/components/select/Select";
import { IconPencil, IconX } from "@tabler/icons-react";
import { updateExpenseItem, type UpdateExpenseItemState } from "./actions";
import type { ExpenseCategory, ExpenseItem, Payer, Receipt } from "./queries";
import { ReceiptDropzone } from "./ReceiptDropzone";

const initialState: UpdateExpenseItemState = { status: "idle" };
const EMPTY_PAYER_VALUE = "";

const fieldClass =
  "rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/20";

export function EditExpenseItemModal({
  roundId,
  item,
  payers,
  categories,
  receipts,
}: {
  roundId: number;
  item: ExpenseItem;
  payers: Payer[];
  categories: ExpenseCategory[];
  receipts: Receipt[];
}) {
  const [open, setOpen] = useState(false);
  const [payerSelection, setPayerSelection] = useState<string>(
    item.payerId ? String(item.payerId) : EMPTY_PAYER_VALUE
  );
  const [removedReceiptIds, setRemovedReceiptIds] = useState<Set<number>>(new Set());
  const [newReceiptFiles, setNewReceiptFiles] = useState<File[]>([]);
  const [state, formAction, pending] = useActionState(
    updateExpenseItem,
    initialState
  );

  useEffect(() => {
    if (state.status === "success") {
      // useActionState's dispatch has no synchronous completion callback — this
      // effect is the only way to sync the modal's/form's state to the action result.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRemovedReceiptIds(new Set());
      setNewReceiptFiles([]);
      setOpen(false);
    }
  }, [state]);

  function toggleRemoveReceipt(receiptId: number) {
    setRemovedReceiptIds((prev) => {
      const next = new Set(prev);
      if (next.has(receiptId)) next.delete(receiptId);
      else next.add(receiptId);
      return next;
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setPayerSelection(
            item.payerId ? String(item.payerId) : EMPTY_PAYER_VALUE
          );
          setRemovedReceiptIds(new Set());
          setNewReceiptFiles([]);
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
        <form action={formAction} encType="multipart/form-data" className="flex flex-col gap-3">
          <input type="hidden" name="roundId" value={roundId} />
          <input type="hidden" name="itemId" value={item.id} />
          {[...removedReceiptIds].map((receiptId) => (
            <input key={receiptId} type="hidden" name="removeReceiptIds" value={receiptId} />
          ))}

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
            <Select
              name="categoryId"
              defaultValue={item.categoryId ? String(item.categoryId) : ""}
            >
              <option value="">ไม่ระบุประเภท</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            ผู้จ่าย/ผู้สำรอง
            <Select
              name="payerId"
              value={payerSelection}
              onChange={(e) => setPayerSelection(e.target.value)}
            >
              <option value={EMPTY_PAYER_VALUE}>ไม่ระบุผู้จ่าย</option>
              {payers.map((payer) => (
                <option key={payer.id} value={payer.id}>
                  {payer.name}
                </option>
              ))}
            </Select>
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

          {receipts.length > 0 && (
            <div className="flex flex-col gap-1 text-sm">
              <span>หลักฐานเดิม</span>
              <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {receipts.map((receipt) => {
                  const isRemoved = removedReceiptIds.has(receipt.id);
                  const isImage = receipt.mimeType.startsWith("image/");
                  const href = `/rounds/${roundId}/receipts/${item.id}/${receipt.id}`;

                  return (
                    <li key={receipt.id} className="relative">
                      <div
                        className={`flex aspect-square items-center justify-center overflow-hidden rounded-md border border-border bg-foreground/2 transition-opacity ${
                          isRemoved ? "opacity-30" : ""
                        }`}
                      >
                        {isImage ? (
                          // eslint-disable-next-line @next/next/no-img-element -- GCS-backed binary route, not an optimizable static asset
                          <img src={href} alt="หลักฐาน" className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-xs text-muted">ไฟล์แนบ</span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleRemoveReceipt(receipt.id)}
                        aria-label={isRemoved ? "ยกเลิกการลบหลักฐานนี้" : "ลบหลักฐานนี้"}
                        className={`absolute -top-1.5 -right-1.5 rounded-full p-1 shadow-sm transition-colors ${
                          isRemoved
                            ? "bg-muted text-white"
                            : "bg-destructive text-white hover:bg-destructive/90"
                        }`}
                      >
                        <IconX aria-hidden className="h-3 w-3" />
                      </button>
                    </li>
                  );
                })}
              </ul>
              {removedReceiptIds.size > 0 && (
                <p className="text-xs text-muted-foreground">
                  จะลบหลักฐานที่ทำเครื่องหมายไว้ {removedReceiptIds.size} ไฟล์เมื่อบันทึก
                </p>
              )}
            </div>
          )}

          <ReceiptDropzone
            label="แนบบิล/สลิปเพิ่มเติม"
            files={newReceiptFiles}
            onChange={setNewReceiptFiles}
          />

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
