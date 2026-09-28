import { describe, expect, it } from 'vitest';
import { PIECE_TYPES, type PieceType } from './pieces';
import { type BagState, createBag, takeNext } from './randomizer';

function takeMany(bag: BagState, count: number): { pieces: PieceType[]; bag: BagState } {
  const pieces: PieceType[] = [];
  let current = bag;
  for (let i = 0; i < count; i++) {
    const r = takeNext(current);
    pieces.push(r.piece);
    current = r.bag;
  }
  return { pieces, bag: current };
}

describe('7-bag', () => {
  it('7개 묶음마다 모든 종류가 정확히 한 번씩 나온다', () => {
    const { pieces } = takeMany(createBag(123), 28);
    for (let i = 0; i < 28; i += 7) {
      expect([...pieces.slice(i, i + 7)].sort()).toEqual([...PIECE_TYPES].sort());
    }
  });

  it('같은 시드는 같은 순서, 다른 시드는 다른 순서', () => {
    expect(takeMany(createBag(7), 14).pieces).toEqual(takeMany(createBag(7), 14).pieces);
    expect(takeMany(createBag(1), 14).pieces).not.toEqual(takeMany(createBag(2), 14).pieces);
  });

  it('꺼낸 뒤에도 미리보기 5개가 항상 남는다', () => {
    let bag = createBag(5);
    for (let i = 0; i < 30; i++) {
      bag = takeNext(bag).bag;
      expect(bag.queue.length).toBeGreaterThanOrEqual(5);
    }
  });

  it('원래 BagState는 바뀌지 않는다', () => {
    const bag = createBag(9);
    const before = [...bag.queue];
    takeNext(bag);
    expect(bag.queue).toEqual(before);
  });
});
