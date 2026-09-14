import "server-only";
import sharp from "sharp";

const MAX_RECEIPT_DIMENSION = 1600;
const JPEG_QUALITY = 80;

export type CompressedReceiptImage = {
  buffer: Buffer;
  mimeType: "image/jpeg";
};

export async function compressReceiptImage(
  input: Buffer
): Promise<CompressedReceiptImage> {
  const buffer = await sharp(input)
    .rotate()
    .resize({
      width: MAX_RECEIPT_DIMENSION,
      height: MAX_RECEIPT_DIMENSION,
      fit: "inside",
      withoutEnlargement: true,
    })
    .flatten({ background: "#ffffff" })
    .jpeg({ quality: JPEG_QUALITY })
    .toBuffer();

  return { buffer, mimeType: "image/jpeg" };
}
