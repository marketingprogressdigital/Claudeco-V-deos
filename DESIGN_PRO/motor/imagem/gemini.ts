/**
 * Adaptador Gemini (Nano Banana) pela Interactions API, conforme a documentação oficial consultada em 2026-10-20
 * (https://ai.google.dev/gemini-api/docs/image-generation). Não é chamado sem chave e sem "habilitado" no imagem.json.
 * O `fetch` é injetável: os testes verificam a requisição e a leitura da resposta sem rede.
 */
import { promises as fs } from "node:fs";
import { UserError } from "../infra/errors.js";
import { ErroTransitorio, type ImagemGerada, type PedidoResolvido, type Provedor } from "./provedor.js";

export const URL_GEMINI = "https://generativelanguage.googleapis.com/v1beta/interactions";
type Fetch = typeof fetch;

export function corpoGemini(modelo: string, p: PedidoResolvido, tamanho: string, referencias: Array<{ mime: string; base64: string }> = []) {
  return {
    model: modelo,
    input: [{ type: "text", text: p.prompt }, ...referencias.map((r) => ({ type: "image", mime_type: r.mime, data: r.base64 }))],
    response_format: { type: "image", mime_type: "image/png", aspect_ratio: p.proporcao, image_size: tamanho },
  };
}

/** Procura o primeiro bloco de imagem em base64 na resposta (atalho output_image ou steps[].content[]). */
export function extrairImagem(json: unknown): string | null {
  const j = json as Record<string, any>;
  if (typeof j?.output_image?.data === "string") return j.output_image.data;
  const blocos: any[] = [];
  for (const s of j?.steps ?? []) for (const c of s?.content ?? []) blocos.push(c);
  for (const o of j?.outputs ?? []) blocos.push(o);
  const img = blocos.find((b) => b?.type === "image" && typeof b.data === "string");
  return img?.data ?? null;
}

export class GeminiProvedor implements Provedor {
  readonly nome = "gemini";
  readonly provisorio = false;
  constructor(private chave: string, readonly modelo: string, private tamanho = "2K", private http: Fetch = fetch) {
    if (!chave) throw new UserError("Chave do Gemini ausente no .env (GEMINI_API_KEY)");
  }
  async gerar(p: PedidoResolvido): Promise<ImagemGerada[]> {
    const refs = await Promise.all((p.referencias ?? []).map(async (f) => ({ mime: f.endsWith(".png") ? "image/png" : "image/jpeg", base64: (await fs.readFile(f)).toString("base64") })));
    const out: ImagemGerada[] = [];
    for (let i = 0; i < p.variacoes; i++) {
      let r: Response;
      try {
        r = await this.http(URL_GEMINI, { method: "POST", headers: { "x-goog-api-key": this.chave, "Content-Type": "application/json" }, body: JSON.stringify(corpoGemini(this.modelo, p, this.tamanho, refs)) });
      } catch (e) {
        throw new ErroTransitorio(`rede: ${(e as Error).message}`);
      }
      if (r.status === 429 || r.status >= 500) throw new ErroTransitorio(`Gemini respondeu ${r.status}`);
      if (!r.ok) throw new UserError(`Gemini recusou o pedido (${r.status})`, [(await r.text()).slice(0, 300)]);
      const b64 = extrairImagem(await r.json());
      if (!b64) throw new UserError("Gemini respondeu sem imagem");
      out.push({ png: Buffer.from(b64, "base64"), provedor: this.nome, modelo: this.modelo, custoEstimadoUSD: null, marcaDagua: "SynthID" });
    }
    return out;
  }
}
