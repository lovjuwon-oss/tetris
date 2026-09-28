import { describe, expect, it } from 'vitest';
import { createGrid } from './board';
import { INITIAL_SHIFT } from './input';
import { type Action, type InputEvent, step } from './game';
import type { ActivePiece, Point } from './pieces';
import { createGame } from './state';
import { playingState, rowsOf, setCells, withActive } from './test-helpers';

const press = (action: Action): InputEvent => ({ type: 'press', action });
const release = (action: Action): InputEvent => ({ type: 'release', action });
const T = (x: number, y: number): ActivePiece => ({ type: 'T', rotation: 0, x, y });

describe('상태 전이', () => {
  it('ready에서는 시간이 흘러도 아무 일도 없고, start로 시작한다', () => {
    const ready = step(createGame(1), [], 5000);
    expect(ready.phase).toBe('ready');
    expect(ready.active).toBeNull();
    const playing = step(ready, [press('start')], 0);
    expect(playing.phase).toBe('playing');
    expect(playing.active).not.toBeNull();
  });

  it('ready에서는 조작 입력을 무시한다', () => {
    const ready = createGame(1);
    expect(step(ready, [press('hardDrop'), press('hold')], 0)).toEqual(ready);
  });

  it('pause로 멈추고 다시 pause로 재개한다. 멈춘 동안 블록은 떨어지지 않는다', () => {
    const s = playingState();
    const paused = step(s, [press('pause')], 5000);
    expect(paused.phase).toBe('paused');
    expect(paused.active).toEqual(s.active);
    const resumed = step(paused, [release('pause'), press('pause')], 0);
    expect(resumed.phase).toBe('playing');
  });

  it('포커스를 잃으면 일시정지하고 눌린 입력을 초기화한다', () => {
    const s = step(playingState(), [press('left'), press('softDrop'), { type: 'focusLost' }], 0);
    expect(s.phase).toBe('paused');
    expect(s.shift).toEqual(INITIAL_SHIFT);
    expect(s.softDrop).toBe(false);
  });

  it('게임오버에서 start를 누르면 새 게임이 바로 시작된다', () => {
    const over = { ...playingState(), phase: 'gameover' as const, score: 999 };
    const s = step(over, [press('start')], 0);
    expect(s.phase).toBe('playing');
    expect(s.score).toBe(0);
    expect(s.active).not.toBeNull();
  });
});

describe('조작', () => {
  it('좌우 키를 누르면 즉시 1칸, 167ms 뒤부터 자동 반복', () => {
    let s = withActive(playingState(), T(3, 20));
    s = step(s, [press('right')], 0);
    expect(s.active?.x).toBe(4);
    s = step(s, [], 166);
    expect(s.active?.x).toBe(4);
    s = step(s, [], 1);
    expect(s.active?.x).toBe(5);
  });

  it('회전, 하드드롭, 홀드 이벤트를 처리한다', () => {
    const s = withActive(playingState(), T(3, 20));
    expect(step(s, [press('rotateCW')], 0).active?.rotation).toBe(1);
    expect(step(s, [press('rotateCCW')], 0).active?.rotation).toBe(3);
    expect(step(s, [press('hardDrop')], 0).score).toBe(36);
    expect(step(s, [press('hold')], 0).hold).toBe('T');
  });
});

describe('중력', () => {
  it('1레벨에서는 1000ms마다 1칸', () => {
    let s = withActive(playingState(), T(3, 20));
    s = step(s, [], 999);
    expect(s.active?.y).toBe(20);
    s = step(s, [], 1);
    expect(s.active?.y).toBe(21);
  });

  it('소프트드롭은 20배 속도, 이동한 칸당 1점', () => {
    const s = step(withActive(playingState(), T(3, 20)), [press('softDrop')], 50);
    expect(s.active?.y).toBe(21);
    expect(s.score).toBe(1);
    const released = step(s, [release('softDrop')], 50);
    expect(released.active?.y).toBe(21);
  });

  it('높은 레벨에서 한 틱에 여러 칸 떨어져도 블록을 뚫지 않는다', () => {
    const ledge: Point[] = Array.from({ length: 9 }, (_, x) => ({ x, y: 25 }));
    const base = { ...playingState(), level: 15, grid: setCells(createGrid(), ledge) };
    const s = step(withActive(base, T(3, 18)), [press('softDrop')], 100);
    expect(s.active?.y).toBe(23);
    expect(s.score).toBe(5);
  });
});

describe('락 딜레이', () => {
  it('바닥에 닿고 500ms가 지나면 고정된다', () => {
    let s = withActive(playingState(), T(3, 38));
    s = step(s, [], 499);
    expect(rowsOf(s.grid, 2)).toEqual(['..........', '..........']);
    s = step(s, [], 1);
    expect(rowsOf(s.grid, 2)).toEqual(['....T.....', '...TTT....']);
  });

  it('바닥에서 이동하면 타이머가 초기화된다', () => {
    let s = withActive(playingState(), T(3, 38));
    s = step(s, [], 400);
    s = step(s, [press('left'), release('left')], 0);
    expect(s.resetsLeft).toBe(14);
    s = step(s, [], 400);
    expect(rowsOf(s.grid, 2)).toEqual(['..........', '..........']);
    s = step(s, [], 100);
    expect(rowsOf(s.grid, 2)).toEqual(['...T......', '..TTT.....']);
  });

  it('초기화 횟수를 다 쓴 상태로 바닥에 있으면 즉시 고정된다', () => {
    const s = step({ ...withActive(playingState(), T(3, 38)), resetsLeft: 0 }, [], 1);
    expect(rowsOf(s.grid, 2)).toEqual(['....T.....', '...TTT....']);
  });
});
