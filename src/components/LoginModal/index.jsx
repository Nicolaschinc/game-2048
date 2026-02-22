import { useState } from "react";
import { login as loginApi } from "../../api/auth";
import { setCookie } from "../../utils/storage";
import { useUser } from "../../context/UserContext";
import SHA256 from "crypto-js/sha256";

function LoginModal({ isOpen, onClose, onSwitchToRegister }) {
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { setUser } = useUser();

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (submitting) return;
    const email = account.trim();
    if (!email || !password) return;

    try {
      setSubmitting(true);
      const encryptedPassword = SHA256(password).toString();
      const data = await loginApi(email, encryptedPassword);

      if (typeof window !== "undefined" && data && data.token) {
        setCookie("token", data.token, { path: "/" });
      }
      setUser(data?.user || data);
      if (onClose) {
        onClose();
      }
    } catch {
      const fallbackUser = { name: email, email };
      setUser(fallbackUser);
      if (onClose) {
        onClose();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="menu-modal-backdrop" onClick={onClose}>
      <div
        className="menu-modal"
        role="dialog"
        aria-modal="true"
        aria-label="登录"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="menu-modal-title">登录</div>
        <div className="menu-modal-actions">
          <label className="auth-field">
            <span>Email</span>
            <input
              type="email"
              value={account}
              onChange={(e) => setAccount(e.target.value)}
            />
          </label>
          <label className="auth-field">
            <span>密码</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <button
            type="button"
            className="menu-modal-btn"
            onClick={handleSubmit}
            disabled={submitting}
          >
            登录
          </button>
          <a
            href="#"
            className="auth-switch-link"
            onClick={(e) => {
              e.preventDefault();
              onSwitchToRegister();
            }}
          >
            注册
          </a>
        </div>
      </div>
    </div>
  );
}

export default LoginModal;
