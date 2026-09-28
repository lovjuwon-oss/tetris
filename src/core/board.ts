import { BOARD_HEIGHT, BOARD_WIDTH } from './constants';
import { type ActivePiece, type PieceType, pieceCells } from './pieces';

export type Cell = PieceType | null;
/** grid[y][x]. y=0이 맨 위 */
export type Grid = readonly (readonly Cell[])[];

function emptyRow(): Cell[] {
  return Array<Cell>(BOARD_WIDTH).fill(null);
}

export function createGrid(): Grid {
  return Array.from({ length: BOARD_HEIGHT }, emptyRow);
}

export function collides(grid: Grid, piece: ActivePiece): boolean {
  return pieceCells(piece).some(
    ({ x, y }) => x < 0 || x >= BOARD_WIDTH || y < 0 || y >= BOARD_HEIGHT || grid[y][x] !== null,
  );
}

export function lockPiece(grid: Grid, piece: ActivePiece): Grid {
  const next = grid.map((row) => [...row]);
  for (const { x, y } of pieceCells(piece)) next[y][x] = piece.type;
  return next;
}

export function clearLines(grid: Grid): { grid: Grid; cleared: number } {
  const remaining = grid.filter((row) => row.some((c) => c === null));
  const cleared = grid.length - remaining.length;
  return { grid: [...Array.from({ length: cleared }, emptyRow), ...remaining], cleared };
}

export function dropDistance(grid: Grid, piece: ActivePiece): number {
  let distance = 0;
  while (!collides(grid, { ...piece, y: piece.y + distance + 1 })) distance++;
  return distance;
}
