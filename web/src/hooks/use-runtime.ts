import type { AxiosInstance } from "axios";
import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { absoluteOrigin, env } from "@/config/env";
import { orchestrator, runtimeClient } from "@/lib/http";
import { errorMessage } from "@/lib/utils";

export type RuntimeState = "starting" | "connecting" | "ready" | "reconnecting" | "error";

export interface RuntimeHandle {
  state: RuntimeState;
  error: string | null;
  socket: Socket | null;
  http: AxiosInstance | null;
  /** e.g. /user/alice — preview URLs are built as `${previewBase}/<port>/` */
  previewBase: string | null;
  restart: () => Promise<void>;
  retry: () => void;
}

interface SpawnResponse {
  status: "running" | "starting" | "stopped";
  runtimePath: string;
  previewPath: string;
}

const STATUS_ATTEMPTS = 180;
const STATUS_INTERVAL_MS = 700;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Starts the user's runtime through the orchestrator, waits until it reports the runtime as
 * running, then opens the runtime socket (terminal, live file edits, file watcher).
 */
export function useRuntime(token: string): RuntimeHandle {
  const [state, setState] = useState<RuntimeState>("starting");
  const [error, setError] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [http, setHttp] = useState<AxiosInstance | null>(null);
  const [previewBase, setPreviewBase] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setState("starting");
      setError(null);
      try {
        let { data } = await orchestrator.post<SpawnResponse>("/spawn");
        if (cancelled) return;
        setPreviewBase(data.previewPath);

        // Ask the orchestrator (not the proxy) until the runtime is up, so polling never
        // hits a half-started process.
        for (let i = 0; i < STATUS_ATTEMPTS && data.status !== "running" && !cancelled; i++) {
          await sleep(STATUS_INTERVAL_MS);
          data = (await orchestrator.get<SpawnResponse>("/status")).data;
          if (data.status === "stopped") data = (await orchestrator.post<SpawnResponse>("/spawn")).data;
        }
        if (cancelled) return;
        if (data.status !== "running") throw new Error("Your workspace didn't start in time.");
        const client = runtimeClient(data.runtimePath);

        setState("connecting");
        const s = io(absoluteOrigin(env.orchestratorUrl), {
          path: `${data.runtimePath}/socket.io/`,
          // WebSocket handshakes can't carry an Authorization header; the orchestrator
          // accepts the token as a query param (or the cookie set by /spawn).
          query: { token },
          withCredentials: true,
          transports: ["polling", "websocket"],
          reconnectionDelay: 1000,
          reconnectionDelayMax: 8000,
        });
        let failures = 0;
        s.on("connect", () => {
          failures = 0;
          setState("ready");
          setError(null);
        });
        s.on("disconnect", () => !cancelled && setState("reconnecting"));
        s.on("connect_error", () => {
          if (++failures >= 6 && !cancelled) {
            setState("error");
            setError("Lost connection to your workspace.");
          }
        });

        socketRef.current = s;
        setSocket(s);
        setHttp(() => client);
      } catch (err) {
        if (cancelled) return;
        setState("error");
        setError(errorMessage(err, "Couldn't start your workspace"));
      }
    };

    void run();
    return () => {
      cancelled = true;
      socketRef.current?.close();
      socketRef.current = null;
      setSocket(null);
      setHttp(null);
    };
  }, [token, attempt]);

  const retry = useCallback(() => setAttempt((a) => a + 1), []);

  const restart = useCallback(async () => {
    socketRef.current?.close();
    await orchestrator.post("/delete").catch(() => {});
    setAttempt((a) => a + 1);
  }, []);

  return { state, error, socket, http, previewBase, restart, retry };
}
