import { Tier } from '@/src/constants/game';
import { PLAYER_SETTING_KEYS } from '@/src/constants/playerSettings';
import { getSlimepediaDiscoveredSpeciesIds, getSpecies } from '@/src/db';
import { useTutorialStore } from '@/src/stores';
import { countUltraRareDiscoveries } from '@/src/utils/zoneUnlock';

/** Queue zone + slimepedia tutorials after an Ultra Rare slimepedia discovery. */
export async function maybeQueueZoneUnlockTutorial(speciesId: string): Promise<void> {
  const { isStepComplete, zoneUnlockTutorialPending, markZoneUnlockTutorialPending } =
    useTutorialStore.getState();
  if (zoneUnlockTutorialPending) return;
  if (isStepComplete('zone_unlock_guide') && isStepComplete('slimepedia_guide')) return;

  const [species, discoveredSpeciesIds] = await Promise.all([
    getSpecies(),
    getSlimepediaDiscoveredSpeciesIds(),
  ]);
  const speciesById = Object.fromEntries(species.map((s) => [s.id, s]));
  if (speciesById[speciesId]?.tier !== Tier.ULTRA_RARE) return;

  const ultraRareCount = countUltraRareDiscoveries(discoveredSpeciesIds, speciesById);
  if (ultraRareCount < 1) return;

  markZoneUnlockTutorialPending();
}
