import { useEffect, useRef, useState } from 'react'
import './App.scss'
import useGameState from './hooks/useGameState'
import { getBestMove } from './ai/engine'
import { getComment } from './ai/localComments'

import AIAssistant from './components/AIAssistant'

function App() {
  const {
    grid,
    score,
    lastDir,
    animating,
    newTilePos,
    isGameOver,
    prevGrid,
    setAnimating,
    resetGame,
    performMove,
    getGameState
  } = useGameState()

  const [touchStart, setTouchStart] = useState(null)
  const boardRef = useRef(null)
  
  // State
  const [aiEnabled, setAiEnabled] = useState(true)
  const [aiMessage, setAiMessage] = useState("你好，我是2048！")
  const [aiMood, setAiMood] = useState("NEUTRAL")
  const [aiSuggestion, setAiSuggestion] = useState("")

  // AI Logic - Tactical Suggestions (Local)
  useEffect(() => {
    if (!aiEnabled || isGameOver) return
    
    const timer = setTimeout(() => {
      const bestMove = getBestMove(grid)
      setAiSuggestion(bestMove)
    }, 300) // Debounce

    return () => clearTimeout(timer)
  }, [grid, isGameOver, aiEnabled])

  // AI Logic - Emotional Comments
  const triggerAI = async (type) => {
    if (!aiEnabled) return
    // Use getGameState() to provide context for comments
    const gameState = getGameState()
    
    // getComment is now async due to API call
    const result = await getComment(type, gameState)
    
    // Check if result exists (it might fail silently or return default)
    if (result) {
      setAiMessage(result.text)
      setAiMood(result.mood)
    }
  }

  const handleMove = (dir) => {
    const { moved, gained, newGrid } = performMove(dir)
    
    if (moved) {
      // Prioritize high value events
      if (gained > 500) {
        triggerAI('high_score')
      } else if (gained >= 128) {
        triggerAI('merge_large')
      } else if (gained >= 64) {
        if (Math.random() > 0.3) triggerAI('merge_medium')
      } else {
        // Check for crowded grid
        const emptyCells = newGrid.flat().filter(c => c === 0).length
        if (emptyCells <= 2 && Math.random() > 0.6) {
          triggerAI('grid_full')
        } else if (gained > 0 && Math.random() > 0.8) {
          // Occasional comment on small merges
          triggerAI('merge_small')
        }
      }
    } else {
      // Invalid move attempt
       if (Math.random() > 0.7) triggerAI('bad_move')
    }
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

    if (Math.max(absDx, absDy) > 30) {
      if (absDx > absDy) {
        handleMove(dx > 0 ? 'right' : 'left')
      } else {
        handleMove(dy > 0 ? 'down' : 'up')
      }
    }
    setTouchStart(null)
  }

  useEffect(() => {
    // Focus game board on load
    const el = boardRef.current
    if (el) el.focus()
    // AI Greeting on start - Wrapped in timeout to avoid direct state update during render
    const timer = setTimeout(() => {
      triggerAI('start')
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (animating) {
      const t = setTimeout(() => setAnimating(false), 160)
      return () => clearTimeout(t)
    }
  }, [animating])
  
  // Check Game Over
  useEffect(() => {
    if (isGameOver) {
      // Avoid direct state update
      const timer = setTimeout(() => {
        triggerAI('game_over')
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [isGameOver])

  return (
    <div className="game">
      <div className="header">
        <h1>2048</h1>
        <div className="score" aria-live="polite">当前分数：{score}</div>
        <button className="reset" onClick={() => { resetGame(); triggerAI('start'); }}>重新开始</button>
      </div>
      
      <AIAssistant
        message={aiMessage}
        suggestion={aiSuggestion}
        mood={aiMood}
        aiEnabled={aiEnabled}
        onToggle={() => setAiEnabled(!aiEnabled)}
      />

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
            const isChanged = prevGrid && prevGrid[r][c] !== v
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
      {isGameOver && <div className="game-over">游戏结束!</div>}
    </div>
  )
}

export default App
