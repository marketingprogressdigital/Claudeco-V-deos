import { execFile } from "node:child_process";
import { promisify } from "node:util";

const run = promisify(execFile);

/**
 * Memória residente (MB) deste processo Node somada à de todos os descendentes (Chromium e seus renderers).
 * Usa `ps` (macOS e Linux). Devolve null quando não for possível medir (ex.: Windows), e quem chama segue sem o controle.
 */
export async function processTreeRssMb(rootPid = process.pid): Promise<number | null> {
  if (process.platform === "win32") return null;
  try {
    const { stdout } = await run("ps", ["-A", "-o", "pid=,ppid=,rss="], { maxBuffer: 8 * 1024 * 1024 });
    const children = new Map<number, number[]>();
    const rss = new Map<number, number>();
    for (const line of stdout.split("\n")) {
      const [pid, ppid, kb] = line.trim().split(/\s+/).map(Number);
      if (!pid || Number.isNaN(kb!)) continue;
      rss.set(pid, kb!);
      const list = children.get(ppid!) ?? [];
      list.push(pid);
      children.set(ppid!, list);
    }
    let total = 0;
    const stack = [rootPid];
    const seen = new Set<number>();
    while (stack.length) {
      const p = stack.pop()!;
      if (seen.has(p)) continue;
      seen.add(p);
      total += rss.get(p) ?? 0;
      stack.push(...(children.get(p) ?? []));
    }
    return Math.round(total / 1024);
  } catch {
    return null;
  }
}

/**
 * Memória disponível do sistema (MB), no sentido "o que pode ser usado sem pressão":
 * macOS: páginas livres + inativas + especulativas + purgáveis do `vm_stat` × tamanho da página;
 * Linux: MemAvailable de /proc/meminfo; outros: os.freemem() (subestima, ignora cache reaproveitável).
 */
export async function systemAvailableMb(): Promise<number | null> {
  try {
    if (process.platform === "darwin") {
      const { stdout } = await run("vm_stat", []);
      const page = Number(/page size of (\d+) bytes/.exec(stdout)?.[1] ?? 4096);
      const get = (k: string) => Number(new RegExp(`${k}:\\s+(\\d+)`).exec(stdout)?.[1] ?? 0);
      const pages = get("Pages free") + get("Pages inactive") + get("Pages speculative") + get("Pages purgeable");
      return Math.round((pages * page) / 1048576);
    }
    if (process.platform === "linux") {
      const { readFile } = await import("node:fs/promises");
      const kb = Number(/MemAvailable:\s+(\d+)/.exec(await readFile("/proc/meminfo", "utf8"))?.[1]);
      return Number.isFinite(kb) ? Math.round(kb / 1024) : null;
    }
    const os = await import("node:os");
    return Math.round(os.freemem() / 1048576);
  } catch {
    return null;
  }
}

/**
 * Amostra a memória em intervalos e guarda:
 * - peakMb: pico da soma de RSS do processo Node + todos os descendentes (Chromium e renderers), via `ps`;
 * - enginePeakMb: pico de RSS só do processo Node do motor (process.memoryUsage().rss);
 * - systemAvailableMinMb: menor memória disponível do sistema observada (systemAvailableMb).
 * RSS conta páginas compartilhadas em cada processo, então a soma tende a superestimar o uso real.
 */
export class MemorySampler {
  peakMb: number | null = null;
  enginePeakMb = 0;
  systemAvailableMinMb: number | null = null;
  samples = 0;
  private timer: NodeJS.Timeout | null = null;
  private busy = false;
  start(intervalMs = 250) {
    const tick = async () => {
      if (this.busy) return;
      this.busy = true;
      const v = await processTreeRssMb();
      const avail = await systemAvailableMb();
      this.enginePeakMb = Math.max(this.enginePeakMb, Math.round(process.memoryUsage().rss / 1048576));
      if (avail !== null) this.systemAvailableMinMb = Math.min(this.systemAvailableMinMb ?? Infinity, avail);
      this.busy = false;
      if (v !== null) {
        this.samples++;
        this.peakMb = Math.max(this.peakMb ?? 0, v);
      }
    };
    void tick();
    this.timer = setInterval(() => void tick(), intervalMs);
    return this;
  }
  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    return this.peakMb;
  }
}
