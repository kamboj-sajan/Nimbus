import { ExternalLink, Globe, MonitorPlay, RotateCw } from "lucide-react";
import { useRef, useState } from "react";
import { env } from "@/config/env";
import { useWorkspace } from "@/contexts/workspace";
import Panel, { PanelAction } from "./panel";

/**
 * "8080" or "8080/docs" → the user's proxied port; anything starting with http(s) is used as is.
 */
function resolvePreviewUrl(input: string, previewBase: string | null): string | null {
  const value = input.trim();
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  const match = value.match(/^:?(\d{2,5})(\/.*)?$/);
  if (match && previewBase) return `${env.orchestratorUrl}${previewBase}/${match[1]}${match[2] ?? "/"}`;
  return null;
}

export default function PreviewPanel() {
  const { runtime } = useWorkspace();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [address, setAddress] = useState("8080");
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const go = () => {
    const next = resolvePreviewUrl(address, runtime.previewBase);
    if (!next) {
      setError("Enter a port (e.g. 8080) or a full URL");
      return;
    }
    setError(null);
    setUrl(next);
    if (iframeRef.current && next === url) iframeRef.current.src = next;
  };

  const reload = () => {
    if (iframeRef.current && url) iframeRef.current.src = url;
  };

  return (
    <Panel
      title="Preview"
      icon={MonitorPlay}
      actions={
        <>
          <PanelAction icon={RotateCw} label="Reload" onClick={reload} disabled={!url} />
          <PanelAction icon={ExternalLink} label="Open in new tab" onClick={() => url && window.open(url, "_blank")} disabled={!url} />
        </>
      }
    >
      <div className="flex h-full flex-col">
        <form
          className="flex h-9 shrink-0 items-center gap-2 border-b border-ide-border bg-ide-bar/60 px-3"
          onSubmit={(e) => {
            e.preventDefault();
            go();
          }}
        >
          <div className="flex gap-1.5" aria-hidden>
            <span className="size-2.5 rounded-full bg-red-500/80" />
            <span className="size-2.5 rounded-full bg-yellow-500/80" />
            <span className="size-2.5 rounded-full bg-green-500/80" />
          </div>
          <div className="relative ml-1 flex-1">
            <Globe className="pointer-events-none absolute left-2 top-1/2 size-3 -translate-y-1/2 text-muted-foreground" />
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="h-6 w-full rounded-md border border-ide-border bg-ide-bg pl-6 pr-2 font-mono text-xs outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/50"
              placeholder="Port (8080) or URL — press Enter"
              aria-label="Preview address"
            />
          </div>
        </form>

        <div className="relative flex-1 overflow-hidden">
          {url ? (
            <iframe
              ref={iframeRef}
              src={url}
              title="Preview"
              className="size-full border-0 bg-white"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center">
              <MonitorPlay className="size-7 text-link/70" />
              <p className="text-sm font-medium">Preview your app</p>
              <p className="max-w-[16rem] text-xs text-muted-foreground">
                Start a server in the terminal — try{" "}
                <code className="rounded bg-ide-hover px-1 font-mono text-[11px]">node server.js</code> — then enter its port
                above and press Enter.
              </p>
              {error && <p className="text-xs text-destructive">{error}</p>}
            </div>
          )}
        </div>
      </div>
    </Panel>
  );
}
