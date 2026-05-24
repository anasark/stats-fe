import axios from "axios";

function resolveApiBaseUrl(rawBaseUrl) {
  const baseUrl = (rawBaseUrl || "").trim();
  if (!baseUrl) return "/api";

  const normalized = baseUrl.replace(/\/+$/, "");
  return normalized.toLowerCase().endsWith("/api")
    ? normalized
    : `${normalized}/api`;
}

const runtimeBaseUrl =
  typeof window !== "undefined" ? window.__APP_CONFIG__?.API_BASE_URL : "";
const apiBaseUrl = resolveApiBaseUrl(
  runtimeBaseUrl || import.meta.env.VITE_API_BASE_URL,
);

const client = axios.create({
  baseURL: apiBaseUrl,
  headers: { Accept: "application/json" },
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    return Promise.reject(error);
  },
);

export async function fetchDashboard(filters = {}) {
  const params = Object.fromEntries(
    Object.entries(filters).filter(
      ([, v]) => v !== "" && v !== null && v !== undefined,
    ),
  );
  const { data } = await client.get("/dashboard", { params });
  return data;
}

export default client;
