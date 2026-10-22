/**
 * Sistema tipográfico (B3 e A3, item 10): escala por papel, entrelinha óptica, quebra balanceada,
 * algarismos alinhados, destaque com itálico da fonte de título na cor de destaque e ajuste automático (até 70%).
 */
import type { EstiloTexto } from "../plano.js";

export const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** *destaque* vira span.hl, _itálico_ vira em, \n quebra a linha. */
export function marcacao(s: string): string {
  return esc(s)
    .replace(/\*(.+?)\*/g, '<span class="hl">$1</span>')
    .replace(/_(.+?)_/g, "<em>$1</em>")
    .replace(/\\n|\n/g, "<br>");
}

/** Entrelinha óptica por papel (B3): títulos grandes de 0,9 a 1,0; corpo de 1,38 a 1,45. */
export const ENTRELINHA: Record<string, number> = { gigante: 0.86, numero: 0.82, titulo: 0.98, subtitulo: 1.15, corpo: 1.42, rotulo: 1.2, assinatura: 1.3 };

export function estiloTextoCss(papel: string, e: EstiloTexto, cor: string, destaque: string): string {
  const familia = e.fonte === "titulo" ? "var(--f-titulo)" : e.fonte === "destaque" ? "var(--f-destaque)" : "var(--f-texto)";
  const peso =
    e.fonte === "titulo"
      ? e.peso === "leve" ? "var(--w-titulo-leve)" : "var(--w-titulo-forte)"
      : e.peso === "forte" ? "var(--w-texto-forte)" : "var(--w-texto)";
  const lh = e.entrelinha ?? ENTRELINHA[papel] ?? 1.2;
  const quebra = papel === "corpo" || papel === "subtitulo" ? "text-wrap:pretty;" : papel === "rotulo" || papel === "assinatura" ? "" : "text-wrap:balance;";
  const nums = e.numeros === "alinhados" || papel === "numero" ? "font-variant-numeric:lining-nums tabular-nums;" : e.numeros === "proporcionais" ? "font-variant-numeric:lining-nums proportional-nums;" : "";
  const tracking = e.tracking || (papel === "rotulo" ? 0.18 : e.fonte === "titulo" && e.tamanho >= 110 ? -0.015 : 0);
  return [
    `font-family:${familia};font-weight:${peso};font-size:${e.tamanho}px;line-height:${lh};`,
    `letter-spacing:${tracking}em;color:${cor};--destaque:${destaque};`,
    e.italico ? "font-style:italic;" : "",
    e.caixaAlta || papel === "rotulo" ? "text-transform:uppercase;" : "",
    `text-align:${e.alinhar === "esquerda" ? "left" : e.alinhar === "direita" ? "right" : "center"};`,
    quebra,
    nums,
    e.sombra ? "text-shadow:0 2px 24px rgb(0 0 0 / .35);" : "",
  ].join("");
}

/**
 * Executado no navegador: ajuste automático. Reduz até caber (mínimo 70% do tamanho base, B3) e
 * registra em window.__AVISOS__ o texto que não coube. data-ajuste="caixa" (altura e largura) ou "largura".
 */
export const SCRIPT_AJUSTE = `(() => {
  const avisos = (window.__AVISOS__ = window.__AVISOS__ || []);
  document.querySelectorAll('[data-ajuste]').forEach((el) => {
    const modo = el.dataset.ajuste;
    if (modo === 'nenhum') return;
    const base = parseFloat(el.dataset.base);
    const minimo = base * 0.7;
    let tam = base;
    // largura: uma linha só (nowrap) e reduz até caber na largura. caixa: mede a altura das linhas (.tx), não a tinta
    // dos glifos, que em serifas de ascendente alto passa alguns px da caixa de linha sem ser texto cortado.
    if (modo === 'largura') el.style.whiteSpace = 'nowrap';
    const tx = el.querySelector('.tx') || el;
    const estoura = () => el.scrollWidth > el.clientWidth + 1 || (modo === 'caixa' && tx.offsetHeight > el.clientHeight + 2);
    let guarda = 0;
    while (estoura() && tam > minimo && guarda++ < 120) { tam -= Math.max(1, base * 0.01); el.style.fontSize = tam + 'px'; }
    if (estoura()) avisos.push({ regra: 'texto-nao-coube', tela: +el.closest('[data-tela]').dataset.tela, texto: el.innerText.slice(0, 60) });
    el.dataset.final = String(Math.round(tam));
  });
  window.__AJUSTE_OK__ = true;
})();`;

