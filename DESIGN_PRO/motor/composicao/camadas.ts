/**
 * Composição (A3, item 8): plano + ficha → HTML com camadas absolutas e variáveis de cor da ficha.
 * O carrossel é uma faixa única (1080 × número de telas): elementos contínuos usam coordenadas da faixa
 * e são desenhados recortados em cada tela, garantindo continuidade perfeita (A3, item 11).
 */
import path from "node:path";
import { contrastRatio, parseColor } from "../infra/contrast.js";
import { misturar, type FichaCarregada } from "../ficha.js";
import { DIMENSOES, type Camada, type Caixa, type Plano, type Tela, type TokenCor } from "../plano.js";
import * as fx from "./efeitos.js";
import { esc, estiloTextoCss, iconeSvg, marcacao, SCRIPT_AJUSTE } from "./tipografia.js";

export type Ativos = {
  /** URL (relativa ao HTML) de cada camada de imagem: chave = "t<tela>c<camada>" */
  imagens: Record<string, string>;
  logo?: { claro?: string; escuro?: string; principal?: string };
  /** URL de cada arquivo de fonte, na mesma ordem de FichaCarregada.fontes */
  fontes: { titulo: string[]; texto: string[]; destaque: string[] };
};

export type OpcoesHtml = { rascunho: boolean; motivoRascunho?: string };

const rgb = (hex: string) => {
  const c = parseColor(hex);
  return `${c.r} ${c.g} ${c.b}`;
};

/** Cor de fundo efetiva de cada tipo de tela. */
export function corDoFundo(fundo: Tela["fundo"], f: FichaCarregada): string {
  const c = f.derivadas.cores;
  return fundo === "claro" ? c.fundoClaro : fundo === "suave" ? misturar(c.fundoClaro, c.principal, 0.12) : fundo === "principal" ? c.principal : c.fundoEscuro;
}

/** Texto e destaque ideais para o fundo da tela (por contraste WCAG). */
export function coresDaTela(fundo: Tela["fundo"], f: FichaCarregada) {
  const c = f.derivadas.cores;
  const bg = corDoFundo(fundo, f);
  const texto = contrastRatio(c.textoSobreClaro, bg) >= contrastRatio(c.textoSobreEscuro, bg) ? c.textoSobreClaro : c.textoSobreEscuro;
  let destaque = c.principal;
  if (fundo === "principal") destaque = texto;
  else {
    // principal, ou o tom dela deslocado na direção do texto até atingir 3:1 (destaque é sempre texto grande ou forte)
    for (let t = 0.08; contrastRatio(destaque, bg) < 3 && t <= 0.8; t += 0.06) destaque = misturar(c.principal, texto, t);
  }
  return { bg, texto, destaque };
}

let corCampanhaAtual: string | undefined;
function resolverCor(tok: TokenCor, f: FichaCarregada, tela: ReturnType<typeof coresDaTela>): string {
  const d = f.derivadas;
  if (tok === "textoSobrePrincipal") return d.textoSobre.principal;
  if (tok === "campanha") return corCampanhaAtual ?? d.cores.principal;
  if (tok === "textoAuto") return tela.texto;
  if (tok === "destaqueAuto") return tela.destaque;
  if (tok === "principalClara") return d.principalClara;
  if (tok === "principalEscura") return d.principalEscura;
  return d.cores[tok];
}

function faceCss(familia: string, urls: string[], arquivos: string[]): string {
  return urls
    .map((u, i) => {
      const nome = path.basename(arquivos[i] ?? "");
      const m = /_(\d{3})_(normal|italic)\./.exec(nome) ?? /-(\d{3})-(normal|italic)\./.exec(nome);
      const peso = m ? m[1] : "100 900";
      const estilo = m ? m[2] : /italic/i.test(nome) ? "italic" : "normal";
      return `@font-face{font-family:'${familia}';src:url("${u}");font-weight:${peso};font-style:${estilo};font-display:block;}`;
    })
    .join("\n");
}

