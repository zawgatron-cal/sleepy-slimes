/** Default lighting rig for slime previews. */

export function LabLighting() {
  return (
    <>
      <ambientLight intensity={Math.PI * 0.4} />
      <directionalLight position={[4, 6, 5]} intensity={1.2} />
      <pointLight position={[-4, -2, -3]} intensity={0.6} color="#ff9ece" />
    </>
  );
}
