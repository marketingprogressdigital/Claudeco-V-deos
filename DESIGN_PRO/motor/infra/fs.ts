import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

export const sha256 = (data: Buffer | string) => createHash("sha256").update(data).digest("hex");

export async function sha256File(file: string): Promise<string> {
  return sha256(await fs.readFile(file));
}

export async function exists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

export async function writeFile(file: string, data: string | Buffer): Promise<void> {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, data);
}

export async function copyFile(from: string, to: string): Promise<void> {
  await fs.mkdir(path.dirname(to), { recursive: true });
  await fs.copyFile(from, to);
}

/** Lista arquivos recursivamente, em ordem estável. */
export async function listFiles(dir: string): Promise<string[]> {
  const out: string[] = [];
  for (const e of (await fs.readdir(dir, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await listFiles(p)));
    else if (e.isFile()) out.push(p);
  }
  return out;
}

/** Versão instalada de um pacote, mesmo quando "exports" não expõe package.json. */
export async function installedVersion(resolveFrom: string, pkg: string): Promise<string> {
  const { createRequire } = await import("node:module");
  let dir = path.dirname(createRequire(resolveFrom).resolve(pkg));
  for (let i = 0; i < 6; i++, dir = path.dirname(dir)) {
    try {
      const j = JSON.parse(await fs.readFile(path.join(dir, "package.json"), "utf8")) as { name?: string; version?: string };
      if (j.name === pkg && j.version) return j.version;
    } catch {
      /* continua subindo */
    }
  }
  return "desconhecida";
}
