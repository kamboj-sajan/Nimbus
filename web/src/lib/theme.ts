import { useSyncExternalStore } from "react";

export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

// Keep in sync with the inline script in index.html (it applies the theme before first paint).
const STORAGE_KEY = "nimbus.theme";
const media = window.matchMedia("(prefers-color-scheme: dark)");
const listeners = new Set<() => void>();

function readPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") return stored;
  } catch {
    // storage unavailable (private mode) — fall back to the system setting
  }
  return "system";
}

let preference = readPreference();

function resolve(pref: ThemePreference): ResolvedTheme {
  return pref === "system" ? (media.matches ? "dark" : "light") : pref;
}

let snapshot = { preference, resolved: resolve(preference) };

function apply() {
  const resolved = resolve(preference);
  const root = document.documentElement;
  root.classList.toggle("dark", resolved === "dark");
  root.style.colorScheme = resolved;
  snapshot = { preference, resolved };
  listeners.forEach((listener) => listener());
}

media.addEventListener("change", () => {
  if (preference === "system") apply();
});

window.addEventListener("storage", (event) => {
  if (event.key === STORAGE_KEY) {
    preference = readPreference();
    apply();
  }
});

export function setThemePreference(next: ThemePreference) {
  preference = next;
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // ignore — the choice still applies for this session
  }
  apply();
}

apply();

export function useTheme() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => snapshot
  );
}
