import sharp from "sharp";
import { compressReceiptImage } from "./receipt-image";

describe("compressReceiptImage", () => {
  it("converts an image to a JPEG no wider or taller than 1600 pixels", async () => {
    const input = await sharp({
      create: {
        width: 2400,
        height: 1800,
        channels: 3,
        background: { r: 18, g: 132, b: 93 },
      },
    })
      .png()
      .toBuffer();

    const result = await compressReceiptImage(input);
    const metadata = await sharp(result.buffer).metadata();

    expect(result.mimeType).toBe("image/jpeg");
    expect(metadata.format).toBe("jpeg");
    expect(metadata.width).toBe(1600);
    expect(metadata.height).toBe(1200);
  });

  it("reduces a deliberately uncompressed PNG", async () => {
    const width = 120;
    const height = 90;
    const pixels = Buffer.alloc(width * height * 3);

    for (let index = 0; index < pixels.length; index += 1) {
      pixels[index] = index % 251;
    }

    const input = await sharp(pixels, {
      raw: { width, height, channels: 3 },
    })
      .png({ compressionLevel: 0 })
      .toBuffer();

    const result = await compressReceiptImage(input);

    expect(result.buffer.length).toBeLessThan(input.length);
  });

  it("rejects malformed image data", async () => {
    await expect(compressReceiptImage(Buffer.from("not an image"))).rejects.toThrow();
  });
});
