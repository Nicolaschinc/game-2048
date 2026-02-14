import { useEffect, useRef, useState, useCallback } from 'react'
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
  const greetedRef = useRef(false)
  
  // State
  const [aiEnabled, setAiEnabled] = useState(true)
  const [aiMessage, setAiMessage] = useState("") // Start empty
  const [aiMood, setAiMood] = useState("NEUTRAL")
  const [aiSuggestion, setAiSuggestion] = useState("")
  const [messageQueue, setMessageQueue] = useState([])
  const [isProcessingQueue, setIsProcessingQueue] = useState(false)

  // Message Queue Processor
  useEffect(() => {
    let timer = null;
    
    if (messageQueue.length > 0 && !isProcessingQueue) {
      // Use setTimeout to schedule state updates outside the render phase
      // to avoid "synchronous state update in effect" warning
      timer = setTimeout(() => {
        const nextMessage = messageQueue[0];
        setAiMessage(nextMessage.text);
        setAiMood(nextMessage.mood);
        setIsProcessingQueue(true);
        
        // Schedule completion after delay
        setTimeout(() => {
          setMessageQueue(prev => prev.slice(1));
          setIsProcessingQueue(false);
        }, 2500);
      }, 0);
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [messageQueue, isProcessingQueue]);

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
  const triggerAI = useCallback(async (type) => {
    if (!aiEnabled) return
    // Use getGameState() to provide context for comments
    const gameState = getGameState()
    
    // getComment is now async due to API call
    const result = await getComment(type, gameState)
    
    // Check if result exists (it might fail silently or return default)
    if (result) {
      // Add to queue instead of setting directly
      setMessageQueue(prev => [...prev, result])
    }
  }, [aiEnabled, getGameState])

  // Initial Greeting (guarded against StrictMode double-invoke)
  useEffect(() => {
    if (!aiEnabled || greetedRef.current) return
    greetedRef.current = true
    setTimeout(() => triggerAI('start'), 0)
  }, [aiEnabled, triggerAI])

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
    else if (e.key === 'r' || e.key === 'R') { resetGame(); triggerAI('start'); }
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
  }, [])

  useEffect(() => {
    if (animating) {
      const t = setTimeout(() => setAnimating(false), 160)
      return () => clearTimeout(t)
    }
  }, [animating, setAnimating])
  
  // Check Game Over
  useEffect(() => {
    if (isGameOver) {
      // Avoid direct state update
      const timer = setTimeout(() => {
        triggerAI('game_over')
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [isGameOver, triggerAI])

  return (
    <div className="game">
      <div className="header" role="banner">
        <div className="header-top">
          <h1 className="title">2048</h1>
          <div className="actions">
            <div className="score" aria-live="polite" aria-label={`当前分数 ${score}`}>
              <span className="score-label">分数</span>
              <span className="score-value">{score}</span>
            </div>
            <button 
              className="reset" 
              aria-label="重新开始 (R)"
              onClick={() => { resetGame(); triggerAI('start'); }}
            >
              <span className="btn-icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 5V2L8 6l4 4V7c3.314 0 6 2.686 6 6s-2.686 6-6 6-6-2.686-6-6H4c0 4.418 3.582 8 8 8s8-3.582 8-8-3.582-8-8-8z" fill="currentColor"/>
                </svg>
              </span>
              <span className="btn-text">重新开始</span>
              <span className="kbd" aria-hidden="true">R</span>
            </button>
          </div>
        </div>
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
