import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRoot } from "react-dom/client";
import { Toaster } from "@/components/ui/sonner";
import AppRouter from "@/routes/AppRouter";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

// No StrictMode: its dev-only double mount would tear down the imperative Monaco, xterm
// and socket lifecycles that the workspace manages.
createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <AppRouter />
    <Toaster position="bottom-right" />
  </QueryClientProvider>
);