function mascaraCss(m?: { forma: string; raio?: number }, caixa?: Caixa): string {
  if (!m || !caixa) return "";
  if (m.forma === "circulo") return "border-radius:50%;";
  if (m.forma === "elipse") return "border-radius:50%/50%;";
  if (m.forma === "arco") return `border-radius:${caixa.w / 2}px ${caixa.w / 2}px 0 0;`;
  return `border-radius:${m.raio ?? 0}px;`;
}

function imagemHtml(url: string | undefined, c: Caixa, t: { desfoque: number; opacidade: number; pb: boolean; duotom: boolean; ajuste: string; tingimento: number; foco?: [number, number] }, mascara: string, corTela: string, extraCls = ""): string {
  const filtros = [t.desfoque ? `blur(${t.desfoque}px)` : "", t.pb ? "grayscale(1) contrast(1.08)" : ""].filter(Boolean).join(" ");
  const pos = t.foco ? `${t.foco[0] * 100}% ${t.foco[1] * 100}%` : "center";
  const img = url
    ? `<img src="${url}" style="width:100%;height:100%;object-fit:${t.ajuste === "conter" ? "contain" : "cover"};object-position:${pos};${filtros ? `filter:${filtros};` : ""}${t.duotom ? fx.duotom() : ""}"/>`
    : "";
  const tinta = t.tingimento > 0 && !t.duotom ? `<div style="position:absolute;inset:0;background:${corTela};mix-blend-mode:color;opacity:${t.tingimento};"></div>` : "";
  return `<div class="img ${extraCls}" style="position:absolute;${fx.caixaCss(c)}overflow:hidden;opacity:${t.opacidade};${mascara}">${img}${tinta}</div>`;
}

