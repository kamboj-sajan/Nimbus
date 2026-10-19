import { Link } from "react-router-dom";
import BrandLogo from "@/components/brand/brand-logo";
import { APP_NAME, APP_TAGLINE } from "@/config/brand";

export default function SiteFooter() {
  return (
    <footer className="relative z-10 border-t border-border/50 py-10">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 md:flex-row">
        <div className="flex flex-col items-center gap-2 md:items-start">
          <BrandLogo />
          <p className="text-sm text-muted-foreground">{APP_TAGLINE}.</p>
        </div>
        <nav className="flex gap-6 text-sm text-muted-foreground">
          <Link to="/about" className="hover:text-foreground">About</Link>
          <Link to="/sign-in" className="hover:text-foreground">Sign in</Link>
          <Link to="/register" className="hover:text-foreground">Create account</Link>
        </nav>
        <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} {APP_NAME}</p>
      </div>
    </footer>
  );
}
