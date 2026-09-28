import { LINES_PER_LEVEL, MAX_LEVEL } from './constants';

export const SOFT_DROP_POINTS_PER_CELL = 1;
export const HARD_DROP_POINTS_PER_CELL = 2;

const LINE_CLEAR_POINTS: readonly number[] = [0, 100, 300, 500, 800];

/** 블록 하나가 고정될 때 일어난 일. T-spin, 콤보 등은 여기에 필드로 추가한다. */
export interface LockEvent {
  readonly linesCleared: number;
}

/** level은 고정 직전(레벨업 이전)의 레벨 */
export function scoreForLock(event: LockEvent, level: number): number {
  return (LINE_CLEAR_POINTS[event.linesCleared] ?? 0) * level;
}

export function levelForLines(totalLines: number): number {
  return Math.min(MAX_LEVEL, 1 + Math.floor(totalLines / LINES_PER_LEVEL));
}

export function gravityMsPerRow(level: number): number {
  return Math.pow(0.8 - (level - 1) * 0.007, level - 1) * 1000;
}
