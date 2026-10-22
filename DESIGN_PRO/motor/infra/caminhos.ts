import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

/** Pasta do motor (DESIGN_PRO/motor) e raiz do DESIGN PRO (DESIGN_PRO/), resolvidas a partir deste arquivo. */
export const MOTOR = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
export const RAIZ = path.resolve(MOTOR, "..");
export const PASTAS = {
  marcas: path.join(RAIZ, "marcas"),
  saida: path.join(RAIZ, "saida"),
  pedidos: path.join(RAIZ, "pedidos"),
  cenas: path.join(RAIZ, "cenas"),
  biblioteca: path.join(RAIZ, "biblioteca"),
  catalogo: path.join(RAIZ, "catalogo.json"),
  fontes: path.join(RAIZ, "assets", "fontes"),
  cacheImagens: path.join(MOTOR, "cache", "imagens"),
  cacheRecortes: path.join(MOTOR, "cache", "recortes"),
};

export const fileUrl = (p: string) => pathToFileURL(p).href;
/** Caminho relativo com "/" em qualquer sistema. */
export const rel = (from: string, to: string) => path.relative(from, to).split(path.sep).join("/");
