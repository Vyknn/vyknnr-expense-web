"use client";

import { useActionState } from "react";
import { IconTrash } from "@tabler/icons-react";
import { deleteRound, type DeleteRoundState } from "./actions";

const initialState: DeleteRoundState = { status: "idle" };

export function DeleteRoundButton({
  roundId,
  roundName,
  redirectHome = false,
}: {
  roundId: number;
  roundName: string;
  redirectHome?: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    deleteRound,
    initialState
  );

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (
          !confirm(
            `ลบรอบ "${roundName}" ใช่หรือไม่? รายการค่าใช้จ่ายและใบเสร็จทั้งหมดในรอบนี้จะถูกลบไปด้วย และไม่สามารถกู้คืนได้`
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="roundId" value={roundId} />
      {redirectHome && <input type="hidden" name="redirectTo" value="/" />}
      <button
        type="submit"
        disabled={pending}
        aria-label={`ลบรอบ ${roundName}`}
        className={
          redirectHome
            ? "inline-flex items-center gap-1.5 rounded-lg bg-destructive px-3 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-destructive/90 focus-visible:ring-2 focus-visible:ring-destructive/25 focus-visible:outline-none disabled:opacity-50"
            : "inline-flex items-center gap-1 rounded-lg p-2 text-destructive transition-colors hover:bg-destructive-tint focus-visible:ring-2 focus-visible:ring-destructive/25 focus-visible:outline-none disabled:opacity-50"
        }
      >
        <IconTrash aria-hidden className="h-4 w-4" />
        {redirectHome && "ลบทิ้ง"}
      </button>
      {state.status === "error" && (
        <p className="mt-1 text-xs text-destructive">{state.message}</p>
      )}
    </form>
  );
}
