import type { GameState, Phase } from '../core/state';

export interface HudElements {
  overlay: HTMLElement;
  score: HTMLElement;
  level: HTMLElement;
  lines: HTMLElement;
}

const MESSAGES: Record<Exclude<Phase, 'playing'>, (s: GameState) => string[]> = {
  ready: () => [
    'TETRIS',
    'Enter 키로 시작',
    '← → 이동 · ↓ 소프트드롭 · Space 하드드롭',
    '↑ / X 회전 · Z 반대 회전 · C 홀드 · Esc / P 일시정지',
  ],
  paused: () => ['일시정지', 'Esc 또는 P 키로 계속'],
  gameover: (s) => ['게임 오버', `점수 ${s.score.toLocaleString()}`, 'Enter 키로 다시 시작'],
};

export function createHud(els: HudElements): { update(state: GameState): void } {
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
        ...MESSAGES[state.phase](state).map((text, i) => {
          const el = document.createElement(i === 0 ? 'h1' : 'p');
          el.textContent = text;
          return el;
        }),
      );
    },
  };
}
