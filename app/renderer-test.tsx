/**
 * Blank sandbox for renderer experiments — open from More → Renderer Test.
 */

import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { mainScreens } from '@/src/theme/mainScreensTheme';
import { createAppStyles } from '@/src/theme/createAppStyles';
import { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber/native';
import { Object3D, Sphere, SphereGeometry } from 'three';


function cycleColor(color: string) {
  const colors = ['hotpink', 'blue', 'orange', 'purple', 'green', 'yellow'];
  return colors[(colors.indexOf(color) + 1) % colors.length];
}

function Box(props) {
  const meshRef = useRef(null);
  const [hovered, setHover] = useState(false);
  const [color, setColor] = useState("hotpink");
  const [speed, setSpeed] = useState(1);
  useFrame((state, delta, xFrame) => {
    if (hovered) {
      setSpeed(speed * 1.01);
    }
    else
    {
      setSpeed(1);
    }
    meshRef.current.rotation.z += delta * speed;
    meshRef.current.rotation.x += delta * speed;
  });
  return (
    <mesh
      {...props}
      ref={meshRef}
      scale={1}
      onClick={(event) => setColor(cycleColor(color))}
      onPointerOver={(event) => setHover(true)}
      onPointerOut={(event) => setHover(false)}
    >
      <boxGeometry args={[1, 1, 1]} />
      {/* <sphereGeometry args={[1, 32, 32]} /> */}
      <meshStandardMaterial color={color} roughness={0}/>
    </mesh>
  );
}

function RotatingSpotLight(props) {
  const lightRef = useRef(null);

  useFrame((state, delta, xFrame) => {
    const light = lightRef.current;
    if (!light) return;
    light.position.x = Math.cos(state.clock.elapsedTime) * 10;
    light.position.y = Math.sin(state.clock.elapsedTime) * 10;
    light.position.z = 0;
  });
  return (
    <spotLight ref={lightRef} position={[10, 0, 0]} color = "white" angle={Math.PI / 3} penumbra={1} decay={1} intensity={5 * Math.PI}/>
  );
}

export default function RendererTestScreen() {
  const router = useRouter();

  return (
    <Canvas>
      {/* <ambientLight intensity={Math.PI / 2} />
      <pointLight position = {[0, 0, 0]} intensity={10}></pointLight>
      <mesh>
        <sphereGeometry />
        <meshStandardMaterial color="hotpink" />
      </mesh> */}

      <ambientLight intensity={Math.PI / 3} />
      <RotatingSpotLight position={[0, 0, 0]}/>
      {/* <pointLight position={[-10, -10, -10]} decay={0} intensity={Math.PI} /> */}
      <Box position={[0, 0, 0]} />
    </Canvas>
  );
}

const styles = createAppStyles({
  container: {
    flex: 1,
    backgroundColor: mainScreens.idle.bg,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    flexShrink: 0,
  },
  backBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingRight: 12,
    marginBottom: 4,
  },
  backText: {
    fontSize: 16,
    fontWeight: '700',
    color: mainScreens.idle.primaryText,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: mainScreens.idle.primaryText,
  },
  canvas: {
    flex: 1,
  },
});
