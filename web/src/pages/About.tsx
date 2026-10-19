import { ArrowRight, Boxes, SquareTerminal, Users } from "lucide-react";
import { Link } from "react-router-dom";
import SiteFooter from "@/components/marketing/site-footer";
import SiteHeader from "@/components/marketing/site-header";
import { Button } from "@/components/ui/button";
import { APP_NAME, APP_TAGLINE } from "@/config/brand";

const pillars = [
  { icon: Users, title: "Real-time sync", description: "Every keystroke streams to your other tabs and your runtime, so what you see is what runs." },
  { icon: SquareTerminal, title: "A real terminal", description: "Run installs, builds and servers in a full shell — right next to your code." },
  { icon: Boxes, title: "Isolated runtimes", description: "Each workspace gets its own container on Kubernetes. No local setup required." },
];

const stack = [
  ["Client", "React 19, Vite, Monaco, xterm.js, TanStack Query, Tailwind"],
  ["API", "Express 5, Socket.IO, Drizzle ORM + PostgreSQL, JWT"],
  ["Storage", "Azure Blob Storage (or local disk in development)"],
  ["Runtime", "node-pty shell, chokidar file watcher, per-user container"],
  ["Orchestrator", "Kubernetes client, HTTP + WebSocket reverse proxy"],
];

export default function AboutPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(120,119,198,0.18),transparent_60%)]" />
      <SiteHeader />

      <main className="relative z-10 mx-auto max-w-4xl px-4 pb-24 pt-36 text-center">
        <h1 className="animate-fade-in-up text-4xl font-extrabold tracking-tight md:text-6xl">
          About{" "}
          <span className="bg-gradient-to-r from-sky-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">{APP_NAME}</span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl animate-fade-in-up text-lg text-muted-foreground [animation-delay:100ms]">
          {APP_TAGLINE}. {APP_NAME} is a browser-based IDE where you can write, run and preview code — without installing
          anything.
        </p>

        <div className="mt-14 grid gap-5 text-left md:grid-cols-3">
          {pillars.map((pillar, i) => (
            <div
              key={pillar.title}
              className="animate-fade-in-up rounded-xl border border-border/60 bg-card/50 p-6 backdrop-blur-xl transition-transform duration-300 hover:-translate-y-1"
              style={{ animationDelay: `${200 + i * 100}ms` }}
            >
              <div className="mb-4 flex size-11 items-center justify-center rounded-lg bg-gradient-to-br from-sky-400/20 to-purple-500/20">
                <pillar.icon className="size-5 text-primary" />
              </div>
              <h3 className="mb-1.5 font-semibold">{pillar.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{pillar.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-14 overflow-hidden rounded-xl border border-border/60 bg-card/40 text-left backdrop-blur-xl">
          <h2 className="border-b border-border/60 px-6 py-4 font-semibold">Under the hood</h2>
          <dl className="divide-y divide-border/60">
            {stack.map(([layer, tech]) => (
              <div key={layer} className="grid gap-1 px-6 py-3 sm:grid-cols-[10rem_1fr]">
                <dt className="text-sm font-medium text-primary">{layer}</dt>
                <dd className="text-sm text-muted-foreground">{tech}</dd>
              </div>
            ))}
          </dl>
        </div>

        <Button asChild size="lg" className="group mt-14 bg-gradient-to-r from-blue-500 to-purple-500 px-8 text-white shadow-lg hover:from-blue-600 hover:to-purple-600">
          <Link to="/code">
            Open the editor
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
      </main>
      <SiteFooter />
    </div>
  );
}
