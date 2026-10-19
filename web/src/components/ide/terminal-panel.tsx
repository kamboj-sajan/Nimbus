import "@xterm/xterm/css/xterm.css";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import { Terminal } from "@xterm/xterm";
import { Eraser, Loader2, RotateCcw, ServerCrash, SquareTerminal } from "lucide-react";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { IDE_THEMES } from "@/config/brand";
import { useTheme, type ResolvedTheme } from "@/lib/theme";
import { useWorkspace } from "@/contexts/workspace";
import Panel, { PanelAction } from "./panel";

function xtermTheme(mode: ResolvedTheme) {
  const c = IDE_THEMES[mode];
  return { background: c.surface, foreground: c.foreground, cursor: c.accent, selectionBackground: c.selection };
}

export default function TerminalPanel() {
  const { resolved } = useTheme();
  const { runtime } = useWorkspace();
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const restartRef = useRef<() => void>(() => {});
  const socket = runtime.socket;

  useEffect(() => {
    if (!socket || !containerRef.current) return;

    const term = new Terminal({
      cursorBlink: true,
      cursorStyle: "bar",
      fontFamily: '"JetBrains Mono", Menlo, monospace',
      fontSize: 13,
      lineHeight: 1.25,
      scrollback: 5000,
      allowProposedApi: true,
      theme: xtermTheme(document.documentElement.classList.contains("dark") ? "dark" : "light"),
    });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.loadAddon(new WebLinksAddon());
    term.open(containerRef.current);
    termRef.current = term;

    const safeFit = () => {
      try {
        fit.fit();
      } catch {
        // container not laid out yet
      }
    };
    safeFit();

    let exited = false;
    const start = () => {
      exited = false;
      safeFit();
      socket.emit("terminal:start", { cols: term.cols, rows: term.rows });
    };
    restartRef.current = () => {
      term.reset();
      start();
    };

    const onOutput = (data: string) => term.write(data);
    const onExit = ({ exitCode }: { exitCode: number }) => {
      exited = true;
      term.write(`\r\n\x1b[90m[process exited with code ${exitCode} — press Enter to restart]\x1b[0m\r\n`);
    };
    const onReconnect = () => {
      term.write("\r\n\x1b[90m[reconnected]\x1b[0m\r\n");
      start();
    };

    socket.on("terminal:output", onOutput);
    socket.on("terminal:exit", onExit);
    socket.io.on("reconnect", onReconnect);
    const input = term.onData((data) => {
      if (exited) {
        if (data === "\r") restartRef.current();
        return;
      }
      socket.emit("terminal:input", data);
    });
    const resize = term.onResize(({ cols, rows }) => socket.emit("terminal:resize", { cols, rows }));

    const observer = new ResizeObserver(() => safeFit());
    observer.observe(containerRef.current);
    start();

    return () => {
      observer.disconnect();
      input.dispose();
      resize.dispose();
      socket.off("terminal:output", onOutput);
      socket.off("terminal:exit", onExit);
      socket.io.off("reconnect", onReconnect);
      term.dispose();
      termRef.current = null;
    };
  }, [socket]);

  useEffect(() => {
    if (termRef.current) termRef.current.options.theme = xtermTheme(resolved);
  }, [resolved]);

  const starting = runtime.state === "starting" || runtime.state === "connecting";

  return (
    <Panel
      title="Terminal"
      icon={SquareTerminal}
      actions={
        <>
          <PanelAction icon={Eraser} label="Clear" onClick={() => termRef.current?.clear()} disabled={!socket} />
          <PanelAction icon={RotateCcw} label="Restart shell" onClick={() => restartRef.current()} disabled={!socket} />
        </>
      }
    >
      <div ref={containerRef} className="nimbus-terminal absolute inset-0 px-3 py-2" />

      {(starting || runtime.state === "error") && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-ide-surface/95 px-4 text-center">
          {starting ? (
            <>
              <Loader2 className="size-5 animate-spin text-link" />
              <div>
                <p className="text-sm font-medium">
                  {runtime.state === "starting" ? "Starting your workspace…" : "Connecting to your workspace…"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Spinning up an isolated runtime and loading your files.
                </p>
              </div>
            </>
          ) : (
            <>
              <ServerCrash className="size-6 text-destructive" />
              <div>
                <p className="text-sm font-medium">Workspace unavailable</p>
                <p className="mt-1 text-xs text-muted-foreground">{runtime.error}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={runtime.retry}>
                  Retry
                </Button>
                <Button size="sm" variant="outline" onClick={() => void runtime.restart()}>
                  Restart workspace
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </Panel>
  );
}
