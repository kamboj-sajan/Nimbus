import { useState, type ComponentProps } from "react";
import type { LucideIcon } from "lucide-react";
import { AlertCircle, Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { passwordStrength, strengthLabel } from "@/lib/validation";

type InputProps = ComponentProps<typeof Input>;

const fieldClass =
  "h-12 rounded-xl border-input bg-background text-[17px] shadow-none transition-colors duration-200 focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-ring/40 md:text-[17px]";

export function IconInput({ icon: Icon, className, ...props }: InputProps & { icon: LucideIcon }) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-muted-foreground" aria-hidden />
      <Input className={cn(fieldClass, "pl-11", className)} {...props} />
    </div>
  );
}

export function PasswordInput({ className, ...props }: InputProps) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Lock className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-muted-foreground" aria-hidden />
      <Input type={visible ? "text" : "password"} className={cn(fieldClass, "px-11", className)} {...props} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute right-1.5 top-1/2 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
        aria-label={visible ? "Hide password" : "Show password"}
      >
        {visible ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
      </button>
    </div>
  );
}

const STRENGTH_COLORS = [
  "bg-[#d70015] dark:bg-[#ff453a]",
  "bg-[#c93400] dark:bg-[#ff9f0a]",
  "bg-[#0071e3] dark:bg-[#2997ff]",
  "bg-[#248a3d] dark:bg-[#30d158]",
];

export function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const score = passwordStrength(password);
  const level = Math.max(1, score / 25);
  return (
    <div className="flex items-center gap-3 pt-1" aria-live="polite">
      <div className="flex flex-1 gap-1" aria-hidden>
        {[1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className={cn("h-1 flex-1 rounded-full transition-colors duration-300", i <= level ? STRENGTH_COLORS[level - 1] : "bg-secondary")}
          />
        ))}
      </div>
      <span className="w-14 text-right text-[13px] text-muted-foreground">{strengthLabel(score)}</span>
    </div>
  );
}

export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <div role="alert" className="flex items-start gap-2.5 rounded-xl bg-destructive/10 px-4 py-3 text-[15px] text-destructive">
      <AlertCircle className="mt-0.5 size-[18px] shrink-0" aria-hidden />
      <span>{message}</span>
    </div>
  );
}

export function SubmitButton({ loading, children, loadingText }: { loading: boolean; children: React.ReactNode; loadingText: string }) {
  return (
    <Button type="submit" disabled={loading} size="pill" className="group h-12 w-full text-[17px]">
      {loading ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
