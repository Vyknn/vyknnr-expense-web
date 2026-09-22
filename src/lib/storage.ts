import "server-only";
import { randomUUID } from "node:crypto";
import { Storage } from "@google-cloud/storage";

declare global {
  var __gcsClient: Storage | undefined;
}

// GOOGLE_BUCKET_PATH is "<bucket>" or "<bucket>/<prefix>" — the prefix lets several apps share
// one bucket under separate folders (e.g. "autobotz-dev/expense").
function parseBucketPath(bucketPath: string): { bucketName: string; keyPrefix: string } {
  const [bucketName, ...rest] = bucketPath.split("/");
  return { bucketName, keyPrefix: rest.length > 0 ? `${rest.join("/")}/` : "" };
}

function getBucketPath(): string {
  const bucketPath = process.env.GOOGLE_BUCKET_PATH;
  if (!bucketPath) {
    throw new Error("GOOGLE_BUCKET_PATH ยังไม่ได้ตั้งค่า");
  }
  return bucketPath;
}

function getBucket() {
  if (!globalThis.__gcsClient) {
    globalThis.__gcsClient = new Storage({ keyFilename: process.env.GOOGLE_CERT_PATH });
  }
  const { bucketName } = parseBucketPath(getBucketPath());
  return globalThis.__gcsClient.bucket(bucketName);
}

export async function uploadReceipt(
  buffer: Buffer,
  mimeType: string,
  roundId: number
): Promise<string> {
  const { keyPrefix } = parseBucketPath(getBucketPath());
  const key = `${keyPrefix}receipts/${roundId}/${randomUUID()}.jpg`;
  await getBucket().file(key).save(buffer, { contentType: mimeType });
  return key;
}

export async function downloadReceipt(key: string): Promise<Buffer> {
  const [buffer] = await getBucket().file(key).download();
  return buffer;
}

export async function deleteReceipts(keys: string[]): Promise<void> {
  if (keys.length === 0) return;

  const bucket = getBucket();
  const results = await Promise.allSettled(keys.map((key) => bucket.file(key).delete()));
  for (const [index, result] of results.entries()) {
    if (result.status === "rejected") {
      console.warn(`[storage] ลบไฟล์หลักฐาน "${keys[index]}" บน GCS ไม่สำเร็จ`, result.reason);
    }
  }
}
