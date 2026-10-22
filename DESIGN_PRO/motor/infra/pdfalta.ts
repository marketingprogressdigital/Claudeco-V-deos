/**
 * PDF de apresentação em alta resolução: renderiza o render.html de uma entrega em escala 2 (2160 × 2700 por tela),
 * aplica a mesma pós-produção dos PNGs e monta um PDF com uma imagem por página (JPG 95, 4:4:4).
 * É idêntico ao que foi aprovado nos PNGs (o PDF impresso pelo Chromium não reproduz desfoque de vidro nem grão).
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { PDFDocument } from "pdf-lib";
import sharp from "sharp";
import { posProduzir } from "../posproducao.js";
import { abrirNavegador } from "../render.js";
import { fileUrl } from "./caminhos.js";
import { sha256 } from "./fs.js";

export async function pdfAlta(pasta: string, opts: { escala?: number; titulo?: string; autor?: string; grao?: number } = {}): Promise<{ arquivo: string; paginas: number; bytes: number }> {
  const escala = opts.escala ?? 2;
  const html = path.join(pasta, "render.html");
  const nav = await abrirNavegador();
  try {
    const ctx = await nav.newContext({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: escala });
    const page = await ctx.newPage();
    await page.goto(fileUrl(html), { waitUntil: "load" });
    await page.evaluate(async () => { await document.fonts.ready; });
    await page.waitForFunction(() => (window as unknown as { __AJUSTE_OK__?: boolean }).__AJUSTE_OK__ === true, null, { timeout: 30_000 });
    await page.evaluate(() => Promise.all([...document.images].map((i) => (i.complete ? 0 : new Promise((r) => (i.onload = i.onerror = r))))));
    const { n, W, H } = await page.evaluate(() => {
      const t = document.querySelectorAll("section.tela");
      const r = (t[0] as HTMLElement).getBoundingClientRect();
      return { n: t.length, W: r.width, H: r.height };
    });
    await page.setViewportSize({ width: W * n, height: H });
    const faixa = await page.screenshot({ type: "png", clip: { x: 0, y: 0, width: W * n, height: H }, animations: "disabled" });
    const doc = await PDFDocument.create();
    for (let i = 0; i < n; i++) {
      const tela = await sharp(faixa).extract({ left: Math.round(i * W * escala), top: 0, width: Math.round(W * escala), height: Math.round(H * escala) }).png().toBuffer();
      const pos = await posProduzir(tela, { grao: opts.grao ?? 0.035, vinheta: 0.1, nitidez: true, semente: parseInt(sha256(`${pasta}:${i}`).slice(0, 8), 16) });
      const jpg = await sharp(pos.png).jpeg({ quality: 95, mozjpeg: true, chromaSubsampling: "4:4:4" }).withMetadata({ density: 72 * escala }).toBuffer();
      const img = await doc.embedJpg(jpg);
      const p = doc.addPage([W * 0.75, H * 0.75]);
      p.drawImage(img, { x: 0, y: 0, width: W * 0.75, height: H * 0.75 });
    }
    doc.setTitle(opts.titulo ?? path.basename(pasta));
    doc.setAuthor(opts.autor ?? "DESIGN PRO");
    doc.setCreator("DESIGN PRO");
    const bytes = Buffer.from(await doc.save());
    const arquivo = path.join(pasta, "carrossel_alta_resolucao.pdf");
    await fs.writeFile(arquivo, bytes);
    await ctx.close();
    return { arquivo, paginas: n, bytes: bytes.length };
  } finally {
    await nav.close();
  }
}
