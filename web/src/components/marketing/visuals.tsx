import { Check, FileCode2, Folder, Globe, Lock, RotateCw, SquareTerminal } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// Xcode's default syntax palette, light and dark.
const kw = "text-[#ad3da4] dark:text-[#fc5fa3] font-semibold";
const str = "text-[#c41a16] dark:text-[#fc6a5d]";
const num = "text-[#1c00cf] dark:text-[#d0bf69]";
const fn = "text-[#326d74] dark:text-[#67b7a4]";
const typ = "text-[#0b4f79] dark:text-[#5dd8ff]";
const cmt = "text-[#5d6c79] dark:text-[#7f8c98]";

function TrafficLights() {
  return (
    <div className="flex gap-1.5" aria-hidden>
      <span className="size-3 rounded-full bg-[#ff5f57]" />
      <span className="size-3 rounded-full bg-[#febc2e]" />
      <span className="size-3 rounded-full bg-[#28c840]" />
    </div>
  );
}

function Line({ n, children }: { n: number; children?: ReactNode }) {
  return (
    <div className="flex">
      <span className="w-8 shrink-0 select-none pr-3 text-right text-muted-foreground/50">{n}</span>
      <span className="whitespace-pre">{children}</span>
    </div>
  );
}

/** The hero "product shot": a Nimbus workspace window drawn in HTML so it follows the theme. */
export function ProductShot({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border bg-card text-left shadow-[0_30px_80px_-20px_rgb(0_0_0/0.25)] dark:shadow-[0_30px_80px_-20px_rgb(0_0_0/0.8)]",
        className
      )}
      role="img"
      aria-label="The Nimbus workspace: file explorer, code editor, terminal and live preview"
    >
      <div className="flex h-11 items-center gap-4 border-b border-border bg-surface px-4">
        <TrafficLights />
        <div className="mx-auto hidden h-6 w-72 items-center justify-center gap-1.5 rounded-md bg-background/80 text-[11px] text-muted-foreground sm:flex">
          <Lock className="size-3" /> nimbus.app/code
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="size-1.5 rounded-full bg-[#28c840]" /> Running
        </div>
      </div>

      <div className="grid grid-cols-12 text-[12px] sm:text-[13px]">
        {/* Explorer */}
        <aside className="col-span-3 hidden border-r border-border bg-surface/60 p-3 md:block">
          <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Explorer</p>
          {[
            { name: "src", folder: true },
            { name: "server.js", active: true },
            { name: "index.html" },
            { name: "styles.css" },
            { name: "package.json" },
            { name: "README.md" },
          ].map((f) => (
            <div
              key={f.name}
              className={cn(
                "flex items-center gap-2 rounded-md px-2 py-1.5",
                f.active ? "bg-primary/10 font-medium text-foreground" : "text-foreground/75"
              )}
            >
              {f.folder ? <Folder className="size-3.5 text-[#0071e3] dark:text-[#2997ff]" /> : <FileCode2 className="size-3.5 text-muted-foreground" />}
              {f.name}
            </div>
          ))}
        </aside>

        {/* Editor + bottom panels */}
        <div className="col-span-12 md:col-span-9">
          <div className="flex h-9 items-center gap-2 border-b border-border px-4 text-[12px]">
            <FileCode2 className="size-3.5 text-muted-foreground" />
            <span className="font-medium">server.js</span>
            <span className="ml-auto flex items-center gap-1 text-[11px] text-[#248a3d] dark:text-[#30d158]">
              <Check className="size-3" /> Saved
            </span>
          </div>
          <div className="space-y-0.5 px-2 py-4 font-mono leading-relaxed">
            <Line n={1}><span className={kw}>import</span> {"{ "}<span className={fn}>createServer</span>{" }"} <span className={kw}>from</span> <span className={str}>"node:http"</span>;</Line>
            <Line n={2} />
            <Line n={3}><span className={cmt}>// Live in the preview the moment you save.</span></Line>
            <Line n={4}><span className={fn}>createServer</span>((<span className={typ}>req</span>, <span className={typ}>res</span>) {"=> {"}</Line>
            <Line n={5}>{"  "}res.<span className={fn}>end</span>(<span className={str}>"Hello from Nimbus"</span>);</Line>
            <Line n={6}>{"}"}).<span className={fn}>listen</span>(<span className={num}>8080</span>);<span className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 animate-pulse bg-primary" /></Line>
          </div>
          <div className="grid grid-cols-5 border-t border-border">
            <div className="col-span-5 border-border p-4 font-mono text-[11px] leading-relaxed sm:col-span-3 sm:border-r sm:text-[12px]">
              <p className="mb-2 flex items-center gap-1.5 font-sans text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                <SquareTerminal className="size-3" /> Terminal
              </p>
              <p><span className="text-[#248a3d] dark:text-[#30d158]">~/workspace</span> $ npm install</p>
              <p className="text-muted-foreground">added 42 packages in 1.8s</p>
              <p><span className="text-[#248a3d] dark:text-[#30d158]">~/workspace</span> $ node server.js</p>
              <p className="text-muted-foreground">Listening on :8080</p>
            </div>
            <div className="col-span-2 hidden flex-col sm:flex">
              <div className="flex items-center gap-1.5 border-b border-border px-3 py-2 text-[10px] text-muted-foreground">
                <Globe className="size-3" /> :8080 <RotateCw className="ml-auto size-3" />
              </div>
              <div className="flex flex-1 items-center justify-center bg-white p-4 text-center text-[15px] font-semibold tracking-tight text-[#1d1d1f]">
                Hello from Nimbus
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MiniEditor() {
  return (
    <div className="rounded-xl border border-border bg-background p-4 font-mono text-[12px] leading-relaxed shadow-sm">
      <Line n={1}><span className={kw}>const</span> greet = (<span className={typ}>name</span>) {"=>"}</Line>
      <Line n={2}>{"  "}<span className={str}>`Hello, ${"{"}name{"}"}`</span>;</Line>
      <Line n={3} />
      <Line n={4}><span className={fn}>console</span>.<span className={fn}>log</span>(<span className={fn}>greet</span>(<span className={str}>"world"</span>));</Line>
    </div>
  );
}

