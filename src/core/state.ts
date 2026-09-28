import { type Grid, createGrid } from './board';
import { MAX_LOCK_RESETS, NEXT_PREVIEW_COUNT } from './constants';
import { INITIAL_SHIFT, type ShiftState } from './input';
import type { ActivePiece, PieceType } from './pieces';
import { type BagState, createBag } from './randomizer';

export type Phase = 'ready' | 'playing' | 'paused' | 'gameover';

export interface GameState {
  readonly phase: Phase;
  readonly grid: Grid;
  readonly active: ActivePiece | null;
  readonly hold: PieceType | null;
  readonly canHold: boolean;
  readonly bag: BagState;
  readonly score: number;
  readonly lines: number;
  readonly level: number;
  /** 다음 중력 낙하까지 쌓인 시간 */
  readonly gravityMs: number;
  /** 바닥에 닿아 있은 시간 */
  readonly lockMs: number;
  /** 남은 락 타이머 초기화 횟수 */
  readonly resetsLeft: number;
  /** 현재 블록이 도달한 가장 낮은 박스 y (클수록 낮다) */
  readonly lowestY: number;
  readonly shift: ShiftState;
  readonly softDrop: boolean;
}

export function createGame(seed: number): GameState {
  return {
    phase: 'ready',
    grid: createGrid(),
    active: null,
    hold: null,
    canHold: true,
    bag: createBag(seed),
    score: 0,
    lines: 0,
    level: 1,
    gravityMs: 0,
    lockMs: 0,
    resetsLeft: MAX_LOCK_RESETS,
    lowestY: 0,
    shift: INITIAL_SHIFT,
    softDrop: false,
  };
}

export function nextPreview(state: GameState): readonly PieceType[] {
  return state.bag.queue.slice(0, NEXT_PREVIEW_COUNT);
}
