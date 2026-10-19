import { useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { absoluteOrigin, env } from "@/config/env";

/** Socket to the API's realtime hub: collaborative edits and tree-change notifications. */
export function useCollabSocket(token: string) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const s = io(absoluteOrigin(env.apiUrl), {
      auth: { token },
      transports: ["websocket", "polling"],
    });
    s.on("connect", () => setConnected(true));
    s.on("disconnect", () => setConnected(false));
    setSocket(s);
    return () => {
      s.close();
      setSocket(null);
      setConnected(false);
    };
  }, [token]);

  return { socket, connected };
}
