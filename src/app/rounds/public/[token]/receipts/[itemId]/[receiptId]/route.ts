import { queryRow } from "@/lib/db";
import { downloadReceipt } from "@/lib/storage";

type ReceiptRow = {
  storageKey: string;
  mimeType: string;
  filename: string | null;
};

export async function GET(
  _request: Request,
  {
    params,
  }: { params: Promise<{ token: string; itemId: string; receiptId: string }> }
) {
  const { token, itemId, receiptId } = await params;
  const parsedItemId = Number(itemId);
  const parsedReceiptId = Number(receiptId);

  if (![parsedItemId, parsedReceiptId].every(Number.isInteger)) {
    return new Response("Not found", { status: 404 });
  }

  // Authorization is the share token matching the round the receipt belongs to — there is no
  // session on this route, so this join is the only access check.
  const row = await queryRow<ReceiptRow>(
    `SELECT r.storage_key AS "storageKey", r.mime_type AS "mimeType", r.filename AS filename
     FROM expense_item_receipts r
     JOIN expense_items i ON i.id = r.item_id
     JOIN expense_rounds round ON round.id = i.round_id
     WHERE r.id = $1 AND i.id = $2 AND round.public_token = $3`,
    [parsedReceiptId, parsedItemId, token]
  );

  if (!row) return new Response("Not found", { status: 404 });

  const buffer = await downloadReceipt(row.storageKey);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": row.mimeType,
      "Content-Disposition": `inline; filename="${(row.filename ?? "receipt").replace(/"/g, "")}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
