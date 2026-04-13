import { useMemo, useState, useCallback, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import TarotCard3D from './TarotCard3D';
import { FlipParticles } from './Particles';
import { createCardBackTexture } from '../textures/cardBack';

// ── カード配置計算 ──────────────────────────────────────────────
function getCardLayout(index, focusIndex) {
  const spacing = 2.0;
  const x = (index - focusIndex) * spacing;

  if (index === focusIndex) {
    return {
      position: [x, 0, 1.5],
      rotation: [0, 0, 0],
      scale: 1.0,
    };
  }

  const direction = index > focusIndex ? -1 : 1;
  const distance = Math.abs(index - focusIndex);
  const ry = direction * 0.15 * Math.min(distance, 3);

  return {
    position: [x, -0.2, 0],
    rotation: [0, ry, 0],
    scale: 0.75,
  };
}

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
  // ── フォーカスインデックス ─────────────────────────────────────────
  const [focusIndex, setFocusIndex] = useState(3);

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

  // ── 横スクロール処理 ──────────────────────────────────────────────
  const handleScroll = useCallback((delta) => {
    if (flipState !== 'idle' || isShuffling || shufflePhase !== 'idle') return;

    setFocusIndex((prev) => {
      let next = prev;
      const limit = cards.length - 1;

      // deltaの方向に未選択カードを探す
      do {
        next += delta;
      } while (
        next >= 0 &&
        next <= limit &&
        selectedCards.includes(next)
      );

      if (next < 0 || next > limit) return prev;
      return next;
    });
  }, [flipState, isShuffling, shufflePhase, cards.length, selectedCards]);

  // ── 中央カードクリック ────────────────────────────────────────────
  const handleCardClick = useCallback((index) => {
    if (index !== focusIndex) return;
    if (selectedCards.includes(index)) return;
    if (flipState !== 'idle' || isShuffling || shufflePhase !== 'idle') return;
    onSelectCard(index);
  }, [focusIndex, selectedCards, flipState, isShuffling, shufflePhase, onSelectCard]);

  // ── ジェスチャー処理（横スクロール / 縦スワイプ判定）─────────────
  const { gl } = useThree();

  useEffect(() => {
    const dom = gl.domElement;
    let startX = 0;
    let startY = 0;

    const onDown = (e) => {
      e.preventDefault();
      startX = e.clientX;
      startY = e.clientY;
    };

    const onUp = (e) => {
      e.preventDefault();
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      if (absDx > absDy && absDx > 40) {
        // 横スワイプ → スクロール
        handleScroll(dx < 0 ? 1 : -1);
      } else if (absDy > absDx && absDy > 30) {
        // 縦スワイプ → めくり（onSwipeに委譲）
        if (onSwipe) {
          onSwipe(dy < 0 ? 'top' : 'bottom');
        }
      }
    };

    dom.addEventListener('pointerdown', onDown, { passive: false });
    dom.addEventListener('pointerup', onUp, { passive: false });

    return () => {
      dom.removeEventListener('pointerdown', onDown);
      dom.removeEventListener('pointerup', onUp);
    };
  }, [gl, handleScroll, onSwipe]);

  return (
    <group>
      {cards.map((card, i) => {
        const isSelected = selectedCards.includes(i);
        const isCurrentlySelecting =
          isSelected &&
          selectedCards[selectedCards.length - 1] === i &&
          selectedCards.length > confirmedCount;

        const isConfirmed = isSelected && !isCurrentlySelecting;

        const isFlipped = isCurrentlySelecting &&
          (flipState === 'flipping' || flipState === 'flipped');

        // レイアウト計算
        const layout = getCardLayout(i, focusIndex);

        // シャッフル中は集まるアニメーション
        let position, rotation;
        if (shufflePhase === 'gather' && !isSelected) {
          position = [0, -0.5, 0.3];
          rotation = [0, 0, 0];
        } else {
          position = layout.position;
          rotation = layout.rotation;
        }

        const opacity = isConfirmed ? 0 : 1;
        const isFocused = i === focusIndex && !isSelected;

        return (
          <group key={card.id}>
            <TarotCard3D
              card={card}
              position={position}
              rotation={rotation}
              scale={layout.scale}
              isSelected={isCurrentlySelecting}
              isFlipped={isFlipped}
              isReversed={card.hiddenOrientation === 'flipped'}
              flipDirection={isFlipped ? flipDirection : null}
              onClick={() => handleCardClick(i)}
              disabled={isSelected || isShuffling || shufflePhase !== 'idle' || flipState !== 'idle'}
              frontTexture={frontTextures[i]}
              backTexture={backTexture}
              opacity={opacity}
              isFocused={isFocused}
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
