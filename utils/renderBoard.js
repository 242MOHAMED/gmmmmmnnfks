const { createCanvas, loadImage } = require('canvas');
const path = require('path');

const letterPositions = {
  'ح': { x: 605, y: 120 },
  'و': { x: 488, y: 120 },
  'ي': { x: 368, y: 120 },
  'ك': { x: 244, y: 120 },
  'ع': { x: 120, y: 120 },

  'م': { x: 666, y: 220 },
  'ج': { x: 540, y: 220 },
  'ب': { x: 422, y: 220 },
  'ن': { x: 305, y: 220 },
  'ش': { x: 190, y: 220 },

  'خ':  { x: 602, y: 319 },
  'ق':  { x: 370, y: 319 },
  'غ':  { x: 480, y: 319 },
  'ل': { x: 250, y: 319 },
  'ت': { x: 128, y: 319 },

  'ر': { x: 670, y: 412 },
  'ف': { x: 550, y: 412 },
  'ض': { x: 425, y: 412 },
  'ز': { x: 310, y: 412 },
  'أ': { x: 168, y: 412 },

  'د': { x: 610, y: 510 },
  'ط': { x: 480, y: 510 },
  'ص': { x: 360, y: 510 },
  'هـ': { x: 245, y: 510 },
  'س': { x: 125, y: 510 }
};

async function renderBoard(board, owner) {
  const boardImage = await loadImage(path.join(__dirname, 'board.png'));
  const canvas = createCanvas(boardImage.width, boardImage.height);
  const ctx = canvas.getContext('2d');

  // Draw base image
  ctx.drawImage(boardImage, 0, 0);

  // Draw ownership overlay
  for (let y = 0; y < board.length; y++) {
    for (let x = 0; x < board[y].length; x++) {
      const letter = board[y][x];
      const team = owner[y][x];
      if (!team || !letterPositions[letter]) continue;

      const { x: cx, y: cy } = letterPositions[letter];

      // draw hexagon overlay
      const size = 45;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = Math.PI / 3 * i - Math.PI / 6;
        const px = cx + size * Math.cos(angle);
        const py = cy + size * Math.sin(angle);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = team === 'green' ? '#00cc00' : '#cc0000';
      ctx.fill();
      ctx.globalAlpha = 1.0;
    }
  }

  return canvas.toBuffer('image/png');
}

module.exports = { renderBoard };
