import { ARR_MS, DAS_MS } from './constants';

export type Direction = -1 | 1;

export interface ShiftState {
  readonly left: boolean;
  readonly right: boolean;
  /** 현재 적용 중인 방향. 나중에 누른 쪽이 우선한다. */
  readonly dir: -1 | 0 | 1;
  /** 현재 방향을 누르고 있은 시간 */
  readonly heldMs: number;
}

export const INITIAL_SHIFT: ShiftState = { left: false, right: false, dir: 0, heldMs: 0 };

export function pressShift(s: ShiftState, d: Direction): ShiftState {
  return {
    left: d === -1 ? true : s.left,
    right: d === 1 ? true : s.right,
    dir: d,
    heldMs: 0,
  };
}

export function releaseShift(s: ShiftState, d: Direction): ShiftState {
  const left = d === -1 ? false : s.left;
  const right = d === 1 ? false : s.right;
  if (s.dir !== d) return { ...s, left, right };
  const dir = left ? -1 : right ? 1 : 0;
  return { left, right, dir, heldMs: 0 };
}

/** 누른 뒤 ms가 지났을 때까지 일어났어야 할 자동 반복 횟수 */
function repeatsAt(ms: number): number {
  return ms < DAS_MS ? 0 : Math.floor((ms - DAS_MS) / ARR_MS) + 1;
}

export function tickShift(s: ShiftState, dtMs: number): { state: ShiftState; steps: number } {
  if (s.dir === 0) return { state: s, steps: 0 };
  const heldMs = s.heldMs + dtMs;
  return { state: { ...s, heldMs }, steps: repeatsAt(heldMs) - repeatsAt(s.heldMs) };
}
