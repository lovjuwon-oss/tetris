import type { Action, InputEvent } from '../core/game';

export interface EventSource {
  /** 쌓인 입력 이벤트를 꺼내고 비운다 */
  drain(): InputEvent[];
}

export interface EventQueue extends EventSource {
  push(...events: InputEvent[]): void;
}

export function createEventQueue(): EventQueue {
  const queue: InputEvent[] = [];
  return {
    push: (...events) => {
      queue.push(...events);
    },
    drain: () => queue.splice(0),
  };
}

/** 입력원 순서대로 이어 붙인다. 한 틱 안의 순서라 게임에는 영향이 없다. */
export function mergeSources(...sources: EventSource[]): EventSource {
  return { drain: () => sources.flatMap((s) => s.drain()) };
}

export function tap(action: Action): InputEvent[] {
  return [
    { type: 'press', action },
    { type: 'release', action },
  ];
}
