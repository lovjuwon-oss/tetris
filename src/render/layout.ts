import { BOARD_WIDTH, VISIBLE_HEIGHT } from '../core/constants';

/** style.css의 @media (max-width: 700px)와 맞춘다 */
export const MOBILE_MAX_WIDTH = 700;
export const MIN_CELL = 12;
/** .board-wrap의 테두리 두께 (style.css) */
export const BOARD_BORDER_PX = 2;
/** style.css의 같은 미디어 쿼리와 문자열을 맞춘다 */
export const TOUCH_QUERY = '(pointer: coarse)';
export const LANDSCAPE_QUERY =
  '(pointer: coarse) and (orientation: landscape) and (max-height: 500px)';

export function isMobileWidth(width: number): boolean {
  return width <= MOBILE_MAX_WIDTH;
}

export function desktopCell(windowHeight: number): number {
  return Math.max(MIN_CELL, Math.floor((windowHeight * 0.85) / VISIBLE_HEIGHT));
}

/** 보드가 들어갈 빈칸(#board-slot)의 실제 크기로 칸 크기를 정한다 */
export function slotCell(slotWidth: number, slotHeight: number): number {
  const border = 2 * BOARD_BORDER_PX;
  const fit = Math.min((slotWidth - border) / BOARD_WIDTH, (slotHeight - border) / VISIBLE_HEIGHT);
  return Math.max(MIN_CELL, Math.floor(fit));
}

export function miniCell(cell: number, mobile: boolean): number {
  return Math.floor(cell * (mobile ? 0.5 : 0.7));
}
