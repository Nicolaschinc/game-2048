import { useState } from "react";
import "./index.scss";
import { register as registerApi } from "../../api/auth";
import SHA256 from "crypto-js/sha256";
import { setCookie } from "../../utils/storage";

function RegisterModal({
  isOpen,
  onClose,
  onSwitchToLogin,
  onRegisterSuccess,
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const validateEmail = (value) => {
    const trimmed = value.trim();
    if (!trimmed) return "请输入邮箱地址";
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(trimmed)) return "请输入正确的邮箱地址";
    return "";
  };

  const validatePassword = (value) => {
    if (!value) return "请输入密码";
    const valid =
      value.length >= 6 && /[A-Za-z]/.test(value) && /\d/.test(value);
    if (!valid) return "密码至少 6 位，且同时包含字母和数字";
    return "";
  };

  const handleEmailBlur = () => {
    setEmailError(validateEmail(email));
  };

  const handlePasswordBlur = () => {
    setPasswordError(validatePassword(password));
  };

  const handleSubmit = async () => {
    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);
    setEmailError(emailErr);
    setPasswordError(passwordErr);
    if (emailErr || passwordErr || submitting) {
      if (emailErr || passwordErr) {
        window.alert(emailErr || passwordErr);
      }
      return;
    }

    const trimmedEmail = email.trim();
    const encryptedPassword = SHA256(password).toString();

    try {
      setSubmitting(true);
      const data = await registerApi(trimmedEmail, encryptedPassword);
      const displayName =
        (data && (data.name || data.nickname || data.email)) ||
        trimmedEmail;
      const user = { name: displayName, ...data };
      if (typeof window !== "undefined" && data && data.token) {
        setCookie("token", data.token, { path: "/" });
      }
      if (onRegisterSuccess) {
        onRegisterSuccess(user);
      }
    } catch {
      const fallbackUser = { name: trimmedEmail, email: trimmedEmail };
      if (onRegisterSuccess) {
        onRegisterSuccess(fallbackUser);
      }
    } finally {
      setSubmitting(false);
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
        aria-label="注册"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="menu-modal-title">注册</div>
        <div className="menu-modal-actions">
          <label className="auth-field">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={handleEmailBlur}
            />
            {emailError && <div className="auth-error">{emailError}</div>}
          </label>
          <label className="auth-field">
            <span>密码</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={handlePasswordBlur}
            />
            {passwordError && (
              <div className="auth-error">{passwordError}</div>
            )}
          </label>
          <button
            type="button"
            className="menu-modal-btn"
            onClick={handleSubmit}
            disabled={submitting}
          >
            注册
          </button>
          <a
            href="#"
            className="auth-switch-link"
            onClick={(e) => {
              e.preventDefault();
              onSwitchToLogin();
            }}
          >
            返回登录
          </a>
        </div>
      </div>
    </div>
  );
}

export default RegisterModal;
