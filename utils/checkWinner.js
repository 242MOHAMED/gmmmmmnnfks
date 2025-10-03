function checkWinner(ownerColors) {
  const n = ownerColors.length;
  const m = ownerColors[0].length;

  function dfs(x, y, color, visited) {
    if (x < 0 || y < 0 || x >= m || y >= n) return false;
    if (ownerColors[y][x] !== color || visited[y][x]) return false;
    visited[y][x] = true;

    // شرط الفوز
    if (color === 'green' && y === n - 1) return true; // الأخضر يوصل تحت
    if (color === 'red' && x === m - 1) return true;   // الأحمر يوصل يمين

    const evenRowDirections = [
      [0, -1], [1, -1], [1, 0],
      [0, 1], [-1, 0], [-1, -1]
    ];
    const oddRowDirections = [
      [0, -1], [1, 0], [1, 1],
      [0, 1], [-1, 1], [-1, 0]
    ];

    const directions = (y % 2 === 0) ? evenRowDirections : oddRowDirections;

    for (const [dx, dy] of directions) {
      if (dfs(x + dx, y + dy, color, visited)) {
        return true;
      }
    }
    return false;
  }

  // فحص الأخضر: نبدأ فقط من الخلايا الخضراء اللي بالصف الأول (فوق)
  let visited = Array.from({ length: n }, () => Array(m).fill(false));
  for (let x = 0; x < m; x++) {
    if (ownerColors[0][x] === 'green') {
      if (dfs(x, 0, 'green', visited)) {
        return 'green';
      }
    }
  }

  // فحص الأحمر: نبدأ فقط من الخلايا الحمراء اللي بالعمود الأول (يسار)
  visited = Array.from({ length: n }, () => Array(m).fill(false));
  for (let y = 0; y < n; y++) {
    if (ownerColors[y][0] === 'red') {
      if (dfs(0, y, 'red', visited)) {
        return 'red';
      }
    }
  }

  return null;
}

module.exports = { checkWinner };
