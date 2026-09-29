import { describe, expect, it } from 'vitest';
import type { Action, InputEvent } from '../core/game';
import { createGestureRecognizer } from './gestures';

const press = (action: Action): InputEvent => ({ type: 'press', action });
const release = (action: Action): InputEvent => ({ type: 'release', action });
const tapped = (action: Action): InputEvent[] => [press(action), release(action)];

const recognizer = (cell = 30) => createGestureRecognizer(() => cell);

describe('탭', () => {
  it('10px 미만으로 움직이고 250ms 안에 떼면 시계 방향 회전', () => {
    const g = recognizer();
    g.down(1, 100, 100, 0);
    g.up(1, 103, 104, 100);
    expect(g.drain()).toEqual(tapped('rotateCW'));
  });

  it('250ms를 넘기면 회전하지 않는다', () => {
    const g = recognizer();
    g.down(1, 100, 100, 0);
    g.up(1, 100, 100, 300);
    expect(g.drain()).toEqual([]);
  });

  it('10px 이상 움직이면 탭이 아니다', () => {
    const g = recognizer();
    g.down(1, 100, 100, 0);
    g.move(1, 112, 100, 50);
    g.up(1, 112, 100, 100);
    expect(g.drain()).toEqual([]);
  });
});

describe('가로 드래그', () => {
  it('손가락 위치를 칸 폭으로 나눈 몫만큼 따라가고, 되돌아오면 반대로 움직인다', () => {
    const g = recognizer(30);
    g.down(1, 0, 0, 0);
    g.move(1, 95, 0, 100);
    expect(g.drain()).toEqual([...tapped('right'), ...tapped('right'), ...tapped('right')]);
    g.move(1, 35, 0, 200);
    expect(g.drain()).toEqual([...tapped('left'), ...tapped('left')]);
    g.up(1, 35, 0, 300);
    expect(g.drain()).toEqual([]);
  });

  it('가로 모드로 정해진 뒤에는 아래로 흔들어도 소프트드롭이 나오지 않는다', () => {
    const g = recognizer(30);
    g.down(1, 0, 0, 0);
    g.move(1, 40, 5, 50);
    g.move(1, 45, 80, 100);
    g.tick(500);
    g.up(1, 45, 80, 600);
    expect(g.drain()).toEqual(tapped('right'));
  });

  it('cellPx가 0이면 가로 드래그를 무시한다', () => {
    const g = recognizer(0);
    g.down(1, 0, 0, 0);
    g.move(1, 300, 0, 50);
    g.up(1, 300, 0, 100);
    expect(g.drain()).toEqual([]);
  });
});

describe('세로 드래그', () => {
  it('아래로 천천히 끌면 방향이 정해지고 120ms 뒤 소프트드롭, 떼면 해제', () => {
    const g = recognizer();
    g.down(1, 0, 0, 0);
    g.move(1, 0, 15, 20);
    g.tick(100);
    expect(g.drain()).toEqual([]);
    g.tick(140);
    expect(g.drain()).toEqual([press('softDrop')]);
    g.move(1, 0, 60, 400);
    g.up(1, 0, 62, 1000);
    expect(g.drain()).toEqual([release('softDrop')]);
  });

  it('아래로 빠르게 튕기면 하드드롭만 나온다', () => {
    const g = recognizer();
    g.down(1, 0, 0, 0);
    g.move(1, 0, 20, 16);
    g.move(1, 0, 60, 40);
    g.up(1, 0, 100, 60);
    expect(g.drain()).toEqual(tapped('hardDrop'));
  });

  it('오래 끌다가 마지막에 빠르게 튕겨도 하드드롭', () => {
    const g = recognizer();
    g.down(1, 0, 0, 0);
    g.move(1, 0, 15, 20);
    g.tick(200);
    g.move(1, 0, 50, 500);
    g.move(1, 0, 55, 900);
    g.up(1, 0, 160, 1000);
    expect(g.drain()).toEqual([press('softDrop'), release('softDrop'), ...tapped('hardDrop')]);
  });

  it('위로 튕기면 홀드', () => {
    const g = recognizer();
    g.down(1, 0, 200, 0);
    g.move(1, 0, 185, 10);
    g.up(1, 0, 140, 60);
    expect(g.drain()).toEqual(tapped('hold'));
  });

  it('위로 천천히 올렸다 떼면 아무것도 보내지 않는다', () => {
    const g = recognizer();
    g.down(1, 0, 200, 0);
    g.move(1, 0, 185, 10);
    g.move(1, 0, 150, 400);
    g.up(1, 0, 150, 500);
    expect(g.drain()).toEqual([]);
  });
});

describe('여러 포인터와 취소', () => {
  it('추적 중 들어온 두 번째 포인터는 무시한다', () => {
    const g = recognizer();
    g.down(1, 0, 0, 0);
    g.down(2, 50, 50, 10);
    g.up(2, 50, 50, 20);
    expect(g.drain()).toEqual([]);
    g.up(1, 0, 0, 100);
    expect(g.drain()).toEqual(tapped('rotateCW'));
  });

  it('시작하지 않은 포인터의 move/up은 무시한다', () => {
    const g = recognizer();
    g.move(5, 10, 10, 0);
    g.up(5, 10, 10, 50);
    expect(g.drain()).toEqual([]);
  });

  it('취소하면 눌린 소프트드롭을 해제하고 이후 up은 무시한다', () => {
    const g = recognizer();
    g.down(1, 0, 0, 0);
    g.move(1, 0, 15, 20);
    g.tick(200);
    g.cancel(1);
    g.up(1, 0, 15, 300);
    expect(g.drain()).toEqual([press('softDrop'), release('softDrop')]);
  });

  it('cancelAll은 진행 중인 제스처를 정리한다', () => {
    const g = recognizer();
    g.down(1, 0, 0, 0);
    g.move(1, 0, 15, 20);
    g.tick(200);
    g.cancelAll();
    g.cancelAll();
    expect(g.drain()).toEqual([press('softDrop'), release('softDrop')]);
  });
});
