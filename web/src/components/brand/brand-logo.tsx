import { Link } from "react-router-dom";
import { APP_NAME } from "@/config/brand";
import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <div className={cn("relative size-9 shrink-0", className)}>
      <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-sky-400 via-indigo-500 to-purple-500 opacity-60 blur-md" />
      <div className="relative flex size-full items-center justify-center rounded-lg bg-gradient-to-br from-sky-400 via-indigo-500 to-purple-500 shadow-lg ring-1 ring-white/20">
        <svg
          viewBox="0 0 24 24"
          className="size-[62%]"
          fill="none"
          stroke="white"
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M7 18.5h9.5a4 4 0 0 0 .6-7.95A5.5 5.5 0 0 0 6.6 9.1 4.7 4.7 0 0 0 7 18.5Z" />
          <path d="m10 12.5-1.5 1.5 1.5 1.5M14 12.5l1.5 1.5-1.5 1.5" strokeWidth={1.8} />
        </svg>
      </div>
    </div>
  );
}

interface BrandLogoProps {
  to?: string;
  size?: "sm" | "md";
  className?: string;
}

export default function BrandLogo({ to = "/", size = "md", className }: BrandLogoProps) {
  return (
    <Link to={to} className={cn("flex w-fit items-center gap-2.5", className)}>
      <BrandMark className={size === "sm" ? "size-7" : "size-9"} />
      <span
        className={cn(
          "bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text font-bold tracking-tight text-transparent",
          size === "sm" ? "text-lg" : "text-xl"
        )}
      >
        {APP_NAME}
      </span>
    </Link>
  );
}
