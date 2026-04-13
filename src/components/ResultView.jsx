export default function ResultView({ results, onReset }) {
  return (
    <div className="result-overlay">
      <div className="result-view fade-in">
        <h2 className="results-title">✦ リーディング結果 ✦</h2>
        <div className="results-cards-row">
          {results.map((r) => (
            <div key={r.card.id} className="result-visual-card">
              <span className="result-visual-position">{r.position}</span>
              <div className="result-visual-image-wrap">
                <img
                  src={r.card.image}
                  alt={r.card.name}
                  className={`result-visual-image ${r.isReversed ? 'reversed' : ''}`}
                />
              </div>
              <span className="result-visual-name">{r.card.name}</span>
              <span
                className={`result-visual-orientation ${r.isReversed ? 'rev' : 'up'}`}
              >
                {r.isReversed ? '逆位置' : '正位置'}
              </span>
              <p className="result-visual-meaning">
                {r.isReversed ? r.card.reversed : r.card.upright}
              </p>
            </div>
          ))}
        </div>
        <button className="reset-button" onClick={onReset}>
          もう一度引く
        </button>
      </div>
    </div>
  );
}
