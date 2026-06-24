"use client";
import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import * as THREE from "three";

/**
 * A diegetic interaction point — a subtle circular ground glyph with a soft
 * upward ember, not a floating UI flag. Pulses gently, brightens on hover, and
 * opens the landmark's plaque on click. The whole point is that the world tells
 * you where to look without arrows or icons.
 */
export default function SanctumInteractionMarker({
  position,
  color = "#9fce8f",
  onSelect,
}: {
  position: [number, number, number];
  color?: string;
  onSelect?: () => void;
}) {
  const glyph = useRef<THREE.Mesh>(null!);
  const ember = useRef<THREE.Mesh>(null!);
  const [hover, setHover] = useState(false);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const pulse = 0.5 + 0.5 * Math.sin(t * 1.6);
    if (glyph.current) {
      const m = glyph.current.material as THREE.MeshBasicMaterial;
      m.opacity = (hover ? 0.7 : 0.32) + pulse * (hover ? 0.3 : 0.18);
      const s = 1 + pulse * 0.06 + (hover ? 0.12 : 0);
      glyph.current.scale.setScalar(s);
    }
    if (ember.current) {
      ember.current.position.y = 0.4 + pulse * 0.18;
      (ember.current.material as THREE.MeshBasicMaterial).opacity = (hover ? 0.9 : 0.5) * (0.5 + pulse * 0.5);
    }
  });

  return (
    <group
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHover(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHover(false);
        document.body.style.cursor = "";
      }}
    >
      {/* ground glyph ring */}
      <mesh ref={glyph} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
        <ringGeometry args={[0.42, 0.6, 40]} />
        <meshBasicMaterial color={color} transparent opacity={0.4} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
      {/* inner dot */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
        <circleGeometry args={[0.12, 24]} />
        <meshBasicMaterial color={color} transparent opacity={0.5} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </mesh>
      {/* soft rising ember */}
      <mesh ref={ember} position={[0, 0.4, 0]}>
        <sphereGeometry args={[0.07, 12, 12]} />
        <meshBasicMaterial color={color} transparent opacity={0.6} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </mesh>
      {/* invisible larger hit target so it's easy to click */}
      <mesh position={[0, 0.5, 0]} visible={false}>
        <cylinderGeometry args={[0.8, 0.8, 1.6, 8]} />
        <meshBasicMaterial />
      </mesh>
    </group>
  );
}
