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

  it('T 블록의 SRS 회전 상태', () => {
    expect(sorted(SHAPES.T[0])).toEqual(pts([1, 0], [0, 1], [1, 1], [2, 1]));
    expect(sorted(SHAPES.T[1])).toEqual(pts([1, 0], [1, 1], [2, 1], [1, 2]));
    expect(sorted(SHAPES.T[2])).toEqual(pts([0, 1], [1, 1], [2, 1], [1, 2]));
    expect(sorted(SHAPES.T[3])).toEqual(pts([1, 0], [0, 1], [1, 1], [1, 2]));
  });

  it('I 블록은 4×4 박스 안에서 회전한다', () => {
    expect(sorted(SHAPES.I[0])).toEqual(pts([0, 1], [1, 1], [2, 1], [3, 1]));
    expect(sorted(SHAPES.I[1])).toEqual(pts([2, 0], [2, 1], [2, 2], [2, 3]));
    expect(sorted(SHAPES.I[2])).toEqual(pts([0, 2], [1, 2], [2, 2], [3, 2]));
    expect(sorted(SHAPES.I[3])).toEqual(pts([1, 0], [1, 1], [1, 2], [1, 3]));
  });

  it('S, J, L 블록의 회전 상태', () => {
    expect(sorted(SHAPES.S[1])).toEqual(pts([1, 0], [1, 1], [2, 1], [2, 2]));
    expect(sorted(SHAPES.J[3])).toEqual(pts([1, 0], [1, 1], [0, 2], [1, 2]));
    expect(sorted(SHAPES.L[1])).toEqual(pts([1, 0], [1, 1], [1, 2], [2, 2]));
  });

  it('O 블록은 회전해도 모양과 위치가 같다', () => {
    for (const cells of SHAPES.O)
      expect(sorted(cells)).toEqual(pts([1, 0], [2, 0], [1, 1], [2, 1]));
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
