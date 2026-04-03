import axios from "axios";

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  headers: { Accept: "application/json" },
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  console.log("[API] →", config.method?.toUpperCase(), config.baseURL + config.url, config.params || "");
  return config;
});

client.interceptors.response.use(
  (response) => {
    console.log("[API] ←", response.status, response.config.url, response.data);
    return response;
  },
  (error) => {
    console.error("[API] ✗", error.response?.status, error.config?.url, error.response?.data || error.message);
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
