/**
 * Pipeline de um post (A3): pedido → roteiro validado → plano → imagens (cache) → médico recortado e integrado
 * → HTML → render → checagens no PNG → pós-produção → PNG, JPG, PDF, plano, legenda e relatório.
 * Nada aqui chama API de imagem sem chave no .env E "habilitado": true em imagem.json (imagem/escolha.ts).
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import type { Browser } from "playwright";
import { checar, type Resultado } from "./checagem.js";
import { montarHtml, type Ativos } from "./composicao/camadas.js";
import { carregarFicha, type FichaCarregada } from "./ficha.js";
import { escolherProvedor } from "./imagem/escolha.js";
import { montarPrompt } from "./imagem/prompts.js";
import { gerarComCache, type Registro } from "./imagem/provedor.js";
import { PASTAS, rel } from "./infra/caminhos.js";
import { UserError } from "./infra/errors.js";
import { sha256 } from "./infra/fs.js";
import { finalizePdf } from "./infra/pdf.js";
import { estatisticasRegiao, integrar, type ResultadoIntegracao } from "./medico/integracao.js";
import { recortar } from "./medico/recorte.js";
import { gerarPlano } from "./modelos/index.js";
import { resolverModelo, type Pedido } from "./pedido.js";
import { DIMENSOES, Plano } from "./plano.js";
import { posProduzir } from "./posproducao.js";
import { abrirNavegador, renderizar } from "./render.js";
import { validarRoteiro, type Roteiro } from "./roteiro.js";

export type Saida = { dir: string; arquivos: string[]; checagem: Resultado; pendencias: string[]; integracoes: Array<{ tela: number; foto: string } & Omit<ResultadoIntegracao, "arquivo">>; imagens: Registro[] };

const slug = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 40);

/** Caminho da foto do médico: "retrato" (primeira da ficha), "retrato:N" ou um arquivo listado na ficha. */
function resolverFoto(f: FichaCarregada, foto: string): { arquivo: string; aprovada: boolean } | null {
  const todas = Object.values(f.ficha.fotos).flat();
  const m = /^retrato(?::(\d+))?$/.exec(foto);
  const item = m ? f.ficha.fotos.retratos[Number(m[1] ?? 0)] : todas.find((x) => x.arquivo === foto);
  if (!item) return null;
  return { arquivo: path.join(f.dir, item.arquivo), aprovada: item.aprovada };
}

/** Pendências que impedem o status "pronto" (E1.7). */
function pendenciasDaFicha(f: FichaCarregada): string[] {
  const p: string[] = [];
  // só os dados que aparecem nas telas ou na legenda bloqueiam; os demais CONFIRMAR vão para o relatório
  const exibidos = f.semRegistro ? ["tratamento", "nome", "especialidade"] : ["tratamento", "nome", "crm", "uf", "rqe"];
  for (const [k, v] of Object.entries(f.ficha.medico)) if (exibidos.includes(k) && typeof v === "string" && /CONFIRMAR/.test(v)) p.push(`Ficha: ${k} = CONFIRMAR`);
  if (!f.ficha.aprovada) p.push("Ficha ainda não aprovada pelo time");
  return p;
}

