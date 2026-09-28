import { spawnNext } from './actions';
import { type Cell, type Grid, createGrid } from './board';
import { BOARD_HEIGHT, MAX_LOCK_RESETS } from './constants';
import type { ActivePiece, PieceType, Point } from './pieces';
import { type GameState, createGame } from './state';

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

/** 시드 1로 시작해 첫 블록이 나온 playing 상태 */
export function playingState(): GameState {
  return spawnNext({ ...createGame(1), phase: 'playing' });
}

/** 현재 블록을 바꾸고 락 관련 상태를 새 블록 기준으로 초기화한다 */
export function withActive(state: GameState, piece: ActivePiece): GameState {
  return {
    ...state,
    active: piece,
    lowestY: piece.y,
    lockMs: 0,
    resetsLeft: MAX_LOCK_RESETS,
    gravityMs: 0,
  };
}
