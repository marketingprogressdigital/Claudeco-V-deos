// Renderiza os criativos de tráfego do Tricologia de Elite (Meta, feed 4:5, 1080 x 1350).
// Uso: node render.mjs [n ...]   (sem argumentos, renderiza todos)
// Saída: DESIGN_PRO/saida/tricologia_de_elite/trafego/
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const raiz = path.resolve(aqui, '..', '..');
const require = createRequire(path.join(raiz, 'motor', 'package.json'));
const { chromium } = require('playwright');

const dados = JSON.parse(fs.readFileSync(path.join(aqui, 'criativos.json'), 'utf8'));
const saida = path.join(raiz, 'saida', 'tricologia_de_elite', 'trafego');
fs.mkdirSync(saida, { recursive: true });

const fonte = (p) => 'file://' + path.join(raiz, 'assets', 'fontes', p);
const logo = 'file://' + path.join(aqui, 'assets', 'tde_principal_offwhite_dourado.png');

function fundoDe(n) {
  // fundos/NN.jpg = imagem final; fundos/NN_baixa.jpg = provisória em baixa (arte sai como RASCUNHO).
  for (const sufixo of ['', '_baixa']) {
    for (const ext of ['jpg', 'jpeg', 'png', 'webp']) {
      const f = path.join(aqui, 'fundos', `${n}${sufixo}.${ext}`);
      if (fs.existsSync(f)) return { url: 'file://' + f, baixa: sufixo === '_baixa' };
    }
  }
  return null;
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const destaque = (s) => esc(s).replace(/\*(.+?)\*/g, '<em>$1</em>');

function html(c) {
  const fundo = fundoDe(c.n);
  return `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:Fraunces;src:url(${fonte('fraunces/fraunces-latin-full-normal.woff2')}) format('woff2');font-weight:100 900;font-style:normal}
@font-face{font-family:Fraunces;src:url(${fonte('fraunces/fraunces-latin-full-italic.woff2')}) format('woff2');font-weight:100 900;font-style:italic}
@font-face{font-family:Manrope;src:url(${fonte('manrope/manrope_latin_400_normal.woff2')}) format('woff2');font-weight:400}
@font-face{font-family:Manrope;src:url(${fonte('manrope/manrope_latin_500_normal.woff2')}) format('woff2');font-weight:500}
@font-face{font-family:Plex;src:url(${fonte('ibm_plex_mono/ibm-plex-mono-latin-400-normal.woff2')}) format('woff2');font-weight:400}
@font-face{font-family:Plex;src:url(${fonte('ibm_plex_mono/ibm-plex-mono-latin-500-normal.woff2')}) format('woff2');font-weight:500}
:root{--verde:#2F3A2A;--profundo:#2B3527;--dourado:#C9A46A;--off:#FAF6F0;--claro:#A8B29A}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:1080px;height:1350px;overflow:hidden;background:var(--profundo)}
.arte{position:relative;width:1080px;height:1350px;overflow:hidden;
  background:radial-gradient(120% 90% at 20% 15%,#3B4934 0%,#2B3527 60%)}
.foto{position:absolute;inset:0 0 auto 0;height:1000px;background-size:cover;background-position:center 35%;
  filter:saturate(.82) contrast(1.02)}
.veu{position:absolute;inset:0;background:
  linear-gradient(180deg,rgba(43,53,39,.55) 0%,rgba(43,53,39,0) 16%,rgba(43,53,39,0) 34%,rgba(43,53,39,.78) 56%,#2B3527 70%,#2B3527 100%)}
.grao{position:absolute;inset:0;opacity:.07;mix-blend-mode:overlay;background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='200' height='200' filter='url(%23n)'/></svg>")}
.topo{position:absolute;left:80px;right:80px;top:72px;display:flex;justify-content:space-between;
  font:500 22px/1 Plex;letter-spacing:.22em;color:var(--off)}
.topo .num{color:var(--dourado)}
.bloco{position:absolute;left:80px;right:80px;bottom:200px}
h1{font-family:Fraunces;font-weight:500;font-variation-settings:'opsz' 144,'SOFT' 0,'WONK' 0;
  font-size:76px;line-height:1.06;letter-spacing:-.012em;color:var(--off);text-wrap:balance}
h1 em{font-style:italic;font-weight:500;color:var(--dourado)}
.corte{width:132px;height:2px;background:var(--dourado);margin:40px 0 32px}
.apoio{font:400 31px/1.42 Manrope;color:rgba(250,246,240,.86);max-width:860px;text-wrap:pretty}
.cta{display:inline-block;margin-top:40px;padding:20px 30px;border:1.5px solid var(--dourado);
  font:500 21px/1 Plex;letter-spacing:.2em;color:var(--off)}
.cta b{color:var(--dourado);font-weight:500;margin-left:14px}
.rodape{position:absolute;left:80px;right:80px;bottom:72px;display:flex;align-items:flex-end;justify-content:space-between}
.rodape img{width:228px;display:block}
.rodape span{font:400 17px/1 Plex;letter-spacing:.22em;color:var(--claro)}
.pendente{position:absolute;left:0;right:0;top:0;padding:10px 0;text-align:center;background:#F2C230;color:#2A2F26;
  font:500 18px/1 Plex;letter-spacing:.2em}
</style></head><body><div class="arte">
${fundo ? `<div class="foto" style="background-image:url('${fundo.url}')"></div>` : ''}
<div class="veu"></div><div class="grao"></div>
<div class="topo"><span>${esc(c.rotulo)}</span><span class="num">${c.n}</span></div>
<div class="bloco">
  <h1>${destaque(c.titulo)}</h1>
  <div class="corte"></div>
  <p class="apoio">${esc(c.apoio)}</p>
  <div class="cta">${esc(c.cta)}<b>→</b></div>
</div>
<div class="rodape"><img src="${logo}"><span>COM ANA LARA</span></div>
${process.env.SEM_FAIXA ? '' : !fundo ? '<div class="pendente">RASCUNHO · FUNDO PENDENTE</div>' : fundo.baixa ? '<div class="pendente">RASCUNHO · FUNDO EM BAIXA RESOLUÇÃO</div>' : ''}
</div></body></html>`;
}

const filtro = process.argv.slice(2);
const lista = dados.criativos.filter((c) => !filtro.length || filtro.includes(c.n));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
const relatorio = [];
for (const c of lista) {
  const arq = path.join(saida, `_tmp_${c.n}.html`);
  fs.writeFileSync(arq, html(c));
  await page.goto('file://' + arq);
  await page.evaluate(() => document.fonts.ready);
  // Ajuste automático: o bloco de texto não pode subir acima de 560 px do topo.
  const ajuste = await page.evaluate(() => {
    const h1 = document.querySelector('h1');
    const bloco = document.querySelector('.bloco');
    let tam = 76;
    while (bloco.getBoundingClientRect().top < 560 && tam > 52) { tam -= 2; h1.style.fontSize = tam + 'px'; }
    const fontes = [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family);
    return { tam, topo: Math.round(bloco.getBoundingClientRect().top), fontes: [...new Set(fontes)] };
  });
  const png = path.join(saida, `TDE_trafego_${c.n}_${c.nome}.png`);
  await page.screenshot({ path: png, type: 'png' });
  fs.unlinkSync(arq);
  relatorio.push({ n: c.n, ...ajuste, fundo: fundoDe(c.n) ? (fundoDe(c.n).baixa ? 'baixa' : 'final') : 'pendente' });
}
await browser.close();
console.log(JSON.stringify(relatorio, null, 1));
