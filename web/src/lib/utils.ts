import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { isAxiosError } from "axios";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Best human-readable message from an API error. */
export function errorMessage(error: unknown, fallback = "Something went wrong"): string {
  if (isAxiosError(error)) {
    const message = (error.response?.data as { message?: string } | undefined)?.message;
    if (message) return message;
    if (!error.response) return "Can't reach the server. Is it running?";
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}
