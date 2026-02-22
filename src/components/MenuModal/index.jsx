import { useUser } from "../../context/UserContext";

function MenuModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const { isLoggedIn, clearUser } = useUser();

  const handleLogout = () => {
    clearUser();
    if (onClose) {
      onClose();
    }
  };

  return (
    <div
      className="menu-modal-backdrop"
      onClick={onClose}
    >
      <div
        className="menu-modal"
        role="dialog"
        aria-modal="true"
        aria-label="游戏菜单"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="menu-modal-title">游戏菜单</div>
        <div className="menu-modal-actions">
          <button
            type="button"
            className="menu-modal-btn"
            onClick={onClose}
          >
            继续游戏
          </button>
          <button
            type="button"
            className="menu-modal-btn menu-modal-btn-disabled"
            disabled
            aria-disabled="true"
          >
            玩法说明
          </button>
          <button
            type="button"
            className="menu-modal-btn menu-modal-btn-disabled"
            disabled
            aria-disabled="true"
          >
            反馈建议
          </button>
          {isLoggedIn && (
            <button
              type="button"
              className="menu-modal-btn menu-modal-btn-secondary"
              onClick={handleLogout}
            >
              退出登录
            </button>
          )}
          <button
            type="button"
            className="menu-modal-btn menu-modal-btn-secondary"
            onClick={onClose}
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}

MenuModal.propTypes = {
  // 在开发环境可通过 JSDoc 或 TypeScript 辅助类型检查
};

export default MenuModal;
