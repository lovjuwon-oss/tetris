import { describe, expect, it } from 'vitest';
import { BOARD_HEIGHT, VISIBLE_HEIGHT, VISIBLE_TOP } from './constants';

describe('constants', () => {
  it('보이는 영역은 보드 아래쪽 20행이다', () => {
    expect(VISIBLE_TOP).toBe(20);
    expect(BOARD_HEIGHT - VISIBLE_TOP).toBe(VISIBLE_HEIGHT);
  });
});
