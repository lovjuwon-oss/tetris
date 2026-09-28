import { type Cell, type Grid, createGrid } from './board';
import { BOARD_HEIGHT } from './constants';
import type { PieceType, Point } from './pieces';

/** rows는 보드 맨 아래 행들. '.'은 빈칸, 그 외 문자는 블록 타입. */
export function gridFromRows(rows: readonly string[]): Grid {
  const grid = createGrid().map((row) => [...row]);
  const offset = BOARD_HEIGHT - rows.length;
  rows.forEach((row, i) => {
    [...row].forEach((ch, x) => {
      if (ch !== '.') grid[offset + i][x] = ch as PieceType;
    });
  });
  return grid;
}

/** 보드 맨 아래 count행을 문자열로 */
export function rowsOf(grid: Grid, count: number): string[] {
  return grid.slice(BOARD_HEIGHT - count).map((row) => row.map((c) => c ?? '.').join(''));
}

export function setCells(grid: Grid, points: readonly Point[], cell: Cell = 'Z'): Grid {
  const next = grid.map((row) => [...row]);
  for (const { x, y } of points) next[y][x] = cell;
  return next;
}

export function fullGrid(): Grid {
  return createGrid().map((row) => row.map((): Cell => 'Z'));
}
