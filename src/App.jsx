import { useState, useCallback, useRef } from 'react';
import './App.css';
import TarotScene from './components/TarotScene';
import CardSpread3D from './components/CardSpread3D';
import ResultView from './components/ResultView';
import allCards from './data/cards';

const positionLabels = ['過去', '現在', '未来'];

function pickRandomCards(count, excludeIds = []) {
  const available = allCards.filter((c) => !excludeIds.includes(c.id));
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map((card) => ({
    ...card,
    hiddenOrientation: Math.random() < 0.5 ? 'normal' : 'flipped',
  }));
}

export default function App() {
  const [phase, setPhase] = useState('select');
  const [currentStep, setCurrentStep] = useState(0);
  const [drawnCardsKey, setDrawnCardsKey] = useState(0);
  const [candidates, setCandidates] = useState(() => pickRandomCards(22));
  const [selectedCards, setSelectedCards] = useState([]);
  const [selectedResults, setSelectedResults] = useState([]);

  const [confirmedCount, setConfirmedCount] = useState(0);
  const [isShuffling, setIsShuffling] = useState(false);
  const [usedCardIds, setUsedCardIds] = useState([]);

  // ── フリップ状態管理 ──────────────────────────────────────────────
  // 'idle' → 'selected' → 'flipping' → 'flipped' → 'idle'
  const [flipState, setFlipState] = useState('idle');
  const [flipDirection, setFlipDirection] = useState(null);
  const flipTimer = useRef(null);
  const busyRef = useRef(false); // 同期的なガード（連続フリック防止）

  // ── カード選択 ──────────────────────────────────────────────────
  const handleSelectCard = useCallback((cardIndex) => {
    if (busyRef.current) return;
    if (selectedCards.length >= 3) return;
    if (selectedCards.includes(cardIndex)) return;
    if (flipState !== 'idle') return;
    if (isShuffling) return;

    busyRef.current = true;
    setSelectedCards((prev) => [...prev, cardIndex]);
    setFlipState('selected');
  }, [selectedCards, flipState, isShuffling]);

  // ── カード選択解除（カード外タップ） ────────────────────────────────
  const handleDeselectCard = useCallback(() => {
    if (flipState !== 'selected') return;
    busyRef.current = false;
    setSelectedCards((prev) => prev.slice(0, -1));
    setFlipState('idle');
  }, [flipState]);

  // ── 捲り方向の選択 ────────────────────────────────────────────────
  const handleChooseDirection = useCallback((direction) => {
    if (flipState !== 'selected') return;
    if (flipTimer.current != null) return; // 同期ガード: 連続フリック防止
    setFlipDirection(direction);
    setFlipState('flipping');

    // 2秒後にフリップ完了
    flipTimer.current = setTimeout(() => {
      const idx = selectedCards[selectedCards.length - 1];
      if (idx == null) return;
      const card = candidates[idx];
      const isReversed = card.hiddenOrientation === 'flipped';
      const position = positionLabels[currentStep];

      setSelectedResults((prev) => [...prev, { card, isReversed, position }]);
      setFlipState('flipped');
    }, 2000);
  }, [selectedCards, candidates, currentStep]);

  // ── 次へ（確認） ─────────────────────────────────────────────────
  const handleConfirm = useCallback(() => {
    busyRef.current = false;
    flipTimer.current = null; // 次のフリップを許可
    setFlipState('idle');
    setFlipDirection(null);
    setConfirmedCount((prev) => prev + 1);
    setCurrentStep((prev) => prev + 1);

    if (selectedResults.length >= 3) {
      setTimeout(() => setPhase('result'), 500);
      return;
    }

    setIsShuffling(true);
    setTimeout(() => setIsShuffling(false), 1200);
  }, [selectedResults.length]);

  // ── リセット ────────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    busyRef.current = false;
    if (flipTimer.current) clearTimeout(flipTimer.current);
    flipTimer.current = null;

    const newUsedIds = [...usedCardIds, ...selectedResults.map((r) => r.card.id)];
    const finalUsedIds = (allCards.length - newUsedIds.length) < 3 ? [] : newUsedIds;

    setUsedCardIds(finalUsedIds);
    setCandidates(pickRandomCards(22, finalUsedIds));
    setSelectedCards([]);
    setSelectedResults([]);
    setCurrentStep(0);
    setConfirmedCount(0);
    setFlipState('idle');
    setFlipDirection(null);
    setIsShuffling(false);
    setPhase('select');
    setDrawnCardsKey((k) => k + 1);
  }, [usedCardIds, selectedResults]);

  // ── ステップラベル ───────────────────────────────────────────────
  const stepLabel =
    flipState === 'idle' && !isShuffling && currentStep < 3
      ? `← スワイプでカードを選び、タップで決定 →`
      : isShuffling
        ? 'シャッフル中...'
        : '';

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
      <TarotScene>
        <CardSpread3D
          key={drawnCardsKey}
          cards={candidates}
          selectedCards={selectedCards}
          confirmedCount={confirmedCount}
          flipState={flipState}
          flipDirection={flipDirection}
          onSelectCard={handleSelectCard}
          onSwipe={handleChooseDirection}
          onDeselect={handleDeselectCard}
          isShuffling={isShuffling}
        />
      </TarotScene>

      {/* ── ヘッダー overlay ── */}
      <div className="app-header-overlay">
        <h1 className="app-title">✦ Tarot Reading ✦</h1>
        <p className="app-subtitle">カードに触れて運命を選んでください</p>
      </div>

      {/* ── ステップインジケーター overlay ── */}
      {phase === 'select' && (
        <div className="step-overlay">
          <div className="step-progress" style={{ justifyContent: 'center' }}>
            {positionLabels.map((label, i) => (
              <span
                key={label}
                className={`step-dot ${i === currentStep ? 'active' : ''} ${
                  i < currentStep ? 'done' : ''
                }`}
              >
                {label}
              </span>
            ))}
          </div>
          {stepLabel && <p className="step-hint">{stepLabel}</p>}
        </div>
      )}

      {/* ── スワイプヒント overlay ── */}
      {flipState === 'selected' && (
        <div className="swipe-hint-overlay">
          <p className="swipe-hint-text">↕ 上下にスワイプでカードを捲る</p>
        </div>
      )}

      {/* ── 次へボタン overlay ── */}
      {flipState === 'flipped' && (
        <div className="confirm-overlay">
          <button className="next-button" onClick={handleConfirm}>
            {selectedResults.length >= 3 ? '結果を見る' : '次へ'}
          </button>
        </div>
      )}

      {/* ── 結果画面 overlay ── */}
      {phase === 'result' && (
        <ResultView results={selectedResults} onReset={handleReset} />
      )}
    </div>
  );
}
