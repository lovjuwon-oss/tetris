import { describe, expect, it } from 'vitest';
import { nextRandom } from './rng';

describe('nextRandom', () => {
  it('같은 상태에서는 같은 값을 돌려준다', () => {
    expect(nextRandom(42)).toEqual(nextRandom(42));
  });

  it('값은 0 이상 1 미만이고 상태가 바뀐다', () => {
    let state = 1;
    for (let i = 0; i < 1000; i++) {
      const r = nextRandom(state);
      expect(r.value).toBeGreaterThanOrEqual(0);
      expect(r.value).toBeLessThan(1);
      expect(r.state).not.toBe(state);
      state = r.state;
    }
  });
});
