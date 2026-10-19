import { Link } from "react-router-dom";
import { APP_NAME } from "@/config/brand";
import { cn } from "@/lib/utils";

/** App-icon style mark: a rounded square with the Nimbus cloud glyph. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-[28%] bg-gradient-to-b from-[#3a9bff] to-[#0062d6] shadow-[inset_0_1px_0_rgb(255_255_255/0.35),0_1px_2px_rgb(0_0_0/0.15)]",
        className
      )}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" className="size-[62%]" fill="none" stroke="white" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 18.5h9.5a4 4 0 0 0 .6-7.95A5.5 5.5 0 0 0 6.6 9.1 4.7 4.7 0 0 0 7 18.5Z" />
      </svg>
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
    <Link
      to={to}
      aria-label={`${APP_NAME} home`}
      className={cn("flex w-fit items-center gap-2 rounded-md text-foreground transition-opacity hover:opacity-80", className)}
    >
      <BrandMark className={size === "sm" ? "size-6" : "size-7"} />
      <span className={cn("font-semibold tracking-tight", size === "sm" ? "text-[15px]" : "text-[17px]")}>{APP_NAME}</span>
    </Link>
  );
}
