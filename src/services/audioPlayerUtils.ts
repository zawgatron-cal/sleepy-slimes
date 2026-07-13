/**
 * Wait for an AudioPlayer to finish loading its source.
 */
import type { AudioPlayer } from 'expo-audio';

export async function waitForAudioPlayerLoaded(
  player: AudioPlayer,
  timeoutMs = 8000
): Promise<boolean> {
  if (player.isLoaded) return true;

  const start = Date.now();
  while (!player.isLoaded && Date.now() - start < timeoutMs) {
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  return player.isLoaded;
}