/** Ícones de linha (herdam a cor). Mesma família visual em todo o motor (B7, item 3). */
export const ICONES: Record<string, string> = {
  check: '<path d="M14 25l7 7 14-15"/>',
  curtir: '<path d="M24 41S6 30 6 17a9 9 0 0 1 18-3 9 9 0 0 1 18 3c0 13-18 24-18 24z"/>',
  comentar: '<path d="M42 23a18 16 0 0 1-26 14l-9 3 3-8A18 16 0 1 1 42 23z"/>',
  enviar: '<path d="M43 6L5 21l15 6 6 15z"/><path d="M20 27l23-21"/>',
  salvar: '<path d="M12 6h24v36l-12-9-12 9z"/>',
  calendario: '<rect x="6" y="10" width="36" height="32" rx="5"/><path d="M6 20h36M16 5v10M32 5v10"/>',
  local: '<path d="M24 44s14-13 14-25a14 14 0 0 0-28 0c0 12 14 25 14 25z"/><circle cx="24" cy="19" r="5"/>',
  whatsapp: '<path d="M8 40l3-9a16 16 0 1 1 6 6z"/><path d="M18 17c0 7 6 13 13 13l3-3-5-3-2 2c-2-1-4-3-5-5l2-2-3-5z"/>',
  seta: '<path d="M6 24h34M30 12l12 12-12 12"/>',
  aspas: '<path d="M8 34c0-10 4-16 12-20l2 3c-4 3-6 6-6 9h6v10H8zm20 0c0-10 4-16 12-20l2 3c-4 3-6 6-6 9h6v10H28z" fill="currentColor" stroke="none"/>',
  interrogacao: '<path d="M17 17a7 7 0 1 1 10 6c-2 1-3 3-3 5v2M24 36v1"/>',
};
/**
 * Ilustrações de linha (viewBox 200 × 200, traço fino): mesma linguagem dos ícones, para explicar conceitos sem
 * imagem gerada. il_doadora: cabeça de perfil, área doadora (nuca e laterais), caminho dos fios e área que recebe.
 */
export const ILUSTRACOES: Record<string, string> = {
  il_doadora: [
    // cabeça de perfil olhando para a direita, recortada no pescoço
    '<path d="M80 184C68 166 50 148 46 120C40 78 66 38 110 32C150 28 178 56 178 92C178 100 176 106 180 114L190 132C192 136 190 138 186 138L180 138C182 144 182 148 178 150C182 154 180 160 174 161C170 172 158 176 145 173L141 184"/>',
    // orelha
    '<path d="M104 100c-8-5-15 1-14 9 1 7 6 12 12 11"/>',
    // área doadora: fios curtos na nuca e laterais, dentro do contorno
    ...Array.from({ length: 8 }, (_, i) => { const y = 98 + i * 7.5, x = 58 + Math.abs(i - 3.5) * 1.2; return `<path d="M${x.toFixed(1)} ${y}l8 -3M${(x + 12).toFixed(1)} ${y + 1.5}l8 -3" stroke-width="3"/>`; }),
    // caminho dos fios: da nuca para a linha da testa
    '<path d="M66 94C60 50 108 22 152 42" stroke-dasharray="1.5 8" stroke-width="2.8"/>',
    '<path d="M141 33l13 10-15 6"/>',
    // área que recebe: pontos na linha da testa
    '<circle cx="157" cy="51" r="2.6" fill="currentColor"/><circle cx="165" cy="59" r="2.6" fill="currentColor"/><circle cx="170" cy="69" r="2.4" fill="currentColor"/><circle cx="163" cy="48" r="2" fill="currentColor"/><circle cx="170" cy="57" r="2" fill="currentColor"/>',
  ].join(""),
};
export const iconeSvg = (nome: string) =>
  ILUSTRACOES[nome]
    ? `<svg viewBox="0 0 200 200" style="width:100%;height:100%;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round;overflow:visible;">${ILUSTRACOES[nome]}</svg>`
    : `<svg viewBox="0 0 48 48" style="width:100%;height:100%;fill:none;stroke:currentColor;stroke-width:2.6;stroke-linecap:round;stroke-linejoin:round;">${ICONES[nome] ?? ICONES.check}</svg>`;
