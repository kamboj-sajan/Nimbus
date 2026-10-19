import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PanelProps {
  title?: ReactNode;
  icon?: LucideIcon;
  actions?: ReactNode;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}

export default function Panel({ title, icon: Icon, actions, className, bodyClassName, children }: PanelProps) {
  return (
    <section
      className={cn(
        "flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border border-ide-border bg-ide-surface shadow-[0_1px_3px_rgb(0_0_0/0.06)] dark:shadow-none",
        className
      )}
    >
      {title && (
        <div className="flex h-9 shrink-0 items-center gap-2 border-b border-ide-border bg-ide-bar px-3">
          {Icon && <Icon className="size-3.5 shrink-0 text-link" />}
          <div className="min-w-0 flex-1 truncate text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {title}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-0.5">{actions}</div>}
        </div>
      )}
      <div className={cn("relative min-h-0 flex-1", bodyClassName)}>{children}</div>
    </section>
  );
}

export function PanelAction({
  icon: Icon,
  label,
  onClick,
  disabled,
  spinning,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  spinning?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className="rounded p-1 text-muted-foreground transition-colors hover:bg-ide-hover hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
    >
      <Icon className={cn("size-3.5", spinning && "animate-spin")} />
    </button>
  );
}
