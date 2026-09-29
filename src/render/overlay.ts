import type { GameState, Phase } from '../core/state';

export interface HudElements {
  overlay: HTMLElement;
  score: HTMLElement;
  level: HTMLElement;
  lines: HTMLElement;
}

type Messages = Record<Exclude<Phase, 'playing'>, (s: GameState) => string[]>;

const KEYBOARD_MESSAGES: Messages = {
  ready: () => [
    'TETRIS',
    'Enter 키로 시작',
    '← → 이동 · ↓ 소프트드롭 · Space 하드드롭',
    '↑ / X 회전 · Z 반대 회전 · C 홀드 · Esc / P 일시정지',
  ],
  paused: () => ['일시정지', 'Esc 또는 P 키로 계속'],
  gameover: (s) => ['게임 오버', `점수 ${s.score.toLocaleString()}`, 'Enter 키로 다시 시작'],
};

const TOUCH_MESSAGES: Messages = {
  ready: () => [
    'TETRIS',
    '화면을 탭해서 시작',
    '탭 회전 · 좌우로 끌어 이동 · 아래로 끌어 소프트드롭',
    '아래로 튕겨 하드드롭 · 위로 튕겨 홀드',
  ],
  paused: () => ['일시정지', '탭해서 계속'],
  gameover: (s) => ['게임 오버', `점수 ${s.score.toLocaleString()}`, '탭해서 다시 시작'],
};

export function createHud(
  els: HudElements,
  options: { touch: boolean },
): { update(state: GameState): void } {
  const messages = options.touch ? TOUCH_MESSAGES : KEYBOARD_MESSAGES;
  let lastKey = '';
  return {
    update(state) {
      const key = `${state.phase}|${state.score}|${state.level}|${state.lines}`;
      if (key === lastKey) return;
      lastKey = key;
      els.score.textContent = state.score.toLocaleString();
      els.level.textContent = String(state.level);
      els.lines.textContent = String(state.lines);
      if (state.phase === 'playing') {
        els.overlay.hidden = true;
        return;
      }
      els.overlay.hidden = false;
      els.overlay.replaceChildren(
        ...messages[state.phase](state).map((text, i) => {
          const el = document.createElement(i === 0 ? 'h1' : 'p');
          el.textContent = text;
          return el;
        }),
      );
    },
  };
}
