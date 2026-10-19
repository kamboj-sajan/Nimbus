import { lazy, Suspense, type ReactNode } from "react";
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { BrandMark } from "@/components/brand/brand-logo";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/session";
import AboutPage from "@/pages/About";
import ForgotPasswordPage from "@/pages/ForgotPassword";
import HomePage from "@/pages/Home";
import LoginPage from "@/pages/Login";
import RegisterPage from "@/pages/Register";
import ResetPasswordPage from "@/pages/ResetPassword";
import VerifyEmailPage from "@/pages/VerifyEmail";

// Monaco + xterm are heavy; only load them when the workspace is opened.
const WorkspacePage = lazy(() => import("@/pages/Workspace"));

function FullScreenLoader({ label }: { label: string }) {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-5 bg-background">
      <BrandMark className="size-14 animate-pulse" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function RequireAuth({ children }: { children: ReactNode }) {
  const session = useSession();
  const location = useLocation();
  if (!session) return <Navigate to="/sign-in" replace state={{ from: location.pathname }} />;
  return children;
}

function GuestOnly({ children }: { children: ReactNode }) {
  return useSession() ? <Navigate to="/code" replace /> : children;
}

function NotFound() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
      <p className="font-mono text-6xl font-bold text-link/60">404</p>
      <h1 className="text-xl font-semibold">This page drifted away</h1>
      <Button asChild variant="outline">
        <Link to="/">Back home</Link>
      </Button>
    </div>
  );
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/sign-in" element={<GuestOnly><LoginPage /></GuestOnly>} />
        <Route path="/register" element={<GuestOnly><RegisterPage /></GuestOnly>} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route
          path="/code"
          element={
            <RequireAuth>
              <Suspense fallback={<FullScreenLoader label="Preparing your workspace…" />}>
                <WorkspacePage />
              </Suspense>
            </RequireAuth>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
