import { execFile } from "node:child_process";
import os from "node:os";
import { promisify } from "node:util";

const run = promisify(execFile);

export type LoadStats = {
  samples: number;
  load1Start: number;
  load1Max: number;
  load1Mean: number;
  /** %CPU somado de processos fora da árvore deste processo (100 = um núcleo inteiro). */
  externalCpuMean: number | null;
  externalCpuMax: number | null;
  /** Processos externos que mais usaram CPU (média por amostra). */
  topExternal: Array<{ name: string; cpu: number }>;
};

/**
 * Amostra a carga do sistema e o uso de CPU de processos externos durante um benchmark.
 * Usa `ps` (macOS e Linux); no Windows só a média de carga fica disponível (e lá ela é sempre 0).
 */
export class LoadSampler {
  private timer: NodeJS.Timeout | null = null;
  private loads: number[] = [];
  private ext: number[] = [];
  private byName = new Map<string, number>();
  private start1 = os.loadavg()[0]!;
  start(intervalMs = 2000) {
    const tick = async () => {
      this.loads.push(os.loadavg()[0]!);
      if (process.platform === "win32") return;
      try {
        const { stdout } = await run("ps", ["-A", "-o", "pid=,ppid=,%cpu=,comm="], { maxBuffer: 8 * 1024 * 1024 });
        const rows = stdout
          .split("\n")
          .map((l) => l.trim().match(/^(\d+)\s+(\d+)\s+([\d.]+)\s+(.*)$/))
          .filter((m): m is RegExpMatchArray => m !== null)
          .map((m) => ({ pid: +m[1]!, ppid: +m[2]!, cpu: +m[3]!, name: m[4]!.split("/").pop()! }));
        const kids = new Map<number, number[]>();
        for (const r of rows) kids.set(r.ppid, [...(kids.get(r.ppid) ?? []), r.pid]);
        const mine = new Set<number>();
        const stack = [process.pid, process.ppid];
        while (stack.length) {
          const p = stack.pop()!;
          if (mine.has(p)) continue;
          mine.add(p);
          stack.push(...(kids.get(p) ?? []));
        }
        let total = 0;
        for (const r of rows) {
          if (mine.has(r.pid) || r.name === "ps") continue;
          total += r.cpu;
          this.byName.set(r.name, (this.byName.get(r.name) ?? 0) + r.cpu);
        }
        this.ext.push(total);
      } catch {
        /* sem ps: segue só com a média de carga */
      }
    };
    void tick();
    this.timer = setInterval(() => void tick(), intervalMs);
    return this;
  }
  stop(): LoadStats {
    if (this.timer) clearInterval(this.timer);
    const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
    const n = Math.max(1, this.ext.length);
    return {
      samples: this.loads.length,
      load1Start: round(this.start1),
      load1Max: round(Math.max(0, ...this.loads)),
      load1Mean: round(mean(this.loads)),
      externalCpuMean: this.ext.length ? round(mean(this.ext)) : null,
      externalCpuMax: this.ext.length ? round(Math.max(...this.ext)) : null,
      topExternal: [...this.byName.entries()]
        .map(([name, cpu]) => ({ name, cpu: round(cpu / n) }))
        .sort((a, b) => b.cpu - a.cpu)
        .slice(0, 3),
    };
  }
}

const round = (x: number) => Math.round(x * 10) / 10;

/** Critério de contaminação: processos externos usando em média mais de um núcleo inteiro. */
export const EXTERNAL_CPU_LIMIT = 100;
export function contamination(l: LoadStats): string | null {
  if (l.externalCpuMean === null) return null;
  if (l.externalCpuMean > EXTERNAL_CPU_LIMIT) {
    const top = l.topExternal.map((t) => `${t.name} ${t.cpu}%`).join(", ");
    return `CPU externa média ${l.externalCpuMean}% (> ${EXTERNAL_CPU_LIMIT}%): ${top}`;
  }
  return null;
}
