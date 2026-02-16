import axios from "axios";
import { getCookie } from "./storage";

const isDev = import.meta.env.DEV;
const API_HOST = import.meta.env.VITE_API_HOST || "http://120.76.217.123:3000";

const instance = axios.create({
  baseURL: "/api",
  timeout: 10000,
  withCredentials: false,
});

instance.interceptors.request.use(
  (config) => {
    const token = typeof document !== "undefined" ? getCookie("token") : null;
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

instance.interceptors.response.use(
  (response) => response.data,
  (error) => Promise.reject(error),
);

export function request(config) {
  return instance(config);
}

export function get(url, params, config = {}) {
  return instance({
    method: "get",
    url,
    params,
    ...config,
  });
}

export function post(url, data, config = {}) {
  return instance({
    method: "post",
    url,
    data,
    ...config,
  });
}
