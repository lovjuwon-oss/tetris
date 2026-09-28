import { describe, expect, it } from 'vitest';
import { TICK_MS } from './constants';
import { type Action, type InputEvent, step } from './game';
import type { PieceType } from './pieces';
import { type GameState, createGame } from './state';
import { rowsOf } from './test-helpers';

const press = (action: Action): InputEvent => ({ type: 'press', action });
const release = (action: Action): InputEvent => ({ type: 'release', action });
const tap = (action: Action): InputEvent[] => [press(action), release(action)];
const repeat = (action: Action, n: number): InputEvent[] =>
  Array.from({ length: n }, () => tap(action)).flat();

describe('입력 재생', () => {
  it('O 블록 5개로 바닥 2줄을 채워 더블을 만든다', () => {
    const queue: PieceType[] = ['O', 'O', 'O', 'O', 'O', 'T', 'T', 'T', 'T', 'T', 'T'];
    let s: GameState = { ...createGame(1), bag: { queue, rngState: 1 } };
    s = step(s, [press('start')], TICK_MS);

    // 1번: 왼쪽 키를 누른 채 DAS로 벽까지 이동 (x 0~1)
    s = step(s, [press('left')], TICK_MS);
    for (let i = 0; i < 20; i++) s = step(s, [], TICK_MS);
    expect(s.active?.x).toBe(-1);
    s = step(s, [release('left'), ...tap('hardDrop')], TICK_MS);

    // 2번: x 2~3, 3번: x 4~5, 4번: x 6~7, 5번: x 8~9
    s = step(s, [...repeat('left', 2), ...tap('hardDrop')], TICK_MS);
    s = step(s, [...tap('hardDrop')], TICK_MS);
    s = step(s, [...repeat('right', 2), ...tap('hardDrop')], TICK_MS);
    expect(rowsOf(s.grid, 2)).toEqual(['OOOOOOOO..', 'OOOOOOOO..']);
    s = step(s, [...repeat('right', 4), ...tap('hardDrop')], TICK_MS);

    expect(rowsOf(s.grid, 2)).toEqual(['..........', '..........']);
    expect(s.lines).toBe(2);
    expect(s.score).toBe(5 * 38 + 300);
    expect(s.active?.type).toBe('T');
  });

  it('같은 시드와 같은 입력이면 결과가 완전히 같다', () => {
    const pattern: InputEvent[][] = [
      tap('left'),
      tap('rotateCW'),
      repeat('right', 2),
      tap('rotateCCW'),
      [],
    ];
    const play = (seed: number): GameState => {
      let s = step(createGame(seed), [press('start')], TICK_MS);
      for (let i = 0; i < 60 && s.phase === 'playing'; i++) {
        s = step(s, [...pattern[i % pattern.length], ...tap('hardDrop')], TICK_MS);
        s = step(s, [], TICK_MS);
      }
      return s;
    };
    const a = play(7);
    expect(play(7)).toEqual(a);
    expect(a.score).toBeGreaterThan(0);
    expect(play(8)).not.toEqual(a);
  });
});
