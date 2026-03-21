/**
 * Load species and zones once for screens that need DB-backed lists (e.g. sleep, sorting slimes).
 */

import { useEffect, useState } from 'react';
import { getSpecies, getZones } from '@/src/db';
import type { Species, Zone } from '@/src/types';

export function useSleepDataLoader(): {
  speciesList: Species[];
  zones: Zone[];
} {
  const [speciesList, setSpeciesList] = useState<Species[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);

  useEffect(() => {
    getSpecies().then(setSpeciesList);
    getZones().then(setZones);
  }, []);

  return { speciesList, zones };
}
