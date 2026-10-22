import sharp from "sharp";

export type ImageInfo = { width: number; height: number; bytes: number };

/** PNG otimizado sem metadados, em sRGB. */
export async function finalizePng(png: Buffer): Promise<Buffer> {
  return sharp(png).toColourspace("srgb").png({ compressionLevel: 9, adaptiveFiltering: true }).toBuffer();
}

/** JPG para publicação: 4:4:4 mantém bordas de texto colorido nítidas. */
export async function toJpeg(png: Buffer, quality = 92): Promise<Buffer> {
  return sharp(png).flatten({ background: "#ffffff" }).jpeg({ quality, mozjpeg: true, chromaSubsampling: "4:4:4" }).toBuffer();
}

export async function inspect(buf: Buffer): Promise<ImageInfo & { stdev: number }> {
  const img = sharp(buf);
  const meta = await img.metadata();
  const stats = await img.stats();
  const stdev = stats.channels.slice(0, 3).reduce((s, c) => s + c.stdev, 0) / 3;
  return { width: meta.width ?? 0, height: meta.height ?? 0, bytes: buf.length, stdev };
}

/** Prancha 3x2 em miniatura para revisão visual rápida (uma imagem em vez de seis). */
export async function contactSheet(pngs: Buffer[], thumbW = 360, cols = 3, gap = 24): Promise<Buffer> {
  const first = await sharp(pngs[0]).metadata();
  const thumbH = Math.round((thumbW * (first.height ?? 1350)) / (first.width ?? 1080));
  const rows = Math.ceil(pngs.length / cols);
  const thumbs = await Promise.all(pngs.map((p) => sharp(p).resize(thumbW, thumbH).png().toBuffer()));
  return sharp({
    create: { width: cols * thumbW + (cols + 1) * gap, height: rows * thumbH + (rows + 1) * gap, channels: 3, background: "#d9d9d9" },
  })
    .composite(thumbs.map((input, i) => ({ input, left: gap + (i % cols) * (thumbW + gap), top: gap + Math.floor(i / cols) * (thumbH + gap) })))
    .png()
    .toBuffer();
}
