import { type Grid, collides } from './board';
import type { ActivePiece, PieceType, Point, Rotation } from './pieces';

export type RotateDirection = 1 | -1;

type KickTable = Record<string, readonly (readonly [number, number])[]>;

// SRS 위키 표기 그대로 적는다 (y축 위쪽이 +). kicksFor에서 y 부호를 뒤집는다.
// prettier-ignore
const JLSTZ_KICKS: KickTable = {
  '0>1': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '1>0': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  '1>2': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  '2>1': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '2>3': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  '3>2': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '3>0': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '0>3': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
};

// prettier-ignore
const I_KICKS: KickTable = {
  '0>1': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  '1>0': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  '1>2': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
  '2>1': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  '2>3': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
  '3>2': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
  '3>0': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
  '0>3': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
};

export function kicksFor(type: PieceType, from: Rotation, to: Rotation): readonly Point[] {
  const table = type === 'I' ? I_KICKS : JLSTZ_KICKS;
  // 0 - y는 y가 0일 때 -0 대신 0을 만든다
  return table[`${from}>${to}`].map(([x, y]) => ({ x, y: 0 - y }));
}

export function tryRotate(
  grid: Grid,
  piece: ActivePiece,
  dir: RotateDirection,
): ActivePiece | null {
  if (piece.type === 'O') return null;
  const to = ((piece.rotation + dir + 4) % 4) as Rotation;
  for (const kick of kicksFor(piece.type, piece.rotation, to)) {
    const candidate = { ...piece, rotation: to, x: piece.x + kick.x, y: piece.y + kick.y };
    if (!collides(grid, candidate)) return candidate;
  }
  return null;
}
