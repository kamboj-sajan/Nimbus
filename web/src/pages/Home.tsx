import {
  ArrowRight,
  Boxes,
  ChevronRight,
  CloudUpload,
  Eye,
  ShieldCheck,
  SquareTerminal,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import Reveal from "@/components/marketing/reveal";
import SiteFooter from "@/components/marketing/site-footer";
import SiteHeader from "@/components/marketing/site-header";
import { MiniEditor, MiniPreview, MiniSync, MiniTerminal, ProductShot } from "@/components/marketing/visuals";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/config/brand";
import { cn } from "@/lib/utils";

function TextLink({ to, href, children }: { to?: string; href?: string; children: ReactNode }) {
  const className =
    "group inline-flex items-center gap-0.5 rounded-md text-[17px] text-link transition-colors hover:underline underline-offset-4";
  const content = (
    <>
      {children}
      <ChevronRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
    </>
  );
  return to ? <Link to={to} className={className}>{content}</Link> : <a href={href} className={className}>{content}</a>;
}

function Tile({
  eyebrow,
  title,
  body,
  icon: Icon,
  visual,
  className,
  delay,
}: {
  eyebrow: string;
  title: ReactNode;
  body: string;
  icon: typeof Eye;
  visual?: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <Reveal
      delay={delay}
      className={cn(
        "flex flex-col justify-between gap-8 overflow-hidden rounded-[28px] bg-card p-8 transition-transform duration-300 hover:scale-[1.01] sm:p-10",
        className
      )}
    >
      <div>
        <p className="mb-3 flex items-center gap-2 text-[14px] font-semibold text-link">
          <Icon className="size-4" aria-hidden /> {eyebrow}
        </p>
        <h3 className="headline-card">{title}</h3>
        <p className="mt-3 max-w-md text-[17px] leading-relaxed text-muted-foreground">{body}</p>
      </div>
      {visual}
    </Reveal>
  );
}

const chapters = [
  {
    word: "Write.",
    title: "An editor you already know.",
    body: "Monaco — the engine behind VS Code — with syntax highlighting for more than 50 languages, multi-cursor editing and autosave a second after you stop typing.",
    visual: <MiniEditor />,
  },
  {
    word: "Run.",
    title: "A real terminal. Not a toy.",
    body: "Every workspace runs in its own Linux container with Node.js, Python and git. Install packages, run tests, start servers — anything your terminal can do.",
    visual: <MiniTerminal />,
  },
  {
    word: "Preview.",
    title: "See it the moment you save.",
    body: "Start a server on any port and open it right inside the IDE, securely proxied to your workspace and visible only to you.",
    visual: <MiniPreview />,
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <main>
        {/* Hero */}
        <section className="overflow-hidden px-4 pb-20 pt-32 text-center sm:px-6 sm:pt-40">
          <p className="animate-fade-in-up text-[17px] font-semibold text-muted-foreground sm:text-[21px]">{APP_NAME}</p>
          <h1 className="headline-hero mx-auto mt-3 max-w-4xl animate-fade-in-up [animation-delay:80ms]">
            Code anywhere.
            <br />
            <span className="text-gradient">Run everything.</span>
          </h1>
          <p className="lede mx-auto mt-6 max-w-2xl animate-fade-in-up text-muted-foreground [animation-delay:160ms]">
            A complete development environment in your browser. Editor, terminal and live preview — each running
            in its own cloud container.
          </p>
          <div className="mt-10 flex animate-fade-in-up flex-col items-center justify-center gap-5 [animation-delay:240ms] sm:flex-row sm:gap-8">
            <Button asChild size="pill" className="px-7 text-[17px]">
              <Link to="/register">Start coding for free</Link>
            </Button>
            <TextLink href="#how-it-works">See how it works</TextLink>
          </div>

          <Reveal className="mx-auto mt-16 max-w-5xl sm:mt-20" delay={150}>
            <ProductShot />
          </Reveal>
        </section>

        {/* Statement */}
        <section className="bg-surface px-4 py-24 text-center sm:px-6 sm:py-32">
          <Reveal>
            <h2 className="headline-section mx-auto max-w-3xl">
              No installs. No setup.
              <br />
              <span className="text-muted-foreground">No “works on my machine.”</span>
            </h2>
          </Reveal>
          <Reveal delay={120}>
            <p className="lede mx-auto mt-6 max-w-2xl text-muted-foreground">
              Open a tab and you have a running Linux environment with your files already in it. Close it and
              everything is saved.
            </p>
          </Reveal>
        </section>

        {/* Features bento */}
        <section id="features" className="scroll-mt-12 bg-surface px-4 pb-24 sm:px-6 sm:pb-32">
          <div className="mx-auto max-w-[1024px]">
            <Reveal className="mb-12 text-center">
              <h2 className="headline-section">Everything you need.</h2>
              <p className="lede mt-3 text-muted-foreground">Nothing you don’t.</p>
            </Reveal>
            <div className="grid gap-5 md:grid-cols-3">
              <Tile
                className="md:col-span-2"
                eyebrow="Editor"
                icon={SquareTerminal}
                title="Feels like your desktop IDE."
                body="Syntax highlighting, bracket matching, sticky scroll and ⌘S — with every change saved to the cloud."
                visual={<MiniEditor />}
              />
              <Tile
                delay={80}
                eyebrow="Real-time sync"
                icon={Users}
                title="Every tab, in step."
                body="Edits stream instantly to your other tabs and straight into your running workspace."
                visual={<MiniSync />}
              />
              <Tile
                eyebrow="Live preview"
                icon={Eye}
                title="Ship, then see."
                body="Open any port from your container in the built-in browser."
                visual={<MiniPreview />}
              />
              <Tile
                delay={80}
                className="md:col-span-2"
                eyebrow="Isolated runtimes"
                icon={Boxes}
                title="Your own container. On demand."
                body="Each workspace is a dedicated Kubernetes pod, created when you sign in and loaded with your files in seconds."
                visual={<MiniTerminal />}
              />
              <Tile
                eyebrow="Always saved"
                icon={CloudUpload}
                title="Cloud storage, automatically."
                body="Files you create in the editor or the terminal are persisted the moment they change."
              />
              <Tile
                delay={80}
                className="md:col-span-2"
                eyebrow="Private by design"
                icon={ShieldCheck}
                title="Only you can reach your workspace."
                body="Every request and WebSocket is checked against your session. Workspaces never see storage credentials, and network policies keep them apart."
              />
            </div>
          </div>
        </section>

        {/* Chapters */}
        <section id="how-it-works" className="scroll-mt-12 px-4 py-24 sm:px-6 sm:py-32">
          <div className="mx-auto max-w-[1024px] space-y-28 sm:space-y-36">
            {chapters.map((chapter, i) => (
              <div
                key={chapter.word}
                className={cn("grid items-center gap-10 md:grid-cols-2 md:gap-16", i % 2 === 1 && "md:[&>*:first-child]:order-2")}
              >
                <Reveal>
                  <p className="text-gradient text-[clamp(3rem,8vw,5.5rem)] font-bold leading-none tracking-[-0.04em]">
                    {chapter.word}
                  </p>
                  <h3 className="headline-card mt-6">{chapter.title}</h3>
                  <p className="mt-4 text-[17px] leading-relaxed text-muted-foreground">{chapter.body}</p>
                </Reveal>
                <Reveal delay={120}>
                  <div className="rounded-[28px] bg-surface p-6 sm:p-10">{chapter.visual}</div>
                </Reveal>
              </div>
            ))}
          </div>
        </section>

        {/* Closing CTA */}
        <section className="bg-surface px-4 py-28 text-center sm:px-6 sm:py-36">
          <Reveal>
            <h2 className="headline-section mx-auto max-w-3xl">
              Your next project
              <br />
              starts in seconds.
            </h2>
          </Reveal>
          <Reveal delay={120}>
            <p className="lede mx-auto mt-5 max-w-xl text-muted-foreground">
              Create an account and get a running workspace with a starter project.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-5 sm:flex-row sm:gap-8">
              <Button asChild size="pill" className="px-7 text-[17px]">
                <Link to="/register">
                  Create your workspace <ArrowRight className="size-4" />
                </Link>
              </Button>
              <TextLink to="/sign-in">Sign in</TextLink>
            </div>
          </Reveal>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
