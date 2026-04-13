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
  onSwipe,
  awaitingSwipe = false,
}) {
  const groupRef = useRef();
  const flipRef = useRef();
  const swipeStartY = useRef(0);
  const [hovered, setHovered] = useState(false);

  // X軸フリップの目標角度
  const flipTarget = flipDirection === 'top' ? -Math.PI
                   : flipDirection === 'bottom' ? Math.PI
                   : 0;

  const animRef = useRef({
    px: position[0],
    py: position[1],
    pz: position[2],
    rz: rotation[2],
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
      targetZ = 2;
    }

    // ホバー浮遊
    const targetHoverY = hovered && !isSelected ? 0.3 : 0;
    state.hoverY += (targetHoverY - state.hoverY) * speed;

    // position lerp
    state.px += (targetX - state.px) * speed;
    state.py += (targetY + state.hoverY - state.py) * speed;
    state.pz += (targetZ - state.pz) * speed;

    // X軸フリップ角度 lerp
    const targetFlip = isFlipped ? flipTarget : 0;
    state.flipAngle += (targetFlip - state.flipAngle) * speed;

    // Z回転: 正位置はフリップ後にZ-PI補正（X軸フリップの上下反転を戻す）
    // 逆位置はそのまま（上下反転=逆位置表示）
    const targetRZ = isFlipped && !isReversed
      ? rotation[2] + Math.PI
      : rotation[2];
    state.rz += (targetRZ - state.rz) * speed;

    groupRef.current.position.set(state.px, state.py, state.pz);
    groupRef.current.rotation.set(0, 0, state.rz);
    flipRef.current.rotation.set(state.flipAngle, 0, 0);
  });

  const handlePointerOver = (e) => {
    if (disabled) return;
    e.stopPropagation();
    setHovered(true);
    document.body.style.cursor = awaitingSwipe ? 'grab' : 'pointer';
  };

  const handlePointerOut = () => {
    setHovered(false);
    document.body.style.cursor = 'default';
  };

  const handleClick = (e) => {
    if (disabled || awaitingSwipe) return;
    e.stopPropagation();
    onClick?.();
  };

  const handleSwipeStart = (e) => {
    e.stopPropagation();
    swipeStartY.current = e.clientY;
  };

  const handleSwipeEnd = (e) => {
    e.stopPropagation();
    const diff = e.clientY - swipeStartY.current;
    if (diff < -30 && onSwipe) onSwipe('top');
    if (diff > 30 && onSwipe) onSwipe('bottom');
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
          onPointerDown={awaitingSwipe ? handleSwipeStart : undefined}
          onPointerUp={awaitingSwipe ? handleSwipeEnd : undefined}
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
