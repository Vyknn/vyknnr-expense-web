"use client";

import { useEffect, useRef, useState } from "react";
import { Modal } from "@/components/modal/Modal";
import { IconReceipt, IconX } from "@tabler/icons-react";
import type { Receipt } from "./queries";

export function ReceiptGalleryModal({
  roundId,
  itemId,
  receipts,
}: {
  roundId: number;
  itemId: number;
  receipts: Receipt[];
}) {
  const [open, setOpen] = useState(false);
  const [activeReceiptId, setActiveReceiptId] = useState<number | null>(null);
  const lightboxRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = lightboxRef.current;
    if (!dialog) return;

    if (activeReceiptId !== null && !dialog.open) {
      dialog.showModal();
    } else if (activeReceiptId === null && dialog.open) {
      dialog.close();
    }
  }, [activeReceiptId]);

  if (receipts.length === 0) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary-tint hover:no-underline focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:outline-none"
      >
        <IconReceipt aria-hidden className="h-3.5 w-3.5" />
        ใบเสร็จ ({receipts.length})
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={`ใบเสร็จ (${receipts.length})`}
      >
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {receipts.map((receipt) => {
            const href = `/rounds/${roundId}/receipts/${itemId}/${receipt.id}`;
            const isImage = receipt.mimeType.startsWith("image/");

            return isImage ? (
              <button
                key={receipt.id}
                type="button"
                onClick={() => setActiveReceiptId(receipt.id)}
                className="flex aspect-square items-center justify-center overflow-hidden rounded-md border border-border bg-foreground/2 transition-opacity hover:opacity-80"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- GCS-backed binary route, not an optimizable static asset */}
                <img
                  src={href}
                  alt="ใบเสร็จ"
                  className="h-full w-full object-cover"
                />
              </button>
            ) : (
              <a
                key={receipt.id}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex aspect-square items-center justify-center overflow-hidden rounded-md border border-border bg-foreground/2 transition-opacity hover:opacity-80"
              >
                <span className="flex flex-col items-center gap-1 text-muted">
                  <IconReceipt aria-hidden className="h-6 w-6" />
                  <span className="text-xs">PDF</span>
                </span>
              </a>
            );
          })}
        </div>
      </Modal>

      {/* Full-image lightbox, opened from a thumbnail above */}
      <dialog
        ref={lightboxRef}
        aria-label="ดูรูปใบเสร็จแบบเต็ม"
        onClose={() => setActiveReceiptId(null)}
        onClick={(e) => {
          if (e.target === lightboxRef.current) setActiveReceiptId(null);
        }}
        className="m-auto max-h-[90vh] w-[calc(100%-2rem)] max-w-4xl overflow-visible bg-transparent p-0 backdrop:bg-black/80 backdrop:backdrop-blur-sm"
      >
        {activeReceiptId !== null && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setActiveReceiptId(null)}
              aria-label="ปิดรูปเต็ม"
              className="absolute -top-10 right-0 rounded-md p-1.5 text-white/90 transition-colors hover:bg-white/10 hover:text-white sm:-top-4 sm:-right-10"
            >
              <IconX aria-hidden className="h-5 w-5" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element -- GCS-backed binary route, not an optimizable static asset */}
            <img
              src={`/rounds/${roundId}/receipts/${itemId}/${activeReceiptId}`}
              alt="ใบเสร็จ"
              className="max-h-[90vh] w-full rounded-md object-contain"
            />
          </div>
        )}
      </dialog>
    </>
  );
}
