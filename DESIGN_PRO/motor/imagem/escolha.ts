/**
 * Escolha do provedor: só usa IA de imagem quando há chave no .env E "habilitado": true no imagem.json.
 * Caso contrário, modo rascunho (sem custo, sem rede) e a entrega fica marcada RASCUNHO.
 */
import type { Ficha } from "../ficha.js";
import { GeminiProvedor } from "./gemini.js";
import { OpenAIProvedor } from "./openai.js";
import { lerChave, lerConfig, type Provedor } from "./provedor.js";
import { RascunhoProvedor } from "./rascunho.js";

export type Escolha = { provedor: Provedor; motivo: string };

export async function escolherProvedor(cores: Ficha["cores"], corCampanha?: string): Promise<Escolha> {
  const cfg = await lerConfig();
  const nomeChave = cfg.provedor === "gemini" ? "GEMINI_API_KEY" : "OPENAI_API_KEY";
  const chave = await lerChave(nomeChave);
  if (!chave) return { provedor: new RascunhoProvedor(cores, corCampanha), motivo: `sem ${nomeChave} no .env` };
  if (!cfg.habilitado) return { provedor: new RascunhoProvedor(cores, corCampanha), motivo: "IA de imagem desabilitada (imagem.json: habilitado false)" };
  return cfg.provedor === "gemini"
    ? { provedor: new GeminiProvedor(chave, cfg.modelos.gemini, cfg.imageSize), motivo: `Gemini ${cfg.modelos.gemini}` }
    : { provedor: new OpenAIProvedor(chave, cfg.modelos.openai), motivo: `OpenAI ${cfg.modelos.openai}` };
}
