import { useEffect, useRef, useState, useCallback } from "react";
import "./App.scss";
import useGameState from "./hooks/useGameState";
import { getBestMoveMinimax } from "./ai/engine";
import { getComment } from "./ai/localComments";
import { UserProvider } from "./context/UserContext";
import { initGA, logPageView, logEvent } from "./utils/analytics";

import AIAssistant from "./components/AIAssistant";
import Header from "./components/Header";
import Board from "./components/Board";
import MenuModal from "./components/MenuModal";
import LoginModal from "./components/LoginModal";
import RegisterModal from "./components/RegisterModal";

function App() {
  const aiSwitchRaw = String(
    import.meta.env.VITE_AI_SWITCH ?? "",
  ).toLowerCase();
  const aiSwitchOn =
    aiSwitchRaw === "true" || aiSwitchRaw === "1" || aiSwitchRaw === "yes";
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
    getGameState,
    mergedPositions,
  } = useGameState();

  const [touchStart, setTouchStart] = useState(null);
  const boardRef = useRef(null);
  const greetedRef = useRef(false);

  // State
  const [aiEnabled, setAiEnabled] = useState(aiSwitchOn);
  const [aiMessage, setAiMessage] = useState(""); // Start empty
  const [aiMood, setAiMood] = useState("NEUTRAL");
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [messageQueue, setMessageQueue] = useState([]);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  const [lastAIInput, setLastAIInput] = useState("");
  const [lastAIOutput, setLastAIOutput] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [authMode, setAuthMode] = useState(null);
  const [highScore] = useState(() => {
    if (typeof window === "undefined") return 0;
    const stored = window.localStorage.getItem("highScore");
    return stored ? Number(stored) || 0 : 0;
  });
  const effectiveHighScore = score > highScore ? score : highScore;

  // Initialize Analytics
  useEffect(() => {
    initGA();
    logPageView(window.location.pathname);
  }, []);

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
          setMessageQueue((prev) => prev.slice(1));
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
    if (!aiEnabled || isGameOver) return;

    const timer = setTimeout(() => {
      const bestMove = getBestMoveMinimax(grid);
      setAiSuggestion(bestMove);
    }, 300);

    return () => clearTimeout(timer);
  }, [grid, isGameOver, aiEnabled]);

  // AI Logic - Emotional Comments
  const triggerAI = useCallback(
    async (type) => {
      if (!aiEnabled) return;
      // Use getGameState() to provide context for comments
      const gameState = getGameState();
      // getComment is now async due to API call
      const result = await getComment(type, gameState);

      // Check if result exists and has non-empty text
      if (result && result.text && String(result.text).trim().length > 0) {
        // Add to queue instead of setting directly
        setMessageQueue((prev) => [...prev, result]);
        if (result.meta && result.meta.source === "ai") {
          setLastAIInput(result.meta.userContent || "");
          setLastAIOutput(result.text || "");
        } else {
          setLastAIInput("");
          setLastAIOutput(result.text || "");
        }
      }
    },
    [aiEnabled, getGameState],
  );

  // Initial Greeting (guarded against StrictMode double-invoke)
  useEffect(() => {
    if (!aiEnabled || greetedRef.current) return;
    greetedRef.current = true;
    setTimeout(() => triggerAI("start"), 0);
  }, [aiEnabled, triggerAI]);

  useEffect(() => {
    if (typeof window !== "undefined" && effectiveHighScore !== highScore) {
      window.localStorage.setItem("highScore", String(effectiveHighScore));
    }
  }, [effectiveHighScore, highScore]);

  const handleOpenAuth = (mode) => {
    setAuthMode(mode);
  };

  const handleMove = (dir) => {
    const { moved, gained, newGrid } = performMove(dir);

    if (moved) {
      logEvent('move', { category: 'Game', label: dir, value: gained || 0 });
      // Prioritize high value events
      if (gained > 500) {
        triggerAI("high_score");
      } else if (gained >= 128) {
        triggerAI("merge_large");
      } else if (gained >= 64) {
        if (Math.random() > 0.3) triggerAI("merge_medium");
      } else {
        // Check for crowded grid
        const emptyCells = newGrid.flat().filter((c) => c === 0).length;
        if (emptyCells <= 2 && Math.random() > 0.6) {
          triggerAI("grid_full");
        } else if (gained > 0 && Math.random() > 0.8) {
          // Occasional comment on small merges
          triggerAI("merge_small");
        }
      }
    } else {
      // Invalid move attempt
      if (Math.random() > 0.7) triggerAI("bad_move");
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowLeft") handleMove("left");
    else if (e.key === "ArrowRight") handleMove("right");
    else if (e.key === "ArrowUp") handleMove("up");
    else if (e.key === "ArrowDown") handleMove("down");
    else if (e.key === "r" || e.key === "R") {
      resetGame();
      triggerAI("start");
    }
  };

  const onPointerDown = (e) => {
    setTouchStart({ x: e.clientX, y: e.clientY });
  };

  const onPointerUp = (e) => {
    if (!touchStart) return;
    const end = { x: e.clientX, y: e.clientY };
    const dx = end.x - touchStart.x;
    const dy = end.y - touchStart.y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    if (Math.max(absDx, absDy) > 30) {
      if (absDx > absDy) {
        handleMove(dx > 0 ? "right" : "left");
      } else {
        handleMove(dy > 0 ? "down" : "up");
      }
    }
    setTouchStart(null);
  };

  useEffect(() => {
    // Focus game board on load
    const el = boardRef.current;
    if (el) el.focus();
  }, []);

  useEffect(() => {
    if (animating) {
      const t = setTimeout(() => setAnimating(false), 300);
      return () => clearTimeout(t);
    }
  }, [animating, setAnimating]);

  // Check Game Over
  useEffect(() => {
    if (isGameOver) {
      logEvent('game_over', { category: 'Game', label: 'Score', value: score });
      // Avoid direct state update
      const timer = setTimeout(() => {
        triggerAI("game_over");
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isGameOver, triggerAI, score]);

  return (
    <UserProvider>
      <div className="game">
        <Header
          score={score}
          highScore={effectiveHighScore}
          onReset={() => {
            resetGame();
            triggerAI("start");
          }}
          onOpenMenu={() => setIsMenuOpen(true)}
          onOpenAuth={handleOpenAuth}
        />
        <AIAssistant
          message={aiMessage}
          suggestion={aiSuggestion}
          mood={aiMood}
          aiEnabled={aiEnabled}
          onToggle={() => {
            if (aiEnabled) {
              setAiEnabled(false);
            } else if (aiSwitchOn) {
              setAiEnabled(true);
            }
          }}
          lastInput={lastAIInput}
          lastOutput={lastAIOutput}
        />

        <Board
          grid={grid}
          prevGrid={prevGrid}
          newTilePos={newTilePos}
          mergedPositions={mergedPositions}
          animating={animating}
          lastDir={lastDir}
          onKeyDown={onKeyDown}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          boardRef={boardRef}
        />
        {isGameOver && <div className="game-over">游戏结束!</div>}
        <MenuModal
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
        />
        <LoginModal
          isOpen={authMode === "login"}
          onClose={() => setAuthMode(null)}
          onSwitchToRegister={() => setAuthMode("register")}
        />
        <RegisterModal
          isOpen={authMode === "register"}
          onClose={() => setAuthMode(null)}
          onSwitchToLogin={() => setAuthMode("login")}
        />
      </div>
    </UserProvider>
  );
}

export default App;
