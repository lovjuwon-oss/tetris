import './style.css';
import { TICK_MS } from './core/constants';
import { step } from './core/game';
import { createGame } from './core/state';
import { createKeyboard } from './platform/keyboard';
import { startLoop } from './platform/loop';
import { createRenderer } from './render/canvas';
import { createHud } from './render/overlay';

function byId<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`#${id} 요소가 없습니다`);
  return el as T;
}

let state = createGame(Date.now() >>> 0);
const keyboard = createKeyboard(window, document);
const renderer = createRenderer({
  board: byId<HTMLCanvasElement>('board'),
  hold: byId<HTMLCanvasElement>('hold'),
  next: byId<HTMLCanvasElement>('next'),
});
const hud = createHud({
  overlay: byId('overlay'),
  score: byId('score'),
  level: byId('level'),
  lines: byId('lines'),
});

window.addEventListener('resize', () => renderer.resize());

startLoop(
  () => {
    state = step(state, keyboard.drain(), TICK_MS);
  },
  () => {
    renderer.draw(state);
    hud.update(state);
  },
);
