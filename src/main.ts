import './style.css';
import { TICK_MS } from './core/constants';
import { step } from './core/game';
import { createGame } from './core/state';
import { createEventQueue, mergeSources, tap } from './platform/input-hub';
import { createKeyboard } from './platform/keyboard';
import { startLoop } from './platform/loop';
import { type ButtonBinding, createTouch, parseAction } from './platform/touch';
import { createRenderer } from './render/canvas';
import { LANDSCAPE_QUERY, TOUCH_QUERY } from './render/layout';
import { createHud } from './render/overlay';

function byId<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`#${id} 요소가 없습니다`);
  return el as T;
}

let state = createGame(Date.now() >>> 0);

const boardSlot = byId('board-slot');
const renderer = createRenderer({
  board: byId<HTMLCanvasElement>('board'),
  hold: byId<HTMLCanvasElement>('hold'),
  next: byId<HTMLCanvasElement>('next'),
  slot: boardSlot,
});
const hud = createHud(
  { overlay: byId('overlay'), score: byId('score'), level: byId('level'), lines: byId('lines') },
  { touch: window.matchMedia(TOUCH_QUERY).matches },
);

const buttons: ButtonBinding[] = [];
for (const el of document.querySelectorAll<HTMLElement>('[data-action]')) {
  const action = parseAction(el.dataset.action);
  if (action) buttons.push({ el, action });
}

const keyboard = createKeyboard(window, document);
const touch = createTouch({
  win: window,
  doc: document,
  board: byId('board'),
  buttons,
  cellPx: () => renderer.cellPx(),
  now: () => performance.now(),
});
/** 오버레이 탭, 가로 방향 전환처럼 main이 직접 만드는 입력 */
const system = createEventQueue();
const input = mergeSources(keyboard, touch, system);

byId('overlay').addEventListener('click', () => {
  system.push(...tap(state.phase === 'paused' ? 'pause' : 'start'));
});

const landscape = window.matchMedia(LANDSCAPE_QUERY);
landscape.addEventListener('change', () => {
  if (landscape.matches) {
    touch.releaseAll();
    system.push({ type: 'focusLost' });
  }
  renderer.resize();
});
/** #board-slot의 크기는 캔버스 크기와 무관하므로 피드백 루프 없이 재측정할 수 있다 */
new ResizeObserver(() => renderer.resize()).observe(boardSlot);

startLoop(
  () => {
    touch.tick();
    state = step(state, input.drain(), TICK_MS);
  },
  () => {
    renderer.draw(state);
    hud.update(state);
  },
);
