import "./index.scss";

function Board({
  grid,
  prevGrid,
  newTilePos,
  mergedPositions,
  animating,
  lastDir,
  onKeyDown,
  onPointerDown,
  onPointerUp,
  boardRef,
}) {
  return (
    <div
      className="board"
      role="grid"
      aria-label="2048游戏面板"
      tabIndex={0}
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      ref={boardRef}
    >
      {grid.map((row, r) =>
        row.map((v, c) => {
          const isNew = newTilePos && newTilePos.r === r && newTilePos.c === c;
          const isChanged = prevGrid && prevGrid[r][c] !== v;
          const isMerged =
            mergedPositions &&
            mergedPositions.some((p) => p.r === r && p.c === c);
          let animClass = "";
          if (isNew) animClass = "pop-in";
          else if (isChanged && animating && lastDir)
            animClass = "slide-" + lastDir;

          return (
            <div
              key={`${r}-${c}`}
              role="gridcell"
              className={`tile ${v === 0 ? "empty" : "v-" + v} ${
                v !== 0 ? animClass : ""
              } ${isMerged && v !== 0 ? "merge-bounce" : ""}`}
              aria-label={v === 0 ? "空" : String(v)}
            >
              <div className="tile-inner">{v !== 0 ? v : ""}</div>
            </div>
          );
        }),
      )}
    </div>
  );
}

Board.propTypes = {
  // 在开发环境可通过 JSDoc 或 TypeScript 辅助类型检查
};

export default Board;

