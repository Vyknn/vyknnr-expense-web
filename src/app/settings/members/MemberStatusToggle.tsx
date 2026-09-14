"use client";

import { useOptimistic, useTransition } from "react";
import { updateMemberStatus } from "./actions";

export function MemberStatusToggle({
  memberId,
  memberName,
  isActive,
  disabled = false,
}: {
  memberId: number;
  memberName: string;
  isActive: boolean;
  disabled?: boolean;
}) {
  const [optimisticActive, setOptimisticActive] = useOptimistic(isActive);
  const [isPending, startTransition] = useTransition();

  function toggle() {
    const nextActive = !optimisticActive;
    startTransition(async () => {
      setOptimisticActive(nextActive);

      const formData = new FormData();
      formData.set("memberId", String(memberId));
      formData.set("isActive", nextActive ? "1" : "0");

      const result = await updateMemberStatus({ status: "idle" }, formData);
      if (result.status === "error") {
        setOptimisticActive(isActive);
        alert(result.message);
      }
    });
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={optimisticActive}
      aria-label={`${optimisticActive ? "ปิดใช้งาน" : "เปิดใช้งาน"}บัญชี ${memberName}`}
      onClick={toggle}
      disabled={disabled || isPending}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${
        optimisticActive ? "bg-primary" : "bg-muted-surface"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-card shadow transition-transform ${
          optimisticActive ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </button>
  );
}
