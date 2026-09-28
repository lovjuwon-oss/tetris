import { NEXT_PREVIEW_COUNT } from './constants';
import { PIECE_TYPES, type PieceType } from './pieces';
import { nextRandom } from './rng';

export interface BagState {
  readonly queue: readonly PieceType[];
  readonly rngState: number;
}

function shuffledBag(rngState: number): { pieces: PieceType[]; rngState: number } {
  const pieces = [...PIECE_TYPES];
  let state = rngState;
  for (let i = pieces.length - 1; i > 0; i--) {
    const r = nextRandom(state);
    state = r.state;
    const j = Math.floor(r.value * (i + 1));
    [pieces[i], pieces[j]] = [pieces[j], pieces[i]];
  }
  return { pieces, rngState: state };
}

function refill(bag: BagState, minLength: number): BagState {
  let { queue, rngState } = bag;
  while (queue.length < minLength) {
    const shuffled = shuffledBag(rngState);
    queue = [...queue, ...shuffled.pieces];
    rngState = shuffled.rngState;
  }
  return { queue, rngState };
}

export function createBag(seed: number): BagState {
  return refill({ queue: [], rngState: seed >>> 0 }, NEXT_PREVIEW_COUNT + 1);
}

export function takeNext(bag: BagState): { piece: PieceType; bag: BagState } {
  const filled = refill(bag, NEXT_PREVIEW_COUNT + 1);
  const [piece, ...rest] = filled.queue;
  return { piece, bag: { queue: rest, rngState: filled.rngState } };
}
