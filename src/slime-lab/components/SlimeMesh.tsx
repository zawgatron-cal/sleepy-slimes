/**
 * Procedural slime body — swap materials here while learning shaders / R3F.
 */

import { MeshDistortMaterial, useTexture } from '@react-three/drei/native';
import type { ThreeElements } from '@react-three/fiber/native';

type SlimeMeshProps = ThreeElements['mesh'] & {
  color?: string;
  distort?: number;
  speed?: number;
};

export function SlimeMesh({
  color = '#7dcfff',
  distort = 0.35,
  speed = 2,
  ...meshProps
}: SlimeMeshProps) {
  const [colorMap] = useTexture([require('@/assets/epic-slime-texture.png')]);

  return (
    <mesh {...meshProps}>
      <sphereGeometry args={[1, 128, 128]} />
      <MeshDistortMaterial
        map={colorMap}
        color={color}
        distort={distort}
        speed={speed}
        roughness={0.2}
        metalness={0.05}
      />
    </mesh>
  );
}
