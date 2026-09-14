import { getCurrentUser } from "@/features/auth/services/auth";
import { db } from "@/lib/db";

type ReceiptRow = {
  blob: Buffer;
  mimeType: string;
  filename: string | null;
};

export async function GET(
  _request: Request,
  {
    params,
  }: { params: Promise<{ roundId: string; itemId: string; receiptId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  if (user.mustChangePassword) return new Response("Forbidden", { status: 403 });

  const { roundId, itemId, receiptId } = await params;
  const parsedRoundId = Number(roundId);
  const parsedItemId = Number(itemId);
  const parsedReceiptId = Number(receiptId);

  if (![parsedRoundId, parsedItemId, parsedReceiptId].every(Number.isInteger)) {
    return new Response("Not found", { status: 404 });
  }

  const row = db
    .prepare(
      `SELECT r.blob AS blob, r.mime_type AS mimeType, r.filename AS filename
       FROM expense_item_receipts r
       JOIN expense_items i ON i.id = r.item_id
       JOIN expense_rounds round ON round.id = i.round_id
       WHERE r.id = ? AND i.id = ? AND round.id = ?`
    )
    .get(parsedReceiptId, parsedItemId, parsedRoundId) as ReceiptRow | undefined;

  if (!row) return new Response("Not found", { status: 404 });

  return new Response(new Uint8Array(row.blob), {
    headers: {
      "Content-Type": row.mimeType,
      "Content-Disposition": `inline; filename="${(row.filename ?? "receipt").replace(/"/g, "")}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
