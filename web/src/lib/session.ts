import { useSyncExternalStore } from "react";

export interface SessionUser {
  id: string;
  name: string;
  username: string;
  email: string;
}

export interface Session {
  token: string;
  user: SessionUser;
}

const STORAGE_KEY = "nimbus.session";
const listeners = new Set<() => void>();

function read(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

let current = read();

function emit() {
  listeners.forEach((listener) => listener());
}

// Keep tabs in sync: signing out in one tab signs out everywhere.
window.addEventListener("storage", (event) => {
  if (event.key === STORAGE_KEY) {
    current = read();
    emit();
  }
});

export const session = {
  get: () => current,
  token: () => current?.token ?? null,
  set(next: Session) {
    current = next;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    emit();
  },
  clear() {
    current = null;
    localStorage.removeItem(STORAGE_KEY);
    emit();
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

export function useSession(): Session | null {
  return useSyncExternalStore(session.subscribe, session.get);
}
