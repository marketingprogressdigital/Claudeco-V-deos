/**
 * Provedor de RASCUNHO: sem chave (ou com a IA desabilitada), gera versões provisórias locais de cada cena
 * da biblioteca, em SVG, com as cores da ficha. Servem para validar composição e camadas; a entrega
 * fica marcada como RASCUNHO em todas as telas e nunca como pronta (SKILL.md, seção 7.4).
 */
import sharp from "sharp";
import type { Ficha } from "../ficha.js";
import { aleatorio } from "../composicao/efeitos.js";
import type { ImagemGerada, PedidoResolvido, Provedor } from "./provedor.js";

const DIM: Record<string, [number, number]> = { "1:1": [1200, 1200], "4:5": [1200, 1500], "9:16": [1080, 1920], "3:4": [1200, 1600], "16:9": [1920, 1080] };

function svgCena(cena: string, w: number, h: number, c: Ficha["cores"], semente: number, corCampanha?: string): string {
  const r = aleatorio(semente);
  const defs = `<defs>
<radialGradient id="g1" cx="38%" cy="32%" r="70%"><stop offset="0" stop-color="#ffffff" stop-opacity=".95"/><stop offset=".25" stop-color="${c.principal}" stop-opacity=".85"/><stop offset=".75" stop-color="${c.principal}" stop-opacity=".35"/><stop offset="1" stop-color="${c.fundoEscuro}" stop-opacity=".9"/></radialGradient>
<linearGradient id="fio" x1="0" x2="1"><stop offset="0" stop-color="${c.principal}" stop-opacity="0"/><stop offset=".5" stop-color="${c.principal}"/><stop offset="1" stop-color="${c.fundoClaro}" stop-opacity=".2"/></linearGradient>
<filter id="b8"><feGaussianBlur stdDeviation="8"/></filter><filter id="b30"><feGaussianBlur stdDeviation="30"/></filter><filter id="b60"><feGaussianBlur stdDeviation="60"/></filter>
</defs>`;
  const fundoEscuro = `<rect width="${w}" height="${h}" fill="${c.fundoEscuro}"/>`;
  const esfera = (cx: number, cy: number, rr: number) =>
    `<circle cx="${cx}" cy="${cy}" r="${rr}" fill="url(#g1)"/><ellipse cx="${cx - rr * 0.3}" cy="${cy - rr * 0.38}" rx="${rr * 0.32}" ry="${rr * 0.16}" fill="#fff" opacity=".55" filter="url(#b8)"/><ellipse cx="${cx}" cy="${cy + rr * 1.05}" rx="${rr * 0.8}" ry="${rr * 0.12}" fill="#000" opacity=".25" filter="url(#b30)"/>`;
  const fios = (n: number, op = 0.75) =>
    Array.from({ length: n }, (_, i) => {
      const y0 = h * (0.05 + (i / n) * 0.9), a = h * (0.12 + r() * 0.2);
      return `<path d="M -50 ${y0} C ${w * 0.3} ${y0 - a}, ${w * 0.65} ${y0 + a}, ${w + 50} ${y0 + (r() - 0.5) * a}" stroke="url(#fio)" stroke-width="${1 + r() * 3.5}" fill="none" opacity="${op * (0.4 + r() * 0.6)}"/>`;
    }).join("");
  const bokeh = (n: number) => Array.from({ length: n }, () => `<circle cx="${r() * w}" cy="${r() * h}" r="${20 + r() * 120}" fill="${r() > 0.5 ? c.principal : c.fundoClaro}" opacity="${0.08 + r() * 0.22}" filter="url(#b30)"/>`).join("");
  switch (cena) {
    case "ELEMENTO_ESFERA":
      return `${defs}${esfera(w / 2, h * 0.45, Math.min(w, h) * 0.34)}`;
    case "ELEMENTO_GOTA": {
      const cx = w / 2, cy = h * 0.55, rr = Math.min(w, h) * 0.26;
      return `${defs}<path d="M ${cx} ${cy - rr * 2} C ${cx + rr * 0.4} ${cy - rr}, ${cx + rr} ${cy - rr * 0.2}, ${cx + rr} ${cy + rr * 0.25} A ${rr} ${rr} 0 0 1 ${cx - rr} ${cy + rr * 0.25} C ${cx - rr} ${cy - rr * 0.2}, ${cx - rr * 0.4} ${cy - rr}, ${cx} ${cy - rr * 2} Z" fill="url(#g1)"/><ellipse cx="${cx - rr * 0.35}" cy="${cy}" rx="${rr * 0.18}" ry="${rr * 0.35}" fill="#fff" opacity=".5" filter="url(#b8)"/>`;
    }
    case "ELEMENTO_FOLICULO": {
      const cx = w * 0.5, base = h * 0.8;
      return `${defs}<path d="M ${cx} ${h * 0.05} C ${cx + 30} ${h * 0.3}, ${cx - 30} ${h * 0.5}, ${cx} ${base - 120}" stroke="${c.principal}" stroke-width="18" fill="none" stroke-linecap="round"/><ellipse cx="${cx}" cy="${base - 60}" rx="${w * 0.12}" ry="${h * 0.09}" fill="url(#g1)"/><ellipse cx="${cx}" cy="${base - 40}" rx="${w * 0.2}" ry="${h * 0.16}" fill="none" stroke="${c.fundoClaro}" stroke-opacity=".45" stroke-width="4"/><ellipse cx="${cx}" cy="${base - 40}" rx="${w * 0.27}" ry="${h * 0.22}" fill="${c.principal}" fill-opacity=".08" stroke="${c.fundoClaro}" stroke-opacity=".25" stroke-width="2"/>`;
    }
    case "TEXTURA_FIOS":
      return `${defs}${fundoEscuro}${fios(70, 0.9)}`;
    case "CENA_MACRO_TEMA":
      return `${defs}<rect width="${w}" height="${h}" fill="${c.fundoClaro}"/>${Array.from({ length: 160 }, () => {
        const x = r() * w, y = r() * h;
        return `<circle cx="${x}" cy="${y}" r="${3 + r() * 4}" fill="${c.fundoEscuro}" opacity=".35"/><path d="M ${x} ${y} q ${20 + r() * 40} ${-60 - r() * 80} ${60 + r() * 60} ${-120 - r() * 60}" stroke="${c.fundoEscuro}" stroke-opacity=".55" stroke-width="2.4" fill="none"/>`;
      }).join("")}`;
    case "ELEMENTO_CIENCIA": {
      const pts = Array.from({ length: 22 }, (_, i) => {
        const t = i / 21, x = w * (0.15 + t * 0.7), y = h * (0.85 - t * 0.7), dx = Math.sin(t * Math.PI * 4) * w * 0.12;
        return `${esfera(x + dx, y, 22)}${esfera(x - dx, y + 10, 22)}<line x1="${x + dx}" y1="${y}" x2="${x - dx}" y2="${y + 10}" stroke="${c.principal}" stroke-opacity=".5" stroke-width="3"/>`;
      }).join("");
      return `${defs}${fundoEscuro}${bokeh(18)}${pts}`;
    }
    case "ELEMENTO_TABLET":
      return `${defs}${fundoEscuro}<g transform="translate(${w * 0.18} ${h * 0.18}) rotate(-8)"><rect width="${w * 0.64}" height="${h * 0.66}" rx="38" fill="#1d1d1f"/><rect x="26" y="26" width="${w * 0.64 - 52}" height="${h * 0.66 - 52}" rx="16" fill="#f6f6f4"/></g>`;
    case "CENA_LACO": {
      const cor = corCampanha ?? c.principal;
      return `${defs}<rect width="${w}" height="${h}" fill="${c.fundoClaro}"/>${bokeh(10)}<path d="M ${w * 0.38} ${h * 0.86} L ${w * 0.56} ${h * 0.42} C ${w * 0.62} ${h * 0.26}, ${w * 0.6} ${h * 0.14}, ${w * 0.5} ${h * 0.14} C ${w * 0.4} ${h * 0.14}, ${w * 0.38} ${h * 0.26}, ${w * 0.44} ${h * 0.4} L ${w * 0.62} ${h * 0.86}" stroke="${cor}" stroke-width="${w * 0.08}" fill="none" stroke-linejoin="round"/>`;
    }
    case "ELEMENTO_CALENDARIO":
      return `${defs}<g transform="translate(${w * 0.2} ${h * 0.2}) rotate(-6)"><rect width="${w * 0.6}" height="${h * 0.55}" rx="24" fill="${c.fundoClaro}" stroke="${c.principal}" stroke-width="6"/><rect width="${w * 0.6}" height="${h * 0.12}" rx="24" fill="${c.principal}"/></g>`;
    case "ELEMENTO_MECANISMO":
      return `${defs}<rect width="${w}" height="${h}" fill="${c.fundoClaro}"/>${[0.35, 0.55, 0.75].map((y, i) => `<rect y="${h * y}" width="${w}" height="${h * 0.2}" fill="${c.principal}" opacity="${0.12 + i * 0.1}"/>`).join("")}${[0.2, 0.45, 0.7].map((x, i) => `<path d="M ${w * x} ${h * 0.2} L ${w * x} ${h * (0.55 + i * 0.1)}" stroke="${c.fundoEscuro}" stroke-width="10" stroke-linecap="round"/><ellipse cx="${w * x}" cy="${h * (0.58 + i * 0.1)}" rx="${w * 0.04}" ry="${h * 0.04}" fill="url(#g1)"/>`).join("")}`;
    default:
      // CENA_CONSULTORIO, CENA_TEMA e outras: cena desfocada com janela de luz e bokeh
      return `${defs}${fundoEscuro}<rect x="${w * 0.55}" y="${h * 0.05}" width="${w * 0.35}" height="${h * 0.6}" fill="${c.fundoClaro}" opacity=".35" filter="url(#b60)"/>${bokeh(26)}<rect y="${h * 0.72}" width="${w}" height="${h * 0.28}" fill="${c.apoio}" opacity=".35" filter="url(#b30)"/>`;
  }
}

export class RascunhoProvedor implements Provedor {
  readonly nome = "rascunho";
  readonly modelo = "svg-local";
  readonly provisorio = true;
  constructor(private cores: Ficha["cores"], private corCampanha?: string) {}
  async gerar(p: PedidoResolvido): Promise<ImagemGerada[]> {
    const [w, h] = DIM[p.proporcao] ?? [1200, 1500];
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${svgCena(p.cena, w, h, this.cores, p.semente ?? 3, this.corCampanha)}</svg>`;
    const png = await sharp(Buffer.from(svg)).png().toBuffer();
    return [{ png, provedor: this.nome, modelo: this.modelo, custoEstimadoUSD: 0 }];
  }
}
