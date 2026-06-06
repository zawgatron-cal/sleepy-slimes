/**
 * Master game data — re-exports for seeding and registry access.
 * Runtime game logic must read from DB (getSpecies, getSpawnTableEntries, getFusionRules, getZones).
 * Use SPECIES.* and ZONES.* when authoring fusion rules and spawn tables.
 */

export { SPECIES, type SpeciesKey } from './species';
export { ZONES, ZONE_IDS_IN_ORDER, sortZonesForDisplay, type ZoneKey } from './zones';
export { FUSION_RULES_MASTER } from './fusionRules';
export { SPAWN_TABLES_MASTER } from './spawnTables';
export { ZONE_TIER_WEIGHTS, type ZoneTierWeights } from './zoneTierWeights';
