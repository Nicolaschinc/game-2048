import { useEffect, useRef, useState } from 'react'
import './App.scss'

function App() {
  const [grid, setGrid] = useState(Array.from({ length: 4 }, () => Array(4).fill(0)))
  const [score, setScore] = useState(0)
  const [lastDir, setLastDir] = useState(null)
  const [animating, setAnimating] = useState(false)
  const [newTilePos, setNewTilePos] = useState(null)
  const [touchStart, setTouchStart] = useState(null)
  const prevGridRef = useRef(null)
  const boardRef = useRef(null)

  const addRandomTile = g => {
    const empties = []
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) if (g[r][c] === 0) empties.push([r, c])
    if (empties.length === 0) return { grid: g, pos: null }
    const [r, c] = empties[Math.floor(Math.random() * empties.length)]
    const v = Math.random() < 0.9 ? 2 : 4
    const ng = g.map(row => row.slice())
    ng[r][c] = v
    return { grid: ng, pos: { r, c } }
  }

  const compress = arr => {
    const a = arr.filter(x => x !== 0)
    while (a.length < 4) a.push(0)
    return a
  }

  const mergeLine = line => {
    let s = 0
    const a = compress(line)
    for (let i = 0; i < 3; i++) {
      if (a[i] !== 0 && a[i] === a[i + 1]) {
        a[i] = a[i] * 2
        s += a[i]
        a[i + 1] = 0
      }
    }
    return { line: compress(a), gained: s }
  }

  const moveLeft = g => {
    let moved = false
    let gainedTotal = 0
    const ng = g.map(row => {
      const { line, gained } = mergeLine(row)
      if (!moved && line.some((v, i) => v !== row[i])) moved = true
      gainedTotal += gained
      return line
    })
    return { grid: ng, moved, gained: gainedTotal }
  }

  const moveRight = g => {
    let moved = false
    let gainedTotal = 0
    const ng = g.map(row => {
      const rev = row.slice().reverse()
      const { line, gained } = mergeLine(rev)
      const res = line.slice().reverse()
      if (!moved && res.some((v, i) => v !== row[i])) moved = true
      gainedTotal += gained
      return res
    })
    return { grid: ng, moved, gained: gainedTotal }
  }

  const moveUp = g => {
    let moved = false
    let gainedTotal = 0
    const ng = Array.from({ length: 4 }, () => Array(4).fill(0))
    for (let c = 0; c < 4; c++) {
      const col = [g[0][c], g[1][c], g[2][c], g[3][c]]
      const { line, gained } = mergeLine(col)
      for (let r = 0; r < 4; r++) ng[r][c] = line[r]
      if (!moved && line.some((v, i) => v !== col[i])) moved = true
      gainedTotal += gained
    }
    return { grid: ng, moved, gained: gainedTotal }
  }

  const moveDown = g => {
    let moved = false
    let gainedTotal = 0
    const ng = Array.from({ length: 4 }, () => Array(4).fill(0))
    for (let c = 0; c < 4; c++) {
      const col = [g[3][c], g[2][c], g[1][c], g[0][c]]
      const { line, gained } = mergeLine(col)
      const res = line.slice().reverse()
      for (let r = 0; r < 4; r++) ng[r][c] = res[r]
      if (!moved && res.some((v, i) => v !== [g[0][c], g[1][c], g[2][c], g[3][c]][i])) moved = true
      gainedTotal += gained
    }
    return { grid: ng, moved, gained: gainedTotal }
  }

  const handleMove = dir => {
    let res
    if (dir === 'left') res = moveLeft(grid)
    else if (dir === 'right') res = moveRight(grid)
    else if (dir === 'up') res = moveUp(grid)
    else if (dir === 'down') res = moveDown(grid)
    if (!res || !res.moved) return
    prevGridRef.current = grid
    const { grid: withTile, pos } = addRandomTile(res.grid)
    setGrid(withTile)
    setNewTilePos(pos)
    setLastDir(dir)
    setAnimating(true)
    if (res.gained) setScore(v => v + res.gained)
  }

  const onKeyDown = e => {
    if (e.key === 'ArrowLeft') handleMove('left')
    else if (e.key === 'ArrowRight') handleMove('right')
    else if (e.key === 'ArrowUp') handleMove('up')
    else if (e.key === 'ArrowDown') handleMove('down')
  }

  const onTouchStart = e => {
    setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY })
  }

  const onTouchEnd = e => {
    if (!touchStart) return
    const touchEnd = { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY }
    const dx = touchEnd.x - touchStart.x
    const dy = touchEnd.y - touchStart.y
    const absDx = Math.abs(dx)
    const absDy = Math.abs(dy)

    if (Math.max(absDx, absDy) > 30) { // 最小滑动距离阈值
      if (absDx > absDy) {
        handleMove(dx > 0 ? 'right' : 'left')
      } else {
        handleMove(dy > 0 ? 'down' : 'up')
      }
    }
    setTouchStart(null)
  }

  useEffect(() => {
    const { grid: g } = addRandomTile(addRandomTile(Array.from({ length: 4 }, () => Array(4).fill(0))).grid)
    setGrid(g)
    prevGridRef.current = g
  }, [])

  useEffect(() => {
    const el = boardRef.current
    if (el) el.focus()
  }, [boardRef])

  useEffect(() => {
    if (animating) {
      const t = setTimeout(() => setAnimating(false), 160)
      return () => clearTimeout(t)
    }
  }, [animating])

  const reset = () => {
    setGrid(Array.from({ length: 4 }, () => Array(4).fill(0)))
    setScore(0)
    const { grid: g } = addRandomTile(addRandomTile(Array.from({ length: 4 }, () => Array(4).fill(0))).grid)
    setGrid(g)
    setNewTilePos(null)
    setLastDir(null)
    prevGridRef.current = g
    const el = boardRef.current
    if (el) el.focus()
  }

  return (
    <div className="game">
      <div className="header">
        <h1>2048</h1>
        <div className="score" aria-live="polite">当前分数：{score}</div>
        <button className="reset" onClick={reset}>重新开始</button>
      </div>
      <div
        className="board"
        role="grid"
        aria-label="2048游戏面板"
        tabIndex={0}
        onKeyDown={onKeyDown}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        ref={boardRef}
      >
        {grid.map((row, r) => (
          row.map((v, c) => {
            const isNew = newTilePos && newTilePos.r === r && newTilePos.c === c
            const isChanged = prevGridRef.current && prevGridRef.current[r][c] !== v
            let animClass = ''
            if (isNew) animClass = 'pop-in'
            else if (isChanged && animating && lastDir) animClass = 'slide-' + lastDir

            return (
              <div
                key={`${r}-${c}`}
                role="gridcell"
                className={`tile ${v === 0 ? 'empty' : 'v-' + v} ${v !== 0 ? animClass : ''}`}
                aria-label={v === 0 ? '空' : String(v)}
              >
                {v !== 0 ? v : ''}
              </div>
            )
          })
        ))}
      </div>
      <div className="hint">使用键盘方向键移动方块</div>
    </div>
  )
}

export default App
