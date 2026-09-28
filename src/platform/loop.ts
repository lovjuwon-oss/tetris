import { MAX_FRAME_MS, TICK_MS } from '../core/constants';

/** 고정 타임스텝 누적기. 긴 공백(백그라운드 탭 복귀 등)은 MAX_FRAME_MS로 자른다. */
export function advance(accMs: number, elapsedMs: number): { ticks: number; accMs: number } {
  let acc = accMs + Math.min(Math.max(elapsedMs, 0), MAX_FRAME_MS);
  let ticks = 0;
  while (acc >= TICK_MS) {
    acc -= TICK_MS;
    ticks++;
  }
  return { ticks, accMs: acc };
}

export function startLoop(onTick: () => void, onRender: () => void): () => void {
  let acc = 0;
  let last = performance.now();
  let handle = 0;
  const frame = (now: number) => {
    const r = advance(acc, now - last);
    last = now;
    acc = r.accMs;
    for (let i = 0; i < r.ticks; i++) onTick();
    onRender();
    handle = requestAnimationFrame(frame);
  };
  handle = requestAnimationFrame(frame);
  return () => cancelAnimationFrame(handle);
}
