/** 좌표계: x는 왼쪽→오른쪽, y는 위→아래로 증가한다. */
export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 40;
export const VISIBLE_HEIGHT = 20;
/** 보이는 영역이 시작되는 행. 이보다 작은 y는 숨은 영역이다. */
export const VISIBLE_TOP = BOARD_HEIGHT - VISIBLE_HEIGHT;

/** 새 블록 바운딩 박스의 왼쪽 위 좌표 (가이드라인 21~22행) */
export const SPAWN_X = 3;
export const SPAWN_Y = 18;
export const NEXT_PREVIEW_COUNT = 5;

export const TICK_MS = 1000 / 60;
export const MAX_FRAME_MS = 100;

export const DAS_MS = 167;
export const ARR_MS = 33;
export const SOFT_DROP_FACTOR = 20;

export const LOCK_DELAY_MS = 500;
export const MAX_LOCK_RESETS = 15;

export const LINES_PER_LEVEL = 10;
export const MAX_LEVEL = 15;
