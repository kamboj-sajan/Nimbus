import axios, { type AxiosInstance } from "axios";
import { env } from "@/config/env";
import { session } from "./session";

function withAuth(instance: AxiosInstance): AxiosInstance {
  instance.interceptors.request.use((config) => {
    const token = session.token();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });
  return instance;
}

/** Main API (auth, files). Expired sessions bounce the user back to sign-in. */
export const api = withAuth(axios.create({ baseURL: `${env.apiUrl}/api` }));

api.interceptors.response.use(undefined, (error) => {
  const isAuthCall = String(error.config?.url ?? "").startsWith("/auth/");
  if (error.response?.status === 401 && !isAuthCall && session.get()) {
    session.clear();
  }
  return Promise.reject(error);
});

/** Orchestrator control plane (spawn / status / delete). Cookies carry preview access. */
export const orchestrator = withAuth(
  axios.create({ baseURL: env.orchestratorUrl || undefined, withCredentials: true })
);

/** HTTP client for one user's runtime, reached through the orchestrator proxy. */
export function runtimeClient(runtimePath: string): AxiosInstance {
  return withAuth(
    axios.create({ baseURL: `${env.orchestratorUrl}${runtimePath}`, withCredentials: true })
  );
}
