/** Registro dos geradores de plano por modelo. Modelos ainda sem gerador dão erro claro, nunca um plano genérico. */
import type { FichaCarregada } from "../ficha.js";
import { UserError } from "../infra/errors.js";
import type { Plano } from "../plano.js";
import type { Roteiro } from "../roteiro.js";
import { m07, m09 } from "./carrosseis.js";
import type { Gerador } from "./comum.js";
import { m01, m02, m03, m04, m05, m06 } from "./estaticos.js";

const GERADORES: Partial<Record<number, Gerador<never>>> = { 1: m01, 2: m02, 3: m03, 4: m04, 5: m05, 6: m06, 7: m07, 9: m09 };

export const modelosDisponiveis = () => Object.keys(GERADORES).map(Number);

export function gerarPlano(modelo: number, roteiro: Roteiro, f: FichaCarregada, variacao: "A" | "B" | "C" | "D", luz: "esquerda" | "direita"): Omit<Plano, "luz"> {
  const g = GERADORES[modelo] as Gerador<Roteiro> | undefined;
  if (!g) throw new UserError(`Modelo ${modelo} ainda não tem gerador no motor novo`, [`Disponíveis: ${modelosDisponiveis().join(", ")}`]);
  if (variacao === "D" && modelo !== 5 && modelo !== 9) throw new UserError(`A variação D só existe nos Modelos 5 e 9`);
  const p = g(roteiro, f, variacao, luz);
  return { ...p, continuidade: p.continuidade ?? [], notas: p.notas ?? [] };
}
