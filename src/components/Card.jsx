import React, { useState, useRef, useCallback, useEffect } from 'react';

export default function Card({ card, index, onFlip, isFlipped, isReversed, large }) {
  const containerRef = useRef(null);
  const [squeezeDirection, setSqueezeDirection] = useState(null);
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [autoCompleting, setAutoCompleting] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const startPos = useRef(null);
  const directionRef = useRef(null);
  const rafRef = useRef(null);
  const progressRef = useRef(0);

  const getCardHeight = useCallback(() => {
    if (containerRef.current) return containerRef.current.offsetHeight;
    return large ? 320 : 180;
  }, [large]);

  const handleDragStart = useCallback((clientY) => {
    if (isFlipped || autoCompleting) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const relativeY = clientY - rect.top;
    const dir = relativeY < rect.height / 2 ? 'top' : 'bottom';
    directionRef.current = dir;
    setSqueezeDirection(dir);
    startPos.current = clientY;
    setIsDragging(true);
    setProgress(0);
    progressRef.current = 0;
  }, [isFlipped, autoCompleting]);

  const handleDragMove = useCallback((clientY) => {
    if (!isDragging || startPos.current === null || !directionRef.current) return;
    const cardHeight = getCardHeight();
    const delta = Math.abs(clientY - startPos.current);
    const newProgress = Math.min((delta / cardHeight) * 100, 100);
    progressRef.current = newProgress;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => setProgress(newProgress));
  }, [isDragging, getCardHeight]);

  const handleDragEnd = useCallback(() => {
    if (!isDragging || !directionRef.current) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setIsDragging(false);

    if (progressRef.current >= 50) {
      setAutoCompleting(true);
      setProgress(100);
      setTimeout(() => {
        setFadeOut(true);
        setTimeout(() => {
          onFlip(index, directionRef.current);
          setAutoCompleting(false);
          setFadeOut(false);
          setSqueezeDirection(null);
          setProgress(0);
          progressRef.current = 0;
        }, 300);
      }, 400);
    } else {
      setProgress(0);
      progressRef.current = 0;
      setTimeout(() => setSqueezeDirection(null), 300);
    }
    startPos.current = null;
  }, [isDragging, index, onFlip]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onTouchMove = (e) => {
      if (isDragging) {
        e.preventDefault();
        handleDragMove(e.touches[0].clientY);
      }
    };
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => el.removeEventListener('touchmove', onTouchMove);
  }, [isDragging, handleDragMove]);

  const onTouchStart = (e) => handleDragStart(e.touches[0].clientY);
  const onTouchEnd = () => handleDragEnd();
  const onMouseDown = (e) => { e.preventDefault(); handleDragStart(e.clientY); };
  const onMouseMove = (e) => handleDragMove(e.clientY);
  const onMouseUp = () => handleDragEnd();
  const onMouseLeave = () => { if (isDragging) handleDragEnd(); };

  // 裏面をclip-pathで削る（表面が下に固定配置されているので、削った分だけ表面が見える）
  const getBackClipPath = () => {
    if (!squeezeDirection || progress <= 0) return 'inset(0 0 0 0)'; // 全体表示
    const p = Math.min(progress, 100);
    if (squeezeDirection === 'top') {
      // 上からめくる → 上側を削る
      return `inset(${p}% 0 0 0)`;
    } else {
      // 下からめくる → 下側を削る
      return `inset(0 0 ${p}% 0)`;
    }
  };

  // 折り目の影の位置
  const getFoldShadowStyle = () => {
    if (!squeezeDirection || progress <= 2) return { display: 'none' };
    const p = Math.min(progress, 100);
    if (squeezeDirection === 'top') {
      return { top: `${p}%`, transform: 'translateY(-50%)' };
    } else {
      return { top: `${100 - p}%`, transform: 'translateY(-50%)' };
    }
  };

  const showHints = !isFlipped && !isDragging && !squeezeDirection;
  const transitionStyle = isDragging ? 'none' : 'clip-path 0.3s ease';

  return (
    <div
      ref={containerRef}
      className={`card-container ${isFlipped ? 'flipped' : ''} ${isReversed ? 'reversed' : ''} ${large ? 'card-large' : ''} ${isDragging ? 'squeezing' : ''}`}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
    >
      {isFlipped ? (
        <div className="card-inner flipped-inner">
          <div className="card-face card-front squeeze-front-visible">
            <div className="card-number">{card.id === 0 ? '0' : card.id}</div>
            <div className="card-symbol">{card.symbol}</div>
            <div className="card-name">{card.name}</div>
            <div className="card-orientation">
              {isReversed ? '逆位置' : '正位置'}
            </div>
          </div>
        </div>
      ) : (
        <div className={`card-inner squeeze-mode ${fadeOut ? 'squeeze-fade-out' : ''}`}>
          {/* 表面: z-index低く下に固定。裏面が削れると見えてくる */}
          <div className="card-face card-front squeeze-front-under">
            <div className="card-number">{card.id === 0 ? '0' : card.id}</div>
            <div className="card-symbol">{card.symbol}</div>
            <div className="card-name">{card.name}</div>
          </div>

          {/* 裏面: z-index高く上に重なる。clip-pathで削られていく */}
          <div
            className="card-face card-back squeeze-back"
            style={{ clipPath: getBackClipPath(), transition: transitionStyle }}
          >
            <div className="card-back-design">
              <div className="card-back-border">
                <div className="card-back-symbol">✦</div>
                <div className="card-back-star">★</div>
                <div className="card-back-symbol bottom">✦</div>
              </div>
            </div>
          </div>

          {/* 折り目の影 */}
          {squeezeDirection && progress > 2 && (
            <div className="squeeze-fold-shadow" style={getFoldShadowStyle()} />
          )}

          {/* ヒント */}
          {showHints && (
            <div className="squeeze-hints">
              <div className="squeeze-hint-zone top-zone">
                <span className="squeeze-hint-text">↑ ここから覗く</span>
              </div>
              <div className="squeeze-hint-zone bottom-zone">
                <span className="squeeze-hint-text">↓ ここから覗く</span>
              </div>
            </div>
          )}

          {/* 進捗バー */}
          {(isDragging || autoCompleting) && progress > 5 && (
            <div className={`squeeze-progress-bar ${squeezeDirection}`}>
              <div
                className="squeeze-progress-fill"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
