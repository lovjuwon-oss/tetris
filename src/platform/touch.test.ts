import { beforeEach, describe, expect, it } from 'vitest';
import type { Action, InputEvent } from '../core/game';
import { type TouchInput, createTouch, parseAction } from './touch';

const press = (action: Action): InputEvent => ({ type: 'press', action });
const release = (action: Action): InputEvent => ({ type: 'release', action });

function pointer(type: string, pointerId: number, x = 0, y = 0, pointerType = 'touch'): Event {
  return Object.assign(new Event(type, { cancelable: true }), {
    pointerId,
    clientX: x,
    clientY: y,
    pointerType,
  });
}

describe('parseAction', () => {
  it('알려진 Action만 돌려준다', () => {
    expect(parseAction('hold')).toBe('hold');
    expect(parseAction('pause')).toBe('pause');
    expect(parseAction('jump')).toBeUndefined();
    expect(parseAction(undefined)).toBeUndefined();
  });
});

describe('createTouch', () => {
  let clock: number;
  let captured: number[];
  let win: EventTarget;
  let doc: EventTarget & { visibilityState: string };
  let board: EventTarget & { setPointerCapture(id: number): void };
  let leftBtn: EventTarget;
  let touch: TouchInput;

  beforeEach(() => {
    clock = 0;
    captured = [];
    win = new EventTarget();
    doc = Object.assign(new EventTarget(), { visibilityState: 'visible' });
    board = Object.assign(new EventTarget(), {
      setPointerCapture: (id: number) => {
        captured.push(id);
      },
    });
    leftBtn = new EventTarget();
    touch = createTouch({
      win,
      doc,
      board,
      buttons: [{ el: leftBtn, action: 'left' }],
      cellPx: () => 30,
      now: () => clock,
    });
  });

  describe('화면 버튼', () => {
    it('누르면 press, 떼면 release', () => {
      const down = pointer('pointerdown', 1);
      leftBtn.dispatchEvent(down);
      expect(down.defaultPrevented).toBe(true);
      expect(touch.drain()).toEqual([press('left')]);
      leftBtn.dispatchEvent(pointer('pointerup', 1));
      expect(touch.drain()).toEqual([release('left')]);
    });

    it('이미 눌린 버튼에 닿은 두 번째 손가락은 무시한다', () => {
      leftBtn.dispatchEvent(pointer('pointerdown', 1));
      leftBtn.dispatchEvent(pointer('pointerdown', 2));
      leftBtn.dispatchEvent(pointer('pointerup', 2));
      expect(touch.drain()).toEqual([press('left')]);
      leftBtn.dispatchEvent(pointer('pointerup', 1));
      expect(touch.drain()).toEqual([release('left')]);
    });

    it('pointerleave와 pointercancel도 해제로 처리한다', () => {
      leftBtn.dispatchEvent(pointer('pointerdown', 1));
      leftBtn.dispatchEvent(pointer('pointerleave', 1));
      leftBtn.dispatchEvent(pointer('pointerdown', 3));
      leftBtn.dispatchEvent(pointer('pointercancel', 3));
      expect(touch.drain()).toEqual([
        press('left'),
        release('left'),
        press('left'),
        release('left'),
      ]);
    });

    it('마우스로도 동작한다', () => {
      leftBtn.dispatchEvent(pointer('pointerdown', 1, 0, 0, 'mouse'));
      expect(touch.drain()).toEqual([press('left')]);
    });
  });

  describe('보드 제스처', () => {
    it('터치 탭은 회전이 되고, 포인터를 붙잡고 기본 동작을 막는다', () => {
      const down = pointer('pointerdown', 7, 100, 100);
      board.dispatchEvent(down);
      clock = 100;
      board.dispatchEvent(pointer('pointerup', 7, 102, 101));
      expect(down.defaultPrevented).toBe(true);
      expect(captured).toEqual([7]);
      expect(touch.drain()).toEqual([press('rotateCW'), release('rotateCW')]);
    });

    it('마우스는 보드 제스처로 처리하지 않는다', () => {
      const down = pointer('pointerdown', 1, 100, 100, 'mouse');
      board.dispatchEvent(down);
      clock = 50;
      board.dispatchEvent(pointer('pointerup', 1, 100, 100, 'mouse'));
      expect(down.defaultPrevented).toBe(false);
      expect(touch.drain()).toEqual([]);
    });

    it('tick이 주입된 시계로 소프트드롭 지연을 진행시킨다', () => {
      board.dispatchEvent(pointer('pointerdown', 1, 0, 0));
      clock = 20;
      board.dispatchEvent(pointer('pointermove', 1, 0, 15));
      clock = 200;
      touch.tick();
      expect(touch.drain()).toEqual([press('softDrop')]);
    });

    it('pointercancel이면 눌린 소프트드롭을 해제한다', () => {
      board.dispatchEvent(pointer('pointerdown', 1, 0, 0));
      clock = 20;
      board.dispatchEvent(pointer('pointermove', 1, 0, 15));
      clock = 200;
      touch.tick();
      board.dispatchEvent(pointer('pointercancel', 1));
      expect(touch.drain()).toEqual([press('softDrop'), release('softDrop')]);
    });
  });

  describe('해제', () => {
    it('창이 포커스를 잃으면 눌린 버튼과 제스처를 모두 해제한다', () => {
      leftBtn.dispatchEvent(pointer('pointerdown', 1));
      board.dispatchEvent(pointer('pointerdown', 2, 0, 0));
      clock = 20;
      board.dispatchEvent(pointer('pointermove', 2, 0, 15));
      clock = 200;
      touch.tick();
      touch.drain();
      win.dispatchEvent(new Event('blur'));
      expect(touch.drain()).toEqual([release('left'), release('softDrop')]);
    });

    it('blur 뒤에 온 pointerup은 두 번째 release를 만들지 않는다', () => {
      leftBtn.dispatchEvent(pointer('pointerdown', 1));
      win.dispatchEvent(new Event('blur'));
      leftBtn.dispatchEvent(pointer('pointerup', 1));
      expect(touch.drain()).toEqual([press('left'), release('left')]);
    });

    it('탭이 숨겨지면 해제한다', () => {
      leftBtn.dispatchEvent(pointer('pointerdown', 1));
      doc.visibilityState = 'hidden';
      doc.dispatchEvent(new Event('visibilitychange'));
      expect(touch.drain()).toEqual([press('left'), release('left')]);
    });

    it('dispose 뒤에는 이벤트를 받지 않는다', () => {
      touch.dispose();
      leftBtn.dispatchEvent(pointer('pointerdown', 1));
      board.dispatchEvent(pointer('pointerdown', 2));
      clock = 50;
      board.dispatchEvent(pointer('pointerup', 2));
      expect(touch.drain()).toEqual([]);
    });
  });
});
