import { Suspense } from 'react';
import { SlimeMesh } from '../components/SlimeMesh';
import { LabLighting } from '../components/LabLighting';

export function SlimeScene() {
  return (
    <Suspense fallback={null}>
      <LabLighting />
      <SlimeMesh position={[0, 0, 0]} />
    </Suspense>
  );
}
