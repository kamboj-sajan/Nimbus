import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import BrandLogo from "@/components/brand/brand-logo";
import ThemeToggle from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/session";

const links = [
  { href: "/#features", label: "Features" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/about", label: "About" },
];

/** Apple-style global nav: thin, translucent, blurred. */
export default function SiteHeader() {
  const session = useSession();
  const [open, setOpen] = useState(false);

  const cta = session ? (
    <Button asChild size="pill-sm">
      <Link to="/code">Open workspace</Link>
    </Button>
  ) : (
    <>
      <Link to="/sign-in" className="rounded-md px-1 text-[13px] text-foreground/80 transition-colors duration-200 hover:text-foreground">
        Sign in
      </Link>
      <Button asChild size="pill-sm">
        <Link to="/register">Get started</Link>
      </Button>
    </>
  );

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border bg-nav backdrop-blur-xl backdrop-saturate-[1.8]">
      <div className="mx-auto flex h-12 max-w-[1024px] items-center justify-between px-4 sm:px-6">
        <BrandLogo size="sm" />
        <nav className="hidden items-center gap-8 md:flex" aria-label="Main">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-md text-[13px] text-foreground/80 transition-colors duration-200 hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />
          {cta}
        </div>
        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle />
          <button
            type="button"
            className="inline-flex size-11 items-center justify-center rounded-full hover:bg-foreground/5"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="mx-auto flex max-w-[1024px] flex-col gap-1 px-4 pb-6 pt-2 md:hidden" aria-label="Mobile">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-2 py-3 text-2xl font-semibold tracking-tight hover:bg-foreground/5"
            >
              {link.label}
            </a>
          ))}
          <div className="mt-4 flex items-center gap-4 px-2">{cta}</div>
        </nav>
      )}
    </header>
  );
}
