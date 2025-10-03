function checkWinner(ownerColors) {
  const n = ownerColors.length;
  const m = ownerColors[0].length;

  function getNeighbors(x, y) {
    const neighbors = [];
    const evenRow = y % 2 === 0;

    if (evenRow) {
      if (x > 0 && y > 0) neighbors.push([x - 1, y - 1]);
      if (y > 0) neighbors.push([x, y - 1]);
      if (x > 0) neighbors.push([x - 1, y]);
      if (x < m - 1) neighbors.push([x + 1, y]);
      if (y < n - 1) neighbors.push([x, y + 1]);
      if (x > 0 && y < n - 1) neighbors.push([x - 1, y + 1]);
    } else {
      if (y > 0) neighbors.push([x, y - 1]);
      if (x < m - 1 && y > 0) neighbors.push([x + 1, y - 1]);
      if (x > 0) neighbors.push([x - 1, y]);
      if (x < m - 1) neighbors.push([x + 1, y]);
      if (y < n - 1) neighbors.push([x, y + 1]);
      if (x < m - 1 && y < n - 1) neighbors.push([x + 1, y + 1]);
    }

    return neighbors;
  }

  function dfs(x, y, color, visited) {
    if (x < 0 || y < 0 || x >= m || y >= n) return false;
    if (ownerColors[y][x] !== color || visited[y][x]) return false;
    visited[y][x] = true;

    if (color === 'green' && y === n - 1) return true;
    if (color === 'red' && x === m - 1) return true;

    const neighbors = getNeighbors(x, y);
    for (const [nx, ny] of neighbors) {
      if (dfs(nx, ny, color, visited)) {
        return true;
      }
    }
    return false;
  }

  let visited = Array.from({ length: n }, () => Array(m).fill(false));
  for (let x = 0; x < m; x++) {
    if (ownerColors[0][x] === 'green') {
      if (dfs(x, 0, 'green', visited)) {
        return 'green';
      }
    }
  }

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
