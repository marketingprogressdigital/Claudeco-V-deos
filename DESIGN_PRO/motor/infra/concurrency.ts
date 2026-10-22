/** Semáforo simples: no máximo `limit` tarefas ao mesmo tempo, em ordem de chegada. */
export class Semaphore {
  private active = 0;
  private waiting: Array<() => void> = [];
  constructor(readonly limit: number) {
    if (!Number.isInteger(limit) || limit < 1) throw new Error(`Limite inválido: ${limit}`);
  }
  async acquire(): Promise<() => void> {
    if (this.active >= this.limit) await new Promise<void>((r) => this.waiting.push(r));
    this.active++;
    let released = false;
    return () => {
      if (released) return;
      released = true;
      this.active--;
      this.waiting.shift()?.();
    };
  }
  async run<T>(fn: () => Promise<T>): Promise<T> {
    const release = await this.acquire();
    try {
      return await fn();
    } finally {
      release();
    }
  }
  get inUse() {
    return this.active;
  }
}

/** Limites rígidos: nunca paralelismo ilimitado. */
export const MAX_JOB_CONCURRENCY = 8;
export const MAX_RENDER_CONCURRENCY = 4;