function camadaHtml(cam: Camada, ti: number, ci: number, f: FichaCarregada, ativos: Ativos, telaCores: ReturnType<typeof coresDaTela>, W: number, H: number, tela: Tela): string {
  const full: Caixa = { x: 0, y: 0, w: W, h: H, z: 0 };
  const chave = `t${ti}c${ci}`;
  switch (cam.tipo) {
    case "atmosfera": {
      const p = { focoX: cam.focoLuz[0], focoY: cam.focoLuz[1], intensidade: cam.intensidade };
      return cam.estilo === "noturno" ? fx.atmosferaNoturna(full, p) : cam.estilo === "editorial" ? fx.atmosferaEditorial(full, p) : cam.estilo === "clinico" ? fx.atmosferaClinica(full, p) : fx.atmosferaCor(full, p);
    }
    case "imagemGerada":
    case "foto":
      return imagemHtml(ativos.imagens[chave], cam.caixa, cam.tratamento, mascaraCss(cam.mascara, cam.caixa), telaCores.bg, cam.tipo === "foto" ? "foto" : "gerada");
    case "fotoMedico": {
      const url = ativos.imagens[chave];
      const s = cam.integracao.sombraContato;
      const sombra = fx.sombraContato({ x: cam.caixa.x + cam.caixa.w * 0.12, y: cam.caixa.y + cam.caixa.h - 50, w: cam.caixa.w * 0.76, h: 90, z: cam.caixa.z - 1 }, { opacidade: s });
      const img = url ? `<img src="${url}" style="width:100%;height:100%;object-fit:contain;object-position:bottom center;"/>` : "";
      return `${sombra}<div class="medico" data-plano="${cam.plano}" style="position:absolute;${fx.caixaCss(cam.caixa)}">${img}</div>`;
    }
    case "texto": {
      const e = cam.estilo;
      const cor = resolverCor(e.cor, f, telaCores);
      const destaque = resolverCor(e.corDestaque, f, telaCores);
      let estilo = estiloTextoCss(cam.papel, e, cor, destaque);
      if (e.efeitos.includes("degrade")) estilo += fx.textoDegrade();
      if (e.efeitos.includes("contorno")) estilo += `color:transparent;-webkit-text-stroke:2.5px ${destaque};`;
      if (e.efeitos.includes("vazado")) {
        const img = Object.entries(ativos.imagens).find(([k]) => k.startsWith(`t${ti}c`))?.[1];
        if (img) estilo += fx.textoVazado(img);
      }
      const html = marcacao(cam.conteudo);
      const flex = `display:flex;flex-direction:column;justify-content:${e.vertical === "meio" ? "center" : e.vertical === "base" ? "flex-end" : "flex-start"};`;
      const corpo = `<div class="t" data-papel="${cam.papel}" data-ajuste="${e.ajuste}" data-base="${e.tamanho}" style="position:absolute;${fx.caixaCss(cam.caixa)}${estilo}${flex}overflow:hidden;"><span class="tx">${html}</span></div>`;
      const eco = e.efeitos.includes("eco") ? fx.ecoContorno(`<span class="tx">${html}</span>`, cam.caixa, estiloTextoCss(cam.papel, e, cor, destaque) + flex) : "";
      return eco + corpo;
    }
    case "forma": {
      const cor = resolverCor(cam.cor, f, telaCores);
      const c = cam.caixa;
      if (cam.forma === "arco") return fx.arco(c, { cor, contornoDuplo: cam.contornoDuplo, opacidade: cam.opacidade });
      if (cam.forma === "anel") return `<div class="fx" style="position:absolute;${fx.caixaCss(c)}border:2px solid ${cor};border-radius:50%;opacity:${cam.opacidade};"></div>`;
      if (cam.forma === "circulo") return `<div class="fx" style="position:absolute;${fx.caixaCss(c)}${cam.preenchida ? `background:${cor};` : `border:2px solid ${cor};`}border-radius:50%;opacity:${cam.opacidade};"></div>`;
      if (cam.forma === "moldura") return `<div class="fx" style="position:absolute;${fx.caixaCss(c)}border:1.5px solid ${cor};opacity:${cam.opacidade};"></div>`;
      return `<div class="fx" style="position:absolute;${fx.caixaCss(c)}background:${cor};opacity:${cam.opacidade};border-radius:${cam.forma === "linha" ? c.h / 2 : 0}px;"></div>`;
    }
    case "vidro":
      return fx.vidro(cam.caixa, { sobre: cam.sobre });
    case "veu": {
      const cor = rgb(resolverCor(cam.cor, f, telaCores));
      const dir = { baixo: "180deg", cima: "0deg", esquerda: "270deg", direita: "90deg" }[cam.direcao];
      return `<div class="fx veu" style="position:absolute;${fx.caixaCss(cam.caixa)}background:linear-gradient(${dir}, rgb(${cor} / ${cam.de}) 0%, rgb(${cor} / ${cam.ate}) 72%, rgb(${cor} / ${cam.ate}) 100%);"></div>`;
    }
    case "icone": {
      const cor = resolverCor(cam.cor, f, telaCores);
      const fundo = cam.circulo === "cheio" ? `background:${cor};color:${telaCores.texto === cor ? telaCores.bg : contrastRatio(f.derivadas.cores.textoSobreEscuro, cor) > contrastRatio(f.derivadas.cores.textoSobreClaro, cor) ? f.derivadas.cores.textoSobreEscuro : f.derivadas.cores.textoSobreClaro};border-radius:50%;padding:${cam.caixa.w * 0.22}px;` : cam.circulo === "vidro" ? `background:rgb(255 255 255 / .12);border:1.5px solid rgb(255 255 255 / .25);border-radius:50%;padding:${cam.caixa.w * 0.24}px;color:${cor};backdrop-filter:blur(18px);` : `color:${cor};`;
      return `<div class="fx icone" style="position:absolute;${fx.caixaCss(cam.caixa)}${fundo}box-sizing:border-box;">${iconeSvg(cam.nome)}</div>`;
    }
    case "logo": {
      const escuro = tela.fundo === "escuro" || tela.fundo === "imagem" || tela.fundo === "principal";
      const propria = tela.fundo === "principal" ? ativos.logo?.principal : undefined;
      const url = propria ?? (escuro ? ativos.logo?.escuro ?? ativos.logo?.claro : ativos.logo?.claro ?? ativos.logo?.escuro);
      if (url) return `<img class="logo${propria ? " propria" : ""}" src="${url}" style="position:absolute;${fx.caixaCss(cam.caixa)}object-fit:contain;object-position:left center;"/>`;
      const ini = f.ficha.logo.monograma ?? f.ficha.medico.nome.split(/\s+/).filter(Boolean).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
      return `<div class="logo monograma t" data-papel="rotulo" data-ajuste="nenhum" style="position:absolute;${fx.caixaCss(cam.caixa)}border:2px solid ${telaCores.texto};color:${telaCores.texto};border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:var(--f-titulo);font-weight:var(--w-titulo-forte);font-size:${Math.round(cam.caixa.h * 0.42)}px;">${esc(ini)}</div>`;
    }
    case "efeito": {
      const c = cam.caixa ?? full;
      const p = cam.parametros;
      const mapa: Record<string, (c: Caixa, p: Record<string, string | number | boolean>) => string> = {
        atmosferaNoturna: fx.atmosferaNoturna, atmosferaEditorial: fx.atmosferaEditorial, atmosferaClinica: fx.atmosferaClinica, atmosferaCor: fx.atmosferaCor,
        grao: fx.grao, vinheta: fx.vinheta, luzRecorte: fx.luzRecorte, sombraContato: fx.sombraContato, vidro: fx.vidro, arco: fx.arco, aneis: fx.aneis,
        fiosDeLuz: fx.fiosDeLuz, particulas: fx.particulas, desfoqueProfundidade: fx.desfoqueProfundidade, molduraEditorial: fx.molduraEditorial, carimbo: fx.carimbo,
      };
      const fn = mapa[cam.efeito];
      return fn ? fn(c, p) : "";
    }
  }
}

