import { Canvas } from '@react-three/fiber';
import { BackgroundParticles } from './Particles';

export default function TarotScene({ children }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 8], fov: 50 }}
      style={{ width: '100%', height: '100vh' }}
    >
      <fog attach="fog" args={['#0a0a1a', 8, 20]} />

      {/* 環境光 */}
      <ambientLight intensity={0.7} />

      {/* メインのポイントライト（白系） */}
      <pointLight position={[5, 5, 5]} intensity={1.0} />

      {/* 正面からの補助ライト（カード表面用） */}
      <pointLight position={[0, 0, 6]} intensity={0.5} />

      {/* サブのポイントライト（紫系） */}
      <pointLight position={[-5, 3, 3]} intensity={0.4} color="#a89cc8" />

      {/* 背景パーティクル（星空） */}
      <BackgroundParticles />

      {/* カード等のchildren */}
      {children}
    </Canvas>
  );
}
