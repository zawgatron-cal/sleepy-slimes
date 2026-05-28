import { type ComponentType, type ReactNode } from 'react';
import { Canvas } from '@react-three/fiber/native';
import type { OrbitControlsProps } from 'r3f-native-orbitcontrols';

type LabCanvasProps = {
  children: ReactNode;
  OrbitControls: ComponentType<OrbitControlsProps>;
};

export function LabCanvas({ children, OrbitControls }: LabCanvasProps) {
  return (
    <Canvas camera={{ position: [0, 0, 4.5], fov: 45 }} style={{ flex: 1 }}>
      <OrbitControls
        enableRotate
        enableZoom
        enablePan={false}
        minPolarAngle={0.15}
        maxPolarAngle={Math.PI - 0.15}
      />
      {children}
    </Canvas>
  );
}
