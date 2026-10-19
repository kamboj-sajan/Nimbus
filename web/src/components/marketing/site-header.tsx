import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import BrandLogo from "@/components/brand/brand-logo";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/session";
import { cn } from "@/lib/utils";

const links = [
  { href: "/#features", label: "Features" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/about", label: "About" },
];

export default function SiteHeader() {
  const session = useSession();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const actions = session ? (
    <Button asChild className="bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600">
      <Link to="/code">Open workspace</Link>
    </Button>
  ) : (
    <>
      <Button asChild variant="outline">
        <Link to="/sign-in">Sign in</Link>
      </Button>
      <Button asChild className="bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg hover:from-blue-600 hover:to-purple-600">
        <Link to="/register">Get started</Link>
      </Button>
    </>
  );

  return (
    <header
      className={cn(
        "fixed top-0 z-50 w-full transition-all duration-300",
        scrolled || open ? "border-b border-border/50 bg-background/80 backdrop-blur-xl" : "bg-transparent"
      )}
    >
      <div className="container mx-auto flex items-center justify-between px-4 py-4">
        <BrandLogo />
        <nav className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              {link.label}
            </a>
          ))}
          <div className="flex items-center gap-2">{actions}</div>
        </nav>
        <button className="md:hidden" onClick={() => setOpen((v) => !v)} aria-label="Toggle menu">
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>
      {open && (
        <nav className="container mx-auto flex flex-col gap-4 px-4 pb-6 md:hidden">
          {links.map((link) => (
            <a key={link.href} href={link.href} onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
              {link.label}
            </a>
          ))}
          <div className="flex flex-col gap-2">{actions}</div>
        </nav>
      )}
    </header>
  );
}
