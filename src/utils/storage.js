export function setCookie(name, value, options = {}) {
  if (typeof document === "undefined") return;
  let cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
  if (options.maxAge != null) {
    cookie += `; max-age=${options.maxAge}`;
  }
  if (options.expires instanceof Date) {
    cookie += `; expires=${options.expires.toUTCString()}`;
  }
  if (options.path) {
    cookie += `; path=${options.path}`;
  }
  if (options.domain) {
    cookie += `; domain=${options.domain}`;
  }
  if (options.secure) {
    cookie += "; secure";
  }
  if (options.sameSite) {
    cookie += `; samesite=${options.sameSite}`;
  }
  document.cookie = cookie;
}

export function getCookie(name) {
  if (typeof document === "undefined") return null;
  const target = `${encodeURIComponent(name)}=`;
  const cookies = document.cookie ? document.cookie.split("; ") : [];
  for (let i = 0; i < cookies.length; i += 1) {
    const item = cookies[i];
    if (item.startsWith(target)) {
      return decodeURIComponent(item.substring(target.length));
    }
  }
  return null;
}

export function removeCookie(name, options = {}) {
  setCookie(name, "", {
    maxAge: 0,
    path: options.path || "/",
    domain: options.domain,
  });
}

export function setLocal(key, value) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export function getLocal(key) {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(key);
  if (raw == null) return null;
  try {
    if (raw[0] === "{" || raw[0] === "[") {
      return JSON.parse(raw);
    }
    return raw;
  } catch {
    return raw;
  }
}

export function removeLocal(key) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    return null;
  }
}
