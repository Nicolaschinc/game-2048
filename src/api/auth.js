import { post } from "../utils/request";

export function login(account, password) {
  return post("/auth/login", { account, password });
}

export function register(email, password) {
  return post("/auth/register", { email, password });
}