export async function produzir(pedido: Pedido, opts: { navegador?: Browser; saida?: string } = {}): Promise<Saida> {
  const f = await carregarFicha(pedido.medico);
  f.semRegistro = pedido.assinatura === "semRegistro";
  const { modelo, variacao, motivo } = await resolverModelo(pedido);
  const val = await validarRoteiro(modelo, pedido.roteiro);
  const erros = val.achados.filter((a) => a.nivel === "erro");
  if (erros.length || !val.roteiro) throw new UserError("Roteiro reprovado", erros.map((a) => `${a.caminho}: ${a.mensagem}`));
  const roteiro = val.roteiro as Roteiro;

  const fotos = f.ficha.fotos.retratos;
  const luz: "esquerda" | "direita" = fotos[0]?.luz === "direita" ? "direita" : "esquerda";
  const plano = Plano.parse({ ...gerarPlano(modelo, roteiro, f, variacao, luz), luz });
  const { w: W, h: H } = DIMENSOES[plano.formato];

  const nome = `${new Date().toISOString().slice(0, 10)}_m${String(modelo).padStart(2, "0")}${variacao}_${slug(pedido.tema)}${pedido.versao ? `_${pedido.versao}` : ""}`;
  const dir = opts.saida ?? path.join(PASTAS.saida, f.id, nome);
  await fs.mkdir(dir, { recursive: true });
  const url = (arquivo: string) => rel(dir, arquivo);

  const pendencias = [...pendenciasDaFicha(f), ...roteiro.confirmar.map((c) => `Roteiro: ${c}`)];
  const ativos: Ativos = {
    imagens: {},
    fontes: { titulo: f.fontes.titulo.map(url), texto: f.fontes.texto.map(url), destaque: f.fontes.destaque.map(url) },
    logo: {
      ...(f.ficha.logo.paraFundoClaro ? { claro: url(path.join(f.dir, f.ficha.logo.paraFundoClaro)) } : {}),
      ...(f.ficha.logo.paraFundoEscuro ? { escuro: url(path.join(f.dir, f.ficha.logo.paraFundoEscuro)) } : {}),
      ...(f.ficha.logo.paraFundoPrincipal ? { principal: url(path.join(f.dir, f.ficha.logo.paraFundoPrincipal)) } : {}),
    },
  };

  // Imagens geradas (ou provisórias, sem chave) e fotos comuns
  const imagens: Registro[] = [];
  const precisaImagem = plano.telas.some((t) => t.camadas.some((c) => c.tipo === "imagemGerada"));
  const escolha = precisaImagem ? await escolherProvedor(f.ficha.cores, plano.corCampanha) : null;
  const recortes = new Map<string, { recorte: string; foto: string; tela: number; caixa: { x: number; y: number; w: number; h: number }; integracao: Extract<Plano["telas"][number]["camadas"][number], { tipo: "fotoMedico" }>["integracao"] }>();
  for (const [ti, t] of plano.telas.entries()) {
    for (const [ci, c] of t.camadas.entries()) {
      const chave = `t${ti}c${ci}`;
      if (c.tipo === "imagemGerada" && escolha) {
        const prompt = await montarPrompt(c.pedidoImagem, f.ficha, { ...(plano.corCampanha ? { corCampanha: plano.corCampanha } : {}), ladoLuz: plano.luz });
        const reg = await gerarComCache(escolha.provedor, { cena: c.pedidoImagem.cena, prompt, proporcao: c.pedidoImagem.proporcao, fundoTransparente: c.pedidoImagem.fundoTransparente, variacoes: c.pedidoImagem.variacoes, ...(c.pedidoImagem.semente ? { semente: c.pedidoImagem.semente } : {}) }, c.caixa.w);
        imagens.push(reg);
        ativos.imagens[chave] = url(reg.arquivo);
        if (reg.provisorio) pendencias.push(`Imagem provisória (${c.pedidoImagem.cena}): ${escolha.motivo}`);
      }
      if (c.tipo === "foto") {
        const r = resolverFoto(f, c.foto);
        if (!r) pendencias.push(`Foto não encontrada na ficha: ${c.foto}`);
        else ativos.imagens[chave] = url(r.arquivo);
      }
      if (c.tipo === "fotoMedico") {
        const r = resolverFoto(f, c.foto);
        if (!r) {
          pendencias.push(`Tela ${ti + 1}: sem foto do médico (${c.foto}); espaço vazio no lugar`);
          continue;
        }
        if (!r.aprovada) pendencias.push(`Foto ${path.relative(f.dir, r.arquivo)} ainda não aprovada na ficha`);
        const rc = await recortar(r.arquivo);
        recortes.set(chave, { recorte: rc.arquivo, foto: path.relative(f.dir, r.arquivo), tela: ti + 1, caixa: c.caixa, integracao: c.integracao });
      }
    }
  }
  const unicas = [...new Set(pendencias)];
  const rascunho = unicas.length > 0;
  const motivoRascunho = rascunho ? (unicas.some((p) => /CONFIRMAR/.test(p)) ? "dados CONFIRMAR" : unicas.some((p) => /provisória/.test(p)) ? "imagem provisória" : "aguarda aprovação") : undefined;
  const html = path.join(dir, "render.html");
  const navegador = opts.navegador ?? (await abrirNavegador());
  try {
    // Passada 1: cena sem o médico, para medir a cor atrás dele e integrar (D5)
    const integracoes: Saida["integracoes"] = [];
    if (recortes.size) {
      const doc = montarHtml(plano, f, ativos, { rascunho, ...(motivoRascunho ? { motivoRascunho } : {}) });
      await fs.writeFile(html, doc.html);
      const cena = await renderizar(navegador, html, doc.largura, doc.altura, plano.telas.length, { escala: 1, semMedico: true });
      for (const [chave, r] of recortes) {
        const caixa = { x: Math.max(0, r.caixa.x), y: Math.max(0, r.caixa.y), w: Math.min(W, r.caixa.x + r.caixa.w) - Math.max(0, r.caixa.x), h: Math.min(H, r.caixa.y + r.caixa.h) - Math.max(0, r.caixa.y) };
        const est = await estatisticasRegiao(cena.telas[r.tela - 1]!, caixa);
        const res = await integrar(r.recorte, est, f.derivadas.cores.principal, r.integracao);
        ativos.imagens[chave] = url(res.arquivo);
        const { arquivo: _a, ...resto } = res;
        integracoes.push({ tela: r.tela, foto: r.foto, ...resto });
      }
    }
    // Passada 2: final
    const doc = montarHtml(plano, f, ativos, { rascunho, ...(motivoRascunho ? { motivoRascunho } : {}) });
    await fs.writeFile(html, doc.html);
    const out = await renderizar(navegador, html, doc.largura, doc.altura, plano.telas.length);
    const leg = roteiro.legenda;
    const md = f.ficha.medico;
    const nomeAss = [md.tratamento, md.nome].filter(Boolean).join(" ");
    const assinatura = f.semRegistro ? `${nomeAss} | ${md.especialidade}` : `${nomeAss} | CRM ${md.crm}/${md.uf}${md.rqe ? ` | RQE ${md.rqe}` : ""}`;
    const legenda = `${leg.gancho}\n\n${leg.corpo}\n\n${leg.cta}\n\n${assinatura}\n\n${leg.hashtags.join(" ")}\n`;
    const checagem = await checar({
      telas: out.telas, telasSemTexto: out.telasSemTexto, textos: out.textos, avisosAjuste: out.avisos, fontes: out.fontes,
      familiasDaFicha: [f.ficha.fontes.titulo.familia, f.ficha.fontes.texto.familia, ...(f.ficha.fontes.destaque ? [f.ficha.fontes.destaque.familia] : [])],
      crm: md.crm, uf: md.uf, exigirRegistro: !f.semRegistro, nome: [md.tratamento, md.nome].filter(Boolean).join(" "), largura: W, altura: H, formato: plano.formato, legenda, pendencias: unicas,
    });

    const arquivos: string[] = [];
    const grava = async (n: string, d: string | Buffer) => {
      await fs.writeFile(path.join(dir, n), d);
      arquivos.push(n);
    };
    for (const [i, png] of out.telas.entries()) {
      const pos = await posProduzir(png, { grao: f.ficha.estilo.textura === "grao" ? 0.035 : 0, vinheta: 0.1, nitidez: true, semente: parseInt(sha256(`${nome}:${i}`).slice(0, 8), 16) });
      const n = `tela_${String(i + 1).padStart(2, "0")}`;
      await grava(`${n}.png`, pos.png);
      await grava(`${n}.jpg`, pos.jpg);
    }
    const pdf = await finalizePdf(out.pdf, { title: `${f.ficha.medico.tratamento} ${f.ficha.medico.nome} · modelo ${modelo}${variacao}`, author: "DESIGN PRO", expectedPages: plano.telas.length, width: W, height: H });
    await grava("carrossel.pdf", pdf.bytes);
    await grava("plano.json", JSON.stringify(plano, null, 2));
    await grava("roteiro.json", JSON.stringify(roteiro, null, 2));
    await grava("legenda.txt", legenda);
    const relatorio = {
      medico: f.id, modelo, variacao, motivoModelo: motivo, tema: pedido.tema, status: checagem.status,
      rascunho, pendencias: unicas, assinatura: pedido.assinatura,
      dadosConfirmarNaoExibidos: Object.entries(f.ficha.medico).filter(([k, v]) => typeof v === "string" && /CONFIRMAR/.test(v) && !unicas.some((p) => p.includes(`${k} =`))).map(([k]) => k), avisosFicha: f.avisos, achadosRoteiro: val.achados,
      problemas: checagem.problemas, medicoes: checagem.medicoes, integracoes,
      imagens: imagens.map((i) => ({ cena: i.cena, provedor: i.provedor, modelo: i.modelo, cache: i.cache, provisorio: i.provisorio, custoEstimadoUSD: i.custoEstimadoUSD })),
      provedorImagem: escolha?.motivo ?? "não usado (sem imagem gerada no plano)",
      chromium: out.chromium,
    };
    await grava("checagem.json", JSON.stringify(relatorio, null, 2));
    return { dir, arquivos, checagem, pendencias: unicas, integracoes, imagens };
  } finally {
    if (!opts.navegador) await navegador.close();
  }
}
