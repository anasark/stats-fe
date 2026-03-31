import axios from "axios";

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  headers: { Accept: "application/json" },
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

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
