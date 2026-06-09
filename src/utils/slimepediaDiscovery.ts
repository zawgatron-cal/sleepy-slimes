import { isDevSlimepediaUnlocked } from '@/src/stores/useDevSettingsStore';

export function isSlimepediaSpeciesDiscovered(
  speciesId: string,
  discoveredIds: ReadonlySet<string>
): boolean {
  if (isDevSlimepediaUnlocked()) return true;
  return discoveredIds.has(speciesId);
}