/** Gera o documento HTML completo da faixa. */
export function montarHtml(plano: Plano, f: FichaCarregada, ativos: Ativos, op: OpcoesHtml): { html: string; largura: number; altura: number } {
  const { w: W, h: H } = DIMENSOES[plano.formato];
  corCampanhaAtual = plano.corCampanha;
  const d = f.derivadas;
  const c = d.cores;
  const fic = f.ficha;
  const vars = [
    ["principal", c.principal], ["apoio", c.apoio], ["fundo-claro", c.fundoClaro], ["fundo-escuro", c.fundoEscuro],
    ["texto-sobre-claro", c.textoSobreClaro], ["texto-sobre-escuro", c.textoSobreEscuro], ["acento", c.acento],
    ["principal-clara", d.principalClara], ["principal-escura", d.principalEscura],
  ].map(([k, v]) => `--${k}:${v};--${k}-rgb:${rgb(v!)};`).join("");
  const fontes = [
    faceCss(fic.fontes.titulo.familia, ativos.fontes.titulo, f.fontes.titulo),
    faceCss(fic.fontes.texto.familia, ativos.fontes.texto, f.fontes.texto),
    fic.fontes.destaque ? faceCss(fic.fontes.destaque.familia, ativos.fontes.destaque, f.fontes.destaque) : "",
  ].join("\n");
  const ff = (fam: string, gen: string) => `'${fam}', ${gen}`;
  const css = `
${fontes}
:root{${vars}--raio:${fic.estilo.raio}px;--f-titulo:${ff(fic.fontes.titulo.familia, "Georgia, serif")};--f-texto:${ff(fic.fontes.texto.familia, "Arial, sans-serif")};--f-destaque:${ff(fic.fontes.destaque?.familia ?? fic.fontes.titulo.familia, "Georgia, serif")};--w-titulo-forte:${fic.fontes.titulo.pesoForte};--w-titulo-leve:${fic.fontes.titulo.pesoLeve};--w-texto:${fic.fontes.texto.pesoNormal};--w-texto-forte:${fic.fontes.texto.pesoForte};}
*{box-sizing:border-box;margin:0;padding:0;}
html,body{background:#000;}
body{-webkit-font-smoothing:antialiased;text-rendering:geometricPrecision;width:${W * plano.telas.length}px;height:${H}px;position:relative;overflow:hidden;}
.tela{position:absolute;top:0;width:${W}px;height:${H}px;overflow:hidden;isolation:isolate;}
.t .hl{color:var(--destaque);${fic.fontes.titulo.temItalico ? "font-family:var(--f-titulo);font-style:italic;" : ""}}
.t em{font-style:italic;}
.t[data-papel=corpo] .hl,.t[data-papel=rotulo] .hl,.t[data-papel=assinatura] .hl{font-family:inherit;font-style:normal;font-weight:var(--w-texto-forte);}
.marca-texto .t .hl{color:inherit!important;background:linear-gradient(transparent 56%, rgb(var(--principal-rgb) / .62) 56%, rgb(var(--principal-rgb) / .62) 92%, transparent 92%);-webkit-box-decoration-break:clone;box-decoration-break:clone;padding:0 .06em;}
section[data-fundo=principal] img.logo:not(.propria){filter:brightness(0);opacity:.72;}
.t .tx{display:block;}
.rascunho{position:absolute;left:0;right:0;top:0;height:34px;z-index:999;background:repeating-linear-gradient(135deg,#F2C14E 0 18px,#E8B23A 18px 36px);color:#1F1A0E;font:700 19px/34px Arial,sans-serif;letter-spacing:.14em;text-transform:uppercase;text-align:center;white-space:nowrap;}
body.sem-texto .t, body.sem-texto .t *, body.sem-texto .eco{color:transparent!important;-webkit-text-stroke:0!important;background:none!important;text-shadow:none!important;border-color:transparent!important;}
body.sem-texto .rascunho{visibility:hidden;}
body.sem-medico .medico{visibility:hidden;}
@page{size:${W}px ${H}px;margin:0;}
@media print{body{width:${W}px;height:auto;overflow:visible;}.tela{position:relative;left:0!important;break-after:page;}}
`;
  const tom = (h: string): [number, number, number] => {
    const x = parseColor(h);
    return [x.r, x.g, x.b];
  };
  const duo = fx.duotomFiltro(tom(c.fundoEscuro), tom(c.principal));
  const telas = plano.telas
    .map((tela, ti) => {
      const cores = coresDaTela(tela.fundo, f);
      const camadas = tela.camadas.map((cam, ci) => camadaHtml(cam, ti, ci, f, ativos, cores, W, H, tela)).join("\n");
      const cont = plano.continuidade
        .filter((e) => ti + 1 >= e.telas[0] && ti + 1 <= e.telas[1])
        .map((e) => {
          const cx = { ...e.caixa, x: e.caixa.x - ti * W };
          const p = e.parametros;
          if (e.efeito === "fiosDeLuz") return fx.fiosDeLuz(cx, p);
          if (e.efeito === "aneis") return fx.aneis(cx, p);
          if (e.efeito === "linha") return `<div class="fx" style="position:absolute;${fx.caixaCss(cx)}background:var(--principal);opacity:${p.opacidade ?? 0.5};"></div>`;
          if (e.efeito === "palavra") return `<div class="fx palavra-continua" style="position:absolute;${fx.caixaCss(cx)}font-family:var(--f-titulo);font-weight:var(--w-titulo-forte);font-size:${p.tamanho ?? 520}px;line-height:1;white-space:nowrap;color:${cores.texto};opacity:${p.opacidade ?? 0.06};text-transform:uppercase;">${esc(String(p.texto ?? ""))}</div>`;
          if (e.efeito === "imagem") return `<img class="fx" src="${p.url}" style="position:absolute;${fx.caixaCss(cx)}object-fit:contain;opacity:${p.opacidade ?? 1};"/>`;
          return "";
        })
        .join("\n");
      const marca = op.rascunho ? `<div class="rascunho">Rascunho · ${esc(op.motivoRascunho ?? "não publicar")}</div>` : "";
      const marcaTexto = fic.estilo.destaqueFraco === "marcaTexto" && tela.fundo !== "principal" && contrastRatio(c.principal, cores.bg) < 3;
      return `<section class="tela${marcaTexto ? " marca-texto" : ""}" data-tela="${ti + 1}" data-fundo="${tela.fundo}" style="left:${ti * W}px;background:${cores.bg};color:${cores.texto};--rumo:${contrastRatio("#FFFFFF", cores.bg) > contrastRatio("#000000", cores.bg) ? "white" : "black"};">\n${camadas}\n${cont}\n${marca}\n</section>`;
    })
    .join("\n");
  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="generator" content="DESIGN PRO"><title>Plano ${plano.modelo}${plano.variacao}</title><style>${css}</style></head><body>${duo}\n${telas}\n<script>document.fonts.ready.then(()=>{${SCRIPT_AJUSTE}})</script></body></html>`;
  return { html, largura: W * plano.telas.length, altura: H };
}
