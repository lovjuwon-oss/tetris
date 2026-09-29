import type { InputEvent } from '../core/game';
import { createEventQueue, tap } from './input-hub';

export const TAP_MAX_MOVE_PX = 10;
export const TAP_MAX_MS = 250;
export const SOFT_DROP_DELAY_MS = 120;
/** px/ms */
export const HARD_DROP_MIN_SPEED = 1.0;
export const HOLD_MIN_DISTANCE_PX = 40;
/** px/ms */
export const HOLD_MIN_SPEED = 0.5;
export const VELOCITY_WINDOW_MS = 80;

interface Sample {
  readonly x: number;
  readonly y: number;
  readonly t: number;
}

interface Track {
  readonly id: number;
  readonly start: Sample;
  axis: 'none' | 'horizontal' | 'vertical';
  /** 방향이 정해진 시각 */
  axisT: number;
  /** 가로로 이미 보낸 칸 수 (오른쪽이 +) */
  steps: number;
  softDrop: boolean;
  /** samples[0]은 속도 계산 기준 샘플 */
  samples: Sample[];
}

export interface GestureRecognizer {
  down(id: number, x: number, y: number, t: number): void;
  move(id: number, x: number, y: number, t: number): void;
  up(id: number, x: number, y: number, t: number): void;
  cancel(id: number): void;
  cancelAll(): void;
  /** 손가락이 멈춰 있어도 소프트드롭 지연을 판정하도록 틱마다 호출한다 */
  tick(t: number): void;
  drain(): InputEvent[];
}

export function createGestureRecognizer(cellPx: () => number): GestureRecognizer {
  const out = createEventQueue();
  let track: Track | null = null;

  const last = (tr: Track) => tr.samples[tr.samples.length - 1];

  function addSample(tr: Track, s: Sample) {
    tr.samples.push(s);
    // 창 시작 이전의 샘플 중 가장 늦은 것 하나만 기준으로 남긴다
    while (tr.samples.length > 2 && tr.samples[1].t <= s.t - VELOCITY_WINDOW_MS) {
      tr.samples.shift();
    }
  }

  function velocityY(tr: Track): number {
    const first = tr.samples[0];
    const end = last(tr);
    const dt = end.t - first.t;
    return dt > 0 ? (end.y - first.y) / dt : 0;
  }

  function decideAxis(tr: Track, s: Sample) {
    if (tr.axis !== 'none') return;
    const dx = s.x - tr.start.x;
    const dy = s.y - tr.start.y;
    if (Math.hypot(dx, dy) < TAP_MAX_MOVE_PX) return;
    tr.axis = Math.abs(dx) >= Math.abs(dy) ? 'horizontal' : 'vertical';
    tr.axisT = s.t;
  }

  function followHorizontal(tr: Track, s: Sample) {
    if (tr.axis !== 'horizontal') return;
    const cell = cellPx();
    if (cell <= 0) return;
    const target = Math.trunc((s.x - tr.start.x) / cell);
    while (tr.steps < target) {
      out.push(...tap('right'));
      tr.steps++;
    }
    while (tr.steps > target) {
      out.push(...tap('left'));
      tr.steps--;
    }
  }

  function checkSoftDrop(tr: Track, t: number) {
    if (tr.axis !== 'vertical' || tr.softDrop) return;
    if (last(tr).y <= tr.start.y) return;
    if (t - tr.axisT < SOFT_DROP_DELAY_MS) return;
    tr.softDrop = true;
    out.push({ type: 'press', action: 'softDrop' });
  }

  function releaseSoftDrop(tr: Track) {
    if (!tr.softDrop) return;
    tr.softDrop = false;
    out.push({ type: 'release', action: 'softDrop' });
  }

  function update(tr: Track, x: number, y: number, t: number, allowSoftDrop: boolean) {
    const s = { x, y, t };
    addSample(tr, s);
    decideAxis(tr, s);
    followHorizontal(tr, s);
    if (allowSoftDrop) checkSoftDrop(tr, t);
  }

  const tracking = (id: number): Track | null => (track && track.id === id ? track : null);

  return {
    down(id, x, y, t) {
      if (track) return;
      const start = { x, y, t };
      track = { id, start, axis: 'none', axisT: t, steps: 0, softDrop: false, samples: [start] };
    },
    move(id, x, y, t) {
      const tr = tracking(id);
      if (tr) update(tr, x, y, t, true);
    },
    up(id, x, y, t) {
      const tr = tracking(id);
      if (!tr) return;
      // 떼는 순간에는 소프트드롭을 새로 시작하지 않는다
      update(tr, x, y, t, false);
      if (tr.axis === 'none') {
        if (t - tr.start.t <= TAP_MAX_MS) out.push(...tap('rotateCW'));
      } else if (tr.axis === 'vertical') {
        const v = velocityY(tr);
        if (v >= HARD_DROP_MIN_SPEED) {
          releaseSoftDrop(tr);
          out.push(...tap('hardDrop'));
        } else if (tr.start.y - y >= HOLD_MIN_DISTANCE_PX && -v >= HOLD_MIN_SPEED) {
          out.push(...tap('hold'));
        }
      }
      releaseSoftDrop(tr);
      track = null;
    },
    cancel(id) {
      const tr = tracking(id);
      if (!tr) return;
      releaseSoftDrop(tr);
      track = null;
    },
    cancelAll() {
      if (!track) return;
      releaseSoftDrop(track);
      track = null;
    },
    tick(t) {
      if (track) checkSoftDrop(track, t);
    },
    drain: () => out.drain(),
  };
}
