"use client";

import { useEffect, useId, useRef } from "react";
import { CloseIcon } from "@/components/icons/icons";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
};

export function Modal({ open, onClose, title, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-lg border border-border bg-card p-0 text-foreground shadow-[0_2px_5px_rgba(0,0,0,0.1)] backdrop:bg-black/50 backdrop:backdrop-blur-sm sm:w-full"
    >
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h2 id={titleId} className="text-base font-semibold">
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="ปิดหน้าต่าง"
          className="rounded-full p-1.5 text-muted transition-colors hover:bg-foreground/5 hover:text-foreground"
        >
          <CloseIcon />
        </button>
      </div>
      <div className="p-5">{children}</div>
    </dialog>
  );
}
