import { describe, expect, it } from 'vitest';
import { PIECE_TYPES, type Point, SHAPES, pieceCells, spawnPiece } from './pieces';

const sorted = (points: readonly Point[]) => [...points].sort((a, b) => a.y - b.y || a.x - b.x);
const pts = (...xy: [number, number][]) => sorted(xy.map(([x, y]) => ({ x, y })));

describe('SHAPES', () => {
  it('모든 블록은 회전 상태 4개, 상태마다 4칸이다', () => {
    for (const type of PIECE_TYPES) {
      expect(SHAPES[type]).toHaveLength(4);
      for (const cells of SHAPES[type]) expect(cells).toHaveLength(4);
    }
  });

  it.each([
    ['I', 0, pts([0, 1], [1, 1], [2, 1], [3, 1])],
    ['I', 1, pts([2, 0], [2, 1], [2, 2], [2, 3])],
    ['I', 2, pts([0, 2], [1, 2], [2, 2], [3, 2])],
    ['I', 3, pts([1, 0], [1, 1], [1, 2], [1, 3])],
    ['O', 0, pts([1, 0], [2, 0], [1, 1], [2, 1])],
    ['O', 1, pts([1, 0], [2, 0], [1, 1], [2, 1])],
    ['O', 2, pts([1, 0], [2, 0], [1, 1], [2, 1])],
    ['O', 3, pts([1, 0], [2, 0], [1, 1], [2, 1])],
    ['T', 0, pts([1, 0], [0, 1], [1, 1], [2, 1])],
    ['T', 1, pts([1, 0], [1, 1], [2, 1], [1, 2])],
    ['T', 2, pts([0, 1], [1, 1], [2, 1], [1, 2])],
    ['T', 3, pts([1, 0], [0, 1], [1, 1], [1, 2])],
    ['S', 0, pts([1, 0], [2, 0], [0, 1], [1, 1])],
    ['S', 1, pts([1, 0], [1, 1], [2, 1], [2, 2])],
    ['S', 2, pts([1, 1], [2, 1], [0, 2], [1, 2])],
    ['S', 3, pts([0, 0], [0, 1], [1, 1], [1, 2])],
    ['Z', 0, pts([0, 0], [1, 0], [1, 1], [2, 1])],
    ['Z', 1, pts([2, 0], [1, 1], [2, 1], [1, 2])],
    ['Z', 2, pts([0, 1], [1, 1], [1, 2], [2, 2])],
    ['Z', 3, pts([1, 0], [0, 1], [1, 1], [0, 2])],
    ['J', 0, pts([0, 0], [0, 1], [1, 1], [2, 1])],
    ['J', 1, pts([1, 0], [2, 0], [1, 1], [1, 2])],
    ['J', 2, pts([0, 1], [1, 1], [2, 1], [2, 2])],
    ['J', 3, pts([1, 0], [1, 1], [0, 2], [1, 2])],
    ['L', 0, pts([2, 0], [0, 1], [1, 1], [2, 1])],
    ['L', 1, pts([1, 0], [1, 1], [1, 2], [2, 2])],
    ['L', 2, pts([0, 1], [1, 1], [2, 1], [0, 2])],
    ['L', 3, pts([0, 0], [1, 0], [1, 1], [1, 2])],
  ] as const)('%s 블록의 회전 상태 %i', (type, rotation, expected) => {
    expect(sorted(SHAPES[type][rotation])).toEqual(expected);
  });
});

describe('spawnPiece / pieceCells', () => {
  it('T는 x 3~5, 숨은 영역 18~19행에 생성된다', () => {
    const piece = spawnPiece('T');
    expect(piece).toEqual({ type: 'T', rotation: 0, x: 3, y: 18 });
    expect(sorted(pieceCells(piece))).toEqual(pts([4, 18], [3, 19], [4, 19], [5, 19]));
  });

  it('I는 x 3~6, O는 x 4~5에 생성된다', () => {
    expect(sorted(pieceCells(spawnPiece('I')))).toEqual(pts([3, 19], [4, 19], [5, 19], [6, 19]));
    expect(sorted(pieceCells(spawnPiece('O')))).toEqual(pts([4, 18], [5, 18], [4, 19], [5, 19]));
  });
});
