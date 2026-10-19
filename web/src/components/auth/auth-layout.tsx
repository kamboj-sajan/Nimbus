import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import BrandLogo, { BrandMark } from "@/components/brand/brand-logo";
import ThemeToggle from "@/components/theme-toggle";

interface AuthLayoutProps {
  /** Small eyebrow above the title. */
  badge: string;
  badgeIcon?: LucideIcon;
  title: string;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}

/** Apple-account style: one calm centered column, no chrome competing with the form. */
export default function AuthLayout({ badge, title, description, children, footer }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex h-12 max-w-[1024px] items-center justify-between px-4 sm:px-6">
          <BrandLogo size="sm" />
          <ThemeToggle />
        </div>
      </header>

      <main className="flex flex-1 items-start justify-center px-4 pb-16 pt-14 sm:pt-20">
        <div className="w-full max-w-[420px] animate-fade-in-up">
          <div className="mb-10 text-center">
            <BrandMark className="mx-auto mb-6 size-14 rounded-[26%]" />
            <p className="mb-2 text-[15px] font-semibold text-muted-foreground">{badge}</p>
            <h1 className="text-[32px] font-bold leading-tight tracking-[-0.025em] sm:text-[40px]">{title}</h1>
            {description && <p className="mt-3 text-[17px] leading-relaxed text-muted-foreground">{description}</p>}
          </div>
          <div className="space-y-5">{children}</div>
          {footer && <div className="mt-10 border-t border-border pt-6 text-center text-[15px] text-muted-foreground">{footer}</div>}
        </div>
      </main>
    </div>
  );
}
