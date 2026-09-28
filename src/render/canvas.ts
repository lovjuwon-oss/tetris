import { dropDistance } from '../core/board';
import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  NEXT_PREVIEW_COUNT,
  VISIBLE_HEIGHT,
  VISIBLE_TOP,
} from '../core/constants';
import { type PieceType, type Point, SHAPES, pieceCells } from '../core/pieces';
import { type GameState, nextPreview } from '../core/state';

export const PIECE_COLORS: Record<PieceType, string> = {
  I: '#31c7ef',
  O: '#f7d308',
  T: '#ad4d9c',
  S: '#42b642',
  Z: '#ef2029',
  J: '#5a65ad',
  L: '#ef7921',
};

const BACKGROUND = '#10131a';
const GRID_LINE = '#1c212c';
const DISABLED = '#4a4f5c';
const MIN_CELL = 12;
const MINI_SCALE = 0.7;
const MINI_COLS = 5;
const MINI_ROWS = 3;

function setupCanvas(canvas: HTMLCanvasElement, width: number, height: number) {
  const dpr = window.devicePixelRatio || 1;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D를 사용할 수 없습니다');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

/** 변환을 풀고 실제 픽셀 전체를 칠한다. dpr 배율 상태로 칠하면 dpr < 1일 때 일부가 지워지지 않는다. */
function clear(ctx: CanvasRenderingContext2D) {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = BACKGROUND;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.restore();
}

function drawBlock(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  size: number,
  color: string,
) {
  ctx.fillStyle = color;
  ctx.fillRect(px + 1, py + 1, size - 2, size - 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.fillRect(px + 1, py + 1, size - 2, Math.max(2, Math.floor(size * 0.15)));
}

function drawGhost(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  size: number,
  color: string,
) {
  ctx.globalAlpha = 0.45;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.strokeRect(px + 2, py + 2, size - 4, size - 4);
  ctx.globalAlpha = 1;
}

const visible = (cells: readonly Point[]) => cells.filter((c) => c.y >= VISIBLE_TOP);

function drawBoard(ctx: CanvasRenderingContext2D, state: GameState, cell: number) {
  clear(ctx);
  ctx.strokeStyle = GRID_LINE;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 1; x < BOARD_WIDTH; x++) {
    ctx.moveTo(x * cell + 0.5, 0);
    ctx.lineTo(x * cell + 0.5, VISIBLE_HEIGHT * cell);
  }
  for (let y = 1; y < VISIBLE_HEIGHT; y++) {
    ctx.moveTo(0, y * cell + 0.5);
    ctx.lineTo(BOARD_WIDTH * cell, y * cell + 0.5);
  }
  ctx.stroke();

  for (let y = VISIBLE_TOP; y < BOARD_HEIGHT; y++) {
    for (let x = 0; x < BOARD_WIDTH; x++) {
      const c = state.grid[y][x];
      if (c) drawBlock(ctx, x * cell, (y - VISIBLE_TOP) * cell, cell, PIECE_COLORS[c]);
    }
  }

  const a = state.active;
  if (!a) return;
  const color = PIECE_COLORS[a.type];
  const ghost = { ...a, y: a.y + dropDistance(state.grid, a) };
  for (const c of visible(pieceCells(ghost))) {
    drawGhost(ctx, c.x * cell, (c.y - VISIBLE_TOP) * cell, cell, color);
  }
  for (const c of visible(pieceCells(a))) {
    drawBlock(ctx, c.x * cell, (c.y - VISIBLE_TOP) * cell, cell, color);
  }
}

/** MINI_COLS × MINI_ROWS 칸 슬롯의 가운데에 블록을 그린다 */
function drawMini(
  ctx: CanvasRenderingContext2D,
  type: PieceType | null,
  mini: number,
  offsetY: number,
  color?: string,
) {
  if (!type) return;
  const cells = SHAPES[type][0];
  const xs = cells.map((c) => c.x);
  const ys = cells.map((c) => c.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const width = (Math.max(...xs) - minX + 1) * mini;
  const height = (Math.max(...ys) - minY + 1) * mini;
  const ox = (MINI_COLS * mini - width) / 2;
  const oy = offsetY + (MINI_ROWS * mini - height) / 2;
  for (const c of cells) {
    const px = Math.round(ox + (c.x - minX) * mini);
    const py = Math.round(oy + (c.y - minY) * mini);
    drawBlock(ctx, px, py, mini, color ?? PIECE_COLORS[type]);
  }
}

export interface Renderer {
  resize(): void;
  draw(state: GameState): void;
}

export function createRenderer(canvases: {
  board: HTMLCanvasElement;
  hold: HTMLCanvasElement;
  next: HTMLCanvasElement;
}): Renderer {
  const layout = () => {
    const cell = Math.max(MIN_CELL, Math.floor((window.innerHeight * 0.85) / VISIBLE_HEIGHT));
    const mini = Math.floor(cell * MINI_SCALE);
    return {
      cell,
      mini,
      board: setupCanvas(canvases.board, BOARD_WIDTH * cell, VISIBLE_HEIGHT * cell),
      hold: setupCanvas(canvases.hold, MINI_COLS * mini, MINI_ROWS * mini),
      next: setupCanvas(canvases.next, MINI_COLS * mini, MINI_ROWS * mini * NEXT_PREVIEW_COUNT),
    };
  };
  let view = layout();

  return {
    resize: () => {
      view = layout();
    },
    draw: (state) => {
      drawBoard(view.board, state, view.cell);
      clear(view.hold);
      drawMini(view.hold, state.hold, view.mini, 0, state.canHold ? undefined : DISABLED);
      clear(view.next);
      nextPreview(state).forEach((type, i) => {
        drawMini(view.next, type, view.mini, i * MINI_ROWS * view.mini);
      });
    },
  };
}
