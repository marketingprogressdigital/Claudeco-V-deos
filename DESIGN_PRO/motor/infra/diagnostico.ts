/** Diagnóstico da instalação: só lê e testa localmente; não chama API nem mostra chave. */
import { promises as fs } from "node:fs";

import { carregarFicha } from "../ficha.js";
import { lerChave, lerConfig } from "../imagem/provedor.js";
import { garantirVisao } from "../medico/recorte.js";
import { abrirNavegador } from "../render.js";
import { PASTAS, RAIZ } from "./caminhos.js";

export async function diagnostico(): Promise<boolean> {
  let ok = true;
  const linha = (passou: boolean, item: string, detalhe = "") => {
    if (!passou) ok = false;
    console.log(`${passou ? "OK  " : "FALHA"}  ${item}${detalhe ? `: ${detalhe}` : ""}`);
  };
  const [maior] = process.versions.node.split(".").map(Number);
  linha((maior ?? 0) >= 20, "Node.js", process.versions.node);
  linha(process.platform === "darwin", "macOS (necessário para o recorte local do médico)", process.platform);
  try {
    const nav = await abrirNavegador();
    linha(true, "Chromium do Playwright", nav.version());
    await nav.close();
  } catch (e) {
    linha(false, "Chromium do Playwright", (e as Error).message.split("\n")[0]);
  }
  try {
    await garantirVisao();
    linha(true, "Recorte local (Vision do macOS)");
  } catch (e) {
    linha(false, "Recorte local (Vision do macOS)", `${(e as Error).message.split("\n")[0]} (instale as Ferramentas de Linha de Comando do Xcode: xcode-select --install)`);
  }
  const fontes = await fs.readdir(PASTAS.fontes).catch(() => []);
  linha(fontes.length > 0, "Fontes da biblioteca", fontes.join(", "));
  const marcas = (await fs.readdir(PASTAS.marcas).catch(() => [] as string[])).filter((m) => !m.startsWith("."));
  for (const m of marcas) {
    try {
      await carregarFicha(m);
      linha(true, `Ficha ${m}`);
    } catch (e) {
      linha(false, `Ficha ${m}`, (e as Error).message);
    }
  }
  const cfg = await lerConfig();
  const chave = await lerChave(cfg.provedor === "gemini" ? "GEMINI_API_KEY" : "OPENAI_API_KEY");
  console.log(`INFO   IA de imagem: provedor ${cfg.provedor}, chave ${chave ? "presente no .env" : "ausente"}, ${cfg.habilitado ? "HABILITADA" : "desabilitada (modo rascunho para imagens geradas)"}`);
  console.log(`INFO   Pasta do DESIGN PRO: ${RAIZ}`);
  console.log(ok ? "\nTudo certo." : "\nHá itens com FALHA acima.");
  return ok;
}
