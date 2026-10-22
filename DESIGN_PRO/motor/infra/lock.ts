import { promises as fs } from "node:fs";
import path from "node:path";
import { UserError } from "./errors.js";

const alive = (pid: number) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return (e as NodeJS.ErrnoException).code === "EPERM";
  }
};

export const lockPath = (jobDir: string) => path.join(path.dirname(jobDir), `.${path.basename(jobDir)}.lock`);

/**
 * Trava exclusiva por job (arquivo criado com O_EXCL ao lado da pasta do job).
 * Impede que dois jobs, no mesmo lote ou em processos diferentes, escrevam na mesma pasta.
 * Trava de processo que não existe mais é considerada abandonada e removida.
 */
export async function acquireJobLock(jobDir: string, owner: string): Promise<() => Promise<void>> {
  const file = lockPath(jobDir);
  await fs.mkdir(path.dirname(file), { recursive: true });
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const h = await fs.open(file, "wx");
      await h.writeFile(JSON.stringify({ pid: process.pid, owner, since: new Date().toISOString() }));
      await h.close();
      return async () => {
        await fs.rm(file, { force: true });
      };
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== "EEXIST") throw e;
      const info = JSON.parse(await fs.readFile(file, "utf8").catch(() => "{}")) as { pid?: number; owner?: string };
      if (info.pid && info.pid !== process.pid && !alive(info.pid)) {
        await fs.rm(file, { force: true }); // trava abandonada por um processo interrompido
        continue;
      }
      throw new UserError(`Job em uso por outra execução: ${path.basename(jobDir)}`, [info.owner ? `trava de ${info.owner}` : file]);
    }
  }
  throw new UserError(`Não foi possível travar o job ${path.basename(jobDir)}`);
}
