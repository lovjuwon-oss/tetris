import { describe, expect, it } from 'vitest';
import { clearLines, collides, createGrid, dropDistance, lockPiece } from './board';
import { type ActivePiece, spawnPiece } from './pieces';
import { gridFromRows, rowsOf, setCells } from './test-helpers';

const T = (x: number, y: number): ActivePiece => ({ type: 'T', rotation: 0, x, y });

describe('createGrid', () => {
  it('40행 × 10열의 빈 격자를 만든다', () => {
    const grid = createGrid();
    expect(grid).toHaveLength(40);
    for (const row of grid) expect(row).toEqual(Array(10).fill(null));
  });
});

describe('collides', () => {
  const empty = createGrid();

  it('빈 보드의 생성 위치에서는 충돌하지 않는다', () => {
    expect(collides(empty, spawnPiece('T'))).toBe(false);
  });

  it('왼쪽 벽, 오른쪽 벽, 바닥, 천장 밖은 충돌이다', () => {
    expect(collides(empty, T(-1, 20))).toBe(true);
    expect(collides(empty, T(8, 20))).toBe(true);
    expect(collides(empty, T(3, 38))).toBe(false);
    expect(collides(empty, T(3, 39))).toBe(true);
    expect(collides(empty, T(3, -1))).toBe(true);
  });

  it('채워진 칸과 겹치면 충돌이다', () => {
    const grid = setCells(empty, [{ x: 4, y: 21 }]);
    expect(collides(grid, T(3, 20))).toBe(true);
    expect(collides(grid, T(5, 20))).toBe(false);
  });
});

describe('lockPiece', () => {
  it('블록을 격자에 새기고 원본은 바꾸지 않는다', () => {
    const grid = createGrid();
    const locked = lockPiece(grid, T(3, 38));
    expect(rowsOf(locked, 2)).toEqual(['....T.....', '...TTT....']);
    expect(rowsOf(grid, 2)).toEqual(['..........', '..........']);
  });
});

describe('clearLines', () => {
  it('가득 찬 줄이 없으면 그대로다', () => {
    const { grid, cleared } = clearLines(gridFromRows(['IIIIIIIII.']));
    expect(cleared).toBe(0);
    expect(rowsOf(grid, 1)).toEqual(['IIIIIIIII.']);
  });

  it('떨어져 있는 여러 줄을 동시에 지우고 나머지를 순서대로 내린다', () => {
    const { grid, cleared } = clearLines(
      gridFromRows(['Z.........', 'IIIIIIIIII', 'J.........', 'IIIIIIIIII']),
    );
    expect(cleared).toBe(2);
    expect(rowsOf(grid, 4)).toEqual(['..........', '..........', 'Z.........', 'J.........']);
    expect(grid).toHaveLength(40);
  });

  it('4줄을 한 번에 지운다', () => {
    const { cleared } = clearLines(gridFromRows(Array(4).fill('IIIIIIIIII')));
    expect(cleared).toBe(4);
  });
});

describe('dropDistance', () => {
  it('빈 보드에서 생성 위치의 T는 20칸 떨어진다', () => {
    expect(dropDistance(createGrid(), spawnPiece('T'))).toBe(20);
  });

  it('쌓인 블록 위에서 멈춘다', () => {
    const grid = gridFromRows(['IIIIIIIII.', 'IIIIIIIII.']);
    expect(dropDistance(grid, T(3, 30))).toBe(6);
  });
});
