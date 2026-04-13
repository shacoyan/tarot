import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const cardWidth = 1.4;
const cardHeight = 2.0;

export default function TarotCard3D({
  card,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  isSelected = false,
  isFlipped = false,
  isReversed = false,
  flipDirection = null, // 'top' | 'bottom' | null
  onClick,
  disabled = false,
  frontTexture,
  backTexture,
  opacity = 1,
  scale = 1,
  isFocused = false,
}) {
  const groupRef = useRef();
  const flipRef = useRef();
  const [hovered, setHovered] = useState(false);

  // X軸フリップの目標角度
  const flipTarget = flipDirection === 'top' ? -Math.PI
                   : flipDirection === 'bottom' ? Math.PI
                   : 0;

  const animRef = useRef({
    px: position[0],
    py: position[1],
    pz: position[2],
    ry: rotation[1] || 0,
    rz: rotation[2] || 0,
    sc: scale,
    hoverY: 0,
    flipAngle: 0,
  });

  useFrame(() => {
    if (!groupRef.current || !flipRef.current) return;
    const state = animRef.current;
    const speed = 0.08;

    // 目標position
    let targetX = position[0];
    let targetY = position[1];
    let targetZ = position[2];

    if (isSelected) {
      targetX = 0;
      targetY = 0;
      targetZ = 3;
    }

    // ホバー浮遊（フォーカスカードのみ）
    const targetHoverY = hovered && isFocused && !isSelected ? 0.2 : 0;
    state.hoverY += (targetHoverY - state.hoverY) * speed;

    // position lerp
    state.px += (targetX - state.px) * speed;
    state.py += (targetY + state.hoverY - state.py) * speed;
    state.pz += (targetZ - state.pz) * speed;

    // scale lerp
    const targetScale = isSelected ? 1.0 : scale;
    state.sc += (targetScale - state.sc) * speed;

    // X軸フリップ角度 lerp
    const targetFlip = isFlipped ? flipTarget : 0;
    state.flipAngle += (targetFlip - state.flipAngle) * speed;

    // Y回転 lerp（カルーセルの内向き回転）
    const targetRY = isSelected ? 0 : (rotation[1] || 0);
    state.ry += (targetRY - state.ry) * speed;

    // Z回転: 正位置はフリップ後にZ-PI補正
    const targetRZ = isFlipped && !isReversed
      ? (rotation[2] || 0) + Math.PI
      : (rotation[2] || 0);
    state.rz += (targetRZ - state.rz) * speed;

    groupRef.current.position.set(state.px, state.py, state.pz);
    groupRef.current.rotation.set(0, state.ry, state.rz);
    groupRef.current.scale.setScalar(state.sc);
    flipRef.current.rotation.set(state.flipAngle, 0, 0);
  });

  const handlePointerOver = (e) => {
    if (disabled) return;
    e.stopPropagation();
    setHovered(true);
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = () => {
    setHovered(false);
    document.body.style.cursor = 'default';
  };

  const handleClick = (e) => {
    if (disabled) return;
    e.stopPropagation();
    onClick?.();
  };

  const isTransparent = opacity < 1;

  return (
    <group ref={groupRef}>
      <group ref={flipRef}>
        {/* 当たり判定（カードより大きい透明ボックス） */}
        <mesh
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
          onClick={handleClick}
        >
          <boxGeometry args={[cardWidth + 0.5, cardHeight + 0.5, 0.15]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>

        {/* カード本体（薄い板）— 側面は金色 */}
        <mesh>
          <boxGeometry args={[cardWidth, cardHeight, 0.02]} />
          <meshStandardMaterial
            color="#c9a84c"
            transparent={isTransparent}
            opacity={opacity}
          />
        </mesh>

        {/* 裏面（+Z方向 = カメラ側、初期状態でカメラに見える） */}
        <mesh position={[0, 0, 0.011]}>
          <planeGeometry args={[cardWidth, cardHeight]} />
          <meshStandardMaterial
            map={backTexture ?? null}
            color={backTexture ? undefined : '#1a1040'}
            side={THREE.FrontSide}
            transparent={isTransparent}
            opacity={opacity}
          />
        </mesh>

        {/* 表面（-Z方向、フリップ後にカメラ側に向く） */}
        <mesh position={[0, 0, -0.011]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[cardWidth, cardHeight]} />
          <meshStandardMaterial
            map={frontTexture ?? null}
            color={frontTexture ? undefined : '#2a1a60'}
            side={THREE.FrontSide}
            transparent={isTransparent}
            opacity={opacity}
          />
        </mesh>
      </group>
    </group>
  );
}
