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

## Structure

- **`app/`** — Expo Router: `(tabs)` = Sleep | Collection | Fusion.
- **`src/types/`** — Slime, Species, Zone, SleepSession, etc. (data structures only; no slime visuals yet).
- **`src/stores/`** — `useCandiesStore`, `useCollectionStore`, `useSleepStore`.
- **`src/db/`** — SQLite schema and `getDb()`; tables: species, slimes, fusion_rules, sleep_sessions.
- **`src/constants/zones.ts`** — Zone definitions (Cozy Bedroom, Forest Cabin, etc.).

## Features (baseline)

1. **Sleep** — Zone selection, Start/Stop sleep, placeholders for duration/quality and alarm.
2. **Collection** — Inventory count + empty state; Encyclopedia placeholder.
3. **Fusion** — Placeholder for “Slime A + Slime B” and candy cost; logic to be wired later.
4. **Slimes** — Types and DB schema only; species/fusion data and rendering come later.

Comments are in the code; expand from this baseline per PRD.
