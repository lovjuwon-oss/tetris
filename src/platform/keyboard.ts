import type { Action, InputEvent } from '../core/game';

/** event.code 기준이라 한글 입력 상태에서도 같은 키로 동작한다 */
const KEY_MAP = new Map<string, Action>([
  ['ArrowLeft', 'left'],
  ['ArrowRight', 'right'],
  ['ArrowDown', 'softDrop'],
  ['Space', 'hardDrop'],
  ['ArrowUp', 'rotateCW'],
  ['KeyX', 'rotateCW'],
  ['KeyZ', 'rotateCCW'],
  ['KeyC', 'hold'],
  ['Escape', 'pause'],
  ['KeyP', 'pause'],
  ['Enter', 'start'],
  ['NumpadEnter', 'start'],
]);

export function actionForCode(code: string): Action | undefined {
  return KEY_MAP.get(code);
}

interface KeyEventLike extends Event {
  readonly code: string;
  readonly repeat: boolean;
}

export interface Keyboard {
  /** 쌓인 입력 이벤트를 꺼내고 비운다 */
  drain(): InputEvent[];
  dispose(): void;
}

export function createKeyboard(
  win: EventTarget,
  doc: EventTarget & { readonly visibilityState: string },
): Keyboard {
  const queue: InputEvent[] = [];
  const held = new Set<string>();

  const onKeyDown = (e: Event) => {
    const { code, repeat } = e as KeyEventLike;
    const action = actionForCode(code);
    if (!action) return;
    e.preventDefault();
    if (repeat || held.has(code)) return;
    held.add(code);
    queue.push({ type: 'press', action });
  };

  const onKeyUp = (e: Event) => {
    const { code } = e as KeyEventLike;
    const action = actionForCode(code);
    if (!action || !held.delete(code)) return;
    queue.push({ type: 'release', action });
  };

  const onFocusLost = () => {
    for (const code of held) {
      const action = actionForCode(code);
      if (action) queue.push({ type: 'release', action });
    }
    held.clear();
    queue.push({ type: 'focusLost' });
  };

  const onVisibilityChange = () => {
    if (doc.visibilityState === 'hidden') onFocusLost();
  };

  win.addEventListener('keydown', onKeyDown);
  win.addEventListener('keyup', onKeyUp);
  win.addEventListener('blur', onFocusLost);
  doc.addEventListener('visibilitychange', onVisibilityChange);

  return {
    drain: () => queue.splice(0),
    dispose: () => {
      win.removeEventListener('keydown', onKeyDown);
      win.removeEventListener('keyup', onKeyUp);
      win.removeEventListener('blur', onFocusLost);
      doc.removeEventListener('visibilitychange', onVisibilityChange);
    },
  };
}
