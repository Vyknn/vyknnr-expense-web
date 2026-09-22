"use client";

import { useEffect, useRef, useState } from "react";
import { IconCloudUpload, IconX } from "@tabler/icons-react";

export function ReceiptDropzone({
  label,
  files,
  onChange,
}: {
  label: string;
  files: File[];
  onChange: (files: File[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const labelId = `receipts-label-${label}`;

  useEffect(() => {
    if (!inputRef.current) return;
    const dataTransfer = new DataTransfer();
    for (const file of files) dataTransfer.items.add(file);
    inputRef.current.files = dataTransfer.files;
  }, [files]);

  return (
    <div className="flex flex-col gap-1 text-sm">
      <span id={labelId}>{label}</span>
      <div
        role="button"
        tabIndex={0}
        aria-labelledby={labelId}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragActive(true);
        }}
        onDragLeave={() => setIsDragActive(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragActive(false);
          const dropped = Array.from(event.dataTransfer.files);
          if (dropped.length > 0) onChange([...files, ...dropped]);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-6 text-center transition-colors focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:outline-none ${
          isDragActive ? "border-primary bg-primary-tint" : "border-border hover:bg-accent"
        }`}
      >
        <IconCloudUpload aria-hidden className="h-8 w-8 text-muted" />
        <p className="text-sm text-muted-foreground">
          ลากไฟล์มาวางที่นี่ หรือ <span className="font-medium text-primary">เลือกไฟล์</span>
        </p>
        <input
          ref={inputRef}
          name="receipts"
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(event) => onChange(Array.from(event.target.files ?? []))}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        รองรับ JPG, PNG, WEBP — ไฟล์ละไม่เกิน 5MB (สูงสุด 10 ไฟล์)
      </p>

      {files.length > 0 && (
        <ul className="flex flex-col gap-1">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              className="flex items-center justify-between gap-2 rounded-md bg-muted-surface px-2 py-1 text-xs text-foreground"
            >
              <span className="truncate">{file.name}</span>
              <button
                type="button"
                onClick={() => onChange(files.filter((_, i) => i !== index))}
                aria-label={`นำไฟล์ ${file.name} ออก`}
                className="shrink-0 text-muted transition-colors hover:text-destructive"
              >
                <IconX aria-hidden className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
