import React, { useState, useCallback } from 'react';
import Card from './Card';
import allCards from '../data/cards';

function pickRandomCards(count) {
  const shuffled = [...allCards].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map((card) => ({
    ...card,
    hiddenOrientation: Math.random() < 0.5 ? 'normal' : 'flipped',
  }));
}

function determineReversed(hiddenOrientation, squeezeDirection) {
  // hiddenOrientation: "normal" | "flipped"
  // squeezeDirection: "top" | "bottom"
  if (hiddenOrientation === 'normal') {
    return squeezeDirection === 'bottom'; // top→正位置, bottom→逆位置
  } else {
    return squeezeDirection === 'top'; // top→逆位置, bottom→正位置
  }
}

const positionLabels = ['過去', '現在', '未来'];

export default function CardSpread() {
  const [drawnCards, setDrawnCards] = useState(() => pickRandomCards(3));
  const [flippedState, setFlippedState] = useState([false, false, false]);
  const [reversedState, setReversedState] = useState([false, false, false]);
  const [currentStep, setCurrentStep] = useState(0); // 0,1,2 = card steps, 3 = result
  const [fadeState, setFadeState] = useState('in'); // 'in' | 'out'

  const isCurrentFlipped = currentStep < 3 && flippedState[currentStep];

  const handleFlip = useCallback((index, squeezeDirection) => {
    const card = drawnCards[index];
    const isReversed = determineReversed(card.hiddenOrientation, squeezeDirection);

    setFlippedState((prev) => {
      if (prev[index]) return prev;
      const next = [...prev];
      next[index] = true;
      return next;
    });
    setReversedState((prev) => {
      const next = [...prev];
      next[index] = isReversed;
      return next;
    });
  }, [drawnCards]);

  const handleNext = useCallback(() => {
    setFadeState('out');
    setTimeout(() => {
      setCurrentStep((prev) => prev + 1);
      setFadeState('in');
    }, 300);
  }, []);

  const handleReset = useCallback(() => {
    setFadeState('out');
    setTimeout(() => {
      setFlippedState([false, false, false]);
      setReversedState([false, false, false]);
      setDrawnCards(pickRandomCards(3));
      setCurrentStep(0);
      setFadeState('in');
    }, 300);
  }, []);

  // Step 0-2: Single card view
  if (currentStep < 3) {
    const card = drawnCards[currentStep];
    return (
      <div className="card-spread">
        <div className="step-progress">
          {positionLabels.map((label, i) => (
            <span
              key={label}
              className={`step-dot ${i === currentStep ? 'active' : ''} ${i < currentStep ? 'done' : ''}`}
            >
              {label}
            </span>
          ))}
        </div>

        <div className={`single-card-area fade-${fadeState}`}>
          <div className="single-card-label">{positionLabels[currentStep]}</div>
          <Card
            key={`${card.id}-${currentStep}`}
            card={card}
            index={currentStep}
            onFlip={handleFlip}
            isFlipped={flippedState[currentStep]}
            isReversed={reversedState[currentStep]}
            large
          />

          {isCurrentFlipped && (
            <div className="after-flip-info">
              <p className="flipped-card-name">
                <span className="flipped-symbol">{card.symbol}</span>
                {card.name}
              </p>
              <span className={`flipped-orientation ${reversedState[currentStep] ? 'reversed' : 'upright'}`}>
                {reversedState[currentStep] ? '逆位置' : '正位置'}
              </span>
              <button className="next-button" onClick={handleNext}>
                {currentStep < 2 ? '次のカードへ' : 'リーディング結果を見る'}
              </button>
            </div>
          )}
        </div>

        <p className="step-counter">{currentStep + 1} / 3</p>
      </div>
    );
  }

  // Step 3: Result view
  return (
    <div className="card-spread">
      <div className={`result-view fade-${fadeState}`}>
        <h2 className="results-title">リーディング結果</h2>

        <div className="result-cards-row">
          {drawnCards.map((card, i) => (
            <div key={card.id} className="result-mini-card">
              <div className="result-mini-label">{positionLabels[i]}</div>
              <Card
                card={card}
                index={i}
                onFlip={() => {}}
                isFlipped={true}
                isReversed={reversedState[i]}
              />
            </div>
          ))}
        </div>

        <div className="results-list">
          {drawnCards.map((card, i) => (
            <div key={card.id} className="result-card">
              <div className="result-header">
                <span className="result-position">{positionLabels[i]}</span>
                <span className="result-symbol">{card.symbol}</span>
                <span className="result-name">{card.name}</span>
                <span className={`result-orientation ${reversedState[i] ? 'reversed' : 'upright'}`}>
                  {reversedState[i] ? '逆位置' : '正位置'}
                </span>
              </div>
              <p className="result-meaning">
                {reversedState[i] ? card.reversed : card.upright}
              </p>
            </div>
          ))}
        </div>

        <button className="reset-button" onClick={handleReset}>
          もう一度引く
        </button>
      </div>
    </div>
  );
}
