import { describe, expect, it } from 'vitest';
import { createEventQueue, mergeSources, tap } from './input-hub';

describe('createEventQueue', () => {
  it('넣은 순서대로 꺼내고, 꺼낸 뒤에는 비어 있다', () => {
    const q = createEventQueue();
    q.push({ type: 'press', action: 'left' });
    q.push({ type: 'release', action: 'left' }, { type: 'focusLost' });
    expect(q.drain()).toEqual([
      { type: 'press', action: 'left' },
      { type: 'release', action: 'left' },
      { type: 'focusLost' },
    ]);
    expect(q.drain()).toEqual([]);
  });
});

describe('mergeSources', () => {
  it('입력원 순서대로 이어 붙이고 모든 입력원을 비운다', () => {
    const a = createEventQueue();
    const b = createEventQueue();
    b.push({ type: 'press', action: 'hold' });
    a.push({ type: 'press', action: 'left' });
    const merged = mergeSources(a, b);
    expect(merged.drain()).toEqual([
      { type: 'press', action: 'left' },
      { type: 'press', action: 'hold' },
    ]);
    expect(a.drain()).toEqual([]);
    expect(b.drain()).toEqual([]);
  });
});

describe('tap', () => {
  it('press와 release 한 쌍을 만든다', () => {
    expect(tap('rotateCW')).toEqual([
      { type: 'press', action: 'rotateCW' },
      { type: 'release', action: 'rotateCW' },
    ]);
  });
});
