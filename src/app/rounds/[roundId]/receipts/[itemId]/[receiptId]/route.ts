import { db } from "@/lib/db";

type ReceiptRow = {
  blob: Buffer;
  mime_type: string;
  filename: string | null;
};

export async function GET(
  _request: Request,
  {
    params,
  }: { params: Promise<{ roundId: string; itemId: string; receiptId: string }> }
) {
  const { roundId, itemId, receiptId } = await params;

  const row = db
    .prepare(
      `SELECT r.blob AS blob, r.mime_type AS mime_type, r.filename AS filename
       FROM expense_item_receipts r
       JOIN expense_items i ON i.id = r.item_id
       WHERE r.id = ? AND r.item_id = ? AND i.round_id = ?`
    )
    .get(receiptId, itemId, roundId) as ReceiptRow | undefined;

  if (!row) {
    return new Response("Not found", { status: 404 });
  }

  const filename = row.filename ?? "receipt";
  return new Response(new Uint8Array(row.blob), {
    headers: {
      "Content-Type": row.mime_type,
      "Content-Disposition": `inline; filename="${filename.replace(/"/g, "")}"`,
    },
  });
}
