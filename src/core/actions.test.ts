import { describe, expect, it } from 'vitest';
import { hardDrop, hold, moveDown, moveHorizontal, rotate, spawnNext } from './actions';
import { createGrid } from './board';
import { MAX_LOCK_RESETS, SPAWN_Y } from './constants';
import type { ActivePiece, Point } from './pieces';
import { createGame } from './state';
import { gridFromRows, playingState, rowsOf, setCells, withActive } from './test-helpers';

const T = (x: number, y: number): ActivePiece => ({ type: 'T', rotation: 0, x, y });

describe('spawnNext', () => {
  it('큐의 첫 블록을 꺼내 생성하고 1칸 떨어뜨린다', () => {
    const ready = { ...createGame(1), phase: 'playing' as const };
    const s = spawnNext(ready);
    expect(s.active?.type).toBe(ready.bag.queue[0]);
    expect(s.active?.y).toBe(SPAWN_Y + 1);
    expect(s.bag.queue).toEqual(ready.bag.queue.slice(1));
    expect(s.canHold).toBe(true);
  });

  it('바로 아래가 막혀 있으면 생성 위치에 그대로 둔다', () => {
    const row20: Point[] = Array.from({ length: 10 }, (_, x) => ({ x, y: 20 }));
    const s = spawnNext({
      ...createGame(1),
      phase: 'playing',
      grid: setCells(createGrid(), row20),
    });
    expect(s.phase).toBe('playing');
    expect(s.active?.y).toBe(SPAWN_Y);
  });

  it('생성 위치가 막혀 있으면 블록 아웃으로 게임오버', () => {
    const spawnArea: Point[] = [];
    for (let x = 3; x <= 6; x++) spawnArea.push({ x, y: 18 }, { x, y: 19 });
    const s = spawnNext({
      ...createGame(1),
      phase: 'playing',
      grid: setCells(createGrid(), spawnArea),
    });
    expect(s.phase).toBe('gameover');
    expect(s.active).toBeNull();
  });
});

describe('moveHorizontal / rotate / moveDown', () => {
  it('좌우로 움직이고, 벽에 막히면 같은 객체를 돌려준다', () => {
    const s = withActive(playingState(), T(0, 20));
    expect(moveHorizontal(s, 1).active?.x).toBe(1);
    expect(moveHorizontal(s, -1)).toBe(s);
  });

  it('SRS로 회전한다', () => {
    const s = withActive(playingState(), T(3, 20));
    expect(rotate(s, 1).active?.rotation).toBe(1);
  });

  it('바닥에서는 moveDown이 null', () => {
    expect(moveDown(withActive(playingState(), T(3, 38)))).toBeNull();
  });
});

describe('락 초기화', () => {
  it('바닥에 닿은 상태에서 이동하면 락 타이머를 초기화하고 횟수를 1 줄인다', () => {
    const s = { ...withActive(playingState(), T(3, 38)), lockMs: 300 };
    const moved = moveHorizontal(s, -1);
    expect(moved.lockMs).toBe(0);
    expect(moved.resetsLeft).toBe(MAX_LOCK_RESETS - 1);
  });

  it('초기화 횟수가 0이면 타이머를 유지한다', () => {
    const s = { ...withActive(playingState(), T(3, 38)), lockMs: 300, resetsLeft: 0 };
    expect(moveHorizontal(s, -1).lockMs).toBe(300);
  });

  it('공중에서의 이동은 초기화 횟수를 쓰지 않는다', () => {
    const s = withActive(playingState(), T(3, 20));
    expect(moveHorizontal(s, -1).resetsLeft).toBe(MAX_LOCK_RESETS);
  });

  it('이전보다 낮은 행에 도달하면 초기화 횟수를 다시 채운다', () => {
    const s = { ...withActive(playingState(), T(3, 20)), resetsLeft: 3 };
    const moved = moveDown(s);
    expect(moved?.active?.y).toBe(21);
    expect(moved?.resetsLeft).toBe(MAX_LOCK_RESETS);
  });
});

describe('hardDrop', () => {
  it('바닥까지 떨어져 고정되고 칸당 2점, 다음 블록이 나온다', () => {
    const s = hardDrop(withActive(playingState(), T(3, 19)));
    expect(rowsOf(s.grid, 2)).toEqual(['....T.....', '...TTT....']);
    expect(s.score).toBe(38);
    expect(s.active?.y).toBe(SPAWN_Y + 1);
  });

  it('줄을 지우면 점수와 줄 수가 오르고, 점수는 레벨업 이전 레벨로 계산한다', () => {
    const base = withActive({ ...playingState(), grid: gridFromRows(['III...IIII']) }, T(3, 19));
    const s = hardDrop({ ...base, lines: 9 });
    expect(rowsOf(s.grid, 1)).toEqual(['....T.....']);
    expect(s.lines).toBe(10);
    expect(s.level).toBe(2);
    expect(s.score).toBe(100 + 38);
  });

  it('테트리스는 800점', () => {
    const base = { ...playingState(), grid: gridFromRows(Array(4).fill('IIIIIIIII.')) };
    const s = hardDrop(withActive(base, { type: 'I', rotation: 1, x: 7, y: 19 }));
    expect(rowsOf(s.grid, 4)).toEqual(Array(4).fill('..........'));
    expect(s.lines).toBe(4);
    expect(s.score).toBe(800 + 34);
  });

  it('보이는 영역 위에서 완전히 고정되면 락 아웃으로 게임오버', () => {
    const column: Point[] = [];
    for (let y = 20; y < 40; y++) column.push({ x: 3, y }, { x: 4, y }, { x: 5, y });
    const base = { ...playingState(), grid: setCells(createGrid(), column) };
    const s = hardDrop(withActive(base, T(3, 18)));
    expect(s.phase).toBe('gameover');
    expect(s.active).toBeNull();
  });
});

describe('hold', () => {
  it('처음 홀드하면 현재 블록을 보관하고 큐에서 다음 블록을 꺼낸다', () => {
    const s = playingState();
    const held = hold(s);
    expect(held.hold).toBe(s.active?.type);
    expect(held.active?.type).toBe(s.bag.queue[0]);
    expect(held.canHold).toBe(false);
  });

  it('블록 하나당 한 번만 쓸 수 있고, 고정되면 다시 쓸 수 있다', () => {
    const held = hold(playingState());
    expect(hold(held)).toBe(held);
    expect(hardDrop(held).canHold).toBe(true);
  });

  it('보관된 블록과 교체하면 생성 위치와 기본 회전 상태로 나온다', () => {
    const first = playingState();
    const afterDrop = hardDrop(hold(first));
    const rotated = rotate(afterDrop, 1);
    const swapped = hold(rotated);
    expect(swapped.active?.type).toBe(first.active?.type);
    expect(swapped.active?.rotation).toBe(0);
    expect(swapped.hold).toBe(afterDrop.active?.type);
  });
});
