import { describe, expect, it } from 'vitest';
import { TICK_MS } from '../core/constants';
import { advance } from './loop';

describe('advance', () => {
  it('한 틱보다 짧으면 시간을 쌓아 둔다', () => {
    expect(advance(0, 10)).toEqual({ ticks: 0, accMs: 10 });
  });

  it('쌓인 시간이 한 틱을 넘으면 틱을 실행하고 나머지를 남긴다', () => {
    const r = advance(10, 10);
    expect(r.ticks).toBe(1);
    expect(r.accMs).toBeCloseTo(20 - TICK_MS);
  });

  it('긴 공백은 100ms로 잘라서 계산한다', () => {
    expect(advance(0, 5000)).toEqual(advance(0, 100));
    expect(advance(0, 5000).ticks).toBeLessThanOrEqual(6);
  });

  it('경과 시간이 음수면 0으로 처리한다', () => {
    expect(advance(5, -20)).toEqual({ ticks: 0, accMs: 5 });
  });
});
