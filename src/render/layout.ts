import { BOARD_WIDTH, VISIBLE_HEIGHT } from '../core/constants';

export const MIN_CELL = 12;
/** .board-wrap의 테두리 두께 (style.css) */
export const BOARD_BORDER_PX = 2;
/** style.css의 @media (max-width: 700px)와 같은 문자열을 맞춘다 */
export const MOBILE_QUERY = '(max-width: 700px)';
/** style.css의 같은 미디어 쿼리와 문자열을 맞춘다 */
export const TOUCH_QUERY = '(pointer: coarse)';
export const LANDSCAPE_QUERY =
  '(pointer: coarse) and (orientation: landscape) and (max-height: 500px)';

export function desktopCell(windowHeight: number): number {
  return Math.max(MIN_CELL, Math.floor((windowHeight * 0.85) / VISIBLE_HEIGHT));
}

/** 보드가 들어갈 빈칸(#board-slot)의 실제 크기로 칸 크기를 정한다 */
export function slotCell(slotWidth: number, slotHeight: number): number {
  const border = 2 * BOARD_BORDER_PX;
  const fit = Math.min((slotWidth - border) / BOARD_WIDTH, (slotHeight - border) / VISIBLE_HEIGHT);
  return Math.max(MIN_CELL, Math.floor(fit));
}

/** 모바일 미리보기 열 폭 76px에 5칸이 들어가는 최대 칸 크기 (⌊76/5⌋) */
export const MOBILE_MINI_MAX = 15;

export function miniCell(cell: number, mobile: boolean): number {
  const raw = Math.floor(cell * (mobile ? 0.5 : 0.7));
  return mobile ? Math.min(raw, MOBILE_MINI_MAX) : raw;
}
