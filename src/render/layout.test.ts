import { describe, expect, it } from 'vitest';
import { MOBILE_QUERY, desktopCell, miniCell, slotCell } from './layout';

describe('MOBILE_QUERY', () => {
  it('style.css의 모바일 미디어 쿼리와 같은 문자열', () => {
    expect(MOBILE_QUERY).toBe('(max-width: 700px)');
  });
});

describe('desktopCell', () => {
  it('창 높이의 85%를 20행으로 나눈 정수, 최소 12', () => {
    expect(desktopCell(800)).toBe(34);
    expect(desktopCell(1080)).toBe(45);
    expect(desktopCell(100)).toBe(12);
  });
});

describe('slotCell', () => {
  it('테두리 4px을 뺀 빈칸에 10×20이 들어가는 가장 큰 정수 칸', () => {
    expect(slotCell(274, 544)).toBe(27);
    expect(slotCell(300, 400)).toBe(19);
  });

  it('여러 휴대폰 크기에서 보드가 빈칸을 넘지 않는다', () => {
    const slots: [number, number][] = [
      [298, 560],
      [268, 430],
      [338, 650],
    ];
    for (const [w, h] of slots) {
      const cell = slotCell(w, h);
      expect(Number.isInteger(cell)).toBe(true);
      expect(cell * 10 + 4).toBeLessThanOrEqual(w);
      expect(cell * 20 + 4).toBeLessThanOrEqual(h);
    }
  });

  it('빈칸이 0×0이면 최소 칸 크기', () => {
    expect(slotCell(0, 0)).toBe(12);
  });
});

describe('miniCell', () => {
  it('미리보기 칸은 PC 0.7배, 모바일 0.5배를 버림', () => {
    expect(miniCell(34, false)).toBe(23);
    expect(miniCell(27, true)).toBe(13);
  });

  it('모바일에서는 76px 열을 넘지 않도록 최대 15px로 제한한다', () => {
    expect(miniCell(32, true)).toBe(15);
    expect(miniCell(27, true)).toBe(13);
  });
});
