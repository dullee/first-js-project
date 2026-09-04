/** Shared runtime flags for mode, bot, and game lifecycle. */

export const game = {
  mode: "human", // human | easy | medium | expert
  humanIsWhite: true,
  botThinking: false,
  botTimerId: null,
  gameOver: false,
  score: 0,
  audioCtx: null,
  /** @type {null | { toIndex: number, isWhite: boolean, didCapture: boolean }} */
  pendingPromotion: null,
};
