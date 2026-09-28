import { beforeEach, describe, expect, it } from 'vitest';
import { type Keyboard, actionForCode, createKeyboard } from './keyboard';

function keyEvent(type: 'keydown' | 'keyup', code: string, repeat = false): Event {
  return Object.assign(new Event(type, { cancelable: true }), { code, repeat });
}

describe('actionForCode', () => {
  it('물리 키 코드로 동작을 찾는다', () => {
    expect(actionForCode('ArrowLeft')).toBe('left');
    expect(actionForCode('Space')).toBe('hardDrop');
    expect(actionForCode('KeyZ')).toBe('rotateCCW');
    expect(actionForCode('KeyX')).toBe('rotateCW');
    expect(actionForCode('ArrowUp')).toBe('rotateCW');
    expect(actionForCode('KeyC')).toBe('hold');
    expect(actionForCode('Escape')).toBe('pause');
    expect(actionForCode('Enter')).toBe('start');
  });

  it('Ctrl, Shift, 등록되지 않은 키, 객체 기본 속성 이름은 무시한다', () => {
    expect(actionForCode('ControlLeft')).toBeUndefined();
    expect(actionForCode('ShiftLeft')).toBeUndefined();
    expect(actionForCode('KeyQ')).toBeUndefined();
    expect(actionForCode('toString')).toBeUndefined();
  });
});

describe('createKeyboard', () => {
  let win: EventTarget;
  let doc: EventTarget & { visibilityState: string };
  let keyboard: Keyboard;

  beforeEach(() => {
    win = new EventTarget();
    doc = Object.assign(new EventTarget(), { visibilityState: 'visible' });
    keyboard = createKeyboard(win, doc);
  });

  it('누르고 떼면 press, release 이벤트가 쌓이고 기본 동작을 막는다', () => {
    const down = keyEvent('keydown', 'Space');
    win.dispatchEvent(down);
    win.dispatchEvent(keyEvent('keyup', 'Space'));
    expect(down.defaultPrevented).toBe(true);
    expect(keyboard.drain()).toEqual([
      { type: 'press', action: 'hardDrop' },
      { type: 'release', action: 'hardDrop' },
    ]);
    expect(keyboard.drain()).toEqual([]);
  });

  it('브라우저 자동 반복과 이미 눌린 키는 무시한다', () => {
    win.dispatchEvent(keyEvent('keydown', 'ArrowLeft'));
    const repeated = keyEvent('keydown', 'ArrowLeft', true);
    win.dispatchEvent(repeated);
    win.dispatchEvent(keyEvent('keydown', 'ArrowLeft'));
    expect(repeated.defaultPrevented).toBe(true);
    expect(keyboard.drain()).toEqual([{ type: 'press', action: 'left' }]);
  });

  it('등록되지 않은 키는 기본 동작을 막지 않는다', () => {
    const e = keyEvent('keydown', 'F5');
    win.dispatchEvent(e);
    expect(e.defaultPrevented).toBe(false);
    expect(keyboard.drain()).toEqual([]);
  });

  it('창이 포커스를 잃으면 눌린 키를 모두 떼고 focusLost를 보낸다', () => {
    win.dispatchEvent(keyEvent('keydown', 'ArrowLeft'));
    keyboard.drain();
    win.dispatchEvent(new Event('blur'));
    win.dispatchEvent(keyEvent('keyup', 'ArrowLeft'));
    expect(keyboard.drain()).toEqual([{ type: 'release', action: 'left' }, { type: 'focusLost' }]);
  });

  it('탭이 숨겨지면 focusLost를 보낸다', () => {
    doc.visibilityState = 'hidden';
    doc.dispatchEvent(new Event('visibilitychange'));
    expect(keyboard.drain()).toEqual([{ type: 'focusLost' }]);
  });

  it('dispose 뒤에는 이벤트를 받지 않는다', () => {
    keyboard.dispose();
    win.dispatchEvent(keyEvent('keydown', 'Space'));
    expect(keyboard.drain()).toEqual([]);
  });
});
