import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import TarotCard3D from './TarotCard3D';
import { FlipParticles } from './Particles';
import { createCardBackTexture } from '../textures/cardBack';

// ── 物理定数 ────────────────────────────────────────────────────
const FRICTION = 0.96;
const MIN_VELOCITY = 0.003;
const SWIPE_SCALE = 0.035; // px/ms → cards/frame 変換係数

// ── カード配置計算（連続float対応）──────────────────────────────
function getCardLayout(index, scrollPos, totalCards) {
  const spacing = 2.8;
  let offset = index - scrollPos;
  if (offset > totalCards / 2) offset -= totalCards;
  if (offset < -totalCards / 2) offset += totalCards;
  const x = offset * spacing;

  const absOffset = Math.abs(offset);
  // 中央に近いほど大きく手前に（連続的に補間）
  const t = Math.max(0, 1 - absOffset); // 1 at center, 0 at ±1+
  const z = t * 1.5;
  const y = (1 - t) * -0.2;
  const scale = 0.75 + t * 0.25;

  const direction = offset > 0 ? -1 : 1;
  const ry = absOffset < 0.01 ? 0 : direction * 0.15 * Math.min(absOffset, 3);

  return {
    position: [x, y, z],
    rotation: [0, ry, 0],
    scale,
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
  // ── 連続スクロール位置（float）───────────────────────────────────
  const scrollPosRef = useRef(11);
  const scrollVelRef = useRef(0);
  const [scrollPos, setScrollPos] = useState(11);
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

  // ── 物理演算（useFrame内で毎フレーム更新）──────────────────────
  useFrame(() => {
    const vel = scrollVelRef.current;
    if (Math.abs(vel) < MIN_VELOCITY) {
      scrollVelRef.current = 0;
      return;
    }

    scrollPosRef.current += vel;
    scrollVelRef.current *= FRICTION;

    // ラップアラウンド（0〜N）
    const N = cards.length;
    scrollPosRef.current = ((scrollPosRef.current % N) + N) % N;

    // React再レンダーをトリガー（カード位置更新用）
    setScrollPos(scrollPosRef.current);
  });

  // ── スワイプ開始時に慣性を止める ──────────────────────────────────
  const stopInertia = useCallback(() => {
    scrollVelRef.current = 0;
  }, []);

  // ── カードクリック → 選択 & スクロールスナップ ────────────────────
  const handleCardClick = useCallback((index) => {
    cardClickedRef.current = true;
    if (selectedCards.includes(index)) return;
    if (flipState !== 'idle' || isShuffling || shufflePhase !== 'idle') return;

    // スクロール位置をカードにスナップ
    scrollPosRef.current = index;
    scrollVelRef.current = 0;
    setScrollPos(index);

    onSelectCard(index);
  }, [selectedCards, flipState, isShuffling, shufflePhase, onSelectCard]);

  // ── ジェスチャー処理 ──────────────────────────────────────────────
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
      // タッチした瞬間に慣性を止める
      stopInertia();
    };

    const onUp = (e) => {
      e.preventDefault();
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      if (absDx > absDy && absDx > 40) {
        // 横スワイプ → 慣性スクロール開始
        if (flipState === 'idle' && !isShuffling && shufflePhase === 'idle') {
          const elapsed = Math.max(Date.now() - startTime, 1);
          const velocity = (dx / elapsed) * SWIPE_SCALE;
          scrollVelRef.current = -velocity; // 指の方向と逆
        }
      } else if (absDy > absDx && absDy > 30) {
        // 縦スワイプ → めくり
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
    };
  }, [gl, stopInertia, flipState, isShuffling, shufflePhase, onSwipe, onDeselect]);

  // ── 最寄りのカードインデックス ────────────────────────────────────
  const N = cards.length;
  const nearestIndex = ((Math.round(scrollPos) % N) + N) % N;

  return (
    <group>
      {cards.map((card, i) => {
        // リング距離チェック — 表示範囲外はスキップ
        let ringOffset = i - scrollPos;
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

        // レイアウト計算（連続float）
        const layout = getCardLayout(i, scrollPos, N);

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
        const isFocused = i === nearestIndex && !isSelected;

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
