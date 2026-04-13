/**
 * cardFront.js — カード表面テクスチャ生成
 * 引数: card = { id, name, symbol }, isReversed (boolean, 未使用: 3D回転で表現)
 */

const romanNumerals = [
  '0', 'I', 'II', 'III', 'IV', 'V',
  'VI', 'VII', 'VIII', 'IX', 'X',
  'XI', 'XII', 'XIII', 'XIV', 'XV',
  'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI',
];

const GOLD = '#c9a84c';
const GOLD_LIGHT = '#e8c96a';
const GOLD_DIM = 'rgba(201,168,76,0.5)';

export function createCardFrontTexture(card, isReversed = false) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 768;
  const ctx = canvas.getContext('2d');

  const W = canvas.width;
  const H = canvas.height;
  const cx = W / 2;

  const id = card.id ?? 0;
  const name = card.name ?? '';
  const symbol = card.symbol ?? '✦';
  const roman = romanNumerals[id] ?? String(id);

  // ── 背景グラデーション（偶数: 深紫→深青 / 奇数: 深紫→深赤） ───
  const bgGrad = ctx.createLinearGradient(0, 0, W, H);
  bgGrad.addColorStop(0, '#1a0a2e');
  if (id % 2 === 0) {
    bgGrad.addColorStop(1, '#0a1a3e'); // 深青
  } else {
    bgGrad.addColorStop(1, '#2e0a1a'); // 深赤
  }
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // ── 微細な光彩（放射状グラデーション） ───────────────────────────
  const radGrad = ctx.createRadialGradient(cx, H * 0.5, 0, cx, H * 0.5, W * 0.7);
  radGrad.addColorStop(0, 'rgba(201,168,76,0.08)');
  radGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = radGrad;
  ctx.fillRect(0, 0, W, H);

  // ── 外周ボーダー（4px） ───────────────────────────────────────────
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, W - 4, H - 4);

  // ── 内側装飾枠 ────────────────────────────────────────────────────
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(12, 12, W - 24, H - 24);

  ctx.strokeStyle = GOLD_DIM;
  ctx.lineWidth = 1;
  ctx.strokeRect(18, 18, W - 36, H - 36);

  // ── 角のL字型装飾 ─────────────────────────────────────────────────
  function drawCornerL(x, y, dx, dy, size = 20) {
    ctx.save();
    ctx.strokeStyle = GOLD_LIGHT;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + dx * size, y);
    ctx.lineTo(x, y);
    ctx.lineTo(x, y + dy * size);
    ctx.stroke();
    ctx.restore();
  }

  const margin = 24;
  drawCornerL(margin, margin, 1, 1);           // 左上
  drawCornerL(W - margin, margin, -1, 1);      // 右上
  drawCornerL(margin, H - margin, 1, -1);      // 左下
  drawCornerL(W - margin, H - margin, -1, -1); // 右下

  // ── ローマ数字（上部）────────────────────────────────────────────
  const romanY = 72;
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 32px serif';
  ctx.fillStyle = GOLD;
  ctx.shadowColor = GOLD;
  ctx.shadowBlur = 8;
  ctx.fillText(roman, cx, romanY);
  ctx.restore();

  // ローマ数字の上下にショートライン
  const lineHalf = 40;
  ctx.strokeStyle = GOLD_DIM;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - lineHalf, romanY - 20);
  ctx.lineTo(cx + lineHalf, romanY - 20);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - lineHalf, romanY + 20);
  ctx.lineTo(cx + lineHalf, romanY + 20);
  ctx.stroke();

  // ── シンボル絵文字（中央） ────────────────────────────────────────
  const symbolY = H * 0.47;
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '120px sans-serif';
  ctx.shadowColor = 'rgba(201,168,76,0.6)';
  ctx.shadowBlur = 24;
  ctx.fillText(symbol, cx, symbolY);
  ctx.restore();

  // シンボル周囲の円装飾
  ctx.save();
  ctx.strokeStyle = GOLD_DIM;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, symbolY, 90, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(201,168,76,0.2)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, symbolY, 100, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // ── カード名（下部） ──────────────────────────────────────────────
  const nameY = H - 80;

  // 名前の上にデコレーティブライン
  ctx.strokeStyle = GOLD_DIM;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - 80, nameY - 26);
  ctx.lineTo(cx + 80, nameY - 26);
  ctx.stroke();

  // カード名テキスト
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 36px serif';
  ctx.fillStyle = GOLD;
  ctx.shadowColor = GOLD;
  ctx.shadowBlur = 10;
  ctx.fillText(name, cx, nameY);
  ctx.restore();

  // 名前の下にデコレーティブライン
  ctx.strokeStyle = GOLD_DIM;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - 80, nameY + 26);
  ctx.lineTo(cx + 80, nameY + 26);
  ctx.stroke();

  // ── 四隅の小さな菱形装飾 ────────────────────────────────────────
  function drawDiamond(x, y, r) {
    ctx.save();
    ctx.fillStyle = GOLD;
    ctx.beginPath();
    ctx.moveTo(x, y - r);
    ctx.lineTo(x + r, y);
    ctx.lineTo(x, y + r);
    ctx.lineTo(x - r, y);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  const dOffset = 38;
  const dR = 5;
  drawDiamond(dOffset, dOffset, dR);
  drawDiamond(W - dOffset, dOffset, dR);
  drawDiamond(dOffset, H - dOffset, dR);
  drawDiamond(W - dOffset, H - dOffset, dR);

  // ── 上部・下部のセパレーターライン ──────────────────────────────
  const topSep = 100;
  const botSep = H - 116;
  ctx.strokeStyle = GOLD_DIM;
  ctx.lineWidth = 1;

  ctx.beginPath();
  ctx.moveTo(30, topSep);
  ctx.lineTo(W - 30, topSep);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(30, botSep);
  ctx.lineTo(W - 30, botSep);
  ctx.stroke();

  // ── IDに応じたアクセントカラーの小さな星 ────────────────────────
  const accentColor = id % 2 === 0
    ? 'rgba(100,150,255,0.5)'   // 青系アクセント
    : 'rgba(255,100,100,0.5)';  // 赤系アクセント

  for (let i = 0; i < 20; i++) {
    const px = 30 + Math.random() * (W - 60);
    const py = 110 + Math.random() * (H - 240);
    const alpha = Math.random() * 0.25 + 0.05;
    ctx.beginPath();
    ctx.arc(px, py, 1.2, 0, Math.PI * 2);
    ctx.fillStyle = accentColor.replace('0.5', String(alpha));
    ctx.fill();
  }

  // ── 金色の光の粒 ─────────────────────────────────────────────────
  for (let i = 0; i < 30; i++) {
    const px = Math.random() * W;
    const py = Math.random() * H;
    const alpha = Math.random() * 0.3 + 0.05;
    ctx.beginPath();
    ctx.arc(px, py, 0.8, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(201,168,76,${alpha})`;
    ctx.fill();
  }

  return canvas;
}
