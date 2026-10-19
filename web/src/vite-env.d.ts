/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_ORCHESTRATOR_URL?: string;
  readonly VITE_AUTOSAVE_DELAY_MS?: string;
}
