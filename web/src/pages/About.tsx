import { Boxes, SquareTerminal, Users } from "lucide-react";
import { Link } from "react-router-dom";
import Reveal from "@/components/marketing/reveal";
import SiteFooter from "@/components/marketing/site-footer";
import SiteHeader from "@/components/marketing/site-header";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/config/brand";

const pillars = [
  { icon: Users, title: "Real-time sync", description: "Every keystroke streams to your other tabs and your runtime, so what you see is what runs." },
  { icon: SquareTerminal, title: "A real terminal", description: "Run installs, builds and servers in a full shell — right next to your code." },
  { icon: Boxes, title: "Isolated runtimes", description: "Each workspace gets its own container on Kubernetes. No local setup required." },
];

const stack = [
  ["Client", "React 19, Vite, Monaco, xterm.js, TanStack Query, Tailwind CSS"],
  ["API", "Express 5, Socket.IO, Drizzle ORM and PostgreSQL, JWT"],
  ["Storage", "Azure Blob Storage, or local disk in development"],
  ["Runtime", "node-pty shell and a file watcher, in a per-user container"],
  ["Orchestrator", "Kubernetes client with an HTTP and WebSocket reverse proxy"],
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main>
        <section className="px-4 pb-20 pt-32 text-center sm:px-6 sm:pt-40">
          <p className="animate-fade-in-up text-[17px] font-semibold text-muted-foreground sm:text-[21px]">About {APP_NAME}</p>
          <h1 className="headline-hero mx-auto mt-3 max-w-4xl animate-fade-in-up [animation-delay:80ms]">
            Development,
            <br />
            <span className="text-gradient">without the setup.</span>
          </h1>
          <p className="lede mx-auto mt-6 max-w-2xl animate-fade-in-up text-muted-foreground [animation-delay:160ms]">
            {APP_NAME} is a browser-based IDE where you write, run and preview code — without installing anything.
          </p>
        </section>

        <section className="bg-surface px-4 py-24 sm:px-6">
          <div className="mx-auto grid max-w-[1024px] gap-5 md:grid-cols-3">
            {pillars.map((pillar, i) => (
              <Reveal key={pillar.title} delay={i * 80} className="rounded-[28px] bg-card p-8">
                <pillar.icon className="mb-6 size-8 text-link" aria-hidden />
                <h2 className="text-[21px] font-semibold tracking-tight">{pillar.title}</h2>
                <p className="mt-2 text-[17px] leading-relaxed text-muted-foreground">{pillar.description}</p>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="px-4 py-24 sm:px-6">
          <div className="mx-auto max-w-[820px]">
            <Reveal>
              <h2 className="headline-section text-center">Under the hood.</h2>
            </Reveal>
            <Reveal delay={100}>
              <dl className="mt-12 divide-y divide-border border-y border-border">
                {stack.map(([layer, tech]) => (
                  <div key={layer} className="grid gap-1 py-5 sm:grid-cols-[11rem_1fr]">
                    <dt className="text-[17px] font-semibold">{layer}</dt>
                    <dd className="text-[17px] text-muted-foreground">{tech}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
            <Reveal delay={150} className="mt-14 text-center">
              <Button asChild size="pill" className="px-7 text-[17px]">
                <Link to="/code">Open the editor</Link>
              </Button>
            </Reveal>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
