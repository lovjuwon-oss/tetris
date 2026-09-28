import { describe, expect, it } from 'vitest';
import { gravityMsPerRow, levelForLines, scoreForLock } from './scoring';

describe('scoreForLock', () => {
  it('삭제 줄 수별 점수에 레벨을 곱한다', () => {
    expect(scoreForLock({ linesCleared: 0 }, 3)).toBe(0);
    expect(scoreForLock({ linesCleared: 1 }, 1)).toBe(100);
    expect(scoreForLock({ linesCleared: 2 }, 1)).toBe(300);
    expect(scoreForLock({ linesCleared: 3 }, 1)).toBe(500);
    expect(scoreForLock({ linesCleared: 4 }, 1)).toBe(800);
    expect(scoreForLock({ linesCleared: 4 }, 5)).toBe(4000);
  });
});

describe('levelForLines', () => {
  it('10줄마다 1레벨씩 오르고 15레벨에서 멈춘다', () => {
    expect(levelForLines(0)).toBe(1);
    expect(levelForLines(9)).toBe(1);
    expect(levelForLines(10)).toBe(2);
    expect(levelForLines(19)).toBe(2);
    expect(levelForLines(20)).toBe(3);
    expect(levelForLines(140)).toBe(15);
    expect(levelForLines(500)).toBe(15);
  });
});

describe('gravityMsPerRow', () => {
  it('가이드라인 공식을 따른다', () => {
    expect(gravityMsPerRow(1)).toBeCloseTo(1000);
    expect(gravityMsPerRow(2)).toBeCloseTo(793);
    expect(gravityMsPerRow(15)).toBeCloseTo(7.06, 1);
  });
});
