import { describe, expect, it } from 'vitest';
import { INITIAL_SHIFT, type ShiftState, pressShift, releaseShift, tickShift } from './input';

function ticks(state: ShiftState, ...dts: number[]): { state: ShiftState; steps: number[] } {
  const steps: number[] = [];
  let s = state;
  for (const dt of dts) {
    const r = tickShift(s, dt);
    steps.push(r.steps);
    s = r.state;
  }
  return { state: s, steps };
}

describe('DAS/ARR', () => {
  it('167ms가 지나야 첫 반복, 이후 33ms마다 1칸', () => {
    const s = pressShift(INITIAL_SHIFT, -1);
    expect(s.dir).toBe(-1);
    expect(ticks(s, 166, 1, 32, 1, 66).steps).toEqual([0, 1, 0, 1, 2]);
  });

  it('한 번에 긴 시간이 지나면 밀린 반복을 모두 돌려준다', () => {
    expect(tickShift(pressShift(INITIAL_SHIFT, 1), 300).steps).toBe(5);
  });

  it('누른 방향이 없으면 움직이지 않는다', () => {
    expect(tickShift(INITIAL_SHIFT, 1000).steps).toBe(0);
  });
});

describe('좌우 동시 입력', () => {
  it('나중에 누른 방향이 우선이다', () => {
    const s = pressShift(pressShift(INITIAL_SHIFT, -1), 1);
    expect(s.dir).toBe(1);
  });

  it('나중 키를 떼면 먼저 누른 방향이 DAS를 처음부터 다시 시작한다', () => {
    let s = pressShift(INITIAL_SHIFT, -1);
    s = tickShift(s, 200).state;
    s = pressShift(s, 1);
    s = releaseShift(s, 1);
    expect(s).toEqual({ left: true, right: false, dir: -1, heldMs: 0 });
  });

  it('활성 방향이 아닌 키를 떼면 활성 방향은 유지된다', () => {
    let s = pressShift(pressShift(INITIAL_SHIFT, -1), 1);
    s = tickShift(s, 100).state;
    s = releaseShift(s, -1);
    expect(s).toEqual({ left: false, right: true, dir: 1, heldMs: 100 });
  });

  it('둘 다 떼면 멈춘다', () => {
    const s = releaseShift(releaseShift(pressShift(pressShift(INITIAL_SHIFT, -1), 1), 1), -1);
    expect(s).toEqual(INITIAL_SHIFT);
  });
});
