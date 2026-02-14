import { useState, useRef, useEffect, useCallback } from 'react'

const useGameState = () => {
  const [grid, setGrid] = useState(Array.from({ length: 4 }, () => Array(4).fill(0)))
  const [score, setScore] = useState(0)
  const [moves, setMoves] = useState(0) // Added moves counter
  const [lastDir, setLastDir] = useState(null)
  const [animating, setAnimating] = useState(false)
  const [newTilePos, setNewTilePos] = useState(null)
  const [isGameOver, setIsGameOver] = useState(false)
  const [mergedPositions, setMergedPositions] = useState(null)
  
  const prevGridRef = useRef(null)

  // Core Game Logic Helpers
  const addRandomTile = useCallback((g) => {
    const empties = []
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) if (g[r][c] === 0) empties.push([r, c])
    if (empties.length === 0) return { grid: g, pos: null }
    const [r, c] = empties[Math.floor(Math.random() * empties.length)]
    const v = Math.random() < 0.9 ? 2 : 4
    const ng = g.map(row => row.slice())
    ng[r][c] = v
    return { grid: ng, pos: { r, c } }
  }, [])

  const compress = (arr) => {
    const a = arr.filter(x => x !== 0)
    while (a.length < 4) a.push(0)
    return a
  }

  const mergeLine = (line) => {
    let s = 0
    const a = compress(line)
    const mergedIdx = []
    for (let i = 0; i < 3; i++) {
      if (a[i] !== 0 && a[i] === a[i + 1]) {
        a[i] = a[i] * 2
        s += a[i]
        a[i + 1] = 0
        mergedIdx.push(i)
      }
    }
    return { line: compress(a), gained: s, mergedIdx }
  }

  // Move Logic
  const moveGrid = useCallback((currentGrid, direction) => {
    let moved = false
    let gainedTotal = 0
    let ng = []
    const merged = []

    if (direction === 'left') {
      ng = currentGrid.map(row => {
        const { line, gained, mergedIdx } = mergeLine(row)
        if (!moved && line.some((v, i) => v !== row[i])) moved = true
        gainedTotal += gained
        if (mergedIdx && mergedIdx.length) {
          mergedIdx.forEach(i => merged.push({ r: ng.length, c: i }))
        }
        return line
      })
    } else if (direction === 'right') {
      ng = currentGrid.map(row => {
        const rev = row.slice().reverse()
        const { line, gained, mergedIdx } = mergeLine(rev)
        const res = line.slice().reverse()
        if (!moved && res.some((v, i) => v !== row[i])) moved = true
        gainedTotal += gained
        if (mergedIdx && mergedIdx.length) {
          mergedIdx.forEach(i => merged.push({ r: ng.length, c: 3 - i }))
        }
        return res
      })
    } else if (direction === 'up') {
      ng = Array.from({ length: 4 }, () => Array(4).fill(0))
      for (let c = 0; c < 4; c++) {
        const col = [currentGrid[0][c], currentGrid[1][c], currentGrid[2][c], currentGrid[3][c]]
        const { line, gained, mergedIdx } = mergeLine(col)
        for (let r = 0; r < 4; r++) ng[r][c] = line[r]
        if (!moved && line.some((v, i) => v !== col[i])) moved = true
        gainedTotal += gained
        if (mergedIdx && mergedIdx.length) {
          mergedIdx.forEach(i => merged.push({ r: i, c }))
        }
      }
    } else if (direction === 'down') {
      ng = Array.from({ length: 4 }, () => Array(4).fill(0))
      for (let c = 0; c < 4; c++) {
        const col = [currentGrid[3][c], currentGrid[2][c], currentGrid[1][c], currentGrid[0][c]]
        const { line, gained, mergedIdx } = mergeLine(col)
        const res = line.slice().reverse()
        for (let r = 0; r < 4; r++) ng[r][c] = res[r]
        if (!moved && res.some((v, i) => v !== [currentGrid[0][c], currentGrid[1][c], currentGrid[2][c], currentGrid[3][c]][i])) moved = true
        gainedTotal += gained
        if (mergedIdx && mergedIdx.length) {
          mergedIdx.forEach(i => merged.push({ r: 3 - i, c }))
        }
      }
    }

    return { grid: ng, moved, gained: gainedTotal, mergedPositions: merged }
  }, [])

  const checkGameOver = useCallback((g) => {
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) if (g[r][c] === 0) return false
    for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) if (g[r][c] === g[r][c+1]) return false
    for (let c = 0; c < 4; c++) for (let r = 0; r < 3; r++) if (g[r][c] === g[r+1][c]) return false
    return true
  }, [])

  // Initialization
  useEffect(() => {
    const { grid: g } = addRandomTile(addRandomTile(Array.from({ length: 4 }, () => Array(4).fill(0))).grid)
    setGrid(g)
    prevGridRef.current = g
  }, [addRandomTile])

  // Public Actions
  const resetGame = useCallback(() => {
    setGrid(Array.from({ length: 4 }, () => Array(4).fill(0)))
    setScore(0)
    setMoves(0)
    const { grid: g } = addRandomTile(addRandomTile(Array.from({ length: 4 }, () => Array(4).fill(0))).grid)
    setGrid(g)
    setNewTilePos(null)
    setLastDir(null)
    setIsGameOver(false)
    setMergedPositions(null)
    prevGridRef.current = g
  }, [addRandomTile])

  const performMove = useCallback((dir) => {
    if (isGameOver) return { moved: false, gained: 0 }

    const res = moveGrid(grid, dir)
    if (!res || !res.moved) return { moved: false, gained: 0 }

    prevGridRef.current = grid
    const { grid: withTile, pos } = addRandomTile(res.grid)
    
    setGrid(withTile)
    setNewTilePos(pos)
    setLastDir(dir)
    setAnimating(true)
    setMoves(m => m + 1)
    setMergedPositions(res.mergedPositions && res.mergedPositions.length ? res.mergedPositions : null)
    
    if (res.gained) setScore(v => v + res.gained)
    
    if (checkGameOver(withTile)) {
      setIsGameOver(true)
    }

    return { moved: true, gained: res.gained, newGrid: withTile }
  }, [grid, isGameOver, moveGrid, addRandomTile, checkGameOver])

  useEffect(() => {
    if (!animating) {
      setMergedPositions(null)
    }
  }, [animating])

  // Expose a snapshot getter for AI
  const getGameState = useCallback(() => {
    return {
      grid,
      score,
      moves,
      isGameOver,
      lastDir,
      maxTile: Math.max(...grid.flat())
    }
  }, [grid, score, moves, isGameOver, lastDir])

  return {
    // State
    grid,
    score,
    moves,
    lastDir,
    animating,
    newTilePos,
    isGameOver,
    prevGrid: prevGridRef.current,
    mergedPositions,
    
    // Actions
    setAnimating,
    resetGame,
    performMove,
    getGameState
  }
}

export default useGameState
