/**
 * Biblioteca de efeitos (referência B5, 20 efeitos). Cada efeito é uma função pura:
 * recebe a caixa e os parâmetros e devolve HTML (com CSS inline) que usa só variáveis da ficha
 * (--principal, --fundo-escuro, etc.). Faixas padrão de biblioteca/efeitos.json.
 */
import type { Caixa } from "../plano.js";

export type Html = string;
type P = Record<string, number | string | boolean>;

const num = (p: P, k: string, d: number) => (typeof p[k] === "number" ? (p[k] as number) : d);
const str = (p: P, k: string, d: string) => (typeof p[k] === "string" ? (p[k] as string) : d);
export const caixaCss = (c: Caixa) =>
  `left:${c.x}px;top:${c.y}px;width:${c.w}px;height:${c.h}px;z-index:${c.z};${c.rotacao ? `transform:rotate(${c.rotacao}deg);` : ""}`;
const abs = (c: Caixa, extra = "", cls = "fx") => `<div class="${cls}" style="position:absolute;${caixaCss(c)}${extra}"></div>`;

/** Gerador pseudoaleatório determinístico (mulberry32): o mesmo plano gera sempre o mesmo PNG. */
export function aleatorio(semente: number) {
  let a = semente >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* 1. Atmosfera noturna: fundo escuro, foco de luz radial na principal (25 a 45%), feixe diagonal e vinheta interna forte. */
export function atmosferaNoturna(c: Caixa, p: P = {}): Html {
  const fx = num(p, "focoX", 0.5) * 100, fy = num(p, "focoY", 0.4) * 100, op = num(p, "intensidade", 0.35);
  return [
    abs(c, `background:var(--fundo-escuro);`),
    abs(c, `background:radial-gradient(ellipse 70% 55% at ${fx}% ${fy}%, rgb(var(--principal-rgb) / ${op}) 0%, rgb(var(--principal-rgb) / ${op * 0.35}) 38%, transparent 72%);`),
    abs(c, `background:linear-gradient(118deg, transparent 30%, rgb(var(--principal-rgb) / ${op * 0.28}) 46%, transparent 62%);filter:blur(28px);mix-blend-mode:screen;`),
    abs(c, `box-shadow:inset 0 0 320px 90px rgb(0 0 0 / .55);`),
  ].join("");
}

/* 2. Atmosfera editorial: fundo claro, degradê quente, sombra de janela (8 a 12%, desfoque 25 a 35). */
export function atmosferaEditorial(c: Caixa, p: P = {}): Html {
  const op = num(p, "sombra", 0.1), blur = num(p, "desfoque", 30);
  return [
    abs(c, `background:var(--fundo-claro);`),
    abs(c, `background:linear-gradient(160deg, rgb(255 255 255 / .35) 0%, transparent 45%, rgb(var(--principal-rgb) / .08) 100%);`),
    abs(c, `background:repeating-linear-gradient(105deg, rgb(var(--fundo-escuro-rgb) / ${op}) 0 70px, transparent 70px 150px);filter:blur(${blur}px);transform:skewX(-8deg) scale(1.2);mix-blend-mode:multiply;opacity:.9;`),
  ].join("");
}

/* 3. Atmosfera clínica: fundo claro, dois focos (principal e apoio) em cantos opostos, malha de pontos com máscara. */
export function atmosferaClinica(c: Caixa, p: P = {}): Html {
  const op = num(p, "intensidade", 0.22);
  return [
    abs(c, `background:var(--fundo-claro);`),
    abs(c, `background:radial-gradient(circle at 8% 6%, rgb(var(--principal-rgb) / ${op}) 0%, transparent 42%), radial-gradient(circle at 96% 96%, rgb(var(--apoio-rgb) / ${op}) 0%, transparent 46%);`),
    abs(c, `background-image:radial-gradient(rgb(var(--fundo-escuro-rgb) / .16) 1.6px, transparent 1.8px);background-size:28px 28px;-webkit-mask-image:radial-gradient(ellipse 60% 50% at 85% 15%, #000 0%, transparent 75%);`),
  ].join("");
}

/* 4. Atmosfera em cor: fundo na principal, foco claro e vinheta escura da própria cor. */
export function atmosferaCor(c: Caixa, p: P = {}): Html {
  const fx = num(p, "focoX", 0.3) * 100, fy = num(p, "focoY", 0.25) * 100, it = num(p, "intensidade", 0.35);
  // vinheta interna proporcional à intensidade (0,35 → 0,75 como antes); em intensidade baixa os cantos ficam
  // quase na principal, onde moram numeração e assinatura
  return [
    abs(c, `background:var(--principal);`),
    abs(c, `background:radial-gradient(ellipse 65% 50% at ${fx}% ${fy}%, rgb(255 255 255 / ${(0.63 * it).toFixed(2)}) 0%, transparent 70%);`),
    abs(c, `box-shadow:inset 0 0 300px 60px rgb(var(--principal-escura-rgb) / ${Math.min(0.85, 2.14 * it).toFixed(2)});`),
  ].join("");
}

/* 5. Grão: ruído monocromático (3 a 6%) em sobreposição sobre a arte inteira. Semente fixa: determinístico. */
export function grao(c: Caixa, p: P = {}): Html {
  const op = num(p, "opacidade", 0.05);
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='256' height='256'><filter id='g'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' seed='7' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='256' height='256' filter='url(%23g)'/></svg>`;
  return abs({ ...c, z: 900 }, `background-image:url("data:image/svg+xml;utf8,${svg}");opacity:${op};mix-blend-mode:overlay;pointer-events:none;`);
}

/* 6. Vinheta: sombra interna nas bordas (10 a 25%). */
export function vinheta(c: Caixa, p: P = {}): Html {
  const op = num(p, "opacidade", 0.18);
  return abs({ ...c, z: 890 }, `background:radial-gradient(ellipse 80% 75% at 50% 45%, transparent 55%, rgb(0 0 0 / ${op}) 100%);pointer-events:none;`);
}

/* 7. Luz de recorte (versão CSS; a versão fiel é calculada por pixel em medico/integracao.ts). */
export function luzRecorte(c: Caixa, p: P = {}): Html {
  const lado = str(p, "lado", "esquerda") === "esquerda" ? -1 : 1, larg = num(p, "largura", 30), op = num(p, "opacidade", 0.5);
  return `<div class="fx" style="position:absolute;${caixaCss(c)}filter:drop-shadow(${lado * larg * 0.4}px 0 ${larg}px rgb(var(--principal-rgb) / ${op}));"></div>`;
}

/* 8. Sombra de contato: elipse escura desfocada na base (20 a 35%). */
export function sombraContato(c: Caixa, p: P = {}): Html {
  const op = num(p, "opacidade", 0.28);
  return abs(c, `background:radial-gradient(ellipse 50% 50% at 50% 50%, rgb(0 0 0 / ${op}) 0%, transparent 70%);filter:blur(14px);`);
}

/* 9. Vidro: cartão translúcido (8 a 14% sobre escuro, 55 a 75% sobre claro), desfoque 20 a 30, borda 1,5. */
export function vidro(c: Caixa, p: P = {}): Html {
  const sobre = str(p, "sobre", "escuro");
  const op = num(p, "opacidade", sobre === "escuro" ? 0.11 : 0.62), blur = num(p, "desfoque", 24);
  const borda = sobre === "escuro" ? "rgb(255 255 255 / .22)" : "rgb(255 255 255 / .85)";
  const sombra = sobre === "escuro" ? "0 30px 60px rgb(0 0 0 / .28)" : "0 24px 50px rgb(var(--fundo-escuro-rgb) / .10)";
  return abs(c, `background:rgb(255 255 255 / ${op});backdrop-filter:blur(${blur}px) saturate(1.2);-webkit-backdrop-filter:blur(${blur}px);border:1.5px solid ${borda};border-radius:var(--raio);box-shadow:${sombra};`, "fx vidro");
}

/* 10. Texto em degradê da principal (do tom claro ao escuro). Aplicado como estilo de texto. */
export const textoDegrade = () =>
  `background:linear-gradient(180deg, color-mix(in srgb, var(--destaque) 74%, var(--rumo, white)) 0%, var(--destaque) 55%, color-mix(in srgb, var(--destaque) 88%, black) 100%);-webkit-background-clip:text;background-clip:text;color:transparent;`;

/* 11. Eco em contorno: cópia do título só em contorno, deslocada 16 a 30 px, 40 a 60% de opacidade. */
export function ecoContorno(html: string, c: Caixa, estiloBase: string, p: P = {}): Html {
  const d = num(p, "deslocamento", 24), op = num(p, "opacidade", 0.4);
  return `<div class="t eco" aria-hidden="true" style="position:absolute;${caixaCss({ ...c, y: c.y - d, z: c.z - 1 })}${estiloBase}color:transparent;-webkit-text-stroke:2px var(--destaque, var(--principal));opacity:${op};">${html}</div>`;
}

/* 12. Texto vazado: a imagem aparece só dentro das letras. */
export const textoVazado = (url: string) => `background:url("${url}") center/cover;-webkit-background-clip:text;background-clip:text;color:transparent;`;

/* 13. Arco: semicírculo no topo como moldura ou fundo atrás do médico, com contorno duplo deslocado. */
export function arco(c: Caixa, p: P = {}): Html {
  const cor = str(p, "cor", "var(--principal)"), duplo = p.contornoDuplo !== false, op = num(p, "opacidade", 1);
  const raio = `${c.w / 2}px ${c.w / 2}px 0 0`;
  return [
    abs(c, `background:${cor};border-radius:${raio};opacity:${op};`),
    duplo ? abs({ ...c, x: c.x - 22, y: c.y - 22, w: c.w + 44, h: c.h + 22 }, `border:2px solid ${cor};border-bottom:none;border-radius:${c.w / 2 + 22}px ${c.w / 2 + 22}px 0 0;opacity:${op * 0.55};`) : "",
  ].join("");
}

/* 14. Anéis orbitais: elipses finas concêntricas rotacionadas, na principal (20 a 50%). */
export function aneis(c: Caixa, p: P = {}): Html {
  const n = num(p, "quantidade", 3), op = num(p, "opacidade", 0.35), rot = num(p, "rotacao", -18);
  const els = Array.from({ length: n }, (_, i) => {
    const s = 1 - i * 0.18;
    return `<ellipse cx="50%" cy="50%" rx="${48 * s}%" ry="${20 * s}%" fill="none" stroke="var(--principal)" stroke-width="${2 - i * 0.4}" opacity="${op * (1 - i * 0.2)}"/>`;
  }).join("");
  return `<svg class="fx" style="position:absolute;${caixaCss(c)}overflow:visible;transform:rotate(${rot}deg);" width="${c.w}" height="${c.h}">${els}</svg>`;
}

/* 15. Fios de luz: curvas finas paralelas com degradê da principal (assinatura do nicho capilar). */
export function fiosDeLuz(c: Caixa, p: P = {}): Html {
  const n = num(p, "quantidade", 7), op = num(p, "opacidade", 0.6), sem = num(p, "semente", 11), amp = num(p, "amplitude", 0.22);
  const r = aleatorio(sem), id = `fio${sem}${c.x}${c.y}`.replace(/[^a-z0-9]/gi, "");
  const linhas = Array.from({ length: n }, (_, i) => {
    const y0 = c.h * (0.25 + i * 0.07 + r() * 0.03), y1 = c.h * (0.55 + i * 0.05 + r() * 0.05);
    const a = c.h * amp * (0.6 + r() * 0.6);
    return `<path d="M -40 ${y0} C ${c.w * 0.3} ${y0 - a}, ${c.w * 0.62} ${y1 + a}, ${c.w + 40} ${y1}" fill="none" stroke="url(#${id})" stroke-width="${(1.2 + r() * 1.6).toFixed(2)}" stroke-linecap="round"/>`;
  }).join("");
  return `<svg class="fx" style="position:absolute;${caixaCss(c)}overflow:visible;opacity:${op};filter:drop-shadow(0 0 6px rgb(var(--principal-rgb) / .6));" width="${c.w}" height="${c.h}"><defs><linearGradient id="${id}" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="var(--principal)" stop-opacity="0"/><stop offset=".35" stop-color="var(--principal-clara)"/><stop offset=".7" stop-color="var(--principal)"/><stop offset="1" stop-color="var(--principal)" stop-opacity="0"/></linearGradient></defs>${linhas}</svg>`;
}

/* 16. Partículas: pontos de luz desfocados (2 a 10 px) em profundidade. */
export function particulas(c: Caixa, p: P = {}): Html {
  const n = num(p, "quantidade", 26), sem = num(p, "semente", 5), op = num(p, "opacidade", 0.7);
  const r = aleatorio(sem);
  const pts = Array.from({ length: n }, () => {
    const s = 2 + r() * 8, x = r() * c.w, y = r() * c.h, b = s > 6 ? 2.5 : 0.6;
    return `<span style="position:absolute;left:${x.toFixed(1)}px;top:${y.toFixed(1)}px;width:${s.toFixed(1)}px;height:${s.toFixed(1)}px;border-radius:50%;background:var(--principal-clara);opacity:${(op * (0.35 + r() * 0.65)).toFixed(2)};filter:blur(${b}px);box-shadow:0 0 ${s * 2}px rgb(var(--principal-rgb) / .8);"></span>`;
  }).join("");
  return `<div class="fx" style="position:absolute;${caixaCss(c)}">${pts}</div>`;
}

/* 17. Desfoque de profundidade: elemento grande desfocado (8 a 20 px), cortado na borda. */
export function desfoqueProfundidade(c: Caixa, p: P = {}): Html {
  const blur = num(p, "desfoque", 14), url = str(p, "imagem", "");
  const fundo = url ? `background:url("${url}") center/contain no-repeat;` : `background:radial-gradient(circle at 35% 30%, var(--principal-clara) 0%, var(--principal) 45%, var(--principal-escura) 100%);border-radius:50%;`;
  return abs(c, `${fundo}filter:blur(${blur}px);opacity:${num(p, "opacidade", 0.85)};`);
}

/* 18. Moldura editorial: linha fina interna a 40 px da borda, 25% de opacidade. */
export function molduraEditorial(c: Caixa, p: P = {}): Html {
  const d = num(p, "distancia", 40), op = num(p, "opacidade", 0.25);
  return abs({ x: c.x + d, y: c.y + d, w: c.w - 2 * d, h: c.h - 2 * d, z: c.z }, `border:1.5px solid currentColor;opacity:${op};pointer-events:none;`);
}

/* 19. Carimbo: selo circular rotacionado (8 a 14 graus) com anel duplo. O texto é composto pelo código. */
export function carimbo(c: Caixa, p: P = {}): Html {
  const texto = str(p, "texto", "MITO"), cor = str(p, "cor", "var(--principal)"), rot = num(p, "rotacao", -11);
  const fonte = Math.round(c.w * 0.2);
  return `<div class="fx carimbo" style="position:absolute;${caixaCss(c)}transform:rotate(${rot}deg);color:${cor};">
<div style="position:absolute;inset:0;border:4px solid currentColor;border-radius:50%;"></div>
<div style="position:absolute;inset:14px;border:2px solid currentColor;border-radius:50%;"></div>
<div class="t" data-papel="rotulo" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:var(--f-texto);font-weight:var(--w-texto-forte);font-size:${fonte}px;letter-spacing:.08em;">${texto}</div></div>`;
}

/* 20. Duotom: mapeia a luminância da imagem para duas cores da ficha (fundo escuro e principal). Filtro SVG reutilizável. */
export function duotomFiltro(escuro: [number, number, number], claro: [number, number, number], id = "duotom"): Html {
  const t = (a: number, b: number) => `${(a / 255).toFixed(4)} ${(b / 255).toFixed(4)}`;
  return `<svg width="0" height="0" style="position:absolute"><filter id="${id}" color-interpolation-filters="sRGB"><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncR type="table" tableValues="${t(escuro[0], claro[0])}"/><feFuncG type="table" tableValues="${t(escuro[1], claro[1])}"/><feFuncB type="table" tableValues="${t(escuro[2], claro[2])}"/></feComponentTransfer></filter></svg>`;
}
export const duotom = (id = "duotom") => `filter:url(#${id});`;

/** Registro dos 20 efeitos (para testes e documentação). */
export const EFEITOS = [
  "atmosferaNoturna", "atmosferaEditorial", "atmosferaClinica", "atmosferaCor", "grao", "vinheta", "luzRecorte", "sombraContato", "vidro", "textoDegrade",
  "ecoContorno", "textoVazado", "arco", "aneis", "fiosDeLuz", "particulas", "desfoqueProfundidade", "molduraEditorial", "carimbo", "duotom",
] as const;
