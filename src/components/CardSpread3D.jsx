import { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import TarotCard3D from './TarotCard3D';
import { FlipParticles } from './Particles';
import { createCardBackTexture } from '../textures/cardBack';

export default function CardSpread3D({
  cards,
  selectedCards,
  confirmedCount,
  flipState,
  flipDirection,
  onSelectCard,
  onSwipe,
  isShuffling,
}) {
  // ── シャッフルフェーズ管理 ─────────────────────────────────────────
  const [shufflePhase, setShufflePhase] = useState('idle');

  useEffect(() => {
    if (isShuffling) {
      setShufflePhase('gather');
      const t1 = setTimeout(() => setShufflePhase('spread'), 500);
      const t2 = setTimeout(() => setShufflePhase('idle'), 1100);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [isShuffling]);

  // ── 共通裏面テクスチャ ────────────────────────────────────────────
  const backTexture = useMemo(() => {
    const canvas = createCardBackTexture();
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, []);

  // ── 各カードの表面テクスチャ ──────────────────────────────────────
  const frontTextures = useMemo(() => {
    const loader = new THREE.TextureLoader();
    return cards.map((card) => {
      const tex = loader.load(card.image);
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    });
  }, [cards]);

  // ── カードクリックハンドラ ────────────────────────────────────────
  const handleCardClick = useCallback(
    (index) => {
      if (selectedCards.includes(index)) return;
      if (isShuffling) return;
      onSelectCard(index);
    },
    [selectedCards, onSelectCard, isShuffling]
  );

  return (
    <group>
      {cards.map((card, i) => {
        const angle = (i - 3) * 0.2;
        const baseX = Math.sin(angle) * 3;
        const baseY = Math.cos(angle) * 0.5 - 1;
        const baseZ = 0;
        const rotZ = -(i - 3) * 0.15;

        const isSelected = selectedCards.includes(i);
        const isCurrentlySelecting =
          isSelected &&
          selectedCards[selectedCards.length - 1] === i &&
          selectedCards.length > confirmedCount;

        const isConfirmed = isSelected && !isCurrentlySelecting;

        // カード選択中かつフリップ中/済みの場合のみフリップ
        const isFlipped = isCurrentlySelecting &&
          (flipState === 'flipping' || flipState === 'flipped');

        // シャッフル中の位置オーバーライド
        let position, rotation;
        if (shufflePhase === 'gather' && !isSelected) {
          position = [0, -0.5, 0.3];
          rotation = [0, 0, 0];
        } else {
          position = [baseX, baseY, baseZ];
          rotation = [0, 0, rotZ];
        }

        const opacity = isConfirmed ? 0 : 1;

        return (
          <group key={card.id}>
            <TarotCard3D
              card={card}
              position={position}
              rotation={rotation}
              isSelected={isCurrentlySelecting}
              isFlipped={isFlipped}
              isReversed={card.hiddenOrientation === 'flipped'}
              flipDirection={isFlipped ? flipDirection : null}
              onClick={() => handleCardClick(i)}
              disabled={isSelected || isShuffling || shufflePhase !== 'idle' || flipState !== 'idle'}
              frontTexture={frontTextures[i]}
              backTexture={backTexture}
              opacity={opacity}
              onSwipe={isCurrentlySelecting ? onSwipe : undefined}
              awaitingSwipe={isCurrentlySelecting && flipState === 'selected'}
            />

            <FlipParticles
              active={isFlipped}
              position={isFlipped ? [0, 0, 2] : position}
            />
          </group>
        );
      })}
    </group>
  );
}
