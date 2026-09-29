import { describe, expect, it } from 'vitest';
import { step } from '../core/game';
import { playingState, rowsOf, withActive } from '../core/test-helpers';
import { createGestureRecognizer } from './gestures';

const T_PIECE = { type: 'T' as const, rotation: 0 as const, x: 3, y: 20 };

describe('gestures + core 통합', () => {
  it('가로 드래그가 core의 active.x를 그대로 움직인다', () => {
    const state = withActive(playingState(), T_PIECE);
    const g = createGestureRecognizer(() => 30);

    g.down(1, 0, 0, 0);
    g.move(1, 95, 0, 100);
    const after1 = step(state, g.drain(), 0);
    expect(after1.active?.x).toBe(6);

    g.move(1, 35, 0, 200);
    const after2 = step(after1, g.drain(), 0);
    expect(after2.active?.x).toBe(4);
  });

  it('아래로 튕기면 core에서 그 자리에 하드드롭되어 바닥에 고정된다', () => {
    const state = withActive(playingState(), T_PIECE);
    const g = createGestureRecognizer(() => 30);

    g.down(1, 0, 0, 0);
    g.move(1, 0, 20, 16);
    g.move(1, 0, 60, 40);
    g.up(1, 0, 100, 60);
    const after = step(state, g.drain(), 0);

    expect(rowsOf(after.grid, 2)).toEqual(['....T.....', '...TTT....']);
  });
});
