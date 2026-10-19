import { useQueryClient } from "@tanstack/react-query";
import { KeyRound, LogOut, PanelLeft, RefreshCcw, Users } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import BrandLogo from "@/components/brand/brand-logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useWorkspace } from "@/contexts/workspace";
import type { RuntimeState } from "@/hooks/use-runtime";
import { authApi } from "@/lib/api";
import { session as sessionStore } from "@/lib/session";
import { cn, initials } from "@/lib/utils";
import ChangePasswordDialog from "./change-password-dialog";

const RUNTIME_LABELS: Record<RuntimeState, { text: string; dot: string }> = {
  starting: { text: "Starting workspace", dot: "bg-amber-400 animate-pulse" },
  connecting: { text: "Connecting", dot: "bg-amber-400 animate-pulse" },
  ready: { text: "Workspace running", dot: "bg-emerald-400" },
  reconnecting: { text: "Reconnecting", dot: "bg-amber-400 animate-pulse" },
  error: { text: "Workspace offline", dot: "bg-red-500" },
};

export default function TopBar({ onToggleExplorer }: { onToggleExplorer: () => void }) {
  const { session, runtime, collab, editor } = useWorkspace();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [changingPassword, setChangingPassword] = useState(false);
  const status = RUNTIME_LABELS[runtime.state];

  const signOut = async () => {
    await editor.flush();
    await authApi.logout().catch(() => {});
    sessionStore.clear();
    queryClient.clear();
    navigate("/sign-in");
  };

  const restartWorkspace = async () => {
    await editor.flush();
    toast.info("Restarting your workspace…");
    await runtime.restart();
  };

  return (
    <header className="flex h-12 shrink-0 items-center gap-3 px-3">
      <button
        type="button"
        onClick={onToggleExplorer}
        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
        title="Toggle explorer (⌘/Ctrl B)"
        aria-label="Toggle explorer"
      >
        <PanelLeft className="size-4" />
      </button>
      <BrandLogo size="sm" to="/" />

      <div className="ml-auto flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-xs text-muted-foreground">
              <span className={cn("size-2 rounded-full", status.dot)} />
              <span className="hidden sm:inline">{status.text}</span>
            </span>
          </TooltipTrigger>
          <TooltipContent>{runtime.error ?? "Your isolated runtime: terminal, live files and preview"}</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <span
              className={cn(
                "flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-xs",
                collab.connected ? "text-sky-300" : "text-muted-foreground"
              )}
            >
              <Users className="size-3.5" />
              <span className="hidden md:inline">{collab.connected ? "Live sync" : "Sync offline"}</span>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            {collab.connected ? "Edits sync in real time across your open tabs" : "Reconnecting to the collaboration server…"}
          </TooltipContent>
        </Tooltip>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 via-indigo-500 to-purple-500 text-xs font-semibold text-white ring-1 ring-white/20 transition-transform hover:scale-105"
              aria-label="Account menu"
            >
              {initials(session.user.name) || "?"}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="text-sm font-medium">{session.user.name}</div>
              <div className="truncate text-xs text-muted-foreground">{session.user.email}</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setChangingPassword(true)}>
              <KeyRound className="size-4" /> Change password
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => void restartWorkspace()}>
              <RefreshCcw className="size-4" /> Restart workspace
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => void signOut()}>
              <LogOut className="size-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ChangePasswordDialog open={changingPassword} onOpenChange={setChangingPassword} />
    </header>
  );
}
