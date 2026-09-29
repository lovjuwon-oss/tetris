import type { Action, InputEvent } from '../core/game';
import { createGestureRecognizer } from './gestures';
import { createEventQueue } from './input-hub';

const ACTIONS: readonly Action[] = [
  'left',
  'right',
  'softDrop',
  'hardDrop',
  'rotateCW',
  'rotateCCW',
  'hold',
  'pause',
  'start',
];

/** 마크업의 data-action 값을 검증한다. 모르는 값이면 undefined. */
export function parseAction(value: string | undefined): Action | undefined {
  return ACTIONS.find((a) => a === value);
}

interface PointerLike extends Event {
  readonly pointerId: number;
  readonly clientX: number;
  readonly clientY: number;
  readonly pointerType: string;
}

export interface ButtonBinding {
  readonly el: EventTarget;
  readonly action: Action;
}

export interface TouchOptions {
  win: EventTarget;
  doc: EventTarget & { readonly visibilityState: string };
  board: EventTarget & { setPointerCapture?(pointerId: number): void };
  buttons: readonly ButtonBinding[];
  /** 가로 드래그 한 칸의 CSS px */
  cellPx: () => number;
  /** 게임 루프와 같은 시계 (performance.now) */
  now: () => number;
}

export interface TouchInput {
  drain(): InputEvent[];
  tick(): void;
  releaseAll(): void;
  dispose(): void;
}

const isTouchPointer = (p: PointerLike) => p.pointerType === 'touch' || p.pointerType === 'pen';

export function createTouch(opts: TouchOptions): TouchInput {
  const queue = createEventQueue();
  const gestures = createGestureRecognizer(opts.cellPx);
  /** 버튼 → 누르고 있는 포인터 id */
  const held = new Map<ButtonBinding, number>();
  const cleanups: (() => void)[] = [];

  const listen = (target: EventTarget, type: string, handler: (e: Event) => void) => {
    target.addEventListener(type, handler);
    cleanups.push(() => target.removeEventListener(type, handler));
  };

  // 보드 제스처: 터치와 펜만 처리한다
  listen(opts.board, 'pointerdown', (e) => {
    const p = e as PointerLike;
    if (!isTouchPointer(p)) return;
    e.preventDefault();
    opts.board.setPointerCapture?.(p.pointerId);
    gestures.down(p.pointerId, p.clientX, p.clientY, opts.now());
  });
  listen(opts.board, 'pointermove', (e) => {
    const p = e as PointerLike;
    if (isTouchPointer(p)) gestures.move(p.pointerId, p.clientX, p.clientY, opts.now());
  });
  listen(opts.board, 'pointerup', (e) => {
    const p = e as PointerLike;
    if (isTouchPointer(p)) gestures.up(p.pointerId, p.clientX, p.clientY, opts.now());
  });
  listen(opts.board, 'pointercancel', (e) => {
    gestures.cancel((e as PointerLike).pointerId);
  });

  // 화면 버튼: 마우스도 허용한다
  for (const binding of opts.buttons) {
    listen(binding.el, 'pointerdown', (e) => {
      e.preventDefault();
      if (held.has(binding)) return;
      held.set(binding, (e as PointerLike).pointerId);
      queue.push({ type: 'press', action: binding.action });
    });
    const end = (e: Event) => {
      if (held.get(binding) !== (e as PointerLike).pointerId) return;
      held.delete(binding);
      queue.push({ type: 'release', action: binding.action });
    };
    listen(binding.el, 'pointerup', end);
    listen(binding.el, 'pointercancel', end);
    listen(binding.el, 'pointerleave', end);
  }

  const releaseAll = () => {
    for (const binding of held.keys()) queue.push({ type: 'release', action: binding.action });
    held.clear();
    gestures.cancelAll();
  };

  listen(opts.win, 'blur', releaseAll);
  listen(opts.doc, 'visibilitychange', () => {
    if (opts.doc.visibilityState === 'hidden') releaseAll();
  });

  return {
    drain: () => [...queue.drain(), ...gestures.drain()],
    tick: () => gestures.tick(opts.now()),
    releaseAll,
    dispose: () => {
      for (const cleanup of cleanups.splice(0)) cleanup();
    },
  };
}
