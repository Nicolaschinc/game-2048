// AI Engine for 2048
// Using Expectimax algorithm

const DIRECTIONS = [0, 1, 2, 3]; // 0: up, 1: right, 2: down, 3: left
const DIR_NAMES = ['up', 'right', 'down', 'left'];

// Helper to clone grid
const clone = (grid) => grid.map(row => [...row]);

// Check if grid is full
const getAvailableCells = (grid) => {
  const cells = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (grid[r][c] === 0) cells.push({ r, c });
    }
  }
  return cells;
};

// --- Game Logic (Re-implemented for AI performance) ---

const rotateLeft = (grid) => {
  const rows = 4;
  const cols = 4;
  const newGrid = Array.from({ length: 4 }, () => Array(4).fill(0));
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      newGrid[r][c] = grid[c][rows - 1 - r];
    }
  }
  return newGrid;
};

const moveLeft = (grid) => {
  let moved = false;
  let score = 0;
  const newGrid = [];
  
  for (let r = 0; r < 4; r++) {
    let row = grid[r].filter(v => v !== 0);
    let newRow = [];
    let skip = false;
    let localScore = 0;

    for (let i = 0; i < row.length; i++) {
      if (skip) {
        skip = false;
        continue;
      }
      if (i + 1 < row.length && row[i] === row[i + 1]) {
        const merged = row[i] * 2;
        newRow.push(merged);
        localScore += merged;
        skip = true;
      } else {
        newRow.push(row[i]);
      }
    }
    
    while (newRow.length < 4) newRow.push(0);
    newGrid.push(newRow);
    
    if (newRow.some((v, i) => v !== grid[r][i])) moved = true;
    score += localScore;
  }
  
  return { grid: newGrid, moved, score };
};

const move = (grid, direction) => {
  // 0: up, 1: right, 2: down, 3: left
  // To reuse moveLeft:
  // Up: rotate 3 times (270 deg) -> moveLeft -> rotate 1 time
  // Right: rotate 2 times (180 deg) -> moveLeft -> rotate 2 times
  // Down: rotate 1 time (90 deg) -> moveLeft -> rotate 3 times
  // Left: moveLeft
  
  let tempGrid = clone(grid);
  let rotations = 0;
  
  if (direction === 0) rotations = 3; // Up
  else if (direction === 1) rotations = 2; // Right
  else if (direction === 2) rotations = 1; // Down
  
  for (let i = 0; i < rotations; i++) tempGrid = rotateLeft(tempGrid);
  
  const result = moveLeft(tempGrid);
  
  let finalGrid = result.grid;
  // Rotate back
  const backRotations = (4 - rotations) % 4;
  for (let i = 0; i < backRotations; i++) finalGrid = rotateLeft(finalGrid);
  
  return { ...result, grid: finalGrid };
};

// --- Evaluation Heuristics ---

// 1. Monotonicity: scores higher if values are increasing/decreasing along rows/cols
const calculateMonotonicity = (grid) => {
  let totals = [0, 0, 0, 0]; // left/right, up/down

  // Left/Right
  for (let r = 0; r < 4; r++) {
    let current = 0;
    let next = current + 1;
    while (next < 4) {
      while (next < 4 && grid[r][next] === 0) next++;
      if (next >= 4) next--;
      
      const currentVal = grid[r][current] !== 0 ? Math.log2(grid[r][current]) : 0;
      const nextVal = grid[r][next] !== 0 ? Math.log2(grid[r][next]) : 0;
      
      if (currentVal > nextVal) totals[0] += nextVal - currentVal;
      else if (nextVal > currentVal) totals[1] += currentVal - nextVal;
      
      current = next;
      next++;
    }
  }

  // Up/Down
  for (let c = 0; c < 4; c++) {
    let current = 0;
    let next = current + 1;
    while (next < 4) {
      while (next < 4 && grid[next][c] === 0) next++;
      if (next >= 4) next--;
      
      const currentVal = grid[current][c] !== 0 ? Math.log2(grid[current][c]) : 0;
      const nextVal = grid[next][c] !== 0 ? Math.log2(grid[next][c]) : 0;
      
      if (currentVal > nextVal) totals[2] += nextVal - currentVal;
      else if (nextVal > currentVal) totals[3] += currentVal - nextVal;
      
      current = next;
      next++;
    }
  }

  return Math.max(totals[0], totals[1]) + Math.max(totals[2], totals[3]);
};

