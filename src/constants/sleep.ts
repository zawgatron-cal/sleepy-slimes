/**
 * Sleep-related constants (validation, rewards). PRD: valid session = min duration met.
 */

/** Minimum duration (seconds) for a sleep session to count and award rewards. */
export const MIN_VALID_SLEEP_SECONDS = 10;

export function getMinValidSleepSeconds(): number {
  return MIN_VALID_SLEEP_SECONDS;
}
