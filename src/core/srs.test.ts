import { describe, expect, it } from 'vitest';
import { createGrid } from './board';
import { type ActivePiece, pieceCells } from './pieces';
import { kicksFor, tryRotate } from './srs';
import { fullGrid, setCells } from './test-helpers';

const empty = createGrid();

describe('kicksFor', () => {
  it('SRS 위키 표기(y 위쪽 +)를 y 아래쪽 + 좌표로 뒤집는다', () => {
    expect(kicksFor('T', 0, 1)).toEqual([
      { x: 0, y: 0 },
      { x: -1, y: 0 },
      { x: -1, y: -1 },
      { x: 0, y: 2 },
      { x: -1, y: 2 },
    ]);
  });
});

describe('tryRotate', () => {
  it('빈 공간에서는 제자리에서 회전한다', () => {
    const piece: ActivePiece = { type: 'T', rotation: 0, x: 3, y: 20 };
    expect(tryRotate(empty, piece, 1)).toEqual({ ...piece, rotation: 1 });
    expect(tryRotate(empty, piece, -1)).toEqual({ ...piece, rotation: 3 });
  });

  it('O 블록은 회전하지 않는다', () => {
    expect(tryRotate(empty, { type: 'O', rotation: 0, x: 3, y: 20 }, 1)).toBeNull();
  });

  it('왼쪽 벽에 붙은 T는 벽차기로 오른쪽으로 밀려 회전한다', () => {
    const piece: ActivePiece = { type: 'T', rotation: 1, x: -1, y: 30 };
    expect(tryRotate(empty, piece, 1)).toEqual({ type: 'T', rotation: 2, x: 0, y: 30 });
  });

  it('바닥에 누운 I는 다섯 번째 후보로 위로 올라가며 회전한다', () => {
    const piece: ActivePiece = { type: 'I', rotation: 0, x: 3, y: 38 };
    expect(tryRotate(empty, piece, 1)).toEqual({ type: 'I', rotation: 1, x: 4, y: 36 });
  });

  it('모든 후보가 막히면 null을 돌려준다', () => {
    const piece: ActivePiece = { type: 'T', rotation: 0, x: 3, y: 30 };
    const grid = setCells(fullGrid(), pieceCells(piece), null);
    expect(tryRotate(grid, piece, 1)).toBeNull();
    expect(tryRotate(grid, piece, -1)).toBeNull();
  });
});
