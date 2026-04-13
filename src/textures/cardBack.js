/**
 * cardBack.js — カード裏面テクスチャ生成
 * Canvas API でランタイム生成。Three.js の CanvasTexture として利用する。
 */

export function createCardBackTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 768;
  const ctx = canvas.getContext('2d');

  const W = canvas.width;
  const H = canvas.height;
  const cx = W / 2;
  const cy = H / 2;

  // ── 背景グラデーション（深紫ベース） ──────────────────────────────
  const bgGrad = ctx.createLinearGradient(0, 0, W, H);
  bgGrad.addColorStop(0, '#1a0a2e');
  bgGrad.addColorStop(1, '#2d1b69');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // ── ヘルパー: 金色スタイル ────────────────────────────────────────
  const GOLD = '#c9a84c';
  const GOLD_LIGHT = '#e8c96a';

  function setGoldStroke(lineWidth = 2) {
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = lineWidth;
  }

  // ── 外周ボーダー（4px） ───────────────────────────────────────────
  setGoldStroke(4);
  ctx.strokeRect(2, 2, W - 4, H - 4);

  // ── 内周ボーダー（二重枠） ────────────────────────────────────────
  setGoldStroke(1.5);
  ctx.strokeRect(12, 12, W - 24, H - 24);
  setGoldStroke(1);
  ctx.strokeRect(16, 16, W - 32, H - 32);

  // ── 8角星（二つの正方形を 0° / 45° 重ねる） ─────────────────────
  function drawOctagram(x, y, size) {
    ctx.save();
    ctx.translate(x, y);

    ctx.beginPath();
    // 正方形 1（0°）
    const half = size / 2;
    ctx.moveTo(-half, -half);
    ctx.lineTo(half, -half);
    ctx.lineTo(half, half);
    ctx.lineTo(-half, half);
    ctx.closePath();

    // 正方形 2（45° 回転）
    ctx.rotate(Math.PI / 4);
    ctx.moveTo(-half, -half);
    ctx.lineTo(half, -half);
    ctx.lineTo(half, half);
    ctx.lineTo(-half, half);
    ctx.closePath();

    ctx.restore();
  }

  // 8角星を2つの正方形として段階的に描画する別アプローチ
  function drawOctagramPrecise(x, y, outerR, innerR) {
    const points = 8;
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const angle = (Math.PI / points) * i - Math.PI / 2;
      const r = i % 2 === 0 ? outerR : innerR;
      const px = x + Math.cos(angle) * r;
      const py = y + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
  }

  // 中央の大きな8角星（塗りつぶしあり）
  const starSize = 140;
  const innerStarR = starSize * 0.42;

  // グロー効果
  ctx.save();
  ctx.shadowColor = GOLD;
  ctx.shadowBlur = 20;

  // 塗りつぶし（半透明ゴールド）
  drawOctagramPrecise(cx, cy, starSize, innerStarR);
  ctx.fillStyle = 'rgba(201,168,76,0.12)';
  ctx.fill();

  // 外枠線
  setGoldStroke(2);
  drawOctagramPrecise(cx, cy, starSize, innerStarR);
  ctx.stroke();

  // 内側に少し小さい8角星（ライン）
  drawOctagramPrecise(cx, cy, starSize * 0.82, innerStarR * 0.82);
  setGoldStroke(1);
  ctx.stroke();

  ctx.restore();

  // 8角星の中心: 二つの正方形を重ねる（クラシックなオクタグラム）
  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = GOLD_LIGHT;
  ctx.lineWidth = 2;

  const sq = 60;
  ctx.beginPath();
  ctx.rect(-sq / 2, -sq / 2, sq, sq);
  ctx.stroke();

  ctx.rotate(Math.PI / 4);
  ctx.beginPath();
  ctx.rect(-sq / 2, -sq / 2, sq, sq);
  ctx.stroke();

  ctx.restore();

  // 中心の円と点
  ctx.save();
  ctx.shadowColor = GOLD;
  ctx.shadowBlur = 10;

  ctx.beginPath();
  ctx.arc(cx, cy, 22, 0, Math.PI * 2);
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = 'rgba(201,168,76,0.2)';
  ctx.fill();

  ctx.beginPath();
  ctx.arc(cx, cy, 6, 0, Math.PI * 2);
  ctx.fillStyle = GOLD;
  ctx.fill();

  ctx.restore();

  // ── 四隅の ★ マーク ───────────────────────────────────────────────
  function drawStar5(x, y, r) {
    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const angle = (Math.PI / 5) * i - Math.PI / 2;
      const radius = i % 2 === 0 ? r : r * 0.4;
      const px = Math.cos(angle) * radius;
      const py = Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = GOLD;
    ctx.fill();
    ctx.restore();
  }

  const cornerOffset = 36;
  const starRadius = 12;
  drawStar5(cornerOffset, cornerOffset, starRadius);
  drawStar5(W - cornerOffset, cornerOffset, starRadius);
  drawStar5(cornerOffset, H - cornerOffset, starRadius);
  drawStar5(W - cornerOffset, H - cornerOffset, starRadius);

  // ── 上部・下部の三日月シンボル ────────────────────────────────────
  function drawCrescent(x, y, r, flip) {
    ctx.save();
    ctx.translate(x, y);
    if (flip) ctx.scale(1, -1);

    // 外側の円
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = GOLD;
    ctx.fill();

    // 内側の円でくり抜く（背景色で上書き）
    ctx.beginPath();
    ctx.arc(r * 0.45, -r * 0.1, r * 0.78, 0, Math.PI * 2);
    ctx.fillStyle = '#1a0a2e';
    ctx.fill();

    ctx.restore();
  }

  // 上部（正向き三日月）
  drawCrescent(cx, 60, 18, false);

  // 下部（反転三日月）
  drawCrescent(cx, H - 60, 18, true);

  // ── 補助的な装飾ライン（水平・垂直） ─────────────────────────────
  ctx.strokeStyle = 'rgba(201,168,76,0.3)';
  ctx.lineWidth = 1;

  // 水平ライン（上下）
  ctx.beginPath();
  ctx.moveTo(30, 90);
  ctx.lineTo(W - 30, 90);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(30, H - 90);
  ctx.lineTo(W - 30, H - 90);
  ctx.stroke();

  // 垂直ライン（左右）
  ctx.beginPath();
  ctx.moveTo(90, 30);
  ctx.lineTo(90, H - 30);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(W - 90, 30);
  ctx.lineTo(W - 90, H - 30);
  ctx.stroke();

  // ── 全体にわずかなノイズ感（光の粒） ────────────────────────────
  for (let i = 0; i < 60; i++) {
    const px = Math.random() * W;
    const py = Math.random() * H;
    const alpha = Math.random() * 0.4 + 0.1;
    ctx.beginPath();
    ctx.arc(px, py, 1, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(201,168,76,${alpha})`;
    ctx.fill();
  }

  return canvas;
}
