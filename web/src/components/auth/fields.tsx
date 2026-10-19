import { useState, type ComponentProps } from "react";
import type { LucideIcon } from "lucide-react";
import { AlertCircle, Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { passwordStrength, strengthLabel } from "@/lib/validation";

type InputProps = ComponentProps<typeof Input>;

export function IconInput({ icon: Icon, className, ...props }: InputProps & { icon: LucideIcon }) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input className={cn("bg-background/50 pl-10", className)} {...props} />
    </div>
  );
}

export function PasswordInput({ className, ...props }: InputProps) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input type={visible ? "text" : "password"} className={cn("bg-background/50 px-10", className)} {...props} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
        aria-label={visible ? "Hide password" : "Show password"}
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

export function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const score = passwordStrength(password);
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">Password strength</span>
        <span
          className={cn(
            "font-medium",
            score <= 25 && "text-red-400",
            score === 50 && "text-yellow-400",
            score === 75 && "text-sky-400",
            score === 100 && "text-emerald-400"
          )}
        >
          {strengthLabel(score)}
        </span>
      </div>
      <Progress value={score} className="h-1.5" />
    </div>
  );
}

export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <Alert className="border-destructive/50 bg-destructive/10">
      <AlertCircle className="size-4 text-destructive" />
      <AlertDescription className="text-destructive">{message}</AlertDescription>
    </Alert>
  );
}

export function SubmitButton({ loading, children, loadingText }: { loading: boolean; children: React.ReactNode; loadingText: string }) {
  return (
    <Button
      type="submit"
      disabled={loading}
      className="group w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg transition-all duration-300 hover:from-blue-600 hover:to-purple-600 hover:shadow-xl"
    >
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
