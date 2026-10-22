/**
 * Linha de comando do DESIGN PRO.
 *   npm run post -- <pedido.json>      produz um post ou carrossel
 *   npm run diagnostico               confere a instalação (Node, Chromium, recorte local, fontes, imagem)
 *   npm run pdf -- <pasta> [escala]    PDF de apresentação em alta resolução (escala 2 = 2160 × 2700)
 * Os demais comandos (revisar, testar, ficha, grade, lote, verificar, imagem) entram nas próximas etapas.
 */
import path from "node:path";
import { UserError } from "./infra/errors.js";
import { caminhoPedido, lerPedido } from "./pedido.js";
import { produzir } from "./pipeline.js";

async function main() {
  const [cmd, ...args] = process.argv.slice(2);
  if (cmd === "post") {
    const alvo = args[0];
    if (!alvo) throw new UserError("Uso: npm run post -- <pedido.json>");
    const arq = path.isAbsolute(alvo) || alvo.includes("/") ? path.resolve(alvo) : caminhoPedido(alvo);
    const t0 = Date.now();
    const s = await produzir(await lerPedido(arq));
    console.log(`Status: ${s.checagem.status}`);
    for (const p of s.checagem.problemas) console.log(`  [${p.nivel}] ${p.regra}${p.tela ? ` tela ${p.tela}` : ""}: ${p.mensagem}`);
    console.log(`Saída: ${s.dir} (${s.arquivos.length} arquivos, ${((Date.now() - t0) / 1000).toFixed(1)} s)`);
    return;
  }
  if (cmd === "diagnostico") {
    const { diagnostico } = await import("./infra/diagnostico.js");
    const ok = await diagnostico();
    if (!ok) process.exitCode = 1;
    return;
  }
  if (cmd === "pdf") {
    const pasta = args[0];
    if (!pasta) throw new UserError("Uso: npm run pdf -- <pasta da entrega> [escala]");
    const { pdfAlta } = await import("./infra/pdfalta.js");
    const r = await pdfAlta(path.resolve(pasta), { escala: args[1] ? Number(args[1]) : 2 });
    console.log(`PDF: ${r.arquivo} (${r.paginas} páginas, ${(r.bytes / 1e6).toFixed(1)} MB)`);
    return;
  }
  throw new UserError(cmd ? `Comando "${cmd}" ainda não implementado no motor novo` : "Informe um comando: post");
}

main().catch((e) => {
  if (e instanceof UserError) {
    console.error(`Erro: ${e.message}`);
    for (const d of e.details) console.error(`  ${d}`);
  } else console.error(e);
  process.exit(1);
});
