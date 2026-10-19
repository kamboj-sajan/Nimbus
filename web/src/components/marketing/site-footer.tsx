import { Link } from "react-router-dom";
import { APP_NAME } from "@/config/brand";

const columns = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "/#features" },
      { label: "How it works", href: "/#how-it-works" },
      { label: "Open workspace", to: "/code" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Create account", to: "/register" },
      { label: "Sign in", to: "/sign-in" },
      { label: "Reset password", to: "/forgot-password" },
    ],
  },
  {
    title: "Company",
    links: [{ label: "About", to: "/about" }],
  },
];

export default function SiteFooter() {
  return (
    <footer className="bg-surface text-[12px] text-muted-foreground">
      <div className="mx-auto max-w-[1024px] px-4 py-10 sm:px-6">
        <p className="border-b border-border pb-4 leading-relaxed">
          {APP_NAME} runs every workspace in its own isolated container. Files are saved to cloud storage automatically.
        </p>
        <div className="grid grid-cols-2 gap-8 py-8 sm:grid-cols-3">
          {columns.map((column) => (
            <div key={column.title}>
              <h3 className="mb-3 font-semibold text-foreground">{column.title}</h3>
              <ul className="space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    {"to" in link && link.to ? (
                      <Link to={link.to} className="transition-colors hover:text-foreground hover:underline">
                        {link.label}
                      </Link>
                    ) : (
                      <a href={(link as { href: string }).href} className="transition-colors hover:text-foreground hover:underline">
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="border-t border-border pt-4">Copyright © {new Date().getFullYear()} {APP_NAME}. All rights reserved.</p>
      </div>
    </footer>
  );
}
