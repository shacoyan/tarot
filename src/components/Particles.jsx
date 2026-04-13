import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ─────────────────────────────────────────────
// BackgroundParticles — 背景の星空パーティクル
// ─────────────────────────────────────────────
export function BackgroundParticles() {
  const pointsRef = useRef();
  const COUNT = 200;

  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    const colors = new Float32Array(COUNT * 3);

    const gold = new THREE.Color('#c9a84c');
    const purple = new THREE.Color('#a89cc8');

    for (let i = 0; i < COUNT; i++) {
      // 広い空間にランダム配置
      positions[i * 3 + 0] = (Math.random() - 0.5) * 30;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 15 - 5;

      // 金色と紫をミックス
      const c = Math.random() < 0.5 ? gold : purple;
      colors[i * 3 + 0] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    return { positions, colors };
  }, []);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    // ゆっくり回転
    pointsRef.current.rotation.y += delta * 0.03;
    pointsRef.current.rotation.x += delta * 0.01;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation
      />
    </points>
  );
}

// ─────────────────────────────────────────────
// FlipParticles — カードめくり時のバーストエフェクト
// ─────────────────────────────────────────────
export function FlipParticles({ active = false, position = [0, 0, 0] }) {
  const pointsRef = useRef();
  const COUNT = 50;
  const LIFETIME = 1.5; // 秒

  // パーティクルの初期速度と経過時間
  const state = useRef({
    elapsed: 0,
    velocities: new Float32Array(COUNT * 3),
    initialized: false,
  });

  const positions = useMemo(() => new Float32Array(COUNT * 3), []);

  // active が切り替わるたびに初期化
  useMemo(() => {
    if (active) {
      const vel = state.current.velocities;
      for (let i = 0; i < COUNT; i++) {
        // 球面上にランダムな放射方向
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const speed = 1.5 + Math.random() * 2.5;
        vel[i * 3 + 0] = Math.sin(phi) * Math.cos(theta) * speed;
        vel[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * speed;
        vel[i * 3 + 2] = Math.cos(phi) * speed;

        // 初期位置を中心に
        positions[i * 3 + 0] = position[0];
        positions[i * 3 + 1] = position[1];
        positions[i * 3 + 2] = position[2];
      }
      state.current.elapsed = 0;
      state.current.initialized = true;
    }
  }, [active]); // eslint-disable-line react-hooks/exhaustive-deps

  useFrame((_, delta) => {
    if (!pointsRef.current || !active || !state.current.initialized) return;

    state.current.elapsed += delta;
    const t = state.current.elapsed;
    const progress = Math.min(t / LIFETIME, 1);

    const geo = pointsRef.current.geometry;
    const posAttr = geo.attributes.position;
    const vel = state.current.velocities;

    for (let i = 0; i < COUNT; i++) {
      posAttr.array[i * 3 + 0] = position[0] + vel[i * 3 + 0] * t;
      posAttr.array[i * 3 + 1] = position[1] + vel[i * 3 + 1] * t - 0.5 * t * t; // 重力
      posAttr.array[i * 3 + 2] = position[2] + vel[i * 3 + 2] * t;
    }
    posAttr.needsUpdate = true;

    // 透明度をフェードアウト
    if (pointsRef.current.material) {
      pointsRef.current.material.opacity = 1 - progress;
    }
  });

  if (!active) return null;

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
        color="#c9a84c"
        transparent
        opacity={1}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}
