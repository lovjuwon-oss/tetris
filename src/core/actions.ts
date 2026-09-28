import { clearLines, collides, dropDistance, lockPiece } from './board';
import { MAX_LOCK_RESETS, VISIBLE_TOP } from './constants';
import { type ActivePiece, type PieceType, pieceCells, spawnPiece } from './pieces';
import { takeNext } from './randomizer';
import { HARD_DROP_POINTS_PER_CELL, levelForLines, scoreForLock } from './scoring';
import { type RotateDirection, tryRotate } from './srs';
import type { GameState } from './state';

/** type 블록을 생성 위치에 놓는다. 막혀 있으면 블록 아웃. */
function placeNew(state: GameState, type: PieceType): GameState {
  let piece = spawnPiece(type);
  if (collides(state.grid, piece)) return { ...state, active: null, phase: 'gameover' };
  const lowered = { ...piece, y: piece.y + 1 };
  if (!collides(state.grid, lowered)) piece = lowered;
  return {
    ...state,
    active: piece,
    gravityMs: 0,
    lockMs: 0,
    resetsLeft: MAX_LOCK_RESETS,
    lowestY: piece.y,
  };
}

export function spawnNext(state: GameState): GameState {
  const { piece, bag } = takeNext(state.bag);
  return placeNew({ ...state, bag, canHold: true }, piece);
}

export function isGrounded(state: GameState): boolean {
  const a = state.active;
  return a !== null && collides(state.grid, { ...a, y: a.y + 1 });
}

/** 이동에 성공한 블록을 반영하면서 락 초기화 규칙을 적용한다 */
function withPiece(state: GameState, piece: ActivePiece): GameState {
  let { lockMs, resetsLeft, lowestY } = state;
  if (isGrounded(state) && resetsLeft > 0) {
    lockMs = 0;
    resetsLeft -= 1;
  }
  if (piece.y > lowestY) {
    lowestY = piece.y;
    resetsLeft = MAX_LOCK_RESETS;
    lockMs = 0;
  }
  return { ...state, active: piece, lockMs, resetsLeft, lowestY };
}

export function moveHorizontal(state: GameState, dx: number): GameState {
  const a = state.active;
  if (!a) return state;
  const moved = { ...a, x: a.x + dx };
  return collides(state.grid, moved) ? state : withPiece(state, moved);
}

export function moveDown(state: GameState): GameState | null {
  const a = state.active;
  if (!a) return null;
  const moved = { ...a, y: a.y + 1 };
  return collides(state.grid, moved) ? null : withPiece(state, moved);
}

export function rotate(state: GameState, dir: RotateDirection): GameState {
  const a = state.active;
  if (!a) return state;
  const rotated = tryRotate(state.grid, a, dir);
  return rotated ? withPiece(state, rotated) : state;
}

export function lockActive(state: GameState): GameState {
  const a = state.active;
  if (!a) return state;
  const locked = lockPiece(state.grid, a);
  if (pieceCells(a).every((c) => c.y < VISIBLE_TOP)) {
    return { ...state, grid: locked, active: null, phase: 'gameover' };
  }
  const { grid, cleared } = clearLines(locked);
  const lines = state.lines + cleared;
  return spawnNext({
    ...state,
    grid,
    active: null,
    lines,
    level: levelForLines(lines),
    score: state.score + scoreForLock({ linesCleared: cleared }, state.level),
  });
}

export function hardDrop(state: GameState): GameState {
  const a = state.active;
  if (!a) return state;
  const distance = dropDistance(state.grid, a);
  return lockActive({
    ...state,
    active: { ...a, y: a.y + distance },
    score: state.score + distance * HARD_DROP_POINTS_PER_CELL,
  });
}

export function hold(state: GameState): GameState {
  const a = state.active;
  if (!a || !state.canHold) return state;
  if (state.hold === null) {
    const { piece, bag } = takeNext(state.bag);
    return placeNew({ ...state, hold: a.type, canHold: false, bag }, piece);
  }
  return placeNew({ ...state, hold: a.type, canHold: false }, state.hold);
}
