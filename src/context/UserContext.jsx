import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  getCookie,
  getLocal,
  removeCookie,
  removeLocal,
  setLocal,
} from "../utils/storage";

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUserState] = useState(() =>
    typeof window !== "undefined" ? getLocal("user") : null,
  );
  const [token, setToken] = useState(() =>
    typeof document !== "undefined" ? getCookie("token") : null,
  );

  useEffect(() => {
    if (user) {
      setLocal("user", user);
    } else {
      removeLocal("user");
    }
  }, [user]);

  useEffect(() => {
    if (!token && user) {
      setUserState(null);
      removeLocal("user");
    }
  }, [token, user]);

  const setUser = (nextUser) => {
    const normalizedUser = nextUser || null;
    setUserState(normalizedUser);
    const nextToken =
      typeof document !== "undefined" ? getCookie("token") : null;
    setToken(nextToken || normalizedUser?.token || null);
  };

  const clearUser = () => {
    removeCookie("token", { path: "/" });
    removeLocal("user");
    setUserState(null);
    setToken(null);
  };

  const userName = useMemo(() => {
    if (!user) return "";
    return (
      user.name ||
      user.nickname ||
      user.email ||
      user.account ||
      ""
    );
  }, [user]);

  const isLoggedIn = useMemo(() => {
    if (!user || !userName) return false;
    return !!(token || user.token);
  }, [token, user, userName]);

  const value = useMemo(
    () => ({
      user,
      userName,
      isLoggedIn,
      setUser,
      clearUser,
    }),
    [user, userName, isLoggedIn],
  );

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error("useUser must be used within UserProvider");
  }
  return ctx;
}
