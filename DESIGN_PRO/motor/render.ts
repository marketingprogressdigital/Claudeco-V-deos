/**
 * Render (A3, item 11): Playwright com fator de escala 2 e redução final para 1080 px. O carrossel é renderizado
 * como uma faixa única (largura 1080 × telas) e recortado tela a tela. Também gera a passada "sem texto"
 * (fundo real sob cada letra, para medir contraste no PNG), a passada "sem médico" (cena atrás do médico) e o PDF.
 */
import { chromium, type Browser } from "playwright";
import sharp from "sharp";
import { fileUrl } from "./infra/caminhos.js";
import { UserError } from "./infra/errors.js";

export type TextoMedido = {
  tela: number;
  papel: string;
  texto: string;
  rect: { x: number; y: number; w: number; h: number };
  tamanho: number;
  peso: number;
  cor: string;
  opacidade: number;
};
export type Renderizado = {
  telas: Buffer[];
  telasSemTexto: Buffer[];
  textos: TextoMedido[];
  avisos: Array<{ regra: string; tela: number; texto: string }>;
  fontes: Array<{ familia: string; status: string }>;
  pdf: Buffer;
  chromium: string;
};

export async function abrirNavegador(): Promise<Browser> {
  try {
    // DESIGN_PRO_CHROMIUM: navegador já instalado (ex.: nuvem sem acesso ao download do Playwright)
    const caminho = process.env.DESIGN_PRO_CHROMIUM;
    return await chromium.launch(caminho ? { executablePath: caminho } : {});
  } catch (e) {
    throw new UserError('Chromium do Playwright não iniciou. Rode "npm run setup".', [(e as Error).message.split("\n")[0]!]);
  }
}

const COLETAR = `(() => {
  const op = (el) => { let o = 1; for (let n = el; n; n = n.parentElement) o *= parseFloat(getComputedStyle(n).opacity || '1'); return o; };
  return [...document.querySelectorAll('.t')].filter((el) => !el.closest('.eco')).map((el) => {
    const tela = el.closest('[data-tela]');
    const tr = tela.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    const range = document.createRange(); range.selectNodeContents(el);
    const rs = [...range.getClientRects()].filter((q) => q.width > 1 && q.height > 1);
    const xs = rs.map((q) => q.left), ys = rs.map((q) => q.top), xe = rs.map((q) => q.right), ye = rs.map((q) => q.bottom);
    const box = rs.length ? { x: Math.min(...xs) - tr.left, y: Math.min(...ys) - tr.top, w: Math.max(...xe) - Math.min(...xs), h: Math.max(...ye) - Math.min(...ys) } : { x: r.left - tr.left, y: r.top - tr.top, w: r.width, h: r.height };
    const cs = getComputedStyle(el);
    return { tela: +tela.dataset.tela, papel: el.dataset.papel || '', texto: el.innerText.replace(/\\s+/g, ' ').trim(), rect: box, tamanho: parseFloat(cs.fontSize), peso: parseInt(cs.fontWeight, 10), cor: cs.color, opacidade: op(el) };
  }).filter((t) => t.texto);
})()`;

export async function renderizar(navegador: Browser, html: string, largura: number, altura: number, telas: number, opts: { escala?: number; semMedico?: boolean } = {}): Promise<Renderizado> {
  const escala = opts.escala ?? 2;
  const W = largura / telas;
  const ctx = await navegador.newContext({ viewport: { width: largura, height: altura }, deviceScaleFactor: escala });
  try {
    const page = await ctx.newPage();
    await page.goto(fileUrl(html), { waitUntil: "load" });
    await page.evaluate(async () => {
      await Promise.allSettled([...document.fonts].map((f) => f.load()));
      await document.fonts.ready;
    });
    await page.waitForFunction(() => (window as unknown as { __AJUSTE_OK__?: boolean }).__AJUSTE_OK__ === true, null, { timeout: 30_000 }).catch(() => {
      throw new UserError("O ajuste automático de texto não terminou em 30 s");
    });
    await page.evaluate(() => Promise.all([...document.images].map((i) => (i.complete ? 0 : new Promise((r) => (i.onload = i.onerror = r))))));
    if (opts.semMedico) await page.evaluate(() => document.body.classList.add("sem-medico", "sem-texto"));
    const textos = (await page.evaluate(COLETAR)) as TextoMedido[];
    const avisos = (await page.evaluate(() => (window as unknown as { __AVISOS__?: [] }).__AVISOS__ ?? [])) as Renderizado["avisos"];
    const fontes = (await page.evaluate(() => [...document.fonts].map((f) => ({ familia: f.family.replace(/["']/g, ""), status: f.status })))) as Renderizado["fontes"];
    const faixa = await page.screenshot({ type: "png", clip: { x: 0, y: 0, width: largura, height: altura }, animations: "disabled" });
    let faixaSemTexto = faixa;
    if (!opts.semMedico) {
      await page.evaluate(() => document.body.classList.add("sem-texto"));
      faixaSemTexto = await page.screenshot({ type: "png", clip: { x: 0, y: 0, width: largura, height: altura }, animations: "disabled" });
      await page.evaluate(() => document.body.classList.remove("sem-texto"));
    }
    const cortar = async (b: Buffer) =>
      Promise.all(Array.from({ length: telas }, (_, i) => sharp(b).extract({ left: Math.round(i * W * escala), top: 0, width: Math.round(W * escala), height: Math.round(altura * escala) }).resize(W, altura, { kernel: "lanczos3" }).png().toBuffer()));
    let pdf: Buffer = Buffer.alloc(0);
    if (!opts.semMedico) {
      await page.emulateMedia({ media: "print" });
      pdf = Buffer.from(await page.pdf({ printBackground: true, preferCSSPageSize: true, width: `${W}px`, height: `${altura}px` }));
    }
    return { telas: await cortar(faixa), telasSemTexto: await cortar(faixaSemTexto), textos, avisos, fontes, pdf, chromium: navegador.version() };
  } finally {
    await ctx.close();
  }
}