export function MiniTerminal() {
  return (
    <div className="rounded-xl bg-[#1d1d1f] p-4 font-mono dark:bg-black dark:ring-1 dark:ring-white/12 text-[12px] leading-relaxed text-[#e8e8ed] shadow-sm">
      <p><span className="text-[#30d158]">$</span> python3 app.py</p>
      <p className="text-[#a1a1a6]">Serving on port 8000…</p>
      <p><span className="text-[#30d158]">$</span> git status</p>
      <p className="text-[#a1a1a6]">nothing to commit, working tree clean</p>
    </div>
  );
}

export function MiniPreview() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-background shadow-sm">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <TrafficLights />
        <span className="ml-2 text-[11px] text-muted-foreground">localhost:5173</span>
      </div>
      <div className="space-y-2 bg-white p-4">
        <div className="h-3 w-1/2 rounded-full bg-[#1d1d1f]" />
        <div className="h-2 w-5/6 rounded-full bg-[#d2d2d7]" />
        <div className="h-2 w-2/3 rounded-full bg-[#d2d2d7]" />
        <div className="mt-3 h-6 w-24 rounded-full bg-[#0071e3]" />
      </div>
    </div>
  );
}

export function MiniSync() {
  return (
    <div className="relative rounded-xl border border-border bg-background p-4 font-mono text-[12px] leading-relaxed shadow-sm">
      <p>
        <span className={kw}>function</span> <span className={fn}>render</span>() {"{"}
        <span className="relative ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 bg-[#ff9f0a]">
          <span className="absolute -top-5 left-0 whitespace-nowrap rounded bg-[#ff9f0a] px-1.5 py-0.5 font-sans text-[10px] font-semibold text-black">Tab 2</span>
        </span>
      </p>
      <p>{"  "}<span className={kw}>return</span> <span className={str}>"in sync"</span>;<span className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 animate-pulse bg-primary" /></p>
      <p>{"}"}</p>
    </div>
  );
}
