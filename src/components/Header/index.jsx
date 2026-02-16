import "./index.scss";
import { useUser } from "../../context/UserContext";

function Header({ score, highScore, onReset, onOpenMenu, onOpenAuth }) {
  const { isLoggedIn, userName } = useUser();
  return (
    <div className="header" role="banner">
      <div className="header-top">
        <h1 className="title">2048</h1>
        <div className="actions">
          <div
            className="score"
            aria-live="polite"
            aria-label={`当前分数 ${score}`}
          >
            <span className="score-label">分数</span>
            <span className="score-value">{score}</span>
          </div>
          <div
            className="score high-score"
            aria-label={`历史最高分 ${highScore}`}
          >
            <span className="score-label">历史最高</span>
            <span className="score-value">{highScore}</span>
          </div>
        </div>
      </div>
      <div className="header-bottom">
        {!isLoggedIn ? (
          <a
            href="#"
            className="login-entry"
            onClick={(e) => {
              e.preventDefault();
              if (onOpenAuth) onOpenAuth("login");
            }}
          >
            登录
          </a>
        ) : (
          <button
            type="button"
            className="login-entry user-entry"
            onClick={() => {
              if (onOpenAuth) onOpenAuth("login");
            }}
            aria-label={userName || "当前用户"}
          >
            {userName || "用户"}
          </button>
        )}
        <button className="reset" aria-label="重新开始 (R)" onClick={onReset}>
          <span className="btn-text">重新开始</span>
        </button>
        <button
          className="menu-btn"
          type="button"
          aria-label="打开菜单"
          onClick={onOpenMenu}
        >
          <span className="btn-text">菜单</span>
        </button>
      </div>
    </div>
  );
}

export default Header;
