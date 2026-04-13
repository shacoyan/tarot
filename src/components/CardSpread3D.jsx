import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import TarotCard3D from './TarotCard3D';
import { FlipParticles } from './Particles';
import { createCardBackTexture } from '../textures/cardBack';

// ── カード配置計算 ──────────────────────────────────────────────
function getCardLayout(index, focusIndex, totalCards) {
  const spacing = 2.0;
  let offset = index - focusIndex;
  if (offset > totalCards / 2) offset -= totalCards;
  if (offset < -totalCards / 2) offset += totalCards;
  const x = offset * spacing;

  if (offset === 0) {
    return {
      position: [x, 0, 1.5],
      rotation: [0, 0, 0],
      scale: 1.0,
    };
  }

  const direction = offset > 0 ? -1 : 1;
  const distance = Math.abs(offset);
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
  onDeselect,
  isShuffling,
}) {
  // ── フォーカスインデックス ─────────────────────────────────────────
  const [focusIndex, setFocusIndex] = useState(11);
  const cardClickedRef = useRef(false);

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
      const N = cards.length;
      let next = prev;
      for (let i = 0; i < N; i++) {
        next = ((next + delta) % N + N) % N;
        if (!selectedCards.includes(next)) return next;
      }
      return prev;
    });
  }, [flipState, isShuffling, shufflePhase, cards.length, selectedCards]);

  // ── 中央カードクリック ────────────────────────────────────────────
  const handleCardClick = useCallback((index) => {
    cardClickedRef.current = true;
    if (selectedCards.includes(index)) return;
    if (flipState !== 'idle' || isShuffling || shufflePhase !== 'idle') return;
    setFocusIndex(index);
    onSelectCard(index);
  }, [selectedCards, flipState, isShuffling, shufflePhase, onSelectCard]);

  // ── 慣性スクロール ──────────────────────────────────────────────
  const inertiaTimers = useRef([]);

  const scrollWithInertia = useCallback((direction, velocity) => {
    // 既存の慣性タイマーをキャンセル
    inertiaTimers.current.forEach(clearTimeout);
    inertiaTimers.current = [];

    // 速度に応じてスクロール枚数を決定（1〜6枚）
    const count = Math.min(Math.max(1, Math.floor(velocity * 4)), 6);

    // 1枚目は即座に、以降は減速しながら送る
    handleScroll(direction);
    for (let i = 1; i < count; i++) {
      const delay = i * 100 + i * i * 20; // 加速度的に遅くなる
      const t = setTimeout(() => handleScroll(direction), delay);
      inertiaTimers.current.push(t);
    }
  }, [handleScroll]);

  // ── ジェスチャー処理（横スクロール / 縦スワイプ判定）─────────────
  const { gl } = useThree();

  useEffect(() => {
    const dom = gl.domElement;
    let startX = 0;
    let startY = 0;
    let startTime = 0;

    const onDown = (e) => {
      e.preventDefault();
      startX = e.clientX;
      startY = e.clientY;
      startTime = Date.now();
    };

    const onUp = (e) => {
      e.preventDefault();
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      if (absDx > absDy && absDx > 40) {
        // 横スワイプ → 慣性スクロール
        const elapsed = Math.max(Date.now() - startTime, 1);
        const velocity = absDx / elapsed; // px/ms
        scrollWithInertia(dx < 0 ? 1 : -1, velocity);
      } else if (absDy > absDx && absDy > 30) {
        // 縦スワイプ → めくり（onSwipeに委譲）
        if (onSwipe) {
          onSwipe(dy < 0 ? 'top' : 'bottom');
        }
      } else if (absDx < 10 && absDy < 10) {
        // タップ — カード外なら選択解除
        if (!cardClickedRef.current && onDeselect) {
          onDeselect();
        }
      }
      cardClickedRef.current = false;
    };

    dom.addEventListener('pointerdown', onDown, { passive: false });
    dom.addEventListener('pointerup', onUp, { passive: false });

    return () => {
      dom.removeEventListener('pointerdown', onDown);
      dom.removeEventListener('pointerup', onUp);
      inertiaTimers.current.forEach(clearTimeout);
    };
  }, [gl, scrollWithInertia, onSwipe, onDeselect]);

  return (
    <group>
      {cards.map((card, i) => {
        // リング距離チェック — 表示範囲外はスキップ
        const N = cards.length;
        let ringOffset = i - focusIndex;
        if (ringOffset > N / 2) ringOffset -= N;
        if (ringOffset < -N / 2) ringOffset += N;
        if (Math.abs(ringOffset) > 5) return null;

        const isSelected = selectedCards.includes(i);
        const isCurrentlySelecting =
          isSelected &&
          selectedCards[selectedCards.length - 1] === i &&
          selectedCards.length > confirmedCount;

        const isConfirmed = isSelected && !isCurrentlySelecting;

        const isFlipped = isCurrentlySelecting &&
          (flipState === 'flipping' || flipState === 'flipped');

        // レイアウト計算
        const layout = getCardLayout(i, focusIndex, cards.length);

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
