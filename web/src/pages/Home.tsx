import {
  ArrowRight,
  Boxes,
  ChevronRight,
  Cloud,
  Code2,
  Eye,
  FolderTree,
  KeyRound,
  Play,
  Settings,
  Shield,
  Terminal,
  Users,
  X,
  Zap,
  Database,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import SiteFooter from "@/components/marketing/site-footer";
import SiteHeader from "@/components/marketing/site-header";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/config/brand";

const features = [
  { icon: Code2, title: "Multi-language editing", description: "Monaco — the editor behind VS Code — with highlighting for 50+ languages.", gradient: "from-blue-500 to-cyan-500" },
  { icon: Users, title: "Real-time sync", description: "Edits stream over WebSockets to every open tab and straight into your runtime.", gradient: "from-purple-500 to-pink-500" },
  { icon: FolderTree, title: "Full file explorer", description: "Create, rename, move and delete files and folders like a local IDE.", gradient: "from-green-500 to-emerald-500" },
  { icon: Terminal, title: "Built-in terminal", description: "A real shell in your workspace. Install packages, run builds, start servers.", gradient: "from-orange-500 to-red-500" },
  { icon: Eye, title: "Live preview", description: "Open any port your app listens on in the preview panel — securely proxied.", gradient: "from-indigo-500 to-blue-500" },
  { icon: Boxes, title: "Isolated runtimes", description: "Every user gets their own container on Kubernetes, created on demand.", gradient: "from-yellow-500 to-orange-500" },
  { icon: Database, title: "Persistent storage", description: "Files are saved to cloud storage automatically — including ones made in the terminal.", gradient: "from-teal-500 to-green-500" },
  { icon: Shield, title: "Secure by default", description: "JWT auth on every request, per-user routing checks, scoped tokens for runtimes.", gradient: "from-rose-500 to-pink-500" },
];

const steps = [
  { icon: KeyRound, title: "Sign in", body: "Create an account — your workspace is seeded with a starter project." },
  { icon: Cloud, title: "Runtime spins up", body: "The orchestrator launches your container and hydrates it with your files." },
  { icon: Code2, title: "Edit & run", body: "Code in the editor, run it in the terminal, see it in the preview." },
  { icon: Database, title: "Everything persists", body: "Autosave and the file watcher keep cloud storage in sync, always." },
];

function HeroMockup() {
  const lines = useMemo(
    () => ["$ npm install", "added 42 packages in 2s", "$ npm run dev", "✨ Server running on port 8080", "🚀 Preview ready!"],
    []
  );
  const [text, setText] = useState("");

  useEffect(() => {
    let line = 0;
    let char = 0;
    let output = "";
    const timer = setInterval(() => {
      if (line >= lines.length) {
        clearInterval(timer);
        return;
      }
      const current = lines[line]!;
      if (char <= current.length) {
        setText(output + current.slice(0, char));
        char++;
      } else {
        output += current + "\n";
        line++;
        char = 0;
      }
    }, 45);
    return () => clearInterval(timer);
  }, [lines]);

  return (
    <div className="relative animate-fade-in-up [animation-delay:150ms]">
      <div className="absolute -inset-px rounded-xl bg-gradient-to-br from-sky-400/40 via-purple-500/30 to-pink-500/40 opacity-50 blur-2xl" />
      <div className="relative overflow-hidden rounded-xl border border-white/10 bg-card/70 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-border/50 p-4">
          <div className="flex gap-2">
            <div className="size-3 rounded-full bg-red-500" />
            <div className="size-3 rounded-full bg-yellow-500" />
            <div className="size-3 rounded-full bg-green-500" />
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="size-2 rounded-full bg-emerald-400" />
            Workspace running
          </div>
        </div>
        <div className="space-y-2 p-4 font-mono text-sm">
          <div><span className="mr-3 text-muted-foreground">1</span><span className="text-purple-400">const</span> http = <span className="text-yellow-400">require</span>(<span className="text-green-400">"http"</span>);</div>
          <div><span className="mr-3 text-muted-foreground">2</span></div>
          <div><span className="mr-3 text-muted-foreground">3</span>http.<span className="text-yellow-400">createServer</span>((req, res) =&gt; {"{"}</div>
          <div className="pl-4"><span className="mr-3 -ml-4 text-muted-foreground">4</span>res.<span className="text-yellow-400">end</span>(<span className="text-green-400">"Hello from {APP_NAME}"</span>);</div>
          <div className="flex items-center"><span className="mr-3 text-muted-foreground">5</span>{"}"}).<span className="text-yellow-400">listen</span>(<span className="text-orange-400">8080</span>);<span className="ml-1 inline-block h-5 w-0.5 animate-pulse bg-primary" /></div>
        </div>
        <div className="border-t border-border/50 bg-card/30">
          <div className="flex items-center gap-2 border-b border-border/30 p-2 text-sm font-medium">
            <Terminal className="size-4" /> Terminal
          </div>
          <pre className="h-32 overflow-hidden whitespace-pre-wrap p-3 font-mono text-sm text-emerald-400">{text}</pre>
        </div>
      </div>
      <div className="absolute -right-4 -top-4 animate-bounce rounded-full bg-gradient-to-r from-green-500 to-emerald-500 px-3 py-1 text-sm font-medium text-white">
        Live preview
      </div>
      <div className="absolute -bottom-4 -left-4 animate-pulse rounded-full bg-gradient-to-r from-blue-500 to-purple-500 px-3 py-1 text-sm font-medium text-white">
        Real-time sync
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen overflow-hidden bg-background text-foreground">
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(120,119,198,0.12),transparent_55%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,oklch(1_0_0/4%)_1px,transparent_1px),linear-gradient(to_bottom,oklch(1_0_0/4%)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_at_top,black_20%,transparent_70%)]" />
      </div>

      <SiteHeader />

      <section className="relative z-10 px-4 pb-20 pt-32">
        <div className="container mx-auto grid items-center gap-12 lg:grid-cols-2">
          <div className="animate-fade-in-up space-y-8">
            <div className="inline-flex items-center rounded-full border border-blue-500/20 bg-gradient-to-r from-blue-500/10 to-purple-500/10 px-4 py-2 text-sm font-medium backdrop-blur-sm">
              <Zap className="mr-2 size-4 text-sky-400" />
              <span className="bg-gradient-to-r from-sky-400 to-purple-400 bg-clip-text text-transparent">
                Your dev environment, in the cloud
              </span>
            </div>
            <h1 className="text-5xl font-extrabold leading-[1.05] tracking-tight md:text-7xl">
              <span className="bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">Code anywhere,</span>
              <br />
              <span className="animate-gradient-pan bg-gradient-to-r from-sky-400 via-purple-500 to-pink-500 bg-[length:200%_auto] bg-clip-text text-transparent">
                ship faster
              </span>
            </h1>
            <p className="max-w-2xl text-xl leading-relaxed text-muted-foreground">
              {APP_NAME} is a browser-based IDE with a real terminal, live preview and real-time sync — each running in
              your own isolated container. No installs, no "works on my machine".
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Button asChild size="lg" className="group bg-gradient-to-r from-blue-500 to-purple-500 px-8 text-lg text-white shadow-lg hover:from-blue-600 hover:to-purple-600">
                <Link to="/code">
                  Start coding now
                  <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="px-8 text-lg">
                <a href="#how-it-works">
                  <Play className="size-5" /> How it works
                </a>
              </Button>
            </div>
          </div>
          <HeroMockup />
        </div>
      </section>

      <section className="relative z-10 py-20">
        <div className="container mx-auto max-w-4xl px-4 text-center">
          <h2 className="mb-6 text-4xl font-bold md:text-5xl">
            <span className="bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              Setting up local environments is a pain
            </span>
          </h2>
          <p className="mb-12 text-xl leading-relaxed text-muted-foreground">
            Different OSes, broken dependencies, version mismatches and no easy way to share. Hours lost to setup instead of code.
          </p>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { icon: Settings, title: "Complex setup", desc: "Hours spent configuring toolchains instead of building" },
              { icon: X, title: "No sharing", desc: "Code passed around as screenshots and zip files" },
              { icon: Database, title: "Version conflicts", desc: "\"It works on my machine\" — but nowhere else" },
            ].map((item) => (
              <div key={item.title} className="group rounded-xl border border-border/50 bg-card/50 p-6 text-left backdrop-blur-xl transition-transform duration-300 hover:-translate-y-1">
                <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-gradient-to-r from-red-500/20 to-orange-500/20">
                  <item.icon className="size-6 text-red-400" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{item.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="relative z-10 scroll-mt-20 py-20">
        <div className="container mx-auto px-4">
          <div className="mb-16 text-center">
            <h2 className="mb-6 text-4xl font-bold md:text-5xl">
              <span className="bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">Everything you need to code</span>
            </h2>
            <p className="mx-auto max-w-2xl text-xl text-muted-foreground">A complete development environment that lives in a browser tab.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div key={feature.title} className="group relative overflow-hidden rounded-xl bg-card/50 p-6 shadow-lg backdrop-blur-xl transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl">
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 transition-opacity duration-500 group-hover:opacity-10`} />
                <div className={`relative mb-4 flex size-12 items-center justify-center rounded-lg bg-gradient-to-r ${feature.gradient} shadow-lg transition-transform duration-300 group-hover:scale-110`}>
                  <feature.icon className="size-6 text-white" />
                </div>
                <h3 className="relative mb-2 text-lg font-semibold transition-colors group-hover:text-primary">{feature.title}</h3>
                <p className="relative text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
                <ChevronRight className="absolute bottom-4 right-4 size-5 translate-x-2 text-primary opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="relative z-10 scroll-mt-20 py-20">
        <div className="container mx-auto px-4">
          <h2 className="mb-14 text-center text-4xl font-bold md:text-5xl">
            <span className="bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">How it works</span>
          </h2>
          <ol className="grid gap-6 md:grid-cols-4">
            {steps.map((step, i) => (
              <li key={step.title} className="relative rounded-xl border border-border/50 bg-card/40 p-6 backdrop-blur-xl">
                <span className="absolute right-5 top-4 font-mono text-4xl font-bold text-white/5">{i + 1}</span>
                <step.icon className="mb-4 size-7 text-primary" />
                <h3 className="mb-2 font-semibold">{step.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="relative z-10 py-20">
        <div className="container mx-auto px-4">
          <div className="relative overflow-hidden rounded-3xl border border-border/50 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 p-12 text-center backdrop-blur-xl">
            <h2 className="mb-6 text-4xl font-bold md:text-5xl">
              <span className="bg-gradient-to-r from-sky-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">Ready to code in the cloud?</span>
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-xl text-muted-foreground">Create an account and get a running workspace in seconds.</p>
            <Button asChild size="lg" className="group bg-gradient-to-r from-blue-500 to-purple-500 px-8 text-lg text-white shadow-lg hover:from-blue-600 hover:to-purple-600">
              <Link to="/register">
                Create your workspace
                <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
