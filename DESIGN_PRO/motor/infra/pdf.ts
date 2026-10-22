import { PDFDocument } from "pdf-lib";

/** Ajusta metadados e confere páginas e tamanho (px CSS → pt: × 0.75). */
export async function finalizePdf(
  pdf: Buffer,
  meta: { title: string; author: string; expectedPages: number; width: number; height: number },
): Promise<{ bytes: Buffer; pages: number }> {
  const doc = await PDFDocument.load(pdf);
  const pages = doc.getPageCount();
  if (pages !== meta.expectedPages) throw new Error(`PDF com ${pages} páginas; esperado ${meta.expectedPages}`);
  const W = meta.width * 0.75;
  const H = meta.height * 0.75;
  for (const [i, p] of doc.getPages().entries()) {
    const { width, height } = p.getSize();
    if (Math.abs(width - W) > 2 || Math.abs(height - H) > 2) {
      throw new Error(`Página ${i + 1} do PDF com ${width}x${height}pt; esperado ${W}x${H}pt`);
    }
    // O Chromium arredonda a página para 0,01 polegada (1012,5 pt vira 1013,04 pt) e deixa um filete
    // sem fundo na base. Descemos o conteúdo pela sobra e fixamos a caixa em (0, 0, W, H): tamanho exato,
    // sem filete e com origem zero (caixas deslocadas confundem alguns rasterizadores e drivers).
    const dy = height - H;
    if (dy !== 0) p.translateContent(0, -dy);
    for (const set of [p.setMediaBox, p.setCropBox, p.setTrimBox, p.setBleedBox]) set.call(p, 0, 0, W, H);
  }
  doc.setTitle(meta.title);
  doc.setAuthor(meta.author);
  doc.setCreator("Progress Design Engine");
  doc.setProducer("Playwright Chromium + pdf-lib");
  doc.setCreationDate(new Date(0));
  doc.setModificationDate(new Date(0));
  return { bytes: Buffer.from(await doc.save()), pages };
}
