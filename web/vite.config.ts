import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  server: { port: 5173 },
  // Monaco is ~3 MB; it's split out automatically because the /code route is lazy-loaded.
  build: { chunkSizeWarningLimit: 4000 },
});
