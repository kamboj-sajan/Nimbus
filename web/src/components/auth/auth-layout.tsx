import { useMemo, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import BrandLogo from "@/components/brand/brand-logo";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface AuthLayoutProps {
  badge: string;
  badgeIcon: LucideIcon;
  title: string;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}

function Particles() {
  // Positions are random but stable for the lifetime of the page.
  const dots = useMemo(
    () =>
      Array.from({ length: 14 }, () => ({
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 5}s`,
        animationDuration: `${3 + Math.random() * 4}s`,
      })),
    []
  );
  return (
    <div className="pointer-events-none fixed inset-0 z-0">
      {dots.map((style, i) => (
        <div key={i} className="absolute size-1 animate-float rounded-full bg-primary/25" style={style} />
      ))}
    </div>
  );
}

export default function AuthLayout({ badge, badgeIcon: BadgeIcon, title, description, children, footer }: AuthLayoutProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(120,119,198,0.12),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(236,72,153,0.08),transparent_50%)]" />
      </div>
      <Particles />

      <header className="relative z-10 p-6">
        <BrandLogo />
      </header>

      <main className="relative z-10 flex min-h-[calc(100vh-120px)] items-center justify-center p-4">
        <div className="w-full max-w-md animate-fade-in-up">
          <div className="mb-8 text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-gradient-to-r from-blue-500/10 to-purple-500/10 px-4 py-1.5 text-sm backdrop-blur-sm">
              <BadgeIcon className="size-4 text-sky-400" />
              <span className="bg-gradient-to-r from-sky-400 to-purple-400 bg-clip-text font-medium text-transparent">
                {badge}
              </span>
            </span>
          </div>

          <Card className="border-border/50 bg-card/60 shadow-2xl backdrop-blur-xl">
            <CardHeader className="space-y-2 text-center">
              <CardTitle className="text-2xl font-bold">{title}</CardTitle>
              {description && <CardDescription>{description}</CardDescription>}
            </CardHeader>
            <CardContent className="space-y-5">{children}</CardContent>
            {footer && <CardFooter className="justify-center text-sm text-muted-foreground">{footer}</CardFooter>}
          </Card>
        </div>
      </main>
    </div>
  );
}
