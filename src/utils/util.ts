/**
 * Shared utility helpers for Sleepy Slimes.
 */

// --- Slime seeds ---

let slimeSeedCounter = 0;

/**
 * Generate a per-instance numeric seed for a slime.
 *
 * Uses the current time plus a small in-process counter to avoid collisions
 * when multiple slimes are created in the same millisecond. This is not
 * cryptographically secure but is stable enough for visuals and PRD RNG.
 */
export function generateSlimeSeed(): number {
  const now = Date.now() % 1_000_000_000; // keep it reasonably small
  slimeSeedCounter = (slimeSeedCounter + 1) % 1_000;
  return now * 1_000 + slimeSeedCounter;
}

// --- Weighted random helpers ---

/**
 * Pick a weighted index from an array of weights.
 * Weights do not need to sum to 1; negative weights are treated as 0.
 */
export function pickWeightedIndex(weights: number[]): number {
  const sanitized = weights.map((w) => (w > 0 ? w : 0));
  const sum = sanitized.reduce((a, b) => a + b, 0);
  if (sum <= 0) return 0;
  let r = Math.random() * sum;
  for (let i = 0; i < sanitized.length; i++) {
    r -= sanitized[i];
    if (r <= 0) return i;
  }
  return sanitized.length - 1;
}

/**
 * Pick a weighted item from an array using its `weight` field.
 * If all weights are null/zero, falls back to the first item.
 */
export function pickWeighted<T extends { weight: number | null }>(items: T[]): T {
  if (items.length === 0) {
    throw new Error('pickWeighted called with empty array');
  }
  const weights = items.map((i) => i.weight ?? 0);
  const idx = pickWeightedIndex(weights);
  return items[idx] ?? items[0];
}

