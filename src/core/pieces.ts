import { SPAWN_X, SPAWN_Y } from './constants';

export type PieceType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';
export const PIECE_TYPES: readonly PieceType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

/** 0=생성 상태, 1=R(시계 90°), 2=180°, 3=L(반시계 90°) */
export type Rotation = 0 | 1 | 2 | 3;

export interface Point {
  readonly x: number;
  readonly y: number;
}

export interface ActivePiece {
  readonly type: PieceType;
  readonly rotation: Rotation;
  /** 바운딩 박스 왼쪽 위 */
  readonly x: number;
  readonly y: number;
}

const p = (x: number, y: number): Point => ({ x, y });

/** SRS 생성 상태 모양과 바운딩 박스 크기 */
const SPAWN_SHAPES: Record<PieceType, { size: number; cells: readonly Point[] }> = {
  I: { size: 4, cells: [p(0, 1), p(1, 1), p(2, 1), p(3, 1)] },
  O: { size: 4, cells: [p(1, 0), p(2, 0), p(1, 1), p(2, 1)] },
  T: { size: 3, cells: [p(1, 0), p(0, 1), p(1, 1), p(2, 1)] },
  S: { size: 3, cells: [p(1, 0), p(2, 0), p(0, 1), p(1, 1)] },
  Z: { size: 3, cells: [p(0, 0), p(1, 0), p(1, 1), p(2, 1)] },
  J: { size: 3, cells: [p(0, 0), p(0, 1), p(1, 1), p(2, 1)] },
  L: { size: 3, cells: [p(2, 0), p(0, 1), p(1, 1), p(2, 1)] },
};

/** 바운딩 박스 중심 기준 시계 방향 90° 회전 (y가 아래로 증가하는 좌표계) */
function rotateCW(cells: readonly Point[], size: number): Point[] {
  return cells.map((c) => p(size - 1 - c.y, c.x));
}

function buildStates(type: PieceType): readonly (readonly Point[])[] {
  const { size, cells } = SPAWN_SHAPES[type];
  if (type === 'O') return [cells, cells, cells, cells];
  const states: (readonly Point[])[] = [cells];
  for (let i = 1; i < 4; i++) states.push(rotateCW(states[i - 1], size));
  return states;
}

export const SHAPES = Object.fromEntries(PIECE_TYPES.map((t) => [t, buildStates(t)])) as Record<
  PieceType,
  readonly (readonly Point[])[]
>;

export function pieceCells(piece: ActivePiece): Point[] {
  return SHAPES[piece.type][piece.rotation].map((c) => p(c.x + piece.x, c.y + piece.y));
}

export function spawnPiece(type: PieceType): ActivePiece {
  return { type, rotation: 0, x: SPAWN_X, y: SPAWN_Y };
}
