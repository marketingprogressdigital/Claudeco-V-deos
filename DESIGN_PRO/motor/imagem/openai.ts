/**
 * Adaptador OpenAI Images (POST /v1/images/generations), conforme a referência oficial consultada em 2026-10-20.
 * gpt-image-2 não aceita fundo transparente: elementos isolados usam o modelo configurado para transparência.
 * Não é chamado sem chave e sem "habilitado"; `fetch` injetável para testes sem rede.
 */
import { UserError } from "../infra/errors.js";
import { ErroTransitorio, type ImagemGerada, type PedidoResolvido, type Provedor } from "./provedor.js";

export const URL_OPENAI = "https://api.openai.com/v1/images/generations";
const TAMANHOS: Record<string, string> = { "1:1": "1024x1024", "4:5": "1088x1360", "9:16": "1088x1936", "3:4": "1008x1344", "16:9": "1920x1088" };

export function corpoOpenAI(modelo: string, p: PedidoResolvido) {
  const transparente = p.fundoTransparente && !/^gpt-image-2/.test(modelo);
  return { model: modelo, prompt: p.prompt, n: p.variacoes, size: TAMANHOS[p.proporcao] ?? "1024x1024", background: transparente ? "transparent" : "auto", output_format: "png" };
}

export class OpenAIProvedor implements Provedor {
  readonly nome = "openai";
  readonly provisorio = false;
  constructor(private chave: string, readonly modelo: string, private http: typeof fetch = fetch) {
    if (!chave) throw new UserError("Chave da OpenAI ausente no .env (OPENAI_API_KEY)");
  }
  async gerar(p: PedidoResolvido): Promise<ImagemGerada[]> {
    let r: Response;
    try {
      r = await this.http(URL_OPENAI, { method: "POST", headers: { Authorization: `Bearer ${this.chave}`, "Content-Type": "application/json" }, body: JSON.stringify(corpoOpenAI(this.modelo, p)) });
    } catch (e) {
      throw new ErroTransitorio(`rede: ${(e as Error).message}`);
    }
    if (r.status === 429 || r.status >= 500) throw new ErroTransitorio(`OpenAI respondeu ${r.status}`);
    if (!r.ok) throw new UserError(`OpenAI recusou o pedido (${r.status})`, [(await r.text()).slice(0, 300)]);
    const j = (await r.json()) as { data?: Array<{ b64_json?: string }> };
    const imgs = (j.data ?? []).filter((d) => d.b64_json);
    if (!imgs.length) throw new UserError("OpenAI respondeu sem imagem");
    return imgs.map((d) => ({ png: Buffer.from(d.b64_json!, "base64"), provedor: this.nome, modelo: this.modelo, custoEstimadoUSD: null }));
  }
}
