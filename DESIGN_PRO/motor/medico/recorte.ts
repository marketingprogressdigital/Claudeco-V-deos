/**
 * Recorte local do médico (A3, item 6; D5, item 1). Usa o Vision do macOS via medico/visao.swift:
 * a foto nunca sai do computador e nenhum modelo é baixado. Resultado em cache por hash da foto.
 */
import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import sharp from "sharp";
import { MOTOR, PASTAS } from "../infra/caminhos.js";
import { UserError } from "../infra/errors.js";
import { sha256 } from "../infra/fs.js";

const run = promisify(execFile);
const BIN = path.join(MOTOR, "cache", "bin", "visao");
const FONTE = path.join(MOTOR, "medico", "visao.swift");

/** Compila o utilitário de visão na primeira vez (ou quando o fonte muda). Só macOS. */
export async function garantirVisao(): Promise<string> {
  if (process.platform !== "darwin") throw new UserError("Recorte, rosto e OCR locais usam o Vision do macOS; nesta plataforma ainda não há alternativa local implementada");
  const fonte = await fs.stat(FONTE);
  const bin = await fs.stat(BIN).catch(() => null);
  if (!bin || bin.mtimeMs < fonte.mtimeMs) {
    await fs.mkdir(path.dirname(BIN), { recursive: true });
    await run("swiftc", ["-O", FONTE, "-o", BIN], { timeout: 300_000 });
  }
  return BIN;
}

export async function visao<T>(modo: "recorte" | "rosto" | "ocr", ...args: string[]): Promise<T> {
  const bin = await garantirVisao();
  try {
    const { stdout } = await run(bin, [modo, ...args], { timeout: 120_000, maxBuffer: 16 * 1024 * 1024 });
    return JSON.parse(stdout) as T;
  } catch (e) {
    const msg = (e as { stderr?: string }).stderr?.trim() || (e as Error).message;
    throw new UserError(`Visão local (${modo}) falhou`, [msg]);
  }
}

export type Recorte = { arquivo: string; hash: string; largura: number; altura: number; cache: boolean };

/** Recorta o sujeito, suaviza a borda da máscara em 2 px e guarda em cache/recortes/<hash>.png. */
export async function recortar(foto: string): Promise<Recorte> {
  const bytes = await fs.readFile(foto).catch(() => {
    throw new UserError(`Foto não encontrada: ${foto}`);
  });
  const hash = sha256(Buffer.concat([bytes, Buffer.from("recorte-v1")]));
  const destino = path.join(PASTAS.cacheRecortes, `${hash}.png`);
  if (await fs.stat(destino).catch(() => null)) {
    const m = await sharp(destino).metadata();
    return { arquivo: destino, hash, largura: m.width!, altura: m.height!, cache: true };
  }
  await fs.mkdir(PASTAS.cacheRecortes, { recursive: true });
  const bruto = path.join(PASTAS.cacheRecortes, `${hash}.bruto.png`);
  await visao("recorte", foto, bruto);
  const img = sharp(bruto).ensureAlpha();
  const { width, height } = await img.metadata();
  // Borda suavizada de 2 px (A3, item 6): desfoca só o canal alfa.
  const alfa = await sharp(bruto).extractChannel(3).blur(1.2).toBuffer();
  const rgb = await sharp(bruto).removeAlpha().toBuffer();
  await sharp(rgb).joinChannel(alfa).png().toFile(destino);
  await fs.rm(bruto, { force: true });
  return { arquivo: destino, hash, largura: width!, altura: height!, cache: false };
}

/** Rostos detectados (para a área segura do 9:16). */
export const rostos = (img: string) => visao<{ largura: number; altura: number; rostos: Array<{ x: number; y: number; w: number; h: number; confianca: number }> }>("rosto", img);
/** OCR local: textos reconhecidos na imagem. */
export const ocr = (img: string) => visao<{ textos: Array<{ texto: string; confianca: number }> }>("ocr", img);
