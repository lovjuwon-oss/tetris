import {
  hardDrop,
  hold,
  isGrounded,
  lockActive,
  moveDown,
  moveHorizontal,
  rotate,
  spawnNext,
} from './actions';
import { LOCK_DELAY_MS, SOFT_DROP_FACTOR } from './constants';
import { INITIAL_SHIFT, pressShift, releaseShift, tickShift } from './input';
import { SOFT_DROP_POINTS_PER_CELL, gravityMsPerRow } from './scoring';
import { type GameState, createGame } from './state';

export type Action =
  | 'left'
  | 'right'
  | 'softDrop'
  | 'hardDrop'
  | 'rotateCW'
  | 'rotateCCW'
  | 'hold'
  | 'pause'
  | 'start';

export type InputEvent =
  { readonly type: 'press' | 'release'; readonly action: Action } | { readonly type: 'focusLost' };

function startOrRestart(s: GameState): GameState {
  if (s.phase === 'ready') return spawnNext({ ...s, phase: 'playing' });
  if (s.phase === 'gameover') return spawnNext({ ...createGame(s.bag.rngState), phase: 'playing' });
  return s;
}

function togglePause(s: GameState): GameState {
  if (s.phase === 'playing') return { ...s, phase: 'paused' };
  if (s.phase === 'paused') return { ...s, phase: 'playing' };
  return s;
}

function applyPress(s: GameState, action: Action): GameState {
  const playing = s.phase === 'playing';
  switch (action) {
    case 'start':
      return startOrRestart(s);
    case 'pause':
      return togglePause(s);
    case 'left':
    case 'right': {
      const d = action === 'left' ? -1 : 1;
      const next = { ...s, shift: pressShift(s.shift, d) };
      return playing ? moveHorizontal(next, d) : next;
    }
    case 'softDrop':
      return { ...s, softDrop: true };
    case 'hardDrop':
      return playing ? hardDrop(s) : s;
    case 'rotateCW':
      return playing ? rotate(s, 1) : s;
    case 'rotateCCW':
      return playing ? rotate(s, -1) : s;
    case 'hold':
      return playing ? hold(s) : s;
  }
}

function applyRelease(s: GameState, action: Action): GameState {
  switch (action) {
    case 'left':
      return { ...s, shift: releaseShift(s.shift, -1) };
    case 'right':
      return { ...s, shift: releaseShift(s.shift, 1) };
    case 'softDrop':
      return { ...s, softDrop: false };
    default:
      return s;
  }
}

function applyEvent(s: GameState, e: InputEvent): GameState {
  if (e.type === 'focusLost') {
    const phase = s.phase === 'playing' ? 'paused' : s.phase;
    return { ...s, phase, shift: INITIAL_SHIFT, softDrop: false };
  }
  return e.type === 'press' ? applyPress(s, e.action) : applyRelease(s, e.action);
}

function applyShiftRepeat(s: GameState, dtMs: number): GameState {
  const { state: shift, steps } = tickShift(s.shift, dtMs);
  let next: GameState = { ...s, shift };
  for (let i = 0; i < steps && shift.dir !== 0; i++) {
    const moved = moveHorizontal(next, shift.dir);
    if (moved === next) break;
    next = moved;
  }
  return next;
}

/** 여러 칸을 떨어져야 할 때도 한 칸씩 충돌을 검사한다 */
function applyGravity(s: GameState, dtMs: number): GameState {
  if (!s.active) return s;
  const interval = gravityMsPerRow(s.level) / (s.softDrop ? SOFT_DROP_FACTOR : 1);
  let gravityMs = Math.min(s.gravityMs, interval) + dtMs;
  let next = s;
  while (gravityMs >= interval) {
    const moved = moveDown(next);
    if (!moved) {
      gravityMs = 0;
      break;
    }
    gravityMs -= interval;
    next = s.softDrop ? { ...moved, score: moved.score + SOFT_DROP_POINTS_PER_CELL } : moved;
  }
  return { ...next, gravityMs };
}

function applyLockDelay(s: GameState, dtMs: number): GameState {
  if (!isGrounded(s)) return { ...s, lockMs: 0 };
  if (s.resetsLeft === 0) return lockActive(s);
  const lockMs = s.lockMs + dtMs;
  return lockMs >= LOCK_DELAY_MS ? lockActive(s) : { ...s, lockMs };
}

export function step(state: GameState, events: readonly InputEvent[], dtMs: number): GameState {
  let s = state;
  for (const e of events) s = applyEvent(s, e);
  if (s.phase !== 'playing') return s;
  s = applyShiftRepeat(s, dtMs);
  s = applyGravity(s, dtMs);
  return applyLockDelay(s, dtMs);
}
