import { post } from "../utils/request";

export function login(email, password) {
  return post("/auth/login", { email, password });
}

export function register(email, password) {
  return post("/auth/register", { email, password });
}
