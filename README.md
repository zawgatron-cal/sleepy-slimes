# Sleepy Slimes — Baseline

Mobile collection game powered by sleep. PRD: `prd.md`.

## Tech stack

- **React Native + Expo** (Expo Router with tabs)
- **Zustand** for state (candies, collection, sleep)
- **SQLite** (`expo-sqlite`) for species, slimes, fusion rules, sleep history

## Run

```bash
npm install
npx expo start
```

Then open in Expo Go (iOS/Android) or simulator.

**If the app or Metro times out:** run `npm run start:clear` (or `npx expo start --clear`) and try again. If using a physical device, ensure it’s on the same Wi‑Fi as your machine or try tunnel mode.

## Structure

- **`app/`** — Expo Router: `(tabs)` = Sleep | Collection | Fusion.
- **`src/types/`** — Slime, Species, Zone, SleepSession, FusionRule, ZoneSpawnWeight, etc.
- **`src/data/`** — Master game content (source of truth): species, zones, fusion rules, spawn tables. Seeded into SQLite on init; runtime reads go through DB only.
- **`src/stores/`** — `useCandiesStore`, `useCollectionStore`, `useSleepStore`.
- **`src/db/`** — SQLite schema, `getDb()`, `seedFromMasterData()`; tables: species, slimes, fusion_rules, sleep_sessions, candies_state, zones, zone_spawn_weights. Helpers: `getSpecies`, `getZones`, `getZoneSpawnWeights(zoneId)`, `getFusionRules`, `getFusionResultsForParents(a, b)`.
- Zones are loaded from DB via `getZones()` (seeded from `src/data/zones.ts`).

## Features (baseline)

1. **Sleep** — Zone selection, Start/Stop sleep, placeholders for duration/quality and alarm.
2. **Collection** — Inventory count + empty state; Encyclopedia placeholder.
3. **Fusion** — Placeholder for “Slime A + Slime B” and candy cost; logic to be wired later.
4. **Slimes** — Types and DB schema only; species/fusion data and rendering come later.

Comments are in the code; expand from this baseline per PRD.