// 2. Smoothness: penalize adjacent cells with different values
const calculateSmoothness = (grid) => {
  let smoothness = 0;
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (grid[r][c] !== 0) {
        const val = Math.log2(grid[r][c]);
        // Check right
        for (let nextC = c + 1; nextC < 4; nextC++) {
          if (grid[r][nextC] !== 0) {
            smoothness -= Math.abs(val - Math.log2(grid[r][nextC]));
            break;
          }
        }
        // Check down
        for (let nextR = r + 1; nextR < 4; nextR++) {
          if (grid[nextR][c] !== 0) {
            smoothness -= Math.abs(val - Math.log2(grid[nextR][c]));
            break;
          }
        }
      }
    }
  }
  return smoothness;
};

// 3. Free tiles
const calculateEmptyCells = (grid) => {
  let count = 0;
  for(let r=0; r<4; r++)
    for(let c=0; c<4; c++)
      if(grid[r][c] === 0) count++;
  return count !== 0 ? Math.log(count) : 0; // Log to diminish returns
};

// 4. Max tile on corner (bonus)
const maxTileCorner = (grid) => {
  let max = 0;
  let maxR = -1, maxC = -1;
  for(let r=0; r<4; r++)
    for(let c=0; c<4; c++)
      if(grid[r][c] > max) {
        max = grid[r][c];
        maxR = r;
        maxC = c;
      }
  
  if (max === 0) return 0;
  if ((maxR === 0 || maxR === 3) && (maxC === 0 || maxC === 3)) return Math.log2(max);
  return 0;
};

const evaluateGrid = (grid) => {
  const smoothnessWeight = 0.1;
  const monotonicityWeight = 1.0;
  const emptyWeight = 2.7;
  const maxWeight = 1.0;

  return (
    calculateSmoothness(grid) * smoothnessWeight +
    calculateMonotonicity(grid) * monotonicityWeight +
    calculateEmptyCells(grid) * emptyWeight +
    maxTileCorner(grid) * maxWeight
  );
};

// --- Expectimax Search ---

// Depth controls difficulty and performance
// 2 is fast, 4 is strong but slow
const SEARCH_DEPTH = 3; 

const expectimax = (grid, depth, isPlayer) => {
  if (depth === 0) return { score: evaluateGrid(grid) };

  if (isPlayer) {
    let bestScore = -Infinity;
    let bestMove = -1;

    for (let dir = 0; dir < 4; dir++) {
      const { grid: nextGrid, moved } = move(grid, dir);
      if (moved) {
        const result = expectimax(nextGrid, depth - 1, false);
        if (result.score > bestScore) {
          bestScore = result.score;
          bestMove = dir;
        }
      }
    }
    
    // If no moves possible
    if (bestMove === -1) return { score: -Infinity, move: -1 };
    
    return { score: bestScore, move: bestMove };
  } else {
    // Chance node (random tile insertion)
    // To save time, we only consider empty cells. 
    // Simplified: weighted average of possible spawns (2: 90%, 4: 10%)
    // To optimize: only check a few random empty spots if there are too many?
    const emptyCells = getAvailableCells(grid);
    if (emptyCells.length === 0) return { score: evaluateGrid(grid) };

    // Optimization: limit the number of chance nodes to evaluate if too many empty cells
    // Otherwise branching factor explodes: 16 empty cells * 2 values = 32 branches
    const candidates = emptyCells.length > 4 ? 
      emptyCells.sort(() => 0.5 - Math.random()).slice(0, 4) : 
      emptyCells;

    let avgScore = 0;
    const totalWeight = candidates.length;

    for (const {r, c} of candidates) {
      // Try 2 (0.9 prob)
      grid[r][c] = 2;
      avgScore += 0.9 * expectimax(grid, depth - 1, true).score;
      // Try 4 (0.1 prob)
      grid[r][c] = 4;
      avgScore += 0.1 * expectimax(grid, depth - 1, true).score;
      // Reset
      grid[r][c] = 0;
    }
    
    return { score: avgScore / totalWeight };
  }
};

export const getBestMove = (grid) => {
  const start = performance.now();
  const { move: bestMove, score } = expectimax(grid, SEARCH_DEPTH, true);
  const end = performance.now();
  console.log(`AI thought for ${(end-start).toFixed(2)}ms, chosen: ${DIR_NAMES[bestMove]}, score: ${score}`);
  
  return DIR_NAMES[bestMove]; // Returns 'up', 'down', 'left', 'right' or undefined
};

// Export helpers for game logic reuse if needed
export const gameLogic = {
  move,
  evaluateGrid
};
