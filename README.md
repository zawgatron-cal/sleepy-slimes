# Slime Lab (`experiments/slime-generator`)

Branch dedicated to learning **React Three Fiber**, **Three.js materials/shaders**, and building a **custom procedural slime generator** for Sleepy Slimes.

The main game app lives on other branches; this branch is intentionally minimal.

## Run

```bash
npm install
npx expo start
```

Use iOS Simulator, Android emulator, or Expo Go. Prefer a **physical device** for reliable GL performance.

## Project layout

| Path | Purpose |
|------|---------|
| `app/index.tsx` | Entry — opens Slime Lab |
| `src/slime-lab/` | R3F scene, slime mesh, lighting, canvas + orbit controls |
| `src/slime-lab/experiments/` | Notes / one-off shader prototypes |
| `assets/epic-slime-texture.png` | Default slime albedo |
| `assets/reference/` | Optional PBR texture sets for material experiments |

## Where to hack

- **`SlimeMesh.tsx`** — geometry + material (`MeshDistortMaterial` today; swap in custom shaders later)
- **`SlimeScene.tsx`** — compose lights, slime, future variants
- **`LabCanvas.tsx`** — camera defaults and orbit control wiring

Touch orbit: `r3f-native-orbitcontrols` (`{...events}` on the canvas wrapper `View`).

## Stack

- Expo 54 + React Native
- `@react-three/fiber/native` + `@react-three/drei/native`
- `three` + `r3f-native-orbitcontrols`

No SQLite, sleep tracking, collection, or fusion on this branch.
